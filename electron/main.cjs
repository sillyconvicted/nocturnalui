const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');
const fetch = require('node-fetch');
const { powerSaveBlocker } = require('electron');
const discordRPC = require('./discord-rpc.cjs');

const isProd = process.env.NODE_ENV === 'production';
let powerSaveBlockerId = null;

const NOCTURNAL_FOLDER = path.join(os.homedir(), 'Nocturnal');
const TABS_FILE = path.join(NOCTURNAL_FOLDER, 'tabs.json');
const SETTINGS_FILE = path.join(NOCTURNAL_FOLDER, 'settings.json');
const AUTO_EXECUTE_FOLDER = path.join(NOCTURNAL_FOLDER, 'autoexecute');
let autoExecuteFiles = [];
let lastJoinTimestamp = 0;
let lastCheckedLogTimestamp = null;
let joinCheckInterval = null;

process.on('uncaughtException', (error) => {
  dialog.showErrorBox('Error', `Join our discord server.`);
});

function initializeNocturnal() {
  ensureNocturnalDir();
  ensureAutoExecuteDir();
  initializeLogging();
  startLogMonitoring();
  loadAutoExecuteFiles();
  
  discordRPC.initRPC().catch(console.error);
  
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

  ipcMain.handle('update-discord-status', async (event, { type, data }) => {
    try {
      switch (type) {
        case 'coding':
          discordRPC.setCodingStatus(data.scriptName);
          break;
        case 'executing':
          discordRPC.setExecutingStatus();
          break;
        case 'idle':
          discordRPC.setIdleStatus();
          break;
        default:
          discordRPC.updateActivity(type);
      }
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error: error.message };
    }
  });

  const LOCAL_SCRIPTS_FILE = path.join(NOCTURNAL_FOLDER, 'local-scripts.json');

  ipcMain.handle('load-local-scripts', async () => {
    try {
      if (fs.existsSync(LOCAL_SCRIPTS_FILE)) {
        const data = fs.readFileSync(LOCAL_SCRIPTS_FILE, 'utf8');
        return { 
          success: true, 
          scripts: JSON.parse(data),
        };
      } else {
        return { 
          success: true, 
          scripts: [],
        };
      }
    } catch (error) {
      console.error(error);
      return { 
        success: false, 
        error: error.message,
      };
    }
  });

  ipcMain.handle('save-local-scripts', async (event, scripts) => {
    try {
      fs.writeFileSync(LOCAL_SCRIPTS_FILE, JSON.stringify(scripts, null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('show-notification', async (event, options) => {
    try {
      const { title, body } = options;
      new Notification({ title, body }).show();
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('execute-tool', async (event, toolId) => {
    try {
      let scriptContent = '';
      
      switch (toolId) {
        case 'dex':
          scriptContent = `loadstring(game:HttpGet("https://raw.githubusercontent.com/Babyhamsta/RBLX_Scripts/main/Universal/BypassedDarkDexV3.lua", true))()`;
          break;
        case 'remotespy':
          scriptContent = `loadstring(game:HttpGet("https://raw.githubusercontent.com/exxtremestuffs/SimpleSpySource/master/SimpleSpy.lua", true))()`;
          break;
        case 'simplespy':
          scriptContent = `loadstring(game:HttpGet("https://github.com/exxtremestuffs/SimpleSpySource/raw/master/SimpleSpy.lua"))()`;
          break;
        case 'infinityyield':
          scriptContent = `loadstring(game:HttpGet('https://raw.githubusercontent.com/EdgeIY/infiniteyield/master/source'))()`;
          break;
        case 'darkdex':
          scriptContent = `loadstring(game:HttpGet("https://raw.githubusercontent.com/Babyhamsta/RBLX_Scripts/main/Universal/BypassedDarkDexV3.lua"))()`;
          break;
        case 'hydroxide':
          scriptContent = `local owner = "Upbolt"
  local branch = "revision"
  
  local function webImport(file)
      return loadstring(game:HttpGetAsync(("https://raw.githubusercontent.com/%s/Hydroxide/%s/%s.lua"):format(owner, branch, file)), file .. '.lua')()
  end
  
  webImport("init")
  webImport("ui/main")`;
          break;
        case 'securedex':
          scriptContent = `loadstring(game:HttpGet("https://raw.githubusercontent.com/Babyhamsta/RBLX_Scripts/main/Universal/Dex%20Explorer.lua"))()`;
          break;
        case 'sirius':
          scriptContent = ``;
          break;
        default:
          return { success: false, message: "Unknown tool: " + toolId };
      }
      
      const result = await executeScript(scriptContent);
      return { success: true, message: `uhh i should remove this` };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('toggle-autoexec', async (event, { script, enabled }) => {
    try {
      const scriptMap = {
        'ultraguard': {
          filename: 'ultraguard.lua',
          content: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/06nk/lzovs-slut/refs/heads/main/antivirus.lua"))()'
        },
        'nocturnal': {
          filename: 'nocturnal-ui.lua',
          content: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/06nk/lzovs-slut/refs/heads/main/internal.lua"))()'
        }
      };

      const scriptInfo = scriptMap[script];
      if (!scriptInfo) {
        return { success: false, error: 'Invalid script type' };
      }

      const scriptPath = path.join(AUTO_EXECUTE_FOLDER, scriptInfo.filename);

      if (enabled) {
        await fs.promises.writeFile(scriptPath, scriptInfo.content, 'utf8');
        loadAutoExecuteFiles();
        return { success: true, enabled: true };
      } else {
        if (fs.existsSync(scriptPath)) {
          await fs.promises.unlink(scriptPath);
          loadAutoExecuteFiles(); 
        }
        return { success: true, enabled: false };
      }
    } catch (error) {
      console.error(error);
      return { success: false, error: error.message };
    }
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

function ensureAutoExecuteDir() {
  if (!fs.existsSync(AUTO_EXECUTE_FOLDER)) {
    try {
      fs.mkdirSync(AUTO_EXECUTE_FOLDER, { recursive: true });
    } catch (error) {
      console.error(error);
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
    const req = http.get('http://localhost:3969', (res) => {
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
    discordRPC.setExecutingStatus();
    
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
  } finally {
    discordRPC.setCodingStatus();
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
      mainWindow.loadURL('http://localhost:3969');
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

function initializeLogging() {
  ipcMain.handle('read-roblox-logs', async () => {
    try {
      const robloxLogsPath = path.join(os.homedir(), 'Library', 'Logs', 'Roblox');
      
      if (!fs.existsSync(robloxLogsPath)) {
        return { 
          success: false, 
          error: `Roblox logs directory not found at ${robloxLogsPath}` 
        };
      }
      
      const files = fs.readdirSync(robloxLogsPath)
        .filter(file => file.endsWith('.log'))
        .map(file => {
          const filePath = path.join(robloxLogsPath, file);
          const stats = fs.statSync(filePath);
          return { 
            name: file, 
            path: filePath, 
            mtime: stats.mtime 
          };
        })
        .sort((a, b) => b.mtime - a.mtime); 
      
      if (files.length === 0) {
        return { 
          success: false, 
          error: 'No log files found' 
        };
      }
      
      const latestLog = files[0];
      const logContent = fs.readFileSync(latestLog.path, 'utf8');
      
      const result = parseLogEntries(logContent);
      
      return { 
        success: true, 
        entries: result.entries,
        filteredCount: result.filteredCount,
        totalCount: result.totalCount,
        file: latestLog.name
      };
    } catch (error) {
      console.error(error);
      return { 
        success: false, 
        error: error.message || 'Unknown error' 
      };
    }
  });
}

function parseLogEntries(logContent) {
  const lines = logContent.split('\n').filter(line => line.trim() !== '');
  
  const logPattern = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z),.*?\[(FLog::.*?)\] (.*)$/;
  
  let totalEntries = 0;
  let filteredEntries = 0;
  
  const filtered = lines
    .map(line => {
      const match = line.match(logPattern);
      if (match) {
        totalEntries++;
        const [_, timestamp, logType, message] = match;
        
        const filtersLowerCase = [
          'settings date',
          'date header',
          'date timestamp',
          'clientruninfo',
          'updatecontroller',
          'appdelegate',
          'settingsurl',
          'graphics',
          'surfacecontroller',
          'network',
          'singlesurfaceapp',
          'iscovery-ota',
          '_inexperiencepatch',
          '_universalapppatch',
          'audiofocusservice',
          'datamodelpatchconfigurer'
        ];
        
        const messageLower = message.toLowerCase();
        
        if (filtersLowerCase.some(filter => messageLower.includes(filter))) {
          filteredEntries++;
          return null;
        }
        
        if (logType.includes('ClientAppSettingsRebranding') || 
            logType.includes('ClientRunInfo') ||
            logType.includes('UpdateController') ||
            logType.includes('AppDelegate')) {
          filteredEntries++;
          return null;
        }
        
        return {
          timestamp,
          text: `[${logType}] ${message}`
        };
      }
      return null;
    })
    .filter(entry => entry !== null);
  
  return {
    entries: filtered.slice(-1000).reverse(),
    filteredCount: filteredEntries,
    totalCount: totalEntries
  };
}

function loadAutoExecuteFiles() {
  try {
    if (fs.existsSync(AUTO_EXECUTE_FOLDER)) {
      autoExecuteFiles = fs.readdirSync(AUTO_EXECUTE_FOLDER)
        .filter(file => file.endsWith('.lua') || file.endsWith('.txt'))
        .map(file => path.join(AUTO_EXECUTE_FOLDER, file))
        .sort();
    }
  } catch (error) {
    console.error(error);
    autoExecuteFiles = [];
  }
}

function startLogMonitoring() {
  try {
    fs.watch(AUTO_EXECUTE_FOLDER, (eventType, filename) => {
      if (filename && (filename.endsWith('.lua') || filename.endsWith('.txt'))) {
        loadAutoExecuteFiles();
      }
    });
  } catch (error) {
    console.error(error);
  }
  
  joinCheckInterval = setInterval(checkForRecentGameJoin, 5000);
}

async function checkForRecentGameJoin() {
  if (autoExecuteFiles.length === 0 || !currentHydrogenPort) return;
  
  try {
    const robloxLogsPath = path.join(os.homedir(), 'Library', 'Logs', 'Roblox');
    if (!fs.existsSync(robloxLogsPath)) return;
    
    const files = fs.readdirSync(robloxLogsPath)
      .filter(file => file.endsWith('.log'))
      .map(file => {
        const filePath = path.join(robloxLogsPath, file);
        const stats = fs.statSync(filePath);
        return { name: file, path: filePath, mtime: stats.mtime };
      })
      .sort((a, b) => b.mtime - a.mtime);
    
    if (files.length === 0) return;
    
    const latestLog = files[0];
    const logContent = fs.readFileSync(latestLog.path, 'utf8');
    
    const lines = logContent.split('\n');
    const joinLines = lines.filter(line => {
      return line.includes('[FLog::Output] ! Joining game');
    });
    
    if (joinLines.length === 0) return;
    
    const timestamp = getTimestampFromLogLine(joinLines[joinLines.length - 1]);
    if (!timestamp) return;
    
    const joinTime = new Date(timestamp).getTime();
    const now = Date.now();
    const isRecentJoin = now - joinTime < 30000; 
    const isNewJoin = lastCheckedLogTimestamp === null || joinTime > lastCheckedLogTimestamp;
    
    if (isRecentJoin && isNewJoin && now - lastJoinTimestamp > 60000) {
      lastJoinTimestamp = now;
      lastCheckedLogTimestamp = joinTime;
      
      await new Promise(resolve => setTimeout(resolve, 2500));
      for (const filePath of autoExecuteFiles) {
        try {
          const scriptContent = fs.readFileSync(filePath, 'utf8');
          await executeScript(scriptContent);
        } catch (error) {
          console.error(error);
        }
      }
    }

    if (lastCheckedLogTimestamp === null || joinTime > lastCheckedLogTimestamp) {
      lastCheckedLogTimestamp = joinTime;
    }
  } catch (error) {
    console.error(error);
  }
}

function getTimestampFromLogLine(line) {
  const match = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
  return match ? match[1] : null;
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

ipcMain.handle('execute-auto-scripts', async () => {
  try {
    if (autoExecuteFiles.length === 0) {
      return { 
        success: false, 
        message: "No auto-execute scripts found."
      };
    }
    
    const results = [];
    for (const filePath of autoExecuteFiles) {
      try {
        const scriptContent = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath);
        
        const result = await executeScript(scriptContent);
        results.push({ 
          file: fileName, 
          success: result.success,
          message: result.success ? "Executed successfully" : result.message
        });
      } catch (error) {
        results.push({ 
          file: path.basename(filePath), 
          success: false,
          message: error.message
        });
      }
    }
    
    return { 
      success: true, 
      results,
      count: autoExecuteFiles.length
    };
  } catch (error) {
    return { 
      success: false, 
      message: error.message
    };
  }
});

ipcMain.handle('open-autoexec-folder', () => {
  try {
    if (!fs.existsSync(AUTO_EXECUTE_FOLDER)) {
      ensureAutoExecuteDir();
    }
    
    const { shell } = require('electron');
    shell.openPath(AUTO_EXECUTE_FOLDER);
    
    return { success: true, path: AUTO_EXECUTE_FOLDER };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-autoexec-info', () => {
  try {
    const scriptInfo = autoExecuteFiles.map(filePath => {
      try {
        const stats = fs.statSync(filePath);
        return {
          name: path.basename(filePath),
          path: filePath,
          size: stats.size,
          modified: stats.mtime
        };
      } catch (error) {
        return {
          name: path.basename(filePath),
          path: filePath,
          error: 'Could not read file'
        };
      }
    });
    
    return { 
      success: true, 
      scripts: scriptInfo,
      folder: AUTO_EXECUTE_FOLDER
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
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
  
  if (joinCheckInterval) {
    clearInterval(joinCheckInterval);
    joinCheckInterval = null;
  }
  
  discordRPC.destroyRPC();
});
