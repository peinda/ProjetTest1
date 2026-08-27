import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DebtsStackParamList } from '../../navigation/types';
import { listDebts } from '../../db/debts';
import { Debt } from '../../db/types';
import { colors, spacing, fontSize } from '../../theme/theme';
import { formatFCFA } from '../../utils/format';
import { formatDateFr } from '../../utils/date';
import Card from '../../components/Card';
import Button from '../../components/Button';

type Nav = NativeStackNavigationProp<DebtsStackParamList, 'DebtsHistory'>;

export default function DebtsHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const [debts, setDebts] = useState<Debt[]>([]);

  useFocusEffect(
    useCallback(() => {
      listDebts('solde').then(setDebts);
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.backRow}>
        <Button label="← Retour aux dettes" variant="outline" onPress={() => navigation.goBack()} />
      </View>
      <FlatList
        data={debts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={<Text style={styles.empty}>Aucune dette soldée pour l'instant.</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('DebtDetail', { debtId: item.id })}>
            <Card>
              <Text style={styles.client}>{item.client_name}</Text>
              <Text style={styles.meta}>
                {formatDateFr(item.debt_date)} — {formatFCFA(item.amount)}
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backRow: { padding: spacing.md, paddingBottom: 0 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  client: { fontWeight: '700', color: colors.text, fontSize: fontSize.md },
  meta: { color: colors.textMuted, marginTop: 4 },
});
