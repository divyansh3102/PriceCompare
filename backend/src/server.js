import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import db from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ NEW (IMPORTANT FOR RENDER)
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_SECRET || 'dummy_secret',
});

// ================= DATABASE UPDATE =================
try {
  db.exec(`ALTER TABLE products ADD COLUMN originalPrice INTEGER DEFAULT 0;`);
  db.exec(`ALTER TABLE products ADD COLUMN gst INTEGER DEFAULT 18;`);
  db.exec(`ALTER TABLE products ADD COLUMN description TEXT DEFAULT '';`);
  db.exec(`ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'Store Pickup';`);
  db.exec(`ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'Pending';`);
  db.exec(`ALTER TABLE orders ADD COLUMN delivery_type TEXT DEFAULT 'Pickup';`);
  db.exec(`ALTER TABLE products ADD COLUMN is_online_available INTEGER DEFAULT 0;`);
  db.exec(`ALTER TABLE products ADD COLUMN affiliate_link TEXT DEFAULT '';`);
  db.exec(`ALTER TABLE orders ADD COLUMN seller_shop TEXT DEFAULT '';`);
  console.log("✅ Database upgraded!");
} catch (e) {}

// ================= IMPORT ROUTES =================
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import productRoutes from './routes/productRoutes.js';

// ================= MIDDLEWARE =================
app.use(cors({
  origin: [
    "http://localhost:5173", // local dev
    "https://price-compare-one.vercel.app" // your Vercel URL
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= FILE UPLOAD =================
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

// ✅ STATIC FILE SERVE
app.use('/uploads', express.static('uploads'));

// ================= ROUTES =================
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products/csv', productRoutes);

// ================= PRODUCT APIs =================

// ✅ FIXED IMAGE URL
app.post('/api/products/upload', upload.single('image'), (req, res) => {
  try {
    const { name, price, category, city } = req.body;
    if (!name || !price || !req.file) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const image = `${BASE_URL}/uploads/${req.file.filename}`;

    const result = db.prepare(`
      INSERT INTO products (name, price, category, city, image, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(name, price, category || 'General', city || 'Unknown', image);

    res.json({ success: true, id: result.lastInsertRowid });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

// ================= UPDATE PRODUCT =================
app.put('/api/products/:id', upload.single('image'), (req, res) => {
  try {
    const { name, price, originalPrice, category, city, inStock, gst, description } = req.body;

    let query = `UPDATE products SET name=?, price=?, originalPrice=?, category=?, city=?, inStock=?, gst=?, description=?`;

    let params = [
      name,
      price,
      originalPrice || 0,
      category,
      city,
      inStock === 'true' ? 1 : 0,
      gst || 18,
      description || ''
    ];

    // ✅ FIXED IMAGE URL
    if (req.file) {
      query += `, image=?`;
      params.push(`${BASE_URL}/uploads/${req.file.filename}`);
    }

    query += ` WHERE id=?`;
    params.push(req.params.id);

    db.prepare(query).run(...params);

    res.json({ success: true, message: 'Product updated successfully' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// ================= HEALTH CHECK =================
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server running' });
});

app.get('/', (req, res) => {
  res.json({ success: true, message: 'API running' });
});

// ================= ERROR HANDLING =================
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: 'Server error' });
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${BASE_URL}`);
});