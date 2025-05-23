const { contextBridge, ipcRenderer } = require('electron');

function safeInvoke(channel, data) {
  try {
    return ipcRenderer.invoke(channel, data);
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
}

contextBridge.exposeInMainWorld(
  'electron',
  {
    send: (channel, data) => {
      const validChannels = ['window-minimize', 'window-maximize', 'window-close'];
      if (validChannels.includes(channel)) {
        try {
          ipcRenderer.send(channel, data);
          return true;
        } catch (error) {
          console.error(error);
          return false;
        }
      }
      return false;
    },
    invoke: async (channel, data) => {
      const validChannels = [
        'execute-code', 
        'check-hydrogen',
        'save-tabs',
        'load-tabs',
        'save-settings',
        'load-settings', 
        'optimize-memory',
        'toggle-power-save-blocker',
        'warm-up-monaco',
        'read-roblox-logs',
        'read-roblox-logs-preview', 
        'update-discord-status',
        'execute-auto-scripts',
        'open-autoexec-folder',
        'get-autoexec-info',
        'load-local-scripts',
        'save-local-scripts',
        'show-notification',
        'execute-tool', 
        'toggle-autoexec'
      ];
      
      if (validChannels.includes(channel)) {
        return await safeInvoke(channel, data);
      }
      
      return null;
    },
    isElectron: true,
    getVersion: () => process.versions.electron || 'unknown'
  }
);

window.addEventListener('DOMContentLoaded', () => {
  try {
    safeInvoke('warm-up-monaco').catch(err => {
      console.warn(err);
    });
  } catch (e) {
    console.error(e);
  }
});
