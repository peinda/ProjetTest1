import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { DailyCashSheet } from '../db/cash';
import { formatFCFA } from './format';
import { formatDateFr } from './date';

export async function exportClosureToPdf(
  sheet: DailyCashSheet,
  counted: { commerce: number; wave: number; om: number },
  note?: string
): Promise<void> {
  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; color: #1B1F23; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          h2 { font-size: 15px; color: #6B7280; margin-top: 24px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 6px 0; border-bottom: 1px solid #E2E5EA; }
          td.value { text-align: right; font-weight: 700; }
          .total { font-size: 18px; margin-top: 16px; }
        </style>
      </head>
      <body>
        <h1>Baba Robe & Diverss — Fiche de caisse</h1>
        <p>${formatDateFr(sheet.date)}</p>

        <h2>Ventes du jour</h2>
        <table>
          <tr><td>Espèces</td><td class="value">${formatFCFA(sheet.sales_especes)}</td></tr>
          <tr><td>Wave</td><td class="value">${formatFCFA(sheet.sales_wave)}</td></tr>
          <tr><td>Orange Money</td><td class="value">${formatFCFA(sheet.sales_om)}</td></tr>
        </table>

        <h2>Avances (commerce → Wave / OM)</h2>
        <table>
          <tr><td>Vers Wave</td><td class="value">${formatFCFA(sheet.advances_wave)}</td></tr>
          <tr><td>Vers Orange Money</td><td class="value">${formatFCFA(sheet.advances_om)}</td></tr>
        </table>

        <h2>Répartition théorique</h2>
        <table>
          <tr><td>Commerce</td><td class="value">${formatFCFA(sheet.theoretical_commerce)}</td></tr>
          <tr><td>Wave</td><td class="value">${formatFCFA(sheet.theoretical_wave)}</td></tr>
          <tr><td>Orange Money</td><td class="value">${formatFCFA(sheet.theoretical_om)}</td></tr>
        </table>

        <h2>Montants réels comptés</h2>
        <table>
          <tr><td>Commerce</td><td class="value">${formatFCFA(counted.commerce)}</td></tr>
          <tr><td>Wave</td><td class="value">${formatFCFA(counted.wave)}</td></tr>
          <tr><td>Orange Money</td><td class="value">${formatFCFA(counted.om)}</td></tr>
        </table>

        ${note ? `<h2>Note</h2><p>${note}</p>` : ''}
      </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    // expo-print's web implementation just opens the browser's print dialog
    // (no file/uri is produced), which already lets the user save as PDF.
    await Print.printToFileAsync({ html });
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf' });
  }
}
