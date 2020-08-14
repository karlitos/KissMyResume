const express = require('express');
const fs = require('fs');
const path = require('path');
const reload = require('reload');
const open = require('open');

/**
 * The port, the webserver will be listening on
 */
const DEFAULT_PORT = 3000;
/**
 * The polling rate with which the watcher will be looking for resume changes
 */
const POLLING_RATE = 2000;
/**
 * server The server instance created with the express framework.
 */
let server;
let markup;

const { logInfo, logSuccess, logServer } = require('../log');
const { createMarkupFromSource } = require('./build');

const app = express();

const serveResume = async (sourcePath, theme, port = DEFAULT_PORT) => {
	try {
		// Try to generate the markup in the first place to see whether to continue
		markup = await createMarkupFromSource(sourcePath, theme, false);
		// Set up the port
		app.set('port', port);
		// Set up the main path
		app.get('/', async (req, res) => {
			// Do not create the markup when it already exist (for whatever reason)
			// TODO: improve (fix) error handling when createMarkupFromSource throws an error
			markup = !!markup ? markup : await createMarkupFromSource(sourcePath, theme, false);
			// Add the script tag with the replace javascript link to the end of the Html body to enable hot-reloading
			res.send(markup.replace(/(<\/body>)/i, '<script src="/reload/reload.js"></script>\n</body>'));
			// Get sure the markup will be created next time
			markup = null;
		});

		const reloadServer = await reload(app);
		// Reload started, start web server
		server = app.listen(port, async () => {
			logServer(`You can view your resume in Webbrowser on address: ${url}`);
		});

		// Set up the resume watcher
		fs.watchFile(sourcePath, { interval: POLLING_RATE }, (curr, prev) => {
			logServer(`Resume ${path.basename(sourcePath)} change detected - reloading`);
			reloadServer.reload();
		});

		// Opens the url in the default browser
		const url = `http://www.localhost:${port}`;
		await open(url);
		logInfo('Resume opened in the default browser.')
	} catch (err) {
		// Handle error
		throw new Error(`Problem when (re)loading the Webserver, serving the resume: ${err}`);
	}
};

/**
 * Stops the server serving the resume.
 */
const stopServingResume = () => {
	return new Promise((resolve, reject) => {
		if (!server) {
			reject('The server is not running and thus could not be stopped');
			return;
		}
		// stop the server
		server.close(() => {
			// TODO: Server close is not sufficient - see https://stackoverflow.com/questions/14626636/how-do-i-shutdown-a-node-js-https-server-immediately
			resolve('The server serving the resume stopped successfully!');
		});
	});
};

module.exports = {
	DEFAULT_PORT,
	serveResume,
	stopServingResume
};
