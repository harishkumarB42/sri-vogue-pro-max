# Sri Vogue — Full-stack JavaScript Storefront

A responsive React + Vite frontend and Express REST API for Sri Vogue. This version uses an editorial cream/burgundy visual system, dedicated Home / Shop / Orders / My Profile pages, product details, image placeholders, wishlist, shopping bag, and backend login/register.

## Requirements
- Node.js 20+ recommended
- npm

## Start locally
1. Install Node.js 20+ and MongoDB Community Server, or create a free MongoDB Atlas cluster.
2. Copy `.env.example` to `.env` and replace the example secrets before using accounts or admin features.
3. Set `MONGODB_URI` in `.env`:
   - Local MongoDB: `mongodb://127.0.0.1:27017/sri_vogue`
   - Atlas: paste your Atlas connection string and include the database name `sri_vogue`.
4. Install dependencies and initialize the product collection:

```bash
npm install
npm run db:init
npm run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:4000`. Keep MongoDB running when using a local database. The app can still start with JSON product storage if `MONGODB_URI` is unset or the connection fails.

## Separate page components
- `src/pages/HomePage.jsx` — homepage and collection tiles
- `src/pages/ShopPage.jsx` — product grid, search, audience/category filters and sorting
- `src/pages/ProductDetail.jsx` — individual product view, size and quantity selection, wishlist and add-to-bag
- `src/pages/OrdersPage.jsx` — order history and refresh
- `src/pages/ProfilePage.jsx` — profile, account information, orders and wishlist shortcuts
- `src/pages/AuthPage.jsx` — login and registration
- `src/App.jsx` — navigation, shared state, API requests and cart drawer
- `src/styles.css` — responsive styling
- `server/index.js` — Express backend and API routes
- `src/products.js` — editable product catalogue

## Product images and unique fallbacks
The catalogue contains 62 products, each with a local sample photo (not verified photos of the exact SKUs; replace before real sales). Products that had no photo were removed. To add more products later, add them in `src/products.js` and `server/data/products.json` with an image path.

Run the catalogue integrity check after changing product imagery:

```bash
npm run check:catalogue
```

To apply the current product seed (including the repaired images) to MongoDB, run `npm run db:init` only after confirming that `MONGODB_URI` points to the intended database. The initializer upserts by product ID; it writes to that database.

## Add your own product images
Add a different real product photo for each item to avoid repeating imagery.
1. Copy each image into `public/images/products/`.
2. Open `src/products.js` and set the matching product's `image` field, e.g. `"image": "/images/products/kanjivaram-silk-saree.jpg"`.
3. For collection artwork, add files under `public/images/collections/`; for the homepage campaign, use `public/images/hero.jpg`; for editorial use `public/images/editorial/brand-story.jpg`.
4. The frontend automatically displays the image when the product `image` field is set; otherwise, it shows a designed placeholder. No component changes are required when you add the image path.

## Categories
The Unisex category and Unisex catalogue records have been removed. The available audience filters are All, Women, Men and Accessories.

## API endpoints
- `GET /api/health`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/cart`, `PUT /api/cart` (authenticated)
- `POST /api/orders`, `GET /api/orders` (authenticated)
- Admin endpoints are available in `server/index.js` for catalogue analytics and management.

## MongoDB initialization
- `server/models/Product.js` defines the MongoDB product collection.
- `server/init-mongodb.js` imports the product catalogue from `server/data/products.json` into MongoDB using upserts, so re-running it updates existing products without duplicating them.
- The Express API loads products from MongoDB when `MONGODB_URI` is configured. Product create/update/delete operations are synced to MongoDB and the local JSON file.
- User accounts, carts and orders are still stored in local JSON files in this starter. They have not yet been migrated to MongoDB.

## Important
This is a development starter. Orders are recorded without payment collection. For a public launch, configure a strong `JWT_SECRET`, change the admin password, add HTTPS, rate limiting, backups and a real payment provider.

## AI Stylist (demo feature)
- Open **AI Stylist** from the main navigation.
- Upload a style inspiration photo (JPG/PNG/WEBP, up to 8 MB), choose an occasion and style mood, then select **Find My Look**.
- The photo preview and basic colour cue are processed locally in the browser; the photo is not uploaded to the API.
- Recommendations are generated from catalogue metadata and the selected occasion/mood/colour. This is a frontend demo, not a connected generative-AI vision service.

## Order storage
Orders are saved by the Express API in `server/data/orders.json` and are associated with the signed-in account. A customer must register/sign in before checkout. Checkout is a project demo and does not collect payment. The included JSON-file storage is suitable for a local academic demo, not production deployment.

## Run the project
```bash
npm install
npm run dev
```
Open `http://localhost:5173`. Keep the server terminal running; it serves the API on port `4000`.

## Replace the illustrations with real photos
1. Open `image-urls.csv`. For each product use the Unsplash/Pexels search links to find a photo you are allowed to use.
2. Paste the **direct image link** (or a local file path) in the last column `image_source`. Leave blank to keep the current image.
3. Run `npm run import:images`, then restart `npm run dev`.
