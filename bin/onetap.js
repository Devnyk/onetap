#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const figlet = require('figlet');
const { showMenu } = require('../src/commands/menu');
const { setupFrontend } = require('../src/commands/frontend');
const { setupBackend } = require('../src/commands/backend');
const { setupFullStack } = require('../src/commands/fullstack');
const { createFromStructure } = require('../src/commands/structure');

// Display OneTap ASCII art
console.log(
  chalk.cyan(
    figlet.textSync('OneTap', {
      font: 'Big',
      horizontalLayout: 'default',
      verticalLayout: 'default',
    })
  )
);

console.log(chalk.yellow('🚀 One command to rule them all!\n'));

program
  .name('onetap')
  .description('CLI to setup frontend, backend, full-stack projects, or custom structures instantly')
  .version('1.0.0');

program
  .command('menu')
  .description('Show interactive setup menu')
  .action(showMenu);

// Simple frontend command (React only for now)
program
  .command('frontend [framework] [project-name]')
  .description('Setup frontend project (currently supports: react)')
  .action((framework, projectName) => {
    setupFrontend(framework || 'react', projectName || 'my-frontend-app');
  });

// Simple backend command (Node.js only for now) 
program
  .command('backend [framework] [project-name]')
  .description('Setup backend project (currently supports: nodejs)')
  .action((framework, projectName) => {
    setupBackend(framework || 'nodejs', projectName || 'my-backend-app');
  });

// Simple fullstack command (MERN only for now)
program
  .command('fullstack [stack] [project-name]')
  .description('Setup full stack project (currently supports: mern)')
  .action((stack, projectName) => {
    setupFullStack(stack || 'mern', projectName || 'my-fullstack-app');
  });

// Structure command for pasted folder structures
program
  .command('structure [project-name]')
  .description('Create project from pasted folder structure')
  .action((projectName) => {
    createFromStructure(projectName || 'my-custom-project');
  });

// Default action - show menu (primary interface)
if (!process.argv.slice(2).length) {
  showMenu();
} else {
  program.parse();
}