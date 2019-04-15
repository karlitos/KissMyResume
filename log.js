const chalk = require('chalk');
const log = console.log;
const error = console.error;

const logInfo = (text) => log(chalk.white(`\n${text}`));

const logSuccess = (text) => log(chalk.green(`\n${text}`));

const logError = (text) => error(chalk.red(`\n${text}`));

module.exports = {
	logInfo,
	logSuccess,
	logError,
};
