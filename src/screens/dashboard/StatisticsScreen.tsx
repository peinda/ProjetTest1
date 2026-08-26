import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTopProductsBetween, getProfitBetween, ProductTotal } from '../../db/sales';
import { colors, spacing, radius, fontSize } from '../../theme/theme';
import { formatFCFA } from '../../utils/format';
import {
  todayStr,
  toDateStr,
  formatDateFr,
  currentYearMonth,
  shiftYearMonth,
  monthRange,
  formatMonthFr,
  currentYear,
  shiftYear,
  yearRange,
} from '../../utils/date';
import Card from '../../components/Card';

type PeriodType = 'day' | 'month' | 'year';
const PERIOD_LABELS: Record<PeriodType, string> = { day: 'Jour', month: 'Mois', year: 'Année' };

export default function StatisticsScreen() {
  const [periodType, setPeriodType] = useState<PeriodType>('day');
  const [day, setDay] = useState(todayStr());
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [year, setYear] = useState(currentYear());

  const [topProducts, setTopProducts] = useState<ProductTotal[]>([]);
  const [profit, setProfit] = useState(0);

  const range =
    periodType === 'day'
      ? { start: day, end: day }
      : periodType === 'month'
      ? monthRange(yearMonth)
      : yearRange(year);

  const load = useCallback(async () => {
    setTopProducts(await getTopProductsBetween(range.start, range.end, 5));
    setProfit(await getProfitBetween(range.start, range.end));
  }, [range.start, range.end]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const shift = (delta: number) => {
    if (periodType === 'day') {
      const d = new Date(day);
      d.setDate(d.getDate() + delta);
      setDay(toDateStr(d));
    } else if (periodType === 'month') {
      setYearMonth(shiftYearMonth(yearMonth, delta));
    } else {
      setYear(shiftYear(year, delta));
    }
  };

  const isAtPresent =
    periodType === 'day' ? day >= todayStr() : periodType === 'month' ? yearMonth >= currentYearMonth() : year >= currentYear();

  const periodLabel =
    periodType === 'day' ? formatDateFr(day) : periodType === 'month' ? formatMonthFr(yearMonth) : year;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      <View style={styles.periodRow}>
        {(['day', 'month', 'year'] as PeriodType[]).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPeriodType(p)}
            style={[styles.periodBtn, periodType === p && styles.periodBtnActive]}
          >
            <Text style={[styles.periodLabel, periodType === p && styles.periodLabelActive]}>
              {PERIOD_LABELS[p]}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.dateNav}>
        <Pressable onPress={() => shift(-1)} style={styles.navBtn}>
          <Text style={styles.navArrow}>◀</Text>
        </Pressable>
        <Text style={styles.dateLabel}>{periodLabel}</Text>
        <Pressable onPress={() => shift(1)} style={styles.navBtn} disabled={isAtPresent}>
          <Text style={[styles.navArrow, isAtPresent && styles.navDisabled]}>▶</Text>
        </Pressable>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Bénéfice total</Text>
        <Text style={styles.profitValue}>{formatFCFA(profit)}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Produit le plus vendu</Text>
        {topProducts.length === 0 ? (
          <Text style={styles.empty}>Aucune vente sur cette période.</Text>
        ) : (
          <View style={styles.topProduct}>
            <Text style={styles.topProductName}>🏆 {topProducts[0].product_name}</Text>
            <Text style={styles.topProductMeta}>
              {topProducts[0].quantity} vendu(s) — {formatFCFA(topProducts[0].total)}
            </Text>
          </View>
        )}
      </Card>

      {topProducts.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Classement des ventes (quantité)</Text>
          {topProducts.map((p, i) => {
            const pct = Math.max(6, Math.round((p.quantity / topProducts[0].quantity) * 100));
            return (
              <View key={p.product_name} style={styles.barBlock}>
                <Text style={styles.barLabel} numberOfLines={1}>
                  {i + 1}. {p.product_name}
                </Text>
                <View style={styles.barTrackRow}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.barValue}>{p.quantity}</Text>
                </View>
              </View>
            );
          })}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  periodRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  periodBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodLabel: { fontWeight: '700', color: colors.text },
  periodLabelActive: { color: '#FFFFFF' },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  navBtn: { padding: spacing.sm },
  navArrow: { fontSize: fontSize.lg, color: colors.primary, fontWeight: '700' },
  navDisabled: { color: colors.border },
  dateLabel: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, minWidth: 140, textAlign: 'center' },
  sectionTitle: { fontWeight: '700', color: colors.textMuted, marginBottom: spacing.sm, fontSize: fontSize.sm },
  profitValue: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.success },
  empty: { color: colors.textMuted },
  topProduct: { alignItems: 'center', paddingVertical: spacing.sm },
  topProductName: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, textAlign: 'center' },
  topProductMeta: { color: colors.textMuted, marginTop: spacing.xs },
  barBlock: { marginBottom: spacing.sm },
  barLabel: { color: colors.text, fontWeight: '600', fontSize: fontSize.sm, marginBottom: 4 },
  barTrackRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barTrack: { flex: 1, height: 16, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  barFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  barValue: { width: 32, textAlign: 'right', color: colors.textMuted, fontWeight: '700', fontSize: fontSize.sm },
});
