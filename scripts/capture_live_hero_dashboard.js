const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const heroDir = path.join(__dirname, '..', 'frontend', 'public', 'assets', 'hero');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    webPreferences: {
      offscreen: true,
    },
  });

  console.log('Navigating to http://localhost:3000/login ...');
  await win.loadURL('http://localhost:3000/login');
  await new Promise((r) => setTimeout(r, 1000));

  console.log('Sending login API request from browser context...');
  const loginRes = await win.webContents.executeJavaScript(`
    (async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'demo@test.com', password: 'demo123' })
        });
        return { status: res.status, ok: res.ok };
      } catch (err) {
        return { error: err.message };
      }
    })();
  `);

  console.log('Login result:', loginRes);

  console.log('Navigating to /dashboard/modules ...');
  await win.loadURL('http://localhost:3000/dashboard/modules');
  await new Promise((r) => setTimeout(r, 2500));

  console.log('Current URL:', win.webContents.getURL());

  const img = await win.webContents.capturePage({ x: 0, y: 0, width: 1440, height: 900 });
  const heroPng = path.join(heroDir, 'screenshot.png');
  fs.writeFileSync(heroPng, img.toPNG());
  console.log(`Saved live dashboard screenshot to: ${heroPng}`);

  win.close();
  app.quit();
});
