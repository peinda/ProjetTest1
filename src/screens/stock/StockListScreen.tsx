import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StockStackParamList } from '../../navigation/types';
import { listProducts, deleteProduct } from '../../db/products';
import { Product } from '../../db/types';
import { colors, spacing, radius, fontSize } from '../../theme/theme';
import { formatFCFA } from '../../utils/format';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { showAlert } from '../../utils/alert';

type Nav = NativeStackNavigationProp<StockStackParamList, 'StockList'>;

export default function StockListScreen() {
  const navigation = useNavigation<Nav>();
  const [products, setProducts] = useState<Product[]>([]);

  const load = useCallback(async () => {
    setProducts(await listProducts());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onDelete = (product: Product) => {
    showAlert(
      'Supprimer le produit',
      `Supprimer "${product.name}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteProduct(product.id);
            load();
          },
        },
      ]
    );
  };

  const lowStockCount = products.filter((p) => p.quantity <= p.low_stock_threshold).length;

  return (
    <View style={styles.container}>
      {lowStockCount > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>⚠ {lowStockCount} produit(s) en stock faible</Text>
        </View>
      )}
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun produit. Ajoutez votre premier produit.</Text>
        }
        renderItem={({ item }) => {
          const low = item.quantity <= item.low_stock_threshold;
          return (
            <Card style={low ? styles.lowCard : undefined}>
              <View style={styles.row}>
                {item.image_uri ? (
                  <Image source={{ uri: item.image_uri }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Text style={styles.thumbPlaceholderIcon}>📦</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  {!!item.category && <Text style={styles.category}>{item.category}</Text>}
                  <Text style={styles.price}>{formatFCFA(item.sale_price)}</Text>
                </View>
                <View style={styles.qtyBox}>
                  <Text style={[styles.qty, low && styles.qtyLow]}>{item.quantity}</Text>
                  <Text style={styles.qtyLabel}>en stock</Text>
                </View>
              </View>
              <View style={styles.productActions}>
                <Button
                  label="Modifier"
                  variant="outline"
                  onPress={() => navigation.navigate('ProductForm', { productId: item.id })}
                  style={styles.productActionBtn}
                />
                <Button label="Supprimer" variant="danger" onPress={() => onDelete(item)} style={styles.productActionBtn} />
              </View>
            </Card>
          );
        }}
      />
      <View style={styles.footer}>
        <Button label="+ Ajouter un produit" onPress={() => navigation.navigate('ProductForm')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: 100 },
  alertBanner: {
    backgroundColor: '#FCEBD5',
    padding: spacing.sm,
    margin: spacing.md,
    marginBottom: 0,
    borderRadius: radius.sm,
  },
  alertText: { color: colors.accent, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  thumb: { width: 52, height: 52, borderRadius: radius.sm },
  thumbPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlaceholderIcon: { fontSize: 20 },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  category: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  price: { fontSize: fontSize.sm, color: colors.primary, marginTop: 4, fontWeight: '600' },
  qtyBox: { alignItems: 'center', minWidth: 64 },
  qty: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  qtyLow: { color: colors.danger },
  qtyLabel: { fontSize: 11, color: colors.textMuted },
  lowCard: { borderWidth: 1, borderColor: colors.danger },
  productActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  productActionBtn: { flex: 1, minHeight: 0, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
});
