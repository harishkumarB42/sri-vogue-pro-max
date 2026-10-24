import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import Product from './models/Product.js';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { seedProducts } from '../src/products.js';
import { dedupeProductImages } from '../src/catalogueImageUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, 'data');
fs.mkdirSync(DATA, { recursive: true });
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'development-only-change-this-secret-before-deploying';
const app = express();
app.use(cors()); app.use(express.json({ limit: '2mb' }));

function readStore(file, fallback) { try { return JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8')); } catch { writeStore(file, fallback); return fallback; } }
function writeStore(file, value) { fs.writeFileSync(path.join(DATA, file), JSON.stringify(value, null, 2)); }
let products = dedupeProductImages(readStore('products.json', seedProducts).filter(p => p.audience !== 'Unisex'), seedProducts);
let users = readStore('users.json', []);
let orders = readStore('orders.json', []);
let carts = readStore('carts.json', {});
const saveProducts = () => {
  products = dedupeProductImages(products, seedProducts);
  writeStore('products.json', products);
  if (mongoose.connection.readyState === 1) {
    const ids = products.map((product) => product.id);
    Product.bulkWrite(products.map((product) => ({
      replaceOne: { filter: { id: product.id }, replacement: product, upsert: true }
    }))).then(() => Product.deleteMany({ id: { $nin: ids } }))
      .catch((error) => console.error('MongoDB product sync failed:', error.message));
  }
};
// The Sri Vogue storefront intentionally has only Women, Men and Accessories collections.
if (products.some(p => p.audience === 'Unisex')) { products = products.filter(p => p.audience !== 'Unisex'); saveProducts(); }
const saveUsers = () => writeStore('users.json', users);
const saveOrders = () => writeStore('orders.json', orders);
const saveCarts = () => writeStore('carts.json', carts);
const safeUser = ({id,name,email,role,createdAt}) => ({id,name,email,role,createdAt});
const tokenFor = user => jwt.sign({sub:user.id,role:user.role}, JWT_SECRET, {expiresIn:'7d'});
function auth(req,res,next) {
  const header = req.headers.authorization || '';
  try { const payload = jwt.verify(header.replace(/^Bearer\s+/i,''), JWT_SECRET); const user=users.find(u=>u.id===payload.sub); if(!user) return res.status(401).json({error:'Account not found'}); req.user=user; next(); }
  catch { return res.status(401).json({error:'Please sign in to continue'}); }
}
const adminOnly=(req,res,next)=>req.user?.role==='admin'?next():res.status(403).json({error:'Administrator access required'});
app.get('/api/health',(_,res)=>res.json({ok:true,service:'Sri Vogue API',products:products.length}));
app.get('/api/products',(req,res)=>{
  const {q,category,audience,sort,limit}=req.query; let result=[...products];
  if(q) { const needle=String(q).toLowerCase(); result=result.filter(p=>[p.name,p.category,p.audience,p.style,p.colour,p.description].some(v=>String(v||'').toLowerCase().includes(needle))); }
  if(category && category!=='All') result=result.filter(p=>p.category===category);
  if(audience && audience!=='All') result=result.filter(p=>p.audience===audience);
  if(sort==='price-low') result.sort((a,b)=>a.price-b.price); if(sort==='price-high') result.sort((a,b)=>b.price-a.price); if(sort==='name') result.sort((a,b)=>a.name.localeCompare(b.name));
  if(limit) result=result.slice(0,Math.max(1,Math.min(500,Number(limit)||100)));
  res.json({items:result,total:result.length});
});
app.get('/api/products/:id',(req,res)=>{const p=products.find(x=>String(x.id)===req.params.id);p?res.json(p):res.status(404).json({error:'Product not found'});});
app.post('/api/auth/register',async(req,res)=>{
  const name=String(req.body.name||'').trim(), email=String(req.body.email||'').trim().toLowerCase(), password=String(req.body.password||'');
  if(name.length<2||!/^\S+@\S+\.\S+$/.test(email)||password.length<8) return res.status(400).json({error:'Enter a name, valid email and password with at least 8 characters.'});
  if(users.some(u=>u.email===email)) return res.status(409).json({error:'An account with this email already exists.'});
  const user={id:randomUUID(),name,email,passwordHash:await bcrypt.hash(password,12),role:'customer',createdAt:new Date().toISOString()}; users.push(user);saveUsers(); const token=tokenFor(user);res.status(201).json({token,user:safeUser(user)});
});
app.post('/api/auth/login',async(req,res)=>{
  const email=String(req.body.email||'').trim().toLowerCase(), password=String(req.body.password||''); const user=users.find(u=>u.email===email);
  if(!user||!await bcrypt.compare(password,user.passwordHash)) return res.status(401).json({error:'Email or password is incorrect.'});
  res.json({token:tokenFor(user),user:safeUser(user)});
});
app.get('/api/auth/me',auth,(req,res)=>res.json({user:safeUser(req.user)}));
app.get('/api/cart',auth,(req,res)=>res.json({items:carts[req.user.id]||[]}));
app.put('/api/cart',auth,(req,res)=>{const items=Array.isArray(req.body.items)?req.body.items:[]; const normalized=[]; for(const item of items){const p=products.find(x=>String(x.id)===String(item.id));const qty=Math.max(1,Math.min(20,Number(item.qty)||1));if(p)normalized.push({id:p.id,qty,size:String(item.size||p.sizes?.[0]||'One size')});} carts[req.user.id]=normalized;saveCarts();res.json({items:normalized});});
app.post('/api/orders',auth,(req,res)=>{
  const items=Array.isArray(req.body.items)?req.body.items:[]; if(!items.length)return res.status(400).json({error:'Your bag is empty.'});
  const lines=[]; for(const item of items){const p=products.find(x=>String(x.id)===String(item.id));if(!p)continue;const qty=Math.max(1,Math.min(20,Number(item.qty)||1));lines.push({id:p.id,name:p.name,image:p.image,price:Number(p.price),qty,size:String(item.size||p.sizes?.[0]||'One size')});}
  if(!lines.length)return res.status(400).json({error:'No valid products in bag.'});
  const subtotal=lines.reduce((sum,x)=>sum+x.price*x.qty,0);const order={id:'SV-'+Date.now().toString(36).toUpperCase(),userId:req.user.id,customerName:req.user.name,customerEmail:req.user.email,items:lines,subtotal,shipping:subtotal>=1999?0:99,total:subtotal+(subtotal>=1999?0:99),status:'Placed',createdAt:new Date().toISOString()};orders.unshift(order);saveOrders();carts[req.user.id]=[];saveCarts();res.status(201).json({order});
});
app.get('/api/orders',auth,(req,res)=>res.json({items:orders.filter(o=>o.userId===req.user.id)}));
// Admin dashboard and product/order management
app.post('/api/admin/bootstrap',async(req,res)=>{
  const email=String(process.env.ADMIN_EMAIL||'admin@sri-vogue.com').toLowerCase(); if(users.some(u=>u.email===email))return res.status(409).json({error:'Admin account already exists.'});
  const password=String(process.env.ADMIN_PASSWORD||'ChangeThisAdminPassword123!');const user={id:randomUUID(),name:'Sri Vogue Admin',email,passwordHash:await bcrypt.hash(password,12),role:'admin',createdAt:new Date().toISOString()};users.push(user);saveUsers();res.status(201).json({message:'Admin created. Sign in using ADMIN_EMAIL and ADMIN_PASSWORD from your environment.'});
});
app.get('/api/admin/analytics',auth,adminOnly,(req,res)=>{const revenue=orders.reduce((n,o)=>n+o.total,0);const counts={};for(const o of orders)for(const i of o.items)counts[i.name]=(counts[i.name]||0)+i.qty;res.json({products:products.length,customers:users.filter(u=>u.role==='customer').length,orders:orders.length,revenue,topProducts:Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,units])=>({name,units})),recentOrders:orders.slice(0,8)});});
app.post('/api/admin/products',auth,adminOnly,(req,res)=>{const p=validateProduct(req.body);if(!p)return res.status(400).json({error:'Name, category, audience and a valid price are required.'});p.id='SV'+Date.now();products.unshift(p);saveProducts();res.status(201).json(p);});
app.put('/api/admin/products/:id',auth,adminOnly,(req,res)=>{const idx=products.findIndex(p=>String(p.id)===req.params.id);if(idx<0)return res.status(404).json({error:'Product not found'});const p=validateProduct(req.body);if(!p)return res.status(400).json({error:'Name, category, audience and a valid price are required.'});products[idx]={...products[idx],...p,id:products[idx].id};saveProducts();res.json(products[idx]);});
app.delete('/api/admin/products/:id',auth,adminOnly,(req,res)=>{const n=products.length;products=products.filter(p=>String(p.id)!==req.params.id);if(n===products.length)return res.status(404).json({error:'Product not found'});saveProducts();res.json({ok:true});});
app.get('/api/admin/orders',auth,adminOnly,(_,res)=>res.json({items:orders}));
app.patch('/api/admin/orders/:id',auth,adminOnly,(req,res)=>{const o=orders.find(x=>x.id===req.params.id);if(!o)return res.status(404).json({error:'Order not found'});const allowed=['Placed','Confirmed','Packed','Shipped','Delivered','Cancelled'];if(!allowed.includes(req.body.status))return res.status(400).json({error:'Invalid order status'});o.status=req.body.status;saveOrders();res.json(o);});
function validateProduct(b){const name=String(b.name||'').trim(),category=String(b.category||'').trim(),audience=String(b.audience||'').trim(),price=Number(b.price);if(!name||!category||!audience||!Number.isFinite(price)||price<=0)return null;return {name,category,audience,style:String(b.style||'New season'),price,oldPrice:Number(b.oldPrice)||Math.round(price*1.2),colour:String(b.colour||''),image:String(b.image||''),description:String(b.description||''),sizes:Array.isArray(b.sizes)?b.sizes:['S','M','L','XL'],stock:Math.max(0,Number(b.stock)||0),rating:Number(b.rating)||4.5,reviews:Number(b.reviews)||0,badge:String(b.badge||'NEW DROP')};}
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({error:'Unexpected server error'});});
async function startServer() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      const storedProducts = await Product.find({}, { _id: 0 }).lean();
      if (storedProducts.length) {
        products = dedupeProductImages(storedProducts.filter((product) => product.audience !== 'Unisex'), seedProducts);
        writeStore('products.json', products);
      } else {
        await Product.insertMany(products);
      }
      console.log(`MongoDB connected — ${products.length} products loaded.`);
    } catch (error) {
      console.error('MongoDB connection failed; continuing with local JSON product storage:', error.message);
    }
  } else {
    console.log('MONGODB_URI not set — using local JSON storage. Add MONGODB_URI to enable MongoDB.');
  }
  app.listen(PORT, () => console.log(`Sri Vogue API running at http://localhost:${PORT} — ${products.length} products loaded`));
}
startServer();
