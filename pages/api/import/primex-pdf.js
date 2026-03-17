// /pages/api/import/primex-pdf.js
// Primex batch PDF importer — parses multi-patient lab PDFs, matches patients,
// inserts lab records with duplicate protection, uploads per-patient PDFs.

import { createClient } from '@supabase/supabase-js';
import { PDFDocument } from 'pdf-lib';
import { loadReviewerIds, postImportActions } from '../../../lib/lab-post-import';

export const config = {
  api: { bodyParser: { sizeLimit: '15mb' } },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Biomarker name → DB column ────────────────────────────────────────────────
const BIOMARKER_MAP = {
  'TOTAL PROTEIN': 'total_protein', 'ALBUMIN': 'albumin',
  'GLOBULIN (CALC.)': 'globulin', 'A/G RATIO (CALC.)': 'ag_ratio',
  'SGOT (AST)': 'ast', 'SGPT (ALT)': 'alt',
  'ALKALINE PHOSPHATASE': 'alkaline_phosphatase', 'BILIRUBIN, TOTAL': 'total_bilirubin',
  'GGT': 'ggt', 'GLUCOSE': 'glucose', 'URIC ACID': 'uric_acid',
  'BUN': 'bun', 'CREATININE': 'creatinine',
  'BUN/CREATININE (CALC.)': 'bun_creatinine_ratio', 'E.GFR (CALC.)': 'egfr',
  'CALCIUM': 'calcium', 'CHLORIDE': 'chloride', 'CO2': 'co2',
  'SODIUM': 'sodium', 'POTASSIUM': 'potassium', 'ANION GAP (CALC.)': 'anion_gap',
  'CHOLESTEROL': 'total_cholesterol', 'HDL CHOLESTEROL': 'hdl_cholesterol',
  'LDL (CALC.)': 'ldl_cholesterol', 'VLDL (CALC.)': 'vldl_cholesterol',
  'TRIGLYCERIDES': 'triglycerides',
  'TOTAL T4': 'total_t4', 'FREE T4': 'free_t4',
  'TSH (3RD GENERATION)': 'tsh', 'FREE T3': 'free_t3',
  'REVERSE T3': 'reverse_t3',
  'THYROID PEROXIDASE AB.': 'tpo_antibody', 'THYROID PEROXIDASE AB': 'tpo_antibody',
  'WBC': 'wbc', 'RBC': 'rbc', 'HGB': 'hemoglobin', 'HCT': 'hematocrit',
  'MCV': 'mcv', 'MCH': 'mch', 'MCHC': 'mchc', 'RDW': 'rdw',
  'PLATELETS': 'platelets', 'MPV': 'mpv',
  'NEUTROPHILS %': 'neutrophils_percent', 'LYMPHOCYTES %': 'lymphocytes_percent',
  'MONOCYTES %': 'monocytes_percent', 'EOSINOPHILS %': 'eosinophils_percent',
  'BASOPHILS %': 'basophils_percent',
  'NEUTROPHILS': 'neutrophils_percent', 'LYMPHOCYTES': 'lymphocytes_percent',
  'MONOCYTES': 'monocytes_percent', 'EOSINOPHILS': 'eosinophils_percent',
  'BASOPHILS': 'basophils_percent',
  'HGBA1C': 'hemoglobin_a1c', 'HEMOGLOBIN A1C': 'hemoglobin_a1c',
  'INSULIN, FASTING': 'fasting_insulin',
  'VITAMIN D, 25-HYDROXY': 'vitamin_d', 'VITAMIN B12': 'vitamin_b12',
  'FOLATE': 'folate',
  'TESTOSTERONE, TOTAL': 'total_testosterone',
  'TESTOSTERONE, FREE': 'free_testosterone', 'FREE TESTOSTERONE': 'free_testosterone',
  'TESTOSTERONE, FREE (CALC.)': 'free_testosterone',
  'SHBG': 'shbg', 'ESTRADIOL': 'estradiol', 'PROGESTERONE': 'progesterone',
  'DHEA-SULFATE': 'dhea_s', 'DHEA SULFATE': 'dhea_s',
  'LH': 'lh', 'FSH': 'fsh', 'IGF-1': 'igf_1', 'CORTISOL': 'cortisol',
  'PSA, TOTAL': 'psa_total', 'PSA TOTAL': 'psa_total',
  'FREE PSA': 'psa_free', 'AMH': 'amh',
  'IRON': 'iron', 'TIBC': 'tibc', 'IRON SATURATION': 'iron_saturation',
  'FERRITIN': 'ferritin',
  'C-REACTIVE PROTEIN, HIGH SENSITIVITY': 'crp_hs',
  'C-REACTIVE PROTEIN': 'crp_hs', 'CRP, HIGH SENSITIVITY': 'crp_hs',
  'HOMOCYSTEINE': 'homocysteine', 'DHT': 'dht',
};
const SORTED_KEYS = Object.keys(BIOMARKER_MAP).sort((a, b) => b.length - a.length);

// ── Text extraction helpers ───────────────────────────────────────────────────

function parseDate(s) {
  if (!s) return null;
  const clean = s.trim();
  // MM/DD/YY or MM/DD/YYYY
  const m = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  let [, mo, day, yr] = m;
  if (yr.length === 2) yr = parseInt(yr) < 50 ? `20${yr}` : `19${yr}`;
  const dt = new Date(`${yr}-${mo.padStart(2,'0')}-${day.padStart(2,'0')}`);
  if (isNaN(dt)) return null;
  return `${yr}-${mo.padStart(2,'0')}-${day.padStart(2,'0')}`;
}

// Reconstruct lines from pdfjs text items (grouped by Y coordinate)
function itemsToLines(items) {
  const lineMap = {};
  for (const item of items) {
    if (typeof item.str !== 'string') continue;
    const y = Math.round(item.transform[5]);
    if (!lineMap[y]) lineMap[y] = [];
    lineMap[y].push({ x: item.transform[4], str: item.str });
  }
  return Object.entries(lineMap)
    .sort(([a], [b]) => Number(b) - Number(a)) // descending Y = top to bottom
    .map(([, items]) =>
      items.sort((a, b) => a.x - b.x).map(i => i.str).join(' ').trim()
    )
    .filter(Boolean);
}

// Parse patient header from top lines of a page
function parsePageHeader(lines) {
  const info = {};
  for (const line of lines.slice(0, 15)) {
    // Header: LASTNAME, FIRSTNAME age sex provider accession(9)
    const mHead = line.match(/^([A-Z][A-Z'\-]+),\s+([A-Z][A-Z\s'\-]+?)\s+\d+\s+[MF]\s+\d+\s+\S+\s+\S+\s+(\d{9})\s*$/);
    if (mHead) {
      info.last_name = mHead[1].trim();
      info.first_name = mHead[2].trim();
      info.accession = mHead[3];
    }
    // Date line with time: ORDER TIME DATE DATE DATE FINAL/PRELIM
    const mDate = line.match(/^\d+\s+[\d:]+\s+(\d+\/\d+\/\d+)\s+\S+\s+\S+\s+(?:FINAL|PRELIM)/);
    if (mDate) info.collected_date = parseDate(mDate[1]);
    // Date line without time: ORDER DATE DATE DATE FINAL/PRELIM
    const mDate2 = line.match(/^\d+\s+(\d+\/\d+\/\d+)\s+\S+\s+\S+\s+(?:FINAL|PRELIM)/);
    if (mDate2 && !info.collected_date) info.collected_date = parseDate(mDate2[1]);
    // DOB
    const mDob = line.match(/DOB:\s*(\d+\/\d+\/\d+)/);
    if (mDob) info.dob = parseDate(mDob[1]);
  }
  return info;
}

// Parse biomarkers from page lines
function parseBiomarkers(lines) {
  const skip = [
    'RANGE MEDICAL', 'David V', 'DOB:', '000000', 'RVD', 'CONTINUED',
    'NOTE', '*', 'Reference', 'According', 'Vitamin D status', 'Hemoglobin',
    'HgB', 'To convert', 'Values for', 'The above', 'Male:', 'Female:',
    '1901', 'NEWPORT BEACH', '949', 'END OF', 'Units for', 'CHOL/HDL',
    'For African', 'interpreted', 'interfere', 'insulin antibodies',
    'overweight', 'Deficiency', 'Insufficiency', 'Sufficiency', 'Toxicity',
    'HgB A1c', 'preceding', '<5.7', '6.1', '6.5%',
  ];
  const results = {};
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || skip.some(p => line.startsWith(p))) continue;
    const upper = line.toUpperCase();
    for (const key of SORTED_KEYS) {
      if (upper.startsWith(key)) {
        const rest = line.slice(key.length);
        const mVal = rest.match(/^\s*([<>]?\d+\.?\d*)\s*([HL])?/);
        if (mVal) {
          const valStr = mVal[1].replace(/^[<>]/, '');
          const val = parseFloat(valStr);
          if (!isNaN(val)) {
            const col = BIOMARKER_MAP[key];
            if (col && !(col in results)) results[col] = val;
          }
        }
        break;
      }
    }
  }
  return results;
}

// ── Patient matching ──────────────────────────────────────────────────────────

function normalize(s) {
  return (s || '').toLowerCase().replace(/[^a-z]/g, '');
}

function findPatient(patients, lastName, firstName, dob) {
  const lastNorm = normalize(lastName);
  const firstNorm = normalize(firstName).slice(0, 4); // match first 4 chars of first name
  const dobStr = dob || '';

  // Helper: extract last/first from a full "name" field (e.g. "Brian Steiner" → last=steiner, first=bria)
  const nameMatch = (p) => {
    if (!p.name) return false;
    const parts = p.name.trim().split(/\s+/);
    if (parts.length < 2) return false;
    const pLast = normalize(parts[parts.length - 1]);
    const pFirst = normalize(parts[0]).slice(0, 4);
    return pLast === lastNorm && pFirst === firstNorm;
  };

  // 1. Try last + first + DOB (using first_name/last_name columns)
  if (dobStr) {
    const exact = patients.find(p =>
      normalize(p.last_name) === lastNorm &&
      normalize(p.first_name).startsWith(firstNorm) &&
      p.date_of_birth === dobStr
    );
    if (exact) return exact;
  }

  // 2. Try last + first via first_name/last_name columns (no DOB)
  const byName = patients.find(p =>
    normalize(p.last_name) === lastNorm &&
    normalize(p.first_name).startsWith(firstNorm)
  );
  if (byName) return byName;

  // 3. Try matching against the full "name" column (e.g. "Brian Steiner")
  //    Some patients are stored with only a name field, not split first/last
  const byFullName = patients.find(p => nameMatch(p));
  if (byFullName) return byFullName;

  // 4. Fuzzy last (first 5 chars) + first via first_name/last_name
  const lastShort = lastNorm.slice(0, 5);
  const byFuzzy = patients.find(p =>
    normalize(p.last_name).startsWith(lastShort) &&
    normalize(p.first_name).startsWith(firstNorm)
  );
  if (byFuzzy) return byFuzzy;

  // 5. Fuzzy match against full "name" column (first 5 of last)
  const byFuzzyFull = patients.find(p => {
    if (!p.name) return false;
    const parts = p.name.trim().split(/\s+/);
    if (parts.length < 2) return false;
    const pLast = normalize(parts[parts.length - 1]);
    const pFirst = normalize(parts[0]).slice(0, 4);
    return pLast.startsWith(lastShort) && pFirst === firstNorm;
  });
  if (byFuzzyFull) return byFuzzyFull;

  return null;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { pdfBase64, fileName } = req.body;
  if (!pdfBase64) return res.status(400).json({ error: 'pdfBase64 is required' });

  try {
    // 1. Decode PDF
    const pdfBuffer = Buffer.from(pdfBase64.replace(/^data:application\/pdf;base64,/, ''), 'base64');
    // 2. Extract text from all pages using pdf-parse
    // pdf-parse bundles its own pdfjs internally and handles all worker setup,
    // making it reliable on Vercel serverless without any worker configuration.
    // We use the pagerender callback to get the raw pdfjs page object per page
    // so itemsToLines() (which uses getTextContent + positional transforms) works
    // exactly as before — zero changes to the parsing logic downstream.
    //
    // NOTE: require the lib path directly to avoid pdf-parse's index.js loading
    // a test file that doesn't exist in production (known Next.js quirk).
    const pdfParse = require('pdf-parse/lib/pdf-parse.js');

    const pageLines = [];
    await pdfParse(pdfBuffer, {
      pagerender: async (pageData) => {
        const content = await pageData.getTextContent();
        pageLines.push(itemsToLines(content.items));
        return ''; // pdf-parse expects a string return; we store lines ourselves
      }
    });

    // 3. Group pages by patient (accession number)
    // A new patient starts when the header line (LASTNAME, FIRSTNAME ...) appears on a page
    // where the accession differs from the previous group
    const patientGroups = []; // [{accession, info, pages: [0-indexed]}]

    for (let i = 0; i < pageLines.length; i++) {
      const header = parsePageHeader(pageLines[i]);
      if (!header.accession) continue;

      const last = patientGroups[patientGroups.length - 1];
      if (last && last.accession === header.accession) {
        last.pages.push(i);
        // Merge any newly found info
        if (header.collected_date && !last.info.collected_date) last.info.collected_date = header.collected_date;
        if (header.dob && !last.info.dob) last.info.dob = header.dob;
      } else {
        patientGroups.push({ accession: header.accession, info: header, pages: [i] });
      }
    }

    // 4. Collect biomarkers for each patient group
    for (const group of patientGroups) {
      const allLines = group.pages.flatMap(p => pageLines[p]);
      group.biomarkers = parseBiomarkers(allLines);
    }

    // 5. Load all patients from DB for matching + reviewer IDs for tasks
    const [{ data: allPatients }, reviewerIds] = await Promise.all([
      supabase.from('patients').select('id, first_name, last_name, name, date_of_birth').order('last_name'),
      loadReviewerIds(supabase),
    ]);

    // 6. Check existing lab records (batch)
    const accessionList = patientGroups.map(g => g.accession);
    // Check by accession stored in labs? No — check by patient_id + test_date + lab_provider

    // 7. Load original PDF for splitting
    const srcPdf = await PDFDocument.load(pdfBuffer);

    // 8. Process each patient group
    const results = [];

    for (const group of patientGroups) {
      const { accession, info, pages, biomarkers } = group;
      const result = {
        accession,
        name: `${info.last_name}, ${info.first_name}`,
        date: info.collected_date,
        biomarker_count: Object.keys(biomarkers).length,
        status: null,
        message: '',
        patient_id: null,
      };

      // Skip if no biomarkers
      if (Object.keys(biomarkers).length === 0) {
        result.status = 'skipped';
        result.message = 'No biomarkers found (may be header-only or STAT page)';
        results.push(result);
        continue;
      }

      // Match patient
      const match = findPatient(allPatients, info.last_name, info.first_name, info.dob);
      if (!match) {
        result.status = 'not_found';
        result.message = `No patient found for "${info.last_name}, ${info.first_name}" (DOB: ${info.dob || 'unknown'})`;
        results.push(result);
        continue;
      }

      result.patient_id = match.id;
      result.matched_name = `${match.first_name} ${match.last_name}`;

      // Check date
      if (!info.collected_date) {
        result.status = 'error';
        result.message = 'Could not parse collection date';
        results.push(result);
        continue;
      }

      // Check duplicate
      const { data: existing } = await supabase
        .from('labs')
        .select('id')
        .eq('patient_id', match.id)
        .eq('test_date', info.collected_date)
        .eq('lab_provider', 'Primex')
        .limit(1);

      if (existing && existing.length > 0) {
        // Still upload PDF if not already there
        await ensurePdfUploaded(srcPdf, pages, match.id, info, fileName);
        result.status = 'duplicate';
        result.message = `Lab record already exists for ${info.collected_date} — PDF linked`;
        results.push(result);
        continue;
      }

      // Insert lab record
      const labRecord = {
        patient_id: match.id,
        test_date: info.collected_date,
        lab_provider: 'Primex',
        lab_type: 'baseline',
        status: 'completed',
        ...biomarkers,
      };

      const { error: insertErr } = await supabase.from('labs').insert(labRecord);
      if (insertErr) {
        result.status = 'error';
        result.message = `Insert failed: ${insertErr.message}`;
        results.push(result);
        continue;
      }

      // Upload PDF
      await ensurePdfUploaded(srcPdf, pages, match.id, info, fileName);

      // Post-import: advance pipeline + create review tasks
      const displayName = `${info.first_name?.charAt(0).toUpperCase() + info.first_name?.slice(1).toLowerCase()} ${info.last_name?.charAt(0).toUpperCase() + info.last_name?.slice(1).toLowerCase()}`.trim();
      await postImportActions(supabase, match.id, displayName || result.name, info.collected_date, reviewerIds);

      result.status = 'imported';
      result.message = `Imported ${Object.keys(biomarkers).length} biomarkers`;
      results.push(result);
    }

    // Summarize
    const summary = {
      total: results.length,
      imported: results.filter(r => r.status === 'imported').length,
      duplicates: results.filter(r => r.status === 'duplicate').length,
      not_found: results.filter(r => r.status === 'not_found').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
    };

    return res.status(200).json({ success: true, summary, results });

  } catch (err) {
    console.error('Primex PDF import error:', err);
    return res.status(500).json({ error: err.message || 'Import failed' });
  }
}

// ── Upload per-patient PDF to Supabase Storage ────────────────────────────────

async function ensurePdfUploaded(srcPdf, pages, patientId, info, sourceFileName) {
  try {
    // Check if already uploaded for this patient + date
    const { data: existing } = await supabase
      .from('lab_documents')
      .select('id')
      .eq('patient_id', patientId)
      .eq('collection_date', info.collected_date)
      .limit(1);

    if (existing && existing.length > 0) return; // Already uploaded

    // Create per-patient PDF
    const splitDoc = await PDFDocument.create();
    const copiedPages = await splitDoc.copyPages(srcPdf, pages);
    copiedPages.forEach(p => splitDoc.addPage(p));
    const splitBytes = await splitDoc.save();

    const lastName = (info.last_name || 'Unknown').replace(/[^a-zA-Z]/g, '');
    const firstName = (info.first_name || 'Unknown').replace(/[^a-zA-Z]/g, '').slice(0, 4);
    const filename = `${lastName}_${firstName}_${info.collected_date}_Primex.pdf`;
    const timestamp = Date.now();
    const filePath = `${patientId}/${timestamp}-${filename}`;

    await supabase.storage
      .from('lab-documents')
      .upload(filePath, splitBytes, { contentType: 'application/pdf', upsert: false });

    await supabase.from('lab_documents').insert({
      patient_id: patientId,
      file_name: filename,
      file_path: filePath,
      file_size: splitBytes.length,
      lab_type: 'Baseline',
      collection_date: info.collected_date,
      notes: `Primex batch import${sourceFileName ? ` — from ${sourceFileName}` : ''}`,
      uploaded_by: 'system',
    });
  } catch (e) {
    console.error('PDF upload error (non-fatal):', e.message);
  }
}
