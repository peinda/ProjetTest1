import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StockStackParamList } from '../../navigation/types';
import { createProduct, getProduct, updateProduct, addStock, deleteProduct } from '../../db/products';
import { colors, spacing, fontSize } from '../../theme/theme';
import Field from '../../components/Field';
import Button from '../../components/Button';

type Nav = NativeStackNavigationProp<StockStackParamList, 'ProductForm'>;
type R = RouteProp<StockStackParamList, 'ProductForm'>;

export default function ProductFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const productId = route.params?.productId;
  const isEdit = !!productId;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [threshold, setThreshold] = useState('3');
  const [restockAmount, setRestockAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (productId) {
      getProduct(productId).then((p) => {
        if (!p) return;
        setName(p.name);
        setCategory(p.category ?? '');
        setPurchasePrice(String(p.purchase_price));
        setSalePrice(String(p.sale_price));
        setQuantity(String(p.quantity));
        setThreshold(String(p.low_stock_threshold));
      });
    }
    navigation.setOptions({ title: productId ? 'Modifier le produit' : 'Nouveau produit' });
  }, [productId]);

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nom requis', 'Veuillez saisir le nom du produit.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category: category.trim() || null,
        purchase_price: parseFloat(purchasePrice) || 0,
        sale_price: parseFloat(salePrice) || 0,
        quantity: parseInt(quantity, 10) || 0,
        low_stock_threshold: parseInt(threshold, 10) || 3,
      };
      if (isEdit && productId) {
        await updateProduct(productId, payload);
      } else {
        await createProduct(payload);
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const onRestock = async () => {
    const amount = parseInt(restockAmount, 10);
    if (!productId || !amount) return;
    await addStock(productId, amount, 'Réapprovisionnement');
    setRestockAmount('');
    const p = await getProduct(productId);
    if (p) setQuantity(String(p.quantity));
    Alert.alert('Stock mis à jour', `+${amount} ajouté au stock.`);
  };

  const onDelete = () => {
    if (!productId) return;
    Alert.alert('Supprimer', 'Supprimer définitivement ce produit ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteProduct(productId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      <Field label="Nom du produit" value={name} onChangeText={setName} placeholder="Ex: Robe wax" />
      <Field label="Catégorie (optionnel)" value={category} onChangeText={setCategory} placeholder="Ex: Robes" />
      <Field
        label="Prix d'achat (FCFA)"
        value={purchasePrice}
        onChangeText={setPurchasePrice}
        keyboardType="numeric"
        placeholder="0"
      />
      <Field
        label="Prix de vente (FCFA)"
        value={salePrice}
        onChangeText={setSalePrice}
        keyboardType="numeric"
        placeholder="0"
      />
      {!isEdit && (
        <Field
          label="Quantité initiale"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          placeholder="0"
        />
      )}
      <Field
        label="Seuil de stock faible"
        value={threshold}
        onChangeText={setThreshold}
        keyboardType="numeric"
        placeholder="3"
      />
      <Button label={saving ? 'Enregistrement...' : 'Enregistrer'} onPress={onSave} disabled={saving} />

      {isEdit && (
        <View style={styles.restockBlock}>
          <Text style={styles.sectionTitle}>Réapprovisionner (stock actuel : {quantity})</Text>
          <Field
            label="Quantité à ajouter"
            value={restockAmount}
            onChangeText={setRestockAmount}
            keyboardType="numeric"
            placeholder="Ex: 10"
          />
          <Button label="Ajouter au stock" variant="secondary" onPress={onRestock} />
          <View style={{ height: spacing.lg }} />
          <Button label="Supprimer ce produit" variant="danger" onPress={onDelete} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  restockBlock: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
});
