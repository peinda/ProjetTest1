import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { listStockEntries } from '../../db/products';
import { StockEntry } from '../../db/types';
import { colors, spacing, fontSize } from '../../theme/theme';
import { formatDateTimeFr } from '../../utils/date';
import Card from '../../components/Card';

export default function StockHistoryScreen() {
  const [entries, setEntries] = useState<StockEntry[]>([]);

  useEffect(() => {
    listStockEntries().then(setEntries);
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={<Text style={styles.empty}>Aucune entrée de stock.</Text>}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.qty}>+{item.quantity}</Text>
            {!!item.note && <Text style={styles.note}>{item.note}</Text>}
            <Text style={styles.date}>{formatDateTimeFr(item.created_at)}</Text>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.textMuted },
  qty: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary },
  note: { color: colors.text, marginTop: 4 },
  date: { color: colors.textMuted, marginTop: 4, fontSize: fontSize.sm },
});
