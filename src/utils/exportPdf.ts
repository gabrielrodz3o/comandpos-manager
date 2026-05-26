import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { logger } from './logger';

export interface PdfSection {
  title: string;
  rows: Array<{ label: string; value: string; positive?: boolean; negative?: boolean }>;
}

interface PdfPayload {
  title: string;
  subtitle?: string;
  businessName?: string;
  locationName?: string;
  dateRange?: string;
  sections: PdfSection[];
  footer?: string;
}

const escape = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const buildHtml = (payload: PdfPayload): string => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escape(payload.title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #0A0A0B;
      margin: 0;
      padding: 32px 40px;
      background: #FFFFFF;
      font-size: 12px;
      line-height: 1.5;
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #10B981;
      padding-bottom: 14px;
      margin-bottom: 24px;
    }
    .brand-name { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .brand-tag  { color: #10B981; font-size: 10px; font-weight: 700; letter-spacing: 3px; }
    .meta { color: #5C5C66; font-size: 11px; }
    .title { font-size: 28px; font-weight: 800; letter-spacing: -0.8px; margin: 4px 0 8px 0; }
    .subtitle { color: #5C5C66; font-size: 13px; margin-bottom: 24px; }
    .section {
      border: 1px solid #ECECEE;
      border-radius: 12px;
      padding: 18px 20px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .section h2 { font-size: 14px; font-weight: 700; margin: 0 0 12px 0; }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 7px 0;
      border-bottom: 0.5px solid #ECECEE;
    }
    .row:last-child { border-bottom: 0; }
    .label { color: #5C5C66; font-weight: 500; }
    .value { color: #0A0A0B; font-weight: 700; }
    .positive { color: #10B981; }
    .negative { color: #EF4444; }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #ECECEE;
      text-align: center;
      color: #9B9BA3;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="brand">
    <div>
      <div class="brand-name">ComandPOS</div>
      <div class="brand-tag">MANAGER</div>
    </div>
    <div class="meta">${escape(payload.businessName ?? '')}${
  payload.locationName ? ' · ' + escape(payload.locationName) : ''
}</div>
  </div>

  <div class="title">${escape(payload.title)}</div>
  ${payload.subtitle ? `<div class="subtitle">${escape(payload.subtitle)}</div>` : ''}
  ${payload.dateRange ? `<div class="meta" style="margin-bottom:24px;">Período: ${escape(payload.dateRange)}</div>` : ''}

  ${payload.sections
    .map(
      (sec) => `
    <div class="section">
      <h2>${escape(sec.title)}</h2>
      ${sec.rows
        .map(
          (r) => `
        <div class="row">
          <span class="label">${escape(r.label)}</span>
          <span class="value ${r.positive ? 'positive' : r.negative ? 'negative' : ''}">${escape(r.value)}</span>
        </div>
      `,
        )
        .join('')}
    </div>
  `,
    )
    .join('')}

  <div class="footer">
    ${escape(payload.footer ?? 'Generado por ComandPOS Manager')}<br />
    ${new Date().toLocaleString('es-DO')}
  </div>
</body>
</html>`;

export const exportAndSharePdf = async (payload: PdfPayload): Promise<void> => {
  try {
    logger.info('[pdf]', 'generating', payload.title);
    const html = buildHtml(payload);
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    logger.info('[pdf]', 'generated at', uri);

    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: payload.title,
        UTI: 'com.adobe.pdf',
      });
    }
  } catch (e) {
    logger.error('[pdf]', e);
    throw e;
  }
};
