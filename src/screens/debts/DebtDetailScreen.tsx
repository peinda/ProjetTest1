import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { DebtsStackParamList } from '../../navigation/types';
import { getDebt, listDebtPayments, recordPayment, deleteDebt } from '../../db/debts';
import { Debt, DebtPayment } from '../../db/types';
import { colors, spacing, fontSize } from '../../theme/theme';
import { formatFCFA } from '../../utils/format';
import { formatDateFr, formatDateTimeFr } from '../../utils/date';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Field from '../../components/Field';
import { parseAmount } from '../../utils/validation';

type R = RouteProp<DebtsStackParamList, 'DebtDetail'>;

export default function DebtDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<R>();
  const { debtId } = route.params;

  const [debt, setDebt] = useState<Debt | null>(null);
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setDebt(await getDebt(debtId));
    setPayments(await listDebtPayments(debtId));
  }, [debtId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!debt) return null;

  const onPay = async (full: boolean) => {
    const amount = full ? debt.remaining_amount : parseAmount(paymentAmount);
    if (amount === null) {
      Alert.alert('Montant invalide', 'Saisissez un montant supérieur à 0.');
      return;
    }
    if (amount > debt.remaining_amount) {
      Alert.alert('Montant trop élevé', `Le solde restant est de ${formatFCFA(debt.remaining_amount)}.`);
      return;
    }
    setSaving(true);
    try {
      await recordPayment(debtId, amount);
      setPaymentAmount('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Supprimer la dette', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteDebt(debtId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      <Card>
        <Text style={styles.client}>{debt.client_name}</Text>
        {!!debt.client_phone && <Text style={styles.meta}>{debt.client_phone}</Text>}
        {!!debt.product && <Text style={styles.meta}>Produit : {debt.product}</Text>}
        <Text style={styles.meta}>Date de la dette : {formatDateFr(debt.debt_date)}</Text>
        {!!debt.note && <Text style={styles.meta}>{debt.note}</Text>}
        <View style={styles.divider} />
        <Text style={styles.amountLabel}>Montant initial</Text>
        <Text style={styles.amountValue}>{formatFCFA(debt.amount)}</Text>
        <Text style={styles.amountLabel}>Restant dû</Text>
        <Text style={[styles.amountValue, { color: colors.danger }]}>{formatFCFA(debt.remaining_amount)}</Text>
        <Text style={styles.status}>{debt.status === 'solde' ? '✅ Soldée' : 'En cours'}</Text>
      </Card>

      {debt.status === 'en_cours' && (
        <Card>
          <Text style={styles.sectionTitle}>Enregistrer un remboursement</Text>
          <Field
            label="Montant remboursé (FCFA)"
            value={paymentAmount}
            onChangeText={setPaymentAmount}
            keyboardType="numeric"
          />
          <Button label="Remboursement partiel" variant="outline" onPress={() => onPay(false)} disabled={saving} />
          <View style={{ height: spacing.sm }} />
          <Button label="Solder entièrement" onPress={() => onPay(true)} disabled={saving} />
        </Card>
      )}

      {payments.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Historique des remboursements</Text>
          {payments.map((p) => (
            <View key={p.id} style={styles.paymentRow}>
              <Text style={styles.paymentDate}>{formatDateTimeFr(p.created_at)}</Text>
              <Text style={styles.paymentAmount}>{formatFCFA(p.amount)}</Text>
            </View>
          ))}
        </Card>
      )}

      <Button label="Supprimer cette dette" variant="danger" onPress={onDelete} style={{ marginTop: spacing.md }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  client: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  meta: { color: colors.textMuted, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  amountLabel: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.sm },
  amountValue: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  status: { marginTop: spacing.sm, fontWeight: '700', color: colors.primary },
  sectionTitle: { fontWeight: '700', color: colors.textMuted, marginBottom: spacing.sm },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  paymentDate: { color: colors.textMuted, fontSize: fontSize.sm },
  paymentAmount: { fontWeight: '700', color: colors.text },
});
