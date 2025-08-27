const fs = require("fs-extra");
const path = require("path");

module.exports = {
  ensureDir: (dir) => fs.ensureDirSync(dir),
  writeFile: (file, content) => fs.outputFileSync(file, content),
  exists: (file) => fs.existsSync(file),
  join: (...args) => path.join(...args),
};
