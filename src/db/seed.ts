import { listProducts, createProduct } from './products';
import { createSale } from './sales';
import { createAdvance } from './cash';
import { createDebt, recordPayment, listDebts } from './debts';
import { todayStr, daysAgoStr } from '../utils/date';

// Dev-only convenience: populates the local database with realistic sample
// data so the app isn't empty on first run in development. Never runs in a
// release build (__DEV__ is false there), and only runs once — it no-ops as
// soon as at least one product already exists.
export async function seedSampleDataIfEmpty(): Promise<void> {
  const existing = await listProducts();
  if (existing.length > 0) return;

  const robe = await createProduct({ name: 'Robe wax', category: 'Robes', purchase_price: 5000, sale_price: 8500, quantity: 14, low_stock_threshold: 3 });
  const boubou = await createProduct({ name: 'Boubou homme', category: 'Boubous', purchase_price: 12000, sale_price: 18000, quantity: 6, low_stock_threshold: 2 });
  const ensemble = await createProduct({ name: 'Ensemble enfant', category: 'Enfants', purchase_price: 4000, sale_price: 6500, quantity: 4, low_stock_threshold: 3 });
  const tissu = await createProduct({ name: 'Tissu bazin (coupon)', category: 'Tissus', purchase_price: 7000, sale_price: 11000, quantity: 9, low_stock_threshold: 3 });
  const foulard = await createProduct({ name: 'Foulard', category: 'Accessoires', purchase_price: 1500, sale_price: 3000, quantity: 22, low_stock_threshold: 5 });
  const sandales = await createProduct({ name: 'Sandales', category: 'Accessoires', purchase_price: 3000, sale_price: 5000, quantity: 2, low_stock_threshold: 3 });

  const today = todayStr();
  const yesterday = daysAgoStr(1);

  await createSale({ product_id: robe, product_name: 'Robe wax', quantity: 1, unit_price: 8500, payment_method: 'especes', sale_date: today });
  await createSale({ product_id: foulard, product_name: 'Foulard', quantity: 2, unit_price: 3000, payment_method: 'wave', sale_date: today });
  await createSale({ product_id: tissu, product_name: 'Tissu bazin (coupon)', quantity: 1, unit_price: 11000, payment_method: 'om', sale_date: today });
  await createSale({ product_id: sandales, product_name: 'Sandales', quantity: 1, unit_price: 5000, payment_method: 'especes', sale_date: today });
  await createSale({ product_id: boubou, product_name: 'Boubou homme', quantity: 1, unit_price: 18000, payment_method: 'wave', sale_date: yesterday });
  await createSale({ product_id: robe, product_name: 'Robe wax', quantity: 2, unit_price: 8000, payment_method: 'especes', sale_date: yesterday });
  await createSale({ product_id: ensemble, product_name: 'Ensemble enfant', quantity: 1, unit_price: 6500, payment_method: 'om', sale_date: yesterday });

  await createAdvance({ target: 'wave', amount: 5000, note: 'Crédit Wave pour un client', advance_date: today });
  await createAdvance({ target: 'om', amount: 3000, note: 'Crédit Orange Money pour un client', advance_date: yesterday });

  await createDebt({ client_name: 'Fatou Diop', client_phone: '77 123 45 67', amount: 15000, product: 'Boubou homme', debt_date: yesterday });
  await createDebt({ client_name: 'Moussa Ndiaye', client_phone: '78 987 65 43', amount: 8500, product: 'Robe wax', debt_date: daysAgoStr(18) });

  const debts = await listDebts('en_cours');
  const moussa = debts.find((d) => d.client_name === 'Moussa Ndiaye');
  if (moussa) await recordPayment(moussa.id, 3000, today);
}
