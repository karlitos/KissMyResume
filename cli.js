#!/usr/bin/env node

/**
 * Module dependencies.
 */

const fs = require('fs');
const path = require('path');
const program = require('caporal');

const flatTheme = require('jsonresume-theme-flat');

const { logInfo, logSuccess } = require('./log');
const build = require('./build');
const { parseResumeFromSource } = require('./parse');
const { validateResume } = require('./validate');

const DEFAULT_OUTPUT_PATH = './out';
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

// Get the version from package.json
const version = require('./package.json').version;
// Provide it in the CLI
program.version(version, '-v, --version');

// CLI setting for the build command
program.command('build', 'Build your resume to the destination format(s).')
	.argument('<source>', 'The path to the source JSON resume file.')
	.option('-f, --format <format>', 'Set output format (HTML|PDF|YAML|DOCX|PNG|ALL)', formatOptionValidator, 'all')
	.option('-o, --out <directory>', 'Set output directory', outOptionValidator, DEFAULT_OUTPUT_PATH)
	.option('-n, --name <name>', 'Set output file name', nameOptionValidator, DEFAULT_NAME)
	.option('-t, --theme <theme>', 'Set the theme you wish to use', themeOptionValidator, DEFAULT_THEME)
	.action((args, options) => {


		logInfo(`+++ KissMyResume v${version} +++`);

		const sourcePath = path.resolve(process.cwd(), args.source );

		switch (options.format) {
			case 'all':
				build.exportResumeToAllFormats(sourcePath, options.name, options.out, options.theme);
				break;
			case 'html':
				build.exportResumeToHtml(sourcePath, options.name, options.out, options.theme);
				break;
			case 'pdf':
				build.exportResumeToPdf(sourcePath, options.name, options.out, options.theme);
				break;
			case 'png':
				build.exportResumeToPng(sourcePath, options.name, options.out, options.theme);
				break;
			case 'yaml':
				build.exportResumeToYaml(sourcePath, options.name, options.out);
				break;
			case 'docx':
				build.exportResumeToDocx(sourcePath, options.name, options.out, options.theme);
				break;
		}
	});

// CLI setting for the new command
program.command('new', 'Create a new resume in JSON Resume format.')
	.argument('<name>', 'The name for the new resume file.')
	.option('-o, --out <directory>', 'Set output directory', resumeOutOptionValidator, DEFAULT_RESUME_PATH)
	.action((args, options) => {

		logInfo(`+++ KissMyResume v${version} +++`);

		const destinationPath = path.resolve(process.cwd(), options.out );
		const newResumeName = path.basename(args.name, '.json');

		logInfo(`Creating new empty resume ${path.resolve(destinationPath, `${newResumeName}.json`)}`);

		build.exportResumeToJson(path.resolve(__dirname	,'resume/empty-json-resume.json'), newResumeName, destinationPath);
	});

// CLI setting for the validate command
program.command('validate', 'Validate structure and syntax of your resume.')
	.argument('<source>', 'The path to the source JSON resume file to be validate.')
	.action((args, options) => {

		logInfo(`+++ KissMyResume v${version} +++`);

		try {
			const sourcePath = path.resolve(process.cwd(), args.source );
			const {resume, type} = parseResumeFromSource(sourcePath);
			validateResume(resume, type);
		} catch(err) {
			logError(`Resume validation failed! Reason: ${err}`)
		}

	});

// Run KissMyResume by parsing the input arguments
program.parse(process.argv);
