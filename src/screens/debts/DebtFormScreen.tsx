import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createDebt } from '../../db/debts';
import { colors, spacing } from '../../theme/theme';
import Field from '../../components/Field';
import Button from '../../components/Button';
import { parseAmount, isNonEmpty, isValidPhone, MAX_LENGTHS } from '../../utils/validation';

export default function DebtFormScreen() {
  const navigation = useNavigation();
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [product, setProduct] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!isNonEmpty(clientName)) {
      Alert.alert('Nom requis', 'Veuillez saisir le nom du client.');
      return;
    }
    if (!isValidPhone(phone)) {
      Alert.alert('Téléphone invalide', 'Saisissez un numéro valide ou laissez le champ vide.');
      return;
    }
    const amountNum = parseAmount(amount);
    if (amountNum === null) {
      Alert.alert('Montant invalide', 'Saisissez un montant supérieur à 0.');
      return;
    }
    setSaving(true);
    try {
      await createDebt({
        client_name: clientName.trim(),
        client_phone: phone.trim() || null,
        amount: amountNum,
        product: product.trim() || null,
        note: note.trim() || null,
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
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
      <Button label={saving ? 'Enregistrement...' : 'Enregistrer la dette'} onPress={onSave} disabled={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
