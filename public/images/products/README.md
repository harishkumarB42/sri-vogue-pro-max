# Product photo assets

The catalogue now has 62 distinct local product images: 30 sample fashion photographs and 32 AI-generated illustrative catalogue visuals, with the new compressed JPEG files stored in `web/`. They are not verified photographs of the exact sellable SKUs. Replace them with approved, accurate SKU photography before using this storefront for real orders. Products without photos display their own Sri Vogue artwork card.

Keep image paths unique in `src/products.js` and `server/data/products.json`, then run `npm run check:catalogue` to verify that references exist and neither file paths nor file content are repeated.
