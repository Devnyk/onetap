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

    let projectName = "project";

    switch (setupType) {
      case "frontend":
        // 👉 Ask project name for frontend
        const frontendAns = await inquirer.prompt([
          {
            type: "input",
            name: "projectName",
            message: "Enter your project name:",
            default: "frontend-app",
            validate: (input) =>
              /^[a-z0-9-_]+$/i.test(input.trim())
                ? true
                : "⚠️ Only letters, numbers, - and _ are allowed!",
          },
        ]);
        projectName = frontendAns.projectName;
        await setupFrontend("react", projectName);
        break;

     case "backend":
  const { level } = await inquirer.prompt([
    {
      type: "list",
      name: "level",
      message: "Select backend level:",
      choices: [
        { name: "Beginner (Basic structure)", value: "Beginner" },
        { name: "Intermediate (With models & routes)", value: "Intermediate" },
      ],
    },
  ]);

  const backendAns = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "Enter your backend project name:",
      default: `backend-${level.toLowerCase()}`,
    },
  ]);

  await setupBackend(level, backendAns.projectName);
  break;


    case "fullstack":
  // 👉 Ask project name for fullstack
  const fullstackAns = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "Enter your project name:",
      default: "fullstack-app",
      validate: (input) =>
        /^[a-z0-9-_]+$/i.test(input.trim())
          ? true
          : "⚠️ Only letters, numbers, - and _ are allowed!",
    },
  ]);
  projectName = fullstackAns.projectName;

  // ✅ Call fullstack setup (Intermediate backend + React + Tailwind, in monorepo)
  await setupFullStack(projectName);
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
