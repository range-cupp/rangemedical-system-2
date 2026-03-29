// lib/protocol-pdf.js
// Patient-facing treatment plan PDF generator for Range Medical
// Matches the Daniel_David_Treatment_Plan reference PDF exactly
// Uses pdf-lib (same as chart-pdf.js)

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// ================================================================
// PAGE CONSTANTS (Letter size, 0.75" margins)
// ================================================================
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const LEFT_MARGIN = 54;
const RIGHT_MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN;
const BOTTOM_MARGIN = 72;
const TOP_MARGIN = 54;

// ================================================================
// COLORS — matching reference PDF
// ================================================================
const COLORS = {
  black: rgb(0, 0, 0),
  darkGray: rgb(0.15, 0.15, 0.15),
  sectionLabel: rgb(0.35, 0.35, 0.35),  // section header labels
  textBody: rgb(0.2, 0.2, 0.2),
  textMuted: rgb(0.45, 0.45, 0.45),
  ruleGray: rgb(0.75, 0.75, 0.75),
  borderLight: rgb(0.85, 0.85, 0.85),
  tableHeaderBg: rgb(0.95, 0.95, 0.95),
  white: rgb(1, 1, 1),
  checkGreen: rgb(0.18, 0.42, 0.21),  // #2E6B35
};

// ================================================================
// SANITIZE — WinAnsi encoding safe
// ================================================================
function sanitize(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\r\n]+/g, ' ')
    .replace(/\t/g, '  ')
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u2192/g, '->')
    .replace(/\u2190/g, '<-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Safe text drawing
function safeDrawText(page, text, opts) {
  const safe = sanitize(String(text || ''));
  try {
    page.drawText(safe, opts);
  } catch (e) {
    const stripped = safe.replace(/[^\x20-\x7E]/g, '');
    page.drawText(stripped, opts);
  }
}

// ================================================================
// SCHEDULE HELPERS
// ================================================================
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getActiveDays(frequency) {
  if (!frequency) return [0, 1, 2, 3, 4];
  const lower = frequency.toLowerCase();
  if (lower.includes('daily') && !lower.includes('5')) return [0, 1, 2, 3, 4, 5, 6];
  if (lower.includes('5 on') || lower.includes('5on') || (lower.includes('mon') && lower.includes('fri'))) return [0, 1, 2, 3, 4];
  if (lower.includes('3x') || lower.includes('three times')) return [0, 2, 4];
  if (lower.includes('2x') || lower.includes('twice')) return [0, 3];
  if (lower.includes('weekly') || lower.includes('1x') || lower.includes('once')) return [4];
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

// Get short compound label for schedule table
function getShortCompoundLabel(medication, dose) {
  if (!medication) return 'Protocol';
  // Shorten "2X Blend: Tesamorelin / Ipamorelin" to "Tesa / Ipa"
  let label = medication;
  if (label.toLowerCase().includes('tesamorelin') && label.toLowerCase().includes('ipamorelin')) {
    label = 'Tesa / Ipa';
  } else if (label.toLowerCase().includes('cjc') && label.toLowerCase().includes('ipamorelin')) {
    label = 'CJC-1295 / Ipamorelin';
  } else if (label.toLowerCase().includes('tesamorelin')) {
    label = 'Tesamorelin';
  } else if (label.toLowerCase().includes('ipamorelin')) {
    label = 'Ipamorelin';
  } else if (label.toLowerCase().includes('cjc')) {
    label = 'CJC-1295';
  }
  // Keep it concise
  if (label.length > 25) {
    label = label.substring(0, 25);
  }
  return dose ? `${label} (${dose})` : label;
}

// Get schedule description text
function getScheduleDescription(frequency) {
  if (!frequency) return '5 days on / 2 days off -- Monday through Friday';
  const lower = frequency.toLowerCase();
  if (lower.includes('5 on') || lower.includes('5on') || lower.includes('5 days')) {
    return '5 days on / 2 days off -- Monday through Friday';
  }
  if (lower.includes('daily')) return 'Daily';
  if (lower.includes('3x')) return '3 times per week';
  if (lower.includes('2x') || lower.includes('twice')) return 'Twice per week';
  if (lower.includes('weekly') || lower.includes('1x') || lower.includes('once')) return 'Once per week';
  if (lower.includes('eod') || lower.includes('every other')) return 'Every other day';
  return frequency;
}

// Short schedule description for table subtitle
function getScheduleDescriptionShort(frequency) {
  if (!frequency) return '5 on / 2 off';
  const lower = frequency.toLowerCase();
  if (lower.includes('5 on') || lower.includes('5on') || lower.includes('5 days')) return '5 on / 2 off';
  if (lower.includes('daily')) return 'Daily';
  if (lower.includes('3x')) return '3x per week';
  if (lower.includes('2x') || lower.includes('twice')) return '2x per week';
  if (lower.includes('weekly') || lower.includes('1x') || lower.includes('once')) return '1x per week';
  if (lower.includes('eod') || lower.includes('every other')) return 'Every other day';
  if (lower.includes('every 5 days')) return 'Every 5 days';
  if (lower.includes('prn') || lower.includes('as needed')) return 'As needed';
  return frequency;
}

// Get administration description
function getAdministrationDescription(medication, frequency) {
  const isOral = isOralMedication(medication);
  if (isOral) return 'Oral -- take as directed';
  if (isWeeklyMedication(frequency)) return 'Subcutaneous injection, once weekly';
  return 'Subcutaneous injection at bedtime';
}

// Get action text for schedule cells
function getActionText(medication, frequency) {
  if (isOralMedication(medication)) return 'Take dose';
  if (isWeeklyMedication(frequency)) return 'Inject';
  return 'Bedtime';
}

// ================================================================
// MAIN EXPORT: generateProtocolPdf
// ================================================================
export async function generateProtocolPdf({
  patientName,
  protocols,
  combineSingleDoc = true,
  cachedContent = {},
  protocolType,
  provider,
  startDate,
  planDate,
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

  // Footer — matches reference: left contact, right disclaimer in italic
  const drawFooter = () => {
    const footerY = 32;
    // Thin rule
    page.drawLine({
      start: { x: LEFT_MARGIN, y: footerY + 22 },
      end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: footerY + 22 },
      thickness: 0.75,
      color: COLORS.ruleGray,
    });

    // Left: contact info
    safeDrawText(page, 'Questions or concerns?', { x: LEFT_MARGIN, y: footerY + 8, size: 8, font: fontBold, color: COLORS.darkGray });
    safeDrawText(page, 'Call or text: (949) 997-3988', { x: LEFT_MARGIN, y: footerY - 2, size: 7.5, font, color: COLORS.textMuted });
    safeDrawText(page, 'range-medical.com', { x: LEFT_MARGIN, y: footerY - 12, size: 7.5, font, color: COLORS.textMuted });

    // Right: disclaimer in italic
    const disclaimerLines = [
      'This document is confidential and intended solely for the named patient. It is not a substitute for',
      'direct medical consultation. Contact Range Medical before making any changes to your protocol.',
    ];
    for (let i = 0; i < disclaimerLines.length; i++) {
      const dw = fontItalic.widthOfTextAtSize(disclaimerLines[i], 7);
      safeDrawText(page, disclaimerLines[i], {
        x: PAGE_WIDTH - RIGHT_MARGIN - dw,
        y: footerY + 8 - (i * 10),
        size: 7,
        font: fontItalic,
        color: COLORS.textMuted,
      });
    }
  };

  // Draw wrapped text with proper leading
  const drawWrappedText = (text, opts = {}) => {
    const { size = 10, indent = 0, maxWidth = CONTENT_WIDTH, lineFont = font, lineColor = COLORS.textBody, lineHeight = 16 } = opts;
    const x = LEFT_MARGIN + indent;
    const effectiveWidth = maxWidth - indent;
    const words = sanitize(String(text || '')).split(' ');
    let line = '';
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const w = lineFont.widthOfTextAtSize(testLine, size);
      if (w > effectiveWidth && line) {
        checkPageBreak(lineHeight + 2);
        safeDrawText(page, line, { x, y: yPos, size, font: lineFont, color: lineColor });
        yPos -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      checkPageBreak(lineHeight + 2);
      safeDrawText(page, line, { x, y: yPos, size, font: lineFont, color: lineColor });
      yPos -= lineHeight;
    }
  };

  // Bullet using en dash (rendered as - in WinAnsi, but styled like reference)
  const drawBullet = (text, opts = {}) => {
    const { indent = 14, size = 10 } = opts;
    checkPageBreak(16);
    const x = LEFT_MARGIN + indent;
    // En dash bullet character
    safeDrawText(page, '-', { x: LEFT_MARGIN + 2, y: yPos, size: 9, font, color: COLORS.textBody });
    drawWrappedText(text, { indent, size, lineHeight: 16 });
  };

  // Bold lead bullet: "Bold text: normal continuation"
  const drawBoldLeadBullet = (boldText, normalText, opts = {}) => {
    const { indent = 14, size = 10 } = opts;
    const x = LEFT_MARGIN + indent;
    checkPageBreak(16);

    // En dash bullet
    safeDrawText(page, '-', { x: LEFT_MARGIN + 2, y: yPos, size: 9, font, color: COLORS.textBody });

    // Bold part
    const boldStr = sanitize(boldText) + (normalText ? ' ' : '');
    safeDrawText(page, boldStr, { x, y: yPos, size, font: fontBold, color: COLORS.textBody });
    const boldWidth = fontBold.widthOfTextAtSize(boldStr, size);

    if (normalText) {
      const effectiveWidth = CONTENT_WIDTH - indent;
      const normalStr = sanitize(normalText);
      const firstLineWidth = effectiveWidth - boldWidth;
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
        safeDrawText(page, firstLine, { x: x + boldWidth, y: yPos, size, font, color: COLORS.textBody });
      }
      yPos -= 16;

      if (remaining.length > 0) {
        drawWrappedText(remaining.join(' '), { indent, size });
      }
    } else {
      yPos -= 16;
    }
  };

  // ========== SECTION HEADER: small-caps gray label + thin rule ==========
  // Reference style: "PATIENT INFORMATION" in small gray caps, thin rule underneath
  // NEVER solid black bars
  const drawSectionHeader = (title) => {
    checkPageBreak(30);
    yPos -= 18;
    const labelText = sanitize(title).toUpperCase();
    safeDrawText(page, labelText, {
      x: LEFT_MARGIN,
      y: yPos,
      size: 8.5,
      font: fontBold,
      color: COLORS.sectionLabel,
    });
    yPos -= 8;
    // Thin rule underneath (matching reference)
    page.drawLine({
      start: { x: LEFT_MARGIN, y: yPos },
      end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: yPos },
      thickness: 0.75,
      color: COLORS.ruleGray,
    });
    yPos -= 16;
  };

  // Sub-header (bold text, smaller, no rule)
  const drawSubHeader = (title) => {
    checkPageBreak(24);
    yPos -= 6;
    safeDrawText(page, sanitize(title), { x: LEFT_MARGIN, y: yPos, size: 10.5, font: fontBold, color: COLORS.darkGray });
    yPos -= 16;
  };

  // Horizontal line
  const drawHLine = (opts = {}) => {
    const { indent = 0, color = COLORS.borderLight, thickness = 0.5 } = opts;
    page.drawLine({
      start: { x: LEFT_MARGIN + indent, y: yPos },
      end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: yPos },
      thickness,
      color,
    });
  };

  // ========== KEY-VALUE TABLE (Patient Info / Protocol Overview) ==========
  // Reference style: label bold on left, value regular on right, thin row borders
  const drawKeyValueTable = (rows) => {
    const labelWidth = 170;
    const rowHeight = 28;

    for (let i = 0; i < rows.length; i++) {
      checkPageBreak(rowHeight + 4);
      const { label, value } = rows[i];

      // Top border line
      drawHLine({ color: COLORS.borderLight });
      const textY = yPos - 18;

      // Label (bold)
      safeDrawText(page, sanitize(label), {
        x: LEFT_MARGIN + 12,
        y: textY,
        size: 10,
        font: fontBold,
        color: COLORS.darkGray,
      });

      // Value
      safeDrawText(page, sanitize(String(value || 'N/A')).substring(0, 100), {
        x: LEFT_MARGIN + labelWidth,
        y: textY,
        size: 10,
        font,
        color: COLORS.textBody,
      });

      yPos -= rowHeight;
    }
    // Bottom border
    drawHLine({ color: COLORS.borderLight });
    yPos -= 8;
  };

  // ========== TIMELINE TABLE (2-column: Timeframe | What to Expect) ==========
  const drawTimelineTable = (entries) => {
    const periodWidth = 110;
    const headerHeight = 26;
    const rowPadding = 12;

    checkPageBreak(headerHeight + entries.length * 30 + 20);

    // Header row with light gray bg
    page.drawRectangle({
      x: LEFT_MARGIN,
      y: yPos - headerHeight + 6,
      width: CONTENT_WIDTH,
      height: headerHeight,
      color: COLORS.tableHeaderBg,
    });
    // Header top border
    page.drawLine({
      start: { x: LEFT_MARGIN, y: yPos + 6 },
      end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: yPos + 6 },
      thickness: 0.5, color: COLORS.borderLight,
    });

    // Header labels (small caps style)
    safeDrawText(page, 'TIMEFRAME', { x: LEFT_MARGIN + 10, y: yPos - 8, size: 7.5, font: fontBold, color: COLORS.sectionLabel });
    safeDrawText(page, 'WHAT TO EXPECT', { x: LEFT_MARGIN + periodWidth, y: yPos - 8, size: 7.5, font: fontBold, color: COLORS.sectionLabel });

    yPos -= headerHeight;
    // Header bottom border
    page.drawLine({
      start: { x: LEFT_MARGIN, y: yPos + 6 },
      end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: yPos + 6 },
      thickness: 0.5, color: COLORS.borderLight,
    });

    // Data rows
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const period = typeof entry === 'string' ? entry.split(':')[0] : (entry.period || entry.phase || `Phase ${i + 1}`);
      const desc = typeof entry === 'string' ? entry.split(':').slice(1).join(':').trim() : (entry.description || entry.goal || '');

      checkPageBreak(30);

      const textY = yPos - 10;

      // Period (regular weight in reference)
      safeDrawText(page, sanitize(period), {
        x: LEFT_MARGIN + 10,
        y: textY,
        size: 9.5,
        font,
        color: COLORS.textBody,
      });

      // Description — wrap within available width
      const descX = LEFT_MARGIN + periodWidth;
      const maxDescW = CONTENT_WIDTH - periodWidth - 10;
      const descStr = sanitize(desc);
      const descWords = descStr.split(' ');
      let line = '';
      let lineY = textY;

      for (const word of descWords) {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, 9.5) > maxDescW && line) {
          safeDrawText(page, line, { x: descX, y: lineY, size: 9.5, font, color: COLORS.textBody });
          lineY -= 14;
          line = word;
        } else {
          line = test;
        }
      }
      if (line) {
        safeDrawText(page, line, { x: descX, y: lineY, size: 9.5, font, color: COLORS.textBody });
      }

      const lowestY = Math.min(textY, lineY);
      yPos = lowestY - rowPadding;

      // Row bottom border
      page.drawLine({
        start: { x: LEFT_MARGIN, y: yPos + 4 },
        end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: yPos + 4 },
        thickness: 0.5, color: COLORS.borderLight,
      });
    }
    yPos -= 8;
  };

  // ========== HORIZONTAL WEEKLY SCHEDULE TABLE ==========
  // Reference: columns = Day | Mon | Tue | Wed | Thu | Fri | Sat | Sun
  // Each compound is a row. Active days show checkmark + action text stacked. Rest days show "Rest"
  const drawWeeklyScheduleHorizontal = (protocols) => {
    const firstColWidth = 150; // "Day" / compound name column
    const dayColWidth = Math.floor((CONTENT_WIDTH - firstColWidth) / 7);
    const headerHeight = 28;
    const dataRowHeight = 44; // taller to fit checkmark + "Bedtime" stacked

    const totalHeight = headerHeight + (protocols.length * dataRowHeight) + 10;
    checkPageBreak(totalHeight);

    // Header row with light gray bg
    const headerTop = yPos + 6;
    page.drawRectangle({
      x: LEFT_MARGIN,
      y: yPos - headerHeight + 6,
      width: CONTENT_WIDTH,
      height: headerHeight,
      color: COLORS.tableHeaderBg,
    });
    // Header borders
    page.drawLine({ start: { x: LEFT_MARGIN, y: headerTop }, end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: headerTop }, thickness: 0.5, color: COLORS.borderLight });
    page.drawLine({ start: { x: LEFT_MARGIN, y: yPos - headerHeight + 6 }, end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: yPos - headerHeight + 6 }, thickness: 0.5, color: COLORS.borderLight });

    // "Day" header
    safeDrawText(page, 'Day', { x: LEFT_MARGIN + 10, y: yPos - 8, size: 9, font, color: COLORS.textBody });

    // Day column headers: Mon, Tue, etc.
    for (let d = 0; d < 7; d++) {
      const dx = LEFT_MARGIN + firstColWidth + (d * dayColWidth);
      safeDrawText(page, DAYS_SHORT[d], { x: dx + 4, y: yPos - 8, size: 9, font: fontBold, color: COLORS.darkGray });
    }

    yPos -= headerHeight;

    // Data rows — one per compound
    for (let pi = 0; pi < protocols.length; pi++) {
      const p = protocols[pi];
      const activeDays = getActiveDays(p.frequency);
      const dose = p.dose || p.selected_dose || '';
      const compLabel = getShortCompoundLabel(p.medication, dose);
      const actionText = getActionText(p.medication, p.frequency);

      checkPageBreak(dataRowHeight + 4);

      const rowTop = yPos + 6;

      // Compound name in first column
      safeDrawText(page, compLabel, {
        x: LEFT_MARGIN + 10,
        y: yPos - 12,
        size: 9.5,
        font,
        color: COLORS.textBody,
      });
      // Frequency label below compound name (e.g., "Daily" or "5 on / 2 off")
      const freqLabel = getScheduleDescriptionShort(p.frequency);
      safeDrawText(page, freqLabel, {
        x: LEFT_MARGIN + 10,
        y: yPos - 24,
        size: 7,
        font: fontItalic,
        color: COLORS.textMuted,
      });

      // Day cells
      for (let d = 0; d < 7; d++) {
        const dx = LEFT_MARGIN + firstColWidth + (d * dayColWidth);
        const isActive = activeDays.includes(d);

        if (isActive) {
          // Green checkmark (using "v" shape drawn as text in bold green)
          // We'll draw a larger green "v" character to simulate checkmark
          safeDrawText(page, 'v', {
            x: dx + 4,
            y: yPos - 10,
            size: 13,
            font: fontBold,
            color: COLORS.checkGreen,
          });
          // Action text below checkmark (e.g., "Bedtime")
          safeDrawText(page, actionText, {
            x: dx + 4,
            y: yPos - 24,
            size: 8,
            font: fontBold,
            color: COLORS.darkGray,
          });
        } else {
          // Rest day
          safeDrawText(page, 'Rest', {
            x: dx + 4,
            y: yPos - 16,
            size: 9,
            font,
            color: COLORS.textMuted,
          });
        }
      }

      yPos -= dataRowHeight;

      // Row bottom border
      page.drawLine({
        start: { x: LEFT_MARGIN, y: yPos + 6 },
        end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: yPos + 6 },
        thickness: 0.5, color: COLORS.borderLight,
      });
    }
    yPos -= 8;
  };

  // ========== RECOMMENDATIONS TABLE ==========
  const drawRecommendationsTable = (recommendations) => {
    const labelWidth = 160;

    for (let i = 0; i < recommendations.length; i++) {
      const { label, text } = recommendations[i];
      checkPageBreak(40);

      // Top border
      drawHLine({ color: COLORS.borderLight, thickness: 0.5 });
      yPos -= 4;

      const textY = yPos - 12;

      // Label (bold)
      safeDrawText(page, sanitize(label), {
        x: LEFT_MARGIN + 12,
        y: textY,
        size: 10,
        font: fontBold,
        color: COLORS.darkGray,
      });

      // Description — wrap
      const descX = LEFT_MARGIN + labelWidth;
      const maxW = CONTENT_WIDTH - labelWidth - 10;
      const descStr = sanitize(text);
      const words = descStr.split(' ');
      let line = '';
      let lineY = textY;

      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, 10) > maxW && line) {
          safeDrawText(page, line, { x: descX, y: lineY, size: 10, font, color: COLORS.textBody });
          lineY -= 15;
          line = word;
        } else {
          line = test;
        }
      }
      if (line) {
        safeDrawText(page, line, { x: descX, y: lineY, size: 10, font, color: COLORS.textBody });
      }

      yPos = Math.min(yPos - 12, lineY) - 10;
    }
    drawHLine({ color: COLORS.borderLight, thickness: 0.5 });
    yPos -= 12;
  };

  // ================================================================
  // BUILD THE PDF — matching reference exactly
  // ================================================================

  // ===========================
  // HEADER — "RANGE MEDICAL" all caps, bold, left-aligned
  // Contact info right-aligned on same line
  // Black rule underneath (1.5pt)
  // ===========================
  safeDrawText(page, 'RANGE MEDICAL', {
    x: LEFT_MARGIN,
    y: yPos,
    size: 17,
    font: fontBold,
    color: COLORS.black,
  });

  // Contact info — right-aligned, two lines
  const contactLine1 = 'range-medical.com  *  (949) 997-3988';
  const contactLine2 = '1901 Westcliff Drive, Suite 10, Newport Beach, CA';
  const c1w = font.widthOfTextAtSize(contactLine1, 8.5);
  const c2w = font.widthOfTextAtSize(contactLine2, 8.5);
  safeDrawText(page, contactLine1, { x: PAGE_WIDTH - RIGHT_MARGIN - c1w, y: yPos + 4, size: 8.5, font, color: COLORS.textMuted });
  safeDrawText(page, contactLine2, { x: PAGE_WIDTH - RIGHT_MARGIN - c2w, y: yPos - 8, size: 8.5, font, color: COLORS.textMuted });
  yPos -= 24;

  // 1.5pt BLACK rule under header (matching reference)
  page.drawLine({
    start: { x: LEFT_MARGIN, y: yPos },
    end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: yPos },
    thickness: 1.5,
    color: COLORS.black,
  });
  yPos -= 30;

  // ===========================
  // TITLE — 17pt bold "Personalized Treatment Protocol"
  // Subtitle — italic "Confidential Patient Treatment Plan"
  // ===========================
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

  let titleText = 'Personalized Treatment Protocol';
  safeDrawText(page, titleText, {
    x: LEFT_MARGIN,
    y: yPos,
    size: 22,
    font: fontBold,
    color: COLORS.black,
  });
  yPos -= 20;

  safeDrawText(page, 'Confidential Patient Treatment Plan', {
    x: LEFT_MARGIN,
    y: yPos,
    size: 10,
    font: fontItalic,
    color: COLORS.textMuted,
  });
  yPos -= 14;

  // ===========================
  // PATIENT INFORMATION
  // ===========================
  drawSectionHeader('Patient Information');

  const issueDateObj = planDate ? new Date(planDate + 'T00:00:00') : new Date();
  const dateStr = issueDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Determine protocol type label
  let protocolTypeLabel = protocolType || 'Personalized Treatment Protocol';
  if (!protocolType) {
    if (hasPeptide && hasWeightLoss) protocolTypeLabel = 'Peptide & Weight Loss Protocol';
    else if (hasWeightLoss) protocolTypeLabel = 'Weight Loss Protocol';
    else if (hasPeptide) protocolTypeLabel = 'GH Secretagogue Optimization';
  }

  const patientInfoRows = [
    { label: 'Patient Name', value: patientName || 'N/A' },
    { label: 'Plan Issued', value: dateStr },
  ];

  if (provider) {
    patientInfoRows.push({ label: 'Prescribing Provider', value: provider });
  }

  patientInfoRows.push({ label: 'Protocol Type', value: protocolTypeLabel });

  drawKeyValueTable(patientInfoRows);

  // ===========================
  // PROTOCOL OVERVIEW — with Schedule, Administration, Cycle rows
  // ===========================
  drawSectionHeader('Protocol Overview');

  const overviewRows = [];

  // Compound(s)
  for (let i = 0; i < protocols.length; i++) {
    const p = protocols[i];
    const label = protocols.length > 1 ? `Compound ${i + 1}` : 'Compound';
    const dose = p.dose || p.selected_dose || '';
    overviewRows.push({ label, value: `${p.medication || 'N/A'}${dose ? ` (${dose})` : ''}` });
  }

  // Program Duration
  const duration = protocols[0]?.duration || '30 days (initial cycle)';
  overviewRows.push({ label: 'Program Duration', value: duration });

  // Schedule
  const freq = protocols[0]?.frequency || '5 days on / 2 days off';
  const scheduleDesc = getScheduleDescription(freq);
  overviewRows.push({ label: 'Schedule', value: scheduleDesc });

  // Administration
  const adminDesc = getAdministrationDescription(protocols[0]?.medication, freq);
  overviewRows.push({ label: 'Administration', value: adminDesc });

  // Cycle (for peptides)
  if (hasPeptide) {
    overviewRows.push({ label: 'Cycle', value: '90 days on / 28 days off' });
  }

  drawKeyValueTable(overviewRows);

  // ===========================
  // YOUR PROTOCOL — section label then per-compound detail
  // ===========================
  drawSectionHeader('Your Protocol');

  for (let i = 0; i < protocols.length; i++) {
    const p = protocols[i];
    const med = p.medication || 'Unknown';
    const dose = p.dose || p.selected_dose || '';
    // Fuzzy content lookup: try full name, then stripped blend prefix, then individual components
    let content = cachedContent[med] || {};
    if (!content.description) {
      const stripped = med.replace(/^\d+[Xx]\s*Blend[:\s]*/i, '').trim();
      content = cachedContent[stripped] || {};
      if (!content.description) {
        const parts = stripped.split(/\s*[\/,]\s*/).map(s => s.trim()).filter(Boolean);
        for (const part of parts) {
          if (cachedContent[part] && cachedContent[part].description) {
            content = cachedContent[part];
            break;
          }
        }
      }
    }

    checkPageBreak(60);

    // Compound name — 14pt bold (matching reference: large bold compound title)
    yPos -= 4;
    const compTitle = dose ? `${med} (${dose})` : med;
    safeDrawText(page, sanitize(compTitle), {
      x: LEFT_MARGIN,
      y: yPos,
      size: 14,
      font: fontBold,
      color: COLORS.black,
    });
    yPos -= 22;

    // What It Is
    if (content.description) {
      drawSubHeader('What It Is');
      drawWrappedText(content.description, { size: 10, lineHeight: 16 });
      yPos -= 8;
    }

    // Administration
    drawSubHeader('Administration');
    if (content.administration) {
      drawWrappedText(content.administration, { size: 10, lineHeight: 16 });
    } else {
      const isOral = isOralMedication(med);
      const pFreq = p.frequency || '5 days on / 2 days off';
      const medLower = med.toLowerCase();
      if (isOral) {
        drawWrappedText(`Oral administration, ${pFreq}. Take as directed by your provider.`, { size: 10 });
      } else if (isWeeklyMedication(pFreq)) {
        drawWrappedText('Subcutaneous injection once per week. Your syringes are pre-filled by our clinical team and ready to use.', { size: 10 });
      } else if (medLower.includes('ghk')) {
        drawWrappedText('Subcutaneous injection into the lower abdomen, at least 2 inches from the navel. Rotate the injection site slightly each day. Insert at 45 to 90 degrees. GHK-Cu supports tissue repair, collagen production, and recovery \u2014 administer once daily as directed by your provider.', { size: 10, lineHeight: 16 });
      } else if (medLower.includes('bpc') || medLower.includes('tb-500') || medLower.includes('tb500')) {
        drawWrappedText('Subcutaneous injection into the lower abdomen, at least 2 inches from the navel. Rotate the injection site slightly each day. Insert at 45 to 90 degrees. This peptide supports tissue repair and recovery \u2014 administer once daily as directed by your provider.', { size: 10, lineHeight: 16 });
      } else {
        drawWrappedText('Subcutaneous injection into the lower abdomen, at least 2 inches from the navel. Rotate the spot slightly each day. Insert at 45 to 90 degrees. Administer at bedtime to align with your body\'s natural GH release cycle and maximize the anabolic window during sleep. Dispose responsibly.', { size: 10 });
      }
    }
    yPos -= 8;

    // Expected Benefits (bulleted with en dashes)
    const benefits = content.expected_benefits || [];
    if (benefits.length > 0) {
      drawSubHeader('Expected Benefits');
      for (const benefit of benefits) {
        drawBullet(typeof benefit === 'string' ? benefit : (benefit.text || benefit.description || ''));
      }
      yPos -= 8;
    }

    // Timeline table
    const timeline = content.timeline || content.what_to_expect || [];
    if (timeline.length > 0) {
      drawSubHeader('Timeline -- What to Expect');
      drawTimelineTable(timeline);
    }

    // Side Effects (bulleted with en dashes)
    const sideEffects = content.side_effects || [];
    if (sideEffects.length > 0) {
      drawSubHeader('Side Effects to Watch For');
      for (const se of sideEffects) {
        if (typeof se === 'string') {
          const colonIdx = se.indexOf(':');
          if (colonIdx > 0 && colonIdx < 50) {
            drawBoldLeadBullet(se.substring(0, colonIdx) + ' --', se.substring(colonIdx + 1).trim());
          } else {
            drawBullet(se);
          }
        } else if (se.name && se.description) {
          drawBoldLeadBullet(se.name + ' --', se.description);
        } else {
          drawBullet(se.text || se.description || JSON.stringify(se));
        }
      }
      yPos -= 8;
    }

    // Spacer between compounds
    if (i < protocols.length - 1) {
      yPos -= 10;
    }
  }

  // ===========================
  // YOUR WEEKLY SCHEDULE — horizontal table
  // ===========================
  drawSectionHeader('Your Weekly Schedule');
  drawWeeklyScheduleHorizontal(protocols);

  // ===========================
  // GENERAL RECOMMENDATIONS
  // ===========================
  drawSectionHeader('General Recommendations');

  const recommendations = [
    { label: 'Protein intake', text: 'Minimum 1g per pound of body weight daily to preserve lean mass.' },
    { label: 'Hydration', text: 'At least 80-100 oz of water daily.' },
    { label: 'Resistance training', text: '2-4 sessions per week to amplify lean mass retention and metabolic adaptation.' },
    { label: 'Sleep', text: 'Prioritize 7-9 hours. This protocol depends on nighttime GH pulses for maximum efficacy.' },
    { label: 'Alcohol', text: 'Minimize -- alcohol disrupts GH secretion and amplifies side effects.' },
  ];

  // Missed injection recommendation
  if (protocols.length > 0) {
    const missedParts = protocols.map(p => {
      const med = (p.medication || 'Medication').split('/')[0].trim();
      if (isWeeklyMedication(p.frequency)) {
        return `Take as soon as remembered if within 3 days; otherwise skip and resume on your normal schedule.`;
      }
      return `Skip and resume the next scheduled day. Do not double up.`;
    });
    recommendations.push({ label: 'Missed injection', text: missedParts[0] });
  }

  drawRecommendationsTable(recommendations);

  // ===========================
  // FINAL FOOTER
  // ===========================
  drawFooter();

  return await pdfDoc.save();
}
