const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

/**
 * Enhanced structure validator for handling edge cases
 */
class StructureValidator {
  
  /**
   * Validate and potentially adjust structure based on project context
   */
  static validateAndAdjustStructure(parsedTree, projectInfo, targetDir) {
    const context = {
      projectType: projectInfo.type || projectInfo,
      isNested: projectInfo.isNested || false,
      basePath: projectInfo.basePath || targetDir,
      framework: projectInfo.framework
    };
    
    // Remove duplicates and conflicts
    const cleaned = this.removeDuplicateStructure(parsedTree, context);
    
    // Adjust paths for existing project structure
    const adjusted = this.adjustForExistingStructure(cleaned, context);
    
    // Validate against project type
    const validated = this.validateAgainstProjectType(adjusted, context);
    
    return validated;
  }
  
  /**
   * Remove duplicate folders that already exist in project
   */
  static removeDuplicateStructure(tree, context) {
    const { basePath } = context;
    
    return tree.map(node => {
      // Handle folders that might need merging
      if (node.type === "folder") {
        const existingPath = path.join(basePath, node.name);
        
        // If folder exists and has significant content, merge children
        if (fs.existsSync(existingPath)) {
          const hasContent = this.folderHasSignificantContent(existingPath);
          if (hasContent) {
            console.log(chalk.blue(`📁 Merging into existing folder: ${node.name}`));
            // Recursively clean children for merging
            if (node.children && node.children.length > 0) {
              node.children = this.removeDuplicateStructure(node.children, {
                ...context,
                basePath: existingPath
              });
            }
            return node;
          }
        }
      }
      
      return node;
    }).filter(node => {
      // Filter out conflicting files
      const targetPath = path.join(basePath, node.name);
      
      // Always allow folders (they'll be merged)
      if (node.type === "folder") return true;
      
      // For files, check if they're critical and already exist
      if (fs.existsSync(targetPath)) {
        const isCritical = this.isCriticalFile(node.name, context);
        if (isCritical) {
          console.log(chalk.yellow(`🔒 Skipping critical file: ${node.name}`));
          return false;
        }
        
        // Check if existing file has content
        const hasContent = this.fileHasContent(targetPath);
        if (hasContent) {
          console.log(chalk.blue(`📄 Preserving existing file: ${node.name}`));
          return false; // Don't overwrite files with content
        }
      }
      
      return true;
    });
  }
  
  /**
   * Adjust structure based on existing project layout
   */
  static adjustForExistingStructure(tree, context) {
    const { projectType, basePath } = context;
    
    // For frontend projects, ensure components go in right place
    if (this.isFrontendProject(projectType)) {
      return this.adjustFrontendStructure(tree, context);
    }
    
    // For backend projects, ensure proper API structure
    if (this.isBackendProject(projectType)) {
      return this.adjustBackendStructure(tree, context);
    }
    
    return tree;
  }
  
  /**
   * Adjust frontend structure to match project conventions
   */
  static adjustFrontendStructure(tree, context) {
    const { projectType, basePath } = context;
    
    // Check if project uses src/ folder
    const hasSrcFolder = fs.existsSync(path.join(basePath, "src"));
    
    if (hasSrcFolder) {
      // Move relevant folders into src if they're in root
      return tree.map(node => {
        if (this.shouldBeInSrc(node.name, projectType)) {
          console.log(chalk.blue(`📁 Adjusting ${node.name} to src/ folder`));
          return {
            ...node,
            targetPath: path.join("src", node.name)
          };
        }
        return node;
      });
    }
    
    return tree;
  }
  
  /**
   * Adjust backend structure for proper API organization
   */
  static adjustBackendStructure(tree, context) {
    const { framework, basePath } = context;
    
    // NestJS specific adjustments
    if (framework === "NestJS") {
      return this.adjustNestJSStructure(tree, basePath);
    }
    
    // Express specific adjustments
    if (framework === "Express") {
      return this.adjustExpressStructure(tree, basePath);
    }
    
    // Django specific adjustments
    if (framework === "Django") {
      return this.adjustDjangoStructure(tree, basePath);
    }
    
    // Spring Boot specific adjustments
    if (framework === "Spring Boot") {
      return this.adjustSpringBootStructure(tree, basePath);
    }
    
    return tree;
  }
  
  /**
   * Adjust for NestJS conventions
   */
  static adjustNestJSStructure(tree, basePath) {
    const hasSrcFolder = fs.existsSync(path.join(basePath, "src"));
    
    if (hasSrcFolder) {
      return tree.map(node => {
        // Move modules, controllers, services to src/
        if (['modules', 'controllers', 'services', 'guards', 'interceptors', 'dto', 'entities'].includes(node.name)) {
          return {
            ...node,
            targetPath: path.join("src", node.name)
          };
        }
        return node;
      });
    }
    
    return tree;
  }
  
  /**
   * Adjust for Express conventions
   */
  static adjustExpressStructure(tree, basePath) {
    const hasSrcFolder = fs.existsSync(path.join(basePath, "src"));
    const commonDirs = ['routes', 'middleware', 'models', 'controllers', 'services', 'utils'];
    
    if (hasSrcFolder) {
      return tree.map(node => {
        if (commonDirs.includes(node.name)) {
          return {
            ...node,
            targetPath: path.join("src", node.name)
          };
        }
        return node;
      });
    }
    
    return tree;
  }
  
  /**
   * Adjust for Django conventions
   */
  static adjustDjangoStructure(tree, basePath) {
    return tree.map(node => {
      // Django apps usually go in project root
      if (['apps', 'models', 'views', 'urls', 'admin', 'migrations'].includes(node.name)) {
        return node; // Keep in root
      }
      
      // Static and media files
      if (['static', 'media', 'templates'].includes(node.name)) {
        return node; // Keep in root
      }
      
      return node;
    });
  }
  
  /**
   * Adjust for Spring Boot conventions
   */
  static adjustSpringBootStructure(tree, basePath) {
    const hasMainJava = fs.existsSync(path.join(basePath, "src", "main", "java"));
    
    if (hasMainJava) {
      return tree.map(node => {
        // Java source files go in src/main/java
        if (['controller', 'service', 'repository', 'entity', 'dto', 'config'].includes(node.name)) {
          return {
            ...node,
            targetPath: path.join("src", "main", "java", "com", "example", node.name)
          };
        }
        
        // Resources go in src/main/resources
        if (['resources', 'static', 'templates'].includes(node.name)) {
          return {
            ...node,
            targetPath: path.join("src", "main", "resources", node.name)
          };
        }
        
        return node;
      });
    }
    
    return tree;
  }
  
  /**
   * Validate structure against project type requirements
   */
  static validateAgainstProjectType(tree, context) {
    const { projectType } = context;
    const warnings = [];
    
    // Frontend validation
    if (this.isFrontendProject(projectType)) {
      const hasComponents = tree.some(node => 
        node.name === "components" || 
        (node.children && node.children.some(child => child.name === "components"))
      );
      
      if (!hasComponents) {
        warnings.push("Consider adding a 'components' folder for React components");
      }
      
      // Check for common frontend folders
      const recommendedFolders = ['hooks', 'utils', 'assets', 'styles'];
      const missingFolders = recommendedFolders.filter(folder => 
        !tree.some(node => node.name === folder)
      );
      
      if (missingFolders.length > 0) {
        warnings.push(`Consider adding: ${missingFolders.join(', ')}`);
      }
    }
    
    // Backend validation
    if (this.isBackendProject(projectType)) {
      const hasRoutes = tree.some(node => 
        ['routes', 'controllers', 'endpoints', 'handlers'].includes(node.name)
      );
      
      if (!hasRoutes) {
        warnings.push("Consider adding routes or controllers folder for API endpoints");
      }
      
      // Check for middleware folder
      const hasMiddleware = tree.some(node => node.name === "middleware");
      if (!hasMiddleware && projectType.includes('express')) {
        warnings.push("Consider adding 'middleware' folder for Express middleware");
      }
    }
    
    // Display warnings
    if (warnings.length > 0) {
      console.log(chalk.yellow("\n💡 Suggestions for better project organization:"));
      warnings.forEach(warning => {
        console.log(chalk.yellow(`  • ${warning}`));
      });
    }
    
    return tree;
  }
  
  /**
   * Check if folder has significant content (not just empty files)
   */
  static folderHasSignificantContent(folderPath) {
    try {
      const items = fs.readdirSync(folderPath);
      
      // Skip if folder is empty
      if (items.length === 0) return false;
      
      // Check for meaningful files (not just .gitkeep, .DS_Store, etc.)
      const meaningfulFiles = items.filter(item => {
        if (item.startsWith('.') && !item.endsWith('.js') && !item.endsWith('.ts')) {
          return false; // Skip hidden files except config files
        }
        
        const itemPath = path.join(folderPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isFile()) {
          // Check if file has actual content
          const content = fs.readFileSync(itemPath, 'utf8');
          return content.trim().length > 0;
        } else if (stats.isDirectory()) {
          // Recursively check subdirectories
          return this.folderHasSignificantContent(itemPath);
        }
        
        return false;
      });
      
      return meaningfulFiles.length > 0;
    } catch (error) {
      return false; // Assume no content if can't read
    }
  }
  
  /**
   * Check if file has meaningful content
   */
  static fileHasContent(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const trimmed = content.trim();
      
      // Consider empty if no content
      if (!trimmed) return false;
      
      // Check for placeholder patterns
      const placeholderPatterns = [
        /^\/\*[\s\S]*\*\/$/,              // Only comments
        /^\/\/.*$/,                       // Only single line comment
        /^#.*$/,                          // Only shell comment
        /^<!--[\s\S]*-->$/,               // Only HTML comment
        /^\{\s*\}$/,                      // Empty JSON object
        /^\[\s*\]$/,                      // Empty JSON array
        /^export\s+default\s+\{\s*\}$/,   // Empty export
        /^module\.exports\s*=\s*\{\s*\}$/ // Empty module export
      ];
      
      return !placeholderPatterns.some(pattern => pattern.test(trimmed));
    } catch (error) {
      return true; // Assume has content if can't read
    }
  }
  
  /**
   * Check if file is critical for the project
   */
  static isCriticalFile(filename, context) {
    const { projectType } = context;
    
    const universalCritical = [
      'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
      '.env', '.env.local', '.env.production', '.env.development',
      '.gitignore', '.gitattributes', 'README.md', 'LICENSE',
      'tsconfig.json', 'jsconfig.json'
    ];
    
    const projectSpecificCritical = {
      'vite-frontend': ['vite.config.js', 'vite.config.ts', 'index.html'],
      'next-frontend': ['next.config.js', 'next.config.ts', 'pages/_app.js', 'pages/_document.js'],
      'angular-frontend': ['angular.json', 'main.ts', 'polyfills.ts'],
      'nestjs-backend': ['nest-cli.json', 'main.ts', 'app.module.ts'],
      'express-backend': ['server.js', 'app.js', 'index.js'],
      'django-backend': ['manage.py', 'settings.py', 'urls.py', 'wsgi.py'],
      'flask-backend': ['app.py', 'run.py', 'config.py'],
      'spring-backend': ['pom.xml', 'build.gradle', 'application.properties'],
      'laravel-backend': ['artisan', 'composer.json', '.env.example'],
      'rails-backend': ['Gemfile', 'config.ru', 'application.rb']
    };
    
    return universalCritical.includes(filename.toLowerCase()) ||
           (projectSpecificCritical[projectType] || []).includes(filename.toLowerCase());
  }
  
  /**
   * Adjust frontend structure to match project conventions
   */
  static adjustFrontendStructure(tree, context) {
    const { projectType, basePath } = context;
    
    // Check if project uses src/ folder
    const hasSrcFolder = fs.existsSync(path.join(basePath, "src"));
    
    if (hasSrcFolder) {
      // Move relevant folders into src if they're in root
      return tree.map(node => {
        if (this.shouldBeInSrc(node.name, projectType)) {
          console.log(chalk.blue(`📁 Adjusting ${node.name} to src/ folder`));
          return {
            ...node,
            targetPath: path.join("src", node.name)
          };
        }
        return node;
      });
    }
    
    return tree;
  }
  
  /**
   * Adjust backend structure for proper API organization
   */
  static adjustBackendStructure(tree, context) {
    const { framework, basePath } = context;
    
    // NestJS specific adjustments
    if (framework === "NestJS") {
      return this.adjustNestJSStructure(tree, basePath);
    }
    
    // Express specific adjustments
    if (framework === "Express") {
      return this.adjustExpressStructure(tree, basePath);
    }
    
    // Django specific adjustments
    if (framework === "Django") {
      return this.adjustDjangoStructure(tree, basePath);
    }
    
    // Spring Boot specific adjustments
    if (framework === "Spring Boot") {
      return this.adjustSpringBootStructure(tree, basePath);
    }
    
    return tree;
  }
  
  /**
   * Adjust for NestJS conventions
   */
  static adjustNestJSStructure(tree, basePath) {
    const hasSrcFolder = fs.existsSync(path.join(basePath, "src"));
    
    if (hasSrcFolder) {
      return tree.map(node => {
        // Move modules, controllers, services to src/
        if (['modules', 'controllers', 'services', 'guards', 'interceptors', 'dto', 'entities'].includes(node.name)) {
          return {
            ...node,
            targetPath: path.join("src", node.name)
          };
        }
        return node;
      });
    }
    
    return tree;
  }
  
  /**
   * Adjust for Express conventions
   */
  static adjustExpressStructure(tree, basePath) {
    const hasSrcFolder = fs.existsSync(path.join(basePath, "src"));
    const commonDirs = ['routes', 'middleware', 'models', 'controllers', 'services', 'utils'];
    
    if (hasSrcFolder) {
      return tree.map(node => {
        if (commonDirs.includes(node.name)) {
          return {
            ...node,
            targetPath: path.join("src", node.name)
          };
        }
        return node;
      });
    }
    
    return tree;
  }
  
  /**
   * Adjust for Django conventions
   */
  static adjustDjangoStructure(tree, basePath) {
    return tree.map(node => {
      // Django apps usually go in project root
      if (['apps', 'models', 'views', 'urls', 'admin', 'migrations'].includes(node.name)) {
        return node; // Keep in root
      }
      
      // Static and media files
      if (['static', 'media', 'templates'].includes(node.name)) {
        return node; // Keep in root
      }
      
      return node;
    });
  }
  
  /**
   * Adjust for Spring Boot conventions
   */
  static adjustSpringBootStructure(tree, basePath) {
    const hasMainJava = fs.existsSync(path.join(basePath, "src", "main", "java"));
    
    if (hasMainJava) {
      return tree.map(node => {
        // Java source files go in src/main/java
        if (['controller', 'service', 'repository', 'entity', 'dto', 'config'].includes(node.name)) {
          return {
            ...node,
            targetPath: path.join("src", "main", "java", "com", "example", node.name)
          };
        }
        
        // Resources go in src/main/resources
        if (['resources', 'static', 'templates'].includes(node.name)) {
          return {
            ...node,
            targetPath: path.join("src", "main", "resources", node.name)
          };
        }
        
        return node;
      });
    }
    
    return tree;
  }
  
  /**
   * Validate structure against project type requirements
   */
  static validateAgainstProjectType(tree, context) {
    const { projectType } = context;
    const warnings = [];
    
    // Frontend validation
    if (this.isFrontendProject(projectType)) {
      const hasComponents = tree.some(node => 
        node.name === "components" || 
        (node.children && node.children.some(child => child.name === "components"))
      );
      
      if (!hasComponents) {
        warnings.push("Consider adding a 'components' folder for React components");
      }
      
      // Check for common frontend folders
      const recommendedFolders = ['hooks', 'utils', 'assets', 'styles'];
      const missingFolders = recommendedFolders.filter(folder => 
        !tree.some(node => node.name === folder)
      );
      
      if (missingFolders.length > 0) {
        warnings.push(`Consider adding: ${missingFolders.join(', ')}`);
      }
    }
    
    // Backend validation
    if (this.isBackendProject(projectType)) {
      const hasRoutes = tree.some(node => 
        ['routes', 'controllers', 'endpoints', 'handlers'].includes(node.name)
      );
      
      if (!hasRoutes) {
        warnings.push("Consider adding routes or controllers folder for API endpoints");
      }
      
      // Check for middleware folder
      const hasMiddleware = tree.some(node => node.name === "middleware");
      if (!hasMiddleware && projectType.includes('express')) {
        warnings.push("Consider adding 'middleware' folder for Express middleware");
      }
      
      // Check for models/entities
      const hasDataLayer = tree.some(node => 
        ['models', 'entities', 'schemas'].includes(node.name)
      );
      if (!hasDataLayer) {
        warnings.push("Consider adding data layer folder (models/entities/schemas)");
      }
    }
    
    // Display warnings
    if (warnings.length > 0) {
      console.log(chalk.yellow("\n💡 Suggestions for better project organization:"));
      warnings.forEach(warning => {
        console.log(chalk.yellow(`  • ${warning}`));
      });
    }
    
    return tree;
  }
  
  /**
   * Check if folder should be in src directory
   */
  static shouldBeInSrc(folderName, projectType) {
    const srcFolders = {
      'vite-frontend': ['components', 'hooks', 'utils', 'stores', 'services', 'assets'],
      'react-frontend': ['components', 'hooks', 'utils', 'context', 'services', 'assets'],
      'next-frontend': ['components', 'hooks', 'utils', 'lib'],
      'vue-frontend': ['components', 'composables', 'utils', 'stores', 'assets'],
      'svelte-frontend': ['components', 'stores', 'utils', 'assets'],
      'angular-frontend': ['components', 'services', 'pipes', 'directives', 'guards']
    };
    
    return (srcFolders[projectType] || []).includes(folderName);
  }
  
  /**
   * Project type helpers
   */
  static isFrontendProject(type) {
    return ['vite-frontend', 'next-frontend', 'react-frontend', 'vue-frontend', 
            'angular-frontend', 'svelte-frontend', 'nuxt-frontend'].includes(type);
  }
  
  static isBackendProject(type) {
    return ['nestjs-backend', 'express-backend', 'fastify-backend', 'koa-backend',
            'django-backend', 'flask-backend', 'spring-backend', 'laravel-backend',
            'rails-backend', 'nodejs-backend'].includes(type);
  }
  
  /**
   * Adjust structure for existing project layout
   */
  static adjustForExistingStructure(tree, context) {
    const { projectType, basePath } = context;
    
    // For frontend projects, ensure components go in right place
    if (this.isFrontendProject(projectType)) {
      return this.adjustFrontendStructure(tree, context);
    }
    
    // For backend projects, ensure proper API structure
    if (this.isBackendProject(projectType)) {
      return this.adjustBackendStructure(tree, context);
    }
    
    return tree;
  }
  
  /**
   * Detect conflicts and suggest resolutions
   */
  static detectConflicts(tree, basePath) {
    const conflicts = [];
    
    function checkNode(node, currentPath) {
      const fullPath = path.join(currentPath, node.name);
      
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        
        if (node.type === "folder" && stats.isFile()) {
          conflicts.push({
            type: 'type_mismatch',
            path: fullPath,
            expected: 'folder',
            actual: 'file'
          });
        } else if (node.type === "file" && stats.isDirectory()) {
          conflicts.push({
            type: 'type_mismatch',
            path: fullPath,
            expected: 'file',
            actual: 'folder'
          });
        }
      }
      
      if (node.children) {
        node.children.forEach(child => checkNode(child, fullPath));
      }
    }
    
    tree.forEach(node => checkNode(node, basePath));
    return conflicts;
  }
  
  /**
   * Resolve detected conflicts automatically
   */
  static resolveConflicts(tree, conflicts, basePath) {
    if (conflicts.length === 0) return tree;
    
    console.log(chalk.yellow(`\n⚠️ Resolving ${conflicts.length} conflicts...`));
    
    return tree.filter(node => {
      const conflict = conflicts.find(c => 
        c.path === path.join(basePath, node.name)
      );
      
      if (conflict) {
        console.log(chalk.yellow(`  • Skipping conflicting ${node.name} (${conflict.expected} vs ${conflict.actual})`));
        return false;
      }
      
      return true;
    });
  }
}

module.exports = { StructureValidator };