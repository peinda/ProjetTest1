import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Image, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StockStackParamList } from '../../navigation/types';
import { createProduct, getProduct, updateProduct, addStock, deleteProduct } from '../../db/products';
import { colors, spacing, fontSize, radius } from '../../theme/theme';
import Field from '../../components/Field';
import Button from '../../components/Button';
import { parseAmount, parseQuantity, isNonEmpty, MAX_LENGTHS } from '../../utils/validation';
import { showAlert } from '../../utils/alert';
import { pickProductImage } from '../../utils/imagePicker';

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
  const [imageUri, setImageUri] = useState<string | null>(null);
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
        setImageUri(p.image_uri);
      });
    }
    navigation.setOptions({ title: productId ? 'Modifier le produit' : 'Nouveau produit' });
  }, [productId]);

  const onSave = async () => {
    if (!isNonEmpty(name)) {
      showAlert('Nom requis', 'Veuillez saisir le nom du produit.');
      return;
    }
    const purchase = parseAmount(purchasePrice || '0', { allowZero: true });
    if (purchase === null) {
      showAlert('Prix d\'achat invalide', 'Saisissez un montant valide (0 ou plus).');
      return;
    }
    const sale = parseAmount(salePrice || '0', { allowZero: true });
    if (sale === null) {
      showAlert('Prix de vente invalide', 'Saisissez un montant valide (0 ou plus).');
      return;
    }
    const qty = isEdit ? 0 : parseQuantity(quantity || '0', { allowZero: true });
    if (qty === null) {
      showAlert('Quantité invalide', 'Saisissez un nombre entier valide (0 ou plus).');
      return;
    }
    const threshNum = parseQuantity(threshold || '0', { allowZero: true });
    if (threshNum === null) {
      showAlert('Seuil invalide', 'Saisissez un nombre entier valide (0 ou plus).');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category: category.trim() || null,
        purchase_price: purchase,
        sale_price: sale,
        quantity: qty,
        low_stock_threshold: threshNum,
        image_uri: imageUri,
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
    if (!productId) return;
    const amount = parseQuantity(restockAmount);
    if (amount === null) {
      showAlert('Quantité invalide', 'Saisissez un nombre entier supérieur à 0.');
      return;
    }
    await addStock(productId, amount, 'Réapprovisionnement');
    setRestockAmount('');
    const p = await getProduct(productId);
    if (p) setQuantity(String(p.quantity));
    showAlert('Stock mis à jour', `+${amount} ajouté au stock.`);
  };

  const onPickImage = async () => {
    const uri = await pickProductImage();
    if (uri) setImageUri(uri);
  };

  const onDelete = () => {
    if (!productId) return;
    showAlert('Supprimer', 'Supprimer définitivement ce produit ?', [
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
      <Text style={styles.label}>Photo du produit</Text>
      <View style={styles.photoRow}>
        <Pressable onPress={onPickImage} style={styles.photoPreview}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photoImage} resizeMode="cover" />
          ) : (
            <Text style={styles.photoPlaceholder}>📷</Text>
          )}
        </Pressable>
        <View style={{ flex: 1, gap: spacing.sm }}>
          <Button
            label={imageUri ? 'Changer la photo' : 'Choisir une photo'}
            variant="outline"
            onPress={onPickImage}
          />
          {!!imageUri && (
            <Button label="Retirer la photo" variant="outline" onPress={() => setImageUri(null)} />
          )}
        </View>
      </View>

      <Field
        label="Nom du produit"
        value={name}
        onChangeText={setName}
        placeholder="Ex: Robe wax"
        maxLength={MAX_LENGTHS.name}
      />
      <Field
        label="Catégorie (optionnel)"
        value={category}
        onChangeText={setCategory}
        placeholder="Ex: Robes"
        maxLength={MAX_LENGTHS.category}
      />
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
  label: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  photoPreview: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: { width: '100%', height: '100%' },
  photoPlaceholder: { fontSize: 32 },
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
