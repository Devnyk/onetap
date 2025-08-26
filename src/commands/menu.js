const inquirer = require('inquirer');
const chalk = require('chalk');
const { setupFrontend } = require('./frontend');
const { setupBackend } = require('./backend');
const { setupFullStack } = require('./fullstack');

const showMenu = async () => {
  try {
    console.log(chalk.cyan('🎯 What would you like to setup today?\n'));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'setupType',
        message: 'Choose your setup option:',
        choices: [
          {
            name: '⚛️  Frontend (React + Vite + Tailwind CSS)',
            value: 'frontend',
            short: 'Frontend'
          },
          {
            name: '🚀 Backend (Node.js + Express + Mongoose)',
            value: 'backend',
            short: 'Backend'
          },
          {
            name: '🔥 Full Stack (MERN - Frontend + Backend)',
            value: 'fullstack',
            short: 'Full Stack'
          },
          new inquirer.Separator(),
          {
            name: '❌ Exit',
            value: 'exit',
            short: 'Exit'
          }
        ],
        pageSize: 6
      }
    ]);

    if (answers.setupType === 'exit') {
      console.log(chalk.yellow('👋 Thanks for using OneTap! Happy coding!'));
      process.exit(0);
    }

    const projectAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Enter your project name:',
        default: answers.setupType === 'frontend' ? 'my-frontend-app' :
                answers.setupType === 'backend' ? 'my-backend-app' : 'my-mern-app',
        validate: (input) => {
          if (input.trim().length === 0) {
            return 'Project name cannot be empty!';
          }
          if (!/^[a-z0-9-_]+$/i.test(input.trim())) {
            return 'Project name can only contain letters, numbers, hyphens, and underscores!';
          }
          return true;
        }
      }
    ]);

    const projectName = projectAnswer.projectName.trim();

    switch (answers.setupType) {
      case 'frontend':
        await setupFrontend(projectName);
        break;
      case 'backend':
        await setupBackend(projectName);
        break;
      case 'fullstack':
        await setupFullStack(projectName);
        break;
      default:
        console.log(chalk.red('❌ Invalid option selected'));
    }

    // Ask if user wants to setup another project
    const continueAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Would you like to setup another project?',
        default: false
      }
    ]);

    if (continueAnswer.continue) {
      console.log('\n' + '='.repeat(50) + '\n');
      await showMenu();
    } else {
      console.log(chalk.green('\n✨ All done! Happy coding! 🚀'));
    }

  } catch (error) {
    console.error(chalk.red('❌ An error occurred:'), error.message);
    process.exit(1);
  }
};

module.exports = { showMenu };