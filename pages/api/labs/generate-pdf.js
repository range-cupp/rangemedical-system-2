// pages/api/labs/generate-pdf.js
// Generates a clean PDF lab report from biomarker values stored in the database.
// Used for AccessMedLabs and Practice Fusion labs that don't have original PDFs.

import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
const { biomarkerGroups, biomarkerMap, allBiomarkerKeys, categoryOrder } = require('../../../lib/biomarker-config');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Colors
const HEADER_BG = rgb(0.08, 0.08, 0.12);       // Near-black
const CATEGORY_BG = rgb(0.93, 0.94, 0.96);      // Light gray
const FLAG_RED = rgb(0.85, 0.15, 0.15);
const FLAG_GREEN = rgb(0.1, 0.6, 0.3);
const TEXT_BLACK = rgb(0.1, 0.1, 0.1);
const TEXT_GRAY = rgb(0.45, 0.45, 0.45);
const BORDER_GRAY = rgb(0.82, 0.82, 0.82);
const WHITE = rgb(1, 1, 1);
const ROW_ALT = rgb(0.97, 0.97, 0.98);

function computeFlag(value, refLow, refHigh) {
  if (value === null || value === undefined) return null;
  if (refLow !== null && value < refLow) return 'LOW';
  if (refHigh !== null && value > refHigh) return 'HIGH';
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lab_id, store } = req.method === 'GET' ? req.query : req.body;

    if (!lab_id) {
      return res.status(400).json({ success: false, error: 'lab_id required' });
    }

    // Fetch lab row with all columns
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .select('*')
      .eq('id', lab_id)
      .single();

    if (labError || !lab) {
      return res.status(404).json({ success: false, error: 'Lab not found' });
    }

    // Fetch patient info
    const { data: patient } = await supabase
      .from('patients')
      .select('first_name, last_name, date_of_birth, gender')
      .eq('id', lab.patient_id)
      .single();

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    // Fetch reference ranges
    let rangesQuery = supabase.from('lab_reference_ranges').select('*');
    if (patient.gender) {
      rangesQuery = rangesQuery.or(`gender.eq.${patient.gender},gender.eq.Both`);
    }
    const { data: ranges } = await rangesQuery;
    const rangesMap = {};
    (ranges || []).forEach(r => { rangesMap[r.biomarker] = r; });

    // Collect biomarkers that have values, grouped by category
    const groupedResults = {};
    for (const category of categoryOrder) {
      const markers = biomarkerGroups[category] || [];
      const results = [];
      for (const marker of markers) {
        const value = lab[marker.key];
        if (value === null || value === undefined) continue;
        const range = rangesMap[marker.key] || {};
        const refLow = range.ref_low ?? range.reference_low ?? null;
        const refHigh = range.ref_high ?? range.reference_high ?? null;
        const numValue = typeof value === 'number' ? value : parseFloat(value);
        results.push({
          name: marker.label,
          value: numValue,
          unit: marker.unit || range.unit || '',
          refLow,
          refHigh,
          flag: computeFlag(numValue, refLow, refHigh),
        });
      }
      if (results.length > 0) {
        groupedResults[category] = results;
      }
    }

    const totalMarkers = Object.values(groupedResults).reduce((s, arr) => s + arr.length, 0);

    if (totalMarkers === 0) {
      return res.status(400).json({ success: false, error: 'No biomarker values found for this lab' });
    }

    // ===== Generate PDF =====
    const pdfDoc = await PDFDocument.create();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const PAGE_WIDTH = 612;  // Letter size
    const PAGE_HEIGHT = 792;
    const MARGIN = 40;
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    const addPage = () => {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    };

    const drawText = (text, x, yPos, options = {}) => {
      const font = options.bold ? fontBold : fontRegular;
      const size = options.size || 10;
      const color = options.color || TEXT_BLACK;
      page.drawText(text, { x, y: yPos, size, font, color });
    };

    const drawRect = (x, yPos, w, h, color) => {
      page.drawRectangle({ x, y: yPos, width: w, height: h, color });
    };

    const drawLine = (x1, y1, x2, y2, color = BORDER_GRAY, thickness = 0.5) => {
      page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color, thickness });
    };

    // ===== HEADER =====
    const headerHeight = 65;
    drawRect(0, PAGE_HEIGHT - headerHeight, PAGE_WIDTH, headerHeight, HEADER_BG);

    drawText('RANGE MEDICAL', MARGIN, PAGE_HEIGHT - 28, { bold: true, size: 18, color: WHITE });
    drawText('Laboratory Results Report', MARGIN, PAGE_HEIGHT - 45, { size: 10, color: rgb(0.7, 0.7, 0.7) });

    const dateStr = lab.test_date || 'N/A';
    const dateWidth = fontRegular.widthOfTextAtSize(dateStr, 11);
    drawText(dateStr, PAGE_WIDTH - MARGIN - dateWidth, PAGE_HEIGHT - 28, { size: 11, color: WHITE });

    const providerStr = lab.lab_provider || '';
    if (providerStr) {
      const provWidth = fontRegular.widthOfTextAtSize(providerStr, 9);
      drawText(providerStr, PAGE_WIDTH - MARGIN - provWidth, PAGE_HEIGHT - 42, { size: 9, color: rgb(0.6, 0.6, 0.6) });
    }

    y = PAGE_HEIGHT - headerHeight - 20;

    // ===== PATIENT INFO =====
    const patientName = `${patient.first_name} ${patient.last_name}`;
    const dob = patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A';
    const gender = patient.gender || 'N/A';
    const panelType = lab.panel_type || 'N/A';

    drawText('Patient:', MARGIN, y, { bold: true, size: 9, color: TEXT_GRAY });
    drawText(patientName, MARGIN + 50, y, { bold: true, size: 11 });

    drawText('DOB:', MARGIN + 250, y, { bold: true, size: 9, color: TEXT_GRAY });
    drawText(dob, MARGIN + 275, y, { size: 10 });

    y -= 16;
    drawText('Gender:', MARGIN, y, { bold: true, size: 9, color: TEXT_GRAY });
    drawText(gender, MARGIN + 50, y, { size: 10 });

    drawText('Panel:', MARGIN + 250, y, { bold: true, size: 9, color: TEXT_GRAY });
    drawText(panelType, MARGIN + 280, y, { size: 10 });

    y -= 12;
    drawLine(MARGIN, y, PAGE_WIDTH - MARGIN, y, BORDER_GRAY, 1);
    y -= 16;

    // ===== BIOMARKER TABLE =====
    const COL_NAME = MARGIN + 8;
    const COL_VALUE = MARGIN + 220;
    const COL_UNIT = MARGIN + 300;
    const COL_RANGE = MARGIN + 370;
    const COL_FLAG = MARGIN + 480;
    const ROW_HEIGHT = 18;
    const CAT_HEIGHT = 22;

    for (const category of categoryOrder) {
      const results = groupedResults[category];
      if (!results) continue;

      // Check if we need a new page (category header + at least 2 rows)
      if (y < MARGIN + 80) addPage();

      // Category header
      drawRect(MARGIN, y - CAT_HEIGHT + 5, CONTENT_WIDTH, CAT_HEIGHT, CATEGORY_BG);
      drawText(category.toUpperCase(), COL_NAME, y - 10, { bold: true, size: 9, color: rgb(0.3, 0.3, 0.35) });
      y -= CAT_HEIGHT + 2;

      // Column headers
      drawText('Biomarker', COL_NAME, y, { bold: true, size: 8, color: TEXT_GRAY });
      drawText('Result', COL_VALUE, y, { bold: true, size: 8, color: TEXT_GRAY });
      drawText('Unit', COL_UNIT, y, { bold: true, size: 8, color: TEXT_GRAY });
      drawText('Reference Range', COL_RANGE, y, { bold: true, size: 8, color: TEXT_GRAY });
      drawText('Flag', COL_FLAG, y, { bold: true, size: 8, color: TEXT_GRAY });
      y -= 4;
      drawLine(MARGIN, y, PAGE_WIDTH - MARGIN, y, BORDER_GRAY, 0.5);
      y -= ROW_HEIGHT - 4;

      // Rows
      results.forEach((r, idx) => {
        if (y < MARGIN + 30) {
          addPage();
        }

        // Alternating row background
        if (idx % 2 === 0) {
          drawRect(MARGIN, y - ROW_HEIGHT + 14, CONTENT_WIDTH, ROW_HEIGHT, ROW_ALT);
        }

        drawText(r.name, COL_NAME, y, { size: 9 });

        // Value — bold and colored if flagged
        const valueStr = r.value !== null && r.value !== undefined && !isNaN(r.value) ? String(r.value) : 'N/A';
        const valueColor = r.flag === 'HIGH' ? FLAG_RED : r.flag === 'LOW' ? FLAG_RED : TEXT_BLACK;
        drawText(valueStr, COL_VALUE, y, { bold: !!r.flag, size: 9, color: valueColor });

        drawText(r.unit, COL_UNIT, y, { size: 8, color: TEXT_GRAY });

        // Reference range
        const rangeStr = (r.refLow !== null && r.refHigh !== null)
          ? `${r.refLow} - ${r.refHigh}`
          : (r.refLow !== null ? `≥ ${r.refLow}` : (r.refHigh !== null ? `≤ ${r.refHigh}` : '—'));
        drawText(rangeStr, COL_RANGE, y, { size: 8, color: TEXT_GRAY });

        // Flag
        if (r.flag) {
          const flagColor = r.flag === 'HIGH' ? FLAG_RED : FLAG_RED;
          drawText(r.flag, COL_FLAG, y, { bold: true, size: 8, color: flagColor });
        }

        y -= ROW_HEIGHT;
      });

      y -= 8; // Space between categories
    }

    // ===== FOOTER =====
    if (y < MARGIN + 40) addPage();
    y -= 10;
    drawLine(MARGIN, y, PAGE_WIDTH - MARGIN, y, BORDER_GRAY, 0.5);
    y -= 14;
    drawText('Generated from Range Medical CRM', MARGIN, y, { size: 7, color: TEXT_GRAY });
    const genDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const genStr = `Generated: ${genDate}`;
    const genWidth = fontRegular.widthOfTextAtSize(genStr, 7);
    drawText(genStr, PAGE_WIDTH - MARGIN - genWidth, y, { size: 7, color: TEXT_GRAY });

    // Serialize PDF
    const pdfBytes = await pdfDoc.save();

    // If store=true, upload to Supabase Storage and update the lab record
    if (store === 'true' || store === true) {
      const lastName = (patient.last_name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
      const firstName = (patient.first_name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
      const testDate = lab.test_date || 'unknown';
      const provider = (lab.lab_provider || 'generated').replace(/[^a-zA-Z0-9]/g, '_');
      const filePath = `generated/${provider}/${lastName}_${firstName}_${testDate}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('lab-documents')
        .upload(filePath, Buffer.from(pdfBytes), {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.error('PDF upload error:', uploadError);
        return res.status(500).json({ success: false, error: 'Failed to upload PDF', details: uploadError.message });
      }

      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/lab-documents/${filePath}`;

      // Update the lab record with the PDF URL
      await supabase
        .from('labs')
        .update({ pdf_url: publicUrl })
        .eq('id', lab_id);

      return res.status(200).json({ success: true, pdf_url: publicUrl, markers: totalMarkers });
    }

    // Otherwise return the PDF directly
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${patient.last_name}_${patient.first_name}_${lab.test_date}.pdf"`);
    res.setHeader('Content-Length', pdfBytes.length);
    return res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
