import chalk from "chalk";

const prefix = {
  info: "ℹ️",
  success: "✅",
  warn: "⚠️",
  error: "❌",
};

const logger = {
  info: (msg) => console.log(chalk.blue(`${prefix.info} ${msg}`)),
  success: (msg) => console.log(chalk.green(`${prefix.success} ${msg}`)),
  warn: (msg) => console.log(chalk.yellow(`${prefix.warn} ${msg}`)),
  error: (msg) => console.log(chalk.red(`${prefix.error} ${msg}`)),
};

export default logger;
