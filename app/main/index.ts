import { app, BrowserWindow, BrowserView, ipcMain, dialog, net } from 'electron';
import * as fs from 'fs';
declare const MAIN_WINDOW_WEBPACK_ENTRY: any, MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: any;
import { VALID_INVOKE_CHANNELS, ICvDataReturnVal } from '../definitions';
import { PREVIEW_DEFAULT_MARKUP } from './preview'
import { createMarkup } from '../../lib/build';

const flatTheme = require('jsonresume-theme-flat');

// Comment our to see security warnings!
// Further reading https://github.com/electron/electron/issues/19775
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
    }
  });

  // and load the index.html of the app.
  // mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  const form = new BrowserView({
    webPreferences: {
    nodeIntegration: false, // is default value after Electron v5
    contextIsolation: true, // protect against prototype pollution
    enableRemoteModule: false, // turn off remote
    preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY, // see https://www.electronforge.io/config/plugins/webpack#project-setup
    }
  });
  mainWindow.addBrowserView(form);
  form.setBounds({ x: 0, y: 0, width: 400, height: 600 });
  form.setAutoResize({ width: true, height: true, horizontal: true, vertical: true });
  form.webContents.loadURL(MAIN_WINDOW_WEBPACK_ENTRY
      /*,
      {
        postData: [{
          type: 'rawData',
          bytes: Buffer.from('hello=world')
        }],
      }
      */
  );￿
 form.webContents.openDevTools({ mode: 'undocked' });

  const preview = new BrowserView();
  mainWindow.addBrowserView(preview)
  preview.setBounds({ x: 400, y: 0, width: 400, height: 600 });
  preview.setAutoResize({ width: true, height: true, horizontal: true, vertical: true });
  preview.webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(PREVIEW_DEFAULT_MARKUP)}`);
  // preview.webContents.openDevTools({ mode: 'undocked' });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.handle(VALID_INVOKE_CHANNELS['open-cv'], async (): Promise<ICvDataReturnVal> => {
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
});

ipcMain.handle(VALID_INVOKE_CHANNELS['process-cv'], async (evt, cvData: Record<string, any>) => {
  const markup = await createMarkup(cvData, flatTheme);
  // setting of the preview content via loadURL with  data-uri encoded markup is not the most robust solutions. It might
  // be necessary to go with file-based buffering, see https://github.com/electron/electron/issues/1146#issuecomment-591983815
  // alternatively https://github.com/remarkablemark/html-react-parser
  BrowserView.fromId(2).webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(markup)}`);
  return Promise.resolve(markup);
});
