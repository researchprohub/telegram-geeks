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
    console.log('Navigating to login...');
    await win.loadURL('http://localhost:3000/login');
    await new Promise((r) => setTimeout(r, 1000));

    console.log('Executing login fetch directly...');
    await win.webContents.executeJavaScript(`
      (async () => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'demo@test.com', password: 'demo123' })
        });
        const data = await res.json();
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          document.cookie = 'access_token=' + data.access_token + '; path=/; SameSite=Lax';
        }
      })()
    `);

    await new Promise((r) => setTimeout(r, 1500));

    const dashboardPages = [
      { name: 'dashboard_overview', url: 'http://localhost:3000/dashboard' },
      { name: 'dashboard_upload', url: 'http://localhost:3000/dashboard/accounts/upload' },
      { name: 'dashboard_settings', url: 'http://localhost:3000/dashboard/settings' },
      { name: 'dashboard_modules', url: 'http://localhost:3000/dashboard/modules' },
    ];

    for (const p of dashboardPages) {
      console.log(`Capturing ${p.name} (${p.url})...`);
      await win.loadURL(p.url);
      await new Promise((r) => setTimeout(r, 2500));
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
