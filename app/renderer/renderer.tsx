/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import '../index.css?raw';
// Don't change the order, override has to come after the main bootstrap
import 'bootstrap3/dist/js/bootstrap';
import 'bootstrap3/dist/css/bootstrap.min.css?raw';
import '../bootstrap-override.css?raw';
import 'ez-space-css/css/ez-space.css?raw';

import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/App/App';

ReactDOM.render(<App />, document.querySelector('#root'));
