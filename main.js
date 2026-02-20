const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const CONFIG = {
  gameUrl: process.env.GAME_URL || 'https://example.com/flash-game',
  fullscreen: true,
  width: 1280,
  height: 800,
  resizable: true
};

function getFlashPluginPath() {
  const pluginsDir = app.isPackaged
    ? path.join(process.resourcesPath, 'plugins')
    : path.join(__dirname, 'plugins');

  switch (process.platform) {
    case 'win32':
      const win64 = path.join(pluginsDir, 'pepflashplayer64.dll');
      const win32 = path.join(pluginsDir, 'pepflashplayer.dll');
      return fs.existsSync(win64) ? win64 : win32;

    case 'darwin':
      const systemPath = '/Library/Internet Plug-Ins/PepperFlashPlayer/PepperFlashPlayer.plugin';
      if (fs.existsSync(systemPath)) {
        return systemPath;
      }
      return path.join(pluginsDir, 'PepperFlashPlayer.plugin');

    case 'linux':
      return path.join(pluginsDir, 'libpepflashplayer.so');

    default:
      return null;
  }
}

function getFlashVersion() {
  return '32.0.0.344';
}

function initializeFlash() {
  const flashPath = getFlashPluginPath();

  if (!flashPath) {
    return false;
  }

  if (!fs.existsSync(flashPath)) {
    return false;
  }

  app.commandLine.appendSwitch('ppapi-flash-path', flashPath);
  app.commandLine.appendSwitch('ppapi-flash-version', getFlashVersion());
  app.commandLine.appendSwitch('enable-plugins');
  app.commandLine.appendSwitch('allow-outdated-plugins');
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-web-security');
  app.commandLine.appendSwitch('ignore-certificate-errors');
  app.commandLine.appendSwitch('disable-features', 'BlockInsecurePrivateNetworkRequests');

  return true;
}

function flashPluginExists() {
  const flashPath = getFlashPluginPath();
  return flashPath && fs.existsSync(flashPath);
}

let mainWindow;
let flashAvailable = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: CONFIG.width,
    height: CONFIG.height,
    resizable: CONFIG.resizable,
    fullscreen: CONFIG.fullscreen,
    webPreferences: {
      plugins: true,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Flash Player',
    center: true
  });

  Menu.setApplicationMenu(null);

  if (flashAvailable) {
    mainWindow.loadURL(CONFIG.gameUrl);
  } else {
    mainWindow.loadFile('index.html');
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      event.preventDefault();
    }
    if (input.control && input.shift && ['I', 'J', 'C'].includes(input.key)) {
      event.preventDefault();
    }
    if (input.control && input.key === 'U') {
      event.preventDefault();
    }
  });
}

flashAvailable = initializeFlash();

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
