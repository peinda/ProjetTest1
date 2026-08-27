import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createAdvance, getAdvanceById, updateAdvance } from '../../db/cash';
import { AdvanceTarget } from '../../db/types';
import { CashStackParamList } from '../../navigation/types';
import { colors, spacing, radius, fontSize } from '../../theme/theme';
import Field from '../../components/Field';
import Button from '../../components/Button';
import { parseAmount, MAX_LENGTHS } from '../../utils/validation';
import { showAlert } from '../../utils/alert';

type Nav = NativeStackNavigationProp<CashStackParamList, 'AddAdvance'>;
type Route = RouteProp<CashStackParamList, 'AddAdvance'>;

export default function AddAdvanceScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const advanceId = route.params?.advanceId;
  const isEditing = advanceId != null;

  const [target, setTarget] = useState<AdvanceTarget>('wave');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Modifier l’avance' : 'Nouvelle avance' });
  }, [navigation, isEditing]);

  useEffect(() => {
    if (advanceId == null) return;
    getAdvanceById(advanceId).then((advance) => {
      if (!advance) return;
      setTarget(advance.target);
      setAmount(String(advance.amount));
      setNote(advance.note ?? '');
    });
  }, [advanceId]);

  const onSave = async () => {
    const amountNum = parseAmount(amount);
    if (amountNum === null) {
      showAlert('Montant invalide', 'Saisissez un montant supérieur à 0.');
      return;
    }
    setSaving(true);
    try {
      if (advanceId != null) {
        await updateAdvance(advanceId, { target, amount: amountNum, note: note.trim() || null });
      } else {
        await createAdvance({ target, amount: amountNum, note: note.trim() || null });
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        label="← Retour à la caisse"
        variant="outline"
        onPress={() => navigation.goBack()}
        style={{ marginBottom: spacing.md }}
      />
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

      <Button
        label={saving ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : 'Enregistrer l’avance'}
        onPress={onSave}
        disabled={saving}
      />
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
