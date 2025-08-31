const fs = require("fs-extra");
const path = require("path");

// dir + filename + content  -> always writes with content
function createFile(dir, filename, content = "") {
  fs.ensureDirSync(dir);
  const filePath = path.join(dir, filename);
  fs.outputFileSync(filePath, content);
  console.log(`✅ File created: ${filePath}`);
}

module.exports = {
  ensureDir: (dir) => fs.ensureDirSync(dir),
  writeFile: (file, content) => fs.outputFileSync(file, content),
  exists: (file) => fs.existsSync(file),
  join: (...args) => path.join(...args),
  createFile, // <-- using 3-arg sync version
};
