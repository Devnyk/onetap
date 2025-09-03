import fs from "fs";
import path from "path";
import { BackendDetector } from "./backendDetector.js";

/**
 * Enhanced project type detection with nested project support
 */
export function detectProjectType(cwd) {
  let projectInfo = detectInDirectory(cwd);
  if (projectInfo.type !== "unknown") {
    return projectInfo;
  }

  const frontendDirs = ["frontend", "client", "web", "ui", "react", "vue", "angular"];
  for (const subdir of frontendDirs) {
    const subdirPath = path.join(cwd, subdir);
    if (fs.existsSync(subdirPath)) {
      const nestedProject = detectInDirectory(subdirPath);
      if (nestedProject.type !== "unknown") {
        return {
          ...nestedProject,
          basePath: subdirPath,
          isNested: true,
          parentDir: cwd,
          projectFolder: subdir,
        };
      }
    }
  }

  const backendProjects = BackendDetector.detectBackendProjects(cwd);
  if (backendProjects.length > 0) {
    const mainProject = backendProjects[0];
    return {
      type: mainProject.type,
      basePath: BackendDetector.getBackendBaseFolder(mainProject),
      isNested: mainProject.isNested || false,
      framework: mainProject.framework,
      database: mainProject.hasDatabase,
      architecture: mainProject.architecture,
    };
  }

  const allSubdirs = getSubdirectories(cwd);
  for (const subdir of allSubdirs) {
    const subdirPath = path.join(cwd, subdir);
    const nestedProject = detectInDirectory(subdirPath);
    if (nestedProject.type !== "unknown") {
      return {
        ...nestedProject,
        basePath: subdirPath,
        isNested: true,
        parentDir: cwd,
        projectFolder: subdir,
      };
    }
  }

  return { type: "unknown", basePath: cwd };
}

function detectInDirectory(dirPath) {
  const packageJsonPath = path.join(dirPath, "package.json");
  let packageJson = null;

  if (fs.existsSync(packageJsonPath)) {
    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    } catch {}
  }

  if (packageJson) {
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    if (
      deps.vite ||
      fs.existsSync(path.join(dirPath, "vite.config.js")) ||
      fs.existsSync(path.join(dirPath, "vite.config.ts"))
    ) {
      return { type: "vite-frontend", basePath: dirPath };
    }

    if (
      deps.next ||
      fs.existsSync(path.join(dirPath, "next.config.js")) ||
      fs.existsSync(path.join(dirPath, "next.config.ts"))
    ) {
      return { type: "next-frontend", basePath: dirPath };
    }

    if (
      deps.nuxt ||
      fs.existsSync(path.join(dirPath, "nuxt.config.js")) ||
      fs.existsSync(path.join(dirPath, "nuxt.config.ts"))
    ) {
      return { type: "nuxt-frontend", basePath: dirPath };
    }

    if (deps["@angular/core"] || fs.existsSync(path.join(dirPath, "angular.json"))) {
      return { type: "angular-frontend", basePath: dirPath };
    }

    if (deps["@nestjs/core"] || fs.existsSync(path.join(dirPath, "nest-cli.json"))) {
      return { type: "nestjs-backend", basePath: dirPath };
    }

    if (deps.express) {
      return { type: "express-backend", basePath: dirPath };
    }

    if (deps.react) {
      return { type: "react-frontend", basePath: dirPath };
    }

    if (deps.vue) {
      return { type: "vue-frontend", basePath: dirPath };
    }

    if (deps.svelte || deps["@sveltejs/kit"]) {
      return { type: "svelte-frontend", basePath: dirPath };
    }
  }

  return detectByFiles(dirPath);
}

function getSubdirectories(dirPath) {
  try {
    return fs
      .readdirSync(dirPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .filter((name) => !name.startsWith(".") && name !== "node_modules");
  } catch {
    return [];
  }
}

function detectByFiles(dirPath) {
  const checks = [
    { files: ["vite.config.js", "vite.config.ts"], type: "vite-frontend" },
    { files: ["next.config.js", "next.config.ts"], type: "next-frontend" },
    { files: ["angular.json"], type: "angular-frontend" },
    { files: ["nest-cli.json"], type: "nestjs-backend" },
    { files: ["nuxt.config.js", "nuxt.config.ts"], type: "nuxt-frontend" },
    { files: ["server.js", "app.js", "index.js"], type: "express-backend" },
    { files: ["src/index.js", "src/index.tsx", "src/App.js", "src/App.tsx"], type: "react-frontend" },
    { files: ["src/main.js", "src/App.vue"], type: "vue-frontend" },
    { files: ["src/app.html", "svelte.config.js"], type: "svelte-frontend" },
  ];

  for (const check of checks) {
    if (check.files.some((file) => fs.existsSync(path.join(dirPath, file)))) {
      return { type: check.type, basePath: dirPath };
    }
  }

  if (fs.existsSync(path.join(dirPath, "package.json"))) {
    return { type: "nodejs", basePath: dirPath };
  }

  return { type: "unknown", basePath: dirPath };
}

export function getBaseFolder(projectInfo, cwd) {
  if (typeof projectInfo === "string") {
    return cwd;
  }
  return projectInfo.basePath || cwd;
}

export function getIgnorePatterns(projectType) {
  const basePatterns = ["node_modules", ".git", "dist", "build", ".env*"];

  const typeSpecific = {
    "vite-frontend": [".vite", "dist"],
    "next-frontend": [".next", "out"],
    "angular-frontend": ["dist", ".angular"],
    "nuxt-frontend": [".nuxt", ".output"],
    "nestjs-backend": ["dist", "coverage"],
    "react-frontend": ["build"],
    "vue-frontend": ["dist"],
    "svelte-frontend": [".svelte-kit", "build"],
  };

  return [...basePatterns, ...(typeSpecific[projectType] || [])];
}

export function getRecommendedStructure(projectType) {
  const structures = {
    "vite-frontend": {
      folders: ["src", "public", "src/components", "src/assets", "src/utils"],
      files: ["src/main.js", "src/App.jsx", "index.html"],
    },
    "next-frontend": {
      folders: ["pages", "components", "public", "styles", "utils"],
      files: ["pages/index.js", "pages/_app.js"],
    },
    "react-frontend": {
      folders: ["src", "public", "src/components", "src/hooks", "src/utils"],
      files: ["src/index.js", "src/App.js"],
    },
    "express-backend": {
      folders: ["src", "routes", "middleware", "models", "controllers", "utils"],
      files: ["server.js", "src/app.js"],
    },
    "nestjs-backend": {
      folders: ["src", "src/modules", "src/common", "test"],
      files: ["src/main.ts", "src/app.module.ts"],
    },
  };

  return structures[projectType] || { folders: ["src"], files: [] };
}

export function validateTargetDirectory(targetDir) {
  const dangerousPaths = [
    "/",
    "/usr",
    "/bin",
    "/etc",
    "/var",
    "/sys",
    "/proc",
    "C:\\",
    "C:\\Windows",
    "C:\\Program Files",
  ];

  const normalizedPath = path.resolve(targetDir);

  if (
    dangerousPaths.some(
      (dangerous) =>
        normalizedPath === path.resolve(dangerous) ||
        normalizedPath.startsWith(path.resolve(dangerous) + path.sep)
    )
  ) {
    throw new Error(`❌ Cannot operate on system directory: ${targetDir}`);
  }

  return true;
}
