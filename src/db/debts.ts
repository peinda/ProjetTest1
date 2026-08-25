import { getDb } from './database';
import { Debt, DebtPayment } from './types';
import { todayStr } from '../utils/date';

export interface NewDebt {
  client_name: string;
  client_phone?: string | null;
  amount: number;
  product?: string | null;
  note?: string | null;
  debt_date?: string;
}

export async function createDebt(input: NewDebt): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO debts (client_name, client_phone, amount, remaining_amount, product, note, debt_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.client_name,
    input.client_phone ?? null,
    input.amount,
    input.amount,
    input.product ?? null,
    input.note ?? null,
    input.debt_date ?? todayStr()
  );
  return result.lastInsertRowId;
}

export async function listDebts(status?: 'en_cours' | 'solde'): Promise<Debt[]> {
  const db = await getDb();
  if (status) {
    return db.getAllAsync<Debt>(
      'SELECT * FROM debts WHERE status = ? ORDER BY debt_date ASC',
      status
    );
  }
  return db.getAllAsync<Debt>('SELECT * FROM debts ORDER BY debt_date ASC');
}

export async function getDebt(id: number): Promise<Debt | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Debt>('SELECT * FROM debts WHERE id = ?', id);
  return row ?? null;
}

export async function listDebtPayments(debtId: number): Promise<DebtPayment[]> {
  const db = await getDb();
  return db.getAllAsync<DebtPayment>(
    'SELECT * FROM debt_payments WHERE debt_id = ? ORDER BY created_at DESC',
    debtId
  );
}

export async function recordPayment(debtId: number, amount: number, date?: string): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const debt = await db.getFirstAsync<Debt>('SELECT * FROM debts WHERE id = ?', debtId);
    if (!debt) return;
    const newRemaining = Math.max(0, debt.remaining_amount - amount);
    const newStatus = newRemaining <= 0 ? 'solde' : 'en_cours';
    await db.runAsync(
      'UPDATE debts SET remaining_amount = ?, status = ? WHERE id = ?',
      newRemaining,
      newStatus,
      debtId
    );
    await db.runAsync(
      'INSERT INTO debt_payments (debt_id, amount, payment_date) VALUES (?, ?, ?)',
      debtId,
      amount,
      date ?? todayStr()
    );
  });
}

export async function getTotalOutstanding(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(remaining_amount) as total FROM debts WHERE status = 'en_cours'"
  );
  return row?.total ?? 0;
}

export async function deleteDebt(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM debts WHERE id = ?', id);
}
