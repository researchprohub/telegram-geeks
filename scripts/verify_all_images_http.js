const fs = require('fs');
const path = require('path');
const http = require('http');

const publicDir = path.join(__dirname, '..', 'frontend', 'public');
const srcDir = path.join(__dirname, '..', 'frontend', 'src');

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

// Match all possible image references
const imgRegexes = [
  /<img[^>]+src=["']([^"']+)["']/g,
  /<Image[^>]+src=["']([^"']+)["']/g,
  /!\[[^\]]*\]\(([^)]+)\)/g,
  /cover_image:\s*["']([^"']+)["']/g,
  /url\(["']?([^"')]+)["']?\)/g,
  /["'](\/assets\/[^"']+)["']/g,
  /["'](\/img\/[^"']+)["']/g,
  /["'](\/favicon[^"']+)["']/g,
  /["'](\/icons\/[^"']+)["']/g,
  /["'](\/images\/[^"']+)["']/g,
  /["'](\/brand\/[^"']+)["']/g,
];

const urls = new Set();
const fileRefs = {};

for (const file of allSrcFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  for (const reg of imgRegexes) {
    let match;
    while ((match = reg.exec(content)) !== null) {
      const url = match[1];
      if (url && (url.startsWith('/') || url.includes('.svg') || url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.webp') || url.includes('.ico'))) {
        urls.add(url);
        if (!fileRefs[url]) fileRefs[url] = [];
        fileRefs[url].push(path.relative(path.join(__dirname, '..'), file));
      }
    }
  }
}

// Also check all files inside frontend/public/assets
function getPublicFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(getPublicFiles(filePath));
    } else {
      results.push(filePath);
    }
  }
  return results;
}

const allPublicFiles = getPublicFiles(publicDir);
for (const p of allPublicFiles) {
  const rel = '/' + path.relative(publicDir, p).replace(/\\/g, '/');
  urls.add(rel);
}

console.log(`Found ${urls.size} distinct asset URLs to test against http://localhost:3000`);

async function testUrl(url) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${url}`, (res) => {
      resolve({ url, status: res.statusCode });
    });
    req.on('error', (err) => {
      resolve({ url, status: 'ERROR: ' + err.message });
    });
  });
}

(async () => {
  const results = [];
  for (const url of urls) {
    if (url.startsWith('http')) continue;
    const res = await testUrl(url);
    results.push(res);
  }

  const failed = results.filter(r => r.status !== 200);
  const success = results.filter(r => r.status === 200);

  console.log(`\n=== RESULTS ===`);
  console.log(`✅ Success (200 OK): ${success.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\n--- BROKEN URLS ---');
    for (const f of failed) {
      console.log(`Status ${f.status} -> ${f.url}`);
      if (fileRefs[f.url]) {
        console.log(`   Referenced in: ${[...new Set(fileRefs[f.url])].join(', ')}`);
      }
    }
  } else {
    console.log('All image and asset URLs returned HTTP 200 OK successfully!');
  }
})();
