const chalk = require('chalk');
const log = console.log;
const error = console.error;

/**
 * Chalk wrapper for console info output
 * @param text {String} The text to be logged
 */
const logInfo = (text) => log(chalk.white(`\n${text}`));

/**
 * Chalk wrapper for console success output
 * @param text {String} The text to be logged
 */
const logSuccess = (text) => log(chalk.green(`\n${text}`));

/**
 * Chalk wrapper for console error output
 * @param text {String} The text to be logged
 */
const logError = (text) => error(chalk.red(`\n${text}`));

/**
 * Chalk wrapper for console server output
 * @param text {String} The text to be logged
 */
const logServer = (text) => error(chalk.blue(`\n${text}`));

module.exports = {
	logInfo,
	logSuccess,
	logError,
	logServer,
};
