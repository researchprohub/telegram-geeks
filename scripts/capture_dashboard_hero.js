const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const heroDir = path.join(__dirname, '..', 'frontend', 'public', 'assets', 'hero');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1400,
    height: 860,
    show: false,
    webPreferences: { offscreen: true },
  });

  console.log('Capturing live dashboard for Hero image...');
  await win.loadURL('http://localhost:3000/dashboard');
  await new Promise((r) => setTimeout(r, 2000));

  const img = await win.webContents.capturePage({ x: 0, y: 0, width: 1400, height: 860 });
  const outPath = path.join(heroDir, 'dashboard_capture.png');
  fs.writeFileSync(outPath, img.toPNG());
  console.log(`Saved: ${outPath}`);
  win.close();
  app.quit();
});
