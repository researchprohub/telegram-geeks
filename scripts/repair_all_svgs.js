const fs = require('fs');
const path = require('path');

const blogImgDir = path.join(__dirname, '..', 'frontend', 'public', 'assets', 'img', 'blog');
const allFiles = fs.readdirSync(blogImgDir).filter(f => f.endsWith('.svg'));

console.log(`Auditing ${allFiles.length} SVGs in blog img directory...`);

for (const file of allFiles) {
  const filePath = path.join(blogImgDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // 1. In SVG, filter attribute MUST refer to a filter url(#id) or style="filter: blur(30px)".
  // Writing filter="blur(30px)" is invalid XML SVG and causes rendering failures in Chromium.
  if (content.includes('filter="blur(')) {
    content = content.replace(/filter="blur\(([^)]+)\)"/g, 'style="filter: blur($1)"');
    changed = true;
  }

  // 2. In XML, text nodes containing & MUST be escaped as &amp;
  // e.g. <text ...>Channel & Media Cloner</text> -> &amp;
  // Let's replace raw unescaped & inside <text> tags!
  content = content.replace(/(<text[^>]*>)(.*?)(<\/text>)/g, (match, open, text, close) => {
    const escapedText = text.replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;');
    if (escapedText !== text) changed = true;
    return `${open}${escapedText}${close}`;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed SVG syntax in ${file}`);
  }
}

console.log('SVG syntax validation and repair complete!');
