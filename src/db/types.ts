export type PaymentMethod = 'especes' | 'wave' | 'om';
export type AdvanceTarget = 'wave' | 'om';
export type DebtStatus = 'en_cours' | 'solde';

export interface Product {
  id: number;
  name: string;
  category: string | null;
  purchase_price: number;
  sale_price: number;
  quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface StockEntry {
  id: number;
  product_id: number;
  quantity: number;
  note: string | null;
  created_at: string;
}

export interface Sale {
  id: number;
  product_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  payment_method: PaymentMethod;
  sale_date: string;
  created_at: string;
}

export interface CashAdvance {
  id: number;
  target: AdvanceTarget;
  amount: number;
  note: string | null;
  advance_date: string;
  created_at: string;
}

export interface CashClosure {
  id: number;
  closure_date: string;
  sales_especes: number;
  sales_wave: number;
  sales_om: number;
  advances_wave: number;
  advances_om: number;
  theoretical_commerce: number;
  theoretical_wave: number;
  theoretical_om: number;
  counted_commerce: number | null;
  counted_wave: number | null;
  counted_om: number | null;
  note: string | null;
  created_at: string;
}

export interface Debt {
  id: number;
  client_name: string;
  client_phone: string | null;
  amount: number;
  remaining_amount: number;
  product: string | null;
  note: string | null;
  debt_date: string;
  status: DebtStatus;
  created_at: string;
}

export interface DebtPayment {
  id: number;
  debt_id: number;
  amount: number;
  payment_date: string;
  created_at: string;
}
