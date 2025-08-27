const fs = require("fs-extra");
const path = require("path");

async function generateFromStructure(tree, baseDir = process.cwd()) {
  async function walk(node, currentPath) {
    const target = path.join(currentPath, node.name);
    if (!node.children.length) {
      await fs.outputFile(target, "");
    } else {
      await fs.ensureDir(target);
      for (const child of node.children) {
        await walk(child, target);
      }
    }
  }

  for (const child of tree.children) {
    await walk(child, baseDir);
  }
}

module.exports = { generateFromStructure };
