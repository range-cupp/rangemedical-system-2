#!/usr/bin/env node
// scripts/import-pf-clinical-data.js
// Import Practice Fusion clinical data: prescriptions, medications, allergies,
// diagnoses, conditions, lab values, vitals/weight, and pinned notes.
//
// Usage:
//   node scripts/import-pf-clinical-data.js --dry-run    # Preview without inserting
//   node scripts/import-pf-clinical-data.js              # Run the import

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, join } from 'path';

// ── Load environment variables ──────────────────────────────────────────
const envPath = resolve(import.meta.dirname, '..', '.env.local');
const envFile = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ── Config ──────────────────────────────────────────────────────────────
const PF_DIR = '/Users/chriscupp/Library/Mobile Documents/com~apple~CloudDocs/Claude CUPP 2nd brain/Range Medical CRM/PracticeExport_91d614de-197f-4195-83b3-91c287c85df9_20260314_182136_1';
const DRY_RUN = process.argv.includes('--dry-run');

// Provider GUID → display name
const PROVIDERS = {
  '2f875af4-2eef-4ae8-8d56-dac7d0eb0dde': 'Dr. Damien Burgess',
  'ef36aad5-75cd-4bda-b16d-0d883e5bac5c': 'Lily Diaz',
  '2020099c-b1ca-421b-8fc4-f0f1e843e404': 'Evan Riederich',
  '47edc8d1-2f41-4229-9b25-600eed5fe67d': 'Christopher Cupp',
  '96b32cee-4363-4af4-8f26-a95d6b8ba04d': 'Damon Durante',
  'f573f83c-fe93-4fb9-adf3-910362c03d82': 'Tara Ventimiglia',
  '1bc02e50-b42e-4b96-8ba0-bda697f479dd': 'Amanda Limon',
};

// Name aliases for PF → CRM mismatches
const NAME_ALIASES = {
  'mario|galvan': 'mario|o. galvan',
  'william|zigler': 'bill|zigler',
  'katherine|gresham': 'kate|gresham',
  'dominick walker|shivers': 'dominick|walker',
  'mark|shepard': 'mark|shephard',
  'daniel|peykoff': 'danny|peykoff',
  'donovan|frankenreiter': 'donavon|frankenreiter',
  'christopher|cupp': 'chris|cupp',
  'nicholas|gordon': 'nick|gordon',
  'kate|akamine': 'katherine|akamine',
  'mike|norbeck': 'michael|norbeck',
  'deborah gayle|johnson': 'deborah|johnson',
  'bobbie|garza': 'bobbie|garza',
  'candace|guangorena': 'candace|guangorena',
  'blake|merrell': 'blake|merrell',
  'brentt|arcement': 'brentt|arcement',
  'joe|francis': 'joseph|francis',
  'steve|cota': 'steven|cota',
  'dan|blackwell': 'daniel|blackwell',
  'jake|masterpool': 'jacob|masterpool',
  'ken|clark': 'kenneth|clark',
};

// ── Helpers ─────────────────────────────────────────────────────────────

function parseTSV(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].replace(/^\uFEFF/, '').split('\t').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = line.split('\t');
    const obj = {};
    headers.forEach((h, idx) => {
      let val = (values[idx] || '').trim();
      if (val === '\\N' || val === '') val = null;
      if (val) val = val.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\\\/g, '\\');
      obj[h] = val;
    });
    rows.push(obj);
  }
  return rows;
}

function normalizeNameKey(firstName, lastName) {
  return `${(firstName || '').trim().toLowerCase()}|${(lastName || '').trim().toLowerCase()}`;
}

function parsePFDate(dateStr) {
  if (!dateStr) return null;
  // Handle MM/DD/YYYY format
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const [, m, d, y] = match;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Handle ISO-ish format
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0];
  return null;
}

function parsePFDateTime(dateStr) {
  if (!dateStr) return null;
  // Handle "M/D/YYYY H:MM:SS AM/PM" format
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    let [, m, d, y, h, min, sec, ampm] = match;
    h = parseInt(h);
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
      if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
    }
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${String(h).padStart(2, '0')}:${min}:${sec}Z`;
  }
  // Handle "M/D/YYYY H:MM:SS AM +00:00" format
  const match2 = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)\s*([+-]\d{2}:\d{2})/i);
  if (match2) {
    let [, m, d, y, h, min, sec, ampm, tz] = match2;
    h = parseInt(h);
    if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
    if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${String(h).padStart(2, '0')}:${min}:${sec}${tz}`;
  }
  return null;
}

function stripHTML(html) {
  if (!html) return null;
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseICD(codeStr) {
  if (!codeStr) return { icd9: null, icd10: null, snomed: null };
  const icd9Match = codeStr.match(/([\d.]+)\s*\(ICD9\)/);
  const icd10Match = codeStr.match(/([\w.]+)\s*\(ICD10\)/);
  const snomedMatch = codeStr.match(/(\d+)\s*\(SNOMED\)/);
  return {
    icd9: icd9Match ? icd9Match[1] : null,
    icd10: icd10Match ? icd10Match[1] : null,
    snomed: snomedMatch ? snomedMatch[1] : null,
  };
}

async function batchInsert(table, records, label) {
  if (records.length === 0) {
    console.log(`  ⏭  ${label}: no records to insert`);
    return 0;
  }

  if (DRY_RUN) {
    console.log(`  🔍 ${label}: would insert ${records.length} records (dry run)`);
    return records.length;
  }

  let inserted = 0;
  const batchSize = 50;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      console.error(`  ❌ ${label} batch ${i}-${i + batch.length}: ${error.message}`);
      // Try one-by-one
      for (const rec of batch) {
        const { error: e2 } = await supabase.from(table).insert(rec);
        if (e2) {
          console.error(`    ❌ Single insert failed: ${e2.message}`, JSON.stringify(rec).slice(0, 200));
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
    }
  }
  console.log(`  ✅ ${label}: inserted ${inserted}/${records.length}`);
  return inserted;
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  PRACTICE FUSION CLINICAL DATA IMPORT');
  console.log(`  Mode: ${DRY_RUN ? '🔍 DRY RUN' : '🚀 LIVE'}`);
  console.log(`${'═'.repeat(60)}\n`);

  // ── Step 1: Parse all PF data files ───────────────────────────────
  console.log('📂 Parsing PF export files...');
  const demographics = parseTSV(join(PF_DIR, 'patient-demographics.tsv'));
  const prescriptions = parseTSV(join(PF_DIR, 'patient-prescriptions.tsv'));
  const medications = parseTSV(join(PF_DIR, 'patient-medications.tsv'));
  const allergies = parseTSV(join(PF_DIR, 'patient-allergy.tsv'));
  const diagnoses = parseTSV(join(PF_DIR, 'patient-diagnoses.tsv'));
  const conditions = parseTSV(join(PF_DIR, 'patient-conditions.tsv'));
  const labResults = parseTSV(join(PF_DIR, 'patient-lab-results.tsv'));
  const labObservations = parseTSV(join(PF_DIR, 'patient-lab-result-tests-observations.tsv'));
  const encounterObs = parseTSV(join(PF_DIR, 'patient-encounter-observations.tsv'));
  const pinnedNotes = parseTSV(join(PF_DIR, 'pinned-notes.tsv'));

  console.log(`  Demographics:      ${demographics.length} patients`);
  console.log(`  Prescriptions:     ${prescriptions.length} records`);
  console.log(`  Medications:       ${medications.length} records`);
  console.log(`  Allergies:         ${allergies.length} records`);
  console.log(`  Diagnoses:         ${diagnoses.length} records`);
  console.log(`  Conditions:        ${conditions.length} records`);
  console.log(`  Lab Results:       ${labResults.length} results`);
  console.log(`  Lab Observations:  ${labObservations.length} test values`);
  console.log(`  Encounter Obs:     ${encounterObs.length} vitals`);
  console.log(`  Pinned Notes:      ${pinnedNotes.length} notes`);

  // ── Step 2: Build PF patient lookup ───────────────────────────────
  console.log('\n👥 Building patient mapping...');
  const pfPatients = {};
  for (const row of demographics) {
    pfPatients[row.PatientPracticeGuid] = {
      firstName: (row.FirstName || '').trim(),
      lastName: (row.LastName || '').trim(),
      nameKey: normalizeNameKey(row.FirstName, row.LastName),
    };
  }

  // ── Step 3: Fetch CRM patients & build lookup ─────────────────────
  const { data: crmPatients, error: pErr } = await supabase
    .from('patients')
    .select('id, name, first_name, last_name');
  if (pErr) throw new Error(`Failed to fetch patients: ${pErr.message}`);
  console.log(`  CRM patients: ${crmPatients.length}`);

  // Build name → patient_id map
  const crmMap = {};
  for (const p of crmPatients) {
    const name = (p.name || '').trim().toLowerCase();
    crmMap[name] = p.id;
    // Also index by first|last
    if (p.first_name && p.last_name) {
      const key = normalizeNameKey(p.first_name, p.last_name);
      crmMap[key] = p.id;
    }
    // Also handle names with parenthetical nicknames
    const cleaned = name.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleaned !== name) crmMap[cleaned] = p.id;
  }

  function findCRMPatient(pfGuid) {
    const pf = pfPatients[pfGuid];
    if (!pf) return null;

    // Direct match: "first last"
    const fullName = `${pf.firstName} ${pf.lastName}`.toLowerCase().trim();
    if (crmMap[fullName]) return crmMap[fullName];

    // Match by first|last key
    if (crmMap[pf.nameKey]) return crmMap[pf.nameKey];

    // Alias match
    if (NAME_ALIASES[pf.nameKey]) {
      const aliasKey = NAME_ALIASES[pf.nameKey];
      if (crmMap[aliasKey]) return crmMap[aliasKey];
      // Also try as "first last" string
      const [af, al] = aliasKey.split('|');
      const aliasName = `${af} ${al}`;
      if (crmMap[aliasName]) return crmMap[aliasName];
    }

    // First word of first name + last name
    const firstWord = pf.firstName.split(/\s+/)[0].toLowerCase();
    const firstWordKey = `${firstWord} ${pf.lastName.toLowerCase()}`;
    if (crmMap[firstWordKey]) return crmMap[firstWordKey];

    return null;
  }

  // Count matchable patients
  const pfGuids = new Set();
  for (const arr of [prescriptions, medications, allergies, diagnoses, conditions, labObservations, encounterObs, pinnedNotes]) {
    for (const row of arr) {
      if (row.PatientPracticeGuid) pfGuids.add(row.PatientPracticeGuid);
    }
  }

  let matched = 0;
  let unmatched = 0;
  const unmatchedNames = [];
  for (const guid of pfGuids) {
    if (findCRMPatient(guid)) {
      matched++;
    } else {
      unmatched++;
      const pf = pfPatients[guid];
      if (pf) unmatchedNames.push(`${pf.firstName} ${pf.lastName}`);
    }
  }
  console.log(`  Matched: ${matched} | Unmatched: ${unmatched}`);
  if (unmatchedNames.length > 0) {
    console.log(`  Unmatched names: ${unmatchedNames.join(', ')}`);
  }

  // ── Step 4: Import Prescriptions ──────────────────────────────────
  console.log('\n💊 Importing prescriptions...');

  // Fetch existing prescriptions for dedup (patient_id + medication_name + signed_at)
  const existingRx = new Set();
  let rxPage = 0;
  while (true) {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('patient_id, medication_name, signed_at')
      .range(rxPage * 1000, (rxPage + 1) * 1000 - 1);
    if (error) throw new Error(`Failed to fetch existing prescriptions: ${error.message}`);
    for (const r of (data || [])) {
      existingRx.add(`${r.patient_id}|${(r.medication_name || '').toLowerCase()}|${r.signed_at || ''}`);
    }
    if (!data || data.length < 1000) break;
    rxPage++;
  }
  console.log(`  Existing prescriptions (for dedup): ${existingRx.size}`);

  let rxSkipped = 0;
  const rxRecords = [];
  for (const rx of prescriptions) {
    const patientId = findCRMPatient(rx.PatientPracticeGuid);
    if (!patientId) continue;

    const medName = rx.MedicationDisplayName || rx.TradeName || rx.GenericName || 'Unknown';
    const signedAt = parsePFDateTime(rx.DateOfService) || parsePFDate(rx.DateOfService);
    const rxKey = `${patientId}|${medName.toLowerCase()}|${signedAt || ''}`;
    if (existingRx.has(rxKey)) {
      rxSkipped++;
      continue;
    }

    rxRecords.push({
      patient_id: patientId,
      medication_name: medName,
      strength: rx.ProductStrength,
      form: rx.DoseForm,
      quantity: rx.Quantity,
      sig: rx.Sig,
      refills: rx.NumberOfRefills ? parseInt(rx.NumberOfRefills) : null,
      days_supply: rx.DaysSupply ? parseInt(rx.DaysSupply) : null,
      is_controlled: rx.ControlledSubstanceSchedule ? true : false,
      schedule: rx.ControlledSubstanceSchedule,
      status: 'completed',
      signed_at: signedAt,
      created_by: PROVIDERS[rx.PrescribingProviderGuid] || 'Practice Fusion Import',
      created_at: parsePFDateTime(rx.DateOfService) || new Date().toISOString(),
    });
  }
  if (rxSkipped > 0) console.log(`  ⏭  Skipped ${rxSkipped} duplicate prescriptions`);
  await batchInsert('prescriptions', rxRecords, 'Prescriptions');

  // ── Step 5: Import Medications ────────────────────────────────────
  console.log('\n💉 Importing medications...');
  const medRecords = [];
  for (const med of medications) {
    const patientId = findCRMPatient(med.PatientPracticeGuid);
    if (!patientId) continue;

    const stopDate = parsePFDate(med.StopDate);
    medRecords.push({
      patient_id: patientId,
      medication_name: med.MedicationName || 'Unknown',
      generic_name: med.GenericName,
      trade_name: med.TradeName,
      strength: med.ProductStrength,
      form: med.DoseForm,
      route: med.Route,
      sig: med.Sig,
      start_date: parsePFDate(med.StartDate),
      stop_date: stopDate,
      discontinued_reason: med.MedicationDiscontinuedReasonName,
      is_active: !stopDate,
      source: 'practice_fusion',
      pf_medication_guid: med.MedicationGuid,
    });
  }
  await batchInsert('patient_medications', medRecords, 'Medications');

  // ── Step 6: Import Allergies ──────────────────────────────────────
  console.log('\n🚨 Importing allergies...');
  const allergyRecords = [];
  for (const allergy of allergies) {
    const patientId = findCRMPatient(allergy.PatientPracticeGuid);
    if (!patientId) continue;

    allergyRecords.push({
      patient_id: patientId,
      allergen_name: allergy.MedicationName || allergy.Substance || allergy.DrugClass || 'Unknown Allergen',
      allergen_category: allergy.AllergenCategory,
      severity: allergy.Severity,
      drug_class: allergy.DrugClass,
      substance: allergy.Substance,
      onset_type: allergy.OnsetType,
      start_date: parsePFDate(allergy.StartDate),
      stop_date: parsePFDate(allergy.StopDate),
      comments: allergy.Comments,
      is_active: allergy.IsActive === 'True',
      source: 'practice_fusion',
      pf_allergy_guid: allergy.PatientAllergyGuid,
    });
  }
  await batchInsert('patient_allergies', allergyRecords, 'Allergies');

  // ── Step 7: Import Diagnoses + Conditions ─────────────────────────
  console.log('\n📋 Importing diagnoses & conditions...');
  const dxRecords = [];

  for (const dx of diagnoses) {
    const patientId = findCRMPatient(dx.PatientPracticeGuid);
    if (!patientId) continue;

    const codes = parseICD(dx.DiagnosisCodeEquivalents);
    const stopDate = parsePFDate(dx.StopDate);

    dxRecords.push({
      patient_id: patientId,
      diagnosis: dx.Diagnosis,
      icd10_code: codes.icd10,
      icd9_code: codes.icd9,
      snomed_code: codes.snomed,
      acuity: dx.DiagnosisAcuity,
      start_date: parsePFDate(dx.StartDate),
      stop_date: stopDate,
      comments: dx.Comments,
      is_active: !stopDate,
      source: 'practice_fusion',
      pf_diagnosis_guid: dx.DiagnosisGuid,
    });
  }

  for (const cond of conditions) {
    const patientId = findCRMPatient(cond.PatientPracticeGuid);
    if (!patientId) continue;

    // Skip "No Known Drug Allergies" - that's allergy info, not a condition
    if ((cond.ConditionName || '').toLowerCase().includes('no known drug allerg')) continue;

    dxRecords.push({
      patient_id: patientId,
      diagnosis: cond.ConditionName,
      is_active: true,
      source: 'practice_fusion',
    });
  }
  await batchInsert('patient_diagnoses', dxRecords, 'Diagnoses & Conditions');

  // ── Step 8: Import Structured Lab Values ──────────────────────────
  console.log('\n🔬 Importing structured lab values...');

  // Fetch existing lab observations for dedup (patient_id + result_guid + observation)
  const existingLabs = new Set();
  let labPage = 0;
  while (true) {
    const { data, error } = await supabase
      .from('pf_lab_observations')
      .select('patient_id, result_guid, observation')
      .range(labPage * 1000, (labPage + 1) * 1000 - 1);
    if (error) throw new Error(`Failed to fetch existing lab observations: ${error.message}`);
    for (const r of (data || [])) {
      existingLabs.add(`${r.patient_id}|${r.result_guid}|${r.observation}`);
    }
    if (!data || data.length < 1000) break;
    labPage++;
  }
  console.log(`  Existing lab observations (for dedup): ${existingLabs.size}`);

  let labSkipped = 0;
  const labRecords = [];
  for (const obs of labObservations) {
    const patientId = findCRMPatient(obs.PatientPracticeGuid);
    if (!patientId) continue;

    // Skip empty/metadata rows
    if (!obs.Observation || obs.Observation === '..') continue;
    if (!obs.Result || obs.Result === 'See Note') continue;

    const labKey = `${patientId}|${obs.ResultGuid}|${obs.Observation}`;
    if (existingLabs.has(labKey)) {
      labSkipped++;
      continue;
    }

    labRecords.push({
      patient_id: patientId,
      result_guid: obs.ResultGuid,
      test_name: obs.TestName || obs.Observation,
      observation: obs.Observation,
      result_value: obs.Result,
      units: obs.Units,
      reference_range: obs.ReferencesRange,
      flag: obs.FlagCode,
      flag_description: obs.FlagCodeDescription,
      result_date: parsePFDateTime(obs.ResultDate),
      loinc_code: obs.LoincCode,
      is_latest: obs.IsLatest === 'True',
      status: obs.Status,
      provider_comment: obs.ProviderComment,
      source: 'practice_fusion',
    });
  }
  if (labSkipped > 0) console.log(`  ⏭  Skipped ${labSkipped} duplicate lab observations`);
  await batchInsert('pf_lab_observations', labRecords, 'Lab Observations');

  // ── Step 9: Import Weight/Vitals ──────────────────────────────────
  console.log('\n⚖️  Importing weight/vitals...');
  const weightRecords = [];
  const WEIGHT_LOINC = '3141-9'; // Body weight LOINC code

  for (const obs of encounterObs) {
    const patientId = findCRMPatient(obs.PatientPracticeGuid);
    if (!patientId) continue;

    // Only import weight observations
    if (obs.ObservationCode !== WEIGHT_LOINC) continue;
    if (!obs.Value || obs.Value === '0') continue;

    const weightKg = parseFloat(obs.Value);
    if (isNaN(weightKg) || weightKg < 20 || weightKg > 300) continue; // sanity check

    const weightLbs = Math.round(weightKg * 2.20462 * 10) / 10;
    const dateStr = parsePFDateTime(obs.ObservationDateTimeUtc);
    if (!dateStr) continue;

    const logDate = dateStr.split('T')[0];

    weightRecords.push({
      log_date: logDate,
      weight: weightLbs,
      notes: `PF import (${weightKg.toFixed(1)} kg)`,
      created_at: dateStr,
      // weight_logs needs ghl_contact_id, not patient_id — we'll handle this
      _patient_id: patientId,
    });
  }

  // weight_logs uses ghl_contact_id, so we need to look those up
  if (weightRecords.length > 0) {

    // Get ghl_contact_ids for our patients
    const patientIds = [...new Set(weightRecords.map(r => r._patient_id))];
    const { data: patientData } = await supabase
      .from('patients')
      .select('id, ghl_contact_id')
      .in('id', patientIds);

    const ghlMap = {};
    for (const p of (patientData || [])) {
      if (p.ghl_contact_id) ghlMap[p.id] = p.ghl_contact_id;
    }

    // Fetch existing weight logs for dedup (ghl_contact_id + log_date)
    const existingWeights = new Set();
    let weightPage = 0;
    while (true) {
      const { data, error } = await supabase
        .from('weight_logs')
        .select('ghl_contact_id, log_date')
        .range(weightPage * 1000, (weightPage + 1) * 1000 - 1);
      if (error) throw new Error(`Failed to fetch existing weight logs: ${error.message}`);
      for (const r of (data || [])) {
        existingWeights.add(`${r.ghl_contact_id}|${r.log_date}`);
      }
      if (!data || data.length < 1000) break;
      weightPage++;
    }
    console.log(`  Existing weight logs (for dedup): ${existingWeights.size}`);

    let weightSkipped = 0;
    const finalWeightRecords = [];
    for (const wr of weightRecords) {
      const ghlId = ghlMap[wr._patient_id];
      if (!ghlId) continue; // skip if no GHL contact ID

      const weightKey = `${ghlId}|${wr.log_date}`;
      if (existingWeights.has(weightKey)) {
        weightSkipped++;
        continue;
      }

      const { _patient_id, ...rest } = wr;
      finalWeightRecords.push({
        ...rest,
        ghl_contact_id: ghlId,
      });
    }

    if (weightSkipped > 0) console.log(`  ⏭  Skipped ${weightSkipped} duplicate weight logs`);
    await batchInsert('weight_logs', finalWeightRecords, 'Weight Logs');
  }

  // ── Step 10: Import Pinned Notes ──────────────────────────────────
  console.log('\n📌 Importing pinned notes...');

  // Fetch existing pinned note imports for dedup (via ghl_note_id)
  const existingPinnedGuids = new Set();
  let pinnedPage = 0;
  while (true) {
    const { data, error } = await supabase
      .from('patient_notes')
      .select('ghl_note_id')
      .eq('source', 'practice_fusion')
      .eq('encounter_service', 'Pinned Note')
      .range(pinnedPage * 1000, (pinnedPage + 1) * 1000 - 1);
    if (error) throw new Error(`Failed to fetch existing pinned notes: ${error.message}`);
    for (const r of (data || [])) {
      if (r.ghl_note_id) existingPinnedGuids.add(r.ghl_note_id);
    }
    if (!data || data.length < 1000) break;
    pinnedPage++;
  }
  console.log(`  Existing pinned notes (for dedup): ${existingPinnedGuids.size}`);

  let pinnedSkipped = 0;
  const pinnedRecords = [];
  for (const note of pinnedNotes) {
    const patientId = findCRMPatient(note.PatientPracticeGuid);
    if (!patientId) continue;

    const body = stripHTML(note.NoteText);
    if (!body || body.length < 2) continue;

    // Use PinnedNoteGuid or construct a unique key for dedup
    const noteGuid = note.PinnedNoteGuid || `pinned_${note.PatientPracticeGuid}_${(note.LastModifiedDateTimeUtc || '').replace(/\W/g, '')}`;
    if (existingPinnedGuids.has(noteGuid)) {
      pinnedSkipped++;
      continue;
    }

    pinnedRecords.push({
      patient_id: patientId,
      body: `📌 PINNED NOTE\n\n${body}`,
      note_date: parsePFDateTime(note.LastModifiedDateTimeUtc) || new Date().toISOString(),
      source: 'practice_fusion',
      status: 'draft',
      encounter_service: 'Pinned Note',
      created_by: PROVIDERS[note.LastModifiedByUserGuid] || 'Practice Fusion',
      ghl_note_id: noteGuid,
    });
  }
  if (pinnedSkipped > 0) console.log(`  ⏭  Skipped ${pinnedSkipped} duplicate pinned notes`);
  await batchInsert('patient_notes', pinnedRecords, 'Pinned Notes');

  // ── Summary ───────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  IMPORT COMPLETE');
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Prescriptions:     ${rxRecords.length}`);
  console.log(`  Medications:       ${medRecords.length}`);
  console.log(`  Allergies:         ${allergyRecords.length}`);
  console.log(`  Diagnoses:         ${dxRecords.length}`);
  console.log(`  Lab Observations:  ${labRecords.length}`);
  console.log(`  Weight Logs:       ${weightRecords.length}`);
  console.log(`  Pinned Notes:      ${pinnedRecords.length}`);
  console.log(`${'═'.repeat(60)}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
