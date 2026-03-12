#!/usr/bin/env node
/**
 * upload-primex-pdfs.js — Range Medical CRM
 *
 * Uploads per-patient Primex PDFs to Supabase Storage (lab-documents/primex/)
 * and updates pdf_url on the matching labs row.
 *
 * Run this from the repo root after primex_parser.py has generated the PDFs:
 *   node scripts/upload-primex-pdfs.js
 *
 * Reads PDFs from:  <repo-root>/primex-pdfs/
 * Uploads to:       lab-documents/primex/<filename>
 * Updates:          labs.pdf_url WHERE patient matches AND test_date matches
 *
 * Filename convention (set by primex_parser.py):
 *   Lastname_Firstname_YYYY-MM-DD.pdf
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET       = 'lab-documents';
const PREFIX       = 'primex';
const PDF_DIR      = path.join(__dirname, '../primex-pdfs');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

/**
 * Parse filename back to name components.
 * Lastname_Firstname_YYYY-MM-DD.pdf
 * The date (YYYY-MM-DD) is always the LAST underscore-delimited token.
 * Handles O_Brien → O'Brien (multi-part last names rejoin with apostrophe).
 */
function parseFilename(filename) {
  const base = filename.replace(/\.pdf$/, '');
  const parts = base.split('_');
  // Date is always the last token (contains hyphens, not underscores)
  const testDate = parts[parts.length - 1];
  // Everything before the date is name parts — filter out empty strings
  const nameParts = parts.slice(0, -1).filter(Boolean);
  // Drop trailing single-char parts (middle initials like "C" in Ventimiglia_Tara_C)
  while (nameParts.length > 2 && nameParts[nameParts.length - 1].length === 1) {
    nameParts.pop();
  }
  // firstName is always the last name part; everything before is lastName
  const firstName = nameParts[nameParts.length - 1];
  // Re-join multi-part last names with apostrophe (O_Brien → O'Brien)
  const lastName = nameParts.slice(0, -1).join("'");
  return { lastName, firstName, testDate };
}

/** Simple Levenshtein edit distance */
function editDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

/**
 * Fuzzy patient lookup — tries progressively looser matching:
 *  1. Exact ilike match on first + last name
 *  2. Normalize hyphens/apostrophes in last name
 *  3. Strip parentheticals from DB first_name (e.g. "Richard (rick)")
 *  4. Common nickname/variant matching (Mike↔Michael, Kate↔Katherine, etc.)
 *  5. Last-resort: last_name match + first_name starts-with
 */
const NICKNAME_MAP = {
  mike: ['michael'], michael: ['mike'],
  kate: ['katherine', 'kathryn', 'kathy'], katherine: ['kate', 'kathy'], kathryn: ['kate'],
  dan: ['daniel', 'danny'], daniel: ['dan', 'danny'], danny: ['dan', 'daniel'],
  matt: ['matthew', 'mathew'], matthew: ['matt', 'mathew'], mathew: ['matt', 'matthew'],
  phil: ['phillip', 'philip'], phillip: ['phil', 'philip'], philip: ['phil', 'phillip'],
  rick: ['richard'], richard: ['rick', 'dick'],
  tony: ['anthony'], anthony: ['tony'],
  bill: ['william'], william: ['bill', 'will'],
  bob: ['robert'], robert: ['bob', 'rob'],
  jim: ['james'], james: ['jim', 'jimmy'],
  chris: ['christopher'], christopher: ['chris'],
  steve: ['steven', 'stephen'], steven: ['steve'], stephen: ['steve'],
  nick: ['nicholas'], nicholas: ['nick'],
  joe: ['joseph'], joseph: ['joe'],
  tom: ['thomas'], thomas: ['tom'],
  jen: ['jennifer'], jennifer: ['jen', 'jenny'],
  liz: ['elizabeth'], elizabeth: ['liz', 'beth'],
  ed: ['edward', 'edwin'], edward: ['ed', 'eddie'],
};

/**
 * Manual overrides for patients whose Primex name doesn't match their DB name.
 * Key: "primex_first primex_last" (lowercase). Value: { firstName, lastName } in DB.
 */
const NAME_OVERRIDES = {
  'michelle davidson': { firstName: 'Thoa Mai', lastName: 'Davidson' },
  'lily diaz':         { firstName: 'Lily',     lastName: 'Nikou' },
  'tony quartatato':   { firstName: 'Anthony',  lastName: 'Quartararo' },
};

async function findPatient(firstName, lastName) {
  // 0. Check manual overrides first
  const overrideKey = `${firstName.toLowerCase()} ${lastName.toLowerCase()}`;
  if (NAME_OVERRIDES[overrideKey]) {
    firstName = NAME_OVERRIDES[overrideKey].firstName;
    lastName  = NAME_OVERRIDES[overrideKey].lastName;
  }

  // Normalize: lowercase, replace apostrophes with hyphens (DB uses hyphens)
  const normLast = lastName.toLowerCase().replace(/'/g, '-');
  const normFirst = firstName.toLowerCase();

  // 1. Try exact match
  let { data } = await supabase
    .from('patients')
    .select('id, first_name, last_name')
    .ilike('last_name', lastName)
    .ilike('first_name', firstName)
    .limit(1);
  if (data?.length) return data[0];

  // 2. Try with normalized last name (apostrophe → hyphen)
  if (normLast !== lastName.toLowerCase()) {
    ({ data } = await supabase
      .from('patients')
      .select('id, first_name, last_name')
      .ilike('last_name', normLast)
      .ilike('first_name', firstName)
      .limit(1));
    if (data?.length) return data[0];
  }

  // 3. Fetch all patients with matching last name (either form) for further checks
  const { data: candidates } = await supabase
    .from('patients')
    .select('id, first_name, last_name')
    .or(`last_name.ilike.${lastName},last_name.ilike.${normLast}`);

  if (!candidates?.length) return null;

  // 4. Strip parentheticals from DB first_name and compare
  for (const c of candidates) {
    const dbFirst = c.first_name.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
    if (dbFirst === normFirst) return c;
  }

  // 5. Nickname / variant matching
  const variants = NICKNAME_MAP[normFirst] || [];
  for (const c of candidates) {
    const dbFirst = c.first_name.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
    if (variants.includes(dbFirst)) return c;
  }

  // 6. Starts-with match (catches "Mathew" matching "Matthew", etc.)
  const prefix = normFirst.slice(0, 3);
  for (const c of candidates) {
    const dbFirst = c.first_name.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
    if (dbFirst.startsWith(prefix) && normFirst.startsWith(prefix)) return c;
  }

  // 7. Edit distance ≤ 2 (catches typos like Leseane → Luseane)
  for (const c of candidates) {
    const dbFirst = c.first_name.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
    if (editDistance(normFirst, dbFirst) <= 2) return c;
  }

  return null;
}

async function run() {
  if (!fs.existsSync(PDF_DIR)) {
    console.error(`No primex-pdfs/ folder found at:\n  ${PDF_DIR}`);
    console.error('Run primex_parser.py first to generate the split PDFs.');
    process.exit(1);
  }

  const files = fs.readdirSync(PDF_DIR)
    .filter(f => f.endsWith('.pdf'))
    .sort();

  if (!files.length) {
    console.log('No PDFs found in primex-pdfs/ — nothing to do.');
    process.exit(0);
  }

  console.log(`Found ${files.length} PDF(s) in primex-pdfs/\n`);

  let uploaded = 0;
  let skipped  = 0;
  let errors   = 0;

  for (const filename of files) {
    const { lastName, firstName, testDate } = parseFilename(filename);
    const localPath   = path.join(PDF_DIR, filename);
    const storagePath = `${PREFIX}/${filename}`;
    const publicUrl   = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;

    process.stdout.write(`  ${firstName} ${lastName} | ${testDate} | `);

    try {
      // 1. Upload to Storage
      const fileBuffer = fs.readFileSync(localPath);
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });
      if (uploadErr) throw new Error(`Upload: ${uploadErr.message}`);

      // 2. Find patient_id (fuzzy matching)
      const patient = await findPatient(firstName, lastName);
      if (!patient) {
        console.log(`✓ uploaded | ⚠ patient not found in DB`);
        uploaded++;
        continue;
      }

      // 3. Update labs row
      const matchNote = (patient.first_name.toLowerCase() !== firstName.toLowerCase() ||
                         patient.last_name.toLowerCase() !== lastName.toLowerCase())
        ? ` (matched → ${patient.first_name} ${patient.last_name})`
        : '';
      const { error: updateErr } = await supabase
        .from('labs')
        .update({ pdf_url: publicUrl })
        .eq('patient_id', patient.id)
        .eq('lab_provider', 'Primex')
        .eq('test_date', testDate);
      if (updateErr) throw new Error(`DB update: ${updateErr.message}`);

      console.log(`✓ uploaded + pdf_url set${matchNote}`);
      uploaded++;

    } catch (err) {
      console.log(`✗ ${err.message}`);
      errors++;
    }
  }

  console.log(`\n────────────────────────────────`);
  console.log(`Uploaded: ${uploaded}  Skipped: ${skipped}  Errors: ${errors}`);
  if (uploaded > 0) {
    console.log(`\nStorage path: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${PREFIX}/`);
  }
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
