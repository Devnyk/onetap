// src/commands/createFromStructure.js
import inquirer from "inquirer";
import chalk from "chalk";
import readline from "readline";

import { parseFolderTree } from "../parsers/folderParser.js";
import { detectProjectType, getBaseFolder } from "../utils/projectDetector.js";
import { smartMerge } from "../utils/smartMerger.js";

export async function createFromStructure() {
  try {
    const cwd = process.cwd();
    const projectInfo = detectProjectType(cwd);
    const baseDir = getBaseFolder(projectInfo, cwd);

    // Handle nested projects display
    if (projectInfo.isNested) {
      console.log(chalk.cyan(`🔍 Detected nested project: ${projectInfo.type}`));
      console.log(chalk.cyan(`📂 Project location: ${projectInfo.projectFolder}/`));
      console.log(chalk.cyan(`📂 Target directory: ${baseDir}`));
    } else {
      console.log(chalk.cyan(`🔍 Detected project type: ${projectInfo.type || projectInfo}`));
      console.log(chalk.cyan(`📂 Base directory: ${baseDir}`));
    }

    // Cross-platform compatible input method
    console.log(chalk.yellow("\n📝 Please paste your folder structure:"));
    console.log(chalk.gray("(Paste the structure and press Enter twice when done)\n"));

    let structure = "";
    let emptyLineCount = 0;

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    await new Promise((resolve) => {
      rl.on("line", (line) => {
        if (line.trim() === "") {
          emptyLineCount++;
          if (emptyLineCount >= 2) {
            rl.close();
            resolve();
            return;
          }
        } else {
          emptyLineCount = 0;
          structure += line + "\n";
        }
      });

      rl.on("close", () => {
        resolve();
      });
    });

    if (!structure.trim()) {
      console.log(chalk.red("❌ No structure provided! Aborting..."));
      return;
    }

    const parsed = parseFolderTree(structure);
    if (!parsed.length) {
      console.log(chalk.red("❌ Could not parse folder structure!"));
      return;
    }

    console.log(chalk.blue("\n🔄 Processing structure..."));
    console.log(chalk.gray("• Existing files with content will be preserved"));
    console.log(chalk.gray("• Only missing files and folders will be created"));
    console.log(chalk.gray("• Critical config files are automatically protected"));

    const options = {
      preserveContent: true, // Always preserve content
      skipCritical: true, // Always protect critical files
      dirsOnly: false, // Create both folders and files
      verbose: true, // Always show what's happening
      projectType: projectInfo.type || projectInfo,
      isNested: projectInfo.isNested || false,
    };

    await smartMerge(parsed, baseDir, options);

    console.log(chalk.green("\n✅ Structure merged successfully! 🚀"));
    console.log(chalk.blue("💡 All existing files with content were automatically preserved."));
  } catch (err) {
    console.error(chalk.red("❌ Failed to create structure:"), err.message);
  }
}
