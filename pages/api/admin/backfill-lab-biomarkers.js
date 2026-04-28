// /pages/api/admin/backfill-lab-biomarkers.js
// Re-parses all stored Primex PDF lab documents and backfills any missing
// biomarker values into existing lab records (does NOT overwrite existing values).

import { createClient } from '@supabase/supabase-js';

export const config = {
  api: { bodyParser: false },
  maxDuration: 300,
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Same BIOMARKER_MAP as primex-pdf.js ─────────────────────────────────────
const BIOMARKER_MAP = {
  'TOTAL PROTEIN': 'total_protein', 'ALBUMIN': 'albumin',
  'GLOBULIN (CALC.)': 'globulin', 'GLOBULIN': 'globulin',
  'A/G RATIO (CALC.)': 'ag_ratio', 'A/G RATIO': 'ag_ratio',
  'SGOT (AST)': 'ast', 'SGPT (ALT)': 'alt',
  'ALKALINE PHOSPHATASE': 'alkaline_phosphatase', 'BILIRUBIN, TOTAL': 'total_bilirubin',
  'GAMMA-GLUTAMYL TRANSFERASE': 'ggt', 'GGT': 'ggt',
  'GLUCOSE': 'glucose', 'URIC ACID': 'uric_acid',
  'MAGNESIUM': 'magnesium',
  'BUN/CREATININE (CALC.)': 'bun_creatinine_ratio', 'BUN/CREATININE': 'bun_creatinine_ratio',
  'BUN': 'bun', 'CREATININE': 'creatinine',
  'E.GFR (CALC.)': 'egfr', 'EGFR': 'egfr',
  'CALCIUM': 'calcium', 'CHLORIDE': 'chloride', 'CO2': 'co2',
  'SODIUM': 'sodium', 'POTASSIUM': 'potassium',
  'ANION GAP (CALC.)': 'anion_gap', 'ANION GAP': 'anion_gap',
  'CHOL/HDL RISK RATIO (CALC.)': 'chol_hdl_ratio', 'CHOL/HDL RISK RATIO': 'chol_hdl_ratio',
  'HDL CHOLESTEROL': 'hdl_cholesterol', 'CHOLESTEROL': 'total_cholesterol',
  'LDL (CALC.)': 'ldl_cholesterol', 'VLDL (CALC.)': 'vldl_cholesterol',
  'TRIGLYCERIDES': 'triglycerides',
  'APOLIPOPROT. A-1': 'apolipoprotein_a1', 'APOLIPOPROTEIN A-1': 'apolipoprotein_a1',
  'APOLIPOPROT.B': 'apolipoprotein_b', 'APOLIPOPROTEIN B': 'apolipoprotein_b',
  'APO B/A1 RATIO': 'apo_b_a1_ratio',
  'LIPOPROTEIN (A)': 'lp_a', 'LIPOPROTEIN(A)': 'lp_a',
  'CRP, HIGHLY SENSITIVE': 'crp_hs',
  'C-REACTIVE PROTEIN, HIGH SENSITIVITY': 'crp_hs',
  'C-REACTIVE PROTEIN': 'crp_hs', 'CRP, HIGH SENSITIVITY': 'crp_hs',
  'HOMOCYSTEINE': 'homocysteine',
  'TOTAL T4': 'total_t4', 'FREE T4': 'free_t4',
  'TSH (3RD GENERATION)': 'tsh', 'FREE T3': 'free_t3',
  'REVERSE T3': 'reverse_t3',
  'THYROID PEROXIDASE AB.': 'tpo_antibody', 'THYROID PEROXIDASE AB': 'tpo_antibody',
  'THYROGLOBULIN ANTIBODY': 'thyroglobulin_antibody',
  'SERUM IRON': 'iron', 'IRON': 'iron',
  'TIBC (CALC.)': 'tibc', 'TIBC': 'tibc',
  '%IRON SATURATION (CALC.)': 'iron_saturation', '%IRON SATURATION': 'iron_saturation',
  'IRON SATURATION': 'iron_saturation',
  'FERRITIN': 'ferritin',
  'VITAMIN B-12': 'vitamin_b12', 'VITAMIN B12': 'vitamin_b12',
  'FOLATE, SERUM': 'folate', 'FOLATE': 'folate',
  'WBC': 'wbc', 'RBC': 'rbc', 'HGB': 'hemoglobin', 'HCT': 'hematocrit',
  'MCV': 'mcv', 'MCH': 'mch', 'MCHC': 'mchc', 'RDW': 'rdw',
  'PLATELETS': 'platelets', 'MPV': 'mpv',
  'NEUTROPHILS %': 'neutrophils_percent', 'LYMPHOCYTES %': 'lymphocytes_percent',
  'MONOCYTES %': 'monocytes_percent', 'EOSINOPHILS %': 'eosinophils_percent',
  'BASOPHILS %': 'basophils_percent',
  'NEUTROPHILS': 'neutrophils_percent', 'LYMPHOCYTES': 'lymphocytes_percent',
  'MONOCYTES': 'monocytes_percent', 'EOSINOPHILS': 'eosinophils_percent',
  'BASOPHILS': 'basophils_percent',
  'SED RATE': 'esr',
  'HGBA1C': 'hemoglobin_a1c', 'HEMOGLOBIN A1C': 'hemoglobin_a1c',
  'INSULIN, FASTING': 'fasting_insulin',
  'VITAMIN D, 25-HYDROXY': 'vitamin_d',
  'IGF-1': 'igf_1', 'CORTISOL': 'cortisol',
  'TESTOSTERONE, TOTAL': 'total_testosterone',
  'TESTOSTERONE, FREE': 'free_testosterone', 'FREE TESTOSTERONE': 'free_testosterone',
  'TESTOSTERONE, FREE (CALC.)': 'free_testosterone',
  'SEX HORMONE BNDG. GLOBULIN': 'shbg', 'SEX HORMONE BINDING GLOBULIN': 'shbg', 'SHBG': 'shbg',
  'ESTRADIOL': 'estradiol', 'PROGESTERONE': 'progesterone',
  'DHEA-SULFATE': 'dhea_s', 'DHEA SULFATE': 'dhea_s',
  'LH': 'lh', 'FSH': 'fsh',
  'DHT': 'dht', 'AMH': 'amh',
  'PSA, TOTAL': 'psa_total', 'PSA TOTAL': 'psa_total',
  'FREE PSA': 'psa_free',
  '% FREE PSA (CALC.)': 'psa_free_percent', '% FREE PSA': 'psa_free_percent',
};
const SORTED_KEYS = Object.keys(BIOMARKER_MAP).sort((a, b) => b.length - a.length);

const SKIP = [
  'RANGE MEDICAL', 'David V', 'DOB:', '000000', 'RVD', 'CONTINUED',
  'NOTE', '*', 'Reference', 'According', 'Vitamin D status', 'Hemoglobin',
  'HgB', 'To convert', 'Values for', 'The above', 'Male:', 'Female:',
  '1901', 'NEWPORT BEACH', '949', 'END OF', 'Units for',
  'For African', 'interpreted', 'interfere', 'insulin antibodies',
  'overweight', 'Deficiency', 'Insufficiency', 'Sufficiency', 'Toxicity',
  'HgB A1c', 'preceding', '<5.7', '6.1', '6.5%',
  'Recent data', 'If Total', 'In Prostate',
];

function itemsToLines(items) {
  const lineMap = {};
  for (const item of items) {
    if (typeof item.str !== 'string') continue;
    const y = Math.round(item.transform[5]);
    if (!lineMap[y]) lineMap[y] = [];
    lineMap[y].push({ x: item.transform[4], str: item.str });
  }
  return Object.entries(lineMap)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([, items]) =>
      items.sort((a, b) => a.x - b.x).map(i => i.str).join(' ').trim()
    )
    .filter(Boolean);
}

function parseBiomarkers(lines) {
  const results = {};
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || SKIP.some(p => line.startsWith(p))) continue;
    const upper = line.toUpperCase();
    for (const key of SORTED_KEYS) {
      if (upper.startsWith(key)) {
        const rest = line.slice(key.length);
        // Match comma-separated numbers like "1,234" — the original regex
        // (\d+\.?\d*) was greedy on \d+ but stopped at the first comma, so
        // "1,234" was read as "1". This mirrors the fix in primex-pdf.js.
        const mVal = rest.match(/^\s*([<>]?\d{1,3}(?:,\d{3})*\.?\d*)\s*([HL])?/);
        if (mVal) {
          const valStr = mVal[1].replace(/^[<>]/, '').replace(/,/g, '');
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

function parseDate(s) {
  if (!s) return null;
  const clean = s.trim();
  const m = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  let [, mo, day, yr] = m;
  if (yr.length === 2) yr = parseInt(yr) < 50 ? `20${yr}` : `19${yr}`;
  return `${yr}-${mo.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    // 1. Get all lab documents from storage
    const { data: docs, error: docsErr } = await supabase
      .from('lab_documents')
      .select('id, patient_id, file_path, collection_date, file_name')
      .order('collection_date', { ascending: false });

    if (docsErr) throw docsErr;
    if (!docs || docs.length === 0) {
      return res.status(200).json({ success: true, message: 'No lab documents found', results: [] });
    }

    const pdfParse = require('pdf-parse/lib/pdf-parse.js');
    const results = [];

    for (const doc of docs) {
      const result = {
        doc_id: doc.id,
        patient_id: doc.patient_id,
        file_name: doc.file_name,
        collection_date: doc.collection_date,
        status: null,
        new_values: 0,
      };

      try {
        // 2. Download PDF from storage
        const { data: fileData, error: dlErr } = await supabase.storage
          .from('lab-documents')
          .download(doc.file_path);

        if (dlErr || !fileData) {
          result.status = 'download_error';
          result.message = dlErr?.message || 'No file data';
          results.push(result);
          continue;
        }

        // 3. Parse PDF
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const allLines = [];
        await pdfParse(buffer, {
          pagerender: async (pageData) => {
            const content = await pageData.getTextContent();
            allLines.push(...itemsToLines(content.items));
            return '';
          }
        });

        const parsed = parseBiomarkers(allLines);
        if (Object.keys(parsed).length === 0) {
          result.status = 'no_biomarkers';
          results.push(result);
          continue;
        }

        // 4. Find matching lab record
        let labQuery = supabase
          .from('labs')
          .select('*')
          .eq('patient_id', doc.patient_id);

        if (doc.collection_date) {
          labQuery = labQuery.eq('test_date', doc.collection_date);
        }

        const { data: labs } = await labQuery.limit(1);
        if (!labs || labs.length === 0) {
          result.status = 'no_lab_record';
          results.push(result);
          continue;
        }

        const lab = labs[0];

        // 5. Build update — only fill in NULL columns
        const updates = {};
        for (const [col, val] of Object.entries(parsed)) {
          if (lab[col] === null || lab[col] === undefined) {
            updates[col] = val;
          }
        }

        if (Object.keys(updates).length === 0) {
          result.status = 'already_complete';
          results.push(result);
          continue;
        }

        // 6. Update
        const { error: updateErr } = await supabase
          .from('labs')
          .update(updates)
          .eq('id', lab.id);

        if (updateErr) {
          result.status = 'update_error';
          result.message = updateErr.message;
        } else {
          result.status = 'backfilled';
          result.new_values = Object.keys(updates).length;
          result.filled = Object.keys(updates);
        }
      } catch (err) {
        result.status = 'parse_error';
        result.message = err.message;
      }

      results.push(result);
    }

    const summary = {
      total_docs: results.length,
      backfilled: results.filter(r => r.status === 'backfilled').length,
      already_complete: results.filter(r => r.status === 'already_complete').length,
      no_lab_record: results.filter(r => r.status === 'no_lab_record').length,
      errors: results.filter(r => r.status?.includes('error')).length,
      total_new_values: results.reduce((sum, r) => sum + (r.new_values || 0), 0),
    };

    return res.status(200).json({ success: true, summary, results });
  } catch (err) {
    console.error('Backfill error:', err);
    return res.status(500).json({ error: err.message });
  }
}
