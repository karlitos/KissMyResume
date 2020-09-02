import { ICvDataReturnVal, IThemeEntry } from '../definitions';
import { BrowserView, dialog, IpcMainInvokeEvent } from 'electron';
import * as fs from 'fs';
import { createMarkup } from '../../lib/build';
import { fetchTheme, getThemeList, getLocalTheme } from './theme-helpers';

/**
 * The listener for events on the 'open-cv' channel
 */
export const openCvListener = async (): Promise<ICvDataReturnVal> => {
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
            return {
                success: true,
                data: JSON.parse(cvData.toString()),
            };
        }
        // This causes unnecessary Error throwing  in the main process
        // return Promise.reject('No files selected');
        return {
            success: true,
            data: null,
        };
    } catch (err) {
        return Promise.reject(`An error occurred when opening the CV data: ${err}`);
    }
};

/**
 *
 * @param evt
 * @param cvData
 */
export const processCvListener = async (evt: IpcMainInvokeEvent, cvData: Record<string, any>, theme: IThemeEntry) => {
    try {
        // IDEA: run the theme render fn in sandbox - https://www.npmjs.com/package/vm2
        const markup = await createMarkup(cvData, await getLocalTheme(theme));
        // setting of the preview content via loadURL with  data-uri encoded markup is not the most robust solutions. It might
        // be necessary to go with file-based buffering, see https://github.com/electron/electron/issues/1146#issuecomment-591983815
        // alternatively https://github.com/remarkablemark/html-react-parser
        BrowserView.fromId(2).webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(markup)}`);
        return Promise.resolve(markup);
    } catch (err) {
        return Promise.reject(err)
    }
};

/**
 *
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
