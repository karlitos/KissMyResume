const chalk = require('chalk');
const log = console.log;
const error = console.error;

let includeStacktrace = false;
let errorCounter = 0;

/**
 * Chalk wrapper for console info output
 * @param text {String} The text to be logged
 */
const logInfo = (text) => log(chalk.white(`\n${text}`));

/**
 * Chalk wrapper for console success output
 * @param text {String} The text to be logged
 */
const logSuccess = (text) => {
	log(chalk.green(`\n${text}`));
}

/**
 * Chalk wrapper for console error output
 * @param text {String} The text to be logged
 */
const logError = (err) => {

	errorCounter ++;
	const debugOutput = includeStacktrace && err.stack ? `\nReason: ${err.stack}` : '';
	error(chalk.red(`\n${err}${debugOutput}`));
};

/**
 * Chalk wrapper for console server output
 * @param text {String} The text to be logged
 */
const logServer = (text) => log(chalk.blue(`\n${text}`));

module.exports = {
	logInfo,
	logSuccess,
	logError,
	logServer,
	setLogLevelToDebug: () => includeStacktrace = true,
	getErrorCount: () => errorCounter
};