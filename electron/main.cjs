const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');
const fetch = require('node-fetch');
const { powerSaveBlocker } = require('electron');

const isProd = process.env.NODE_ENV === 'production';
let powerSaveBlockerId = null;

const NOCTURNAL_FOLDER = path.join(os.homedir(), 'Nocturnal');
const TABS_FILE = path.join(NOCTURNAL_FOLDER, 'tabs.json');
const SETTINGS_FILE = path.join(NOCTURNAL_FOLDER, 'settings.json');

process.on('uncaughtException', (error) => {
  dialog.showErrorBox('Error', `${error.message}\nCheck ${logFile} for details.`);
});

function initializeNocturnal() {
  ensureNocturnalDir();
  
  ipcMain.handle('save-tabs', async (event, { tabs, activeTabId }) => {
    return saveTabs(tabs, activeTabId);
  });

  ipcMain.handle('load-tabs', async () => {
    return loadTabs();
  });
  
  ipcMain.handle('optimize-memory', () => {
    if (global.gc) {
      global.gc();
      return { success: true };
    }
    return { success: false, reason: 'gc-not-available' };
  });
  
  ipcMain.handle('toggle-power-save-blocker', (event, shouldBlock) => {
    if (shouldBlock && powerSaveBlockerId === null) {
      powerSaveBlockerId = powerSaveBlocker.start('prevent-app-suspension');
      return { enabled: true, id: powerSaveBlockerId };
    } else if (!shouldBlock && powerSaveBlockerId !== null) {
      powerSaveBlocker.stop(powerSaveBlockerId);
      powerSaveBlockerId = null;
      return { enabled: false };
    }
    return { enabled: powerSaveBlockerId !== null };
  });

  ipcMain.handle('warm-up-monaco', async () => {
    try {
      const userDataPath = app.getPath('userData');
      const monacoCachePath = path.join(userDataPath, 'monaco-cache');
      
      if (!fs.existsSync(monacoCachePath)) {
        fs.mkdirSync(monacoCachePath, { recursive: true });
      }
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error: error.message };
    }
  });

  global.addConsoleLog = () => {
  };

  const existingHandlers = ipcMain._invokeHandlers?.get('execute-code');
  if (existingHandlers) {
    ipcMain.removeHandler('execute-code');
  }

  ipcMain.handle('execute-code', async (event, code) => {
    try {
      if (!code || code.trim() === '') {
        return { 
          success: false, 
          message: "Cannot execute empty script. Please enter some code first."
        };
      }
      
      const result = await executeScript(code);
      return result;
    } catch (error) {
      console.error(error.message);
      return { success: false, message: error.message };
    }
  });

  const DEFAULT_SETTINGS = {
    theme: "dark",
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
    minimap: false,
    autoSave: true,
    lineNumbers: true,
    hydrogenPortScanStart: START_PORT,
    hydrogenPortScanEnd: END_PORT
  };
  

  ipcMain.handle('load-settings', async () => {
    return loadSettings();
  });
  
  ipcMain.handle('save-settings', async (event, settings) => {
    return saveSettings(settings);
  });
}

function ensureNocturnalDir() {
  if (!fs.existsSync(NOCTURNAL_FOLDER)) {
    try {
      fs.mkdirSync(NOCTURNAL_FOLDER, { recursive: true });
    } catch (error) {
    }
  }
}

async function saveTabs(tabs, activeTabId) {
  try {
    const data = JSON.stringify({
      tabs,
      activeTabId,
      lastUpdated: new Date().toISOString()
    });
    
    fs.writeFileSync(TABS_FILE, data, 'utf8');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
}

function loadTabs() {
  try {
    if (fs.existsSync(TABS_FILE)) {
      const data = fs.readFileSync(TABS_FILE, 'utf8');
      return { 
        success: true, 
        data: JSON.parse(data),
        folderPath: NOCTURNAL_FOLDER 
      };
    } else {
      return { 
        success: false, 
        reason: 'file-not-found',
        folderPath: NOCTURNAL_FOLDER 
      };
    }
  } catch (error) {
    console.error(error);
    return { 
      success: false, 
      error: error.message,
      folderPath: NOCTURNAL_FOLDER 
    };
  }
}

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const settings = JSON.parse(data);
      return { 
        success: true, 
        data: settings
      };
    } else {
      return { 
        success: true, 
        data: {
          theme: "dark",
          fontSize: 14,
          tabSize: 2,
          wordWrap: true,
          minimap: false,
          autoSave: true,
          lineNumbers: true,
          hydrogenPortScanStart: START_PORT,
          hydrogenPortScanEnd: END_PORT
        }
      };
    }
  } catch (error) {
    console.error(error);
    return { 
      success: false, 
      error: error.message
    };
  }
}

function saveSettings(settings) {
  try {
    if (settings.hydrogenPortScanStart >= settings.hydrogenPortScanEnd) {
      return { 
        success: false, 
        error: "Port scan start must be less than end" 
      };
    }
    
    if (settings.hydrogenPortScanStart !== START_PORT || 
        settings.hydrogenPortScanEnd !== END_PORT) {
      START_PORT = settings.hydrogenPortScanStart;
      END_PORT = settings.hydrogenPortScanEnd;

      currentHydrogenPort = null;
    }
    
    const data = JSON.stringify(settings, null, 2);
    fs.writeFileSync(SETTINGS_FILE, data, 'utf8');
    
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
}


// todo
function getLoadFunction() {
  return (win) => {
    const outPath = path.join(__dirname, 'out', 'index.html');
    return win.loadFile(outPath);
  };
}

const loadURL = getLoadFunction();

const START_PORT = 6969;
const END_PORT = 7069;
let currentHydrogenPort = null;

let mainWindow;
let isAppInBackground = false;

function isNextJSRunning() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      res.on('data', () => {}); 
      res.on('end', () => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(1000, () => {
      req.abort();
      resolve(false);
    });
    
    req.end();
  });
}

async function waitForNextJS(maxAttempts = 20, interval = 500) {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const isRunning = await isNextJSRunning();
    if (isRunning) {
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
    attempts++;
  }
  
  return false;
}

async function findHydrogenServer() {
  let lastError = '';
  
  try {
    for (let port = START_PORT; port <= END_PORT; port++) {
      const url = `http://127.0.0.1:${port}/secret`;

      try {
        const res = await fetch(url, { method: 'GET' });
        if (res.ok) {
          const text = await res.text();
          if (text === '0xdeadbeef') {
            currentHydrogenPort = port;
            
            return port;
          }
        }
      } catch (e) {
        lastError = e.message;
      }
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function executeScript(scriptContent) {
  if (!scriptContent || scriptContent.trim() === '') {
    throw new Error('Empty script body');
  }

  if (!currentHydrogenPort) {
    currentHydrogenPort = await findHydrogenServer();
    if (!currentHydrogenPort) {
      throw new Error('No Hydrogen server available');
    }
  }

  try {
    const postUrl = `http://127.0.0.1:${currentHydrogenPort}/execute`;
    const response = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: scriptContent
    });

    if (response.ok) {
      const resultText = await response.text();
      return { success: true, message: resultText };
    } else {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
  } catch (error) {
    currentHydrogenPort = null;
    throw error;
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 800,
    minHeight: 500,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      backgroundThrottling: true,
      offscreen: false, 
      webSecurity: true,
      spellcheck: false, 
      enableWebSQL: false, 
      autoplayPolicy: 'user-gesture-required'
    },
    icon: path.join(__dirname, '..', 'resources', 'icons',
      process.platform === 'win32' 
        ? 'icon.ico' 
        : process.platform === 'darwin' 
          ? 'icon.icns' 
          : 'icon.png'
    ),
    frame: false,
    backgroundColor: '#121212',
    show: false,
    paintWhenInitiallyHidden: false,
  });

  mainWindow.on('focus', () => {
    isAppInBackground = false;
    
    if (powerSaveBlockerId !== null) {
      powerSaveBlocker.stop(powerSaveBlockerId);
      powerSaveBlockerId = null;
    }
  });

  mainWindow.on('blur', () => {
    isAppInBackground = true;
  });

  if (app.isPackaged) {

    try {
      const indexPath = path.join(__dirname, '../dist/index.html');

      if (fs.existsSync(indexPath)) {
      } else {

        try {
          const dirPath = path.join(__dirname, '../dist');
          const files = fs.existsSync(dirPath) ? fs.readdirSync(dirPath) : [];
        } catch (dirErr) {
        }
      }
      
      mainWindow.loadFile(indexPath);
      
      mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
        dialog.showErrorBox('Load Failed', `${desc}`);
      });

      mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.show();
      });
    } catch (error) {
      dialog.showErrorBox('Error', `${error.message}`);
    }
  } else {
    const isNextReady = await waitForNextJS();
    
    if (isNextReady) {
      mainWindow.loadURL('http://localhost:3000');
      mainWindow.show();
    } else {
      app.quit();
    }
  }

  mainWindow.webContents.on('did-finish-load', () => {
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (powerSaveBlockerId !== null) {
      powerSaveBlocker.stop(powerSaveBlockerId);
      powerSaveBlockerId = null;
    }
  });
}

initializeNocturnal();

app.whenReady().then(async () => {
  app.commandLine.appendSwitch('js-flags', '--max-old-space-size=150');
  app.commandLine.appendSwitch('disable-renderer-backgrounding');
  
  try {
    await findHydrogenServer();
  } catch (error) {
    console.warn(error.message);
  }

  try {
    await createWindow();
  } catch (error) {
    dialog.showErrorBox('Startup Error', `${error.message}`);
    app.quit();
  }
  
  setInterval(() => {
    if (global.gc && isAppInBackground) {
      global.gc();
    }
  }, 60000); 
});

ipcMain.handle('check-hydrogen', async () => {
  try {
    const port = await findHydrogenServer();
    return { connected: !!port, port };
  } catch (error) {
    console.error(error.message);
    return { connected: false, error: error.message };
  }
});

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (powerSaveBlockerId !== null) {
    powerSaveBlocker.stop(powerSaveBlockerId);
  }
});
