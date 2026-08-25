export function todayStr(): string {
  return toDateStr(new Date());
}

export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysAgoStr(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toDateStr(date);
}

export function daysSince(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export function formatDateFr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function formatDateTimeFr(isoStr: string): string {
  const date = new Date(isoStr.includes('T') ? isoStr : isoStr.replace(' ', 'T') + 'Z');
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function startOfWeekStr(): string {
  const date = new Date();
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - diff);
  return toDateStr(date);
}

export function startOfMonthStr(): string {
  const date = new Date();
  date.setDate(1);
  return toDateStr(date);
}
