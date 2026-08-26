import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { listProducts } from '../../db/products';
import { listSalesBetween, getTotalsByPaymentMethod } from '../../db/sales';
import { getTotalOutstanding } from '../../db/debts';
import { DashboardStackParamList } from '../../navigation/types';
import { colors, spacing, fontSize } from '../../theme/theme';
import { formatFCFA } from '../../utils/format';
import { todayStr, startOfWeekStr, startOfMonthStr } from '../../utils/date';
import Card from '../../components/Card';
import Button from '../../components/Button';

type Nav = NativeStackNavigationProp<DashboardStackParamList, 'Dashboard'>;

interface PeriodTotals {
  especes: number;
  wave: number;
  om: number;
}

async function sumBetween(start: string, end: string): Promise<PeriodTotals> {
  const sales = await listSalesBetween(start, end);
  const totals: PeriodTotals = { especes: 0, wave: 0, om: 0 };
  for (const s of sales) totals[s.payment_method] += s.total;
  return totals;
}

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [todayTotals, setTodayTotals] = useState<PeriodTotals>({ especes: 0, wave: 0, om: 0 });
  const [weekTotals, setWeekTotals] = useState<PeriodTotals>({ especes: 0, wave: 0, om: 0 });
  const [monthTotals, setMonthTotals] = useState<PeriodTotals>({ especes: 0, wave: 0, om: 0 });
  const [stockCount, setStockCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [debtsTotal, setDebtsTotal] = useState(0);

  const load = useCallback(async () => {
    const today = todayStr();
    setTodayTotals(await getTotalsByPaymentMethod(today));
    setWeekTotals(await sumBetween(startOfWeekStr(), today));
    setMonthTotals(await sumBetween(startOfMonthStr(), today));
    const products = await listProducts();
    setStockCount(products.reduce((sum, p) => sum + p.quantity, 0));
    setLowStockCount(products.filter((p) => p.quantity <= p.low_stock_threshold).length);
    setDebtsTotal(await getTotalOutstanding());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const todaySum = todayTotals.especes + todayTotals.wave + todayTotals.om;
  const weekSum = weekTotals.especes + weekTotals.wave + weekTotals.om;
  const monthSum = monthTotals.especes + monthTotals.wave + monthTotals.om;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      <Button
        label="Voir les statistiques"
        variant="outline"
        onPress={() => navigation.navigate('Statistics')}
        style={{ marginBottom: spacing.md }}
      />

      <Card>
        <Text style={styles.sectionTitle}>Aujourd'hui</Text>
        <Text style={styles.bigNumber}>{formatFCFA(todaySum)}</Text>
        <Breakdown totals={todayTotals} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Stock</Text>
        <Text style={styles.bigNumber}>{stockCount} articles</Text>
        {lowStockCount > 0 && (
          <Text style={styles.warning}>⚠ {lowStockCount} produit(s) en stock faible</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Cette semaine</Text>
        <Text style={styles.bigNumber}>{formatFCFA(weekSum)}</Text>
        <Breakdown totals={weekTotals} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Ce mois</Text>
        <Text style={styles.bigNumber}>{formatFCFA(monthSum)}</Text>
        <Breakdown totals={monthTotals} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Dettes clients en cours</Text>
        <Text style={[styles.bigNumber, { color: colors.danger }]}>{formatFCFA(debtsTotal)}</Text>
      </Card>
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

function Breakdown({ totals }: { totals: PeriodTotals }) {
  return (
    <View style={styles.breakdown}>
      <Text style={styles.breakdownItem}>Espèces {formatFCFA(totals.especes)}</Text>
      <Text style={styles.breakdownItem}>Wave {formatFCFA(totals.wave)}</Text>
      <Text style={styles.breakdownItem}>OM {formatFCFA(totals.om)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionTitle: { fontWeight: '700', color: colors.textMuted, fontSize: fontSize.sm },
  bigNumber: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, marginTop: 4 },
  warning: { color: colors.danger, fontWeight: '700', marginTop: spacing.sm },
  breakdown: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, flexWrap: 'wrap' },
  breakdownItem: { color: colors.textMuted, fontSize: fontSize.sm },
});
