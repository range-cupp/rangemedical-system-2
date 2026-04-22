// lib/treatment-plan-pdf.js
// Simple, clean treatment plan PDF generated from encounter note recommendations.
// Matches Range Medical visual style (see lib/protocol-pdf.js and CLAUDE.md base template).

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
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Normalize pasted summary text so each bullet is on its own line.
// Handles three common shapes:
//   1. Already newline-separated: "- one\n- two\n- three"
//   2. Inline after sentence end: "- one.- two.- three"
//   3. Inline with surrounding whitespace: "- one  - two  - three"
// Leaves in-word hyphens ("D3/K2", "2-step") alone.
export function normalizeBulletText(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/\r/g, '')
    // Sentence-ending punctuation directly followed by a bullet marker
    .replace(/([.!?;:])\s*[-•*\u2013\u2014]\s+/g, '$1\n- ')
    // Multi-space gap followed by a bullet marker
    .replace(/\s{2,}[-•*\u2013\u2014]\s+/g, '\n- ')
    .trim();
}

// Extract bullet lines from pasted summary text. Accepts lines starting with
// `-`, `*`, `•`, or plain newline-separated lines. Strips leading markers.
export function parseBullets(raw) {
  if (!raw) return [];
  return normalizeBulletText(raw)
    .split(/\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^[-*•\u2013\u2014]\s*/, '').trim())
    .filter(Boolean);
}

// Pull everything after the SUMMARY/RECOMMENDATIONS header. Case-insensitive.
// Assumes it is the last section of the note.
export function extractSummarySection(noteBody) {
  if (!noteBody) return '';
  const match = String(noteBody).match(/summary[\s\/&]+recommendations?\s*:?/i);
  if (!match) return '';
  return String(noteBody).slice(match.index + match[0].length).trim();
}

export async function generateTreatmentPlanPdf({
  patientName,
  bullets,
  provider,
  planDate,
}) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let yPos = PAGE_HEIGHT - TOP_MARGIN;

  const safeDraw = (text, opts) => {
    const safe = sanitize(String(text || ''));
    try {
      page.drawText(safe, opts);
    } catch (e) {
      page.drawText(safe.replace(/[^\x20-\x7E]/g, ''), opts);
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
      'This document is confidential and intended solely for the named patient. It is not a substitute',
      'for direct medical consultation. Contact Range Medical before making any changes to your plan.',
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

  const drawWrappedLine = (text, { x, size, maxWidth, lineHeight, bold = false }) => {
    const f = bold ? fontBold : font;
    const words = sanitize(text).split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(test, size) > maxWidth && line) {
        checkPageBreak(lineHeight + 2);
        safeDraw(line, { x, y: yPos, size, font: f, color: COLORS.textBody });
        yPos -= lineHeight;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      checkPageBreak(lineHeight + 2);
      safeDraw(line, { x, y: yPos, size, font: f, color: COLORS.textBody });
      yPos -= lineHeight;
    }
  };

  const drawBullet = (text) => {
    const bulletX = LEFT_MARGIN + 2;
    const textX = LEFT_MARGIN + 14;
    checkPageBreak(18);
    safeDraw('-', { x: bulletX, y: yPos, size: 10, font, color: COLORS.textBody });
    drawWrappedLine(text, {
      x: textX, size: 10, maxWidth: CONTENT_WIDTH - 14, lineHeight: 16,
    });
    yPos -= 4;
  };

  // =========================
  // BUILD
  // =========================
  drawHeader();

  // Title
  safeDraw('Your Treatment Plan', {
    x: LEFT_MARGIN, y: yPos, size: 22, font: fontBold, color: COLORS.black,
  });
  yPos -= 20;
  safeDraw('Personalized follow-up recommendations from your Range Medical provider', {
    x: LEFT_MARGIN, y: yPos, size: 10, font: fontItalic, color: COLORS.textMuted,
  });
  yPos -= 18;

  // Patient info
  drawSectionHeader('Patient Information');
  const issueDate = planDate ? new Date(planDate + 'T00:00:00') : new Date();
  const dateStr = issueDate.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles',
  });
  const infoRows = [
    { label: 'Patient Name', value: patientName || 'N/A' },
    { label: 'Plan Issued', value: dateStr },
  ];
  if (provider) infoRows.push({ label: 'Provider', value: provider });
  drawKeyValueTable(infoRows);

  // Recommendations
  drawSectionHeader('Your Recommendations');
  yPos -= 2;
  safeDraw(
    'The following points summarize your provider\'s guidance from your recent visit.',
    { x: LEFT_MARGIN, y: yPos, size: 9.5, font: fontItalic, color: COLORS.textMuted },
  );
  yPos -= 18;

  const cleanBullets = (bullets || []).filter(b => b && b.trim());
  if (cleanBullets.length === 0) {
    safeDraw('No recommendations were included in this plan.', {
      x: LEFT_MARGIN, y: yPos, size: 10, font: fontItalic, color: COLORS.textMuted,
    });
    yPos -= 16;
  } else {
    for (const b of cleanBullets) {
      drawBullet(b);
    }
  }

  yPos -= 12;

  // Closing note
  drawSectionHeader('Next Steps');
  drawWrappedLine(
    'If you have any questions about this plan or need to schedule a follow-up visit, please call or text us at (949) 997-3988. We\'re here to help you get the most out of your care.',
    { x: LEFT_MARGIN, size: 10, maxWidth: CONTENT_WIDTH, lineHeight: 16 },
  );

  drawFooter();

  return await pdfDoc.save();
}
