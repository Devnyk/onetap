const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const { StructureValidator } = require("./structureValidator");

/**
 * Enhanced smart merger that automatically preserves existing files
 * No user prompts - fully automated smart decisions
 */
async function smartMerge(tree, targetDir, options = {}) {
  const {
    preserveContent = true,
    skipCritical = true,
    dirsOnly = false,
    verbose = true,
    projectType = "unknown",
    isNested = false
  } = options;

  // Validate and adjust structure for project context
  const projectInfo = typeof projectType === 'string' ? 
    { type: projectType, isNested } : projectType;
    
  const adjustedTree = StructureValidator.validateAndAdjustStructure(
    tree, 
    projectInfo, 
    targetDir
  );

  const stats = {
    created: { folders: 0, files: 0 },
    preserved: { folders: 0, files: 0 },
    skipped: { folders: 0, files: 0 }
  };

  await processMerge(adjustedTree, targetDir, {
    preserveContent,
    skipCritical,
    dirsOnly,
    verbose,
    projectType: projectInfo.type || projectType,
    stats
  });

  // Always display summary for transparency
  displayMergeReport(stats);

  return stats;
}

async function processMerge(tree, targetDir, context) {
  const { stats, verbose } = context;

  for (const node of tree) {
    const finalPath = node.targetPath ? 
      path.join(targetDir, node.targetPath) : 
      path.join(targetDir, node.name);
      
    const exists = fs.existsSync(finalPath);

    if (node.type === "folder") {
      await handleFolder(node, finalPath, exists, context);
    } else {
      await handleFile(node, finalPath, exists, context);
    }
  }
}

async function handleFolder(node, targetPath, exists, context) {
  const { stats, verbose } = context;

  // Special handling for sensitive folders
  if (isSensitiveFolder(node.name)) {
    if (!exists) {
      if (verbose) {
        console.log(chalk.gray(`⏭️  Skipped creating sensitive folder: ${node.name}`));
      }
      stats.skipped.folders++;
    } else {
      stats.preserved.folders++;
    }
    return;
  }

  if (!exists) {
    await fs.ensureDir(targetPath);
    stats.created.folders++;
    if (verbose) {
      console.log(chalk.green(`📁 Created folder: ${node.name}`));
    }
  } else {
    stats.preserved.folders++;
    if (verbose) {
      console.log(chalk.blue(`📁 Folder exists: ${node.name}`));
    }
  }

  // Recursively process children
  if (node.children && node.children.length > 0) {
    await processMerge(node.children, targetPath, context);
  }
}

async function handleFile(node, targetPath, exists, context) {
  const { stats, verbose, preserveContent, skipCritical, dirsOnly } = context;

  // Skip file creation if dirsOnly mode
  if (dirsOnly) {
    if (verbose && !exists) {
      console.log(chalk.gray(`⏭️  Skipped file (dirs-only mode): ${node.name}`));
    }
    return;
  }

  // Skip critical config files if they exist
  if (skipCritical && exists && isCriticalFile(node.name)) {
    stats.preserved.files++;
    if (verbose) {
      console.log(chalk.yellow(`🔒 Preserved critical file: ${node.name}`));
    }
    return;
  }

  if (exists) {
    // Check if existing file has content
    const existingContent = await getFileContent(targetPath);
    const hasContent = existingContent && existingContent.trim().length > 0;

    if (preserveContent && hasContent) {
      stats.preserved.files++;
      if (verbose) {
        console.log(chalk.blue(`📄 Preserved existing file with content: ${node.name}`));
      }
      return;
    }

    // File exists but is empty or preserveContent is false
    if (hasContent) {
      // Ask user what to do with non-empty file
      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: `File "${node.name}" has content. What should we do?`,
          choices: [
            { name: "Keep existing content (Recommended)", value: "keep" },
            { name: "Replace with empty file", value: "replace" },
            { name: "Skip this file", value: "skip" }
          ],
        },
      ]);

      if (action === "keep") {
        stats.preserved.files++;
        if (verbose) {
          console.log(chalk.blue(`📄 Kept existing content: ${node.name}`));
        }
        return;
      }
      
      if (action === "skip") {
        stats.skipped.files++;
        if (verbose) {
          console.log(chalk.gray(`⏭️  Skipped: ${node.name}`));
        }
        return;
      }
    }

    // Replace with empty content
    await fs.writeFile(targetPath, getDefaultContent(node.name));
    stats.created.files++;
    if (verbose) {
      console.log(chalk.yellow(`📄 Replaced: ${node.name}`));
    }
  } else {
    // Create new file
    await fs.writeFile(targetPath, getDefaultContent(node.name));
    stats.created.files++;
    if (verbose) {
      console.log(chalk.green(`📄 Created: ${node.name}`));
    }
  }
}

/**
 * Check if folder should be handled with special care
 */
function isSensitiveFolder(folderName) {
  const sensitiveFolders = [
    'node_modules', '.git', '.vscode', '.idea',
    'dist', 'build', 'coverage', '.next', '.nuxt'
  ];
  return sensitiveFolders.includes(folderName.toLowerCase());
}

/**
 * Check if file is critical and should not be overwritten
 */
function isCriticalFile(filename) {
  const criticalFiles = [
    'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    'vite.config.js', 'vite.config.ts', 
    'next.config.js', 'next.config.ts',
    'angular.json', 'nest-cli.json', 'nuxt.config.js',
    'tsconfig.json', 'jsconfig.json',
    '.env', '.env.local', '.env.production',
    '.gitignore', '.gitattributes',
    'README.md', 'LICENSE',
    'docker-compose.yml', 'Dockerfile'
  ];
  return criticalFiles.includes(filename.toLowerCase());
}

/**
 * Safely read file content
 */
async function getFileContent(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

/**
 * Get appropriate default content for different file types
 */
function getDefaultContent(filename) {
  const ext = path.extname(filename).toLowerCase();
  const basename = path.basename(filename, ext).toLowerCase();

  // Return appropriate boilerplate or empty content
  switch (ext) {
    case '.js':
      if (basename.includes('config')) return '// Configuration file\n';
      return '// JavaScript file\n';
    
    case '.ts':
      if (basename.includes('config')) return '// TypeScript configuration\n';
      return '// TypeScript file\n';
    
    case '.jsx':
    case '.tsx':
      return getReactBoilerplate(filename);
    
    case '.css':
      return '/* Stylesheet */\n';
    
    case '.scss':
    case '.sass':
      return '// Sass stylesheet\n';
    
    case '.md':
      return `# ${basename.charAt(0).toUpperCase() + basename.slice(1)}\n\nContent goes here...\n`;
    
    case '.json':
      if (basename === 'package') {
        return '{}'; // Don't create package.json content
      }
      return '{\n  \n}\n';
    
    case '.env':
      return '# Environment variables\n';
    
    case '.gitignore':
      return getGitignoreTemplate();
    
    default:
      return '';
  }
}

/**
 * Generate basic React component boilerplate
 */
function getReactBoilerplate(filename) {
  const componentName = path.basename(filename, path.extname(filename));
  const capitalizedName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
  
  return `import React from 'react';

const ${capitalizedName} = () => {
  return (
    <div>
      <h1>${capitalizedName}</h1>
    </div>
  );
};

export default ${capitalizedName};
`;
}

/**
 * Get basic gitignore template
 */
function getGitignoreTemplate() {
  return `node_modules/
dist/
build/
.env
.env.local
.DS_Store
*.log
coverage/
.nyc_output/
`;
}

/**
 * Display clean and simple merge report
 */
function displayMergeReport(stats) {
  const totalCreated = stats.created.folders + stats.created.files;
  const totalPreserved = stats.preserved.folders + stats.preserved.files;
  
  console.log(chalk.cyan("\n📊 Merge Complete:"));
  
  if (totalCreated > 0) {
    console.log(chalk.green(`  ✅ Created ${stats.created.folders} folders and ${stats.created.files} files`));
  }
  
  if (totalPreserved > 0) {
    console.log(chalk.blue(`  🔒 Preserved ${totalPreserved} existing items with content`));
  }
  
  if (totalCreated === 0 && totalPreserved === 0) {
    console.log(chalk.yellow("  ℹ️  All items already exist - nothing to create"));
  }
}

module.exports = { 
  smartMerge,
  isCriticalFile,
  isSensitiveFolder,
  getDefaultContent 
};