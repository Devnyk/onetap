#!/usr/bin/env node

const { program } = require("commander");
const chalk = require("chalk");
const figlet = require("figlet");
const { showMenu } = require("../src/commands/menu");
const { setupFrontend } = require("../src/commands/frontend");
const { setupBackend } = require("../src/commands/backend");
const { setupFullStack } = require("../src/commands/fullstack");
const { createFromStructure } = require("../src/commands/structure");

// ===== ASCII Banner =====
console.log(
  chalk.cyan(
    figlet.textSync("OneTap", {
      font: "Big",
      horizontalLayout: "default",
      verticalLayout: "default",
    })
  )
);
console.log(chalk.yellow("🚀 One command to rule them all!\n"));

// ===== Base CLI Config =====
program
  .name("onetap")
  .description("⚡ Instantly bootstrap frontend, backend, full-stack, or custom structures")
  .version("1.3.0");

// ===== MENU =====
program
  .command("menu")
  .description("Show interactive setup menu")
  .action(async () => {
    try {
      await showMenu();
    } catch (err) {
      console.error(chalk.red("❌ Failed to load menu:"), err.message);
      process.exit(1);
    }
  });

// ===== FRONTEND =====
program
  .command("frontend")
  .description("Setup frontend project (React, Next.js, Vue)")
  .option("--react", "Setup React + Vite + Tailwind project")
  .option("--next", "Setup Next.js project")
  .option("--vue", "Setup Vue 3 + Vite project")
  .option("-n, --name <name>", "Project folder name", "frontend-app")
  .action(async (options) => {
    try {
      if (options.react) {
        await setupFrontend("react", options.name);
      } else if (options.next) {
        await setupFrontend("next", options.name);
      } else if (options.vue) {
        await setupFrontend("vue", options.name);
      } else {
        console.log(chalk.red("❌ Please specify a frontend type: --react | --next | --vue"));
        console.log(chalk.cyan("👉 Example: npx onetap frontend --react -n my-app"));
      }
    } catch (err) {
      console.error(chalk.red("❌ Frontend setup failed:"), err.message);
      process.exit(1);
    }
  });

// ===== BACKEND =====
program
  .command("backend")
  .description("Setup backend project (Beginner or Intermediate)")
  .option("--beginner", "Setup Beginner backend")
  .option("--intermediate", "Setup Intermediate backend")
  .option("-n, --name <name>", "Project folder name")
  .action(async (options) => {
    try {
      if (options.beginner) {
        await setupBackend("Beginner", options.name);
      } else if (options.intermediate) {
        await setupBackend("Intermediate", options.name);
      } else {
        console.log(chalk.red("❌ Please specify a backend level: --beginner | --intermediate"));
        console.log(chalk.cyan("👉 Example: npx onetap backend --beginner -n api-server"));
      }
    } catch (err) {
      console.error(chalk.red("❌ Backend setup failed:"), err.message);
      process.exit(1);
    }
  });


// ===== FULLSTACK =====
program
  .command("fullstack")
  .description("Setup full-stack project (MERN supported)")
  .option("--mern", "Setup MERN (MongoDB + Express + React + Node.js) stack")
  .option("-n, --name <name>", "Project folder name", "fullstack-app")
  .action(async (options) => {
    try {
      if (options.mern) {
        await setupFullStack("mern", options.name);
      } else {
        console.log(chalk.red("❌ Please specify a fullstack type: --mern"));
        console.log(chalk.cyan("👉 Example: npx onetap fullstack --mern -n my-mern-app"));
      }
    } catch (err) {
      console.error(chalk.red("❌ Fullstack setup failed:"), err.message);
      process.exit(1);
    }
  });

// ===== CUSTOM STRUCTURE =====
program
  .command("structure")
  .description("Create project from a pasted folder structure")
  .option("-n, --name <name>", "Project folder name", "custom-project")
  .action(async (options) => {
    try {
      await createFromStructure(options.name);
    } catch (err) {
      console.error(chalk.red("❌ Structure generation failed:"), err.message);
      process.exit(1);
    }
  });

// ===== DEFAULT (No Args) =====
if (!process.argv.slice(2).length) {
  showMenu()
    .catch((err) => {
      console.error(chalk.red("❌ Failed to launch menu:"), err.message);
      process.exit(1);
    });
} else {
  program.parse(process.argv);
}
