const { app, BrowserWindow, shell } = require('electron');
const { URL } = require('url');

function createWindow() {
  const { siteUrl: configuredSiteUrl } = require('./config.json');
  const siteUrl = process.env.KHALAF_TV_URL || configuredSiteUrl;
  if (!siteUrl || !/^https:\/\//i.test(siteUrl)) {
    throw new Error('Set KHALAF_TV_URL to the deployed HTTPS KHALAF TV website before building the Windows installer.');
  }
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 960, minHeight: 600,
    autoHideMenuBar: true,
    backgroundColor: '#080b12',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.loadURL(siteUrl);
  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      if (new URL(url).protocol === 'https:') shell.openExternal(url);
    } catch {}
    return { action: 'deny' };
  });
}
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
