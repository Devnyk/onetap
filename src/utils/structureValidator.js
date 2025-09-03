// utils/structureValidator.js
import fs from "fs";
import path from "path";
import chalk from "chalk";

/**
 * Enhanced structure validator for handling edge cases
 */
export class StructureValidator {
  /**
   * Validate and potentially adjust structure based on project context
   */
  static validateAndAdjustStructure(parsedTree, projectInfo, targetDir) {
    const context = {
      projectType: projectInfo.type || projectInfo,
      isNested: projectInfo.isNested || false,
      basePath: projectInfo.basePath || targetDir,
      framework: projectInfo.framework,
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
   * Remove duplicate/conflicting entries from parsed structure
   */
  static removeDuplicateStructure(tree, context) {
    const seen = new Set();

    function dedupe(nodes) {
      return nodes.filter((node) => {
        const key = `${node.type}:${node.name}`;
        if (seen.has(key)) return false;
        seen.add(key);

        if (node.children && node.children.length > 0) {
          node.children = dedupe(node.children);
        }
        return true;
      });
    }

    return dedupe(tree);
  }

  /**
   * Adjust structure for existing project directories
   */
  static adjustForExistingStructure(tree, context) {
    const { projectType, basePath } = context;

    switch (projectType) {
      case "frontend":
        return this.adjustFrontendStructure(tree, basePath);
      case "backend":
        return this.adjustBackendStructure(tree, basePath);
      case "nestjs":
        return this.adjustNestJSStructure(tree, basePath);
      case "express":
        return this.adjustExpressStructure(tree, basePath);
      case "django":
        return this.adjustDjangoStructure(tree, basePath);
      case "springboot":
        return this.adjustSpringBootStructure(tree, basePath);
      default:
        return tree;
    }
  }

  /**
   * Adjust frontend-specific folder structures
   */
  static adjustFrontendStructure(tree, basePath) {
    const srcPath = path.join(basePath, "src");

    return tree.map((node) => {
      if (node.type === "folder" && node.name === "src" && fs.existsSync(srcPath)) {
        node.targetPath = "src";
      }
      return node;
    });
  }

  /**
   * Adjust backend-specific folder structures
   */
  static adjustBackendStructure(tree, basePath) {
    const apiPath = path.join(basePath, "api");

    return tree.map((node) => {
      if (node.type === "folder" && node.name === "api" && fs.existsSync(apiPath)) {
        node.targetPath = "api";
      }
      return node;
    });
  }

  /**
   * Adjust NestJS structure
   */
  static adjustNestJSStructure(tree, basePath) {
    return tree.map((node) => {
      if (node.type === "folder" && node.name === "src") {
        node.targetPath = "src";
      }
      return node;
    });
  }

  /**
   * Adjust Express structure
   */
  static adjustExpressStructure(tree, basePath) {
    return tree.map((node) => {
      if (node.type === "folder" && node.name === "routes") {
        node.targetPath = "routes";
      }
      return node;
    });
  }

  /**
   * Adjust Django structure
   */
  static adjustDjangoStructure(tree, basePath) {
    return tree.map((node) => {
      if (node.type === "folder" && node.name === "apps") {
        node.targetPath = "apps";
      }
      return node;
    });
  }

  /**
   * Adjust Spring Boot structure
   */
  static adjustSpringBootStructure(tree, basePath) {
    return tree.map((node) => {
      if (node.type === "folder" && node.name === "src") {
        node.targetPath = "src/main/java";
      }
      return node;
    });
  }

  /**
   * Validate structure against project type
   */
  static validateAgainstProjectType(tree, context) {
    if (context.projectType === "frontend") {
      return tree.filter((node) => {
        if (node.type === "folder") {
          return this.isFrontendProject(node.name);
        }
        return true;
      });
    }

    if (context.projectType === "backend") {
      return tree.filter((node) => {
        if (node.type === "folder") {
          return this.isBackendProject(node.name);
        }
        return true;
      });
    }

    return tree;
  }

  /**
   * Check if folder has meaningful content
   */
  static folderHasSignificantContent(folderPath) {
    try {
      const files = fs.readdirSync(folderPath);
      return files.some((file) => {
        const fullPath = path.join(folderPath, file);
        const stat = fs.statSync(fullPath);
        return stat.isFile() && stat.size > 0;
      });
    } catch {
      return false;
    }
  }

  /**
   * Check if file has content
   */
  static fileHasContent(filePath) {
    try {
      const stat = fs.statSync(filePath);
      return stat.isFile() && stat.size > 0;
    } catch {
      return false;
    }
  }

  /**
   * Check if file is critical
   */
  static isCriticalFile(filename) {
    const critical = [
      "package.json",
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      ".env",
      ".gitignore",
    ];
    return critical.includes(filename.toLowerCase());
  }

  /**
   * Check if should be in src
   */
  static shouldBeInSrc(filename) {
    const exts = [".js", ".jsx", ".ts", ".tsx", ".css", ".scss"];
    return exts.includes(path.extname(filename).toLowerCase());
  }

  /**
   * Detect if frontend project
   */
  static isFrontendProject(folderName) {
    const frontend = ["src", "components", "public"];
    return frontend.includes(folderName.toLowerCase());
  }

  /**
   * Detect if backend project
   */
  static isBackendProject(folderName) {
    const backend = ["api", "controllers", "models", "routes"];
    return backend.includes(folderName.toLowerCase());
  }

  /**
   * Detect conflicts in tree
   */
  static detectConflicts(tree) {
    const names = new Set();
    const conflicts = [];

    tree.forEach((node) => {
      if (names.has(node.name)) {
        conflicts.push(node.name);
      }
      names.add(node.name);
    });

    return conflicts;
  }

  /**
   * Resolve conflicts
   */
  static resolveConflicts(tree) {
    const seen = new Set();

    return tree.map((node, index) => {
      let newName = node.name;
      while (seen.has(newName)) {
        newName = `${node.name}_${index}`;
      }
      seen.add(newName);
      return { ...node, name: newName };
    });
  }
}
