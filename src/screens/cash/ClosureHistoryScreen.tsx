import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { listClosures } from '../../db/cash';
import { CashClosure } from '../../db/types';
import { colors, spacing, fontSize } from '../../theme/theme';
import { formatFCFA } from '../../utils/format';
import { formatDateFr } from '../../utils/date';
import Card from '../../components/Card';

export default function ClosureHistoryScreen() {
  const [closures, setClosures] = useState<CashClosure[]>([]);

  useEffect(() => {
    listClosures().then(setClosures);
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={closures}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={<Text style={styles.empty}>Aucune clôture enregistrée.</Text>}
        renderItem={({ item }) => {
          const diffCommerce = (item.counted_commerce ?? 0) - item.theoretical_commerce;
          const diffWave = (item.counted_wave ?? 0) - item.theoretical_wave;
          const diffOm = (item.counted_om ?? 0) - item.theoretical_om;
          const hasGap = Math.abs(diffCommerce) >= 1 || Math.abs(diffWave) >= 1 || Math.abs(diffOm) >= 1;
          return (
            <Card>
              <View style={styles.headerRow}>
                <Text style={styles.date}>{formatDateFr(item.closure_date)}</Text>
                {hasGap && <Text style={styles.gapBadge}>Écart détecté</Text>}
              </View>
              <Text style={styles.line}>Commerce : {formatFCFA(item.counted_commerce ?? 0)}</Text>
              <Text style={styles.line}>Wave : {formatFCFA(item.counted_wave ?? 0)}</Text>
              <Text style={styles.line}>Orange Money : {formatFCFA(item.counted_om ?? 0)}</Text>
              {!!item.note && <Text style={styles.note}>{item.note}</Text>}
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  date: { fontWeight: '800', fontSize: fontSize.md, color: colors.text },
  gapBadge: { color: colors.danger, fontWeight: '700', fontSize: fontSize.sm },
  line: { color: colors.text, marginTop: 2 },
  note: { color: colors.textMuted, marginTop: spacing.xs, fontStyle: 'italic' },
});
