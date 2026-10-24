// Usage: npm run import:images
// Reads image-urls.csv (id,image_source) and for every row with a source:
//  - downloads it (http/https URL) or copies it (local file path)
//  - saves it to public/images/products/real/<id>.<ext>
//  - updates src/products.js and server/data/products.json
// Rows left blank keep their current image.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const csvPath = path.join(root, 'image-urls.csv');
const outDir = path.join(root, 'public/images/products/real');
fs.mkdirSync(outDir, { recursive: true });

const parseLine = (line) => { const out = []; let cur = '', q = false; for (const ch of line) { if (ch === '"') q = !q; else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
const rows = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/).filter(Boolean).slice(1).map(parseLine);
const extFor = (type, src) => ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[type] || (path.extname(src.split('?')[0]).slice(1).toLowerCase() || 'jpg'));

const applied = {};
for (const cols of rows) {
  const id = cols[0].trim(); const src = (cols[cols.length - 1] || '').trim();
  if (!id || !src) continue;
  try {
    let buf, type = '';
    if (/^https?:\/\//i.test(src)) {
      const res = await fetch(src, { headers: { 'User-Agent': 'Mozilla/5.0 SriVogueImporter' } });
      type = res.headers.get('content-type') || '';
      if (!res.ok || !type.startsWith('image/')) throw new Error(`not an image (HTTP ${res.status}, ${type || 'no type'}) — use the direct image link, not the web page`);
      buf = Buffer.from(await res.arrayBuffer());
    } else buf = fs.readFileSync(path.resolve(root, src));
    const file = `${id.toLowerCase()}.${extFor(type, src)}`;
    fs.writeFileSync(path.join(outDir, file), buf);
    applied[id] = `/images/products/real/${file}`;
    console.log(`✓ ${id} -> ${file}`);
  } catch (e) { console.error(`✗ ${id}: ${e.message}`); }
}
if (!Object.keys(applied).length) { console.log('No images imported. Fill the last column of image-urls.csv first.'); process.exit(0); }

const jsonPath = path.join(root, 'server/data/products.json');
const jsPath = path.join(root, 'src/products.js');
const patch = (list) => list.map((p) => (applied[p.id] ? { ...p, image: applied[p.id] } : p));
fs.writeFileSync(jsonPath, JSON.stringify(patch(JSON.parse(fs.readFileSync(jsonPath, 'utf8'))), null, 2) + '\n');
const arr = JSON.parse(fs.readFileSync(jsPath, 'utf8').replace(/^export const seedProducts = /, '').replace(/;\s*$/, ''));
fs.writeFileSync(jsPath, 'export const seedProducts = ' + JSON.stringify(patch(arr), null, 2) + ';\n');
console.log(`\nUpdated ${Object.keys(applied).length} products. Restart the app (npm run dev); if you use MongoDB also run npm run db:init.`);
