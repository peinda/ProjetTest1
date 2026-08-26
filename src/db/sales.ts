import { getDb } from './database';
import { PaymentMethod, Sale } from './types';
import { todayStr } from '../utils/date';

export interface NewSale {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  payment_method: PaymentMethod;
  sale_date?: string;
}

export async function createSale(input: NewSale): Promise<number> {
  const db = await getDb();
  const saleDate = input.sale_date ?? todayStr();
  const total = input.quantity * input.unit_price;

  let saleId = 0;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO sales (product_id, product_name, quantity, unit_price, total, payment_method, sale_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      input.product_id,
      input.product_name,
      input.quantity,
      input.unit_price,
      total,
      input.payment_method,
      saleDate
    );
    saleId = result.lastInsertRowId;
    await db.runAsync(
      `UPDATE products SET quantity = quantity - ?, updated_at = datetime('now') WHERE id = ?`,
      input.quantity,
      input.product_id
    );
  });
  return saleId;
}

export async function getSaleById(id: number): Promise<Sale | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Sale>('SELECT * FROM sales WHERE id = ?', id);
  return row ?? null;
}

export interface UpdateSale {
  quantity: number;
  unit_price: number;
  payment_method: PaymentMethod;
}

export async function updateSale(id: number, input: UpdateSale): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const sale = await db.getFirstAsync<Sale>('SELECT * FROM sales WHERE id = ?', id);
    if (!sale) return;
    if (sale.product_id) {
      const qtyDiff = sale.quantity - input.quantity;
      await db.runAsync(
        `UPDATE products SET quantity = quantity + ?, updated_at = datetime('now') WHERE id = ?`,
        qtyDiff,
        sale.product_id
      );
    }
    const total = input.quantity * input.unit_price;
    await db.runAsync(
      `UPDATE sales SET quantity = ?, unit_price = ?, total = ?, payment_method = ? WHERE id = ?`,
      input.quantity,
      input.unit_price,
      total,
      input.payment_method,
      id
    );
  });
}

export async function deleteSale(id: number, restock: boolean = true): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const sale = await db.getFirstAsync<Sale>('SELECT * FROM sales WHERE id = ?', id);
    if (!sale) return;
    if (restock && sale.product_id) {
      await db.runAsync(
        `UPDATE products SET quantity = quantity + ?, updated_at = datetime('now') WHERE id = ?`,
        sale.quantity,
        sale.product_id
      );
    }
    await db.runAsync('DELETE FROM sales WHERE id = ?', id);
  });
}

export async function listSalesByDate(date: string): Promise<Sale[]> {
  const db = await getDb();
  return db.getAllAsync<Sale>(
    'SELECT * FROM sales WHERE sale_date = ? ORDER BY created_at DESC',
    date
  );
}

export async function listSalesBetween(startDate: string, endDate: string): Promise<Sale[]> {
  const db = await getDb();
  return db.getAllAsync<Sale>(
    'SELECT * FROM sales WHERE sale_date BETWEEN ? AND ? ORDER BY created_at DESC',
    startDate,
    endDate
  );
}

export interface PaymentTotals {
  especes: number;
  wave: number;
  om: number;
}

export async function getTotalsByPaymentMethod(date: string): Promise<PaymentTotals> {
  const sales = await listSalesByDate(date);
  const totals: PaymentTotals = { especes: 0, wave: 0, om: 0 };
  for (const sale of sales) {
    totals[sale.payment_method] += sale.total;
  }
  return totals;
}

export async function getTotalsBetween(startDate: string, endDate: string): Promise<PaymentTotals> {
  const sales = await listSalesBetween(startDate, endDate);
  const totals: PaymentTotals = { especes: 0, wave: 0, om: 0 };
  for (const sale of sales) {
    totals[sale.payment_method] += sale.total;
  }
  return totals;
}

export interface ProductTotal {
  product_name: string;
  quantity: number;
  total: number;
}

export async function getTotalsByProduct(date: string): Promise<ProductTotal[]> {
  const db = await getDb();
  return db.getAllAsync<ProductTotal>(
    `SELECT product_name, SUM(quantity) as quantity, SUM(total) as total
     FROM sales WHERE sale_date = ? GROUP BY product_name ORDER BY total DESC`,
    date
  );
}
