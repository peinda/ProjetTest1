import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../navigation/types';
import { listStockEntries, updateStockEntry, deleteStockEntry, getProduct } from '../../db/products';
import { StockEntry } from '../../db/types';
import { colors, spacing, fontSize } from '../../theme/theme';
import { formatDateTimeFr } from '../../utils/date';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Field from '../../components/Field';
import { parseQuantity } from '../../utils/validation';
import { showAlert } from '../../utils/alert';

type R = RouteProp<StockStackParamList, 'StockHistory'>;

export default function StockHistoryScreen() {
  const navigation = useNavigation();
  const route = useRoute<R>();
  const productId = route.params?.productId;

  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [productName, setProductName] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setEntries(await listStockEntries(productId));
    if (productId) {
      const p = await getProduct(productId);
      setProductName(p?.name ?? null);
    }
  }, [productId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onStartEdit = (entry: StockEntry) => {
    setEditingId(entry.id);
    setEditQty(String(entry.quantity));
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setEditQty('');
  };

  const onSaveEdit = async (entry: StockEntry) => {
    const qty = parseQuantity(editQty, { allowZero: true });
    if (qty === null) {
      showAlert('Quantité invalide', 'Saisissez un nombre entier valide (0 ou plus).');
      return;
    }
    setSaving(true);
    try {
      await updateStockEntry(entry.id, qty, entry.note);
      setEditingId(null);
      setEditQty('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (entry: StockEntry) => {
    showAlert(
      'Supprimer cette entrée',
      `Supprimer cette entrée de +${entry.quantity} ? La quantité sera retirée du stock du produit.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteStockEntry(entry.id);
            load();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ padding: spacing.md, paddingBottom: 0 }}>
        <Button
          label="← Retour au produit"
          variant="outline"
          onPress={() => navigation.goBack()}
        />
      </View>
      {!!productName && <Text style={styles.productName}>{productName}</Text>}
      <FlatList
        data={entries}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={<Text style={styles.empty}>Aucune entrée de stock.</Text>}
        renderItem={({ item }) => (
          <Card>
            {editingId === item.id ? (
              <View>
                <Field label="Quantité" value={editQty} onChangeText={setEditQty} keyboardType="numeric" />
                <View style={styles.actions}>
                  <Button label="Annuler" variant="outline" onPress={onCancelEdit} style={{ flex: 1 }} />
                  <Button label="Enregistrer" onPress={() => onSaveEdit(item)} disabled={saving} style={{ flex: 1 }} />
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.qty}>+{item.quantity}</Text>
                {!!item.note && <Text style={styles.note}>{item.note}</Text>}
                <Text style={styles.date}>{formatDateTimeFr(item.created_at)}</Text>
                <View style={styles.actions}>
                  <Button label="Modifier" variant="outline" onPress={() => onStartEdit(item)} style={styles.actionBtn} />
                  <Button label="Supprimer" variant="danger" onPress={() => onDelete(item)} style={styles.actionBtn} />
                </View>
              </>
            )}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  productName: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.textMuted },
  qty: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary },
  note: { color: colors.text, marginTop: 4 },
  date: { color: colors.textMuted, marginTop: 4, fontSize: fontSize.sm },
  actions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  actionBtn: { flex: 1, minHeight: 0, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
});
