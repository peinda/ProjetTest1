import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, Image, Pressable, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createNote, getNote, updateNote, listNoteImages, addNoteImage, deleteNoteImage } from '../../db/notes';
import { NotesStackParamList } from '../../navigation/types';
import { colors, spacing, radius, fontSize } from '../../theme/theme';
import Field from '../../components/Field';
import Button from '../../components/Button';
import { isNonEmpty, MAX_LENGTHS } from '../../utils/validation';
import { showAlert } from '../../utils/alert';
import { pickImage } from '../../utils/imagePicker';

type Nav = NativeStackNavigationProp<NotesStackParamList, 'NoteForm'>;
type Route = RouteProp<NotesStackParamList, 'NoteForm'>;

interface Photo {
  id: number | null;
  uri: string;
}

export default function NoteFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const noteId = route.params?.noteId;
  const isEditing = noteId != null;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
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
    listNoteImages(noteId).then((images) => {
      setPhotos(images.map((img) => ({ id: img.id, uri: img.image_uri })));
    });
  }, [noteId]);

  const onAddPhoto = async () => {
    const uri = await pickImage();
    if (!uri) return;
    if (noteId != null) {
      const id = await addNoteImage(noteId, uri);
      setPhotos((prev) => [...prev, { id, uri }]);
    } else {
      setPhotos((prev) => [...prev, { id: null, uri }]);
    }
  };

  const onRemovePhoto = (photo: Photo) => {
    const remove = async () => {
      if (photo.id != null) await deleteNoteImage(photo.id);
      setPhotos((prev) => prev.filter((p) => p !== photo));
    };
    if (photo.id == null) {
      remove();
      return;
    }
    showAlert('Retirer la photo', 'Retirer cette photo de la note ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Retirer', style: 'destructive', onPress: remove },
    ]);
  };

  const onSave = async () => {
    if (!isNonEmpty(title)) {
      showAlert('Titre requis', 'Veuillez saisir un titre pour la note.');
      return;
    }
    setSaving(true);
    try {
      const payload = { title: title.trim(), content: content.trim() || null };
      let id = noteId;
      if (id != null) {
        await updateNote(id, payload);
      } else {
        id = await createNote(payload);
        for (const photo of photos) {
          if (photo.id == null) await addNoteImage(id, photo.uri);
        }
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

      <Text style={styles.label}>Photos (optionnel)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
        {photos.map((photo, i) => (
          <View key={photo.id ?? `new-${i}`} style={styles.photoTile}>
            <Image source={{ uri: photo.uri }} style={styles.photoImage} resizeMode="cover" />
            <Pressable onPress={() => onRemovePhoto(photo)} style={styles.removeBadge}>
              <Text style={styles.removeBadgeText}>✕</Text>
            </Pressable>
          </View>
        ))}
        <Pressable onPress={onAddPhoto} style={styles.addTile}>
          <Text style={styles.addTileIcon}>📷</Text>
          <Text style={styles.addTileLabel}>Ajouter</Text>
        </Pressable>
      </ScrollView>

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
  label: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.xs, fontWeight: '600' },
  photoScroll: { marginBottom: spacing.md },
  photoTile: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    marginRight: spacing.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoImage: { width: '100%', height: '100%' },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  addTile: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  addTileIcon: { fontSize: 22 },
  addTileLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  contentInput: { minHeight: 160, textAlignVertical: 'top' },
});
