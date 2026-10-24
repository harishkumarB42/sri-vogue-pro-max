import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Product from './models/Product.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsFile = path.join(__dirname, 'data', 'products.json');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI. Add it to your .env file first.');
    process.exitCode = 1;
    return;
  }

  await mongoose.connect(uri);
  const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'))
    .filter((product) => product.audience !== 'Unisex');

  for (const product of products) {
    await Product.updateOne(
      { id: product.id },
      { $set: product },
      { upsert: true }
    );
  }

  const total = await Product.countDocuments();
  console.log(`MongoDB initialized: ${products.length} Sri Vogue products upserted. Collection now has ${total} products.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('MongoDB initialization failed:', error.message);
  try { await mongoose.disconnect(); } catch {}
  process.exitCode = 1;
});
