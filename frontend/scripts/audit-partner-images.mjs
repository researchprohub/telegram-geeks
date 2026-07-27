import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join } from 'path';

function findTsx(dir) {
  const results = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) results.push(...findTsx(full));
      else if (entry.name.endsWith('.tsx')) results.push(full);
    }
  } catch {}
  return results;
}

const files = findTsx('src');
const missing = [];
const empty = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const matches = content.matchAll(/src=["']([^"']*partners[^"']*\.(png|jpg|jpeg|svg|webp))["']/gi);
  for (const match of matches) {
    const imgPath = match[1];
    const publicPath = 'public' + imgPath;
    if (!existsSync(publicPath)) {
      missing.push({ file, imgPath, publicPath });
    } else if (statSync(publicPath).size === 0) {
      empty.push({ file, imgPath, publicPath });
    }
  }
}

missing.forEach(m => console.log(`MISSING: ${m.publicPath}  (${m.file})`));
empty.forEach(e => console.log(`EMPTY: ${e.publicPath}  (${e.file})`));
console.log(`missing=${missing.length} empty=${empty.length}`);
if (missing.length === 0 && empty.length === 0) console.log('All partner images present and non-empty.');
