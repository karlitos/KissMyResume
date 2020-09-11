'use strict';

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const YAML = require('json2yaml');
const HtmlDocx = require('html-docx-js');

const promiseFinally = require('promise.prototype.finally');

const { parseResumeFromSource } = require('./parse');
const { logSuccess, logError } = require('./log');

// Add `finally()` to `Promise.prototype`
promiseFinally.shim();

// Used for PNG output
const CHROME_PAGE_VIEWPORT = {width: 1280, height: 960};

// Which formats are supported
const SUPPORTED_FORMATS = {
	'html': true,
	'pdf': true,
	'yaml': true,
	'docx': true,
	'png': true,
};

/**
 * Exports a HTML markup as HTML file
 * @param markup {string} The HTML Markup containing the rendered resume
 * @param name {string} Name for the output file(s)
 * @param outputPath {string} Path where the output file will be stored
 */
const exportToHtml = (markup, name, outputPath) => {
	fs.writeFile(`${path.resolve(outputPath, name)}.html`, markup, (err) => {
		if (err) throw err;
		logSuccess('The Resume in HTML format has been saved!');
	});
};

/**
 * Exports a parsed resume in YAML format.
 * @param resumeJson {Object} The Object containing the parsed resume
 * @param name {string} Name for the output file
 * @param outputPath {string} Path where the output file will be stored
 */
const exportToYaml = (resumeJson, name, outputPath ) => {
	fs.writeFile(`${path.resolve(outputPath, name)}.yaml`, YAML.stringify(resumeJson), (err) => {
		if (err) throw err;
		logSuccess('The Resume in YAML format has been saved!');
	});
};

/**
 * Exports a parsed resume in JSON format. Used for creating new resume and conversion
 * @param resumeJson {Object} The Object containing the parsed resume
 * @param name {string} Name for the output file
 * @param outputPath {string} Path where the output file will be stored
 */
const exportToJson = (resumeJson, name, outputPath ) => {
	fs.writeFile(`${path.resolve(outputPath, name)}.json`, JSON.stringify(resumeJson), (err) => {
		if (err) throw err;
		logSuccess('The Resume in JSON format has been saved!');
	});
};

/**
 * Exports a HTML markup as PDF document or as a PNG image
 * @param markup {string} The HTML Markup containing the rendered resume
 * @param name {string} Name for the output file(s)
 * @param outputPath {string} Path where the output file will be stored
 * @param toPdf {boolean} Whether or not export to PDF
 * @param toPng {boolean} Whether or not export to PNG
 */
const exportToPdfAndPng = async (markup, name, outputPath, toPdf = true, toPng = true, paperSize = 'A4') => {
	// Do not proceed if no output will be generated
	if (!toPdf && !toPng) { return; }

	let browser;

	try {
		// Launch headless chrome
		browser = await puppeteer.launch({
			headless: true,
			// CHROMIUM_BINARY is defined by webpacks DefinePlugin, when undefined we are not in the APP environment
			executablePath: CHROMIUM_BINARY ? path.resolve(__dirname, CHROMIUM_BINARY) : puppeteer.executablePath()
		});
		const page = await browser.newPage();
		// Set page viewport - important for screenshot
		await page.setViewport(CHROME_PAGE_VIEWPORT);
		// wait until networkidle0 needed when loading external styles, fonts ...
		await page.setContent(markup, { waitUntil: 'networkidle0' });
		// export to PDF
		if (toPdf) {
			// Save as pdf
			await page.pdf(
				{
					format: paperSize,
					path: `${path.resolve(outputPath, name)}.pdf`,
					printBackground: true,
				});
			logSuccess('The Resume in PDF format has been saved!');
		}
		// export to PNG
		if (toPng) {
			// Save as png
			await page.screenshot(
				{
					type: 'png',
					fullPage: true,
					path: `${path.resolve(outputPath, name)}.png`,
				});
			logSuccess('The Resume in PNG format has been saved!');
		}
	} catch(err) {
		throw err;
	} finally {
		// close the browser
		!!browser && await browser.close();
	}
};

/**
 * Exports a HTML markup as Word document in DocX format
 * @param markup {string} The HTML Markup containing the rendered resume
 * @param name {string} Name for the output file(s)
 * @param outputPath {string} Path where the output file will be stored
 */
const exportToDocx = (markup, name, outputPath) => {
	/**
	 * It is possible to define additional options. See https://www.npmjs.com/package/html-docx-js#usage-and-demo
	 *
	 *{
		orientation: 'portrait',
		margins: {
			top: ...,
			right: ...,
			bottom: ...,
			left: ...,
		}
	}
	 */
	const options = {};

	const document = HtmlDocx.asBlob(markup, options);

	fs.writeFile(`${path.resolve(outputPath, name)}.docx`, document, (err) => {
		if (err) throw err;
		logSuccess('The Resume in DOCX format has been saved!');
	});
};

/**
 * Wrapper for efficient export to all supported formats from source
 * @param sourcePath {string} Source path to the resume to be parsed
 * @param name {string} Name for the output file(s)
 * @param outputPath {string} Path where the output files will be stored
 * @param theme {Object} The theme object with exposed render method
 * @param paperSize {string} The string representation of the paper size - see puppeteer options
 * @param outputFormats {Array<string>} Array containing the formats which shall be used for export
 */
const exportToMultipleFormatsFromSource = async (sourcePath, name, outputPath, theme, paperSize, outputFormats = []) => {
	try {
		const resumeJson = parseResumeFromSource(sourcePath).resume;
		// Prefer async rendering
		const markup = theme.renderAsync ? await theme.renderAsync(resumeJson) : await theme.render(resumeJson);
		await exportToMultipleFormats(markup, name, outputPath, theme, paperSize, outputFormats, resumeJson)
	} catch(err) {
		throw err;
	}
};

/**
 * Wrapper for efficient export to all supported formats (from markup)
 * @param markup {string} The markup rendered from the parsed resume
 * @param name {string} Name for the output file(s)
 * @param outputPath {string} Path where the output files will be stored
 * @param theme {Object} The theme object with exposed render method
 * @param paperSize {string} The string representation of the paper size - see puppeteer options
 * @param outputFormats {Array<string>} Array containing the formats which shall be used for export
 * @param resumeJson {Object=} The parsed resume data - optional
 */
const exportToMultipleFormats = async (markup, name, outputPath, theme, paperSize, outputFormats = [], resumeJson) => {
	try {
		const formatsToExport = outputFormats.reduce((acc, currentVal) => {
			if (SUPPORTED_FORMATS[currentVal]) {
				acc[currentVal] = true;
				return acc;
			}
		}, {});

		// Do not bother rendering when no export will be done
		if (Object.keys(formatsToExport).length < 1) { return }

		// html export
		if (formatsToExport.html) {
			exportToHtml(markup, name, outputPath)
		}

		// pdf/png export
		if (formatsToExport.pdf || formatsToExport.png) {
			await exportToPdfAndPng(markup, name,  outputPath, formatsToExport.pdf, formatsToExport.png, paperSize);
		}

		// yaml export
		if (formatsToExport.yaml && resumeJson) {
			exportToYaml(resumeJson, name, outputPath)
		}

		// docs export
		if (formatsToExport.docx) {
			exportToDocx(markup, name, outputPath)
		}
	} catch(err) {
		logError(`Export to multiple formats failed! Reason: ${err}`);
	}
};

/**
 * Wrapper for common steps for most export methods: parse resume and use its output to create the HTML markup. Calls
 * the createMarkup wrapper and returns its output.
 * @param sourcePath {string} Source path to the resume to be parsed
 * @param theme {Object} The theme object with exposed render method
 * @param logging {boolean} Whether the method should do any logging or not
 * @returns {Promise<String>} Promise resolving to HTML markup as a string
 */
const 	createMarkupFromSource = async (sourcePath, theme, logging = true) => {
	try {
		const resumeJson = parseResumeFromSource(sourcePath, logging).resume;
		// Prefer async rendering
		return createMarkup(resumeJson, theme, logging)
	} catch(err) {
		throw err;
	}
};

/**
 * Wrapper for rendering rhe resume: use resume data to create the HTML markup. Calls the renderAsync method or render
 * when no async provided.
 * @param resumeJson {Object} The parsed resume object
 * @param theme {Object} The theme object with exposed render method
 * @returns {Promise<String>} Promise resolving to HTML markup as a string
 */
const createMarkup = async (resumeJson, theme) => {
	try {
		// Prefer async rendering
		return theme.renderAsync ? await theme.renderAsync(resumeJson) : await theme.render(resumeJson);
	} catch(err) {
		throw err;
	}
};

module.exports = {
	exportCvFromSource: async (sourcePath, name, outputPath, theme, paperSize, formats) => {
		try {
			if (formats.length > 0) {
				await exportToMultipleFormatsFromSource(sourcePath, name, outputPath, theme, paperSize, formats)
			} else {
				throw 'No formats specified when exporting CV from source'
			}
		} catch (err) {
			if (formats.length === 1) {
				logError(`Export CV to ${formats[0].toUpperCase()} from source failed! Reason: ${err}`)
			} else {
				logError(`Export CV to multiple format from source failed! Reason: ${err}`)
			}
		}

	},
	exportToMultipleFormats,
	createMarkupFromSource,
	createMarkup,
	exportToJson,
};
