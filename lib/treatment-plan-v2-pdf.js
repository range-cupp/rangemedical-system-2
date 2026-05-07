// lib/treatment-plan-v2-pdf.js
// Structured treatment plan PDF — Range Medical v2 style.
// Sections: Patient Info, Assessment (symptoms + goals), Plan of Care
// (categorized items with action/rationale), Lifestyle, Follow-up.

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const LEFT_MARGIN = 54;
const RIGHT_MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN;
const TOP_MARGIN = 54;
const BOTTOM_MARGIN = 72;

const C = {
  black: rgb(0.04, 0.04, 0.04),
  dark: rgb(0.1, 0.1, 0.1),
  body: rgb(0.2, 0.2, 0.2),
  label: rgb(0.35, 0.35, 0.35),
  muted: rgb(0.45, 0.45, 0.45),
  rule: rgb(0.75, 0.75, 0.75),
  border: rgb(0.85, 0.85, 0.85),
  bg: rgb(0.96, 0.96, 0.96),
  green: rgb(0.18, 0.42, 0.21),
  white: rgb(1, 1, 1),
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

export async function generateTreatmentPlanV2Pdf({
  patientName,
  planDate,
  provider,
  symptoms = [],
  goals = [],
  planCategories = [],
  lifestyle = [],
  followUp = [],
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
    catch { page.drawText(safe.replace(/[^\x20-\x7E]/g, ''), opts); }
  };

  const checkPageBreak = (needed = 40) => {
    if (yPos - needed < BOTTOM_MARGIN) {
      drawFooter();
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      yPos = PAGE_HEIGHT - TOP_MARGIN;
      drawHeader();
    }
  };

  // --- Header ---
  const drawHeader = () => {
    safeDraw('RANGE MEDICAL', {
      x: LEFT_MARGIN, y: yPos, size: 13, font: fontBold, color: C.black,
    });
    const c1 = 'range-medical.com  |  (949) 997-3988';
    const c2 = '1901 Westcliff Drive, Suite 10, Newport Beach, CA';
    const c1w = font.widthOfTextAtSize(c1, 8);
    const c2w = font.widthOfTextAtSize(c2, 8);
    safeDraw(c1, { x: PAGE_WIDTH - RIGHT_MARGIN - c1w, y: yPos + 2, size: 8, font, color: C.muted });
    safeDraw(c2, { x: PAGE_WIDTH - RIGHT_MARGIN - c2w, y: yPos - 9, size: 8, font, color: C.muted });
    yPos -= 20;
    page.drawLine({
      start: { x: LEFT_MARGIN, y: yPos },
      end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: yPos },
      thickness: 1.5, color: C.black,
    });
    yPos -= 26;
  };

  // --- Footer ---
  const drawFooter = () => {
    const fy = 30;
    page.drawLine({
      start: { x: LEFT_MARGIN, y: fy + 20 },
      end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: fy + 20 },
      thickness: 0.5, color: C.rule,
    });
    safeDraw('Questions or concerns?', { x: LEFT_MARGIN, y: fy + 6, size: 8, font: fontBold, color: C.dark });
    safeDraw('Call or text: (949) 997-3988  |  range-medical.com', { x: LEFT_MARGIN, y: fy - 4, size: 7.5, font, color: C.muted });
    const d1 = 'This document is confidential and intended solely for the named patient.';
    const d2 = 'Contact Range Medical before making any changes to your plan.';
    const d1w = fontItalic.widthOfTextAtSize(d1, 7);
    const d2w = fontItalic.widthOfTextAtSize(d2, 7);
    safeDraw(d1, { x: PAGE_WIDTH - RIGHT_MARGIN - d1w, y: fy + 6, size: 7, font: fontItalic, color: C.muted });
    safeDraw(d2, { x: PAGE_WIDTH - RIGHT_MARGIN - d2w, y: fy - 4, size: 7, font: fontItalic, color: C.muted });
  };

  // --- Section label (small-caps gray + thin rule) ---
  const drawSectionLabel = (title) => {
    checkPageBreak(28);
    yPos -= 6;
    safeDraw(sanitize(title).toUpperCase(), {
      x: LEFT_MARGIN, y: yPos, size: 8, font: fontBold, color: C.label,
    });
    yPos -= 7;
    page.drawLine({
      start: { x: LEFT_MARGIN, y: yPos },
      end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: yPos },
      thickness: 0.75, color: C.rule,
    });
    yPos -= 14;
  };

  // --- Key-value info table ---
  const drawInfoTable = (rows) => {
    const labelCol = 160;
    for (let i = 0; i < rows.length; i++) {
      checkPageBreak(26);
      const rowY = yPos;
      const bgColor = i % 2 === 0 ? C.bg : C.white;
      page.drawRectangle({
        x: LEFT_MARGIN, y: rowY - 16,
        width: CONTENT_WIDTH, height: 24,
        color: bgColor,
      });
      if (i < rows.length - 1) {
        page.drawLine({
          start: { x: LEFT_MARGIN, y: rowY - 16 },
          end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: rowY - 16 },
          thickness: 0.5, color: C.border,
        });
      }
      safeDraw(sanitize(rows[i].label), {
        x: LEFT_MARGIN + 10, y: rowY - 11, size: 9.5, font: fontBold, color: C.dark,
      });
      safeDraw(sanitize(String(rows[i].value || 'N/A')).substring(0, 90), {
        x: LEFT_MARGIN + labelCol, y: rowY - 11, size: 9.5, font, color: C.body,
      });
      yPos -= 24;
    }
    // outer border
    const tableTop = yPos + 24 * rows.length;
    page.drawRectangle({
      x: LEFT_MARGIN, y: yPos,
      width: CONTENT_WIDTH, height: tableTop - yPos,
      borderColor: C.border, borderWidth: 0.5,
    });
    yPos -= 10;
  };

  // --- Wrapped text ---
  const drawWrapped = (text, { x, size, maxWidth, lineHeight, f = font, color = C.body, indent = 0 }) => {
    const words = sanitize(text).split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(test, size) > maxWidth && line) {
        checkPageBreak(lineHeight + 2);
        safeDraw(line, { x: x + indent, y: yPos, size, font: f, color });
        yPos -= lineHeight;
        line = word;
        indent = 0;
      } else {
        line = test;
      }
    }
    if (line) {
      checkPageBreak(lineHeight + 2);
      safeDraw(line, { x: x + indent, y: yPos, size, font: f, color });
      yPos -= lineHeight;
    }
  };

  // --- Bullet item ---
  const drawBullet = (text, bulletChar = '-') => {
    const bx = LEFT_MARGIN + 4;
    const tx = LEFT_MARGIN + 16;
    checkPageBreak(16);
    safeDraw(bulletChar, { x: bx, y: yPos, size: 9.5, font, color: C.body });
    drawWrapped(text, { x: tx, size: 9.5, maxWidth: CONTENT_WIDTH - 16, lineHeight: 15 });
    yPos -= 3;
  };

  // --- Checkmark item ---
  const drawCheckItem = (text, x, maxWidth) => {
    checkPageBreak(15);
    safeDraw('>', { x, y: yPos, size: 9, font: fontBold, color: C.green });
    drawWrapped(text, { x: x + 14, size: 9.5, maxWidth: maxWidth - 14, lineHeight: 14 });
    yPos -= 2;
  };

  // ============================
  // BUILD PDF
  // ============================
  drawHeader();

  // Title
  safeDraw('Treatment Plan', {
    x: LEFT_MARGIN, y: yPos, size: 17, font: fontBold, color: C.black,
  });
  yPos -= 16;
  safeDraw(`Personalized care plan for ${sanitize(patientName || 'Patient')}`, {
    x: LEFT_MARGIN, y: yPos, size: 9.5, font: fontItalic, color: C.muted,
  });
  yPos -= 20;

  // --- Patient Information ---
  drawSectionLabel('Patient Information');
  const issueDate = planDate ? new Date(planDate + 'T00:00:00') : new Date();
  const dateStr = issueDate.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles',
  });
  const infoRows = [
    { label: 'Patient Name', value: patientName || 'N/A' },
    { label: 'Plan Date', value: dateStr },
  ];
  if (provider) infoRows.push({ label: 'Provider', value: provider });
  drawInfoTable(infoRows);

  // --- Assessment (symptoms + goals side by side) ---
  if (symptoms.length > 0 || goals.length > 0) {
    drawSectionLabel('Assessment');

    const colWidth = (CONTENT_WIDTH - 20) / 2;
    const leftX = LEFT_MARGIN;
    const rightX = LEFT_MARGIN + colWidth + 20;

    // Column headers
    if (symptoms.length > 0) {
      safeDraw('Presenting Symptoms', {
        x: leftX, y: yPos, size: 9.5, font: fontBold, color: C.dark,
      });
    }
    if (goals.length > 0) {
      safeDraw('Patient Goals', {
        x: rightX, y: yPos, size: 9.5, font: fontBold, color: C.dark,
      });
    }
    yPos -= 16;

    // Render items in parallel columns
    const maxItems = Math.max(symptoms.length, goals.length);
    for (let i = 0; i < maxItems; i++) {
      checkPageBreak(16);
      if (i < symptoms.length) {
        safeDraw('>', { x: leftX + 2, y: yPos, size: 9, font: fontBold, color: C.green });
        safeDraw(sanitize(symptoms[i]), {
          x: leftX + 16, y: yPos, size: 9.5, font, color: C.body,
        });
      }
      if (i < goals.length) {
        safeDraw('>', { x: rightX + 2, y: yPos, size: 9, font: fontBold, color: C.green });
        safeDraw(sanitize(goals[i]), {
          x: rightX + 16, y: yPos, size: 9.5, font, color: C.body,
        });
      }
      yPos -= 16;
    }
    yPos -= 6;
  }

  // --- Plan of Care (categorized items) ---
  if (planCategories.length > 0) {
    drawSectionLabel('Plan of Care');

    for (const cat of planCategories) {
      if (!cat.name || !cat.items?.length) continue;

      // Category sub-heading
      checkPageBreak(30);
      safeDraw(sanitize(cat.name), {
        x: LEFT_MARGIN, y: yPos, size: 11, font: fontBold, color: C.dark,
      });
      yPos -= 18;

      for (let i = 0; i < cat.items.length; i++) {
        const item = cat.items[i];
        checkPageBreak(50);

        // Item number + name
        const num = `${i + 1}.`;
        safeDraw(num, {
          x: LEFT_MARGIN + 4, y: yPos, size: 9.5, font: fontBold, color: C.dark,
        });
        const numW = fontBold.widthOfTextAtSize(num, 9.5);
        safeDraw(sanitize(item.name), {
          x: LEFT_MARGIN + 4 + numW + 6, y: yPos, size: 9.5, font: fontBold, color: C.dark,
        });
        yPos -= 15;

        // Action
        if (item.action) {
          checkPageBreak(16);
          safeDraw('Action:', {
            x: LEFT_MARGIN + 18, y: yPos, size: 9, font: fontBold, color: C.label,
          });
          const actionLabelW = fontBold.widthOfTextAtSize('Action:', 9);
          drawWrapped(item.action, {
            x: LEFT_MARGIN + 18 + actionLabelW + 6,
            size: 9.5,
            maxWidth: CONTENT_WIDTH - 18 - actionLabelW - 6,
            lineHeight: 15,
          });
        }

        // Rationale
        if (item.rationale) {
          checkPageBreak(16);
          safeDraw('Rationale:', {
            x: LEFT_MARGIN + 18, y: yPos, size: 9, font: fontBold, color: C.label,
          });
          const ratLabelW = fontBold.widthOfTextAtSize('Rationale:', 9);
          drawWrapped(item.rationale, {
            x: LEFT_MARGIN + 18 + ratLabelW + 6,
            size: 9.5,
            maxWidth: CONTENT_WIDTH - 18 - ratLabelW - 6,
            lineHeight: 15,
          });
        }

        yPos -= 8;
      }
      yPos -= 4;
    }
  }

  // --- Lifestyle Recommendations ---
  if (lifestyle.length > 0) {
    drawSectionLabel('Lifestyle Recommendations');
    for (const item of lifestyle) {
      drawBullet(item);
    }
    yPos -= 4;
  }

  // --- Follow-Up ---
  if (followUp.length > 0) {
    drawSectionLabel('Follow-Up');
    for (const item of followUp) {
      drawBullet(item);
    }
  }

  drawFooter();

  return await pdfDoc.save();
}
