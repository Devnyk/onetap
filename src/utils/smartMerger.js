import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { StructureValidator } from "./structureValidator.js";

/**
 * Enhanced smart merger that automatically preserves existing files
 * No user prompts - fully automated smart decisions
 */
export async function smartMerge(tree, targetDir, options = {}) {
  const {
    preserveContent = true,
    skipCritical = true,
    dirsOnly = false,
    verbose = true,
    projectType = "unknown",
    isNested = false
  } = options;

  // Validate and adjust structure for project context
  const projectInfo = typeof projectType === "string"
    ? { type: projectType, isNested }
    : projectType;

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
    let finalPath;

    if (node.targetPath) {
      finalPath = path.join(targetDir, node.targetPath);
    } else {
      // 🛠 Fix: prevent duplicate root folder nesting
      if (path.basename(targetDir) === node.name && node.type === "folder") {
        finalPath = targetDir;
      } else {
        finalPath = path.join(targetDir, node.name);
      }
    }

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

  if (dirsOnly) {
    if (verbose && !exists) {
      console.log(chalk.gray(`⏭️  Skipped file (dirs-only mode): ${node.name}`));
    }
    return;
  }

  if (skipCritical && exists && isCriticalFile(node.name)) {
    stats.preserved.files++;
    if (verbose) {
      console.log(chalk.yellow(`🔒 Preserved critical file: ${node.name}`));
    }
    return;
  }

  if (exists) {
    const existingContent = await getFileContent(targetPath);
    const hasContent = existingContent && existingContent.trim().length > 0;

    if (preserveContent && hasContent) {
      stats.preserved.files++;
      if (verbose) {
        console.log(chalk.blue(`📄 Preserved existing file with content: ${node.name}`));
      }
      return;
    }

    if (!hasContent) {
      await fs.writeFile(targetPath, getDefaultContent(node.name));
      stats.created.files++;
      if (verbose) {
        console.log(chalk.yellow(`📄 Updated empty file: ${node.name}`));
      }
      return;
    }

    stats.preserved.files++;
    if (verbose) {
      console.log(chalk.blue(`📄 Preserved existing file with content: ${node.name}`));
    }
  } else {
    await fs.writeFile(targetPath, getDefaultContent(node.name));
    stats.created.files++;
    if (verbose) {
      console.log(chalk.green(`📄 Created: ${node.name}`));
    }
  }
}

export function isSensitiveFolder(folderName) {
  const sensitiveFolders = [
    "node_modules", ".git", ".vscode", ".idea",
    "dist", "build", "coverage", ".next", ".nuxt"
  ];
  return sensitiveFolders.includes(folderName.toLowerCase());
}

export function isCriticalFile(filename) {
  const criticalFiles = [
    "package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    "vite.config.js", "vite.config.ts",
    "next.config.js", "next.config.ts",
    "angular.json", "nest-cli.json", "nuxt.config.js",
    "tsconfig.json", "jsconfig.json",
    ".env", ".env.local", ".env.production",
    ".gitignore", ".gitattributes",
    "README.md", "LICENSE",
    "docker-compose.yml", "Dockerfile"
  ];
  return criticalFiles.includes(filename.toLowerCase());
}

async function getFileContent(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

export function getDefaultContent(filename) {
  const ext = path.extname(filename).toLowerCase();
  const basename = path.basename(filename, ext).toLowerCase();

  switch (ext) {
    case ".js":
      return basename.includes("config") ? "// Configuration file\n" : "// JavaScript file\n";
    case ".ts":
      return basename.includes("config") ? "// TypeScript configuration\n" : "// TypeScript file\n";
    case ".jsx":
    case ".tsx":
      return getReactBoilerplate(filename);
    case ".css":
      return "/* Stylesheet */\n";
    case ".scss":
    case ".sass":
      return "// Sass stylesheet\n";
    case ".md":
      return `# ${basename.charAt(0).toUpperCase() + basename.slice(1)}\n\nContent goes here...\n`;
    case ".json":
      return basename === "package" ? "{}" : "{\n  \n}\n";
    case ".env":
      return "# Environment variables\n";
    case ".gitignore":
      return getGitignoreTemplate();
    default:
      return "";
  }
}

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
