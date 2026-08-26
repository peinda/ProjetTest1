import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createAdvance } from '../../db/cash';
import { AdvanceTarget } from '../../db/types';
import { colors, spacing, radius, fontSize } from '../../theme/theme';
import Field from '../../components/Field';
import Button from '../../components/Button';
import { parseAmount, MAX_LENGTHS } from '../../utils/validation';
import { showAlert } from '../../utils/alert';

export default function AddAdvanceScreen() {
  const navigation = useNavigation();
  const [target, setTarget] = useState<AdvanceTarget>('wave');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const amountNum = parseAmount(amount);
    if (amountNum === null) {
      showAlert('Montant invalide', 'Saisissez un montant supérieur à 0.');
      return;
    }
    setSaving(true);
    try {
      await createAdvance({ target, amount: amountNum, note: note.trim() || null });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Compte crédité</Text>
      <View style={styles.targetRow}>
        {(['wave', 'om'] as AdvanceTarget[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTarget(t)}
            style={[styles.targetBtn, target === t && styles.targetBtnActive]}
          >
            <Text style={[styles.targetLabel, target === t && styles.targetLabelActive]}>
              {t === 'wave' ? 'Wave' : 'Orange Money'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Field
        label="Montant sorti du commerce (FCFA)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="Ex: 5000"
      />
      <Field
        label="Note (optionnel)"
        value={note}
        onChangeText={setNote}
        placeholder="Ex: Crédit pour un client"
        maxLength={MAX_LENGTHS.note}
      />

      <Text style={styles.hint}>
        Cette somme sera considérée comme due au commerce par le compte {target === 'wave' ? 'Wave' : 'Orange Money'}.
      </Text>

      <Button label={saving ? 'Enregistrement...' : 'Enregistrer l’avance'} onPress={onSave} disabled={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  label: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600', marginBottom: spacing.sm },
  targetRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  targetBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  targetBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  targetLabel: { fontWeight: '700', color: colors.text },
  targetLabelActive: { color: '#FFFFFF' },
  hint: { color: colors.textMuted, marginBottom: spacing.lg, fontSize: fontSize.sm },
});
