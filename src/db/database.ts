import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  const db = await SQLite.openDatabaseAsync('boutique.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  dbInstance = db;
  return db;
}

export async function initDatabase(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      purchase_price REAL NOT NULL DEFAULT 0,
      sale_price REAL NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 3,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stock_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK (payment_method IN ('especes', 'wave', 'om')),
      sale_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cash_advances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target TEXT NOT NULL CHECK (target IN ('wave', 'om')),
      amount REAL NOT NULL,
      note TEXT,
      advance_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cash_closures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      closure_date TEXT NOT NULL UNIQUE,
      sales_especes REAL NOT NULL,
      sales_wave REAL NOT NULL,
      sales_om REAL NOT NULL,
      advances_wave REAL NOT NULL,
      advances_om REAL NOT NULL,
      theoretical_commerce REAL NOT NULL,
      theoretical_wave REAL NOT NULL,
      theoretical_om REAL NOT NULL,
      counted_commerce REAL,
      counted_wave REAL,
      counted_om REAL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS debts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      client_phone TEXT,
      amount REAL NOT NULL,
      remaining_amount REAL NOT NULL,
      product TEXT,
      note TEXT,
      debt_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'solde')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS debt_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      debt_id INTEGER NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
    CREATE INDEX IF NOT EXISTS idx_advances_date ON cash_advances(advance_date);
    CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
  `);
}
