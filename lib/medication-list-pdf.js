// lib/medication-list-pdf.js
// Patient-facing active medication list — for travel, second-opinion visits, etc.
// Visual style mirrors lib/treatment-plan-pdf.js (Range Medical base template).

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const LEFT_MARGIN = 54;
const RIGHT_MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN;
const TOP_MARGIN = 54;
const BOTTOM_MARGIN = 72;

const COLORS = {
  black: rgb(0, 0, 0),
  darkGray: rgb(0.15, 0.15, 0.15),
  sectionLabel: rgb(0.35, 0.35, 0.35),
  textBody: rgb(0.2, 0.2, 0.2),
  textMuted: rgb(0.45, 0.45, 0.45),
  ruleGray: rgb(0.75, 0.75, 0.75),
  borderLight: rgb(0.85, 0.85, 0.85),
};

function sanitize(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\r\n]+/g, ' ')
    .replace(/\t/g, '  ')
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/[–—]/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parseLocalDate(input) {
  if (!input) return null;
  try {
    const d = typeof input === 'string'
      ? new Date(input + (input.includes('T') ? '' : 'T12:00:00'))
      : new Date(input);
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
}

function formatDateLong(input) {
  const d = parseLocalDate(input);
  return d ? d.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles',
  }) : '';
}

function formatDateShort(input) {
  const d = parseLocalDate(input);
  return d ? d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles',
  }) : '';
}

export async function generateMedicationListPdf({
  patientName,
  dateOfBirth,
  medications,
  provider,
  issueDate,
}) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let yPos = PAGE_HEIGHT - TOP_MARGIN;

  const safeDraw = (text, opts) => {
    const safe = sanitize(String(text || ''));
    try { page.drawText(safe, opts); }
    catch (e) { page.drawText(safe.replace(/[^\x20-\x7E]/g, ''), opts); }
  };

  const drawHeader = () => {
    safeDraw('RANGE MEDICAL', {
      x: LEFT_MARGIN, y: yPos, size: 17, font: fontBold, color: COLORS.black,
    });
    const c1 = 'range-medical.com  *  (949) 997-3988';
    const c2 = '1901 Westcliff Drive, Suite 10, Newport Beach, CA';
    const c1w = font.widthOfTextAtSize(c1, 8.5);
    const c2w = font.widthOfTextAtSize(c2, 8.5);
    safeDraw(c1, { x: PAGE_WIDTH - RIGHT_MARGIN - c1w, y: yPos + 4, size: 8.5, font, color: COLORS.textMuted });
    safeDraw(c2, { x: PAGE_WIDTH - RIGHT_MARGIN - c2w, y: yPos - 8, size: 8.5, font, color: COLORS.textMuted });
    yPos -= 24;
    page.drawLine({
      start: { x: LEFT_MARGIN, y: yPos },
      end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: yPos },
      thickness: 1.5, color: COLORS.black,
    });
    yPos -= 30;
  };

  const drawFooter = () => {
    const footerY = 32;
    page.drawLine({
      start: { x: LEFT_MARGIN, y: footerY + 22 },
      end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: footerY + 22 },
      thickness: 0.75, color: COLORS.ruleGray,
    });
    safeDraw('Questions or concerns?', { x: LEFT_MARGIN, y: footerY + 8, size: 8, font: fontBold, color: COLORS.darkGray });
    safeDraw('Call or text: (949) 997-3988', { x: LEFT_MARGIN, y: footerY - 2, size: 7.5, font, color: COLORS.textMuted });
    safeDraw('range-medical.com', { x: LEFT_MARGIN, y: footerY - 12, size: 7.5, font, color: COLORS.textMuted });
    const disclaimer = [
      'This document lists medications currently prescribed to the named patient by Range Medical.',
      'It is not a pharmacy prescription. Do not adjust doses without consulting your provider.',
    ];
    for (let i = 0; i < disclaimer.length; i++) {
      const dw = fontItalic.widthOfTextAtSize(disclaimer[i], 7);
      safeDraw(disclaimer[i], {
        x: PAGE_WIDTH - RIGHT_MARGIN - dw,
        y: footerY + 8 - (i * 10),
        size: 7, font: fontItalic, color: COLORS.textMuted,
      });
    }
  };

  const checkPageBreak = (needed = 40) => {
    if (yPos - needed < BOTTOM_MARGIN) {
      drawFooter();
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      yPos = PAGE_HEIGHT - TOP_MARGIN;
      drawHeader();
    }
  };

  const drawSectionHeader = (title) => {
    checkPageBreak(30);
    yPos -= 8;
    safeDraw(sanitize(title).toUpperCase(), {
      x: LEFT_MARGIN, y: yPos, size: 8.5, font: fontBold, color: COLORS.sectionLabel,
    });
    yPos -= 8;
    page.drawLine({
      start: { x: LEFT_MARGIN, y: yPos },
      end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: yPos },
      thickness: 0.75, color: COLORS.ruleGray,
    });
    yPos -= 16;
  };

  const drawKeyValueTable = (rows) => {
    const labelWidth = 170;
    const rowHeight = 28;
    const hLine = () => page.drawLine({
      start: { x: LEFT_MARGIN, y: yPos },
      end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: yPos },
      thickness: 0.5, color: COLORS.borderLight,
    });
    for (const { label, value } of rows) {
      checkPageBreak(rowHeight + 4);
      hLine();
      const textY = yPos - 18;
      safeDraw(sanitize(label), {
        x: LEFT_MARGIN + 12, y: textY, size: 10, font: fontBold, color: COLORS.darkGray,
      });
      safeDraw(sanitize(String(value || 'N/A')).substring(0, 100), {
        x: LEFT_MARGIN + labelWidth, y: textY, size: 10, font, color: COLORS.textBody,
      });
      yPos -= rowHeight;
    }
    hLine();
    yPos -= 12;
  };

  const drawWrappedLine = (text, { x, size, maxWidth, lineHeight, italic = false, bold = false, color = COLORS.textBody }) => {
    const f = bold ? fontBold : italic ? fontItalic : font;
    const words = sanitize(text).split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(test, size) > maxWidth && line) {
        checkPageBreak(lineHeight + 2);
        safeDraw(line, { x, y: yPos, size, font: f, color });
        yPos -= lineHeight;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      checkPageBreak(lineHeight + 2);
      safeDraw(line, { x, y: yPos, size, font: f, color });
      yPos -= lineHeight;
    }
  };

  const drawMedication = (med, index) => {
    checkPageBreak(72);

    if (index > 0) {
      page.drawLine({
        start: { x: LEFT_MARGIN, y: yPos + 10 },
        end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: yPos + 10 },
        thickness: 0.5, color: COLORS.borderLight,
      });
      yPos -= 4;
    }

    const name = med.medication_name || med.trade_name || med.generic_name || 'Unnamed medication';
    drawWrappedLine(name, {
      x: LEFT_MARGIN, size: 12, maxWidth: CONTENT_WIDTH, lineHeight: 16, bold: true, color: COLORS.black,
    });

    const strengthForm = [med.strength, med.form].filter(Boolean).join(' · ');
    if (strengthForm) {
      drawWrappedLine(strengthForm, {
        x: LEFT_MARGIN, size: 10, maxWidth: CONTENT_WIDTH, lineHeight: 14, color: COLORS.textBody,
      });
    }

    if (med.sig) {
      yPos -= 2;
      drawWrappedLine(`Sig: ${med.sig}`, {
        x: LEFT_MARGIN, size: 10, maxWidth: CONTENT_WIDTH, lineHeight: 14, italic: true, color: COLORS.textBody,
      });
    }

    const meta = [];
    const startStr = formatDateShort(med.start_date);
    if (startStr) meta.push(`Started ${startStr}`);
    if (med.source) meta.push(String(med.source));
    if (med.from_protocol) meta.push('via protocol');
    if (meta.length) {
      yPos -= 2;
      drawWrappedLine(meta.join('   ·   '), {
        x: LEFT_MARGIN, size: 9, maxWidth: CONTENT_WIDTH, lineHeight: 13, color: COLORS.textMuted,
      });
    }

    yPos -= 12;
  };

  // =========================
  // BUILD
  // =========================
  drawHeader();

  safeDraw('Medication List', {
    x: LEFT_MARGIN, y: yPos, size: 22, font: fontBold, color: COLORS.black,
  });
  yPos -= 20;
  safeDraw('Active medications prescribed by Range Medical', {
    x: LEFT_MARGIN, y: yPos, size: 10, font: fontItalic, color: COLORS.textMuted,
  });
  yPos -= 18;

  drawSectionHeader('Patient Information');
  const issued = parseLocalDate(issueDate) || new Date();
  const dateStr = issued.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles',
  });
  const infoRows = [{ label: 'Patient Name', value: patientName || 'N/A' }];
  const dobStr = formatDateLong(dateOfBirth);
  if (dobStr) infoRows.push({ label: 'Date of Birth', value: dobStr });
  infoRows.push({ label: 'Issued', value: dateStr });
  infoRows.push({ label: 'Prescribing Provider', value: provider || 'Dr. Burgess, Range Medical' });
  drawKeyValueTable(infoRows);

  drawSectionHeader('Active Medications');
  yPos -= 2;
  safeDraw(
    'Carry this list when you travel or visit a new provider. Contact us with any questions.',
    { x: LEFT_MARGIN, y: yPos, size: 9.5, font: fontItalic, color: COLORS.textMuted },
  );
  yPos -= 18;

  const meds = (medications || []).filter(m => m && (m.medication_name || m.trade_name || m.generic_name));
  if (meds.length === 0) {
    safeDraw('No active medications on file.', {
      x: LEFT_MARGIN, y: yPos, size: 10, font: fontItalic, color: COLORS.textMuted,
    });
    yPos -= 16;
  } else {
    meds.forEach((m, i) => drawMedication(m, i));
  }

  drawFooter();

  return await pdfDoc.save();
}
