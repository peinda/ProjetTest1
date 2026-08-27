import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Image } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { listProducts } from '../../db/products';
import { createSale } from '../../db/sales';
import { Product } from '../../db/types';
import { PaymentMethod } from '../../db/types';
import { SalesStackParamList } from '../../navigation/types';
import { colors, spacing, radius, fontSize } from '../../theme/theme';
import { formatFCFA, PAYMENT_LABELS } from '../../utils/format';
import Field from '../../components/Field';
import Button from '../../components/Button';
import { parseAmount, parseQuantity } from '../../utils/validation';
import { showAlert } from '../../utils/alert';

type Nav = NativeStackNavigationProp<SalesStackParamList, 'QuickSale'>;

const METHODS: PaymentMethod[] = ['especes', 'wave', 'om'];
const METHOD_COLORS: Record<PaymentMethod, string> = {
  especes: colors.especes,
  wave: colors.wave,
  om: colors.om,
};

export default function QuickSaleScreen() {
  const navigation = useNavigation<Nav>();
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      listProducts().then(setProducts);
    }, [])
  );

  const selectProduct = (p: Product) => {
    setSelected(p);
    setUnitPrice(String(p.sale_price));
    setQuantity('1');
  };

  const validQty = parseQuantity(quantity);
  const validPrice = parseAmount(unitPrice, { allowZero: true });
  const qtyNum = validQty ?? 0;
  const priceNum = validPrice ?? 0;
  const total = qtyNum * priceNum;
  const canSave =
    !!selected &&
    validQty !== null &&
    validPrice !== null &&
    !!payment &&
    validQty <= (selected?.quantity ?? 0);

  const reset = () => {
    setSelected(null);
    setQuantity('1');
    setUnitPrice('');
    setPayment(null);
  };

  const onConfirm = async () => {
    if (!selected || !payment) return;
    const qty = parseQuantity(quantity);
    if (qty === null) {
      showAlert('Quantité invalide', 'Saisissez un nombre entier supérieur à 0.');
      return;
    }
    const price = parseAmount(unitPrice, { allowZero: true });
    if (price === null) {
      showAlert('Prix invalide', 'Saisissez un montant valide (0 ou plus).');
      return;
    }
    if (qty > selected.quantity) {
      showAlert('Stock insuffisant', `Il ne reste que ${selected.quantity} en stock.`);
      return;
    }
    setSaving(true);
    try {
      await createSale({
        product_id: selected.id,
        product_name: selected.name,
        quantity: qty,
        unit_price: price,
        payment_method: payment,
      });
      const updated = await listProducts();
      setProducts(updated);
      reset();
      showAlert('Vente enregistrée', `${formatFCFA(total)} — ${PAYMENT_LABELS[payment]}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        label="Historique des ventes"
        variant="outline"
        onPress={() => navigation.navigate('SalesHistory')}
        style={{ marginBottom: spacing.md }}
      />
      <Text style={styles.sectionLabel}>1. Choisir le produit</Text>
      <FlatList
        data={products}
        horizontal
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.productList}
        showsHorizontalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.empty}>Ajoutez d'abord un produit dans Stock.</Text>}
        renderItem={({ item }) => {
          const isSelected = selected?.id === item.id;
          const outOfStock = item.quantity <= 0;
          return (
            <Pressable
              onPress={() => !outOfStock && selectProduct(item)}
              style={[
                styles.productChip,
                isSelected && styles.productChipSelected,
                outOfStock && styles.productChipDisabled,
              ]}
              disabled={outOfStock}
            >
              {item.image_uri ? (
                <Image source={{ uri: item.image_uri }} style={styles.productChipImage} resizeMode="cover" />
              ) : (
                <View style={styles.productChipImagePlaceholder}>
                  <Text style={{ fontSize: 18 }}>📦</Text>
                </View>
              )}
              <Text style={[styles.productChipName, isSelected && styles.productChipTextSelected]}>
                {item.name}
              </Text>
              <Text style={[styles.productChipMeta, isSelected && styles.productChipTextSelected]}>
                {outOfStock ? 'Rupture' : `${item.quantity} en stock`}
              </Text>
            </Pressable>
          );
        }}
      />

      {selected && (
        <View style={styles.form}>
          <Button
            label="← Retour au choix du produit"
            variant="outline"
            onPress={reset}
            style={{ marginBottom: spacing.md }}
          />
          <Text style={styles.sectionLabel}>2. Quantité et prix</Text>
          <View style={styles.row}>
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setQuantity(String(Math.max(1, qtyNum - 1)))}
              >
                <Text style={styles.stepperLabel}>−</Text>
              </Pressable>
              <Field
                label=""
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                style={styles.qtyInput}
              />
              <Pressable style={styles.stepperBtn} onPress={() => setQuantity(String(qtyNum + 1))}>
                <Text style={styles.stepperLabel}>+</Text>
              </Pressable>
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Prix unitaire (FCFA)"
                value={unitPrice}
                onChangeText={setUnitPrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.total}>Total : {formatFCFA(total)}</Text>

          <Text style={styles.sectionLabel}>3. Mode de paiement</Text>
          <View style={styles.paymentRow}>
            {METHODS.map((m) => (
              <Pressable
                key={m}
                onPress={() => setPayment(m)}
                style={[
                  styles.paymentBtn,
                  { borderColor: METHOD_COLORS[m] },
                  payment === m && { backgroundColor: METHOD_COLORS[m] },
                ]}
              >
                <Text
                  style={[
                    styles.paymentLabel,
                    { color: payment === m ? '#FFF' : METHOD_COLORS[m] },
                  ]}
                >
                  {PAYMENT_LABELS[m]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button
            label={saving ? 'Enregistrement...' : 'Enregistrer la vente'}
            onPress={onConfirm}
            disabled={!canSave || saving}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.sm },
  empty: { color: colors.textMuted, padding: spacing.md },
  productList: { paddingBottom: spacing.md, gap: spacing.sm },
  productChip: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginRight: spacing.sm,
    minWidth: 130,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  productChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  productChipImage: { width: '100%', height: 60, borderRadius: radius.sm, marginBottom: spacing.xs },
  productChipImagePlaceholder: {
    width: '100%',
    height: 60,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productChipDisabled: { opacity: 0.4 },
  productChipName: { fontWeight: '700', color: colors.text, fontSize: fontSize.md },
  productChipMeta: { color: colors.textMuted, marginTop: 4, fontSize: fontSize.sm },
  productChipTextSelected: { color: '#FFFFFF' },
  form: { marginTop: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stepperBtn: {
    width: 48,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperLabel: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  qtyInput: { width: 60, textAlign: 'center' },
  total: { fontSize: fontSize.xl, fontWeight: '800', color: colors.primary, marginVertical: spacing.md },
  paymentRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  paymentBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  paymentLabel: { fontWeight: '700' },
});
