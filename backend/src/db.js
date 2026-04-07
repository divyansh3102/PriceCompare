import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

// ── File path ─────────────────────────────────────────
const dbPath = process.env.SQLITE_DB_PATH || './data/pricecompare.db';
const resolvedPath = resolve(dbPath);
const dir = dirname(resolvedPath);

if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

// ── Initialize SQL.js ─────────────────────────
const SQL = await initSqlJs();

// Load DB or create new
const sqlDb = existsSync(resolvedPath)
  ? new SQL.Database(readFileSync(resolvedPath))
  : new SQL.Database();

// Auto-save function
const persist = () => {
  writeFileSync(resolvedPath, Buffer.from(sqlDb.export()));
};

// ── DATABASE SCHEMA ─────────────────────────
// I have removed the duplicate tables and added the PRO columns
sqlDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    is_verified INTEGER NOT NULL DEFAULT 0,
    shop_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    avatar TEXT,
    pending_updates TEXT DEFAULT NULL,  -- ✅ Added for Profile Approval Workflow
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price INTEGER,
    category TEXT,
    city TEXT,
    image TEXT,
    status TEXT DEFAULT 'pending',
    inStock INTEGER DEFAULT 1,
    shopName TEXT DEFAULT 'Amazon',
    views INTEGER DEFAULT 0,            -- ✅ Added for Dynamic Analytics
    leads INTEGER DEFAULT 0,            -- ✅ Added for Dynamic Analytics
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    cart_data TEXT,                     -- ✅ Added to support the Orders Dashboard
    total_amount INTEGER,               -- ✅ Changed to match your frontend checkout
    status TEXT DEFAULT 'Pending Payment (Store Pickup)',
    payment_status TEXT DEFAULT 'pending',
    buyer_email TEXT,
    buyer_address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

persist();

console.log(`✅ SQLite DB initialized at: ${resolvedPath}`);

// ── DB WRAPPER ─────────────────────────
const db = {
  prepare(sql) {
    return {
      get(...args) {
        const stmt = sqlDb.prepare(sql);
        if (args.length) stmt.bind(args);
        const row = stmt.step() ? stmt.getAsObject() : undefined;
        stmt.free();
        return row;
      },

      all(...args) {
        const stmt = sqlDb.prepare(sql);
        if (args.length) stmt.bind(args);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
      },

      run(...args) {
        sqlDb.run(sql, args.length ? args : []);
        const lastId = sqlDb.exec('SELECT last_insert_rowid()');
        persist();
        return {
          lastInsertRowid: lastId[0]?.values[0]?.[0] ?? null
        };
      }
    };
  },

  exec(sql) {
    sqlDb.exec(sql);
    persist();
  }
};

export default db;