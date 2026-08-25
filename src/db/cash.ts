import { getDb } from './database';
import { CashAdvance, CashClosure, AdvanceTarget } from './types';
import { getTotalsByPaymentMethod } from './sales';
import { todayStr } from '../utils/date';

export interface NewAdvance {
  target: AdvanceTarget;
  amount: number;
  note?: string | null;
  advance_date?: string;
}

export async function createAdvance(input: NewAdvance): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO cash_advances (target, amount, note, advance_date) VALUES (?, ?, ?, ?)`,
    input.target,
    input.amount,
    input.note ?? null,
    input.advance_date ?? todayStr()
  );
  return result.lastInsertRowId;
}

export async function listAdvancesByDate(date: string): Promise<CashAdvance[]> {
  const db = await getDb();
  return db.getAllAsync<CashAdvance>(
    'SELECT * FROM cash_advances WHERE advance_date = ? ORDER BY created_at DESC',
    date
  );
}

export async function deleteAdvance(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM cash_advances WHERE id = ?', id);
}

export interface DailyCashSheet {
  date: string;
  sales_especes: number;
  sales_wave: number;
  sales_om: number;
  advances_wave: number;
  advances_om: number;
  theoretical_commerce: number;
  theoretical_wave: number;
  theoretical_om: number;
}

export async function computeDailySheet(date: string): Promise<DailyCashSheet> {
  const sales = await getTotalsByPaymentMethod(date);
  const advances = await listAdvancesByDate(date);
  const advances_wave = advances.filter((a) => a.target === 'wave').reduce((s, a) => s + a.amount, 0);
  const advances_om = advances.filter((a) => a.target === 'om').reduce((s, a) => s + a.amount, 0);

  return {
    date,
    sales_especes: sales.especes,
    sales_wave: sales.wave,
    sales_om: sales.om,
    advances_wave,
    advances_om,
    theoretical_commerce: sales.especes - advances_wave - advances_om,
    theoretical_wave: sales.wave + advances_wave,
    theoretical_om: sales.om + advances_om,
  };
}

export async function getClosure(date: string): Promise<CashClosure | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CashClosure>(
    'SELECT * FROM cash_closures WHERE closure_date = ?',
    date
  );
  return row ?? null;
}

export async function saveClosure(
  sheet: DailyCashSheet,
  counted: { commerce: number; wave: number; om: number },
  note?: string
): Promise<void> {
  const db = await getDb();
  const existing = await getClosure(sheet.date);
  if (existing) {
    await db.runAsync(
      `UPDATE cash_closures SET sales_especes = ?, sales_wave = ?, sales_om = ?,
       advances_wave = ?, advances_om = ?, theoretical_commerce = ?, theoretical_wave = ?,
       theoretical_om = ?, counted_commerce = ?, counted_wave = ?, counted_om = ?, note = ?
       WHERE closure_date = ?`,
      sheet.sales_especes,
      sheet.sales_wave,
      sheet.sales_om,
      sheet.advances_wave,
      sheet.advances_om,
      sheet.theoretical_commerce,
      sheet.theoretical_wave,
      sheet.theoretical_om,
      counted.commerce,
      counted.wave,
      counted.om,
      note ?? null,
      sheet.date
    );
  } else {
    await db.runAsync(
      `INSERT INTO cash_closures (closure_date, sales_especes, sales_wave, sales_om,
       advances_wave, advances_om, theoretical_commerce, theoretical_wave, theoretical_om,
       counted_commerce, counted_wave, counted_om, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      sheet.date,
      sheet.sales_especes,
      sheet.sales_wave,
      sheet.sales_om,
      sheet.advances_wave,
      sheet.advances_om,
      sheet.theoretical_commerce,
      sheet.theoretical_wave,
      sheet.theoretical_om,
      counted.commerce,
      counted.wave,
      counted.om,
      note ?? null
    );
  }
}

export async function listClosures(limit: number = 60): Promise<CashClosure[]> {
  const db = await getDb();
  return db.getAllAsync<CashClosure>(
    'SELECT * FROM cash_closures ORDER BY closure_date DESC LIMIT ?',
    limit
  );
}
