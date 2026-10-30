const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { URL } = require('url');
const path = require('path');

let mainWindow = null;
let providerWindow = null;
const PROVIDER_HOSTS = new Set(['www.elahmad.ru', 'elahmad.ru']);

function validProviderUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && PROVIDER_HOSTS.has(parsed.hostname.toLowerCase());
  } catch { return false; }
}

function closeProvider() {
  if (providerWindow && !providerWindow.isDestroyed()) providerWindow.close();
  providerWindow = null;
  return { ok: true };
}

function openProvider(value) {
  if (!validProviderUrl(value)) return { ok: false, message: 'Adresse fournisseur non autorisée.' };
  closeProvider();
  providerWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 800, minHeight: 500,
    autoHideMenuBar: true, backgroundColor: '#080b12', title: 'KHALAF TV · Live channel',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  providerWindow.on('closed', () => { providerWindow = null; });
  providerWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (validProviderUrl(url)) {
      setTimeout(() => { if (providerWindow && !providerWindow.isDestroyed()) providerWindow.loadURL(url); }, 0);
    } else {
      try { if (new URL(url).protocol === 'https:') shell.openExternal(url); } catch {}
    }
    return { action: 'deny' };
  });
  providerWindow.loadURL(value);
  return { ok: true };
}

function createWindow() {
  const { siteUrl: configuredSiteUrl } = require('./config.json');
  const siteUrl = process.env.KHALAF_TV_URL || configuredSiteUrl;
  if (!siteUrl || !/^https:\/\//i.test(siteUrl)) {
    throw new Error('Set KHALAF_TV_URL to the deployed HTTPS KHALAF TV website before building the Windows installer.');
  }
  const siteOrigin = new URL(siteUrl).origin;
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 960, minHeight: 600,
    autoHideMenuBar: true, backgroundColor: '#080b12',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true
    }
  });
  ipcMain.removeHandler('khalaf:open-provider');
  ipcMain.removeHandler('khalaf:close-provider');
  ipcMain.handle('khalaf:open-provider', (event, url) => {
    try { if (!event.senderFrame?.url || new URL(event.senderFrame.url).origin !== siteOrigin) return { ok: false, message: 'Origine non autorisée.' }; }
    catch { return { ok: false, message: 'Origine non autorisée.' }; }
    return openProvider(url);
  });
  ipcMain.handle('khalaf:close-provider', (event) => {
    try { if (!event.senderFrame?.url || new URL(event.senderFrame.url).origin !== siteOrigin) return { ok: false, message: 'Origine non autorisée.' }; }
    catch { return { ok: false, message: 'Origine non autorisée.' }; }
    return closeProvider();
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (validProviderUrl(url)) openProvider(url);
    else { try { if (new URL(url).protocol === 'https:') shell.openExternal(url); } catch {} }
    return { action: 'deny' };
  });
  mainWindow.on('closed', () => { mainWindow = null; closeProvider(); });
  mainWindow.loadURL(siteUrl);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
