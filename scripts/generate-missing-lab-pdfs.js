#!/usr/bin/env node
// scripts/generate-missing-lab-pdfs.js
// Batch generates PDF lab reports for all labs that don't have a pdf_url.
// Uses pdf-lib to create clean reports from the biomarker values in the database.
//
// Usage:
//   node scripts/generate-missing-lab-pdfs.js              # Dry run (shows what would be generated)
//   node scripts/generate-missing-lab-pdfs.js --run         # Actually generate and upload PDFs
//   node scripts/generate-missing-lab-pdfs.js --run --limit=10  # Generate only first 10

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { biomarkerGroups, allBiomarkerKeys, categoryOrder } = require('../lib/biomarker-config');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Colors
const HEADER_BG = rgb(0.08, 0.08, 0.12);
const CATEGORY_BG = rgb(0.93, 0.94, 0.96);
const FLAG_RED = rgb(0.85, 0.15, 0.15);
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

async function generateLabPDF(lab, patient, rangesMap) {
  // Collect biomarkers with values
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
      if (isNaN(numValue)) continue;
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
  if (totalMarkers === 0) return null;

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_WIDTH = 612;
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
    try {
      page.drawText(String(text), { x, y: yPos, size, font, color });
    } catch { /* skip chars that can't be encoded */ }
  };

  const drawRect = (x, yPos, w, h, color) => {
    page.drawRectangle({ x, y: yPos, width: w, height: h, color });
  };

  const drawLine = (x1, y1, x2, y2, color = BORDER_GRAY, thickness = 0.5) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color, thickness });
  };

  // Header
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

  // Patient info
  const patientName = `${patient.first_name} ${patient.last_name}`;
  const dob = patient.date_of_birth
    ? new Date(patient.date_of_birth + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'N/A';
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

  // Biomarker table
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

    if (y < MARGIN + 80) addPage();

    drawRect(MARGIN, y - CAT_HEIGHT + 5, CONTENT_WIDTH, CAT_HEIGHT, CATEGORY_BG);
    drawText(category.toUpperCase(), COL_NAME, y - 10, { bold: true, size: 9, color: rgb(0.3, 0.3, 0.35) });
    y -= CAT_HEIGHT + 2;

    drawText('Biomarker', COL_NAME, y, { bold: true, size: 8, color: TEXT_GRAY });
    drawText('Result', COL_VALUE, y, { bold: true, size: 8, color: TEXT_GRAY });
    drawText('Unit', COL_UNIT, y, { bold: true, size: 8, color: TEXT_GRAY });
    drawText('Reference Range', COL_RANGE, y, { bold: true, size: 8, color: TEXT_GRAY });
    drawText('Flag', COL_FLAG, y, { bold: true, size: 8, color: TEXT_GRAY });
    y -= 4;
    drawLine(MARGIN, y, PAGE_WIDTH - MARGIN, y, BORDER_GRAY, 0.5);
    y -= ROW_HEIGHT - 4;

    results.forEach((r, idx) => {
      if (y < MARGIN + 30) addPage();

      if (idx % 2 === 0) {
        drawRect(MARGIN, y - ROW_HEIGHT + 14, CONTENT_WIDTH, ROW_HEIGHT, ROW_ALT);
      }

      drawText(r.name, COL_NAME, y, { size: 9 });

      const valueStr = String(r.value);
      const valueColor = r.flag ? FLAG_RED : TEXT_BLACK;
      drawText(valueStr, COL_VALUE, y, { bold: !!r.flag, size: 9, color: valueColor });
      drawText(r.unit, COL_UNIT, y, { size: 8, color: TEXT_GRAY });

      const rangeStr = (r.refLow !== null && r.refHigh !== null)
        ? `${r.refLow} - ${r.refHigh}`
        : (r.refLow !== null ? `>= ${r.refLow}` : (r.refHigh !== null ? `<= ${r.refHigh}` : '-'));
      drawText(rangeStr, COL_RANGE, y, { size: 8, color: TEXT_GRAY });

      if (r.flag) {
        drawText(r.flag, COL_FLAG, y, { bold: true, size: 8, color: FLAG_RED });
      }

      y -= ROW_HEIGHT;
    });

    y -= 8;
  }

  // Footer
  if (y < MARGIN + 40) addPage();
  y -= 10;
  drawLine(MARGIN, y, PAGE_WIDTH - MARGIN, y, BORDER_GRAY, 0.5);
  y -= 14;
  drawText('Generated from Range Medical CRM', MARGIN, y, { size: 7, color: TEXT_GRAY });
  const genDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const genStr = `Generated: ${genDate}`;
  const genWidth = fontRegular.widthOfTextAtSize(genStr, 7);
  drawText(genStr, PAGE_WIDTH - MARGIN - genWidth, y, { size: 7, color: TEXT_GRAY });

  return { pdfBytes: await pdfDoc.save(), totalMarkers };
}

async function main() {
  const args = process.argv.slice(2);
  const isRun = args.includes('--run');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;

  console.log(`\n📄 Lab PDF Generator`);
  console.log(`Mode: ${isRun ? '🟢 LIVE RUN' : '🔵 DRY RUN'}`);
  if (limit) console.log(`Limit: ${limit}`);
  console.log('');

  // Fetch all labs without PDFs
  let query = supabase
    .from('labs')
    .select('id, patient_id, test_date, lab_type, panel_type, lab_provider')
    .is('pdf_url', null)
    .order('test_date', { ascending: false });

  if (limit) query = query.limit(limit);

  const { data: labs, error } = await query;
  if (error) { console.error('Query error:', error); process.exit(1); }

  console.log(`Found ${labs.length} labs without PDFs\n`);

  // Group by provider for stats
  const byProvider = {};
  labs.forEach(l => {
    const p = l.lab_provider || 'Unknown';
    byProvider[p] = (byProvider[p] || 0) + 1;
  });
  Object.entries(byProvider).forEach(([prov, count]) => {
    console.log(`  ${prov}: ${count}`);
  });
  console.log('');

  if (!isRun) {
    console.log('🔵 Dry run complete. Use --run to generate PDFs.');
    process.exit(0);
  }

  // Fetch all reference ranges (once)
  const { data: ranges } = await supabase.from('lab_reference_ranges').select('*');
  const rangesMapAll = {};
  (ranges || []).forEach(r => {
    if (!rangesMapAll[r.gender || 'Both']) rangesMapAll[r.gender || 'Both'] = {};
    rangesMapAll[r.gender || 'Both'][r.biomarker] = r;
  });

  // Fetch all unique patients
  const patientIds = [...new Set(labs.map(l => l.patient_id))];
  const { data: patients } = await supabase
    .from('patients')
    .select('id, first_name, last_name, date_of_birth, gender')
    .in('id', patientIds);

  const patientMap = {};
  (patients || []).forEach(p => { patientMap[p.id] = p; });

  // Now we need the full lab data (all biomarker columns) for each lab
  // Fetch in batches of 50
  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < labs.length; i += 50) {
    const batch = labs.slice(i, i + 50);
    const batchIds = batch.map(l => l.id);

    const { data: fullLabs, error: batchError } = await supabase
      .from('labs')
      .select('*')
      .in('id', batchIds);

    if (batchError) {
      console.error(`Batch error:`, batchError);
      errors += batch.length;
      continue;
    }

    for (const lab of fullLabs) {
      const patient = patientMap[lab.patient_id];
      if (!patient) {
        console.log(`  ⚠️  Skip ${lab.id} — patient not found`);
        skipped++;
        continue;
      }

      // Build ranges map for this patient's gender
      const genderRanges = { ...(rangesMapAll['Both'] || {}), ...(rangesMapAll[patient.gender] || {}) };

      try {
        const result = await generateLabPDF(lab, patient, genderRanges);
        if (!result) {
          skipped++;
          continue;
        }

        const lastName = (patient.last_name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
        const firstName = (patient.first_name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
        const testDate = lab.test_date || 'unknown';
        const provider = (lab.lab_provider || 'generated').replace(/[^a-zA-Z0-9]/g, '_');
        const filePath = `generated/${provider}/${lastName}_${firstName}_${testDate}.pdf`;

        const { error: uploadError } = await supabase.storage
          .from('lab-documents')
          .upload(filePath, Buffer.from(result.pdfBytes), {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadError) {
          console.error(`  ❌ Upload failed for ${patient.last_name}: ${uploadError.message}`);
          errors++;
          continue;
        }

        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/lab-documents/${filePath}`;

        await supabase
          .from('labs')
          .update({ pdf_url: publicUrl })
          .eq('id', lab.id);

        generated++;
        console.log(`  ✅ ${patient.last_name}, ${patient.first_name} — ${lab.test_date} (${provider}, ${result.totalMarkers} markers)`);
      } catch (err) {
        console.error(`  ❌ Error for ${patient.last_name}: ${err.message}`);
        errors++;
      }
    }

    // Progress
    const processed = Math.min(i + 50, labs.length);
    console.log(`\n  Progress: ${processed}/${labs.length} processed (${generated} generated, ${skipped} skipped, ${errors} errors)\n`);
  }

  console.log(`\n✅ Done!`);
  console.log(`   Generated: ${generated}`);
  console.log(`   Skipped (no biomarker data): ${skipped}`);
  console.log(`   Errors: ${errors}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
