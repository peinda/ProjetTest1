export function formatFCFA(amount: number): string {
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString('fr-FR')} F`;
}

export const PAYMENT_LABELS: Record<string, string> = {
  especes: 'Espèces',
  wave: 'Wave',
  om: 'Orange Money',
};
