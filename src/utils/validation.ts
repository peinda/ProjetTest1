// Centralized input parsing/validation for all forms. Every numeric field in
// the app touches money or stock quantities, so a bad parse must never fall
// back to a silent default (e.g. `parseFloat(x) || 0`) — it has to be
// rejected and reported to the user instead.

export function parseAmount(input: string, opts?: { allowZero?: boolean }): number | null {
  const trimmed = input.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  if (n === 0) return opts?.allowZero ? 0 : null;
  if (n < 0) return null;
  if (n > 100_000_000) return null;
  return n;
}

export function parseQuantity(input: string, opts?: { allowZero?: boolean }): number | null {
  const trimmed = input.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (n === 0) return opts?.allowZero ? 0 : null;
  if (n > 1_000_000) return null;
  return n;
}

export function isNonEmpty(input: string): boolean {
  return input.trim().length > 0;
}

export function isValidPhone(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return true; // optional field
  return /^[0-9+\-\s]{6,20}$/.test(trimmed);
}

export const MAX_LENGTHS = {
  name: 60,
  category: 40,
  note: 200,
  phone: 20,
} as const;
