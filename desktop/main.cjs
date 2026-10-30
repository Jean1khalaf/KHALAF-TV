const { app, BrowserWindow, ipcMain, shell } = require("electron");
const { URL } = require("url");

let mainWindow = null;
let providerWindow = null;
const PROVIDER_HOSTS = new Set(["elahmad.ru", "www.elahmad.ru"]);

function isAllowedProvider(value) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && PROVIDER_HOSTS.has(u.hostname.toLowerCase());
  } catch { return false; }
}
function closeProvider() {
  if (providerWindow && !providerWindow.isDestroyed()) providerWindow.close();
  providerWindow = null;
  return { ok: true };
}
function openProvider(value) {
  if (!isAllowedProvider(value)) return { ok: false, message: "Provider URL is not allowed." };
  closeProvider();
  providerWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 800, minHeight: 500,
    autoHideMenuBar: true, backgroundColor: "#080b12",
    title: "KHALAF TV · Live channel",
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  providerWindow.on("closed", () => { providerWindow = null; });
  providerWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedProvider(url)) {
      setTimeout(() => {
        if (providerWindow && !providerWindow.isDestroyed()) providerWindow.loadURL(url);
      }, 0);
    } else {
      try { if (new URL(url).protocol === "https:") shell.openExternal(url); } catch {}
    }
    return { action: "deny" };
  });
  providerWindow.loadURL(value);
  return { ok: true };
}
function createWindow() {
  const { siteUrl } = require("./config.json");
  const url = process.env.KHALAF_TV_URL || siteUrl;
  if (!url || !/^https:\/\//i.test(url)) throw new Error("Configure desktop/config.json siteUrl with the deployed HTTPS KHALAF TV URL.");
  const allowedOrigin = new URL(url).origin;
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 960, minHeight: 600,
    autoHideMenuBar: true, backgroundColor: "#080b12",
    webPreferences: {
      preload: require("path").join(__dirname, "preload.cjs"),
      contextIsolation: true, nodeIntegration: false, sandbox: true
    }
  });
  ipcMain.handle("khalaf:open-provider", (event, target) => {
    try {
      if (new URL(event.senderFrame.url).origin !== allowedOrigin) return { ok: false, message: "Untrusted application origin." };
    } catch { return { ok: false, message: "Invalid application origin." }; }
    return openProvider(target);
  });
  ipcMain.handle("khalaf:close-provider", (event) => {
    try {
      if (new URL(event.senderFrame.url).origin !== allowedOrigin) return { ok: false, message: "Untrusted application origin." };
    } catch { return { ok: false, message: "Invalid application origin." }; }
    return closeProvider();
  });
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    if (isAllowedProvider(target)) openProvider(target);
    else { try { if (new URL(target).protocol === "https:") shell.openExternal(target); } catch {} }
    return { action: "deny" };
  });
  mainWindow.on("closed", () => { mainWindow = null; closeProvider(); });
  mainWindow.loadURL(url);
}
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
