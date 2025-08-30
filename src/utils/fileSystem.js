const fs = require("fs-extra");
const chalk = require("chalk");

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
  } catch (err) {
    console.error(chalk.red(`❌ Failed to create file: ${filePath}`), err.message);
  }
}

module.exports = { ensureDir, createFileSafe };
