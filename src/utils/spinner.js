const ora = require("ora");

module.exports = {
  start: (msg) => ora(msg).start(),
};
