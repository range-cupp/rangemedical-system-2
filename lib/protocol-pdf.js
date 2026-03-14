// lib/protocol-pdf.js
// Patient-facing peptide protocol PDF generator for Range Medical
// Generates branded, professional PDFs with hardcoded layout + AI-cached content
// Follows the same patterns as lib/chart-pdf.js

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// ================================================================
// PAGE CONSTANTS (Letter size, 0.75" margins)
// ================================================================
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const LEFT_MARGIN = 54;      // 0.75"
const RIGHT_MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN;
const BOTTOM_MARGIN = 65;
const TOP_MARGIN = 54;

// ================================================================
// BRAND COLORS
// ================================================================
const COLORS = {
  black: rgb(0.04, 0.04, 0.04),       // #0A0A0A
  darkGray: rgb(0.1, 0.1, 0.1),       // #1A1A1A
  midGray: rgb(0.29, 0.29, 0.29),     // #4A4A4A
  textGray: rgb(0.35, 0.35, 0.35),    // body text
  lightGray: rgb(0.96, 0.96, 0.96),   // #F5F5F5
  borderGray: rgb(0.88, 0.88, 0.88),  // #E0E0E0
  white: rgb(1, 1, 1),
  accentBlue: rgb(0.12, 0.25, 0.68),  // subtle accent for links/headings
  offDayBg: rgb(0.95, 0.95, 0.95),    // schedule OFF days
  activeDayBg: rgb(0.92, 0.97, 0.92), // schedule active days
};

// ================================================================
// SANITIZE (same as chart-pdf.js — WinAnsi encoding only)
// ================================================================
function sanitize(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\r\n]+/g, ' ')
    .replace(/\t/g, '  ')
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, '--')
    .replace(/\u2013/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\u2022\u00B7]/g, '*')
    .replace(/\u2713/g, '[x]')
    .replace(/\u2192/g, '->')
    .replace(/\u2190/g, '<-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
    .replace(/\s{2,}/g, ' ');
}

// ================================================================
// SCHEDULE HELPERS
// ================================================================
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getActiveDays(frequency) {
  if (!frequency) return [0, 1, 2, 3, 4]; // default 5 on / 2 off (Mon-Fri)
  const lower = frequency.toLowerCase();
  if (lower.includes('daily')) return [0, 1, 2, 3, 4, 5, 6];
  if (lower.includes('5 on') || lower.includes('5on')) return [0, 1, 2, 3, 4];
  if (lower.includes('3x') || lower.includes('three times')) return [0, 2, 4];
  if (lower.includes('2x') || lower.includes('twice')) return [0, 3];
  if (lower.includes('weekly') || lower.includes('1x')) return [0];
  if (lower.includes('every other') || lower.includes('eod')) return [0, 2, 4, 6];
  if (lower.includes('every 5 days')) return [0, 4];
  if (lower.includes('prn') || lower.includes('as needed')) return [];
  return [0, 1, 2, 3, 4];
}

function isOralMedication(medication) {
  if (!medication) return false;
  const lower = medication.toLowerCase();
  return lower.includes('tablet') || lower.includes('oral') || lower.includes('mk-677') ||
    lower.includes('dihexa') || lower.includes('5-amino') || lower.includes('tesofensine') ||
    lower.includes('slu-pp');
}

// ================================================================
// MAIN EXPORT: generateProtocolPdf
// ================================================================
export async function generateProtocolPdf({ patientName, protocols, combineSingleDoc = true, cachedContent = {} }) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let yPos = PAGE_HEIGHT - TOP_MARGIN;
  let pageNum = 1;

  // ========== HELPERS ==========

  const checkPageBreak = (needed = 40) => {
    if (yPos - needed < BOTTOM_MARGIN) {
      drawFooter();
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pageNum++;
      yPos = PAGE_HEIGHT - TOP_MARGIN;
    }
  };

  const drawFooter = () => {
    const footerY = 28;
    // Thin line above footer
    page.drawLine({
      start: { x: LEFT_MARGIN, y: footerY + 14 },
      end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: footerY + 14 },
      thickness: 0.5,
      color: COLORS.borderGray,
    });
    page.drawText(`Page ${pageNum}`, { x: LEFT_MARGIN, y: footerY, size: 7, font, color: COLORS.midGray });
    const contact = 'Range Medical  |  (949) 891-2005  |  1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660';
    const cw = font.widthOfTextAtSize(contact, 6.5);
    page.drawText(contact, { x: PAGE_WIDTH - RIGHT_MARGIN - cw, y: footerY, size: 6.5, font, color: COLORS.midGray });
    // Disclaimer
    const disclaimer = 'This document is for informational purposes. Follow your provider\'s specific instructions.';
    const dw = font.widthOfTextAtSize(disclaimer, 6);
    page.drawText(disclaimer, { x: (PAGE_WIDTH - dw) / 2, y: footerY - 10, size: 6, font: fontItalic, color: COLORS.borderGray });
  };

  // Header bar — black bar with RANGE MEDICAL + subtitle
  const drawHeader = (subtitle) => {
    const barHeight = 52;
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - barHeight, width: PAGE_WIDTH, height: barHeight, color: COLORS.black });
    page.drawText('RANGE MEDICAL', { x: LEFT_MARGIN, y: PAGE_HEIGHT - 22, size: 16, font: fontBold, color: COLORS.white });
    page.drawText(sanitize(subtitle), { x: LEFT_MARGIN, y: PAGE_HEIGHT - 38, size: 9, font, color: COLORS.white });

    // Date + patient name on right
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const dw = font.widthOfTextAtSize(dateStr, 8);
    page.drawText(dateStr, { x: PAGE_WIDTH - RIGHT_MARGIN - dw, y: PAGE_HEIGHT - 22, size: 8, font, color: COLORS.white });
    if (patientName) {
      const pn = sanitize(patientName);
      const pw = font.widthOfTextAtSize(pn, 8);
      page.drawText(pn, { x: PAGE_WIDTH - RIGHT_MARGIN - pw, y: PAGE_HEIGHT - 36, size: 8, font: fontBold, color: COLORS.white });
    }
    yPos = PAGE_HEIGHT - barHeight - 20;
  };

  // Section header — dark rounded-look bar
  const drawSectionHeader = (title) => {
    checkPageBreak(30);
    yPos -= 6;
    page.drawRectangle({ x: LEFT_MARGIN, y: yPos - 4, width: CONTENT_WIDTH, height: 22, color: COLORS.darkGray });
    page.drawText(sanitize(title).toUpperCase(), { x: LEFT_MARGIN + 10, y: yPos + 2, size: 10, font: fontBold, color: COLORS.white });
    yPos -= 30;
  };

  // Sub-section title
  const drawSubHeader = (title) => {
    checkPageBreak(24);
    yPos -= 4;
    page.drawText(sanitize(title), { x: LEFT_MARGIN, y: yPos, size: 11, font: fontBold, color: COLORS.black });
    yPos -= 6;
    page.drawLine({
      start: { x: LEFT_MARGIN, y: yPos },
      end: { x: LEFT_MARGIN + CONTENT_WIDTH, y: yPos },
      thickness: 0.75,
      color: COLORS.borderGray,
    });
    yPos -= 14;
  };

  // Wrapped text
  const drawWrappedText = (text, opts = {}) => {
    const { size = 9, indent = 0, maxWidth = CONTENT_WIDTH, lineFont = font, lineColor = COLORS.textGray, lineHeight = 13 } = opts;
    const x = LEFT_MARGIN + indent;
    const effectiveWidth = maxWidth - indent;
    const words = sanitize(String(text || '')).split(' ');
    let line = '';
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const w = lineFont.widthOfTextAtSize(testLine, size);
      if (w > effectiveWidth && line) {
        checkPageBreak(lineHeight + 2);
        page.drawText(line, { x, y: yPos, size, font: lineFont, color: lineColor });
        yPos -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      checkPageBreak(lineHeight + 2);
      page.drawText(line, { x, y: yPos, size, font: lineFont, color: lineColor });
      yPos -= lineHeight;
    }
  };

  // Simple text line
  const drawText = (text, opts = {}) => {
    const { size = 9, indent = 0, lineFont = font, lineColor = COLORS.textGray } = opts;
    checkPageBreak(14);
    page.drawText(sanitize(String(text || '')).substring(0, 200), { x: LEFT_MARGIN + indent, y: yPos, size, font: lineFont, color: lineColor });
    yPos -= 14;
  };

  // Label: Value pair
  const drawLabelValue = (label, value, opts = {}) => {
    checkPageBreak(16);
    const { indent = 0 } = opts;
    const x = LEFT_MARGIN + indent;
    page.drawText(`${sanitize(label)}:`, { x, y: yPos, size: 9, font: fontBold, color: COLORS.black });
    const labelWidth = fontBold.widthOfTextAtSize(`${sanitize(label)}: `, 9);
    page.drawText(sanitize(String(value || 'N/A')).substring(0, 120), { x: x + labelWidth, y: yPos, size: 9, font, color: COLORS.textGray });
    yPos -= 15;
  };

  // Bullet point
  const drawBullet = (text, opts = {}) => {
    const { indent = 12, size = 9 } = opts;
    checkPageBreak(14);
    const x = LEFT_MARGIN + indent;
    page.drawText('*', { x: x - 8, y: yPos + 1, size: 7, font: fontBold, color: COLORS.midGray });
    drawWrappedText(text, { indent: indent, size });
  };

  // Numbered step
  const drawNumberedStep = (num, text, opts = {}) => {
    const { indent = 12, size = 9 } = opts;
    checkPageBreak(16);
    const x = LEFT_MARGIN + indent;
    const numStr = `${num}.`;
    page.drawText(numStr, { x: x - 2, y: yPos, size: 9, font: fontBold, color: COLORS.black });
    const numWidth = fontBold.widthOfTextAtSize(numStr + ' ', 9);
    drawWrappedText(text, { indent: indent + numWidth, size });
  };

  // Horizontal divider
  const drawDivider = () => {
    checkPageBreak(10);
    page.drawLine({
      start: { x: LEFT_MARGIN, y: yPos },
      end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: yPos },
      thickness: 0.5,
      color: COLORS.borderGray,
    });
    yPos -= 10;
  };

  // ========== TABLE DRAWING ==========

  const drawOverviewTable = (protocols) => {
    const colWidths = [120, 70, 85, 70, 65, 94]; // Peptide, Dose, Frequency, Duration, Route, Price/Mo
    const headers = ['Peptide', 'Dose', 'Frequency', 'Duration', 'Route', 'Price/Mo'];
    const rowHeight = 20;
    const headerHeight = 22;

    checkPageBreak(headerHeight + (protocols.length * rowHeight) + 10);

    let x = LEFT_MARGIN;

    // Header row
    page.drawRectangle({ x: LEFT_MARGIN, y: yPos - 6, width: CONTENT_WIDTH, height: headerHeight, color: COLORS.darkGray });
    for (let i = 0; i < headers.length; i++) {
      page.drawText(headers[i], { x: x + 6, y: yPos + 2, size: 8, font: fontBold, color: COLORS.white });
      x += colWidths[i];
    }
    yPos -= headerHeight + 2;

    // Data rows
    for (let r = 0; r < protocols.length; r++) {
      const p = protocols[r];
      checkPageBreak(rowHeight + 4);

      // Alternate row bg
      if (r % 2 === 0) {
        page.drawRectangle({ x: LEFT_MARGIN, y: yPos - 4, width: CONTENT_WIDTH, height: rowHeight, color: COLORS.lightGray });
      }

      x = LEFT_MARGIN;
      const rowData = [
        (p.medication || 'N/A').substring(0, 22),
        (p.dose || p.selected_dose || 'N/A').substring(0, 12),
        (p.frequency || 'N/A').substring(0, 16),
        (p.duration || 'N/A').substring(0, 12),
        isOralMedication(p.medication) ? 'Oral' : (p.route || 'SubQ'),
        p.pricePerMonth ? `$${p.pricePerMonth}` : '--',
      ];

      for (let i = 0; i < rowData.length; i++) {
        page.drawText(sanitize(rowData[i]), { x: x + 6, y: yPos + 2, size: 8, font, color: COLORS.textGray });
        x += colWidths[i];
      }
      yPos -= rowHeight;
    }
    yPos -= 8;
  };

  // ========== SCHEDULE GRID ==========

  const drawScheduleGrid = (frequency, medication) => {
    const activeDays = getActiveDays(frequency);
    if (activeDays.length === 0) {
      // PRN — no grid
      drawText('This medication is taken as needed (PRN). Follow your provider\'s instructions for timing.');
      return;
    }

    const cellWidth = Math.floor(CONTENT_WIDTH / 7);
    const cellHeight = 28;
    const headerCellHeight = 20;

    checkPageBreak(headerCellHeight + cellHeight + 20);

    let x = LEFT_MARGIN;

    // Day headers
    for (let d = 0; d < 7; d++) {
      page.drawRectangle({ x, y: yPos - 4, width: cellWidth, height: headerCellHeight, color: COLORS.darkGray });
      const tw = fontBold.widthOfTextAtSize(DAYS[d], 8);
      page.drawText(DAYS[d], { x: x + (cellWidth - tw) / 2, y: yPos + 2, size: 8, font: fontBold, color: COLORS.white });
      x += cellWidth;
    }
    yPos -= headerCellHeight + 2;

    // Activity row
    x = LEFT_MARGIN;
    for (let d = 0; d < 7; d++) {
      const isActive = activeDays.includes(d);
      const cellBg = isActive ? COLORS.activeDayBg : COLORS.offDayBg;
      page.drawRectangle({ x, y: yPos - 4, width: cellWidth, height: cellHeight, color: cellBg });
      // Border
      page.drawRectangle({ x, y: yPos - 4, width: cellWidth, height: cellHeight, borderColor: COLORS.borderGray, borderWidth: 0.5, color: cellBg });

      const label = isActive ? 'INJECT' : 'OFF';
      const labelFont = isActive ? fontBold : font;
      const labelColor = isActive ? rgb(0.1, 0.5, 0.1) : COLORS.midGray;
      const lw = labelFont.widthOfTextAtSize(label, 8);

      if (isOralMedication(medication)) {
        const oralLabel = isActive ? 'TAKE' : 'OFF';
        const olw = labelFont.widthOfTextAtSize(oralLabel, 8);
        page.drawText(oralLabel, { x: x + (cellWidth - olw) / 2, y: yPos + 6, size: 8, font: labelFont, color: labelColor });
      } else {
        page.drawText(label, { x: x + (cellWidth - lw) / 2, y: yPos + 6, size: 8, font: labelFont, color: labelColor });
      }
      x += cellWidth;
    }
    yPos -= cellHeight + 8;

    // Legend
    const activeDayNames = activeDays.map(d => DAYS[d]).join(', ');
    const offDayNames = DAYS.filter((_, i) => !activeDays.includes(i)).join(', ');
    if (offDayNames) {
      drawText(`Active days: ${activeDayNames}  |  Off days: ${offDayNames}`, { size: 8, lineColor: COLORS.midGray });
    } else {
      drawText(`Active: Every day`, { size: 8, lineColor: COLORS.midGray });
    }
  };

  // ================================================================
  // BUILD THE PDF
  // ================================================================

  // Determine title
  const isCombined = combineSingleDoc && protocols.length > 1;
  const headerTitle = isCombined
    ? 'Your Protocol Plan'
    : `${protocols[0]?.medication || 'Protocol'} Protocol`;

  drawHeader(headerTitle);

  // ===========================
  // 1. OVERVIEW TABLE
  // ===========================
  drawSectionHeader('Protocol Overview');
  drawOverviewTable(protocols);

  // ===========================
  // 2. PRE-FILLED SYRINGE NOTE (for injectable protocols)
  // ===========================
  const hasInjectable = protocols.some(p => !isOralMedication(p.medication));
  if (hasInjectable) {
    checkPageBreak(50);
    yPos -= 4;
    page.drawRectangle({
      x: LEFT_MARGIN,
      y: yPos - 36,
      width: CONTENT_WIDTH,
      height: 44,
      color: rgb(0.96, 0.98, 1),
      borderColor: COLORS.accentBlue,
      borderWidth: 0.5,
    });
    drawWrappedText(
      'Your syringes are pre-filled by our clinical team and ready to use. There is no need to measure, mix, or reconstitute anything. Each syringe contains your exact prescribed dose.',
      { indent: 10, size: 8.5, lineFont: fontItalic, lineColor: COLORS.midGray }
    );
    yPos -= 8;
  }

  // ===========================
  // 3. WHAT IS [PEPTIDE]? — Per protocol
  // ===========================
  for (const protocol of protocols) {
    const med = protocol.medication || 'Unknown';
    const content = cachedContent[med];

    if (content && content.description) {
      drawSubHeader(`What is ${med}?`);
      drawWrappedText(content.description, { size: 9 });
      yPos -= 6;
    }
  }

  // ===========================
  // 4. HOW TO ADMINISTER (injectable only)
  // ===========================
  if (hasInjectable) {
    drawSectionHeader('How to Administer Your Injection');
    const steps = [
      'Choose an injection site on your lower abdomen, about 2 inches from your belly button. Alternate sides each day.',
      'Clean the injection site with an alcohol swab and let it dry completely.',
      'Remove the cap from your pre-filled syringe. Pinch a fold of skin and insert the needle at a 45 to 90 degree angle.',
      'Press the plunger slowly and steadily until all medication is delivered. Release the skin fold and withdraw the needle.',
      'Place the used syringe in your sharps container. Never reuse or recap needles.',
    ];
    for (let i = 0; i < steps.length; i++) {
      drawNumberedStep(i + 1, steps[i]);
      yPos -= 2;
    }
    yPos -= 6;
  }

  // ===========================
  // 5. SCHEDULE GRID — Per protocol
  // ===========================
  for (const protocol of protocols) {
    const med = protocol.medication || 'Unknown';
    const freq = protocol.frequency || '5 on / 2 off';

    if (isCombined) {
      drawSubHeader(`${med} Schedule`);
    } else {
      drawSectionHeader('Your Weekly Schedule');
    }
    drawScheduleGrid(freq, med);
  }

  // ===========================
  // 6. PHASE DETAILS (multi-phase protocols)
  // ===========================
  for (const protocol of protocols) {
    const med = protocol.medication || 'Unknown';
    const content = cachedContent[med];
    const phases = protocol.phases || [];

    if (phases.length > 1 || (content && content.phase_goals && content.phase_goals.length > 0)) {
      if (isCombined) {
        drawSubHeader(`${med} — Phase Progression`);
      } else {
        drawSectionHeader('Phase Progression');
      }

      // Use explicit phases if provided, otherwise use cached content
      const phaseList = phases.length > 0 ? phases : (content?.phase_goals || []);

      for (let i = 0; i < phaseList.length; i++) {
        const phase = phaseList[i];
        checkPageBreak(50);

        const phaseName = phase.name || phase.phase || `Phase ${i + 1}`;
        const phaseDose = phase.dose || '';
        const phasePrice = phase.price ? ` — $${phase.price}/mo` : '';

        drawText(`${phaseName}${phaseDose ? `: ${phaseDose}` : ''}${phasePrice}`, { lineFont: fontBold, lineColor: COLORS.black, size: 10 });

        if (phase.goal || phase.description) {
          drawWrappedText(phase.goal || phase.description, { indent: 8 });
        }
        if (phase.duration) {
          drawLabelValue('Duration', phase.duration, { indent: 8 });
        }
        yPos -= 4;
      }

      // What to Expect
      if (content && content.what_to_expect && content.what_to_expect.length > 0) {
        yPos -= 4;
        drawText('What to Expect:', { lineFont: fontBold, lineColor: COLORS.black });
        for (const item of content.what_to_expect) {
          drawBullet(typeof item === 'string' ? item : (item.text || item.description || JSON.stringify(item)));
        }
        yPos -= 6;
      }
    }
  }

  // ===========================
  // 7. STORAGE INSTRUCTIONS
  // ===========================
  drawSectionHeader('Storage Instructions');
  for (const protocol of protocols) {
    const med = protocol.medication || 'Unknown';
    const content = cachedContent[med];

    if (isOralMedication(med)) {
      drawBullet(`${med}: Store at room temperature in a cool, dry place. Keep away from direct sunlight and moisture.`);
    } else if (content && content.storage_instructions) {
      drawBullet(`${med}: ${content.storage_instructions}`);
    } else {
      drawBullet(`${med}: Refrigerate pre-filled syringes between 36-46 degrees F (2-8 degrees C). Do not freeze. Keep away from light. Use within 28 days.`);
    }
  }
  yPos -= 6;

  // ===========================
  // 8. IMPORTANT REMINDERS
  // ===========================
  drawSectionHeader('Important Reminders');
  const reminders = [
    'Inject at the same time each day for best results.',
    'Rotate injection sites to prevent irritation or tissue damage.',
    'If you miss a dose, take it as soon as you remember. If it is close to your next dose, skip the missed dose.',
    'Report any unusual reactions (redness, swelling, dizziness) to our clinic immediately.',
    'Do not share your medication with anyone else.',
    'Attend all scheduled follow-up appointments and lab work.',
  ];
  for (const reminder of reminders) {
    drawBullet(reminder);
  }
  yPos -= 6;

  // ===========================
  // 9. CONTACT
  // ===========================
  checkPageBreak(60);
  yPos -= 4;
  page.drawRectangle({
    x: LEFT_MARGIN,
    y: yPos - 42,
    width: CONTENT_WIDTH,
    height: 50,
    color: COLORS.lightGray,
    borderColor: COLORS.borderGray,
    borderWidth: 0.5,
  });
  yPos -= 2;
  drawText('Questions? Contact Us:', { indent: 10, lineFont: fontBold, lineColor: COLORS.black, size: 10 });
  drawText('Phone: (949) 891-2005  |  Email: info@rangemedical.com', { indent: 10, size: 9, lineColor: COLORS.midGray });
  drawText('1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660', { indent: 10, size: 9, lineColor: COLORS.midGray });

  // Final footer
  drawFooter();

  return await pdfDoc.save();
}
