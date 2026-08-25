import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DebtsStackParamList } from '../../navigation/types';
import { listDebts, getTotalOutstanding } from '../../db/debts';
import { Debt } from '../../db/types';
import { colors, spacing, fontSize, radius } from '../../theme/theme';
import { formatFCFA } from '../../utils/format';
import { formatDateFr, daysSince } from '../../utils/date';
import Card from '../../components/Card';
import Button from '../../components/Button';

type Nav = NativeStackNavigationProp<DebtsStackParamList, 'DebtsList'>;

export default function DebtsListScreen() {
  const navigation = useNavigation<Nav>();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setDebts(await listDebts('en_cours'));
    setTotal(await getTotalOutstanding());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const sorted = [...debts].sort((a, b) => a.debt_date.localeCompare(b.debt_date));

  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.totalLabel}>Total des dettes en cours</Text>
        <Text style={styles.totalValue}>{formatFCFA(total)}</Text>
      </Card>

      <FlatList
        data={sorted}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.empty}>Aucune dette en cours.</Text>}
        renderItem={({ item }) => {
          const age = daysSince(item.debt_date);
          const old = age >= 15;
          return (
            <Pressable onPress={() => navigation.navigate('DebtDetail', { debtId: item.id })}>
              <Card style={old ? styles.oldCard : undefined}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.client}>{item.client_name}</Text>
                    <Text style={styles.date}>
                      Depuis le {formatDateFr(item.debt_date)} ({age} j)
                    </Text>
                    {!!item.product && <Text style={styles.product}>{item.product}</Text>}
                  </View>
                  <Text style={[styles.amount, old && styles.amountOld]}>
                    {formatFCFA(item.remaining_amount)}
                  </Text>
                </View>
                {old && <Text style={styles.oldBadge}>⚠ Dette ancienne</Text>}
              </Card>
            </Pressable>
          );
        }}
      />

      <View style={styles.footer}>
        <Button label="+ Nouvelle dette" onPress={() => navigation.navigate('DebtForm')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  totalLabel: { color: colors.textMuted, fontWeight: '600' },
  totalValue: { fontSize: fontSize.xl, fontWeight: '800', color: colors.danger, marginTop: 4 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center' },
  client: { fontWeight: '700', color: colors.text, fontSize: fontSize.md },
  date: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  product: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  amount: { fontWeight: '800', color: colors.text, fontSize: fontSize.md },
  amountOld: { color: colors.danger },
  oldCard: { borderWidth: 1, borderColor: colors.danger },
  oldBadge: { color: colors.danger, fontWeight: '700', marginTop: spacing.xs, fontSize: fontSize.sm },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md, backgroundColor: colors.background },
});
