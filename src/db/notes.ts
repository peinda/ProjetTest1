import { getDb } from './database';
import { Note, NoteImage } from './types';

export interface NewNote {
  title: string;
  content?: string | null;
}

export async function listNotes(): Promise<Note[]> {
  const db = await getDb();
  return db.getAllAsync<Note>('SELECT * FROM notes ORDER BY updated_at DESC');
}

export async function getNote(id: number): Promise<Note | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Note>('SELECT * FROM notes WHERE id = ?', id);
  return row ?? null;
}

export async function createNote(input: NewNote): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO notes (title, content) VALUES (?, ?)',
    input.title,
    input.content ?? null
  );
  return result.lastInsertRowId;
}

export async function updateNote(id: number, input: NewNote): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE notes SET title = ?, content = ?, updated_at = datetime('now') WHERE id = ?`,
    input.title,
    input.content ?? null,
    id
  );
}

export async function deleteNote(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM notes WHERE id = ?', id);
}

export async function listNoteImages(noteId: number): Promise<NoteImage[]> {
  const db = await getDb();
  return db.getAllAsync<NoteImage>(
    'SELECT * FROM note_images WHERE note_id = ? ORDER BY created_at ASC',
    noteId
  );
}

export async function addNoteImage(noteId: number, imageUri: string): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO note_images (note_id, image_uri) VALUES (?, ?)',
    noteId,
    imageUri
  );
  return result.lastInsertRowId;
}

export async function deleteNoteImage(imageId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM note_images WHERE id = ?', imageId);
}

export async function getFirstImageByNote(): Promise<Record<number, string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ note_id: number; image_uri: string }>(
    `SELECT note_id, image_uri FROM note_images
     WHERE id IN (SELECT MIN(id) FROM note_images GROUP BY note_id)`
  );
  const map: Record<number, string> = {};
  for (const r of rows) map[r.note_id] = r.image_uri;
  return map;
}
