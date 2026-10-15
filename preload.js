const { contextBridge, ipcRenderer } = require('electron');
 
contextBridge.exposeInMainWorld('desktopAuth', {

  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),

  getAccessToken: () => ipcRenderer.invoke('auth:getAccessToken'),

  hasSession: () => ipcRenderer.invoke('auth:hasSession'),

  refresh: () => ipcRenderer.invoke('auth:refresh'),

  logout: () => ipcRenderer.invoke('auth:logout')

});
 