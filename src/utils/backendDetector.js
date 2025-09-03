import fs from "fs";
import path from "path";

/**
 * Enhanced backend project detection with multiple project support
 */
export class BackendDetector {
  /**
   * Detect backend projects with their specific folder structures
   */
  static detectBackendProjects(cwd) {
    const projects = [];

    // Check current directory
    const currentProject = this.analyzeDirectory(cwd);
    if (currentProject) {
      projects.push(currentProject);
    }

    // Check common backend subdirectories
    const backendDirs = ["server", "backend", "api", "services", "microservices"];

    for (const dir of backendDirs) {
      const dirPath = path.join(cwd, dir);
      if (fs.existsSync(dirPath)) {
        const project = this.analyzeDirectory(dirPath);
        if (project) {
          project.isNested = true;
          project.parentDir = cwd;
          project.folderName = dir;
          projects.push(project);
        }
      }
    }

    return projects;
  }

  /**
   * Analyze a directory for backend project patterns
   */
  static analyzeDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return null;

    const packageJsonPath = path.join(dirPath, "package.json");
    let packageJson = null;

    // Read package.json if available
    if (fs.existsSync(packageJsonPath)) {
      try {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      } catch {
        // Continue without package.json
      }
    }

    // Detect specific backend frameworks
    const detection = this.detectFramework(dirPath, packageJson);
    if (detection) {
      return {
        type: detection.type,
        framework: detection.framework,
        basePath: dirPath,
        hasDatabase: this.detectDatabase(packageJson),
        architecture: this.detectArchitecture(dirPath),
        srcFolder: this.findSrcFolder(dirPath),
      };
    }

    return null;
  }

  /**
   * Detect specific backend framework
   */
  static detectFramework(dirPath, packageJson) {
    // NestJS
    if (this.hasFile(dirPath, "nest-cli.json") || this.hasDependency(packageJson, "@nestjs/core")) {
      return { type: "nestjs-backend", framework: "NestJS" };
    }

    // Express.js
    if (
      this.hasDependency(packageJson, "express") ||
      this.hasFile(dirPath, "server.js") ||
      this.hasFile(dirPath, "app.js")
    ) {
      return { type: "express-backend", framework: "Express" };
    }

    // Fastify
    if (this.hasDependency(packageJson, "fastify")) {
      return { type: "fastify-backend", framework: "Fastify" };
    }

    // Koa
    if (this.hasDependency(packageJson, "koa")) {
      return { type: "koa-backend", framework: "Koa" };
    }

    // Hapi
    if (this.hasDependency(packageJson, "@hapi/hapi")) {
      return { type: "hapi-backend", framework: "Hapi" };
    }

    // Django (Python)
    if (this.hasFile(dirPath, "manage.py") || this.hasFile(dirPath, "django_project")) {
      return { type: "django-backend", framework: "Django" };
    }

    // Flask (Python)
    if (this.hasFile(dirPath, "app.py") && this.hasFile(dirPath, "requirements.txt")) {
      return { type: "flask-backend", framework: "Flask" };
    }

    // Spring Boot (Java)
    if (this.hasFile(dirPath, "pom.xml") || this.hasFile(dirPath, "build.gradle")) {
      return { type: "spring-backend", framework: "Spring Boot" };
    }

    // Laravel (PHP)
    if (this.hasFile(dirPath, "artisan") || this.hasFile(dirPath, "composer.json")) {
      return { type: "laravel-backend", framework: "Laravel" };
    }

    // Ruby on Rails
    if (this.hasFile(dirPath, "Gemfile") && this.hasFile(dirPath, "config/application.rb")) {
      return { type: "rails-backend", framework: "Ruby on Rails" };
    }

    // Generic Node.js
    if (
      packageJson &&
      !this.hasDependency(packageJson, "react") &&
      !this.hasDependency(packageJson, "vue") &&
      !this.hasDependency(packageJson, "svelte")
    ) {
      return { type: "nodejs-backend", framework: "Node.js" };
    }

    return null;
  }

  /**
   * Detect database integrations
   */
  static detectDatabase(packageJson) {
    if (!packageJson) return null;

    const dbDeps = {
      mongodb: ["mongoose", "mongodb"],
      postgresql: ["pg", "postgres", "knex", "sequelize"],
      mysql: ["mysql", "mysql2", "sequelize"],
      sqlite: ["sqlite3", "better-sqlite3"],
      redis: ["redis", "ioredis"],
      prisma: ["prisma", "@prisma/client"],
      typeorm: ["typeorm"],
      drizzle: ["drizzle-orm"],
    };

    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    for (const [dbType, packages] of Object.entries(dbDeps)) {
      if (packages.some((pkg) => deps[pkg])) {
        return dbType;
      }
    }

    return null;
  }

  /**
   * Detect project architecture pattern
   */
  static detectArchitecture(dirPath) {
    const patterns = {
      mvc: ["models", "views", "controllers"],
      clean: ["domain", "infrastructure", "application"],
      layered: ["services", "repositories", "controllers"],
      microservice: ["services", "gateway", "common"],
      monorepo: ["packages", "apps", "libs"],
    };

    for (const [arch, folders] of Object.entries(patterns)) {
      const matchCount = folders.filter(
        (folder) =>
          fs.existsSync(path.join(dirPath, folder)) ||
          fs.existsSync(path.join(dirPath, "src", folder)),
      ).length;

      if (matchCount >= 2) {
        return arch;
      }
    }

    return "standard";
  }

  /**
   * Find the appropriate src folder for the project
   */
  static findSrcFolder(dirPath) {
    const possibleSrcDirs = ["src", "lib", "app", "source"];

    for (const srcDir of possibleSrcDirs) {
      const srcPath = path.join(dirPath, srcDir);
      if (fs.existsSync(srcPath)) {
        return srcPath;
      }
    }

    return dirPath;
  }

  /**
   * Check if file exists in directory
   */
  static hasFile(dirPath, filename) {
    return fs.existsSync(path.join(dirPath, filename));
  }

  /**
   * Check if package.json has specific dependency
   */
  static hasDependency(packageJson, depName) {
    if (!packageJson) return false;

    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
    };

    return !!deps[depName];
  }

  /**
   * Get recommended base folder for backend projects
   */
  static getBackendBaseFolder(projectInfo) {
    if (projectInfo.architecture === "monorepo") {
      const appsDir = path.join(projectInfo.basePath, "apps");
      if (fs.existsSync(appsDir)) {
        return appsDir;
      }
    }

    return projectInfo.srcFolder || projectInfo.basePath;
  }
}
