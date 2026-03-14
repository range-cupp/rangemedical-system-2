// lib/protocol-pdf.js
// Patient-facing treatment plan PDF generator for Range Medical
// Matches the Benton B. Treatment Plan format exactly
// Uses pdf-lib (same as chart-pdf.js)

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
  textGray: rgb(0.25, 0.25, 0.25),    // body text
  lightGray: rgb(0.96, 0.96, 0.96),   // #F5F5F5
  borderGray: rgb(0.82, 0.82, 0.82),  // #D1D1D1
  white: rgb(1, 1, 1),
  sectionBg: rgb(0.95, 0.97, 0.94),   // subtle green tint for recommendations
};

// ================================================================
// SANITIZE (WinAnsi encoding only)
// ================================================================
function sanitize(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\r\n]+/g, ' ')
    .replace(/\t/g, '  ')
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, ' -- ')
    .replace(/\u2013/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\u2022\u00B7]/g, '*')
    .replace(/\u2713/g, '[check]')
    .replace(/\u2192/g, '->')
    .replace(/\u2190/g, '<-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
    .replace(/\s{2,}/g, ' ');
}

// ================================================================
// SCHEDULE HELPERS
// ================================================================
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getActiveDays(frequency) {
  if (!frequency) return [0, 1, 2, 3, 4]; // Mon-Fri
  const lower = frequency.toLowerCase();
  if (lower.includes('daily')) return [0, 1, 2, 3, 4, 5, 6];
  if (lower.includes('5 on') || lower.includes('5on') || lower.includes('mon') && lower.includes('fri')) return [0, 1, 2, 3, 4];
  if (lower.includes('3x') || lower.includes('three times')) return [0, 2, 4];
  if (lower.includes('2x') || lower.includes('twice')) return [0, 3];
  if (lower.includes('weekly') || lower.includes('1x') || lower.includes('once')) return [4]; // Friday default for weekly
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

function isWeeklyMedication(frequency) {
  if (!frequency) return false;
  const lower = frequency.toLowerCase();
  return lower.includes('weekly') || lower.includes('1x') || lower.includes('once per week') || lower.includes('once a week');
}

// ================================================================
// MAIN EXPORT: generateProtocolPdf
// ================================================================
export async function generateProtocolPdf({
  patientName,
  protocols,
  combineSingleDoc = true,
  cachedContent = {},
  protocolType,     // e.g. "Peptide Optimization + GLP-1 Weight Management"
  provider,         // e.g. "Dr. Burgess, Range Medical"
  startDate,        // ISO date string for injection date calculations
}) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontBoldItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let yPos = PAGE_HEIGHT - TOP_MARGIN;
  let pageNum = 1;

  // ========== CORE HELPERS ==========

  const checkPageBreak = (needed = 40) => {
    if (yPos - needed < BOTTOM_MARGIN) {
      drawFooter();
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pageNum++;
      yPos = PAGE_HEIGHT - TOP_MARGIN;
    }
  };

  const drawFooter = () => {
    const footerY = 30;
    // Thick divider line
    page.drawLine({
      start: { x: LEFT_MARGIN, y: footerY + 20 },
      end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: footerY + 20 },
      thickness: 1.5,
      color: COLORS.black,
    });

    // Left side: Questions or concerns? + contact
    page.drawText('Questions or concerns?', { x: LEFT_MARGIN, y: footerY + 6, size: 8, font: fontBold, color: COLORS.black });
    page.drawText('Call or text us: (949) 997-3988', { x: LEFT_MARGIN, y: footerY - 4, size: 7, font, color: COLORS.textGray });
    page.drawText('range-medical.com', { x: LEFT_MARGIN, y: footerY - 13, size: 7, font, color: COLORS.textGray });

    // Right side: Disclaimer in italic
    const disclaimerLines = [
      'This document is confidential and intended solely for the named patient.',
      'It is not a substitute for direct medical consultation. Contact Range',
      'Medical before making any changes to your protocol.',
    ];
    for (let i = 0; i < disclaimerLines.length; i++) {
      const dw = fontItalic.widthOfTextAtSize(disclaimerLines[i], 6.5);
      page.drawText(disclaimerLines[i], {
        x: PAGE_WIDTH - RIGHT_MARGIN - dw,
        y: footerY + 6 - (i * 9),
        size: 6.5,
        font: fontItalic,
        color: COLORS.midGray,
      });
    }
  };

  // Wrapped text — returns final yPos
  const drawWrappedText = (text, opts = {}) => {
    const { size = 9.5, indent = 0, maxWidth = CONTENT_WIDTH, lineFont = font, lineColor = COLORS.textGray, lineHeight = 14 } = opts;
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

  // Bold+normal text on same line (for "Bold lead: normal text" pattern)
  const drawBoldLeadBullet = (boldText, normalText, opts = {}) => {
    const { indent = 18, size = 9.5 } = opts;
    const x = LEFT_MARGIN + indent;
    checkPageBreak(16);

    // Draw bullet
    page.drawText('*', { x: x - 10, y: yPos + 1, size: 7, font: fontBold, color: COLORS.midGray });

    // Draw bold part
    const boldStr = sanitize(boldText) + (normalText ? ' ' : '');
    page.drawText(boldStr, { x, y: yPos, size, font: fontBold, color: COLORS.textGray });
    const boldWidth = fontBold.widthOfTextAtSize(boldStr, size);

    if (normalText) {
      // Wrap the remaining text
      const effectiveWidth = CONTENT_WIDTH - indent;
      const normalStr = sanitize(normalText);
      const firstLineWidth = effectiveWidth - boldWidth;

      // Try to fit some text on the first line
      const words = normalStr.split(' ');
      let firstLine = '';
      let remaining = [];
      let usedFirstLine = false;

      for (let i = 0; i < words.length; i++) {
        const test = firstLine ? `${firstLine} ${words[i]}` : words[i];
        if (font.widthOfTextAtSize(test, size) <= firstLineWidth) {
          firstLine = test;
        } else {
          remaining = words.slice(i);
          usedFirstLine = true;
          break;
        }
      }
      if (!usedFirstLine) remaining = [];

      if (firstLine) {
        page.drawText(firstLine, { x: x + boldWidth, y: yPos, size, font, color: COLORS.textGray });
      }
      yPos -= 14;

      // Continue wrapping remaining words
      if (remaining.length > 0) {
        drawWrappedText(remaining.join(' '), { indent, size });
      }
    } else {
      yPos -= 14;
    }
  };

  // Simple bullet point
  const drawBullet = (text, opts = {}) => {
    const { indent = 18, size = 9.5 } = opts;
    checkPageBreak(14);
    const x = LEFT_MARGIN + indent;
    page.drawText('*', { x: x - 10, y: yPos + 1, size: 7, font: fontBold, color: COLORS.midGray });
    drawWrappedText(text, { indent, size });
  };

  // ========== SECTION HEADER (black bar with white text) ==========
  const drawSectionHeader = (title) => {
    checkPageBreak(36);
    yPos -= 10;
    page.drawRectangle({ x: LEFT_MARGIN, y: yPos - 6, width: CONTENT_WIDTH, height: 24, color: COLORS.black });
    page.drawText(sanitize(title).toUpperCase(), { x: LEFT_MARGIN + 12, y: yPos + 1, size: 11, font: fontBold, color: COLORS.white });
    yPos -= 34;
  };

  // Sub-header (bold text, no bar)
  const drawSubHeader = (title) => {
    checkPageBreak(24);
    yPos -= 6;
    page.drawText(sanitize(title), { x: LEFT_MARGIN, y: yPos, size: 10.5, font: fontBold, color: COLORS.black });
    yPos -= 18;
  };

  // Horizontal line
  const drawHLine = (opts = {}) => {
    const { indent = 0, color = COLORS.borderGray, thickness = 0.5 } = opts;
    page.drawLine({
      start: { x: LEFT_MARGIN + indent, y: yPos },
      end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: yPos },
      thickness,
      color,
    });
  };

  // ========== KEY-VALUE TABLE (Patient Info / Protocol Overview style) ==========
  const drawKeyValueTable = (rows) => {
    const labelWidth = 160;
    const rowHeight = 22;

    for (let i = 0; i < rows.length; i++) {
      checkPageBreak(rowHeight + 4);
      const { label, value } = rows[i];

      // Top border line
      drawHLine();
      yPos -= rowHeight - 6;

      // Label (bold)
      page.drawText(sanitize(label) + ':', {
        x: LEFT_MARGIN + 12,
        y: yPos,
        size: 9.5,
        font: fontBold,
        color: COLORS.black,
      });

      // Value
      page.drawText(sanitize(String(value || 'N/A')).substring(0, 100), {
        x: LEFT_MARGIN + labelWidth,
        y: yPos,
        size: 9.5,
        font,
        color: COLORS.textGray,
      });

      yPos -= 8;
    }
    // Bottom border
    drawHLine();
    yPos -= 12;
  };

  // ========== TIMELINE TABLE (2-column: Period | Description) ==========
  const drawTimelineTable = (entries) => {
    const periodWidth = 100;
    const descWidth = CONTENT_WIDTH - periodWidth;
    const rowHeight = 22;

    for (let i = 0; i < entries.length; i++) {
      checkPageBreak(rowHeight + 4);
      const entry = entries[i];
      const period = typeof entry === 'string' ? entry.split(':')[0] : (entry.period || entry.phase || `Phase ${i + 1}`);
      const desc = typeof entry === 'string' ? entry.split(':').slice(1).join(':').trim() : (entry.description || entry.goal || '');

      // Top border
      drawHLine();
      yPos -= rowHeight - 6;

      // Period (bold)
      page.drawText(sanitize(period), {
        x: LEFT_MARGIN + 8,
        y: yPos,
        size: 9,
        font: fontBold,
        color: COLORS.black,
      });

      // Description — wrap within the available width
      const descWords = sanitize(desc).split(' ');
      let line = '';
      let lineY = yPos;
      const descX = LEFT_MARGIN + periodWidth;
      const maxDescW = descWidth - 12;

      for (const word of descWords) {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, 9) > maxDescW && line) {
          page.drawText(line, { x: descX, y: lineY, size: 9, font, color: COLORS.textGray });
          lineY -= 13;
          line = word;
        } else {
          line = test;
        }
      }
      if (line) {
        page.drawText(line, { x: descX, y: lineY, size: 9, font, color: COLORS.textGray });
      }

      // Adjust yPos to account for wrapped lines
      if (lineY < yPos) yPos = lineY;
      yPos -= 8;
    }
    drawHLine();
    yPos -= 12;
  };

  // ========== WEEKLY SCHEDULE TABLE (multi-compound) ==========
  const drawWeeklySchedule = (protocols) => {
    const dayColWidth = 90;
    const compColWidth = Math.floor((CONTENT_WIDTH - dayColWidth) / protocols.length);
    const rowHeight = 24;
    const headerHeight = 26;

    checkPageBreak(headerHeight + (9 * rowHeight) + 20);

    // Header row (dark bg)
    page.drawRectangle({ x: LEFT_MARGIN, y: yPos - 6, width: CONTENT_WIDTH, height: headerHeight, color: COLORS.darkGray });

    let hx = LEFT_MARGIN;
    page.drawText('Day', { x: hx + 8, y: yPos + 2, size: 9, font: fontBold, color: COLORS.white });
    hx += dayColWidth;

    for (const p of protocols) {
      const label = sanitize(`${p.medication || 'Protocol'} (${p.dose || p.selected_dose || ''})`).substring(0, 40);
      page.drawText(label, { x: hx + 8, y: yPos + 2, size: 8, font: fontBold, color: COLORS.white });
      hx += compColWidth;
    }
    yPos -= headerHeight + 2;

    // Day rows
    for (let d = 0; d < 7; d++) {
      checkPageBreak(rowHeight + 4);

      // Alternate row bg
      if (d % 2 === 0) {
        page.drawRectangle({ x: LEFT_MARGIN, y: yPos - 6, width: CONTENT_WIDTH, height: rowHeight, color: COLORS.lightGray });
      }
      // Row border
      drawHLine({ color: COLORS.borderGray, thickness: 0.3 });

      let rx = LEFT_MARGIN;
      page.drawText(DAYS_FULL[d], { x: rx + 8, y: yPos + 2, size: 9, font, color: COLORS.textGray });
      rx += dayColWidth;

      for (const p of protocols) {
        const activeDays = getActiveDays(p.frequency);
        const isActive = activeDays.includes(d);
        const isOral = isOralMedication(p.medication);
        const isWeekly = isWeeklyMedication(p.frequency);

        let cellText = '--';
        if (isActive) {
          if (isWeekly) {
            cellText = '[check] Inject (weekly dose)';
          } else if (isOral) {
            cellText = '[check] Take dose';
          } else {
            cellText = '[check] Inject at bedtime';
          }
        } else {
          cellText = '-- Rest day';
          if (isWeekly) cellText = '--';
        }

        const cellFont = isActive ? font : font;
        const cellColor = isActive ? COLORS.textGray : COLORS.midGray;
        page.drawText(sanitize(cellText), { x: rx + 8, y: yPos + 2, size: 8.5, font: cellFont, color: cellColor });
        rx += compColWidth;
      }
      yPos -= rowHeight;
    }
    // Bottom border
    drawHLine({ color: COLORS.borderGray, thickness: 0.3 });
    yPos -= 12;
  };

  // ========== INJECTION REMINDER TABLE (for weekly compounds) ==========
  const drawInjectionReminder = (protocol, start) => {
    const startDt = start ? new Date(start) : new Date();
    const colWidths = [80, 190, 80, 154]; // Injection #, Date, Dose, Status
    const headers = ['Injection #', 'Date', 'Dose', 'Status'];
    const rowHeight = 22;
    const headerHeight = 24;
    const numWeeks = 4;

    checkPageBreak(headerHeight + ((numWeeks + 1) * rowHeight) + 20);

    const title = `${protocol.medication || 'Injection'} Reminder -- Next ${numWeeks} Weeks`;
    drawSectionHeader(title);

    // Header row
    let hx = LEFT_MARGIN;
    page.drawRectangle({ x: LEFT_MARGIN, y: yPos - 4, width: CONTENT_WIDTH, height: headerHeight, color: COLORS.darkGray });
    for (let i = 0; i < headers.length; i++) {
      page.drawText(headers[i], { x: hx + 8, y: yPos + 3, size: 8.5, font: fontBold, color: COLORS.white });
      hx += colWidths[i];
    }
    yPos -= headerHeight + 2;

    // Find next injection day (Friday = 5 in JS Date, but we use the start date)
    for (let w = 0; w < numWeeks; w++) {
      checkPageBreak(rowHeight + 4);
      const injDate = new Date(startDt);
      injDate.setDate(injDate.getDate() + (w * 7));

      if (w % 2 === 0) {
        page.drawRectangle({ x: LEFT_MARGIN, y: yPos - 4, width: CONTENT_WIDTH, height: rowHeight, color: COLORS.lightGray });
      }
      drawHLine({ color: COLORS.borderGray, thickness: 0.3 });

      const dateStr = injDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      const status = w === 0 ? '[check] Completed today' : 'Upcoming';
      const rowData = [
        `#${w + 1}`,
        dateStr,
        protocol.dose || protocol.selected_dose || 'N/A',
        status,
      ];

      let rx = LEFT_MARGIN;
      for (let i = 0; i < rowData.length; i++) {
        const f = (i === 0 || (i === 3 && w === 0)) ? fontBold : font;
        page.drawText(sanitize(rowData[i]).substring(0, 45), { x: rx + 8, y: yPos + 2, size: 8.5, font: f, color: COLORS.textGray });
        rx += colWidths[i];
      }
      yPos -= rowHeight;
    }
    drawHLine({ color: COLORS.borderGray, thickness: 0.3 });
    yPos -= 12;
  };

  // ========== GENERAL RECOMMENDATIONS TABLE ==========
  const drawRecommendationsTable = (recommendations) => {
    const labelWidth = 150;
    const descWidth = CONTENT_WIDTH - labelWidth;

    for (let i = 0; i < recommendations.length; i++) {
      const { label, text } = recommendations[i];
      checkPageBreak(36);

      // Top border
      drawHLine({ color: COLORS.borderGray, thickness: 0.3 });
      yPos -= 6;

      // Label (bold)
      page.drawText(sanitize(label), {
        x: LEFT_MARGIN + 12,
        y: yPos,
        size: 9.5,
        font: fontBold,
        color: COLORS.black,
      });

      // Description — wrap
      const descX = LEFT_MARGIN + labelWidth;
      const maxW = descWidth - 16;
      const words = sanitize(text).split(' ');
      let line = '';
      let lineY = yPos;

      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, 9.5) > maxW && line) {
          page.drawText(line, { x: descX, y: lineY, size: 9.5, font, color: COLORS.textGray });
          lineY -= 14;
          line = word;
        } else {
          line = test;
        }
      }
      if (line) {
        page.drawText(line, { x: descX, y: lineY, size: 9.5, font, color: COLORS.textGray });
      }

      yPos = Math.min(yPos, lineY) - 10;
    }
    drawHLine({ color: COLORS.borderGray, thickness: 0.3 });
    yPos -= 12;
  };

  // ================================================================
  // BUILD THE PDF — Benton B. Treatment Plan Format
  // ================================================================

  // ===========================
  // HEADER (white background)
  // ===========================
  // "RANGE MEDICAL" large bold — left
  page.drawText('RANGE MEDICAL', { x: LEFT_MARGIN, y: yPos, size: 22, font: fontBold, color: COLORS.black });

  // Contact info — right aligned
  const contactLine1 = 'range-medical.com | (949) 997-3988';
  const contactLine2 = '1901 Westcliff Drive,';
  const contactLine3 = 'Suite 10, Newport Beach, CA';
  const c1w = font.widthOfTextAtSize(contactLine1, 8.5);
  const c2w = font.widthOfTextAtSize(contactLine2, 8.5);
  const c3w = font.widthOfTextAtSize(contactLine3, 8.5);
  page.drawText(contactLine1, { x: PAGE_WIDTH - RIGHT_MARGIN - c1w, y: yPos + 6, size: 8.5, font, color: COLORS.textGray });
  page.drawText(contactLine2, { x: PAGE_WIDTH - RIGHT_MARGIN - c2w, y: yPos - 6, size: 8.5, font, color: COLORS.textGray });
  page.drawText(contactLine3, { x: PAGE_WIDTH - RIGHT_MARGIN - c3w, y: yPos - 18, size: 8.5, font, color: COLORS.textGray });
  yPos -= 44;

  // Thin line under header
  drawHLine({ color: COLORS.borderGray, thickness: 0.5 });
  yPos -= 16;

  // Subtitle
  const protocolNames = protocols.map(p => p.medication).filter(Boolean);
  const hasWeightLoss = protocols.some(p => {
    const med = (p.medication || '').toLowerCase();
    return med.includes('semaglutide') || med.includes('tirzepatide') || med.includes('retatrutide') ||
      med.includes('glp') || (p.service_category || '').toLowerCase().includes('weight');
  });
  const hasPeptide = protocols.some(p => {
    const cat = (p.service_category || p.program_type || '').toLowerCase();
    return cat.includes('peptide') || cat.includes('gh');
  });

  let subtitle = protocolType || 'Personalized Treatment Protocol';
  if (!protocolType) {
    if (hasPeptide && hasWeightLoss) subtitle = 'Personalized Peptide & Weight Loss Protocol';
    else if (hasWeightLoss) subtitle = 'Personalized Weight Loss Protocol';
    else if (hasPeptide) subtitle = 'Personalized Peptide Protocol';
  }

  page.drawText(sanitize(subtitle), { x: LEFT_MARGIN, y: yPos, size: 16, font: fontBold, color: COLORS.black });
  yPos -= 16;
  page.drawText('Confidential Patient Treatment Plan', { x: LEFT_MARGIN, y: yPos, size: 9.5, font, color: COLORS.midGray });
  yPos -= 24;

  // ===========================
  // PATIENT INFORMATION
  // ===========================
  drawSectionHeader('Patient Information');

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const patientInfoRows = [
    { label: 'Patient Name', value: patientName || 'N/A' },
    { label: 'Plan Issued', value: dateStr },
    { label: 'Prescribing Provider', value: provider || 'Dr. Burgess, Range Medical' },
    { label: 'Protocol Type', value: subtitle },
  ];
  drawKeyValueTable(patientInfoRows);

  // ===========================
  // PROTOCOL OVERVIEW
  // ===========================
  drawSectionHeader('Protocol Overview');

  const overviewRows = [];
  for (let i = 0; i < protocols.length; i++) {
    const p = protocols[i];
    const label = protocols.length > 1 ? `Compound ${i + 1}` : 'Compound';
    const dose = p.dose || p.selected_dose || '';
    overviewRows.push({ label, value: `${p.medication || 'N/A'}${dose ? ` (${dose})` : ''}` });
  }

  // Program duration
  const duration = protocols[0]?.duration || '30 Days (initial cycle)';
  overviewRows.push({ label: 'Program Duration', value: duration });

  // Per-compound schedules
  for (const p of protocols) {
    const med = (p.medication || 'Protocol').split('/')[0].trim();
    const freq = p.frequency || '5 days on / 2 days off';
    const scheduleDesc = isWeeklyMedication(freq)
      ? `Once weekly`
      : freq;
    overviewRows.push({ label: `${med} Schedule`, value: scheduleDesc });
  }

  // Add first injection date for weekly compounds
  const weeklyProtocols = protocols.filter(p => isWeeklyMedication(p.frequency));
  if (weeklyProtocols.length > 0 && startDate) {
    const sd = new Date(startDate);
    const dayName = sd.toLocaleDateString('en-US', { weekday: 'long' });
    const dateFormatted = sd.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    for (const wp of weeklyProtocols) {
      const med = (wp.medication || 'Injection').split('/')[0].trim();
      overviewRows.push({ label: `First ${med} Injection`, value: `${dateFormatted} (today)` });

      // Next 3 injection dates
      const next = [];
      for (let w = 1; w <= 3; w++) {
        const nd = new Date(sd);
        nd.setDate(nd.getDate() + (w * 7));
        next.push(nd.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
      }
      overviewRows.push({ label: `Next 3 Injections`, value: next.join(' / ') });
    }
  }

  drawKeyValueTable(overviewRows);

  // ===========================
  // PER-COMPOUND DETAIL SECTIONS
  // ===========================
  for (let i = 0; i < protocols.length; i++) {
    const p = protocols[i];
    const med = p.medication || 'Unknown';
    const dose = p.dose || p.selected_dose || '';
    const content = cachedContent[med] || {};
    const compNum = protocols.length > 1 ? `Compound ${i + 1} -- ` : '';
    const sectionTitle = `${compNum}${med}${dose ? ` (${dose})` : ''}`;

    // Weekly compounds get frequency in title
    if (isWeeklyMedication(p.frequency)) {
      drawSectionHeader(`${compNum}${med} (${dose} -- Weekly)`);
    } else {
      drawSectionHeader(sectionTitle);
    }

    // What It Is
    if (content.description) {
      drawSubHeader('What It Is');
      drawWrappedText(content.description, { size: 9.5, lineHeight: 14 });
      yPos -= 8;
    }

    // Administration
    if (content.administration) {
      drawSubHeader('Administration');
      drawWrappedText(content.administration, { size: 9.5, lineHeight: 14 });
      yPos -= 8;
    } else {
      // Auto-generate basic administration text
      drawSubHeader('Administration');
      const isOral = isOralMedication(med);
      const freq = p.frequency || '5 days on / 2 days off';
      if (isOral) {
        drawWrappedText(`Oral administration, ${freq}. Take as directed by your provider.`, { size: 9.5 });
      } else if (isWeeklyMedication(freq)) {
        drawWrappedText(`Subcutaneous injection once per week. Your syringes are pre-filled by our clinical team and ready to use.`, { size: 9.5 });
      } else {
        drawWrappedText(`Subcutaneous injection, administered at bedtime on a ${freq} schedule. Injecting at night aligns with your body's natural release cycle and maximizes the anabolic window during sleep. Your syringes are pre-filled by our clinical team.`, { size: 9.5 });
      }
      yPos -= 8;
    }

    // Expected Benefits
    const benefits = content.expected_benefits || [];
    if (benefits.length > 0) {
      drawSubHeader('Expected Benefits');
      for (const benefit of benefits) {
        drawBullet(typeof benefit === 'string' ? benefit : (benefit.text || benefit.description || ''));
      }
      yPos -= 8;
    }

    // Timeline — What to Expect
    const timeline = content.timeline || content.what_to_expect || [];
    if (timeline.length > 0) {
      drawSubHeader('Timeline -- What to Expect');
      drawTimelineTable(timeline);
    }

    // Side Effects to Watch For
    const sideEffects = content.side_effects || [];
    if (sideEffects.length > 0) {
      drawSubHeader('Side Effects to Watch For');
      for (const se of sideEffects) {
        if (typeof se === 'string') {
          // Try to split on first colon for bold lead
          const colonIdx = se.indexOf(':');
          if (colonIdx > 0 && colonIdx < 50) {
            drawBoldLeadBullet(se.substring(0, colonIdx) + ':', se.substring(colonIdx + 1).trim());
          } else {
            drawBullet(se);
          }
        } else if (se.name && se.description) {
          drawBoldLeadBullet(se.name + ':', se.description);
        } else {
          drawBullet(se.text || se.description || JSON.stringify(se));
        }
      }
      yPos -= 8;
    }
  }

  // ===========================
  // YOUR WEEKLY SCHEDULE
  // ===========================
  drawSectionHeader('Your Weekly Schedule');
  drawWeeklySchedule(protocols);

  // ===========================
  // INJECTION REMINDERS (for weekly compounds)
  // ===========================
  for (const p of weeklyProtocols) {
    drawInjectionReminder(p, startDate);
  }

  // ===========================
  // GENERAL RECOMMENDATIONS
  // ===========================
  drawSectionHeader('General Recommendations');

  const recommendations = [
    { label: 'Protein intake', text: 'Aim for a minimum of 1 gram per pound of body weight daily to preserve lean mass.' },
    { label: 'Hydration', text: 'Drink at least 80-100 oz of water daily. GLP-1 agonists can reduce thirst perception.' },
    { label: 'Resistance training', text: '2-4 sessions per week will amplify lean mass retention and metabolic adaptation.' },
    { label: 'Sleep', text: 'Prioritize 7-9 hours. Peptide protocols depend on nighttime GH pulses for maximum efficacy.' },
    { label: 'Alcohol', text: 'Minimize during the protocol -- alcohol disrupts GH secretion and increases GI side effects.' },
  ];

  // Add missed injection guidance per compound
  if (protocols.length > 0) {
    const missedParts = protocols.map(p => {
      const med = (p.medication || 'Medication').split('/')[0].trim();
      if (isWeeklyMedication(p.frequency)) {
        return `${med}: take as soon as remembered if within 3 days; otherwise skip and resume on your normal schedule.`;
      }
      return `${med}: skip and resume the next scheduled day.`;
    });
    recommendations.push({ label: 'Missed injection', text: missedParts.join(' ') });
  }

  drawRecommendationsTable(recommendations);

  // ===========================
  // FINAL FOOTER
  // ===========================
  drawFooter();

  return await pdfDoc.save();
}
