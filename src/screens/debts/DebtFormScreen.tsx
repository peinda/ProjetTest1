import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createDebt, getDebt, updateDebt } from '../../db/debts';
import { DebtsStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme/theme';
import Field from '../../components/Field';
import Button from '../../components/Button';
import { parseAmount, isNonEmpty, isValidPhone, MAX_LENGTHS } from '../../utils/validation';
import { showAlert } from '../../utils/alert';

type Nav = NativeStackNavigationProp<DebtsStackParamList, 'DebtForm'>;
type Route = RouteProp<DebtsStackParamList, 'DebtForm'>;

export default function DebtFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const debtId = route.params?.debtId;
  const isEditing = debtId != null;

  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [product, setProduct] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Modifier la dette' : 'Nouvelle dette' });
  }, [navigation, isEditing]);

  useEffect(() => {
    if (debtId == null) return;
    getDebt(debtId).then((debt) => {
      if (!debt) return;
      setClientName(debt.client_name);
      setPhone(debt.client_phone ?? '');
      setAmount(String(debt.amount));
      setProduct(debt.product ?? '');
      setNote(debt.note ?? '');
    });
  }, [debtId]);

  const onSave = async () => {
    if (!isNonEmpty(clientName)) {
      showAlert('Nom requis', 'Veuillez saisir le nom du client.');
      return;
    }
    if (!isValidPhone(phone)) {
      showAlert('Téléphone invalide', 'Saisissez un numéro valide ou laissez le champ vide.');
      return;
    }
    const amountNum = parseAmount(amount);
    if (amountNum === null) {
      showAlert('Montant invalide', 'Saisissez un montant supérieur à 0.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        client_name: clientName.trim(),
        client_phone: phone.trim() || null,
        amount: amountNum,
        product: product.trim() || null,
        note: note.trim() || null,
      };
      if (debtId != null) {
        await updateDebt(debtId, payload);
      } else {
        await createDebt(payload);
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      <Button
        label="← Retour"
        variant="outline"
        onPress={() => navigation.goBack()}
        style={{ marginBottom: spacing.md }}
      />
      <Field
        label="Nom du client"
        value={clientName}
        onChangeText={setClientName}
        placeholder="Ex: Fatou Diop"
        maxLength={MAX_LENGTHS.name}
      />
      <Field
        label="Téléphone (optionnel)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="Ex: 77 000 00 00"
        maxLength={MAX_LENGTHS.phone}
      />
      <Field
        label="Montant dû (FCFA)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="0"
      />
      <Field
        label="Produit concerné (optionnel)"
        value={product}
        onChangeText={setProduct}
        maxLength={MAX_LENGTHS.name}
      />
      <Field label="Note (optionnel)" value={note} onChangeText={setNote} maxLength={MAX_LENGTHS.note} />
      <Button
        label={saving ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : 'Enregistrer la dette'}
        onPress={onSave}
        disabled={saving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
