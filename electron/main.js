"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
// Zero-dependency local JSON file store (avoids missing module errors in packaged Electron)
class SimpleStore {
    constructor() {
        this.data = {};
        try {
            const userData = electron_1.app.getPath('userData');
            if (!fs_1.default.existsSync(userData)) {
                fs_1.default.mkdirSync(userData, { recursive: true });
            }
            this.filePath = path_1.default.join(userData, 'config.json');
            if (fs_1.default.existsSync(this.filePath)) {
                const raw = fs_1.default.readFileSync(this.filePath, 'utf-8');
                this.data = JSON.parse(raw);
            }
        }
        catch {
            this.data = {};
        }
    }
    get(key, defaultVal) {
        const keys = key.split('.');
        let cur = this.data;
        for (const k of keys) {
            if (cur === undefined || cur === null)
                return defaultVal;
            cur = cur[k];
        }
        return cur !== undefined ? cur : defaultVal;
    }
    set(key, val) {
        const keys = key.split('.');
        let cur = this.data;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!cur[keys[i]] || typeof cur[keys[i]] !== 'object') {
                cur[keys[i]] = {};
            }
            cur = cur[keys[i]];
        }
        cur[keys[keys.length - 1]] = val;
        this.save();
    }
    delete(key) {
        const keys = key.split('.');
        let cur = this.data;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!cur[keys[i]])
                return;
            cur = cur[keys[i]];
        }
        delete cur[keys[keys.length - 1]];
        this.save();
    }
    save() {
        try {
            fs_1.default.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
        }
        catch { }
    }
}
const store = new SimpleStore();
let mainWindow = null;
const isDev = process.env.NODE_ENV !== 'production';
function createWindow() {
    const { width: sw, height: sh } = electron_1.screen.getPrimaryDisplay().workAreaSize;
    const winW = 760;
    const winH = 580;
    mainWindow = new electron_1.BrowserWindow({
        width: winW,
        height: winH,
        x: Math.round((sw - winW) / 2),
        y: Math.round((sh - winH) / 2),
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        hasShadow: true,
        resizable: true,
        minWidth: 600,
        minHeight: 460,
        icon: path_1.default.join(__dirname, '../build/icon.png'),
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    // Content protection (streamer mode) — Premium
    const streamerMode = store.get('settings.streamerMode', false);
    if (streamerMode) {
        mainWindow.setContentProtection(true);
    }
    mainWindow.on('closed', () => { mainWindow = null; });
}
function registerShortcuts() {
    const primary = store.get('settings.hotkey', 'Insert');
    const secondary = store.get('settings.hotkeyAlt', 'Alt+X');
    const toggle = () => {
        if (!mainWindow)
            return;
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        }
        else {
            mainWindow.show();
            mainWindow.focus();
        }
    };
    try {
        electron_1.globalShortcut.register(primary, toggle);
    }
    catch { }
    try {
        electron_1.globalShortcut.register(secondary, toggle);
    }
    catch { }
}
electron_1.app.whenReady().then(() => {
    createWindow();
    registerShortcuts();
    electron_1.app.on('activate', () => { if (electron_1.BrowserWindow.getAllWindows().length === 0)
        createWindow(); });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.app.on('will-quit', () => {
    electron_1.globalShortcut.unregisterAll();
});
// IPC handlers
electron_1.ipcMain.on('window:close', () => { electron_1.app.quit(); });
electron_1.ipcMain.on('window:hide', () => { mainWindow?.hide(); });
electron_1.ipcMain.on('window:minimize', () => { mainWindow?.minimize(); });
electron_1.ipcMain.handle('store:get', (_e, key, def) => {
    return store.get(key, def);
});
electron_1.ipcMain.handle('store:set', (_e, key, value) => {
    store.set(key, value);
});
electron_1.ipcMain.handle('store:delete', (_e, key) => {
    store.delete(key);
});
electron_1.ipcMain.on('window:setOpacity', (_e, opacity) => {
    mainWindow?.setOpacity(opacity);
});
electron_1.ipcMain.on('window:setContentProtection', (_e, enabled) => {
    mainWindow?.setContentProtection(enabled);
});
electron_1.ipcMain.on('shortcuts:reregister', (_e, primary, secondary) => {
    electron_1.globalShortcut.unregisterAll();
    const toggle = () => {
        if (!mainWindow)
            return;
        mainWindow.isVisible() ? mainWindow.hide() : (mainWindow.show(), mainWindow.focus());
    };
    try {
        electron_1.globalShortcut.register(primary, toggle);
    }
    catch { }
    try {
        electron_1.globalShortcut.register(secondary, toggle);
    }
    catch { }
});
function sendLineToGameChat(text) {
    return new Promise((resolve) => {
        if (!text || !text.trim()) {
            resolve();
            return;
        }
        if (process.platform === 'win32') {
            const b64 = Buffer.from(text, 'utf8').toString('base64');
            const psCommand = `
Add-Type -AssemblyName System.Windows.Forms
$bytes = [Convert]::FromBase64String('${b64}')
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
[System.Windows.Forms.Clipboard]::SetText($text)
$w = New-Object -ComObject WScript.Shell
Start-Sleep -Milliseconds 40
$w.SendKeys('{F6}')
Start-Sleep -Milliseconds 60
$w.SendKeys('^v')
Start-Sleep -Milliseconds 60
$w.SendKeys('{ENTER}')
`;
            const tmpFile = path_1.default.join(os_1.default.tmpdir(), `send_chat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.ps1`);
            fs_1.default.writeFileSync(tmpFile, psCommand, 'utf8');
            (0, child_process_1.exec)(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpFile}"`, () => {
                try {
                    fs_1.default.unlinkSync(tmpFile);
                }
                catch { }
                resolve();
            });
        }
        else {
            // macOS / Linux logging
            console.log('[GAME CHAT AUTO-TYPE]:', text);
            resolve();
        }
    });
}
// Game chat auto-typing handlers
electron_1.ipcMain.handle('game:sendChat', async (_e, text) => {
    await sendLineToGameChat(text);
    return true;
});
electron_1.ipcMain.handle('game:sendLines', async (_e, lines) => {
    for (const item of lines) {
        if (item.text && item.text.trim()) {
            await sendLineToGameChat(item.text);
            const delay = Math.max(item.delay || 1000, 200);
            await new Promise(r => setTimeout(r, delay));
        }
    }
    return true;
});
electron_1.ipcMain.handle('fs:readLaws', (_e, serverName) => {
    const fsModule = require('fs');
    const lawsDir = path_1.default.join(electron_1.app.getAppPath(), '..', 'laws', serverName.toLowerCase());
    if (!fsModule.existsSync(lawsDir))
        return '';
    const files = fsModule.readdirSync(lawsDir).filter((f) => f.endsWith('.txt'));
    return files.map((f) => {
        const content = fsModule.readFileSync(path_1.default.join(lawsDir, f), 'utf8');
        return `=== ${f.replace('.txt', '')} ===\n${content}`;
    }).join('\n\n');
});
