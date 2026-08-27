import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { CashStackParamList } from '../../navigation/types';
import { computeDailySheet, getClosure, saveClosure, DailyCashSheet } from '../../db/cash';
import { colors, spacing, fontSize, radius } from '../../theme/theme';
import { formatFCFA } from '../../utils/format';
import { formatDateFr } from '../../utils/date';
import Field from '../../components/Field';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { exportClosureToPdf } from '../../utils/pdf';
import { parseAmount, MAX_LENGTHS } from '../../utils/validation';
import { showAlert } from '../../utils/alert';

type R = RouteProp<CashStackParamList, 'Closure'>;

export default function ClosureScreen() {
  const navigation = useNavigation();
  const route = useRoute<R>();
  const { date } = route.params;

  const [sheet, setSheet] = useState<DailyCashSheet | null>(null);
  const [countedCommerce, setCountedCommerce] = useState('');
  const [countedWave, setCountedWave] = useState('');
  const [countedOm, setCountedOm] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await computeDailySheet(date);
      setSheet(s);
      const existing = await getClosure(date);
      if (existing) {
        setCountedCommerce(existing.counted_commerce != null ? String(existing.counted_commerce) : '');
        setCountedWave(existing.counted_wave != null ? String(existing.counted_wave) : '');
        setCountedOm(existing.counted_om != null ? String(existing.counted_om) : '');
        setNote(existing.note ?? '');
      } else {
        setCountedCommerce(String(Math.round(s.theoretical_commerce)));
        setCountedWave(String(Math.round(s.theoretical_wave)));
        setCountedOm(String(Math.round(s.theoretical_om)));
      }
    })();
  }, [date]);

  if (!sheet) return null;

  const cCommerce = parseFloat(countedCommerce) || 0;
  const cWave = parseFloat(countedWave) || 0;
  const cOm = parseFloat(countedOm) || 0;
  const diffCommerce = cCommerce - sheet.theoretical_commerce;
  const diffWave = cWave - sheet.theoretical_wave;
  const diffOm = cOm - sheet.theoretical_om;

  function validateCounted(): { commerce: number; wave: number; om: number } | null {
    const commerce = parseAmount(countedCommerce, { allowZero: true });
    const wave = parseAmount(countedWave, { allowZero: true });
    const om = parseAmount(countedOm, { allowZero: true });
    if (commerce === null || wave === null || om === null) {
      showAlert('Montant invalide', 'Les montants comptés doivent être des nombres valides (0 ou plus).');
      return null;
    }
    return { commerce, wave, om };
  }

  const onSave = async () => {
    const counted = validateCounted();
    if (!counted) return;
    setSaving(true);
    try {
      await saveClosure(sheet, counted, note.trim() || undefined);
      showAlert('Clôture enregistrée', 'La journée a été clôturée avec succès.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const onExportPdf = async () => {
    const counted = validateCounted();
    if (!counted) return;
    await exportClosureToPdf(sheet, counted, note.trim() || undefined);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      <Button
        label="← Retour à la caisse"
        variant="outline"
        onPress={() => navigation.goBack()}
        style={{ marginBottom: spacing.md }}
      />
      <Text style={styles.title}>Clôture du {formatDateFr(date)}</Text>

      <Card>
        <Text style={styles.sectionTitle}>Montants théoriques (calculés)</Text>
        <Row label="Commerce" value={sheet.theoretical_commerce} />
        <Row label="Wave" value={sheet.theoretical_wave} />
        <Row label="Orange Money" value={sheet.theoretical_om} />
      </Card>

      <Text style={styles.sectionTitle}>Montants réels comptés</Text>
      <Field label="Commerce (FCFA)" value={countedCommerce} onChangeText={setCountedCommerce} keyboardType="numeric" />
      <Field label="Wave (FCFA)" value={countedWave} onChangeText={setCountedWave} keyboardType="numeric" />
      <Field label="Orange Money (FCFA)" value={countedOm} onChangeText={setCountedOm} keyboardType="numeric" />

      <Card>
        <Text style={styles.sectionTitle}>Écarts</Text>
        <DiffRow label="Commerce" value={diffCommerce} />
        <DiffRow label="Wave" value={diffWave} />
        <DiffRow label="Orange Money" value={diffOm} />
      </Card>

      <Field
        label="Note (optionnel)"
        value={note}
        onChangeText={setNote}
        placeholder="Remarque sur la journée"
        maxLength={MAX_LENGTHS.note}
      />

      <Button label={saving ? 'Enregistrement...' : 'Valider la clôture'} onPress={onSave} disabled={saving} />
      <View style={{ height: spacing.sm }} />
      <Button label="Exporter en PDF" variant="outline" onPress={onExportPdf} />
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{formatFCFA(value)}</Text>
    </View>
  );
}

function DiffRow({ label, value }: { label: string; value: number }) {
  const ok = Math.abs(value) < 1;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, { color: ok ? colors.success : colors.danger }]}>
        {ok ? 'OK' : `${value > 0 ? '+' : ''}${formatFCFA(value)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  sectionTitle: { fontWeight: '700', color: colors.textMuted, marginBottom: spacing.sm, fontSize: fontSize.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { color: colors.text },
  rowValue: { color: colors.text, fontWeight: '700' },
});
