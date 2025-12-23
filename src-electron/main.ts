import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import {
  handleReadFile,
  handleWriteFile,
  handleListTemplates,
  handleSaveTemplate,
  handleDeleteTemplate,
  handleGreet,
  handleOpenDialog,
  handleSaveDialog,
} from './ipc-handlers';
import { loadWindowState, saveWindowState } from './window-state';

let mainWindow: BrowserWindow | null = null;

// CSP header
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.paddle.com https://changeoveroptimizer.com";

// Vite dev server URL (injected by Electron Forge)
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

function createWindow(): void {
  // Load saved window state or use defaults
  const windowState = loadWindowState() || {
    width: 1200,
    height: 800,
    x: undefined,
    y: undefined,
    maximized: false,
  };

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800,
    minHeight: 600,
    title: 'ChangeoverOptimizer',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Maximize if needed
  if (windowState.maximized) {
    mainWindow.maximize();
  }

  // Load the app
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Set CSP header
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [CSP],
        },
      });
    }
  );

  // Save window state on resize/move
  const saveState = () => {
    if (!mainWindow) return;
    const bounds = mainWindow.getBounds();
    saveWindowState({
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      maximized: mainWindow.isMaximized(),
    });
  };

  let saveTimeout: NodeJS.Timeout | null = null;
  mainWindow.on('resize', () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveState, 500);
  });

  mainWindow.on('move', () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveState, 500);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  // Register IPC handlers
  ipcMain.handle('greet', handleGreet);
  ipcMain.handle('read_file', handleReadFile);
  ipcMain.handle('write_file', handleWriteFile);
  ipcMain.handle('list_templates', handleListTemplates);
  ipcMain.handle('save_template', handleSaveTemplate);
  ipcMain.handle('delete_template', handleDeleteTemplate);
  ipcMain.handle('open_dialog', handleOpenDialog);
  ipcMain.handle('save_dialog', handleSaveDialog);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
