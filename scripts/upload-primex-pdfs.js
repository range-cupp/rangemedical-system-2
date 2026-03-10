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
  // Everything before the date is name parts
  const nameParts = parts.slice(0, -1);
  // firstName is always the last name part; everything before is lastName
  const firstName = nameParts[nameParts.length - 1];
  // Re-join multi-part last names with apostrophe (O_Brien → O'Brien)
  const lastName = nameParts.slice(0, -1).join("'");
  return { lastName, firstName, testDate };
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

      // 2. Find patient_id
      const { data: patients, error: patErr } = await supabase
        .from('patients')
        .select('id')
        .ilike('last_name', lastName)
        .ilike('first_name', firstName)
        .limit(1);
      if (patErr) throw new Error(`Patient lookup: ${patErr.message}`);
      if (!patients?.length) {
        console.log(`✓ uploaded | ⚠ patient not found in DB`);
        uploaded++;
        continue;
      }

      // 3. Update labs row
      const { error: updateErr } = await supabase
        .from('labs')
        .update({ pdf_url: publicUrl })
        .eq('patient_id', patients[0].id)
        .eq('lab_provider', 'Primex')
        .eq('test_date', testDate);
      if (updateErr) throw new Error(`DB update: ${updateErr.message}`);

      console.log(`✓ uploaded + pdf_url set`);
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
