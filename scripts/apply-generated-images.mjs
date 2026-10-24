import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedProducts } from '../src/products.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imageMap = {
  SV001: 'sv001-kanjivaram-silk-saree.jpg',
  SV003: 'sv003-soft-cotton-handloom-saree.jpg',
  SV005: 'sv005-chiffon-ombre-saree.jpg',
  SV009: 'sv009-anarkali-festive-suit.jpg',
  SV011: 'sv011-sharara-celebration-set.jpg',
  SV016: 'sv016-embroidered-lehenga-set.jpg',
  SV017: 'sv017-pastel-engagement-lehenga.jpg',
  SV018: 'sv018-velvet-wedding-lehenga.jpg',
  SV024: 'sv024-ruched-party-mini-dress.jpg',
  SV026: 'sv026-soft-knit-bodycon-dress.jpg',
  SV034: 'sv034-wide-leg-denim-set.jpg',
  SV035: 'sv035-satin-night-out-coord.jpg',
  SV042: 'sv042-pinstripe-power-blazer.jpg',
  SV075: 'sv075-mandarin-collar-festive-kurta.jpg',
  SV076: 'sv076-embroidered-occasion-kurta.jpg',
  SV077: 'sv077-cotton-pathani-set.jpg',
  SV078: 'sv078-festive-nehru-jacket.jpg',
  SV071: 'sv071-modern-fit-navy-blazer.jpg',
  SV056: 'sv056-oxford-blue-button-down.jpg',
  SV065: 'sv065-lightweight-bomber-jacket.jpg',
  SV082: 'sv082-classic-trench-coat.jpg',
  SV062: 'sv062-straight-fit-indigo-jeans.jpg',
  SV099: 'sv099-quilted-crossbody-bag.jpg',
  SV103: 'sv103-statement-cuff-bracelet.jpg',
  SV104: 'sv104-everyday-pendant-necklace.jpg',
  SV107: 'sv107-minimal-analog-watch.jpg',
  SV114: 'sv114-strappy-evening-heels.jpg',
  SV115: 'sv115-minimal-ballet-flats.jpg',
  SV122: 'sv122-travel-weekender-bag.jpg',
  SV136: 'sv136-minimal-leather-sneakers.jpg',
  SV137: 'sv137-textured-brown-derby-shoes.jpg',
  SV141: 'sv141-mini-beaded-party-bag.jpg',
};

const imageDir = path.join(root, 'public/images/products');
const missing = Object.values(imageMap).filter((name) => !fs.existsSync(path.join(imageDir, 'web', name)));
if (missing.length) {
  console.error(`Refusing to update catalogue: ${missing.length} image file(s) are missing.`);
  console.error(missing.join('\n'));
  process.exit(1);
}

const apply = (products) => products.map((product) => imageMap[product.id]
  ? { ...product, image: `/images/products/web/${imageMap[product.id]}` }
  : product);
const updatedSeeds = apply(seedProducts);
const updatedData = apply(JSON.parse(fs.readFileSync(path.join(root, 'server/data/products.json'), 'utf8')));
fs.writeFileSync(path.join(root, 'src/products.js'), `export const seedProducts = ${JSON.stringify(updatedSeeds, null, 2)};\n`);
fs.writeFileSync(path.join(root, 'server/data/products.json'), `${JSON.stringify(updatedData, null, 2)}\n`);
console.log(`Attached ${Object.keys(imageMap).length} photos to both catalogues.`);
