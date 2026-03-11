// lib/chart-pdf.js
// Patient chart PDF generator for Range Medical
// Generates a comprehensive multi-page patient chart (like an EMR chart print)

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const LEFT_MARGIN = 42;
const RIGHT_MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN;
const BOTTOM_MARGIN = 60;

// Sanitize text for pdf-lib (StandardFonts only support WinAnsi encoding)
function sanitize(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\r\n]+/g, ' ')              // Newlines -> space
    .replace(/\t/g, '  ')                   // Tabs -> double space
    .replace(/[\u2018\u2019\u02BC]/g, "'")  // Smart single quotes
    .replace(/[\u201C\u201D]/g, '"')        // Smart double quotes
    .replace(/\u2014/g, '--')               // Em dash
    .replace(/\u2013/g, '-')                // En dash
    .replace(/\u2026/g, '...')              // Ellipsis
    .replace(/[\u2022\u00B7]/g, '*')        // Bullets
    .replace(/\u2713/g, '[x]')              // Checkmark
    .replace(/\u2192/g, '->')               // Right arrow
    .replace(/\u2190/g, '<-')              // Left arrow
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '') // Strip remaining non-Latin1
    .replace(/\s{2,}/g, ' ');               // Collapse whitespace
}

export async function generateChartPdf({ patient, intakes, activeProtocols, completedProtocols, labs, notes, appointments, serviceLogs, consents, prescriptions }) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const white = rgb(1, 1, 1);
  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.92, 0.92, 0.92);
  const sectionBg = rgb(0.12, 0.12, 0.12);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let yPos = PAGE_HEIGHT;
  let pageNum = 1;

  // Helper: check page break
  const checkPageBreak = (needed = 40) => {
    if (yPos - needed < BOTTOM_MARGIN) {
      drawFooter();
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pageNum++;
      yPos = PAGE_HEIGHT - 20;
    }
  };

  // Helper: draw footer on current page
  const drawFooter = () => {
    const footerY = 25;
    page.drawText(`Page ${pageNum}`, { x: LEFT_MARGIN, y: footerY, size: 8, font, color: gray });
    const confText = 'CONFIDENTIAL — Range Medical — 1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660';
    const confWidth = font.widthOfTextAtSize(confText, 7);
    page.drawText(confText, { x: PAGE_WIDTH - RIGHT_MARGIN - confWidth, y: footerY, size: 7, font, color: gray });
  };

  // Helper: draw header bar
  const drawHeaderBar = (subtitle) => {
    const barHeight = 50;
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - barHeight, width: PAGE_WIDTH, height: barHeight, color: black });
    page.drawText('RANGE MEDICAL', { x: LEFT_MARGIN, y: PAGE_HEIGHT - 22, size: 16, font: fontBold, color: white });
    page.drawText(subtitle, { x: LEFT_MARGIN, y: PAGE_HEIGHT - 38, size: 9, font, color: white });
    const dateStr = `Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    const dw = font.widthOfTextAtSize(dateStr, 8);
    page.drawText(dateStr, { x: PAGE_WIDTH - RIGHT_MARGIN - dw, y: PAGE_HEIGHT - 22, size: 8, font, color: white });
    yPos = PAGE_HEIGHT - barHeight - 20;
  };

  // Helper: section header (dark bar)
  const drawSectionHeader = (title) => {
    checkPageBreak(30);
    page.drawRectangle({ x: LEFT_MARGIN, y: yPos - 4, width: CONTENT_WIDTH, height: 20, color: sectionBg });
    page.drawText(title, { x: LEFT_MARGIN + 8, y: yPos + 2, size: 10, font: fontBold, color: white });
    yPos -= 28;
  };

  // Helper: label-value pair
  const drawLabelValue = (label, value, opts = {}) => {
    checkPageBreak(16);
    const { indent = 0 } = opts;
    const x = LEFT_MARGIN + indent;
    page.drawText(`${label}:`, { x, y: yPos, size: 9, font: fontBold, color: black });
    const labelWidth = fontBold.widthOfTextAtSize(`${label}: `, 9);
    const val = sanitize(String(value || 'N/A')).substring(0, 120);
    page.drawText(val, { x: x + labelWidth, y: yPos, size: 9, font, color: gray });
    yPos -= 15;
  };

  // Helper: draw wrapped text
  const drawWrappedText = (text, opts = {}) => {
    const { size = 9, maxWidth = CONTENT_WIDTH, indent = 0, lineFont = font, lineColor = gray } = opts;
    const x = LEFT_MARGIN + indent;
    const words = sanitize(String(text || '')).split(' ');
    let line = '';
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const w = lineFont.widthOfTextAtSize(testLine, size);
      if (w > maxWidth - indent && line) {
        checkPageBreak(14);
        page.drawText(line, { x, y: yPos, size, font: lineFont, color: lineColor });
        yPos -= 13;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      checkPageBreak(14);
      page.drawText(line, { x, y: yPos, size, font: lineFont, color: lineColor });
      yPos -= 13;
    }
  };

  // Helper: simple text line
  const drawText = (text, opts = {}) => {
    const { size = 9, indent = 0, lineFont = font, lineColor = gray } = opts;
    checkPageBreak(14);
    page.drawText(sanitize(String(text || '')).substring(0, 200), { x: LEFT_MARGIN + indent, y: yPos, size, font: lineFont, color: lineColor });
    yPos -= 14;
  };

  // Helper: horizontal divider
  const drawDivider = () => {
    checkPageBreak(10);
    page.drawLine({ start: { x: LEFT_MARGIN, y: yPos }, end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: yPos }, thickness: 0.5, color: lightGray });
    yPos -= 10;
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ===========================
  // PAGE 1: COVER / DEMOGRAPHICS
  // ===========================
  drawHeaderBar('Patient Chart');

  const patientName = sanitize(`${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown');
  page.drawText(patientName, { x: LEFT_MARGIN, y: yPos, size: 18, font: fontBold, color: black });
  yPos -= 24;

  drawSectionHeader('PATIENT DEMOGRAPHICS');
  drawLabelValue('Full Name', patientName);
  if (patient.preferred_name) drawLabelValue('Preferred Name', patient.preferred_name);
  drawLabelValue('Date of Birth', patient.dob ? formatDate(patient.dob) : 'N/A');
  if (patient.dob) {
    const age = Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    drawLabelValue('Age', `${age} years`);
  }
  drawLabelValue('Gender', patient.gender || 'N/A');
  drawLabelValue('Phone', patient.phone || 'N/A');
  drawLabelValue('Email', patient.email || 'N/A');
  if (patient.address || patient.city) {
    drawLabelValue('Address', [patient.address, patient.city, patient.state, patient.zip].filter(Boolean).join(', '));
  }
  drawLabelValue('Patient Since', formatDate(patient.created_at));
  drawLabelValue('Patient ID', patient.id?.substring(0, 8) || 'N/A');
  yPos -= 8;

  // Medical history from intake
  const intake = intakes?.[0];
  if (intake) {
    drawSectionHeader('MEDICAL HISTORY');
    const getField = (field) => {
      if (!field) return 'None reported';
      if (typeof field === 'string') return field;
      if (Array.isArray(field)) return field.length > 0 ? field.join(', ') : 'None reported';
      return JSON.stringify(field);
    };
    drawLabelValue('Medications', getField(intake.medications || intake.current_medications));
    drawLabelValue('Allergies', getField(intake.allergies));
    drawLabelValue('Conditions', getField(intake.conditions || intake.medical_conditions || intake.existing_conditions));
    drawLabelValue('Surgical History', getField(intake.surgical_history));
    if (intake.emergency_contact_name) {
      drawLabelValue('Emergency Contact', `${intake.emergency_contact_name}${intake.emergency_contact_phone ? ` (${intake.emergency_contact_phone})` : ''}`);
    }
    yPos -= 8;
  }

  // ===========================
  // ACTIVE PROTOCOLS
  // ===========================
  if (activeProtocols && activeProtocols.length > 0) {
    drawSectionHeader('ACTIVE PROTOCOLS');
    for (const p of activeProtocols) {
      checkPageBreak(40);
      drawText(`${p.program_name || p.program_type || 'Protocol'} — ${p.medication || ''}`, { lineFont: fontBold, lineColor: black });
      drawLabelValue('Start Date', formatDate(p.start_date), { indent: 8 });
      if (p.selected_dose) drawLabelValue('Dose', p.selected_dose, { indent: 8 });
      if (p.frequency) drawLabelValue('Frequency', p.frequency, { indent: 8 });
      if (p.delivery_method) drawLabelValue('Delivery', p.delivery_method, { indent: 8 });
      if (p.total_sessions) drawLabelValue('Sessions', `${p.sessions_used || 0} / ${p.total_sessions}`, { indent: 8 });
      drawDivider();
    }
  }

  // ===========================
  // COMPLETED PROTOCOLS
  // ===========================
  if (completedProtocols && completedProtocols.length > 0) {
    drawSectionHeader('COMPLETED PROTOCOLS');
    for (const p of completedProtocols.slice(0, 20)) {
      checkPageBreak(20);
      drawText(`${p.program_name || p.program_type || 'Protocol'} — ${p.medication || ''} (${formatDate(p.start_date)} - ${formatDate(p.end_date)})`, { lineFont: font, lineColor: gray });
    }
    yPos -= 8;
  }

  // ===========================
  // LAB RESULTS
  // ===========================
  if (labs && labs.length > 0) {
    drawSectionHeader('LAB RESULTS');
    for (const lab of labs.slice(0, 20)) {
      checkPageBreak(20);
      drawText(`${formatDate(lab.test_date)} — ${lab.panel_type || lab.lab_type || 'Lab'} (${lab.lab_provider || 'N/A'})`, { lineFont: fontBold, lineColor: black, size: 9 });
    }
    yPos -= 8;
  }

  // ===========================
  // PRESCRIPTIONS
  // ===========================
  if (prescriptions && prescriptions.length > 0) {
    drawSectionHeader('PRESCRIPTIONS');
    for (const rx of prescriptions.slice(0, 30)) {
      checkPageBreak(30);
      drawText(`${rx.medication_name}${rx.strength ? ` ${rx.strength}` : ''} (${rx.form || 'N/A'})`, { lineFont: fontBold, lineColor: black });
      if (rx.sig) drawLabelValue('Sig', rx.sig, { indent: 8 });
      drawLabelValue('Status', rx.status || 'draft', { indent: 8 });
      drawDivider();
    }
  }

  // ===========================
  // CLINICAL NOTES
  // ===========================
  if (notes && notes.length > 0) {
    drawSectionHeader('CLINICAL NOTES');
    for (const note of notes.slice(0, 50)) {
      checkPageBreak(40);
      const header = `${formatDate(note.note_date || note.created_at)}${note.created_by ? ' - ' + note.created_by : ''}${note.source === 'encounter' ? ' [Encounter]' : ''}${note.status === 'signed' ? ' [Signed]' : ''}`;
      drawText(header, { lineFont: fontBold, lineColor: black, size: 8 });
      // Truncate body to ~500 chars
      const body = (note.body || '').substring(0, 500);
      drawWrappedText(body, { indent: 8, size: 8 });
      yPos -= 6;
      drawDivider();
    }
  }

  // ===========================
  // VISIT HISTORY
  // ===========================
  const allVisits = [
    ...(appointments || []).map(a => ({ date: a.start_time, type: 'Appointment', detail: a.calendar_name || a.service_name || 'Appointment', status: a.status })),
    ...(serviceLogs || []).map(s => ({ date: s.entry_date, type: s.entry_type || 'Service', detail: `${s.category || ''} — ${s.medication || s.notes || ''}`, status: 'completed' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (allVisits.length > 0) {
    drawSectionHeader('VISIT HISTORY');
    for (const v of allVisits.slice(0, 50)) {
      checkPageBreak(16);
      drawText(`${formatDate(v.date)} — ${v.type} — ${v.detail} (${v.status || ''})`, { size: 8 });
    }
    yPos -= 8;
  }

  // ===========================
  // CONSENT FORMS
  // ===========================
  if (consents && consents.length > 0) {
    drawSectionHeader('CONSENT FORMS');
    for (const c of consents) {
      checkPageBreak(16);
      drawText(`${c.consent_type || 'Consent'} — ${formatDate(c.consent_date || c.submitted_at)} — ${c.consent_given ? 'Signed' : 'Not Signed'}`, { size: 8 });
    }
    yPos -= 8;
  }

  // Final footer
  drawFooter();

  return await pdfDoc.save();
}
