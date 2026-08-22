const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const screenshotsDir = path.join('C:', 'Users', 'SMG', '.gemini', 'antigravity', 'brain', 'cc449879-0c5b-43c7-944e-34b5771efb8f', 'screenshots');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 1100,
    show: false,
    webPreferences: { offscreen: true }
  });

  console.log('Capturing /blog/telegram-channel-cloner-migration-guide ...');
  await win.loadURL('http://localhost:3000/blog/telegram-channel-cloner-migration-guide');
  await new Promise(r => setTimeout(r, 2000));
  const clonerImg = await win.webContents.capturePage({ x: 0, y: 0, width: 1440, height: 1100 });
  fs.writeFileSync(path.join(screenshotsDir, 'article_channel_cloner_verified.png'), clonerImg.toPNG());

  console.log('Capturing /blog/telegram-crypto-community-growth-playbook ...');
  await win.loadURL('http://localhost:3000/blog/telegram-crypto-community-growth-playbook');
  await new Promise(r => setTimeout(r, 2000));
  const cryptoImg = await win.webContents.capturePage({ x: 0, y: 0, width: 1440, height: 1100 });
  fs.writeFileSync(path.join(screenshotsDir, 'article_crypto_growth_verified.png'), cryptoImg.toPNG());

  console.log('Screenshots captured successfully!');
  win.close();
  app.quit();
});
