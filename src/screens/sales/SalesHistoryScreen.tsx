import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { listSalesByDate, getTotalsByPaymentMethod, deleteSale } from '../../db/sales';
import { Sale } from '../../db/types';
import { SalesStackParamList } from '../../navigation/types';
import { colors, spacing, radius, fontSize } from '../../theme/theme';
import { formatFCFA, PAYMENT_LABELS } from '../../utils/format';
import { todayStr, formatDateFr, toDateStr } from '../../utils/date';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { showAlert } from '../../utils/alert';

type Nav = NativeStackNavigationProp<SalesStackParamList, 'SalesHistory'>;

export default function SalesHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const [date, setDate] = useState(todayStr());
  const [sales, setSales] = useState<Sale[]>([]);
  const [totals, setTotals] = useState({ especes: 0, wave: 0, om: 0 });

  const load = useCallback(async (d: string) => {
    setSales(await listSalesByDate(d));
    setTotals(await getTotalsByPaymentMethod(d));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(date);
    }, [date, load])
  );

  const shiftDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(toDateStr(d));
  };

  const onDelete = (sale: Sale) => {
    showAlert('Annuler la vente', 'Cette vente sera supprimée et le stock recrédité.', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, annuler',
        style: 'destructive',
        onPress: async () => {
          await deleteSale(sale.id);
          load(date);
        },
      },
    ]);
  };

  const grandTotal = totals.especes + totals.wave + totals.om;

  return (
    <View style={styles.container}>
      <View style={styles.dateNav}>
        <Pressable onPress={() => shiftDate(-1)} style={styles.navBtn}>
          <Text style={styles.navLabel}>◀</Text>
        </Pressable>
        <Text style={styles.dateLabel}>{formatDateFr(date)}</Text>
        <Pressable onPress={() => shiftDate(1)} style={styles.navBtn} disabled={date >= todayStr()}>
          <Text style={[styles.navLabel, date >= todayStr() && styles.navDisabled]}>▶</Text>
        </Pressable>
      </View>

      <Card>
        <View style={styles.totalsRow}>
          <TotalItem label="Espèces" value={totals.especes} color={colors.especes} />
          <TotalItem label="Wave" value={totals.wave} color={colors.wave} />
          <TotalItem label="Orange Money" value={totals.om} color={colors.om} />
        </View>
        <Text style={styles.grandTotal}>Total du jour : {formatFCFA(grandTotal)}</Text>
      </Card>

      <FlatList
        data={sales}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={<Text style={styles.empty}>Aucune vente ce jour-là.</Text>}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.saleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.saleName}>
                  {item.product_name} × {item.quantity}
                </Text>
                <Text style={styles.saleMethod}>{PAYMENT_LABELS[item.payment_method]}</Text>
              </View>
              <Text style={styles.saleTotal}>{formatFCFA(item.total)}</Text>
            </View>
            <View style={styles.saleActions}>
              <Button
                label="Modifier"
                variant="outline"
                onPress={() => navigation.navigate('EditSale', { saleId: item.id })}
                style={styles.saleActionBtn}
              />
              <Button label="Supprimer" variant="danger" onPress={() => onDelete(item)} style={styles.saleActionBtn} />
            </View>
          </Card>
        )}
      />
    </View>
  );
}

function TotalItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.totalItem}>
      <Text style={[styles.totalValue, { color }]}>{formatFCFA(value)}</Text>
      <Text style={styles.totalLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  navBtn: { padding: spacing.sm },
  navLabel: { fontSize: fontSize.lg, color: colors.primary, fontWeight: '700' },
  navDisabled: { color: colors.border },
  dateLabel: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, minWidth: 120, textAlign: 'center' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalItem: { alignItems: 'center', flex: 1 },
  totalValue: { fontWeight: '800', fontSize: fontSize.md },
  totalLabel: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  grandTotal: {
    textAlign: 'center',
    marginTop: spacing.md,
    fontWeight: '700',
    fontSize: fontSize.md,
    color: colors.text,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  saleRow: { flexDirection: 'row', alignItems: 'center' },
  saleName: { fontWeight: '700', color: colors.text, fontSize: fontSize.md },
  saleMethod: { color: colors.textMuted, marginTop: 2, fontSize: fontSize.sm },
  saleTotal: { fontWeight: '700', color: colors.primary, fontSize: fontSize.md },
  saleActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saleActionBtn: { flex: 1, minHeight: 0, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
});
