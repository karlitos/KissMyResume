#!/usr/bin/env node

/**
 * Module dependencies.
 */

const fs = require('fs');
const path = require('path');
const { program } = require("@caporal/core");

const flatTheme = require('jsonresume-theme-flat');

const { logInfo, logSuccess, logError, setLogLevelToDebug, getErrorCount } = require('./log');
const build = require('./build');
const { parseResumeFromSource } = require('./parse');
const { validateResume } = require('./validate');

const { DEFAULT_PORT, serveResume, stopServingResume } = require('./serve');

const DEFAULT_OUTPUT_PATH = './resume out';
const DEFAULT_RESUME_PATH = './resume';
const DEFAULT_NAME = 'resume';
const DEFAULT_THEME = 'jsonresume-theme-flat';
const SUPPORTED_FORMATS = {
	'html': true,
	'pdf': true,
	'yaml': true,
	'docx': true,
	'png': true,
};
// Paper sizes supported by Puppeteer
// https://github.com/puppeteer/puppeteer/blob/v2.0.0/docs/api.md#pagepdfoptions
const SUPPORTED_PAPER_SIZES = {
	'Letter': true,
	'Legal': true,
	'Tabloid': true,
	'Ledger': true,
	'A0': true,
	'A1': true,
	'A2': true,
	'A3': true,
	'A4': true,
	'A5': true,
	'A6': true
  };


/**
 * Validator method for the format option flag
 * @param opt {string} The format option flag value
 * @returns {string} The processed format option flag value
 */
const formatOptionValidator = (opt) => {

	const allowedFormats = Object.entries(SUPPORTED_FORMATS).map(([format, allowed]) => {
		if (allowed) return format;
	}).concat('all');

	if (opt === true) {
		throw new Error(`You have to choose one of these formats: ${allowedFormats}`);
	}

	const option = opt.toLowerCase();

	if (allowedFormats.includes(option) === false) {
		throw new Error(`At the moment only following formats are supported: ${allowedFormats}`);
	}
	return option;
};

/**
 * Validator method for the paper-size option flag
 * @param opt {string} The paper-size option flag value
 * @returns {string} The processed paper-size option flag value
 */
const paperSizeOptionValidator = (opt) => {

	const allowedPaperSizes = Object.entries(SUPPORTED_PAPER_SIZES).map(([paperSize, allowed]) => {
		if (allowed) return paperSize;
	});

	if (opt === true) {
		throw new Error(`You have to choose one of these paper sizes: ${allowedPaperSizes}`);
	}

	const option = opt.charAt(0).toUpperCase() + opt.slice(1).toLowerCase()

	if (allowedPaperSizes.includes(option) === false) {
		throw new Error(`At the moment only following paper sizes are supported: ${allowedPaperSizes}`);
	}
	return option;
};

/**
 * Validator method for the out option flag
 * @param opt {string} The out option flag value
 * @param defaultPath {string} The default path to which no provided path will resolve
 * @returns {string} The processed out option flag value
 */
const outOptionValidator = (opt, defaultPath = DEFAULT_OUTPUT_PATH) => {

	const dir = path.resolve(process.cwd(), opt === true ? defaultPath : opt);

	try {
		fs.mkdirSync(dir);
	} catch (err) {
		if (err.code == 'EEXIST') {
			if (fs.lstatSync(dir).isDirectory()) {
				return dir
			}
		} else if (err.code == 'EACCES') {
			throw new Error(`Cannot create output directory ${dir}: permission denied!`);
		}
		else {
			throw new Error(`Problem with selected output directory ${dir}: ${err}!`);
		}
	}

	return dir
};

/**
 * Validator method for the name option flag
 * @param opt {string} The name option flag value
 * @returns {string} The processed name option flag value
 */
const nameOptionValidator = (opt) => {
	return opt === true ? DEFAULT_NAME : opt;
};

/**
 * Validator method for the theme option flag. Different provided values will be supported: short theme name (flat),
 * full theme name (jsonresume-theme-flat) or path to a local theme.
 * @param opt {string} The theme option flag value
 * @returns {Object} The selected theme
 */
const themeOptionValidator = (opt) => {
	// the default theme is flatTheme
	if (opt === true ) return flatTheme;

	let theme;
	// check if theme is a path
	try {
		if (fs.existsSync(opt)) {
			theme = require(path.resolve(opt));
		} else {
			// no local path - could be a theme name
			let themeName = opt;
			// support partial theme names
			if(!themeName.match('jsonresume-theme-.*')){
				themeName = `jsonresume-theme-${themeName}`;
			}
			theme = require(themeName);
		}
		if (typeof theme.render === 'function') {
			// might be a theme, provide
			return theme;
		} else {
			throw new Error(`The provided theme ${opt} does not provide the render function!`);
		}
	}
	catch(err) {
		throw err;
	}
};

/**
 * Validator method for the out option flag when creating a new resume
 * @param opt {string} The out option flag value
 * @returns {string} The processed out option flag value
 */
const resumeOutOptionValidator = (opt) => {
	return outOptionValidator(opt, DEFAULT_RESUME_PATH)
};

/**
 * Validator method for the port option flag when serving a resume with a web server
 * @param opt {string} The port option flag value
 * @returns {port} The processed out option flag value
 */
const serverPortOptionValidator = (opt) => {
	const portNr = parseInt(opt);
	if (!(Number.isInteger(portNr) && portNr >= 0 && portNr <= 65535)) {
		throw new Error(`The provided value ${opt} is not valid port number!`);
	}
	return portNr;
};


// Get the version from package.json
const version = require('../package.json').version;
// Provide it in the CLI
program.version(version);

// CLI setting for the "build" command
program.command('build', 'Build your resume to the destination format(s).')
	.argument('<source>', 'The path to the source JSON resume file.')
	.option('-f, --format <format>', 'Set output format (HTML|PDF|YAML|DOCX|PNG|ALL)', { validator: formatOptionValidator, default: 'all' })
	.option('-p, --paper-size <paper-size>', 'Set output size for PDF files (A4|Letter|Legal|Tabloid|Ledger|A0|A1|A2|A3|A5|A6)', { validator: paperSizeOptionValidator, default: 'A4' })
	.option('-o, --out <directory>', 'Set output directory', { validator: outOptionValidator, default: DEFAULT_OUTPUT_PATH })
	.option('-n, --name <name>', 'Set output file name', { validator: nameOptionValidator, default: DEFAULT_NAME })
	.option('-t, --theme <theme>', 'Set the theme you wish to use', { validator: themeOptionValidator, default: DEFAULT_THEME })
	.action(( {args, options, logger }) => {


		logInfo(`+++ KissMyResume v${version} +++`);
		// set log level to debug if global verbose parameter was set
		if (logger.level === 'silly') { setLogLevelToDebug() }

		const sourcePath = path.resolve(process.cwd(), args.source );

		switch (options.format) {
			case 'all':
				build.exportCvFromSource(sourcePath, options.name, options.out, options.theme, options.paperSize, ['html', 'pdf', 'yaml', 'docx']);
				break;
			case 'html':
				build.exportCvFromSource(sourcePath, options.name, options.out, options.theme, null,['html']);
				break;
			case 'pdf':
				build.exportCvFromSource(sourcePath, options.name, options.out, options.theme, options.paperSize, ['pdf']);
				break;
			case 'png':
				build.exportCvFromSource(sourcePath, options.name, options.out, options.theme, null,['png']);
				break;
			case 'yaml':
				build.exportCvFromSource(sourcePath, options.name, options.out, null,['yaml']);
				break;
			case 'docx':
				build.exportCvFromSource(sourcePath, options.name, options.out, null,['docx']);
				break;
		}
	});

// CLI setting for the "new" command
program.command('new', 'Create a new resume in JSON Resume format.')
	.argument('<name>', 'The name for the new resume file.')
	.option('-o, --out <directory>', 'Set output directory', { validator: resumeOutOptionValidator, default: DEFAULT_RESUME_PATH })
	.action(({ args, options, logger }) => {

		logInfo(`+++ KissMyResume v${version} +++`);
		// set log level to debug if global verbose parameter was set
		if (logger.level === 'silly') { setLogLevelToDebug() }

		const destinationPath = path.resolve(process.cwd(), options.out );
		const newResumeName = path.basename(args.name, '.json');

		logInfo(`Creating new empty resume ${path.resolve(destinationPath, `${newResumeName}.json`)}`);

		build.exportResumeToJson(path.resolve(__dirname	,'resume/empty-json-resume.json'), newResumeName, destinationPath);
	});

// CLI setting for the "validate" command
program.command('validate', 'Validate structure and syntax of your resume.')
	.argument('<source>', 'The path to the source JSON resume file to be validate.')
	.action(({ args, options, logger }) => {

		logInfo(`+++ KissMyResume v${version} +++`);
		// set log level to debug if global verbose parameter was set
		if (logger.level === 'silly') { setLogLevelToDebug() }

		try {
			const sourcePath = path.resolve(process.cwd(), args.source );
			const {resume, type} = parseResumeFromSource(sourcePath);
			validateResume(resume, type);
		} catch(err) {
			logError(`Resume validation failed! Reason: ${err}`)
		}

	});

// CLI setting for the "serve" command
program.command('serve', 'Show your resume in a browser with hot-reloading upon resume changes')
	.argument('<source>', 'The path to the source JSON resume file to be served.')
	.option('-t, --theme <theme>', 'Set the theme you wish to use', { validator: themeOptionValidator, default: DEFAULT_THEME })
	.option('-p, --port <theme>', 'Set the port the webserver will be listening on', { validator: serverPortOptionValidator, default: DEFAULT_PORT })
	.action(async ({ args, options, logger }) => {

		logInfo(`+++ KissMyResume v${version} +++`);
		// set log level to debug if global verbose parameter was set
		if (logger.level === 'silly') { setLogLevelToDebug() }

		try {
			const sourcePath = path.resolve(process.cwd(), args.source );
			await serveResume(sourcePath, options.theme, options.port);

			process.on('SIGINT', () => {
				logInfo( "Gracefully shutting down from Ctrl-C (SIGINT)" );
				stopServingResume().then((message) => {
					logSuccess(message);
					process.exit(1);
				})
			});
		} catch(err) {
			logError(`Resume serving failed! Reason: ${err}`);
			process.exit(0);
		}

	});

// Run KissMyResume by parsing the input arguments
program.run(process.argv.slice(2))
	   .then(() => {
		   const errorCount = getErrorCount();
		   if (errorCount > 0) {
			   console.error(`KissMyResume finished with ${errorCount} error${errorCount > 1 ? 's' : ''}`);

		   }
	   });
