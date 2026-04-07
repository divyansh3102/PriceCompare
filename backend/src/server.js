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

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_SECRET || 'dummy_secret',
});

// ✅ SAFELY UPGRADE DATABASE (Added Seller Routing for Orders)
try {
  db.exec(`ALTER TABLE products ADD COLUMN originalPrice INTEGER DEFAULT 0;`);
  db.exec(`ALTER TABLE products ADD COLUMN gst INTEGER DEFAULT 18;`);
  db.exec(`ALTER TABLE products ADD COLUMN description TEXT DEFAULT '';`);
  db.exec(`ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'Store Pickup';`);
  db.exec(`ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'Pending';`);
  db.exec(`ALTER TABLE orders ADD COLUMN delivery_type TEXT DEFAULT 'Pickup';`); 
  db.exec(`ALTER TABLE products ADD COLUMN is_online_available INTEGER DEFAULT 0;`);
  db.exec(`ALTER TABLE products ADD COLUMN affiliate_link TEXT DEFAULT '';`);
  
  // 🚀 NEW: Route orders to specific sellers
  db.exec(`ALTER TABLE orders ADD COLUMN seller_shop TEXT DEFAULT '';`);
  
  console.log("✅ Database upgraded with Seller Order Routing!");
} catch (e) {}

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import productRoutes from './routes/productRoutes.js';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products/csv', productRoutes);

// ================= PRODUCT APIs =================
app.post('/api/products/upload', upload.single('image'), (req, res) => {
  try {
    const { name, price, category, city } = req.body;
    if (!name || !price || !req.file) return res.status(400).json({ success: false, message: 'All fields required' });
    const image = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    const result = db.prepare(`INSERT INTO products (name, price, category, city, image, status) VALUES (?, ?, ?, ?, ?, 'pending')`).run(name, price, category || 'General', city || 'Unknown', image);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

app.put('/api/products/stock/:id', (req, res) => {
  try {
    db.prepare(`UPDATE products SET inStock = ? WHERE id = ?`).run(req.body.inStock ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.post('/api/products/bulk', (req, res) => {
  try {
    const { products, status, shopName } = req.body;
    const finalStatus = status || 'pending';
    const finalShop = shopName || 'Local Verified Seller';
    const stmt = db.prepare(`INSERT INTO products (name, price, category, city, image, status, inStock, shopName) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`);
    let count = 0;
    for (const p of products) {
      if (p.name) {
        stmt.run(p.name, parseInt(p.price) || 0, p.category || 'General', p.city || 'Unknown', p.image || 'https://via.placeholder.com/400', finalStatus, finalShop);
        count++;
      }
    }
    res.json({ success: true, count });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.get('/api/products', (req, res) => {
  try {
    const products = db.prepare(`SELECT * FROM products WHERE status = 'approved' ORDER BY id DESC`).all();
    res.json({ success: true, products });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.get('/api/products/all', (req, res) => {
  try {
    const products = db.prepare(`SELECT * FROM products ORDER BY id DESC`).all();
    res.json({ success: true, products });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.put('/api/products/:id', upload.single('image'), (req, res) => {
  try {
    const { name, price, originalPrice, category, city, inStock, gst, description } = req.body;
    let query = `UPDATE products SET name=?, price=?, originalPrice=?, category=?, city=?, inStock=?, gst=?, description=?`;
    let params = [name, price, originalPrice || 0, category, city, inStock === 'true' ? 1 : 0, gst || 18, description || ''];
    if (req.file) {
      query += `, image=?`;
      params.push(`http://localhost:${PORT}/uploads/${req.file.filename}`);
    }
    query += ` WHERE id=?`;
    params.push(req.params.id);
    db.prepare(query).run(...params);
    res.json({ success: true, message: 'Product updated successfully' });
  } catch (error) { res.status(500).json({ success: false, message: 'Update failed' }); }
});

app.put('/api/products/category/:id', (req, res) => {
  try {
    db.prepare(`UPDATE products SET category = ? WHERE id = ?`).run(req.body.category, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.put('/api/products/approve/:id', (req, res) => {
  try {
    db.prepare(`UPDATE products SET status = 'approved' WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.put('/api/products/reject/:id', (req, res) => {
  try {
    db.prepare(`UPDATE products SET status = 'rejected' WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    db.prepare(`DELETE FROM products WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.post('/api/products/:id/view', (req, res) => {
  try { db.prepare(`UPDATE products SET views = views + 1 WHERE id = ?`).run(req.params.id); res.json({ success: true }); } 
  catch (error) { res.status(500).json({ success: false }); }
});

app.post('/api/products/:id/lead', (req, res) => {
  try { db.prepare(`UPDATE products SET leads = leads + 1 WHERE id = ?`).run(req.params.id); res.json({ success: true }); } 
  catch (error) { res.status(500).json({ success: false }); }
});

// ================= OMNICHANNEL CHECKOUT & PAYMENTS =================

app.post('/api/checkout/validate-cod', (req, res) => {
  const { pincode } = req.body;
  const unserviceablePincodes = ['110001', '400001']; 
  if (unserviceablePincodes.includes(pincode)) return res.json({ available: false, message: 'COD is not available in your area.' });
  res.json({ available: true, message: 'COD is available!' });
});

// 🚀 MODIFIED: Saves the seller_shop to DB so sellers get notified of their specific orders
app.post('/api/orders/checkout', (req, res) => {
  try {
    const { cartItems, totalAmount, buyerEmail, buyerAddress, deliveryType, paymentMethod } = req.body;
    
    const finalDeliveryType = deliveryType || 'Pickup';
    const finalPaymentMethod = paymentMethod || 'Store Pickup';
    const sellerShop = cartItems[0]?.shopName || 'Local Verified Seller'; // Tie order to seller
    
    let initialStatus = 'Pending';
    if (finalPaymentMethod === 'Store Pickup') initialStatus = 'Pending Payment (Store Pickup)';
    if (finalPaymentMethod === 'COD') initialStatus = 'Order Placed (COD)';

    const result = db.prepare(`
      INSERT INTO orders (cart_data, total_amount, status, buyer_email, buyer_address, payment_method, payment_status, delivery_type, seller_shop)
      VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?)
    `).run(JSON.stringify(cartItems), totalAmount, initialStatus, buyerEmail || '', buyerAddress || '', finalPaymentMethod, finalDeliveryType, sellerShop);
    
    res.json({ success: true, orderId: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// 🚀 MODIFIED: Saves seller_shop for Online payments too
app.post('/api/checkout/create-payment', async (req, res) => {
  try {
    const { totalAmount, cartItems, buyerEmail, buyerAddress, deliveryType } = req.body;
    const sellerShop = cartItems[0]?.shopName || 'Local Verified Seller';

    const options = { amount: Math.round(totalAmount * 100), currency: "INR", receipt: `receipt_${Date.now()}` };
    const order = await razorpay.orders.create(options);

    const result = db.prepare(`
      INSERT INTO orders (cart_data, total_amount, status, buyer_email, buyer_address, payment_method, payment_status, delivery_type, seller_shop)
      VALUES (?, ?, 'Pending Online Payment', ?, ?, 'Online', 'Pending', ?, ?)
    `).run(JSON.stringify(cartItems), totalAmount, buyerEmail || '', buyerAddress || '', deliveryType || 'Delivery', sellerShop);

    res.json({ success: true, orderId: order.id, dbOrderId: result.lastInsertRowid, amount: options.amount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Payment initialization failed' });
  }
});

app.post('/api/checkout/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = req.body;
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET).update(sign.toString()).digest("hex");

    if (razorpay_signature === expectedSign) {
      db.prepare(`UPDATE orders SET status = 'Paid & Processing', payment_status = 'Completed' WHERE id = ?`).run(dbOrderId);
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
  } catch (error) { res.status(500).json({ success: false, message: "Payment verification failed" }); }
});

// ================= SELLER & ADMIN PROFILE WORKFLOW =================
app.get('/api/seller/analytics', (req, res) => {
  try {
    const products = db.prepare(`SELECT * FROM products WHERE status = 'approved'`).all();
    const orders = db.prepare(`SELECT * FROM orders WHERE status != 'Cancelled'`).all();
    const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalLeads = products.reduce((sum, p) => sum + (p.leads || 0), 0);
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const topAds = db.prepare(`SELECT name, views, leads, price FROM products ORDER BY views DESC LIMIT 3`).all();
    res.json({ success: true, data: { activeAds: products.length, totalViews, totalLeads, totalRevenue, conversionRate: totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : 0, topAds } });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.get('/api/seller/profile/:email', (req, res) => {
  try {
    const user = db.prepare(`SELECT name, email, shop_name, address as shop_address, phone, pending_updates FROM users WHERE email = ?`).get(req.params.email);
    if (!user) return res.status(404).json({ success: false });
    res.json({ success: true, profile: user });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.put('/api/seller/profile/request', (req, res) => {
  try {
    const { email, requestedChanges } = req.body;
    db.prepare(`UPDATE users SET pending_updates = ? WHERE email = ?`).run(JSON.stringify(requestedChanges), email);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.put('/api/admin/profile-approve/:email', (req, res) => {
  try {
    const user = db.prepare(`SELECT pending_updates FROM users WHERE email = ?`).get(req.params.email);
    if (user && user.pending_updates) {
      const updates = JSON.parse(user.pending_updates);
      db.prepare(`UPDATE users SET name = ?, shop_name = ?, address = ?, phone = ?, pending_updates = NULL WHERE email = ?`).run(updates.name || '', updates.shop_name || '', updates.shop_address || '', updates.phone || '', req.params.email);
    }
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
});

// 🚀 MODIFIED: Sellers now only see orders routed to their specific shop!
app.get('/api/seller/orders', (req, res) => {
  try {
    const shopName = req.query.shop; 
    let query = `SELECT * FROM orders ORDER BY id DESC`;
    let params = [];
    
    // If a shop name is provided, filter by it. Otherwise return all (Admin view).
    if (shopName) {
      query = `SELECT * FROM orders WHERE seller_shop = ? ORDER BY id DESC`;
      params.push(shopName);
    }
    
    const orders = db.prepare(query).all(...params);
    const formattedOrders = orders.map(order => ({
      ...order,
      cartItems: JSON.parse(order.cart_data || '[]')
    }));
    res.json({ success: true, orders: formattedOrders });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.put('/api/seller/orders/:id/status', (req, res) => {
  try { db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(req.body.status, req.params.id); res.json({ success: true }); } 
  catch (error) { res.status(500).json({ success: false }); }
});

app.get('/api/admin/stats', (req, res) => {
  try {
    const users = db.prepare(`SELECT COUNT(*) as count FROM users`).get().count;
    const sellers = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'seller'`).get().count;
    const products = db.prepare(`SELECT COUNT(*) as count FROM products`).get().count;
    const pending = db.prepare(`SELECT COUNT(*) as count FROM products WHERE status = 'pending'`).get().count;
    res.json({ success: true, stats: { users, sellers, products, pending } });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.get('/api/health', (req, res) => res.json({ success: true, message: 'Server running' }));
app.get('/', (req, res) => res.json({ success: true, message: 'API running' }));

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => res.status(500).json({ success: false, message: 'Server error' }));

app.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`); });