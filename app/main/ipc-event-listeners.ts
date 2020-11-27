import { IThemeEntry } from '../definitions';
import { BrowserView, BrowserWindow, dialog, IpcMainInvokeEvent } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { createMarkup, exportToMultipleFormats } from '../../lib/build';
import { installLocalTheme, uninstallTheme, fetchTheme, getThemeList, getlTheme } from './theme-helpers';
import { logSuccess } from '../../lib/log';

let OFFSCREEN_RENDERER: BrowserWindow;
const CV_EXPORT_TIMEOUT = 5000;

/**
 * The listener for events on the 'open-cv' channel
 */
export const openCvListener = async (): Promise<null | Record<string, any>> => {
    try {
        const openDialogReturnVal = await  dialog.showOpenDialog({
            title: 'Open your CV data in JSON format',
            filters: [
                {
                    name: 'JSON files',
                    extensions: ['json'],
                }
            ],
            properties: ['openFile']
        });

        if (openDialogReturnVal && !openDialogReturnVal.canceled) {
            //  built-in Promise implementations of the fs module
            const cvData = await fs.promises.readFile(openDialogReturnVal.filePaths[0]);
            return JSON.parse(cvData.toString())
        }
        // Return null if no data loaded
        return null;
    } catch (err) {
        return Promise.reject(`An error occurred when opening the CV data: ${err}`);
    }
};

/**
 * The listener for events on the 'save-cv' channel
 * @param evt {IpcMainInvokeEvent} The invoke event
 * @param cvData {Object} The structured CV data
 */
export const saveCvListener = async (evt: IpcMainInvokeEvent, cvData: Record<string, any>): Promise<any> => {
    try {
        const saveDialogReturnVal = await  dialog.showSaveDialog({
            title: 'Select where to save your resume in JSON format',
            showsTagField: false,
            properties: ['createDirectory', 'showOverwriteConfirmation']
        });

        if (saveDialogReturnVal && !saveDialogReturnVal.canceled) {
            const parsedFilePath = path.parse(saveDialogReturnVal.filePath);
            await fs.promises.writeFile(`${path.resolve(parsedFilePath.dir, parsedFilePath.name)}.json`,  JSON.stringify(cvData));
        }

        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err)
    }
};

/**
 * Method processing the CD data an doing the export in different format if desired.
 * @param evt {IpcMainInvokeEvent} The invoke event
 * @param cvData {Object} The structured CV data
 * @param theme {IThemeEntry} The selected theme which should be used for creating HTML markup
 * @param selectedFormatsForExport {Object} The object with the selected formats for export
 * @param exportCvAfterProcessing {boolean} Whether or not should the CV be exported after processing
 */
export const processCvListener = async (evt: IpcMainInvokeEvent, cvData: Record<string, any>, theme: IThemeEntry,
                                        selectedFormatsForExport: Record<string, any>, exportCvAfterProcessing: boolean) => {
    try {
        const themeModule = await getlTheme(theme);
        // IDEA: run the theme render fn in sandbox - https://www.npmjs.com/package/vm2
        const markup = await createMarkup(cvData, themeModule);
        // setting of the preview content via loadURL with  data-uri encoded markup is not the most robust solutions. It might
        // be necessary to go with file-based buffering, see https://github.com/electron/electron/issues/1146#issuecomment-591983815
        // alternatively https://github.com/remarkablemark/html-react-parser
        await BrowserView.fromId(2).webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(markup)}`);
        // export CV if desired
        if (exportCvAfterProcessing) {

            const saveDialogReturnVal = await  dialog.showSaveDialog({
                title: 'Select where to export your resume',
                showsTagField: false,
                properties: ['createDirectory', 'showOverwriteConfirmation']
            });

            if (saveDialogReturnVal && !saveDialogReturnVal.canceled) {
                const parsedFilePath = path.parse(saveDialogReturnVal.filePath);

                // PDF export
                if (selectedFormatsForExport.pdf) {
                    const pdfData = await BrowserView.fromId(2).webContents.printToPDF({pageSize: 'A4', landscape: false});
                    await fs.promises.writeFile(`${path.resolve(parsedFilePath.dir, parsedFilePath.name)}.pdf`, pdfData);
                    logSuccess('The Resume in PDF format has been saved!');
                }

                if (selectedFormatsForExport.png) {
                    const pageRect = await BrowserView.fromId(2).webContents.executeJavaScript(
                        `(() => { return {x: 0, y: 0, width: document.body.offsetWidth, height: document.body.offsetHeight}})()`);

                    OFFSCREEN_RENDERER = new BrowserWindow({
                        enableLargerThanScreen: true,
                        show: false,
                        webPreferences: {
                            offscreen: true,
                            nodeIntegration: false, // is default value after Electron v5
                            contextIsolation: true, // protect against prototype pollution
                            enableRemoteModule: false, // turn off remote
                        }
                    });

                    const timeout = setTimeout(() => { throw 'Exporting of the resume timed out!'}, CV_EXPORT_TIMEOUT);

                    // Export the 'painted' image as screenshot
                    OFFSCREEN_RENDERER.webContents.on('paint', async (evt, dirtyRect, image) => {
                        await fs.promises.writeFile(`${path.resolve(parsedFilePath.dir, parsedFilePath.name)}.png`, image.toPNG());
                        clearTimeout(timeout);
                        logSuccess('The Resume in PNG format has been saved!');
                        OFFSCREEN_RENDERER.destroy();
                    });

                    // PNG export
                    OFFSCREEN_RENDERER.setContentSize(pageRect.width, pageRect.height);
                    await OFFSCREEN_RENDERER.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(markup)}`);
                    await OFFSCREEN_RENDERER.webContents.insertCSS('html, body {overflow: hidden}');
                    // const screenshot = await OFFSCREEN_RENDERER.webContents.capturePage(pageRect);
                    // await fs.promises.writeFile(`${saveDialogReturnVal.filePath}.png`, screenshot.toPNG());
                    // logSuccess('The Resume in PNG format has been saved!');
                }

                const remainingOutputFormats = Object.keys(selectedFormatsForExport).reduce((formats, currentFormat): Array<string> => {
                    if (currentFormat !== 'pdf' && currentFormat !== 'png' && selectedFormatsForExport[currentFormat]) {
                        formats.push(currentFormat);
                    }
                    return formats;
                }, []);

                // HTML & DOCX export
                await exportToMultipleFormats(markup, parsedFilePath.name, parsedFilePath.dir, themeModule, 'A4', remainingOutputFormats);
            }
        }
        return Promise.resolve(markup);
    } catch (err) {
        if (OFFSCREEN_RENDERER && !OFFSCREEN_RENDERER.isDestroyed()) {
            OFFSCREEN_RENDERER.destroy();
        }
        return Promise.reject(`An error occurred when processing the resume: ${err}`)
    }
};

/**
 * Fetches the list of themes
 */
export const getThemeListListener = async () => {
    try {
        return await getThemeList();
    } catch (err) {
        return Promise.reject(err)
    }
};

/**
 * Just a wrapper for the 'fetchTheme' method from theme-helpers, since we define the listeners in this module but all
 * theme-related stuff happens there, so we for example don't need to pass the live-plugin-manager instance reference.
 * @param evt {IpcMainInvokeEvent} The invoke-event bound to this listener.
 * @param theme {IThemeEntry} The theme which should be fetched from NPM - we use the name-property as identifier.
 */
export const fetchThemeListener = async (evt: IpcMainInvokeEvent, theme: IThemeEntry) => {
    try {
        return await fetchTheme(theme);
    } catch (err) {
        return Promise.reject(err)
    }
};

/**
 *
 * @param evt {IpcMainInvokeEvent} The invoke-event bound to this listener.
 * @param theme {IThemeEntry} The theme which should be fetched from NPM - we use the name-property as identifier.
 */
export const uninstallThemeListener = async (evt: IpcMainInvokeEvent, theme: IThemeEntry) => {
    try {
        return await uninstallTheme(theme);
    } catch (err) {
        return Promise.reject(err)
    }
};

/**
 *
 * @param evt {IpcMainInvokeEvent} The invoke-event bound to this listener.
 */
export const installLocalThemeListener = async (evt: IpcMainInvokeEvent): Promise<null | IThemeEntry> => {
    try {
        const openDialogReturnVal = await  dialog.showOpenDialog({
            title: 'Select the folder with a local theme',
            properties: ['openDirectory', 'dontAddToRecent']
        });

        if (openDialogReturnVal && !openDialogReturnVal.canceled) {
            // Try to install the theme form a local folder
            return await installLocalTheme(openDialogReturnVal.filePaths[0]);
        }
        // Return null if no data loaded
        return null;
    } catch (err) {
        return Promise.reject(`An error occurred when opening the CV data: ${err}`);
    }
    return null;
};
