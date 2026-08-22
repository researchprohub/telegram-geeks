const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const frontendPublic = path.join(__dirname, '..', 'frontend', 'public');
const brandDir = path.join(frontendPublic, 'assets', 'brand');
const heroDir = path.join(frontendPublic, 'assets', 'hero');
const desktopBuild = path.join(__dirname, '..', 'desktop', 'build');
const desktopResources = path.join(__dirname, '..', 'desktop', 'resources');
const desktopPublic = path.join(__dirname, '..', 'desktop', 'public');

[brandDir, heroDir, desktopBuild, desktopResources, desktopPublic].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const logoSvgPath = path.join(brandDir, 'logo-icon.svg');
const logoFullSvgPath = path.join(brandDir, 'logo-full.svg');

app.whenReady().then(async () => {
  console.log('Generating brand raster assets via headless Electron...');

  async function renderSvgToPng(svgPath, outPath, width, height) {
    const win = new BrowserWindow({
      width: width,
      height: height,
      show: false,
      transparent: true,
      frame: false,
      enableLargerThanScreen: true,
      webPreferences: { offscreen: true },
    });

    const svgContent = fs.readFileSync(svgPath, 'utf-8');
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; display: flex; align-items: center; justify-content: center; }
            img { width: 100%; height: 100%; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
        </body>
      </html>
    `;

    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    await new Promise((r) => setTimeout(r, 600));

    const image = await win.webContents.capturePage({ x: 0, y: 0, width, height });
    fs.writeFileSync(outPath, image.toPNG());
    console.log(`Generated: ${outPath} (${width}x${height})`);
    win.close();
  }

  // 1. Brand Logo Mark at 512x512
  await renderSvgToPng(logoSvgPath, path.join(brandDir, 'logo-icon.png'), 512, 512);

  // 2. Favicons & Web App Icons
  await renderSvgToPng(logoSvgPath, path.join(frontendPublic, 'icon.png'), 512, 512);
  await renderSvgToPng(logoSvgPath, path.join(frontendPublic, 'apple-touch-icon.png'), 180, 180);
  await renderSvgToPng(logoSvgPath, path.join(frontendPublic, 'favicon-32x32.png'), 32, 32);
  await renderSvgToPng(logoSvgPath, path.join(frontendPublic, 'favicon-16x16.png'), 16, 16);
  await renderSvgToPng(logoSvgPath, path.join(frontendPublic, 'favicon.ico'), 64, 64);

  // 3. Full Brand Logo at 1200x240 and 600x120
  await renderSvgToPng(logoFullSvgPath, path.join(brandDir, 'logo-full.png'), 1200, 240);

  // 4. Desktop Icons
  await renderSvgToPng(logoSvgPath, path.join(desktopBuild, 'icon.png'), 512, 512);
  await renderSvgToPng(logoSvgPath, path.join(desktopBuild, 'icon.ico'), 256, 256);
  await renderSvgToPng(logoSvgPath, path.join(desktopResources, 'icon.png'), 512, 512);
  await renderSvgToPng(logoSvgPath, path.join(desktopResources, 'icon.ico'), 256, 256);
  await renderSvgToPng(logoSvgPath, path.join(desktopPublic, 'icon.png'), 512, 512);
  await renderSvgToPng(logoSvgPath, path.join(desktopPublic, 'favicon.svg'), 128, 128);

  // 5. OpenGraph 1200x630 Social Preview Card
  const ogHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          body { width: 1200px; height: 630px; background: #080c14; color: #ffffff; display: flex; flex-direction: column; justify-content: space-between; padding: 60px 80px; position: relative; overflow: hidden; }
          .bg-glow { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(47,252,212,0.18) 0%, rgba(56,189,248,0.06) 50%, transparent 70%); top: -100px; right: -100px; }
          .grid-pattern { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px); background-size: 32px 32px; opacity: 0.4; }
          .content { position: relative; z-index: 10; }
          .badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 20px; background: rgba(47,252,212,0.12); border: 1px solid rgba(47,252,212,0.3); color: #2ffcd4; font-size: 14px; font-weight: 700; margin-bottom: 24px; }
          h1 { font-size: 54px; font-weight: 900; line-height: 1.15; letter-spacing: -1px; margin-bottom: 16px; max-width: 900px; }
          .cyan { color: #2ffcd4; background: linear-gradient(90deg, #2ffcd4, #00f2fe); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          p { font-size: 20px; color: #94a3b8; max-width: 800px; line-height: 1.5; }
          .features { display: flex; gap: 24px; margin-top: 36px; }
          .pill { padding: 10px 20px; border-radius: 12px; background: #101726; border: 1px solid #222d42; font-size: 15px; font-weight: 600; color: #f1f5f9; display: flex; align-items: center; gap: 10px; }
          .pill-dot { width: 8px; height: 8px; border-radius: 50%; background: #2ffcd4; box-shadow: 0 0 8px #2ffcd4; }
          .footer { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 10; border-top: 1px solid #222d42; padding-top: 24px; }
          .domain { font-size: 18px; font-weight: 700; color: #2ffcd4; font-family: monospace; }
          .tag { font-size: 14px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="grid-pattern"></div>
        <div class="bg-glow"></div>
        
        <div class="content">
          <div class="badge">⚡ TELEGRAM GEEKS PRO • NEXT-GEN AUTOMATION</div>
          <h1>Scale Telegram Growth with <span class="cyan">AI Personas & 77+ MTProto Modules</span></h1>
          <p>Enterprise mass outreach, high-speed audience scrapers, 2-way TData converter, and zero-ban fingerprint cloaking.</p>
          
          <div class="features">
            <div class="pill"><div class="pill-dot"></div> 77 MTProto Modules</div>
            <div class="pill"><div class="pill-dot"></div> Autonomous AI Personas</div>
            <div class="pill"><div class="pill-dot"></div> TData 2-Way Converter</div>
            <div class="pill"><div class="pill-dot"></div> Zero Cloud Lock-in</div>
          </div>
        </div>

        <div class="footer">
          <div class="domain">telegramgeeks.pro</div>
          <div class="tag">Windows Desktop & Web Cloud Automation Suite</div>
        </div>
      </body>
    </html>
  `;

  const ogWin = new BrowserWindow({
    width: 1200,
    height: 630,
    show: false,
    webPreferences: { offscreen: true },
  });
  await ogWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(ogHtml)}`);
  await new Promise((r) => setTimeout(r, 800));
  const ogImage = await ogWin.webContents.capturePage({ x: 0, y: 0, width: 1200, height: 630 });
  fs.writeFileSync(path.join(heroDir, 'screenshot.png'), ogImage.toPNG());
  fs.writeFileSync(path.join(heroDir, 'og-preview.png'), ogImage.toPNG());
  console.log(`Generated: ${path.join(heroDir, 'screenshot.png')} (1200x630)`);
  ogWin.close();

  console.log('All brand assets successfully generated!');
  app.quit();
});
