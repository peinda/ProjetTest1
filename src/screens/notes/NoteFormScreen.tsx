import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createNote, getNote, updateNote } from '../../db/notes';
import { NotesStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme/theme';
import Field from '../../components/Field';
import Button from '../../components/Button';
import { isNonEmpty, MAX_LENGTHS } from '../../utils/validation';
import { showAlert } from '../../utils/alert';

type Nav = NativeStackNavigationProp<NotesStackParamList, 'NoteForm'>;
type Route = RouteProp<NotesStackParamList, 'NoteForm'>;

export default function NoteFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const noteId = route.params?.noteId;
  const isEditing = noteId != null;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Modifier la note' : 'Nouvelle note' });
  }, [navigation, isEditing]);

  useEffect(() => {
    if (noteId == null) return;
    getNote(noteId).then((note) => {
      if (!note) return;
      setTitle(note.title);
      setContent(note.content ?? '');
    });
  }, [noteId]);

  const onSave = async () => {
    if (!isNonEmpty(title)) {
      showAlert('Titre requis', 'Veuillez saisir un titre pour la note.');
      return;
    }
    setSaving(true);
    try {
      const payload = { title: title.trim(), content: content.trim() || null };
      if (noteId != null) {
        await updateNote(noteId, payload);
      } else {
        await createNote(payload);
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      <Button
        label="← Retour aux notes"
        variant="outline"
        onPress={() => navigation.goBack()}
        style={{ marginBottom: spacing.md }}
      />
      <Field
        label="Titre"
        value={title}
        onChangeText={setTitle}
        placeholder="Ex: Idées, fournisseur, à faire..."
        maxLength={MAX_LENGTHS.name}
      />
      <Field
        label="Contenu (optionnel)"
        value={content}
        onChangeText={setContent}
        placeholder="Écris ta note ici..."
        multiline
        style={styles.contentInput}
      />
      <Button
        label={saving ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : 'Enregistrer la note'}
        onPress={onSave}
        disabled={saving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  contentInput: { minHeight: 160, textAlignVertical: 'top' },
});
