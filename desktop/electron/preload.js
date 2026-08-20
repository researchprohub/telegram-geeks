const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  backendStatus: () => ipcRenderer.invoke("backend:status"),
  tokenGet: () => ipcRenderer.invoke("token:get"),
  tokenSet: (value) => ipcRenderer.invoke("token:set", value),
  tokenClear: () => ipcRenderer.invoke("token:clear"),
});