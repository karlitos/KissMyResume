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

const CHROME_PAGE_VIEWPORT = {width: 1280, height: 960};

const SUPPORTED_FORMATS = {
	'html': true,
	'pdf': true,
	'yaml': true,
	'docx': true,
	'png': true,
};

// Export to HTML
const exportToHtml = (markup, name, outputPath) => {
	fs.writeFile(`${path.resolve(outputPath, name)}.html`, markup, (err) => {
		if (err) throw err;
		logSuccess('The Resume in HTML format has been saved!');
	});
};

// Export to YAML
const exportToYaml = (resumeJson, name, outputPath ) => {
	fs.writeFile(`${path.resolve(outputPath, name)}.yaml`, YAML.stringify(resumeJson), (err) => {
		if (err) throw err;
		logSuccess('The Resume in YAML format has been saved!');
	});
};

// Export to Json
const exportToJson = (resumeJson, name, outputPath ) => {
	fs.writeFile(`${path.resolve(outputPath, name)}.json`, JSON.stringify(resumeJson), (err) => {
		if (err) throw err;
		logSuccess('The Resume in JSON format has been saved!');
	});
};

// Export to PDF or PNG
const exportToPdfAndPng = async (markup, name, outputPath, toPdf = true, toPng = true) => {
	// Do not proceed if no output will be generated
	if (!toPdf && !toPng) { return; }

	let browser;

	try {
		// Launch headless chrome
		browser = await puppeteer.launch({ headless: true });
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
					format: 'A4',
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
		await browser.close();
	}
};

// Export to Docx
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

// Export to all supported formats
const exportToMultipleFormats = async (source, name, outputPath, theme, outputFormats = []) => {
	try {
		const formatsToExport = outputFormats.reduce((acc, currentVal) => {
			if (SUPPORTED_FORMATS[currentVal]) {
				acc[currentVal] = true;
				return acc;
			}
		}, {});

		// Do not bother rendering when no export will be done
		if (Object.keys(formatsToExport).length < 1) { return }

		const resumeJson = parseResumeFromSource(source).resume;

		const markup = theme.renderAsync ? await theme.renderAsync(resumeJson) : theme.render(resumeJson);

		// html export
		if (formatsToExport.html) {
			exportToHtml(markup, name, outputPath)
		}
		// pdf/png export
		exportToPdfAndPng(markup, name, outputPath, formatsToExport.pdf, formatsToExport.png);

		// yaml export
		if (formatsToExport.yaml) {
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

// Common steps for most export functions
const createMarkupFromSource = async (source, theme) => {
	try {
		const resumeJson = parseResumeFromSource(source).resume;
		return theme.renderAsync ? await theme.renderAsync(resumeJson) : theme.render(resumeJson);
	} catch(err) {
		throw err;
	}

};

module.exports = {
	exportResumeToHtml: async ( source, name, outputPath, theme ) => {
    	try {
			exportToHtml(await createMarkupFromSource(source, theme), name, outputPath);
		} catch (err) {
    		logError(`Export to HTML failed! Reason: ${err}`)
		}
	},
	exportResumeToPdf: async (source, name, outputPath, theme) => {
		try {
			await exportToPdfAndPng(await createMarkupFromSource(source, theme), name, outputPath, true, false);
		} catch(err) {
			logError(`Export to PDF failed! Reason: ${err}`)
		}
	},
	exportResumeToPng: async (source, name, outputPath, theme) => {
		try {
			await exportToPdfAndPng(await createMarkupFromSource(source, theme), name, outputPath, false, true);
		} catch(err) {
			logError(`Export to PNG failed! Reason: ${err}`)
		}
	},
	exportResumeToYaml: (source, name, outputPath) => {
		try {
			exportToYaml(parseResumeFromSource(source).resume, name, outputPath);
		} catch (err) {
			logError(`Export to YAML failed! Reason: ${err}`)
		}
	 },
	exportResumeToJson: (source, name, outputPath) => {
		try {
			exportToJson(parseResumeFromSource(source, false).resume, name, outputPath);
		} catch (err) {
			logError(`Export to JSON failed! Reason: ${err}`)
		}
	},
	exportResumeToDocx: async (source, name, outputPath, theme) => {
		try {
			exportToDocx(await createMarkupFromSource(source, theme), name, outputPath);
		} catch (err) {
			logError(`Export to DOCX failed! Reason: ${err}`)
		}
	},
	exportResumeToAllFormats: (source, name, outputPath, theme) => exportToMultipleFormats(source, name, outputPath, theme, ['html', 'pdf', 'yaml', 'docx']),
};
