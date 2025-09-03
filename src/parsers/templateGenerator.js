import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

/**
 * Enhanced template generator with content preservation and smart defaults
 */
export class TemplateGenerator {
  constructor(options = {}) {
    this.options = {
      preserveExisting: true,
      generateBoilerplate: false,
      projectType: "unknown",
      verbose: false,
      ...options,
    };
  }

  /**
   * Generate folders and files from a tree structure
   * Only creates missing elements, preserves existing content
   */
  async generateFromStructure(tree, targetDir) {
    const stats = {
      foldersCreated: 0,
      filesCreated: 0,
      preserved: 0,
      errors: [],
    };

    try {
      await this.processNodes(tree, targetDir, stats);
      this.displayResults(stats);
      return stats;
    } catch (error) {
      console.error(chalk.red("❌ Generation failed:"), error.message);
      throw error;
    }
  }

  async processNodes(nodes, currentDir, stats) {
    for (const node of nodes) {
      try {
        await this.processNode(node, currentDir, stats);
      } catch (error) {
        stats.errors.push(`${node.name}: ${error.message}`);
        if (this.options.verbose) {
          console.error(
            chalk.red(`❌ Error processing ${node.name}:`),
            error.message
          );
        }
      }
    }
  }

  async processNode(node, currentDir, stats) {
    const targetPath = path.join(currentDir, node.name);
    const exists = await fs.pathExists(targetPath);

    if (node.type === "folder") {
      await this.handleFolder(node, targetPath, exists, stats);
    } else {
      await this.handleFile(node, targetPath, exists, stats);
    }
  }

  async handleFolder(node, targetPath, exists, stats) {
    if (!exists) {
      await fs.ensureDir(targetPath);
      stats.foldersCreated++;

      if (this.options.verbose) {
        console.log(chalk.green(`📁 Created folder: ${node.name}`));
      }
    } else {
      stats.preserved++;
      if (this.options.verbose) {
        console.log(chalk.blue(`📁 Folder exists: ${node.name}`));
      }
    }

    if (node.children && node.children.length > 0) {
      await this.processNodes(node.children, targetPath, stats);
    }
  }

  async handleFile(node, targetPath, exists, stats) {
    if (exists) {
      const hasContent = await this.fileHasContent(targetPath);

      if (this.options.preserveExisting && hasContent) {
        stats.preserved++;
        if (this.options.verbose) {
          console.log(chalk.blue(`📄 Preserved existing file: ${node.name}`));
        }
        return;
      }
    }

    const content = this.getFileContent(node);
    await fs.writeFile(targetPath, content);
    stats.filesCreated++;

    if (this.options.verbose) {
      const action = exists ? "Updated" : "Created";
      console.log(chalk.green(`📄 ${action} file: ${node.name}`));
    }
  }

  async fileHasContent(filePath) {
    try {
      const content = await fs.readFile(filePath, "utf8");
      const trimmed = content.trim();

      if (!trimmed) return false;

      const emptyPatterns = [
        /^\/\*[\s\S]*\*\/$/, // CSS comments
        /^\/\/.*$/m, // JS comments
        /^#.*$/m, // shell/Python comments
        /^<!--[\s\S]*-->$/, // HTML comments
        /^\{\s*\}$/, // Empty JSON
        /^\[\s*\]$/, // Empty JSON array
      ];

      return !emptyPatterns.some((pattern) => pattern.test(trimmed));
    } catch {
      return true;
    }
  }

  getFileContent(node) {
    if (!this.options.generateBoilerplate) {
      return "";
    }

    const filename = node.name;
    const ext = path.extname(filename).toLowerCase();
    const basename = path.basename(filename, ext);

    switch (ext) {
      case ".js":
        return this.getJavaScriptBoilerplate(basename);
      case ".ts":
        return this.getTypeScriptBoilerplate(basename);
      case ".jsx":
        return this.getReactJSXBoilerplate(basename);
      case ".tsx":
        return this.getReactTSXBoilerplate(basename);
      case ".vue":
        return this.getVueBoilerplate(basename);
      case ".svelte":
        return this.getSvelteBoilerplate(basename);
      case ".css":
        return this.getCSSBoilerplate(basename);
      case ".scss":
      case ".sass":
        return this.getSassBoilerplate(basename);
      case ".md":
        return this.getMarkdownBoilerplate(basename);
      case ".json":
        return this.getJSONBoilerplate(basename);
      case ".env":
        return this.getEnvBoilerplate();
      case ".gitignore":
        return this.getGitignoreBoilerplate();
      default:
        return "";
    }
  }

  getJavaScriptBoilerplate(basename) {
    if (basename.includes("config")) {
      return "// Configuration file\nexport default {\n  // Add your config here\n};\n";
    }
    if (basename.includes("utils") || basename.includes("helper")) {
      return "// Utility functions\n\nexport function example() {\n  // Add your utility function here\n}\n";
    }
    return "// JavaScript file\n";
  }

  getTypeScriptBoilerplate(basename) {
    if (basename.includes("config")) {
      return "// TypeScript configuration\nexport default {\n  // Add your config here\n} as const;\n";
    }
    if (basename.includes("types") || basename.includes("interface")) {
      return "// Type definitions\n\nexport interface Example {\n  // Add your types here\n}\n";
    }
    return "// TypeScript file\n";
  }

  getReactJSXBoilerplate(basename) {
    const componentName = this.capitalize(basename);
    return `import React from 'react';

const ${componentName} = () => {
  return (
    <div className="${basename.toLowerCase()}">
      <h1>${componentName}</h1>
      {/* Add your component content here */}
    </div>
  );
};

export default ${componentName};
`;
  }

  getReactTSXBoilerplate(basename) {
    const componentName = this.capitalize(basename);
    return `import React from 'react';

interface ${componentName}Props {
  // Add your prop types here
}

const ${componentName}: React.FC<${componentName}Props> = () => {
  return (
    <div className="${basename.toLowerCase()}">
      <h1>${componentName}</h1>
      {/* Add your component content here */}
    </div>
  );
};

export default ${componentName};
`;
  }

  getVueBoilerplate(basename) {
    const componentName = this.capitalize(basename);
    return `<template>
  <div class="${basename.toLowerCase()}">
    <h1>${componentName}</h1>
    <!-- Add your template here -->
  </div>
</template>

<script>
export default {
  name: '${componentName}',
  // Add your component logic here
}
</script>

<style scoped>
.${basename.toLowerCase()} {
  /* Add your styles here */
}
</style>
`;
  }

  getSvelteBoilerplate(basename) {
    return `<script>
  // Add your component logic here
</script>

<div class="${basename.toLowerCase()}">
  <h1>${this.capitalize(basename)}</h1>
  <!-- Add your content here -->
</div>

<style>
  .${basename.toLowerCase()} {
    /* Add your styles here */
  }
</style>
`;
  }

  getCSSBoilerplate(basename) {
    return `/* ${this.capitalize(basename)} Styles */

.${basename.toLowerCase()} {
  /* Add your styles here */
}
`;
  }

  getSassBoilerplate(basename) {
    return `// ${this.capitalize(basename)} Styles

.${basename.toLowerCase()} {
  // Add your styles here
}
`;
  }

  getMarkdownBoilerplate(basename) {
    const title = this.capitalize(basename.replace(/[-_]/g, " "));
    return `# ${title}

Add your content here...

## Getting Started

Instructions go here...
`;
  }

  getJSONBoilerplate(basename) {
    if (basename === "package") {
      return "{}";
    }
    if (basename.includes("config")) {
      return '{\n  "// Add your configuration here": true\n}\n';
    }
    return "{\n  \n}\n";
  }

  getEnvBoilerplate() {
    return `# Environment Variables
# Add your environment variables here

# Example:
# DATABASE_URL=your_database_url_here
# API_KEY=your_api_key_here
`;
  }

  getGitignoreBoilerplate() {
    const patterns = [
      "# Dependencies",
      "node_modules/",
      "",
      "# Build outputs",
      "dist/",
      "build/",
      ".next/",
      ".nuxt/",
      ".vite/",
      "",
      "# Environment files",
      ".env",
      ".env.local",
      ".env.production",
      "",
      "# Logs",
      "*.log",
      "logs/",
      "",
      "# OS generated files",
      ".DS_Store",
      "Thumbs.db",
      "",
      "# IDE files",
      ".vscode/",
      ".idea/",
      "*.swp",
      "*.swo",
      "",
      "# Coverage reports",
      "coverage/",
      ".nyc_output/",
    ];

    return patterns.join("\n") + "\n";
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  displayResults(stats) {
    console.log(chalk.cyan("\n📊 Generation Summary:"));

    if (stats.foldersCreated > 0) {
      console.log(chalk.green(`  📁 Created ${stats.foldersCreated} folders`));
    }

    if (stats.filesCreated > 0) {
      console.log(chalk.green(`  📄 Created ${stats.filesCreated} files`));
    }

    if (stats.preserved > 0) {
      console.log(chalk.blue(`  🔒 Preserved ${stats.preserved} existing items`));
    }

    if (stats.errors.length > 0) {
      console.log(chalk.red(`  ❌ ${stats.errors.length} errors occurred:`));
      stats.errors.forEach((error) => {
        console.log(chalk.red(`    • ${error}`));
      });
    }

    if (
      stats.foldersCreated === 0 &&
      stats.filesCreated === 0 &&
      stats.errors.length === 0
    ) {
      console.log(
        chalk.yellow("  ℹ️  No new items created (everything already exists)")
      );
    }
  }

  async generateWithValidation(tree, targetDir) {
    if (!(await fs.pathExists(targetDir))) {
      throw new Error(`Target directory does not exist: ${targetDir}`);
    }

    try {
      await fs.access(targetDir, fs.constants.W_OK);
    } catch {
      throw new Error(`No write permission for directory: ${targetDir}`);
    }

    return await this.generateFromStructure(tree, targetDir);
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function generateFromStructure(tree, targetDir, options = {}) {
  const generator = new TemplateGenerator(options);
  return await generator.generateFromStructure(tree, targetDir);
}
