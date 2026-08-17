import { app, BrowserWindow, globalShortcut, ipcMain, screen } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';

// Zero-dependency local JSON file store (avoids missing module errors in packaged Electron)
class SimpleStore {
  private filePath: string;
  private data: Record<string, any> = {};

  constructor() {
    try {
      const userData = app.getPath('userData');
      if (!fs.existsSync(userData)) {
        fs.mkdirSync(userData, { recursive: true });
      }
      this.filePath = path.join(userData, 'config.json');
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
      }
    } catch {
      this.data = {};
    }
  }

  get(key: string, defaultVal?: any): any {
    const keys = key.split('.');
    let cur = this.data;
    for (const k of keys) {
      if (cur === undefined || cur === null) return defaultVal;
      cur = cur[k];
    }
    return cur !== undefined ? cur : defaultVal;
  }

  set(key: string, val: any): void {
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

  delete(key: string): void {
    const keys = key.split('.');
    let cur = this.data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!cur[keys[i]]) return;
      cur = cur[keys[i]];
    }
    delete cur[keys[keys.length - 1]];
    this.save();
  }

  private save(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch {}
  }
}

const store = new SimpleStore();
let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

  const winW = 760;
  const winH = 580;

  mainWindow = new BrowserWindow({
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
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Content protection (streamer mode) — Premium
  const streamerMode = store.get('settings.streamerMode', false) as boolean;
  if (streamerMode) {
    mainWindow.setContentProtection(true);
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

function registerShortcuts() {
  const primary = store.get('settings.hotkey', 'Insert') as string;
  const secondary = store.get('settings.hotkeyAlt', 'Alt+X') as string;

  const toggle = () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  };

  try { globalShortcut.register(primary, toggle); } catch {}
  try { globalShortcut.register(secondary, toggle); } catch {}
}

app.whenReady().then(() => {
  createWindow();
  registerShortcuts();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// IPC handlers
ipcMain.on('window:close', () => { app.quit(); });
ipcMain.on('window:hide', () => { mainWindow?.hide(); });
ipcMain.on('window:minimize', () => { mainWindow?.minimize(); });

ipcMain.handle('store:get', (_e, key: string, def?: unknown) => {
  return store.get(key, def);
});
ipcMain.handle('store:set', (_e, key: string, value: unknown) => {
  store.set(key, value);
});
ipcMain.handle('store:delete', (_e, key: string) => {
  store.delete(key as never);
});

ipcMain.on('window:setOpacity', (_e, opacity: number) => {
  mainWindow?.setOpacity(opacity);
});
ipcMain.on('window:setContentProtection', (_e, enabled: boolean) => {
  mainWindow?.setContentProtection(enabled);
});
ipcMain.on('shortcuts:reregister', (_e, primary: string, secondary: string) => {
  globalShortcut.unregisterAll();
  const toggle = () => {
    if (!mainWindow) return;
    mainWindow.isVisible() ? mainWindow.hide() : (mainWindow.show(), mainWindow.focus());
  };
  try { globalShortcut.register(primary, toggle); } catch {}
  try { globalShortcut.register(secondary, toggle); } catch {}
});

function sendLineToGameChat(text: string): Promise<void> {
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
      const tmpFile = path.join(os.tmpdir(), `send_chat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.ps1`);
      fs.writeFileSync(tmpFile, psCommand, 'utf8');
      exec(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpFile}"`, () => {
        try { fs.unlinkSync(tmpFile); } catch {}
        resolve();
      });
    } else {
      // macOS / Linux logging
      console.log('[GAME CHAT AUTO-TYPE]:', text);
      resolve();
    }
  });
}

// Game chat auto-typing handlers
ipcMain.handle('game:sendChat', async (_e, text: string) => {
  await sendLineToGameChat(text);
  return true;
});

ipcMain.handle('game:sendLines', async (_e, lines: Array<{ text: string; delay?: number }>) => {
  for (const item of lines) {
    if (item.text && item.text.trim()) {
      await sendLineToGameChat(item.text);
      const delay = Math.max(item.delay || 1000, 200);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  return true;
});

ipcMain.handle('fs:readLaws', (_e, serverName: string) => {
  const fsModule = require('fs');
  const lawsDir = path.join(app.getAppPath(), '..', 'laws', serverName.toLowerCase());
  if (!fsModule.existsSync(lawsDir)) return '';
  const files = fsModule.readdirSync(lawsDir).filter((f: string) => f.endsWith('.txt'));
  return files.map((f: string) => {
    const content = fsModule.readFileSync(path.join(lawsDir, f), 'utf8');
    return `=== ${f.replace('.txt', '')} ===\n${content}`;
  }).join('\n\n');
});
