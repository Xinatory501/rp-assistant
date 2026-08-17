"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    close: () => electron_1.ipcRenderer.send('window:close'),
    hide: () => electron_1.ipcRenderer.send('window:hide'),
    minimize: () => electron_1.ipcRenderer.send('window:minimize'),
    setOpacity: (v) => electron_1.ipcRenderer.send('window:setOpacity', v),
    setContentProtection: (v) => electron_1.ipcRenderer.send('window:setContentProtection', v),
    reregisterShortcuts: (primary, secondary) => electron_1.ipcRenderer.send('shortcuts:reregister', primary, secondary),
    // Game chat auto-typing
    sendGameChat: (text) => electron_1.ipcRenderer.invoke('game:sendChat', text),
    sendGameLines: (lines) => electron_1.ipcRenderer.invoke('game:sendLines', lines),
    // Persistent store
    storeGet: (key, def) => electron_1.ipcRenderer.invoke('store:get', key, def),
    storeSet: (key, value) => electron_1.ipcRenderer.invoke('store:set', key, value),
    storeDelete: (key) => electron_1.ipcRenderer.invoke('store:delete', key),
    // Laws filesystem
    readLaws: (server) => electron_1.ipcRenderer.invoke('fs:readLaws', server),
});
