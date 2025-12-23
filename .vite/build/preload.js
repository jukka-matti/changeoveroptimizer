"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
  invoke: (channel, ...args) => {
    const validChannels = [
      "greet",
      "read_file",
      "write_file",
      "list_templates",
      "save_template",
      "delete_template",
      "open_dialog",
      "save_dialog"
    ];
    if (validChannels.includes(channel)) {
      return electron.ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Invalid IPC channel: ${channel}`);
  }
});
