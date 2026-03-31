// pages/api/labs/synopsis-pdf.js
// Generates a polished PDF from the AI Clinical Synopsis for a lab

import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Colors matching Range Medical brand
const BLACK = rgb(0.04, 0.04, 0.04);
const DARK_GRAY = rgb(0.1, 0.1, 0.1);
const MID_GRAY = rgb(0.38, 0.38, 0.38);
const LIGHT_GRAY = rgb(0.96, 0.96, 0.96);
const RULE_GRAY = rgb(0.87, 0.87, 0.87);
const WHITE = rgb(1, 1, 1);
const GREEN = rgb(0.18, 0.42, 0.21);
const INDIGO = rgb(0.26, 0.22, 0.79);
const INDIGO_LIGHT = rgb(0.96, 0.95, 1);
const FLAG_RED = rgb(0.85, 0.15, 0.15);
const FLAG_AMBER = rgb(0.72, 0.53, 0.04);

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lab_id } = req.query;
    if (!lab_id) return res.status(400).json({ error: 'lab_id required' });

    // Fetch lab with synopsis
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .select('id, patient_id, test_date, panel_type, lab_provider, ai_synopsis, ai_synopsis_generated_at')
      .eq('id', lab_id)
      .single();

    if (labError || !lab) return res.status(404).json({ error: 'Lab not found' });
    if (!lab.ai_synopsis) return res.status(400).json({ error: 'No synopsis available for this lab' });

    // Fetch patient
    const { data: patient } = await supabase
      .from('patients')
      .select('first_name, last_name, date_of_birth, gender')
      .eq('id', lab.patient_id)
      .single();

    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    // Fetch flagged biomarker count for summary
    const { data: labResults } = await supabase
      .from('lab_results')
      .select('flag')
      .eq('lab_id', lab_id);

    const totalMarkers = labResults?.length || 0;
    const flaggedCount = labResults?.filter(r => r.flag === 'high' || r.flag === 'low').length || 0;
    const borderlineCount = labResults?.filter(r => r.flag === 'borderline_high' || r.flag === 'borderline_low').length || 0;

    // Build PDF
    const pdfDoc = await PDFDocument.create();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    const fontBoldItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;
    let pageNum = 1;

    const addPage = () => {
      pageNum++;
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
      // Continuation header
      drawText('RANGE MEDICAL', MARGIN, y, { font: fontBold, size: 9, color: MID_GRAY });
      drawText(`AI Clinical Synopsis \u2014 ${patient.first_name} ${patient.last_name}`, MARGIN + 110, y, { font: fontRegular, size: 9, color: MID_GRAY });
      const pageStr = `Page ${pageNum}`;
      const pageW = fontRegular.widthOfTextAtSize(pageStr, 9);
      drawText(pageStr, PAGE_WIDTH - MARGIN - pageW, y, { font: fontRegular, size: 9, color: MID_GRAY });
      y -= 8;
      drawLine(MARGIN, y, PAGE_WIDTH - MARGIN, y, RULE_GRAY, 0.5);
      y -= 20;
    };

    const ensureSpace = (needed) => {
      if (y - needed < MARGIN + 40) addPage();
    };

    const drawText = (text, x, yPos, opts = {}) => {
      const font = opts.font || fontRegular;
      const size = opts.size || 9.5;
      const color = opts.color || DARK_GRAY;
      page.drawText(text, { x, y: yPos, size, font, color });
    };

    const drawLine = (x1, y1, x2, y2, color = RULE_GRAY, thickness = 0.5) => {
      page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color, thickness });
    };

    const drawRect = (x, yPos, w, h, color) => {
      page.drawRectangle({ x, y: yPos, width: w, height: h, color });
    };

    // Word wrap helper
    const wrapText = (text, font, fontSize, maxWidth) => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, fontSize);
        if (width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    // ===== HEADER =====
    drawText('RANGE MEDICAL', MARGIN, y, { font: fontBold, size: 13, color: BLACK });
    const contactLine1 = 'range-medical.com  \u2022  (949) 997-3988';
    const contactLine2 = '1901 Westcliff Drive, Suite 10, Newport Beach, CA';
    const c1W = fontRegular.widthOfTextAtSize(contactLine1, 8);
    const c2W = fontRegular.widthOfTextAtSize(contactLine2, 8);
    drawText(contactLine1, PAGE_WIDTH - MARGIN - c1W, y + 2, { font: fontRegular, size: 8, color: MID_GRAY });
    drawText(contactLine2, PAGE_WIDTH - MARGIN - c2W, y - 10, { font: fontRegular, size: 8, color: MID_GRAY });
    y -= 18;
    drawLine(MARGIN, y, PAGE_WIDTH - MARGIN, y, BLACK, 1.5);
    y -= 24;

    // ===== TITLE =====
    drawText('AI CLINICAL SYNOPSIS', MARGIN, y, { font: fontBold, size: 17, color: BLACK });
    y -= 16;
    const testDateFormatted = lab.test_date
      ? new Date(lab.test_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'N/A';
    drawText(`Lab results from ${testDateFormatted}`, MARGIN, y, { font: fontItalic, size: 9.5, color: MID_GRAY });
    y -= 22;

    // ===== PATIENT INFO SECTION =====
    // Section label
    drawText('PATIENT INFORMATION', MARGIN, y, { font: fontBold, size: 8, color: MID_GRAY });
    y -= 6;
    drawLine(MARGIN, y, PAGE_WIDTH - MARGIN, y, RULE_GRAY, 0.75);
    y -= 18;

    // Info rows
    const patientName = `${patient.first_name} ${patient.last_name}`;
    const dob = patient.date_of_birth
      ? new Date(patient.date_of_birth + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'N/A';
    const gender = patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'N/A';
    const panelType = lab.panel_type || 'N/A';

    const infoRows = [
      ['Patient Name', patientName],
      ['Date of Birth', dob],
      ['Gender', gender],
      ['Panel Type', panelType],
      ['Test Date', testDateFormatted],
    ];

    const col1Width = 120;
    infoRows.forEach((row, idx) => {
      const rowY = y;
      if (idx % 2 === 0) {
        drawRect(MARGIN, rowY - 5, CONTENT_WIDTH, 18, LIGHT_GRAY);
      }
      drawText(row[0], MARGIN + 10, rowY, { font: fontBold, size: 9.5, color: BLACK });
      drawText(row[1], MARGIN + col1Width, rowY, { font: fontRegular, size: 9.5, color: DARK_GRAY });
      y -= 18;
    });

    y -= 8;

    // ===== SUMMARY STATS =====
    if (totalMarkers > 0) {
      drawText('RESULTS OVERVIEW', MARGIN, y, { font: fontBold, size: 8, color: MID_GRAY });
      y -= 6;
      drawLine(MARGIN, y, PAGE_WIDTH - MARGIN, y, RULE_GRAY, 0.75);
      y -= 18;

      const summaryText = `${totalMarkers} biomarkers tested`;
      drawText(summaryText, MARGIN + 10, y, { font: fontRegular, size: 9.5 });

      if (flaggedCount > 0) {
        const flagStr = `  \u2022  ${flaggedCount} flagged`;
        const offset = fontRegular.widthOfTextAtSize(summaryText, 9.5);
        drawText(flagStr, MARGIN + 10 + offset, y, { font: fontBold, size: 9.5, color: FLAG_RED });

        if (borderlineCount > 0) {
          const borderStr = `  \u2022  ${borderlineCount} borderline`;
          const offset2 = offset + fontBold.widthOfTextAtSize(flagStr, 9.5);
          drawText(borderStr, MARGIN + 10 + offset2, y, { font: fontBold, size: 9.5, color: FLAG_AMBER });
        }
      }
      y -= 24;
    }

    // ===== SYNOPSIS CONTENT =====
    drawText('CLINICAL ANALYSIS', MARGIN, y, { font: fontBold, size: 8, color: MID_GRAY });
    y -= 6;
    drawLine(MARGIN, y, PAGE_WIDTH - MARGIN, y, RULE_GRAY, 0.75);
    y -= 16;

    // Parse the synopsis text into lines and render
    const synopsisLines = lab.ai_synopsis.split('\n');
    const bodyFontSize = 9.5;
    const bodyLeading = 16;
    const headingPatterns = [
      /^#{1,3}\s+/,               // Markdown headers
      /^[A-Z][A-Z\s&\/\-:()]{4,}$/,  // ALL-CAPS lines (section headers)
      /^\d+\.\s+[A-Z]/,           // Numbered sections
      /^[A-Z][A-Z\s]+:/,          // LABEL: style headers
    ];

    const bulletPatterns = [
      /^[\u2013\u2022\-\*]\s+/,   // en-dash, bullet, hyphen, asterisk
      /^\s+[\u2013\u2022\-\*]\s+/, // indented bullets
    ];

    for (let i = 0; i < synopsisLines.length; i++) {
      const rawLine = synopsisLines[i];
      const trimmed = rawLine.trim();

      // Skip empty lines — just add spacing
      if (!trimmed) {
        y -= 6;
        continue;
      }

      // Detect section headers
      const isHeader = headingPatterns.some(p => p.test(trimmed));

      if (isHeader) {
        ensureSpace(30);
        y -= 6; // Extra space before header

        // Clean header text
        let headerText = trimmed
          .replace(/^#{1,3}\s+/, '')
          .replace(/^\d+\.\s+/, '')
          .replace(/:$/, '');

        // Draw as section header (small caps gray + rule)
        drawText(headerText.toUpperCase(), MARGIN, y, { font: fontBold, size: 10, color: INDIGO });
        y -= 5;
        drawLine(MARGIN, y, MARGIN + CONTENT_WIDTH * 0.4, y, rgb(0.78, 0.82, 0.99), 0.75);
        y -= 14;
        continue;
      }

      // Detect bullet points
      const isBullet = bulletPatterns.some(p => p.test(trimmed));

      if (isBullet) {
        const bulletText = trimmed.replace(/^[\s\u2013\u2022\-\*]+\s*/, '');
        const bulletIndent = 14;
        const bulletWidth = CONTENT_WIDTH - bulletIndent;
        const wrappedLines = wrapText(bulletText, fontRegular, bodyFontSize, bulletWidth);

        ensureSpace(wrappedLines.length * bodyLeading + 4);

        // Draw en-dash bullet
        drawText('\u2013', MARGIN + 4, y, { font: fontRegular, size: bodyFontSize, color: INDIGO });

        wrappedLines.forEach((line, lineIdx) => {
          drawText(line, MARGIN + bulletIndent + 4, y, { font: fontRegular, size: bodyFontSize, color: DARK_GRAY });
          y -= bodyLeading;
        });
        y -= 2; // Small gap after bullet
        continue;
      }

      // Regular body text — word wrap
      // Check for bold markers like **text**
      const cleanedLine = trimmed.replace(/\*\*/g, '');
      const hasBold = trimmed.includes('**');

      const textFont = hasBold ? fontBold : fontRegular;
      const wrappedLines = wrapText(cleanedLine, textFont, bodyFontSize, CONTENT_WIDTH);

      ensureSpace(wrappedLines.length * bodyLeading);

      wrappedLines.forEach(line => {
        drawText(line, MARGIN, y, { font: textFont, size: bodyFontSize, color: DARK_GRAY });
        y -= bodyLeading;
      });
    }

    // ===== FOOTER =====
    ensureSpace(60);
    y -= 12;
    drawLine(MARGIN, y, PAGE_WIDTH - MARGIN, y, RULE_GRAY, 0.5);
    y -= 16;

    // Footer left
    drawText('Questions or concerns?', MARGIN, y, { font: fontBold, size: 8.5, color: DARK_GRAY });
    y -= 12;
    drawText('Call or text: (949) 997-3988  \u2022  range-medical.com', MARGIN, y, { font: fontRegular, size: 8, color: MID_GRAY });

    // Footer right — disclaimer
    const disclaimerLines = wrapText(
      'This AI-generated synopsis is intended as a clinical decision support tool for Range Medical providers. ' +
      'It is not a substitute for professional medical judgment. All treatment decisions should be made by a licensed provider.',
      fontItalic, 7.5, CONTENT_WIDTH * 0.55
    );
    let disclaimerY = y + 12;
    disclaimerLines.forEach(line => {
      const lineW = fontItalic.widthOfTextAtSize(line, 7.5);
      drawText(line, PAGE_WIDTH - MARGIN - CONTENT_WIDTH * 0.55, disclaimerY, { font: fontItalic, size: 7.5, color: MID_GRAY });
      disclaimerY -= 10;
    });

    y -= 16;
    const genDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const synopsisDate = lab.ai_synopsis_generated_at
      ? new Date(lab.ai_synopsis_generated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : genDate;
    const genStr = `Synopsis generated: ${synopsisDate}  \u2022  PDF generated: ${genDate}`;
    drawText(genStr, MARGIN, y, { font: fontRegular, size: 7, color: MID_GRAY });

    // Serialize and return
    const pdfBytes = await pdfDoc.save();
    const fileName = `${patient.last_name}_${patient.first_name}_Synopsis_${lab.test_date || 'report'}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBytes.length);
    return res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Synopsis PDF error:', error);
    return res.status(500).json({ error: error.message });
  }
}
