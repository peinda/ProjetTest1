import { listProducts, createProduct } from './products';
import { createSale } from './sales';
import { createAdvance } from './cash';
import { createDebt, recordPayment, listDebts } from './debts';
import { todayStr, daysAgoStr } from '../utils/date';

// Dev-only convenience: populates the local database with realistic sample
// data so the app isn't empty on first run in development. Never runs in a
// release build (__DEV__ is false there), and only runs once — it no-ops as
// soon as at least one product already exists.
//
// Catalogue aligné sur les catégories réelles de la boutique (vêtements
// femme) : Robes, Ensembles_pantalon, Ensembles_jupe, Ensembles_pagne,
// Jupes, Robe_Cole, robes_Enfant, Divers.
export async function seedSampleDataIfEmpty(): Promise<void> {
  const existing = await listProducts();
  if (existing.length > 0) return;

  const robe = await createProduct({ name: 'Robe wax imprimée', category: 'Robes', purchase_price: 6000, sale_price: 10000, wholesale_price: 8500, quantity: 10, low_stock_threshold: 3 });
  const ensPantalon = await createProduct({ name: 'Ensemble pantalon tailleur', category: 'Ensembles_pantalon', purchase_price: 9000, sale_price: 15000, wholesale_price: 12500, quantity: 5, low_stock_threshold: 2 });
  const ensJupe = await createProduct({ name: 'Ensemble jupe chemisier', category: 'Ensembles_jupe', purchase_price: 8000, sale_price: 13000, wholesale_price: 11000, quantity: 4, low_stock_threshold: 3 });
  const ensPagne = await createProduct({ name: 'Ensemble pagne bazin', category: 'Ensembles_pagne', purchase_price: 10000, sale_price: 16000, wholesale_price: 13500, quantity: 3, low_stock_threshold: 3 });
  const jupe = await createProduct({ name: 'Jupe crayon', category: 'Jupes', purchase_price: 4000, sale_price: 7000, wholesale_price: 6000, quantity: 8, low_stock_threshold: 3 });
  const robeCole = await createProduct({ name: 'Robe Cole soirée', category: 'Robe_Cole', purchase_price: 12000, sale_price: 20000, wholesale_price: 17000, quantity: 2, low_stock_threshold: 3 });
  const robeEnfant = await createProduct({ name: 'Robe fillette wax', category: 'robes_Enfant', purchase_price: 3000, sale_price: 5500, wholesale_price: 4700, quantity: 6, low_stock_threshold: 3 });
  const divers = await createProduct({ name: 'Foulard', category: 'Divers', purchase_price: 1500, sale_price: 3000, wholesale_price: 2400, quantity: 15, low_stock_threshold: 5 });

  const today = todayStr();
  const yesterday = daysAgoStr(1);

  await createSale({ product_id: robe, product_name: 'Robe wax imprimée', quantity: 1, unit_price: 10000, payment_method: 'especes', sale_date: today });
  await createSale({ product_id: divers, product_name: 'Foulard', quantity: 2, unit_price: 3000, payment_method: 'wave', sale_date: today });
  await createSale({ product_id: ensPagne, product_name: 'Ensemble pagne bazin', quantity: 1, unit_price: 16000, payment_method: 'om', sale_date: today });
  await createSale({ product_id: jupe, product_name: 'Jupe crayon', quantity: 1, unit_price: 7000, payment_method: 'especes', sale_date: today });
  await createSale({ product_id: ensPantalon, product_name: 'Ensemble pantalon tailleur', quantity: 1, unit_price: 15000, payment_method: 'wave', sale_date: yesterday });
  await createSale({ product_id: robe, product_name: 'Robe wax imprimée', quantity: 2, unit_price: 9500, payment_method: 'especes', sale_date: yesterday });
  await createSale({ product_id: ensJupe, product_name: 'Ensemble jupe chemisier', quantity: 1, unit_price: 13000, payment_method: 'om', sale_date: yesterday });
  await createSale({ product_id: robeEnfant, product_name: 'Robe fillette wax', quantity: 1, unit_price: 5500, payment_method: 'especes', sale_date: today });

  await createAdvance({ target: 'wave', amount: 5000, note: 'Crédit Wave pour un client', advance_date: today });
  await createAdvance({ target: 'om', amount: 3000, note: 'Crédit Orange Money pour un client', advance_date: yesterday });

  await createDebt({ client_name: 'Fatou Diop', client_phone: '77 123 45 67', amount: 15000, product: 'Ensemble pantalon tailleur', debt_date: yesterday });
  await createDebt({ client_name: 'Awa Sarr', client_phone: '78 987 65 43', amount: 10000, product: 'Robe Cole soirée', debt_date: daysAgoStr(18) });

  const debts = await listDebts('en_cours');
  const awa = debts.find((d) => d.client_name === 'Awa Sarr');
  if (awa) await recordPayment(awa.id, 4000, today);
}
