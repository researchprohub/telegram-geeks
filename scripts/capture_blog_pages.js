const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const screenshotsDir = path.join('C:', 'Users', 'SMG', '.gemini', 'antigravity', 'brain', 'cc449879-0c5b-43c7-944e-34b5771efb8f', 'screenshots');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 1100,
    show: false,
    webPreferences: { offscreen: true },
  });

  console.log('Capturing /download page...');
  await win.loadURL('http://localhost:3000/download');
  await new Promise((r) => setTimeout(r, 2500));
  const downloadImg = await win.webContents.capturePage({ x: 0, y: 0, width: 1440, height: 1100 });
  fs.writeFileSync(path.join(screenshotsDir, 'download_page_updated.png'), downloadImg.toPNG());

  console.log('Capturing redesigned /blog/telegram-scraper-guide-2026 ...');
  await win.loadURL('http://localhost:3000/blog/telegram-scraper-guide-2026');
  await new Promise((r) => setTimeout(r, 2500));
  const articleImg = await win.webContents.capturePage({ x: 0, y: 0, width: 1440, height: 1100 });
  fs.writeFileSync(path.join(screenshotsDir, 'single_blog_page_redesigned.png'), articleImg.toPNG());

  console.log('Screenshots captured successfully!');
  win.close();
  app.quit();
});
