const { app, BrowserWindow, session } = require('electron');
const fs = require('fs');
const path = require('path');

const targetUrls = [
  'http://localhost:3000/',
  'http://localhost:3000/download',
  'http://localhost:3000/blog',
  'http://localhost:3000/login',
  'http://localhost:3000/register',
  'http://localhost:3000/cn',
  'http://localhost:3000/cn/download',
  'http://localhost:3000/cn/blog',
];

// Read static articles from file safely
const staticArticlesFile = path.join(__dirname, '..', 'frontend', 'src', 'data', 'static-articles.ts');
const rawTs = fs.readFileSync(staticArticlesFile, 'utf-8');
const slugMatches = rawTs.match(/"slug":\s*"([^"]+)"/g) || [];

for (const m of slugMatches) {
  const slug = m.match(/"slug":\s*"([^"]+)"/)[1];
  targetUrls.push(`http://localhost:3000/blog/${slug}`);
}

console.log(`Prepared ${targetUrls.length} URLs to test.`);

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    webPreferences: { offscreen: true }
  });

  const brokenNetworkRequests = [];
  const brokenDomImages = [];

  session.defaultSession.webRequest.onCompleted((details) => {
    if (details.statusCode >= 400 && !details.url.includes('favicon.ico') && !details.url.includes('socket.io')) {
      brokenNetworkRequests.push({ url: details.url, status: details.statusCode, from: details.referrer });
    }
  });

  console.log(`Auditing ${targetUrls.length} pages across the site for broken images & 404s...\n`);

  for (let i = 0; i < targetUrls.length; i++) {
    const url = targetUrls[i];
    try {
      await win.loadURL(url);
      await new Promise(r => setTimeout(r, 600));

      const pageResults = await win.webContents.executeJavaScript(`
        (() => {
          const images = Array.from(document.querySelectorAll('img'));
          const broken = [];
          for (const img of images) {
            if (!img.complete || img.naturalWidth === 0) {
              broken.push({ src: img.src, currentSrc: img.currentSrc, alt: img.alt });
            }
          }
          return { totalImgs: images.length, broken };
        })()
      `);

      if (pageResults.broken.length > 0) {
        console.log(`❌ Page ${url}: Found ${pageResults.broken.length} broken images (out of ${pageResults.totalImgs})`);
        for (const b of pageResults.broken) {
          console.log(`   - Src: ${b.src} | Alt: ${b.alt}`);
          brokenDomImages.push({ page: url, ...b });
        }
      }
    } catch (err) {
      console.log(`Error loading ${url}:`, err.message);
    }
  }

  console.log('\n======================================');
  console.log(`AUDIT COMPLETE:`);
  console.log(`Total Pages Tested: ${targetUrls.length}`);
  console.log(`Broken Network Requests (404/500): ${brokenNetworkRequests.length}`);
  console.log(`Broken DOM <img> elements: ${brokenDomImages.length}`);
  console.log('======================================');

  if (brokenNetworkRequests.length > 0) {
    console.log('\n--- Failed Network Requests ---');
    for (const req of brokenNetworkRequests) {
      console.log(`Status ${req.status}: ${req.url} (Referrer: ${req.from})`);
    }
  }

  if (brokenDomImages.length > 0) {
    console.log('\n--- Broken DOM Images ---');
    for (const img of brokenDomImages) {
      console.log(`Page: ${img.page} -> Broken img src: ${img.src}`);
    }
  }

  win.close();
  app.quit();
});
