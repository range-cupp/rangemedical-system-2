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

export async function generateChartPdf({ patient, intakes, activeProtocols, completedProtocols, labs, notes, appointments, serviceLogs, consents, prescriptions, sections = null }) {
  // sections === null means include every section (back-compat default).
  // Otherwise only sections set to true are rendered.
  const includeSection = (key) => sections ? !!sections[key] : true;
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const white = rgb(1, 1, 1);
  const black = rgb(0.04, 0.04, 0.04);
  const darkGray = rgb(0.18, 0.18, 0.18);
  const gray = rgb(0.38, 0.38, 0.38);
  const midGray = rgb(0.55, 0.55, 0.55);
  const lightGray = rgb(0.87, 0.87, 0.87);
  const sectionBg = rgb(0.12, 0.12, 0.12);

  // Parse messy condition/intake fields into readable text
  const formatIntakeField = (field) => {
    if (field == null || field === '') return 'None reported';
    if (Array.isArray(field)) return field.length ? field.join(', ') : 'None reported';
    if (typeof field === 'string') {
      const t = field.trim();
      if (!t) return 'None reported';
      if ((t.startsWith('{') || t.startsWith('[')) ) {
        try { return formatIntakeField(JSON.parse(t)); } catch { return t; }
      }
      return t;
    }
    if (typeof field === 'object') {
      // Object of {key: {label, response}} or {key: value}
      const yes = [];
      const other = [];
      for (const [k, v] of Object.entries(field)) {
        if (v && typeof v === 'object') {
          const label = v.label || k;
          const resp = v.response ?? v.value ?? v.answer;
          if (resp === undefined) continue;
          if (typeof resp === 'string' && /^yes$/i.test(resp)) yes.push(label);
          else if (typeof resp === 'string' && /^no$/i.test(resp)) { /* skip negatives */ }
          else other.push(`${label}: ${resp}`);
        } else if (v != null && v !== '') {
          if (typeof v === 'string' && /^no$/i.test(v)) continue;
          if (typeof v === 'string' && /^yes$/i.test(v)) yes.push(k);
          else other.push(`${k}: ${v}`);
        }
      }
      const all = [...yes, ...other];
      return all.length ? all.join(', ') : 'None reported';
    }
    return String(field);
  };

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

  // Helper: draw header (clean, no black bar)
  const drawHeaderBar = (subtitle) => {
    const topY = PAGE_HEIGHT - 48;
    page.drawText('RANGE MEDICAL', { x: LEFT_MARGIN, y: topY, size: 13, font: fontBold, color: black });
    const contact = 'range-medical.com  •  (949) 997-3988';
    const cw = font.widthOfTextAtSize(contact, 8);
    page.drawText(contact.replace('•', '-'), { x: PAGE_WIDTH - RIGHT_MARGIN - cw, y: topY + 2, size: 8, font, color: midGray });
    const addr = '1901 Westcliff Drive, Suite 10, Newport Beach, CA';
    const aw = font.widthOfTextAtSize(addr, 8);
    page.drawText(addr, { x: PAGE_WIDTH - RIGHT_MARGIN - aw, y: topY - 9, size: 8, font, color: midGray });
    // thick rule
    page.drawLine({ start: { x: LEFT_MARGIN, y: topY - 16 }, end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: topY - 16 }, thickness: 1.2, color: black });
    // subtitle + date row
    page.drawText(subtitle, { x: LEFT_MARGIN, y: topY - 30, size: 9, font, color: midGray });
    const dateStr = `Generated ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' })}`;
    const dw = font.widthOfTextAtSize(dateStr, 8);
    page.drawText(dateStr, { x: PAGE_WIDTH - RIGHT_MARGIN - dw, y: topY - 30, size: 8, font, color: midGray });
    yPos = topY - 50;
  };

  // Helper: section header (small-caps gray label + thin rule)
  const drawSectionHeader = (title) => {
    checkPageBreak(36);
    yPos -= 6;
    page.drawText(title.toUpperCase(), { x: LEFT_MARGIN, y: yPos, size: 8, font: fontBold, color: midGray });
    yPos -= 6;
    page.drawLine({ start: { x: LEFT_MARGIN, y: yPos }, end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: yPos }, thickness: 0.75, color: lightGray });
    yPos -= 14;
  };

  // Helper: label-value pair (wraps long values)
  const drawLabelValue = (label, value, opts = {}) => {
    const { indent = 0, size = 10.5 } = opts;
    const x = LEFT_MARGIN + indent;
    const labelText = `${label}:  `;
    const labelWidth = fontBold.widthOfTextAtSize(labelText, size);
    const lineHeight = Math.round(size * 1.55);
    checkPageBreak(lineHeight);
    page.drawText(`${label}:`, { x, y: yPos, size, font: fontBold, color: darkGray });
    const valText = sanitize(String(value ?? 'N/A'));
    const maxWidth = CONTENT_WIDTH - indent - labelWidth;
    const words = valText.split(' ');
    let line = '';
    let firstLine = true;
    const flush = () => {
      const lx = firstLine ? x + labelWidth : x + labelWidth;
      checkPageBreak(lineHeight);
      page.drawText(line, { x: lx, y: yPos, size, font, color: gray });
      yPos -= lineHeight;
      line = '';
      firstLine = false;
    };
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        flush();
        line = word;
      } else {
        line = test;
      }
    }
    if (line) flush();
    else yPos -= lineHeight;
    yPos += 2; // tighten between rows
  };

  // Helper: draw wrapped text
  const drawWrappedText = (text, opts = {}) => {
    const { size = 11, maxWidth = CONTENT_WIDTH, indent = 0, lineFont = font, lineColor = gray } = opts;
    const x = LEFT_MARGIN + indent;
    const lineHeight = Math.round(size * 1.5);
    const words = sanitize(String(text || '')).split(' ');
    let line = '';
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const w = lineFont.widthOfTextAtSize(testLine, size);
      if (w > maxWidth - indent && line) {
        checkPageBreak(lineHeight);
        page.drawText(line, { x, y: yPos, size, font: lineFont, color: lineColor });
        yPos -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      checkPageBreak(lineHeight);
      page.drawText(line, { x, y: yPos, size, font: lineFont, color: lineColor });
      yPos -= lineHeight;
    }
  };

  // Helper: simple text line
  const drawText = (text, opts = {}) => {
    const { size = 11, indent = 0, lineFont = font, lineColor = gray } = opts;
    const lineHeight = Math.round(size * 1.5);
    checkPageBreak(lineHeight);
    page.drawText(sanitize(String(text || '')).substring(0, 200), { x: LEFT_MARGIN + indent, y: yPos, size, font: lineFont, color: lineColor });
    yPos -= lineHeight;
  };

  // Helper: horizontal divider
  const drawDivider = () => {
    checkPageBreak(10);
    page.drawLine({ start: { x: LEFT_MARGIN, y: yPos }, end: { x: PAGE_WIDTH - RIGHT_MARGIN, y: yPos }, thickness: 0.5, color: lightGray });
    yPos -= 10;
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' });
  };

  // ===========================
  // PAGE 1: COVER / DEMOGRAPHICS
  // ===========================
  drawHeaderBar('Patient Chart');

  const patientName = sanitize(`${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown');
  page.drawText(patientName, { x: LEFT_MARGIN, y: yPos, size: 20, font: fontBold, color: black });
  yPos -= 10;
  const subId = `Patient ID ${patient.id?.substring(0, 8) || 'N/A'}`;
  page.drawText(subId, { x: LEFT_MARGIN, y: yPos, size: 9, font, color: midGray });
  yPos -= 18;

  if (includeSection('demographics')) {
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
  }

  // Medical history from intake
  const intake = intakes?.[0];
  if (includeSection('history') && intake) {
    drawSectionHeader('MEDICAL HISTORY');
    drawLabelValue('Medications', formatIntakeField(intake.medications || intake.current_medications));
    drawLabelValue('Allergies', formatIntakeField(intake.allergies));
    drawLabelValue('Conditions', formatIntakeField(intake.conditions || intake.medical_conditions || intake.existing_conditions));
    drawLabelValue('Surgical History', formatIntakeField(intake.surgical_history));
    if (intake.emergency_contact_name) {
      drawLabelValue('Emergency Contact', `${intake.emergency_contact_name}${intake.emergency_contact_phone ? ` (${intake.emergency_contact_phone})` : ''}`);
    }
    yPos -= 8;
  }

  // ===========================
  // ACTIVE PROTOCOLS
  // ===========================
  if (includeSection('medications') && activeProtocols && activeProtocols.length > 0) {
    drawSectionHeader('ACTIVE MEDICATIONS');
    for (const p of activeProtocols) {
      checkPageBreak(40);
      drawText(`${p.program_name || p.program_type || 'Protocol'} — ${p.medication || ''}`, { lineFont: fontBold, lineColor: black });
      drawLabelValue('Start Date', formatDate(p.start_date), { indent: 8 });
      if (p.selected_dose) drawLabelValue('Dose', p.selected_dose, { indent: 8 });
      if (p.frequency) {
        const freqLabel = ({
          'every_3_5_days': 'Every 3.5 days',
          '2x_weekly': 'Every 3.5 days',
          '2x per week': 'Every 3.5 days',
          'weekly': 'Weekly',
          'daily': 'Daily',
        })[p.frequency] || p.frequency;
        drawLabelValue('Frequency', freqLabel, { indent: 8 });
      }
      if (p.delivery_method) drawLabelValue('Delivery', p.delivery_method, { indent: 8 });
      if (p.total_sessions) drawLabelValue('Sessions', `${p.sessions_used || 0} / ${p.total_sessions}`, { indent: 8 });
      drawDivider();
    }
  }

  // ===========================
  // COMPLETED PROTOCOLS
  // ===========================
  if (includeSection('completedProtocols') && completedProtocols && completedProtocols.length > 0) {
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
  if (includeSection('labs') && labs && labs.length > 0) {
    drawSectionHeader('LAB RESULTS');
    for (const lab of labs.slice(0, 20)) {
      checkPageBreak(20);
      drawText(`${formatDate(lab.test_date)} — ${lab.panel_type || lab.lab_type || 'Lab'} (${lab.lab_provider || 'N/A'})`, { lineFont: fontBold, lineColor: black });
    }
    yPos -= 8;
  }

  // ===========================
  // PRESCRIPTIONS
  // ===========================
  if (includeSection('prescriptions') && prescriptions && prescriptions.length > 0) {
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
  // CLINICAL NOTES — each note on its own page
  // ===========================
  if (includeSection('notes') && notes && notes.length > 0) {
    for (const note of notes.slice(0, 50)) {
      // Force a new page for every encounter note
      drawFooter();
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pageNum++;
      yPos = PAGE_HEIGHT - 20;

      drawSectionHeader('CLINICAL NOTE');

      const noteDate = formatDate(note.note_date || note.created_at);
      const author = note.created_by ? sanitize(note.created_by) : '';
      const service = note.encounter_service ? sanitize(note.encounter_service) : '';
      const signed = note.status === 'signed';

      // Note metadata
      drawLabelValue('Date', noteDate);
      if (author) drawLabelValue('Author', author);
      if (service) drawLabelValue('Service', service);
      drawLabelValue('Source', note.source === 'encounter' ? 'Encounter' : (note.source || 'Manual'));
      drawLabelValue('Status', signed ? `Signed by ${sanitize(note.signed_by || author)} on ${formatDate(note.signed_at)}` : 'Draft');
      yPos -= 8;

      // Full note body — convert HTML to formatted text
      const rawBody = note.body || '';
      const noteLines = rawBody
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(?:div|p|li)>/gi, '\n')
        .replace(/<(?:div|p|li)(?:\s[^>]*)?>/gi, '')
        .split(/\n+/)
        .filter(l => l.trim());

      const decodeEntities = (t) => t
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');

      for (const line of noteLines) {
        const boldLabelMatch = line.match(/^\s*<b>([^<]+)<\/b>\s*:?\s*(.*)/i);
        if (boldLabelMatch) {
          const label = decodeEntities(boldLabelMatch[1].replace(/:$/, '').trim());
          const val = decodeEntities(boldLabelMatch[2].replace(/<[^>]*>/g, '').trim());
          if (val) {
            drawLabelValue(label, val, { indent: 8 });
          } else {
            drawWrappedText(label, { size: 11, lineFont: fontBold, lineColor: darkGray });
            yPos -= 4;
          }
        } else {
          const text = decodeEntities(line.replace(/<[^>]*>/g, '').trim());
          if (text) {
            drawWrappedText(text, { size: 11 });
            yPos -= 4;
          }
        }
      }
    }
  }

  // ===========================
  // VISIT HISTORY
  // ===========================
  if (includeSection('visits')) {
    // Map an appointment to the service log category that auto-session-log would create
    // (mirrors lib/auto-session-log.js detectAppointmentServiceType — kept inline to avoid coupling)
    const detectApptCategory = (apt) => {
      const name = (apt.service_name || apt.calendar_name || apt.appointment_title || '').toLowerCase();
      const cat = (apt.service_category || '').toLowerCase();
      if (name.includes('injection')) {
        if (name.includes('peptide')) return 'peptide';
        if (name.includes('weight loss')) return 'weight_loss';
        if (name.includes('testosterone') || name.includes('hrt')) return 'testosterone';
        return 'injection';
      }
      if (name.includes('hbot') || name.includes('hyperbaric') || cat.includes('hbot')) return 'hbot';
      if (name.includes('red light') || name.includes('rlt') || cat.includes('rlt') || cat.includes('red_light')) return 'red_light';
      if (name.includes('iv') || cat.includes('iv')) return 'iv_therapy';
      return null;
    };

    // Pacific date string (YYYY-MM-DD) — service_logs.entry_date is already Pacific
    const toPacificDate = (ts) => {
      if (!ts) return null;
      try { return new Date(ts).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); }
      catch { return null; }
    };

    // Build a Set of "${date}|${category}" keys from service logs to dedupe completed appointments
    const serviceLogKeys = new Set();
    for (const s of (serviceLogs || [])) {
      if (s.entry_date && s.category) serviceLogKeys.add(`${s.entry_date}|${s.category}`);
    }

    const apptEntries = (appointments || [])
      .filter(a => {
        if ((a.status || '').toLowerCase() !== 'completed') return true;
        const dateStr = toPacificDate(a.start_time);
        const cat = detectApptCategory(a);
        if (!dateStr || !cat) return true;
        return !serviceLogKeys.has(`${dateStr}|${cat}`);
      })
      .map(a => ({ date: a.start_time, type: 'Appointment', detail: a.calendar_name || a.service_name || 'Appointment', status: a.status }));

    const allVisits = [
      ...apptEntries,
      ...(serviceLogs || []).map(s => ({ date: s.entry_date, type: s.entry_type || 'Service', detail: `${s.category || ''} — ${s.medication || s.notes || ''}`, status: 'completed' })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (allVisits.length > 0) {
      drawSectionHeader('VISIT HISTORY');
      for (const v of allVisits.slice(0, 50)) {
        checkPageBreak(16);
        drawText(`${formatDate(v.date)} — ${v.type} — ${v.detail} (${v.status || ''})`);
      }
      yPos -= 8;
    }
  }

  // ===========================
  // CONSENT FORMS
  // ===========================
  if (includeSection('consents') && consents && consents.length > 0) {
    drawSectionHeader('CONSENT FORMS');
    for (const c of consents) {
      checkPageBreak(16);
      drawText(`${c.consent_type || 'Consent'} — ${formatDate(c.consent_date || c.submitted_at)} — ${c.consent_given ? 'Signed' : 'Not Signed'}`);
    }
    yPos -= 8;
  }

  // Final footer
  drawFooter();

  return await pdfDoc.save();
}
