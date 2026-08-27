import { getDb } from './database';
import { Note } from './types';

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
