const inquirer = require("inquirer");
const chalk = require("chalk");
const { parseFolderTree } = require("../parsers/folderParser");
const { generateFromStructure } = require("../parsers/templateGenerator");

async function createFromStructure() {
  try {
    const { structure } = await inquirer.prompt([
      {
        type: "editor",
        name: "structure",
        message: "Paste your folder structure here (text tree):",
      },
    ]);

    if (!structure.trim()) {
      console.log(chalk.red("❌ Empty structure!"));
      return;
    }

    const parsed = parseFolderTree(structure);
    await generateFromStructure(parsed);

    console.log(chalk.green("\n✅ Project created from structure! 🚀"));
  } catch (err) {
    console.error(chalk.red("❌ Failed to create structure:"), err.message);
  }
}

module.exports = { createFromStructure };
