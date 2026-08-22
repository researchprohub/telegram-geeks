const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'frontend', 'src');
const publicDir = path.join(__dirname, '..', 'frontend', 'public');

function getAllFiles(dir, exts = ['.tsx', '.ts', '.jsx', '.js', '.json', '.css', '.md']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        results = results.concat(getAllFiles(filePath, exts));
      }
    } else {
      if (exts.includes(path.extname(file))) {
        results.push(filePath);
      }
    }
  }
  return results;
}

const allSrcFiles = getAllFiles(srcDir);

// Regex patterns to find images
const imgPatterns = [
  /<img[^>]+src=["']([^"']+)["']/g,
  /<Image[^>]+src=["']([^"']+)["']/g,
  /!\[[^\]]*\]\(([^)]+)\)/g,
  /cover_image:\s*["']([^"']+)["']/g,
  /url\(["']?([^"')]+)["']?\)/g,
  /["'](\/assets\/[^"']+)["']/g,
  /["'](\/img\/[^"']+)["']/g,
  /["'](\/favicon[^"']+)["']/g,
];

const foundUrls = new Set();
const fileUsages = {};

for (const file of allSrcFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  for (const pattern of imgPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let url = match[1];
      if (url && (url.startsWith('/') || url.startsWith('http') || url.includes('.svg') || url.includes('.png') || url.includes('.jpg') || url.includes('.webp') || url.includes('.ico'))) {
        foundUrls.add(url);
        if (!fileUsages[url]) fileUsages[url] = [];
        fileUsages[url].push(path.relative(path.join(__dirname, '..'), file));
      }
    }
  }
}

console.log(`Auditing ${foundUrls.size} unique image references...\n`);

const missing = [];
const existing = [];

for (const url of foundUrls) {
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    continue;
  }
  // Strip query params or hash
  const cleanPath = url.split('?')[0].split('#')[0];
  const localFile = path.join(publicDir, cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath);
  
  if (fs.existsSync(localFile)) {
    existing.push({ url, localFile });
  } else {
    missing.push({ url, localFile, usedIn: fileUsages[url] });
  }
}

console.log(`=== MISSING / BROKEN IMAGES (${missing.length}) ===`);
for (const m of missing) {
  console.log(`❌ ${m.url}`);
  console.log(`   Expected at: ${m.localFile}`);
  console.log(`   Used in: ${[...new Set(m.usedIn)].join(', ')}\n`);
}

console.log(`=== EXISTING IMAGES (${existing.length}) ===`);
for (const e of existing) {
  console.log(`✅ ${e.url}`);
}
