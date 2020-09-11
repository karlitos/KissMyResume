import { IThemeEntry } from '../definitions';
import { BrowserView, dialog, IpcMainInvokeEvent } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { createMarkup, exportToMultipleFormats } from '../../lib/build';
import { fetchTheme, getThemeList, getLocalTheme } from './theme-helpers';
import {jsonRegex} from "ts-loader/dist/constants";

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
 */
export const saveCvListener = async (cvData: Record<string, any>): Promise<any> => {
    console.log(JSON.stringify(cvData))
};

/**
 *
 * @param evt
 * @param cvData
 */
export const processCvListener = async (evt: IpcMainInvokeEvent, cvData: Record<string, any>, theme: IThemeEntry,
                                        exportCvAfterProcessing: boolean) => {
    try {
        // IDEA: run the theme render fn in sandbox - https://www.npmjs.com/package/vm2
        const markup = await createMarkup(cvData, await getLocalTheme(theme));
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
                await exportToMultipleFormats(markup, path.basename(saveDialogReturnVal.filePath), path.dirname(saveDialogReturnVal.filePath), await getLocalTheme(theme), 'A4', ['pdf', 'docx', 'html'])
            }
        }
        return Promise.resolve(markup);
    } catch (err) {
        return Promise.reject(`An error occurred when exporting the resume: ${err}`)
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
 * @param evt {IpcMainInvokeEvent} The invoke-event bound to this listener
 * @param theme {IThemeEntry} The theme which should be fetched from NPM - we use the name-property as identifier.
 */
export const fetchThemeListener = async (evt: IpcMainInvokeEvent, theme: IThemeEntry) => {
    try {
        return await fetchTheme(theme);
    } catch (err) {
        return Promise.reject(err)
    }
};
