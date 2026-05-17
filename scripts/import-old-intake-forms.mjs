#!/usr/bin/env node
// scripts/import-old-intake-forms.mjs
// Import old-system Medical Intake Form PDFs into Supabase:
//   1. Match PDF filename to a patient
//   2. Skip if patient already has an intake record
//   3. Upload PDF to Supabase Storage (patient-documents bucket)
//   4. Create a minimal intake record with external_source = 'old_system'
//
// Usage:
//   node --env-file=.env.local scripts/import-old-intake-forms.mjs          # dry run
//   node --env-file=.env.local scripts/import-old-intake-forms.mjs --apply  # actually import

import { createClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';

const FORMS_DIR = '/Users/chriscupp/Desktop/forms_pdf';
const DRY_RUN = !process.argv.includes('--apply');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  console.error('Run with: node --env-file=.env.local scripts/import-old-intake-forms.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const NICKNAMES = new Map([
  ['becky', 'rebecca'], ['rebecca', 'becky'],
  ['tim', 'timothy'], ['timothy', 'tim'],
  ['andy', 'andrew'], ['andrew', 'andy'],
  ['mike', 'michael'], ['michael', 'mike'],
  ['matt', 'matthew'], ['matthew', 'matt'],
  ['bob', 'robert'], ['robert', 'bob'],
  ['jim', 'james'], ['james', 'jim'],
  ['bill', 'william'], ['william', 'bill'],
  ['dan', 'daniel'], ['daniel', 'dan'],
  ['dave', 'david'], ['david', 'dave'],
  ['joe', 'joseph'], ['joseph', 'joe'],
  ['tom', 'thomas'], ['thomas', 'tom'],
  ['chris', 'christopher'], ['christopher', 'chris'],
  ['nick', 'nicholas'], ['nicholas', 'nick'],
  ['steve', 'steven'], ['steven', 'steve'],
  ['jen', 'jennifer'], ['jennifer', 'jen'],
  ['liz', 'elizabeth'], ['elizabeth', 'liz'],
  ['kate', 'katherine'], ['katherine', 'kate'],
  ['tony', 'anthony'], ['anthony', 'tony'],
  ['rick', 'richard'], ['richard', 'rick'],
  ['don', 'donald'], ['donald', 'don'],
  ['ed', 'edward'], ['edward', 'ed'],
  ['ben', 'benjamin'], ['benjamin', 'ben'],
  ['sam', 'samuel'], ['samuel', 'sam'],
  ['jon', 'jonathan'], ['jonathan', 'jon'],
  ['alex', 'alexander'], ['alexander', 'alex'],
  ['greg', 'gregory'], ['gregory', 'greg'],
  ['ray', 'raymond'], ['raymond', 'ray'],
  ['bree', 'breanna'], ['breanna', 'bree'],
]);

function normalize(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFilename(filename) {
  // Pattern: FirstName_LastName_Medical_Intake_Form_YYYY-MM-DD.pdf
  const match = filename.match(/^(.+?)_Medical_Intake_Form_(\d{4}-\d{2}-\d{2})\.pdf$/i);
  if (!match) return null;
  const namePart = match[1];
  const date = match[2];
  const parts = namePart.split('_').filter(Boolean);
  if (parts.length < 2) return null;
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName, date };
}

async function fetchAllPatients() {
  const PAGE = 1000;
  let from = 0;
  let all = [];
  while (true) {
    const { data, error } = await supabase
      .from('patients')
      .select('id, name, first_name, last_name, email')
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`patients fetch: ${error.message}`);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function fetchExistingIntakePatientIds() {
  const PAGE = 1000;
  let from = 0;
  const ids = new Set();
  while (true) {
    const { data, error } = await supabase
      .from('intakes')
      .select('patient_id')
      .not('patient_id', 'is', null)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`intakes fetch: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const r of data) ids.add(r.patient_id);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return ids;
}

function buildPatientIndex(patients) {
  const byNormName = new Map();
  for (const p of patients) {
    const fn = normalize(p.first_name || '');
    const ln = normalize(p.last_name || '');
    if (!fn || !ln) continue;
    const key = `${fn} ${ln}`;
    if (!byNormName.has(key)) byNormName.set(key, []);
    byNormName.get(key).push(p);

    // Also index by name field
    const fullNorm = normalize(p.name || '');
    if (fullNorm && fullNorm !== key) {
      if (!byNormName.has(fullNorm)) byNormName.set(fullNorm, []);
      byNormName.get(fullNorm).push(p);
    }
  }
  return byNormName;
}

function findPatient(firstName, lastName, index) {
  const normFirst = normalize(firstName);
  const normLast = normalize(lastName);
  const key = `${normFirst} ${normLast}`;
  const matches = index.get(key);
  if (matches && matches.length === 1) return { status: 'matched', patients: matches };
  if (matches && matches.length > 1) return { status: 'ambiguous', patients: matches };

  // Try nickname
  const nick = NICKNAMES.get(normFirst);
  if (nick) {
    const altKey = `${nick} ${normLast}`;
    const altMatches = index.get(altKey);
    if (altMatches && altMatches.length === 1) return { status: 'matched', patients: altMatches };
    if (altMatches && altMatches.length > 1) return { status: 'ambiguous', patients: altMatches };
  }

  return { status: 'unmatched', patients: [] };
}

async function uploadPdf(patientId, filePath, filename) {
  const fileBuffer = readFileSync(filePath);
  const timestamp = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${patientId}/${timestamp}-${safeName}`;

  const { data, error } = await supabase.storage
    .from('patient-documents')
    .upload(storagePath, fileBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from('patient-documents')
    .getPublicUrl(storagePath);

  return urlData?.publicUrl || storagePath;
}

async function createIntakeRecord(patientId, firstName, lastName, formDate, pdfUrl) {
  const { data, error } = await supabase
    .from('intakes')
    .insert({
      patient_id: patientId,
      first_name: firstName,
      last_name: lastName,
      external_source: 'old_system',
      external_notes: 'Imported from old system PDF forms',
      marked_external_by: 'batch_import',
      pdf_url: pdfUrl,
      consent_given: true,
      submitted_at: `${formDate}T00:00:00.000Z`,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Intake insert failed: ${error.message}`);
  return data.id;
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN (add --apply to actually import) ===' : '=== APPLYING CHANGES ===');
  console.log('');

  const files = readdirSync(FORMS_DIR)
    .filter(f => f.includes('Medical_Intake_Form') && f.endsWith('.pdf'));

  console.log(`Found ${files.length} Medical Intake Form PDFs`);

  console.log('Loading patients from Supabase...');
  const patients = await fetchAllPatients();
  console.log(`Loaded ${patients.length} patients`);

  console.log('Checking existing intakes...');
  const existingIntakeIds = await fetchExistingIntakePatientIds();
  console.log(`${existingIntakeIds.size} patients already have intake records`);
  console.log('');

  const index = buildPatientIndex(patients);

  const results = { imported: [], skipped_has_intake: [], unmatched: [], ambiguous: [], errors: [] };

  for (const file of files) {
    const parsed = parseFilename(file);
    if (!parsed) {
      console.log(`  ⚠ Could not parse filename: ${file}`);
      results.errors.push({ file, reason: 'parse_failed' });
      continue;
    }

    const { firstName, lastName, date } = parsed;
    const displayName = `${firstName} ${lastName}`;
    const match = findPatient(firstName, lastName, index);

    if (match.status === 'unmatched') {
      console.log(`  ✗ No patient found for: ${displayName}`);
      results.unmatched.push({ file, name: displayName });
      continue;
    }

    if (match.status === 'ambiguous') {
      // Try to resolve: pick patient with activity, or oldest
      const withActivity = [];
      for (const p of match.patients) {
        const { count: pCount } = await supabase.from('protocols').select('id', { count: 'exact', head: true }).eq('patient_id', p.id);
        const { count: sCount } = await supabase.from('service_logs').select('id', { count: 'exact', head: true }).eq('patient_id', p.id);
        const activity = (pCount || 0) + (sCount || 0);
        withActivity.push({ ...p, activity });
      }
      withActivity.sort((a, b) => b.activity - a.activity);
      if (withActivity[0].activity > 0 && withActivity[0].activity > (withActivity[1]?.activity || 0)) {
        match.status = 'matched';
        match.patients = [withActivity[0]];
        console.log(`  ~ Resolved ambiguous ${displayName} → ${withActivity[0].id.slice(0, 8)} (has activity)`);
      } else {
        const ids = match.patients.map(p => `${p.name || p.first_name + ' ' + p.last_name} (${p.id.slice(0, 8)})`).join(', ');
        console.log(`  ? Ambiguous match for: ${displayName} → ${ids}`);
        results.ambiguous.push({ file, name: displayName, candidates: match.patients.length });
        continue;
      }
    }

    const patient = match.patients[0];

    if (existingIntakeIds.has(patient.id)) {
      console.log(`  – Already has intake: ${displayName} (${patient.id.slice(0, 8)})`);
      results.skipped_has_intake.push({ file, name: displayName, patientId: patient.id });
      continue;
    }

    if (DRY_RUN) {
      console.log(`  ✓ Would import: ${displayName} → ${patient.id.slice(0, 8)} (${date})`);
      results.imported.push({ file, name: displayName, patientId: patient.id });
      continue;
    }

    try {
      const filePath = resolve(FORMS_DIR, file);
      const pdfUrl = await uploadPdf(patient.id, filePath, file);
      const intakeId = await createIntakeRecord(patient.id, firstName, lastName, date, pdfUrl);
      existingIntakeIds.add(patient.id);
      console.log(`  ✓ Imported: ${displayName} → intake ${intakeId}`);
      results.imported.push({ file, name: displayName, patientId: patient.id, intakeId });
    } catch (err) {
      console.log(`  ✗ Error importing ${displayName}: ${err.message}`);
      results.errors.push({ file, name: displayName, reason: err.message });
    }
  }

  console.log('');
  console.log('── Summary ──');
  console.log(`  Imported:            ${results.imported.length}`);
  console.log(`  Already had intake:  ${results.skipped_has_intake.length}`);
  console.log(`  Unmatched:           ${results.unmatched.length}`);
  console.log(`  Ambiguous:           ${results.ambiguous.length}`);
  console.log(`  Errors:              ${results.errors.length}`);

  if (results.unmatched.length > 0) {
    console.log('');
    console.log('── Unmatched names ──');
    for (const u of results.unmatched) console.log(`  ${u.name}`);
  }

  if (results.ambiguous.length > 0) {
    console.log('');
    console.log('── Ambiguous matches ──');
    for (const a of results.ambiguous) console.log(`  ${a.name} (${a.candidates} candidates)`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
