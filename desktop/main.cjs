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
  // Keep the dedicated provider window alive so remote commands can reuse it.
  // Hide it rather than destroy it; this avoids recreating/maximizing a new
  // window every time the user changes channels.
  if (providerWindow && !providerWindow.isDestroyed()) {
    try {
      providerWindow.loadURL("about:blank");
      providerWindow.hide();
    } catch {}
  }
  return { ok: true };
}
function openProvider(value) {
  if (!isAllowedProvider(value)) return { ok: false, message: "Provider URL is not allowed." };

  // Reuse the same native window and its existing bounds/state on channel
  // changes. Restore only if it was minimized; never force full-screen.
  if (providerWindow && !providerWindow.isDestroyed()) {
    try {
      if (providerWindow.isMinimized()) providerWindow.restore();
      if (providerWindow.isFullScreen()) providerWindow.setFullScreen(false);
      if (providerWindow.isMaximized()) providerWindow.unmaximize();
      // Keep a consistent windowed size; never reopen the provider fullscreen.
      providerWindow.setBounds({ width: 1280, height: 800 });
      providerWindow.center();
      providerWindow.show();
      providerWindow.focus();
      providerWindow.loadURL(value);
      return { ok: true };
    } catch {
      try { providerWindow.destroy(); } catch {}
      providerWindow = null;
    }
  }

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
