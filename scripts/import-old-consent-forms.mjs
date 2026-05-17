#!/usr/bin/env node
// scripts/import-old-consent-forms.mjs
// Import old-system consent form PDFs into Supabase:
//   1. Match PDF filename to a patient
//   2. Skip if patient already has that consent type
//   3. Upload PDF to Supabase Storage (patient-documents bucket)
//   4. Create a consent record with consent_given = true
//
// Usage:
//   node --env-file=.env.local scripts/import-old-consent-forms.mjs          # dry run
//   node --env-file=.env.local scripts/import-old-consent-forms.mjs --apply  # actually import

import { createClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FORMS_DIR = '/Users/chriscupp/Desktop/forms_pdf';
const DRY_RUN = !process.argv.includes('--apply');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env vars. Run with: node --env-file=.env.local scripts/import-old-consent-forms.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FILENAME_TO_CONSENT_TYPE = {
  'Blood_Draw_Consent': 'blood_draw',
  'HRT_Consent': 'hrt',
  'IV__Injection_Consent': 'iv',
  'Peptide_Therapy_Consent': 'peptide',
  'Weight_Loss_Consent': 'weight_loss',
  'HBOT_Consent': 'hbot',
  'Red_Light_Therapy_Consent': 'red_light',
  'Testosterone_Pellet_Consent': 'hrt',
};

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
  // Try each consent type pattern
  for (const [pattern, consentType] of Object.entries(FILENAME_TO_CONSENT_TYPE)) {
    const regex = new RegExp(`^(.+?)_${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_(\\d{4}-\\d{2}-\\d{2})\\.pdf$`, 'i');
    const match = filename.match(regex);
    if (match) {
      const namePart = match[1];
      const date = match[2];
      const parts = namePart.split('_').filter(Boolean);
      if (parts.length < 2) continue;
      return { firstName: parts[0], lastName: parts.slice(1).join(' '), date, consentType };
    }
  }
  return null;
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

async function fetchExistingConsents() {
  const PAGE = 1000;
  let from = 0;
  const map = new Map(); // patientId -> Set of consent_types
  while (true) {
    const { data, error } = await supabase
      .from('consents')
      .select('patient_id, consent_type')
      .not('patient_id', 'is', null)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`consents fetch: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const r of data) {
      if (!map.has(r.patient_id)) map.set(r.patient_id, new Set());
      map.get(r.patient_id).add(r.consent_type);
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return map;
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
  const { error } = await supabase.storage
    .from('patient-documents')
    .upload(storagePath, fileBuffer, { contentType: 'application/pdf', upsert: false });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  const { data: urlData } = supabase.storage.from('patient-documents').getPublicUrl(storagePath);
  return urlData?.publicUrl || storagePath;
}

async function createConsentRecord(patientId, firstName, lastName, formDate, consentType, pdfUrl) {
  const { data, error } = await supabase
    .from('consents')
    .insert({
      patient_id: patientId,
      first_name: firstName,
      last_name: lastName,
      consent_type: consentType,
      consent_given: true,
      consent_date: formDate,
      pdf_url: pdfUrl,
      additional_data: { source: 'old_system', imported: true },
      submitted_at: `${formDate}T00:00:00.000Z`,
    })
    .select('id')
    .single();
  if (error) throw new Error(`Consent insert failed: ${error.message}`);
  return data.id;
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN (add --apply to actually import) ===' : '=== APPLYING CHANGES ===');
  console.log('');

  const allFiles = readdirSync(FORMS_DIR).filter(f => f.endsWith('.pdf') && !f.includes('Medical_Intake_Form') && !f.includes('Medication_Dispensing_Log'));
  const consentFiles = allFiles.filter(f => {
    for (const pattern of Object.keys(FILENAME_TO_CONSENT_TYPE)) {
      if (f.includes(pattern)) return true;
    }
    return false;
  });

  console.log(`Found ${consentFiles.length} consent form PDFs`);

  console.log('Loading patients from Supabase...');
  const patients = await fetchAllPatients();
  console.log(`Loaded ${patients.length} patients`);

  console.log('Checking existing consents...');
  const existingConsents = await fetchExistingConsents();
  console.log(`${existingConsents.size} patients have existing consent records`);
  console.log('');

  const index = buildPatientIndex(patients);
  const results = { imported: [], skipped_has_consent: [], unmatched: [], ambiguous: [], errors: [] };

  for (const file of consentFiles) {
    const parsed = parseFilename(file);
    if (!parsed) {
      console.log(`  ⚠ Could not parse filename: ${file}`);
      results.errors.push({ file, reason: 'parse_failed' });
      continue;
    }

    const { firstName, lastName, date, consentType } = parsed;
    const displayName = `${firstName} ${lastName}`;
    let match = findPatient(firstName, lastName, index);

    if (match.status === 'ambiguous') {
      const withActivity = [];
      for (const p of match.patients) {
        const { count: pCount } = await supabase.from('protocols').select('id', { count: 'exact', head: true }).eq('patient_id', p.id);
        const { count: sCount } = await supabase.from('service_logs').select('id', { count: 'exact', head: true }).eq('patient_id', p.id);
        withActivity.push({ ...p, activity: (pCount || 0) + (sCount || 0) });
      }
      withActivity.sort((a, b) => b.activity - a.activity);
      if (withActivity[0].activity > 0 && withActivity[0].activity > (withActivity[1]?.activity || 0)) {
        match = { status: 'matched', patients: [withActivity[0]] };
        console.log(`  ~ Resolved ambiguous ${displayName} → ${withActivity[0].id.slice(0, 8)} (has activity)`);
      } else {
        console.log(`  ? Ambiguous: ${displayName} [${consentType}]`);
        results.ambiguous.push({ file, name: displayName, consentType });
        continue;
      }
    }

    if (match.status === 'unmatched') {
      console.log(`  ✗ No patient: ${displayName} [${consentType}]`);
      results.unmatched.push({ file, name: displayName, consentType });
      continue;
    }

    const patient = match.patients[0];
    const patientConsents = existingConsents.get(patient.id);
    if (patientConsents && patientConsents.has(consentType)) {
      console.log(`  – Already has ${consentType}: ${displayName}`);
      results.skipped_has_consent.push({ file, name: displayName, consentType });
      continue;
    }

    if (DRY_RUN) {
      console.log(`  ✓ Would import: ${displayName} [${consentType}] → ${patient.id.slice(0, 8)} (${date})`);
      results.imported.push({ file, name: displayName, consentType, patientId: patient.id });
      continue;
    }

    try {
      const filePath = resolve(FORMS_DIR, file);
      const pdfUrl = await uploadPdf(patient.id, filePath, file);
      const consentId = await createConsentRecord(patient.id, firstName, lastName, date, consentType, pdfUrl);
      if (!patientConsents) existingConsents.set(patient.id, new Set());
      existingConsents.get(patient.id).add(consentType);
      console.log(`  ✓ Imported: ${displayName} [${consentType}] → consent ${consentId}`);
      results.imported.push({ file, name: displayName, consentType, patientId: patient.id, consentId });
    } catch (err) {
      console.log(`  ✗ Error: ${displayName} [${consentType}]: ${err.message}`);
      results.errors.push({ file, name: displayName, consentType, reason: err.message });
    }
  }

  console.log('');
  console.log('── Summary ──');
  console.log(`  Imported:              ${results.imported.length}`);
  console.log(`  Already had consent:   ${results.skipped_has_consent.length}`);
  console.log(`  Unmatched:             ${results.unmatched.length}`);
  console.log(`  Ambiguous:             ${results.ambiguous.length}`);
  console.log(`  Errors:                ${results.errors.length}`);

  if (results.unmatched.length > 0) {
    console.log('');
    console.log('── Unmatched ──');
    for (const u of results.unmatched) console.log(`  ${u.name} [${u.consentType}]`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
