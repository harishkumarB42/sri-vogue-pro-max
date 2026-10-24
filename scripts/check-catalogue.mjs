import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedProducts } from '../src/products.js';
import { dedupeProductImages } from '../src/catalogueImageUtils.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataProducts = JSON.parse(readFileSync(resolve(root, 'server/data/products.json'), 'utf8'));
const errors = [];

if (seedProducts.length !== dataProducts.length) errors.push('Client and server catalogue lengths differ.');
const ids = new Set();
const urls = new Set();
const digests = new Set();
let localImages = 0;

for (const product of seedProducts) {
  const id = String(product.id || '');
  if (!id) errors.push('A product is missing its id.');
  if (ids.has(id)) errors.push(`Duplicate product id: ${id}`);
  ids.add(id);

  const image = String(product.image || '').trim();
  if (!image) continue;
  if (!image.startsWith('/images/products/')) {
    errors.push(`${id} uses a non-local product image: ${image}`);
    continue;
  }
  if (urls.has(image)) errors.push(`Repeated image path: ${image}`);
  urls.add(image);

  const assetPath = resolve(root, 'public', image.slice(1));
  if (!assetPath.startsWith(resolve(root, 'public/images/products'))) {
    errors.push(`${id} image path escapes the product asset directory.`);
    continue;
  }
  if (!existsSync(assetPath)) {
    errors.push(`${id} image file is missing: ${image}`);
    continue;
  }
  const digest = createHash('sha256').update(readFileSync(assetPath)).digest('hex');
  if (digests.has(digest)) errors.push(`${id} repeats the content of another product photo.`);
  digests.add(digest);
  localImages += 1;
}

for (let i = 0; i < Math.min(seedProducts.length, dataProducts.length); i += 1) {
  const client = seedProducts[i];
  const server = dataProducts[i];
  if (String(client.id) !== String(server.id) || String(client.image || '') !== String(server.image || '')) {
    errors.push(`Client/server catalogue mismatch at item ${i + 1}.`);
  }
}

const sampleImage = seedProducts.find((product) => product.image)?.image;
if (sampleImage) {
  const normalized = dedupeProductImages([
    { id: seedProducts.find((product) => product.image).id, image: sampleImage },
    { id: 'stale-record', image: 'https://loremflickr.com/900/1200/demo?lock=1' },
    { id: 'repeat-record', image: sampleImage },
  ], seedProducts);
  const normalizedImages = normalized.map((product) => product.image).filter(Boolean);
  if (new Set(normalizedImages).size !== normalizedImages.length) errors.push('Duplicate-image sanitation failed its regression check.');
  if (normalized.some((product) => /loremflickr\.com/i.test(product.image || ''))) errors.push('Broken loremflickr URLs were not removed.');
}

if (errors.length) {
  console.error('Catalogue check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Catalogue check passed: ${seedProducts.length} products, ${localImages} distinct bundled photos, no repeated image paths or file content.`);
  console.log('Products without supplied photography use unique branded artwork fallbacks.');
}
