const { setupFrontend } = require("./frontend");
const { setupBackend } = require("./backend");
const chalk = require("chalk");
const path = require("path");
const fs = require("fs-extra");

const setupFullStack = async (framework = "mern") => {
  console.log(chalk.cyan(`\n⚙️ Bootstrapping Fullstack project (${framework.toUpperCase()})...\n`));

  // Default root folder name
  const rootDir = process.cwd();
  const projectName = "fullstack-app";

  // Create root directory if not exist
  if (!fs.existsSync(path.join(rootDir, projectName))) {
    fs.mkdirSync(path.join(rootDir, projectName));
  }

  process.chdir(path.join(rootDir, projectName));

  // Setup frontend
  console.log(chalk.yellow("\n📦 Setting up frontend...\n"));
  await setupFrontend("client", "react");

  // Setup backend
  console.log(chalk.yellow("\n📦 Setting up backend...\n"));
  await setupBackend("server", "nodejs");

  console.log(chalk.green("\n✅ Fullstack project setup complete! 🚀"));
  console.log(chalk.blue(`\n📂 Project structure created:\n
${projectName}/
   ├── client/   (React frontend)
   └── server/   (Node.js backend)\n`));
};

module.exports = { setupFullStack };
