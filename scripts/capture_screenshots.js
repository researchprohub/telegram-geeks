const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const outDir = path.join('C:', 'Users', 'SMG', '.gemini', 'antigravity', 'brain', 'cc449879-0c5b-43c7-944e-34b5771efb8f', 'screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const pages = [
  { name: 'home', url: 'http://localhost:3000/' },
  { name: 'demo', url: 'http://localhost:3000/demo' },
  { name: 'download', url: 'http://localhost:3000/download' },
  { name: 'contacts', url: 'http://localhost:3000/contacts' },
  { name: 'blog', url: 'http://localhost:3000/blog' },
  { name: 'blog_article', url: 'http://localhost:3000/blog/telegram-scraper-guide-2026' },
  { name: 'reviews', url: 'http://localhost:3000/reviews' },
  { name: 'manuals', url: 'http://localhost:3000/manuals' },
  { name: 'partner', url: 'http://localhost:3000/partner' },
  { name: 'benefits', url: 'http://localhost:3000/telegram-promotion' },
  { name: 'updates', url: 'http://localhost:3000/upd' },
];

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

  for (const p of pages) {
    console.log(`Loading ${p.name} (${p.url})...`);
    try {
      await win.loadURL(p.url, { waitUntil: 'networkidle0' });
      await win.webContents.executeJavaScript(`
        new Promise((resolve) => {
          if (document.readyState === 'complete') resolve();
          else window.addEventListener('load', resolve);
        });
      `);
      // Wait for framer-motion and styles to mount
      await new Promise((r) => setTimeout(r, 2000));
      const image = await win.webContents.capturePage({ x: 0, y: 0, width: 1440, height: 900 });
      const filePath = path.join(outDir, `${p.name}.png`);
      fs.writeFileSync(filePath, image.toPNG());
      console.log(`Saved screenshot: ${filePath}`);
    } catch (err) {
      console.error(`Failed on ${p.name}:`, err.message);
    }
  }

  win.close();
  app.quit();
});
