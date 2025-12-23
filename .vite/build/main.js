"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
const electron = require("electron");
const path = require("path");
const fs = require("fs/promises");
const fs$1 = require("fs");
function getStorageDir() {
  return electron.app.getPath("userData");
}
function getTemplatesDir() {
  return path.join(getStorageDir(), "templates");
}
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}
async function listTemplates() {
  const dir = getTemplatesDir();
  await ensureDir(dir);
  const templates = [];
  const entries = await fs.readdir(dir);
  for (const entry of entries) {
    if (entry.endsWith(".json")) {
      const filePath = path.join(dir, entry);
      const content = await fs.readFile(filePath, "utf-8");
      try {
        const template = JSON.parse(content);
        templates.push(template);
      } catch (err) {
        console.error(`Failed to parse template ${entry}:`, err);
      }
    }
  }
  templates.sort((a, b) => b.modified.localeCompare(a.modified));
  return templates;
}
async function saveTemplate(template) {
  const dir = getTemplatesDir();
  await ensureDir(dir);
  const filePath = path.join(dir, `${template.id}.json`);
  const content = JSON.stringify(template, null, 2);
  await fs.writeFile(filePath, content, "utf-8");
}
async function deleteTemplate(id) {
  const dir = getTemplatesDir();
  const filePath = path.join(dir, `${id}.json`);
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
  } catch (err) {
  }
}
async function handleGreet(event, args) {
  return `Hello, ${args.name}! You've been greeted from Electron!`;
}
async function handleReadFile(event, args) {
  try {
    const buffer = await fs.readFile(args.path);
    return Array.from(buffer);
  } catch (err) {
    throw new Error(`Failed to read file: ${err instanceof Error ? err.message : String(err)}`);
  }
}
async function handleWriteFile(event, args) {
  try {
    const buffer = Buffer.from(args.data);
    await fs.writeFile(args.path, buffer);
  } catch (err) {
    throw new Error(`Failed to write file: ${err instanceof Error ? err.message : String(err)}`);
  }
}
async function handleListTemplates(event) {
  try {
    return await listTemplates();
  } catch (err) {
    throw new Error(`Failed to list templates: ${err instanceof Error ? err.message : String(err)}`);
  }
}
async function handleSaveTemplate(event, args) {
  try {
    await saveTemplate(args.template);
  } catch (err) {
    throw new Error(`Failed to save template: ${err instanceof Error ? err.message : String(err)}`);
  }
}
async function handleDeleteTemplate(event, args) {
  try {
    await deleteTemplate(args.id);
  } catch (err) {
    throw new Error(`Failed to delete template: ${err instanceof Error ? err.message : String(err)}`);
  }
}
async function handleOpenDialog(event, args) {
  const win = electron.BrowserWindow.fromWebContents(event.sender);
  if (!win) return null;
  const result = await electron.dialog.showOpenDialog(win, {
    properties: ["openFile"],
    filters: args.filters
  });
  return result.canceled ? null : result.filePaths[0];
}
async function handleSaveDialog(event, args) {
  const win = electron.BrowserWindow.fromWebContents(event.sender);
  if (!win) return null;
  const result = await electron.dialog.showSaveDialog(win, {
    defaultPath: args.defaultPath,
    filters: args.filters
  });
  return result.canceled ? null : result.filePath || null;
}
function getWindowStatePath() {
  return path.join(electron.app.getPath("userData"), "window-state.json");
}
function loadWindowState() {
  try {
    const filePath = getWindowStatePath();
    const content = fs$1.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}
async function saveWindowState(state) {
  const filePath = getWindowStatePath();
  const content = JSON.stringify(state, null, 2);
  const fs2 = await import("fs/promises");
  await fs2.writeFile(filePath, content, "utf-8");
}
let mainWindow = null;
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.paddle.com https://changeoveroptimizer.com";
function createWindow() {
  const windowState = loadWindowState() || {
    width: 1200,
    height: 800,
    x: void 0,
    y: void 0,
    maximized: false
  };
  mainWindow = new electron.BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800,
    minHeight: 600,
    title: "ChangeoverOptimizer",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  if (windowState.maximized) {
    mainWindow.maximize();
  }
  {
    mainWindow.loadURL("http://localhost:1420");
    mainWindow.webContents.openDevTools();
  }
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [CSP]
        }
      });
    }
  );
  const saveState = () => {
    if (!mainWindow) return;
    const bounds = mainWindow.getBounds();
    saveWindowState({
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      maximized: mainWindow.isMaximized()
    });
  };
  let saveTimeout = null;
  mainWindow.on("resize", () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveState, 500);
  });
  mainWindow.on("move", () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveState, 500);
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
electron.app.whenReady().then(() => {
  electron.ipcMain.handle("greet", handleGreet);
  electron.ipcMain.handle("read_file", handleReadFile);
  electron.ipcMain.handle("write_file", handleWriteFile);
  electron.ipcMain.handle("list_templates", handleListTemplates);
  electron.ipcMain.handle("save_template", handleSaveTemplate);
  electron.ipcMain.handle("delete_template", handleDeleteTemplate);
  electron.ipcMain.handle("open_dialog", handleOpenDialog);
  electron.ipcMain.handle("save_dialog", handleSaveDialog);
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
