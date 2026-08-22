const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const screenshotsDir = path.join('C:', 'Users', 'SMG', '.gemini', 'antigravity', 'brain', 'cc449879-0c5b-43c7-944e-34b5771efb8f', 'screenshots');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 1080,
    show: false,
    webPreferences: { offscreen: true },
  });

  console.log('Capturing homepage hero...');
  await win.loadURL('http://localhost:3000/');
  await new Promise((r) => setTimeout(r, 2500));

  const img = await win.webContents.capturePage({ x: 0, y: 0, width: 1440, height: 1080 });
  const outPath = path.join(screenshotsDir, 'homepage_hero_fixed.png');
  fs.writeFileSync(outPath, img.toPNG());
  console.log(`Saved: ${outPath}`);

  win.close();
  app.quit();
});
