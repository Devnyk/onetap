// src/utils/spinner.js
import ora from "ora";

export const spinner = {
  start: (msg) => ora(msg).start(),
};
