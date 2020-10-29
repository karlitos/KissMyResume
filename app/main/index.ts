import { app, BrowserView, BrowserWindow, ipcMain, screen } from 'electron';
import { VALID_INVOKE_CHANNELS } from '../definitions';
import { PREVIEW_DEFAULT_MARKUP } from './preview'
import {
  uninstallThemeListener,
  fetchThemeListener,
  getThemeListListener,
  openCvListener,
  processCvListener,
  saveCvListener,
} from './ipc-event-listeners';

declare const MAIN_WINDOW_WEBPACK_ENTRY: any, MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: any;

// Comment our to see security warnings!
// Further reading https://github.com/electron/electron/issues/19775
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = async () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height,
    width,
    minHeight: 600,
    minWidth: 800,
    webPreferences: {
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
    }
  });

  // BrowserView for the resume-form
  const form = new BrowserView({
    webPreferences: {
    nodeIntegration: false, // is default value after Electron v5
    contextIsolation: true, // protect against prototype pollution
    enableRemoteModule: false, // turn off remote
    preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY, // see https://www.electronforge.io/config/plugins/webpack#project-setup
    }
  });
  mainWindow.addBrowserView(form);
  form.setBounds({ x: 0, y: 0, width: width/2, height });
  form.setAutoResize({ width: true, height: true, horizontal: true, vertical: true });
  // load the index.html of the app in the form-BrowserView
  form.webContents.loadURL(MAIN_WINDOW_WEBPACK_ENTRY/*,
      {
        postData: [{
          type: 'rawData',
          bytes: Buffer.from('hello=world')
        }],
        extraHeaders: 'Content-Type: application/x-www-form-urlencoded'
      }
      */
  );
 // form.webContents.openDevTools({ mode: 'undocked' });

 // BrowserView for the preview
  const preview = new BrowserView();
  mainWindow.addBrowserView(preview);
  preview.setBounds({ x: width/2, y: 0, width: width/2, height });
  preview.setAutoResize({ width: true, height: true, horizontal: true, vertical: true });
  preview.webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(PREVIEW_DEFAULT_MARKUP)}`);
  // preview.webContents.openDevTools({ mode: 'undocked' });
  mainWindow.maximize();
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
ipcMain.handle(VALID_INVOKE_CHANNELS['open-cv'], openCvListener);

ipcMain.handle(VALID_INVOKE_CHANNELS['save-cv'], saveCvListener);

ipcMain.handle(VALID_INVOKE_CHANNELS['process-cv'], processCvListener);

ipcMain.handle(VALID_INVOKE_CHANNELS['get-theme-list'], getThemeListListener);

ipcMain.handle(VALID_INVOKE_CHANNELS['fetch-theme'], fetchThemeListener);

ipcMain.handle(VALID_INVOKE_CHANNELS['uninstall-theme'], uninstallThemeListener);
