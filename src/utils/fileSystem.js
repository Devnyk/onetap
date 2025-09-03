import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

// ----------------- Sync version -----------------
function createFile(dir, filename, content = "") {
  fs.ensureDirSync(dir);
  const filePath = path.join(dir, filename);
  fs.outputFileSync(filePath, content);
  console.log(`✅ File created: ${filePath}`);
  return filePath;
}

// ----------------- Async safe version -----------------
async function ensureDir(dirPath) {
  try {
    await fs.ensureDir(dirPath);
  } catch (err) {
    console.error(chalk.red(`❌ Failed to create directory: ${dirPath}`), err.message);
  }
}

async function createFileSafe(filePath) {
  try {
    if (await fs.pathExists(filePath)) {
      console.log(chalk.yellow(`⚠️ File already exists: ${filePath}`));
      return;
    }
    await fs.ensureFile(filePath);
    await fs.writeFile(filePath, ""); // empty placeholder
    console.log(`✅ File safely created: ${filePath}`);
  } catch (err) {
    console.error(chalk.red(`❌ Failed to create file: ${filePath}`), err.message);
  }
}

// ----------------- Exports -----------------
export {
  // sync utils
  createFile,
  ensureDir as ensureDirAsync, // renamed for clarity
  createFileSafe,
  // wrapped sync helpers
  ensureDirSync,
  writeFileSync,
  exists,
  join
};

// helpers (sync)
function ensureDirSync(dir) {
  return fs.ensureDirSync(dir);
}

function writeFileSync(file, content) {
  return fs.outputFileSync(file, content);
}

function exists(file) {
  return fs.existsSync(file);
}

function join(...args) {
  return path.join(...args);
}
