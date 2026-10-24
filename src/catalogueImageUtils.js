const isKnownBrokenProvider = (value) => /loremflickr\.com/i.test(String(value || ''));

/**
 * Keep product image references unique without mutating the source array.
 * Stale loremflickr links are intentionally replaced from the checked local
 * seed catalogue; products without a bundled image use the branded artwork UI.
 */
export function dedupeProductImages(products = [], seedCatalogue = []) {
  const seedById = new Map(seedCatalogue.map((product) => [String(product.id), product]));
  const imageCounts = new Map();

  for (const product of products) {
    const image = String(product?.image || '').trim();
    if (image) imageCounts.set(image, (imageCounts.get(image) || 0) + 1);
  }

  const used = new Set();
  return products.map((product) => {
    const current = String(product?.image || '').trim();
    const seeded = String(seedById.get(String(product?.id))?.image || '').trim();
    const staleOrRepeated = isKnownBrokenProvider(current) || (current && imageCounts.get(current) > 1);
    let image = staleOrRepeated ? seeded : current;

    if (image && used.has(image)) image = seeded && !used.has(seeded) ? seeded : '';
    if (image) used.add(image);
    return image === current ? product : { ...product, image };
  });
}
