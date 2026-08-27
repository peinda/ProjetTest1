import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NotesStackParamList } from '../../navigation/types';
import { listNotes, deleteNote } from '../../db/notes';
import { Note } from '../../db/types';
import { colors, spacing, fontSize } from '../../theme/theme';
import { formatDateTimeFr } from '../../utils/date';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { showAlert } from '../../utils/alert';

type Nav = NativeStackNavigationProp<NotesStackParamList, 'NotesList'>;

export default function NotesListScreen() {
  const navigation = useNavigation<Nav>();
  const [notes, setNotes] = useState<Note[]>([]);

  const load = useCallback(async () => {
    setNotes(await listNotes());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onDelete = (note: Note) => {
    showAlert('Supprimer la note', `Supprimer "${note.title}" ? Cette action est irréversible.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteNote(note.id);
          load();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Aucune note. Ajoutez votre première note.</Text>}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.title}>{item.title}</Text>
            {!!item.content && (
              <Text style={styles.content} numberOfLines={3}>
                {item.content}
              </Text>
            )}
            <Text style={styles.date}>{formatDateTimeFr(item.updated_at)}</Text>
            <View style={styles.actions}>
              <Button
                label="Modifier"
                variant="outline"
                onPress={() => navigation.navigate('NoteForm', { noteId: item.id })}
                style={styles.actionBtn}
              />
              <Button label="Supprimer" variant="danger" onPress={() => onDelete(item)} style={styles.actionBtn} />
            </View>
          </Card>
        )}
      />
      <View style={styles.footer}>
        <Button label="+ Nouvelle note" onPress={() => navigation.navigate('NoteForm')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: 100 },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.textMuted },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  content: { color: colors.text, marginTop: spacing.xs },
  date: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: { flex: 1, minHeight: 0, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
});
