const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
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

function showUrlPrompt(currentUrl) {
  return new Promise((resolve) => {
    let resolved = false;

    const promptWindow = new BrowserWindow({
      width: 500,
      height: 180,
      parent: mainWindow,
      modal: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    promptWindow.setMenu(null);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; background: #f5f5f5; margin: 0; }
          h3 { margin: 0 0 15px 0; color: #333; }
          input { width: 100%; padding: 10px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
          .buttons { margin-top: 15px; text-align: right; }
          button { padding: 8px 20px; margin-left: 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
          .ok { background: #007bff; color: white; }
          .ok:hover { background: #0056b3; }
          .cancel { background: #ccc; }
          .cancel:hover { background: #999; }
        </style>
      </head>
      <body>
        <h3>Enter Server URL</h3>
        <input type="text" id="url" value="${currentUrl}">
        <div class="buttons">
          <button class="cancel" id="cancelBtn">Cancel</button>
          <button class="ok" id="okBtn">OK</button>
        </div>
        <script>
          const { ipcRenderer } = require('electron');
          const urlInput = document.getElementById('url');

          urlInput.focus();
          urlInput.select();

          document.getElementById('okBtn').onclick = function() {
            ipcRenderer.send('url-prompt-result', urlInput.value.trim());
          };

          document.getElementById('cancelBtn').onclick = function() {
            ipcRenderer.send('url-prompt-result', null);
          };

          urlInput.onkeydown = function(e) {
            if (e.key === 'Enter') {
              ipcRenderer.send('url-prompt-result', urlInput.value.trim());
            } else if (e.key === 'Escape') {
              ipcRenderer.send('url-prompt-result', null);
            }
          };
        </script>
      </body>
      </html>
    `;

    const handler = (event, url) => {
      if (!resolved) {
        resolved = true;
        ipcMain.removeListener('url-prompt-result', handler);
        if (!promptWindow.isDestroyed()) {
          promptWindow.close();
        }
        resolve(url);
      }
    };

    ipcMain.on('url-prompt-result', handler);

    promptWindow.on('closed', () => {
      if (!resolved) {
        resolved = true;
        ipcMain.removeListener('url-prompt-result', handler);
        resolve(null);
      }
    });

    promptWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    promptWindow.once('ready-to-show', () => {
      promptWindow.show();
    });
  });
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
    center: true,
    autoHideMenuBar: true
  });

  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Change Server URL',
          accelerator: 'CmdOrCtrl+L',
          click: async () => {
            const newUrl = await showUrlPrompt(CONFIG.gameUrl);
            if (newUrl && newUrl !== CONFIG.gameUrl) {
              CONFIG.gameUrl = newUrl;
              console.log('Loading new URL:', CONFIG.gameUrl);
              mainWindow.loadURL(CONFIG.gameUrl);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.reload()
        },
        {
          label: 'Hard Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            mainWindow.webContents.session.clearCache();
            mainWindow.reload();
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const zoom = mainWindow.webContents.getZoomFactor();
            mainWindow.webContents.setZoomFactor(zoom + 0.1);
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const zoom = mainWindow.webContents.getZoomFactor();
            mainWindow.webContents.setZoomFactor(Math.max(0.1, zoom - 0.1));
          }
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.setZoomFactor(1);
          }
        },
        { type: 'separator' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Flash Player',
              message: 'Flash Player',
              detail: `Electron: ${process.versions.electron}\nChrome: ${process.versions.chrome}\nFlash: ${flashAvailable ? getFlashVersion() : 'Not installed'}`
            });
          }
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    menuTemplate.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  if (flashAvailable) {
    mainWindow.loadURL(CONFIG.gameUrl);
  } else {
    mainWindow.loadFile('index.html');
  }

  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
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
