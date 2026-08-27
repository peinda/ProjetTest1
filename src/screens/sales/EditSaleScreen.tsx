import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getSaleById, updateSale } from '../../db/sales';
import { getProduct } from '../../db/products';
import { PaymentMethod, Sale } from '../../db/types';
import { SalesStackParamList } from '../../navigation/types';
import { colors, spacing, radius, fontSize } from '../../theme/theme';
import { formatFCFA, PAYMENT_LABELS } from '../../utils/format';
import Field from '../../components/Field';
import Button from '../../components/Button';
import { parseAmount, parseQuantity } from '../../utils/validation';
import { showAlert } from '../../utils/alert';

const METHODS: PaymentMethod[] = ['especes', 'wave', 'om'];
const METHOD_COLORS: Record<PaymentMethod, string> = {
  especes: colors.especes,
  wave: colors.wave,
  om: colors.om,
};

type Nav = NativeStackNavigationProp<SalesStackParamList, 'EditSale'>;
type Route = RouteProp<SalesStackParamList, 'EditSale'>;

export default function EditSaleScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { saleId } = route.params;

  const [sale, setSale] = useState<Sale | null>(null);
  const [maxAvailable, setMaxAvailable] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('especes');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSaleById(saleId);
      if (!s) return;
      setSale(s);
      setQuantity(String(s.quantity));
      setUnitPrice(String(s.unit_price));
      setPayment(s.payment_method);
      if (s.product_id) {
        const product = await getProduct(s.product_id);
        if (product) setMaxAvailable(product.quantity + s.quantity);
      }
    })();
  }, [saleId]);

  if (!sale) return null;

  const qtyNum = parseQuantity(quantity) ?? 0;
  const priceNum = parseAmount(unitPrice, { allowZero: true }) ?? 0;
  const total = qtyNum * priceNum;

  const onSave = async () => {
    const qty = parseQuantity(quantity);
    if (qty === null) {
      showAlert('Quantité invalide', 'Saisissez un nombre entier supérieur à 0.');
      return;
    }
    if (maxAvailable !== null && qty > maxAvailable) {
      showAlert('Stock insuffisant', `Il ne reste que ${maxAvailable} disponible pour ce produit.`);
      return;
    }
    const price = parseAmount(unitPrice, { allowZero: true });
    if (price === null) {
      showAlert('Prix invalide', 'Saisissez un montant valide (0 ou plus).');
      return;
    }
    setSaving(true);
    try {
      await updateSale(saleId, { quantity: qty, unit_price: price, payment_method: payment });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        label="← Retour à l'historique"
        variant="outline"
        onPress={() => navigation.goBack()}
        style={{ marginBottom: spacing.md }}
      />
      <Text style={styles.productName}>{sale.product_name}</Text>

      <Field
        label="Quantité"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
      />
      <Field
        label="Prix unitaire (FCFA)"
        value={unitPrice}
        onChangeText={setUnitPrice}
        keyboardType="numeric"
      />

      <Text style={styles.total}>Total : {formatFCFA(total)}</Text>

      <Text style={styles.sectionLabel}>Mode de paiement</Text>
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
            <Text style={[styles.paymentLabel, { color: payment === m ? '#FFF' : METHOD_COLORS[m] }]}>
              {PAYMENT_LABELS[m]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button label={saving ? 'Enregistrement...' : 'Enregistrer les modifications'} onPress={onSave} disabled={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  productName: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.sm },
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
