#!/usr/bin/env node
// Re-parse all stored lab PDFs and fix values that were truncated by the
// pre-Apr-2026 parser (which read "1,234" as "1" because it didn't handle commas).
//
// Strategy: only OVERWRITE values that match the comma-truncation signature:
//   String(stored) === String(parsed).slice(0, n)    AND
//   (String(parsed).length - String(stored).length) ∈ [3, 6, 9]
// e.g. stored=1, parsed=1234   → "1234" starts with "1" + 3 digits   → fix
//      stored=12, parsed=12345 → "12345" starts with "12" + 3 digits → fix
//      stored=20, parsed=20    → no change
//      stored=1, parsed=1.5    → no change (parsed < 100)
//
// Usage:
//   node scripts/fix-truncated-lab-values.mjs           # dry run
//   node scripts/fix-truncated-lab-values.mjs --apply   # apply updates

import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

const APPLY = process.argv.includes('--apply');
const ONLY_PATIENT = process.argv.find(a => a.startsWith('--patient='))?.split('=')[1];

const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

// ── Mirror of BIOMARKER_MAP from primex-pdf.js ────────────────────────────────
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

// FIXED parser — handles commas in numbers like "1,234"
function parseBiomarkers(lines) {
  const results = {};
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || SKIP.some(p => line.startsWith(p))) continue;
    const upper = line.toUpperCase();
    for (const key of SORTED_KEYS) {
      if (upper.startsWith(key)) {
        const rest = line.slice(key.length);
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

// True if `parsed` looks like a comma-truncated version of `stored`.
// e.g. stored=1, parsed=1234 → '1234'.startsWith('1') and length diff is 3
function isTruncated(stored, parsed) {
  if (stored == null || parsed == null) return false;
  if (parsed <= stored) return false;
  // Use the integer parts for prefix comparison, since pre-fix old parser
  // would only have read up to the comma anyway.
  const sStr = String(Math.floor(stored));
  const pStr = String(Math.floor(parsed));
  if (!pStr.startsWith(sStr)) return false;
  const diff = pStr.length - sStr.length;
  // One comma group = 3 extra digits, two = 6, three = 9
  return diff === 3 || diff === 6 || diff === 9;
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);
if (ONLY_PATIENT) console.log(`Patient filter: ${ONLY_PATIENT}`);

let docQuery = supabase
  .from('lab_documents')
  .select('id, patient_id, file_path, collection_date, file_name')
  .order('collection_date', { ascending: false });

if (ONLY_PATIENT) docQuery = docQuery.eq('patient_id', ONLY_PATIENT);

const { data: docs, error: docsErr } = await docQuery;
if (docsErr) { console.error(docsErr); process.exit(1); }

console.log(`Processing ${docs.length} lab documents...\n`);

// Cache patient names
const pids = [...new Set(docs.map(d => d.patient_id))];
const { data: patients } = await supabase
  .from('patients').select('id, name, gender').in('id', pids);
const patMap = new Map((patients || []).map(p => [p.id, p]));

const stats = {
  processed: 0,
  no_lab_record: 0,
  parse_error: 0,
  no_biomarkers: 0,
  no_changes: 0,
  fixed_records: 0,
  fixed_values: 0,
};

const fixSummary = []; // { patient, lab_id, fixes: [{col, stored, parsed}] }

for (const doc of docs) {
  stats.processed++;
  const pat = patMap.get(doc.patient_id);
  const patLabel = `${pat?.name || '?'} (${pat?.gender || '?'})`;

  // Find matching lab record
  let labQuery = supabase.from('labs').select('*').eq('patient_id', doc.patient_id);
  if (doc.collection_date) labQuery = labQuery.eq('test_date', doc.collection_date);
  const { data: labs } = await labQuery.limit(1);
  if (!labs?.length) {
    stats.no_lab_record++;
    continue;
  }
  const lab = labs[0];

  // Download + parse PDF
  const { data: fileData, error: dlErr } = await supabase.storage
    .from('lab-documents').download(doc.file_path);
  if (dlErr || !fileData) {
    stats.parse_error++;
    console.log(`✗ ${patLabel} — download failed: ${dlErr?.message}`);
    continue;
  }

  let parsed;
  try {
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const allLines = [];
    await pdfParse(buffer, {
      pagerender: async (pageData) => {
        const content = await pageData.getTextContent();
        allLines.push(...itemsToLines(content.items));
        return '';
      }
    });
    parsed = parseBiomarkers(allLines);
  } catch (err) {
    stats.parse_error++;
    console.log(`✗ ${patLabel} — parse error: ${err.message}`);
    continue;
  }

  if (!Object.keys(parsed).length) {
    stats.no_biomarkers++;
    continue;
  }

  // Compare each parsed biomarker against stored. Only flag truncation pattern.
  const fixes = [];
  for (const [col, parsedVal] of Object.entries(parsed)) {
    const storedVal = lab[col];
    if (isTruncated(storedVal, parsedVal)) {
      fixes.push({ col, stored: storedVal, parsed: parsedVal });
    }
  }

  if (!fixes.length) {
    stats.no_changes++;
    continue;
  }

  stats.fixed_records++;
  stats.fixed_values += fixes.length;
  fixSummary.push({
    patient: patLabel,
    patient_id: doc.patient_id,
    lab_id: lab.id,
    test_date: lab.test_date,
    file_name: doc.file_name,
    fixes,
  });

  console.log(`${APPLY ? '→' : '·'} ${patLabel} — ${doc.file_name}`);
  for (const f of fixes) {
    console.log(`    ${f.col}: ${f.stored} → ${f.parsed}`);
  }

  if (APPLY) {
    const updates = Object.fromEntries(fixes.map(f => [f.col, f.parsed]));
    const { error: updErr } = await supabase
      .from('labs').update(updates).eq('id', lab.id);
    if (updErr) console.log(`    !! UPDATE FAILED: ${updErr.message}`);
  }
}

console.log('\n── Summary ──');
console.log(`Processed:           ${stats.processed}`);
console.log(`No matching lab:     ${stats.no_lab_record}`);
console.log(`Parse errors:        ${stats.parse_error}`);
console.log(`No biomarkers:       ${stats.no_biomarkers}`);
console.log(`No changes needed:   ${stats.no_changes}`);
console.log(`Records to fix:      ${stats.fixed_records}`);
console.log(`Values to fix:       ${stats.fixed_values}`);
console.log(`\n${APPLY ? 'Updates applied.' : 'Dry run — no changes made. Re-run with --apply to commit.'}`);
