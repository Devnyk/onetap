
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");

// ----------------- Friend's version (sync) -----------------
// dir + filename + content -> always writes with content
function createFile(dir, filename, content = "") {
  fs.ensureDirSync(dir);
  const filePath = path.join(dir, filename);
  fs.outputFileSync(filePath, content);
  console.log(`✅ File created: ${filePath}`);
  return filePath;
}

// ----------------- Your version (async safe) -----------------
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
module.exports = {
  // sync utils
  ensureDirSync: (dir) => fs.ensureDirSync(dir),
  writeFileSync: (file, content) => fs.outputFileSync(file, content),
  exists: (file) => fs.existsSync(file),
  join: (...args) => path.join(...args),
  createFile, // sync version

  // async utils
  ensureDir,
  createFileSafe, // async safe version
};
