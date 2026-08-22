const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const outDir = path.join('C:', 'Users', 'SMG', '.gemini', 'antigravity', 'brain', 'cc449879-0c5b-43c7-944e-34b5771efb8f', 'screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  try {
    const pages = [
      { name: 'web_login', url: 'http://localhost:3000/login' },
      { name: 'web_register', url: 'http://localhost:3000/register' },
    ];

    for (const p of pages) {
      console.log(`Capturing ${p.name} (${p.url})...`);
      await win.loadURL(p.url);
      await new Promise((r) => setTimeout(r, 2000));
      const image = await win.webContents.capturePage({ x: 0, y: 0, width: 1440, height: 900 });
      const filePath = path.join(outDir, `${p.name}.png`);
      fs.writeFileSync(filePath, image.toPNG());
      console.log(`Saved screenshot: ${filePath}`);
    }
  } catch (err) {
    console.error('Error during capture:', err);
  }

  win.close();
  app.quit();
});
