const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const { setupFrontend } = require("./frontend");
const { setupBackend } = require("./backend");
const { setupFullStack } = require("./fullstack");
const { createFromStructure } = require("./structure");

const showMenu = async () => {
  try {
    console.clear();
    console.log(
      chalk.magenta(
        figlet.textSync("OneTap", { font: "Standard", horizontalLayout: "default" })
      )
    );

    console.log(chalk.cyan("🎯 What would you like to setup today?\n"));

    const { setupType } = await inquirer.prompt([
      {
        type: "list",
        name: "setupType",
        message: "Choose your setup option:",
        choices: [
          { name: "⚛️  Frontend (React + Vite + Tailwind CSS)", value: "frontend" },
          { name: "🚀 Backend (Node.js + Express + MongoDB + Mongoose)", value: "backend" },
          { name: "🔥 Full Stack (MERN: Frontend + Backend)", value: "fullstack" },
          { name: "📂 Custom Structure (Paste your folder structure)", value: "structure" },
          new inquirer.Separator(),
          { name: "❌ Exit", value: "exit" },
        ],
      },
    ]);

    if (setupType === "exit") {
      console.log(chalk.yellow("\n👋 Thanks for using OneTap! Happy coding!\n"));
      process.exit(0);
    }

    // Ask for project name if not structure
    let projectName = "project";
    if (setupType !== "structure") {
      const nameAnswer = await inquirer.prompt([
        {
          type: "input",
          name: "projectName",
          message: "Enter your project name:",
          default:
            setupType === "frontend"
              ? "frontend-app"
              : setupType === "backend"
              ? "backend-app"
              : "fullstack-app",
          validate: (input) =>
            /^[a-z0-9-_]+$/i.test(input.trim())
              ? true
              : "⚠️ Only letters, numbers, - and _ are allowed!",
        },
      ]);
      projectName = nameAnswer.projectName;
    }

    // Execute chosen setup
    switch (setupType) {
      case "frontend":
        await setupFrontend("react", projectName);
        break;
      case "backend":
        await setupBackend("nodejs", projectName);
        break;
      case "fullstack":
        await setupFullStack("mern", projectName);
        break;
      case "structure":
        const { structureName } = await inquirer.prompt([
          {
            type: "input",
            name: "structureName",
            message: "Enter your project name:",
            default: "custom-project",
            validate: (input) =>
              /^[a-z0-9-_]+$/i.test(input.trim())
                ? true
                : "⚠️ Only letters, numbers, - and _ are allowed!",
          },
        ]);
        await createFromStructure(structureName);
        break;
    }

    // Ask user if they want another setup
    const { again } = await inquirer.prompt([
      {
        type: "confirm",
        name: "again",
        message: "Do you want to setup another project?",
        default: false,
      },
    ]);

    if (again) {
      console.log("\n" + chalk.gray("=".repeat(60)) + "\n");
      await showMenu(); // restart loop
    } else {
      console.log(chalk.green("\n✨ All done! Happy coding! 🚀\n"));
      process.exit(0);
    }
  } catch (err) {
    console.error(chalk.red("❌ Error:"), err.message);
    process.exit(1);
  }
};

module.exports = { showMenu };
