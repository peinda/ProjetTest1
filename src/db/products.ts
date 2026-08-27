import { getDb } from './database';
import { Product, StockEntry } from './types';

export interface NewProduct {
  name: string;
  category?: string | null;
  purchase_price: number;
  sale_price: number;
  quantity: number;
  low_stock_threshold?: number;
  image_uri?: string | null;
}

export async function listProducts(): Promise<Product[]> {
  const db = await getDb();
  return db.getAllAsync<Product>('SELECT * FROM products ORDER BY name ASC');
}

export async function getProduct(id: number): Promise<Product | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Product>('SELECT * FROM products WHERE id = ?', id);
  return row ?? null;
}

export async function createProduct(input: NewProduct): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO products (name, category, purchase_price, sale_price, quantity, low_stock_threshold, image_uri)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.name,
    input.category ?? null,
    input.purchase_price,
    input.sale_price,
    input.quantity,
    input.low_stock_threshold ?? 3,
    input.image_uri ?? null
  );
  if (input.quantity > 0) {
    await db.runAsync(
      `INSERT INTO stock_entries (product_id, quantity, note) VALUES (?, ?, ?)`,
      result.lastInsertRowId,
      input.quantity,
      'Stock initial'
    );
  }
  return result.lastInsertRowId;
}

export async function updateProduct(id: number, input: NewProduct): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE products SET name = ?, category = ?, purchase_price = ?, sale_price = ?,
     low_stock_threshold = ?, image_uri = ?, updated_at = datetime('now') WHERE id = ?`,
    input.name,
    input.category ?? null,
    input.purchase_price,
    input.sale_price,
    input.low_stock_threshold ?? 3,
    input.image_uri ?? null,
    id
  );
}

export async function deleteProduct(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM products WHERE id = ?', id);
}

export async function addStock(productId: number, quantity: number, note?: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE products SET quantity = quantity + ?, updated_at = datetime('now') WHERE id = ?`,
    quantity,
    productId
  );
  await db.runAsync(
    `INSERT INTO stock_entries (product_id, quantity, note) VALUES (?, ?, ?)`,
    productId,
    quantity,
    note ?? null
  );
}

export async function listStockEntries(productId?: number): Promise<StockEntry[]> {
  const db = await getDb();
  if (productId) {
    return db.getAllAsync<StockEntry>(
      'SELECT * FROM stock_entries WHERE product_id = ? ORDER BY created_at DESC',
      productId
    );
  }
  return db.getAllAsync<StockEntry>('SELECT * FROM stock_entries ORDER BY created_at DESC');
}

export async function updateStockEntry(entryId: number, quantity: number, note?: string | null): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const entry = await db.getFirstAsync<StockEntry>('SELECT * FROM stock_entries WHERE id = ?', entryId);
    if (!entry) return;
    const diff = quantity - entry.quantity;
    await db.runAsync(
      `UPDATE products SET quantity = quantity + ?, updated_at = datetime('now') WHERE id = ?`,
      diff,
      entry.product_id
    );
    await db.runAsync('UPDATE stock_entries SET quantity = ?, note = ? WHERE id = ?', quantity, note ?? null, entryId);
  });
}

export async function deleteStockEntry(entryId: number): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const entry = await db.getFirstAsync<StockEntry>('SELECT * FROM stock_entries WHERE id = ?', entryId);
    if (!entry) return;
    await db.runAsync(
      `UPDATE products SET quantity = quantity - ?, updated_at = datetime('now') WHERE id = ?`,
      entry.quantity,
      entry.product_id
    );
    await db.runAsync('DELETE FROM stock_entries WHERE id = ?', entryId);
  });
}

export interface StockSummary {
  initial: number;
  sold: number;
}

export async function getStockSummaryByProduct(): Promise<Record<number, StockSummary>> {
  const db = await getDb();
  const entries = await db.getAllAsync<{ product_id: number; total: number }>(
    'SELECT product_id, SUM(quantity) as total FROM stock_entries GROUP BY product_id'
  );
  const sales = await db.getAllAsync<{ product_id: number; total: number }>(
    'SELECT product_id, SUM(quantity) as total FROM sales WHERE product_id IS NOT NULL GROUP BY product_id'
  );
  const result: Record<number, StockSummary> = {};
  for (const e of entries) result[e.product_id] = { initial: e.total, sold: 0 };
  for (const s of sales) {
    if (!result[s.product_id]) result[s.product_id] = { initial: 0, sold: 0 };
    result[s.product_id].sold = s.total;
  }
  return result;
}

export async function decrementStock(productId: number, quantity: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE products SET quantity = quantity - ?, updated_at = datetime('now') WHERE id = ?`,
    quantity,
    productId
  );
}
