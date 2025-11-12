import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  login: () => ipcRenderer.invoke('login'),
  logout: () => ipcRenderer.invoke('logout'),
  getToken: () => ipcRenderer.invoke('get-token'),
  getAccount: () => ipcRenderer.invoke('get-account'),
  loadDefaultRoles: () => ipcRenderer.invoke('load-default-roles'),
  saveDefaultRoles: (roleIds: string[]) => ipcRenderer.invoke('save-default-roles', roleIds),
  resetDefaultRoles: () => ipcRenderer.invoke('reset-default-roles'),
});
