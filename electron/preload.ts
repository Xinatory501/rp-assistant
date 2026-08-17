import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  close: () => ipcRenderer.send('window:close'),
  hide: () => ipcRenderer.send('window:hide'),
  minimize: () => ipcRenderer.send('window:minimize'),
  setOpacity: (v: number) => ipcRenderer.send('window:setOpacity', v),
  setContentProtection: (v: boolean) => ipcRenderer.send('window:setContentProtection', v),
  reregisterShortcuts: (primary: string, secondary: string) =>
    ipcRenderer.send('shortcuts:reregister', primary, secondary),

  // Game chat auto-typing
  sendGameChat: (text: string) => ipcRenderer.invoke('game:sendChat', text),
  sendGameLines: (lines: Array<{ text: string; delay?: number }>) => ipcRenderer.invoke('game:sendLines', lines),

  // Persistent store
  storeGet: (key: string, def?: unknown) => ipcRenderer.invoke('store:get', key, def),
  storeSet: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),
  storeDelete: (key: string) => ipcRenderer.invoke('store:delete', key),

  // Laws filesystem
  readLaws: (server: string) => ipcRenderer.invoke('fs:readLaws', server),
});
