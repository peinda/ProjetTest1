import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getAdvanceTotalsBetween, getAllTimeAdvanceTotals, AdvanceTotals } from '../../db/cash';
import { getTotalsBetween, PaymentTotals } from '../../db/sales';
import { colors, spacing, radius, fontSize } from '../../theme/theme';
import { formatFCFA } from '../../utils/format';
import { currentYearMonth, shiftYearMonth, monthRange, formatMonthFr } from '../../utils/date';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function MonthlyBalanceScreen() {
  const navigation = useNavigation();
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [advances, setAdvances] = useState<AdvanceTotals>({ wave: 0, om: 0 });
  const [sales, setSales] = useState<PaymentTotals>({ especes: 0, wave: 0, om: 0 });
  const [allTime, setAllTime] = useState<AdvanceTotals>({ wave: 0, om: 0 });

  const load = useCallback(async (ym: string) => {
    const { start, end } = monthRange(ym);
    setAdvances(await getAdvanceTotalsBetween(start, end));
    setSales(await getTotalsBetween(start, end));
    setAllTime(await getAllTimeAdvanceTotals());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(yearMonth);
    }, [yearMonth, load])
  );

  const isCurrentMonth = yearMonth >= currentYearMonth();
  const totalMonth = advances.wave + advances.om;
  const totalAllTime = allTime.wave + allTime.om;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      <Button
        label="← Retour à la caisse"
        variant="outline"
        onPress={() => navigation.goBack()}
        style={{ marginBottom: spacing.md }}
      />
      <View style={styles.monthNav}>
        <Pressable onPress={() => setYearMonth(shiftYearMonth(yearMonth, -1))} style={styles.navBtn}>
          <Text style={styles.navLabel}>◀</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{formatMonthFr(yearMonth)}</Text>
        <Pressable
          onPress={() => setYearMonth(shiftYearMonth(yearMonth, 1))}
          style={styles.navBtn}
          disabled={isCurrentMonth}
        >
          <Text style={[styles.navLabel, isCurrentMonth && styles.navDisabled]}>▶</Text>
        </Pressable>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Avances données ce mois (commerce → Wave/OM)</Text>
        <Line label="Dû par Wave" value={advances.wave} color={colors.wave} />
        <Line label="Dû par Orange Money" value={advances.om} color={colors.om} />
        <View style={styles.divider} />
        <Line label="Total dû ce mois" value={totalMonth} bold />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Ventes du mois (pour information)</Text>
        <Line label="Espèces" value={sales.especes} />
        <Line label="Wave" value={sales.wave} />
        <Line label="Orange Money" value={sales.om} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Cumul depuis le début</Text>
        <Line label="Dû par Wave (total)" value={allTime.wave} color={colors.wave} />
        <Line label="Dû par Orange Money (total)" value={allTime.om} color={colors.om} />
        <View style={styles.divider} />
        <Line label="Total dû (tout confondu)" value={totalAllTime} bold />
      </Card>

      <Text style={styles.hint}>
        Ces montants correspondent aux avances enregistrées dans l'écran Caisse (argent sorti du
        commerce pour créditer un client en Wave ou Orange Money) et représentent ce que ces
        comptes doivent en retour au commerce.
      </Text>
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

function Line({
  label,
  value,
  bold,
  color,
}: {
  label: string;
  value: number;
  bold?: boolean;
  color?: string;
}) {
  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, bold && styles.lineLabelBold]}>{label}</Text>
      <Text style={[styles.lineValue, bold && styles.lineValueBold, color ? { color } : null]}>
        {formatFCFA(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  navBtn: { padding: spacing.sm },
  navLabel: { fontSize: fontSize.lg, color: colors.primary, fontWeight: '700' },
  navDisabled: { color: colors.border },
  monthLabel: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, minWidth: 160, textAlign: 'center' },
  sectionTitle: { fontWeight: '700', color: colors.textMuted, marginBottom: spacing.sm, fontSize: fontSize.sm },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  lineLabel: { color: colors.text },
  lineLabelBold: { fontWeight: '700' },
  lineValue: { color: colors.text, fontWeight: '600' },
  lineValueBold: { fontWeight: '800', fontSize: fontSize.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  hint: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.sm },
});
