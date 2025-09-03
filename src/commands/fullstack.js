// src/commands/fullstack.js
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import logger from "../utils/logger.js";
import { setupFrontend } from "./frontend.js";
import { setupBackend } from "./backend.js";

export async function setupFullStack(projectName = "fullstack-app") {
  const projectPath = path.join(process.cwd(), projectName);

  try {
    logger.info(`🚀 Creating fullstack monorepo: ${projectName}...`);

    // Ensure root project folder
    await fs.ensureDir(projectPath);

    // Save original cwd
    const originalCwd = process.cwd();

    /**
     * FRONTEND SETUP
     */
    process.chdir(projectPath);
    logger.info("🎨 Setting up frontend (React + Tailwind) in /frontend ...");
    await setupFrontend("frontend");
    const frontendPath = path.join(projectPath, "frontend");

    // Extra frontend dependencies
    logger.info("📦 Installing extra frontend dependencies: react-router, axios, react-hook-form ...");
    execSync("npm install react-router-dom axios react-hook-form", {
      cwd: frontendPath,
      stdio: "inherit",
    });

    /**
     * BACKEND SETUP
     */
    process.chdir(projectPath);
    logger.info("🛠️ Setting up backend (Intermediate) in /backend ...");
    await setupBackend("Intermediate", "backend");
    const backendPath = path.join(projectPath, "backend");

    // Restore original working directory
    process.chdir(originalCwd);

    /**
     * SUCCESS MESSAGE
     */
    logger.success(`✅ Fullstack monorepo created at ${projectPath}\n`);
    logger.info("👉 To run your apps:");
    logger.info(`   cd ${projectName}/frontend && npm run dev   # Start frontend`);
    logger.info(`   cd ${projectName}/backend && npm run dev   # Start backend`);
  } catch (error) {
    logger.error("❌ Failed to create fullstack project:", error);
  }
}
