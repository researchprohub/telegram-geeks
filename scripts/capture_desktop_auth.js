const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const outDir = path.join('C:', 'Users', 'SMG', '.gemini', 'antigravity', 'brain', 'cc449879-0c5b-43c7-944e-34b5771efb8f', 'screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

app.whenReady().then(async () => {
  ipcMain.handle('token:get', () => null);
  ipcMain.handle('backend:status', () => ({ running: true, started: true }));
  ipcMain.handle('hwid:get', () => 'HWID-TEST-0001-ABCD');

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'desktop', 'electron', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  try {
    const distPath = path.join(__dirname, '..', 'desktop', 'dist', 'index.html');
    console.log('Loading desktop login:', distPath);
    await win.loadURL(`file://${distPath}#/login`);
    await new Promise((r) => setTimeout(r, 2000));
    
    let image = await win.webContents.capturePage({ x: 0, y: 0, width: 1280, height: 800 });
    let filePath = path.join(outDir, 'desktop_login.png');
    fs.writeFileSync(filePath, image.toPNG());
    console.log(`Saved screenshot: ${filePath}`);

    console.log('Loading desktop register:', distPath);
    await win.loadURL(`file://${distPath}#/register`);
    await new Promise((r) => setTimeout(r, 2000));
    image = await win.webContents.capturePage({ x: 0, y: 0, width: 1280, height: 800 });
    filePath = path.join(outDir, 'desktop_register.png');
    fs.writeFileSync(filePath, image.toPNG());
    console.log(`Saved screenshot: ${filePath}`);
  } catch (err) {
    console.error('Error during desktop capture:', err);
  }

  win.close();
  app.quit();
});
