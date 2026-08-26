import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CashStackParamList } from '../../navigation/types';
import { computeDailySheet, listAdvancesByDate, deleteAdvance, DailyCashSheet } from '../../db/cash';
import { CashAdvance } from '../../db/types';
import { colors, spacing, fontSize } from '../../theme/theme';
import { formatFCFA } from '../../utils/format';
import { todayStr, formatDateFr, formatDateTimeFr } from '../../utils/date';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { showAlert } from '../../utils/alert';

type Nav = NativeStackNavigationProp<CashStackParamList, 'CashHome'>;

export default function CashHomeScreen() {
  const navigation = useNavigation<Nav>();
  const [sheet, setSheet] = useState<DailyCashSheet | null>(null);
  const [advances, setAdvances] = useState<CashAdvance[]>([]);
  const date = todayStr();

  const load = useCallback(async () => {
    setSheet(await computeDailySheet(date));
    setAdvances(await listAdvancesByDate(date));
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onDeleteAdvance = (advance: CashAdvance) => {
    showAlert(
      'Supprimer l’avance',
      `Supprimer l’avance de ${formatFCFA(advance.amount)} vers ${advance.target === 'wave' ? 'Wave' : 'Orange Money'} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteAdvance(advance.id);
            load();
          },
        },
      ]
    );
  };

  if (!sheet) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      <Text style={styles.dateLabel}>Caisse du {formatDateFr(date)}</Text>

      <Card>
        <Text style={styles.sectionTitle}>Ventes du jour</Text>
        <Line label="Espèces" value={sheet.sales_especes} />
        <Line label="Wave" value={sheet.sales_wave} />
        <Line label="Orange Money" value={sheet.sales_om} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Avances données (commerce → Wave/OM)</Text>
        <Line label="Vers Wave" value={sheet.advances_wave} />
        <Line label="Vers Orange Money" value={sheet.advances_om} />
        <View style={{ height: spacing.sm }} />
        <Button label="+ Enregistrer une avance" variant="outline" onPress={() => navigation.navigate('AddAdvance')} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Répartition théorique</Text>
        <Line label="Part Commerce" value={sheet.theoretical_commerce} bold color={colors.especes} />
        <Line label="Part Wave" value={sheet.theoretical_wave} bold color={colors.wave} />
        <Line label="Part Orange Money" value={sheet.theoretical_om} bold color={colors.om} />
      </Card>

      {advances.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Détail des avances du jour</Text>
          {advances.map((a) => (
            <View key={a.id} style={styles.advanceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.advanceTarget}>{a.target === 'wave' ? 'Wave' : 'Orange Money'}</Text>
                <Text style={styles.advanceAmount}>{formatFCFA(a.amount)}</Text>
              </View>
              <View style={styles.advanceActions}>
                <Button
                  label="Modifier"
                  variant="outline"
                  onPress={() => navigation.navigate('AddAdvance', { advanceId: a.id })}
                  style={styles.advanceActionBtn}
                />
                <Button
                  label="Supprimer"
                  variant="danger"
                  onPress={() => onDeleteAdvance(a)}
                  style={styles.advanceActionBtn}
                />
              </View>
            </View>
          ))}
        </Card>
      )}

      <Button
        label="Clôturer la journée"
        onPress={() => navigation.navigate('Closure', { date })}
        style={{ marginTop: spacing.md }}
      />
      <Button
        label="Historique des clôtures"
        variant="outline"
        onPress={() => navigation.navigate('ClosureHistory')}
        style={{ marginTop: spacing.md }}
      />
      <Button
        label="Bilan mensuel (Wave / Orange Money)"
        variant="outline"
        onPress={() => navigation.navigate('MonthlyBalance')}
        style={{ marginTop: spacing.md, marginBottom: spacing.xl }}
      />
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
  dateLabel: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  sectionTitle: { fontWeight: '700', color: colors.textMuted, marginBottom: spacing.sm, fontSize: fontSize.sm },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  lineLabel: { color: colors.text },
  lineLabelBold: { fontWeight: '700' },
  lineValue: { color: colors.text, fontWeight: '600' },
  lineValueBold: { fontWeight: '800', fontSize: fontSize.md },
  advanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  advanceTarget: { color: colors.text },
  advanceAmount: { color: colors.text, fontWeight: '600' },
  advanceActions: { flexDirection: 'row', gap: spacing.xs },
  advanceActionBtn: { minHeight: 0, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
});
