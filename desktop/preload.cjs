const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("khalafDesktop", Object.freeze({
  isDesktop: true,
  openProvider: (url) => ipcRenderer.invoke("khalaf:open-provider", url),
  closeProvider: () => ipcRenderer.invoke("khalaf:close-provider"),
  focusMain: () => ipcRenderer.invoke("khalaf:focus-main")
}));
