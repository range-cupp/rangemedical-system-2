#!/usr/bin/env node
// scripts/import-pf-vitals.js
// Import ALL vitals from Practice Fusion encounter observations into patient_vitals table.
// Handles: Height, Weight, BP, Pulse, Temp, Respiratory Rate, O2 Sat, + auto-calc BMI.
//
// Usage:
//   node scripts/import-pf-vitals.js --dry-run    # Preview without inserting
//   node scripts/import-pf-vitals.js              # Run the import

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
const PF_DIR = '/Users/chriscupp/Library/Mobile Documents/com~apple~CloudDocs/Claude CUPP 2nd brain/Range Medical CRM/PracticeExport_5449226f-7ac3-4d00-9470-e28b28c51103_20260308_181507_1';
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

// Name aliases for PF → CRM name mismatches
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
  'deborah gayle|johnson': 'debbie|johnson',
  'steve|cota': 'steven|cota',
  'dan|blackwell': 'daniel|blackwell',
  'jake|masterpool': 'jacob|masterpool',
  'ken|clark': 'kenneth|clark',
};

// LOINC codes for each vital sign in PF export
const LOINC = {
  WEIGHT: '3141-9',       // Body weight (kg → convert to lbs)
  HEIGHT: '8302-2',       // Body height (cm → convert to inches)
  BP_SYS: '8480-6',       // Systolic BP (mmHg)
  BP_DIA: '8462-4',       // Diastolic BP (mmHg)
  PULSE: '8867-4',        // Heart rate (bpm)
  O2_SAT: '59408-5',      // O2 saturation (%)
  TEMP: '8310-5',         // Body temperature (Celsius → convert to °F)
  RESP: '9279-1',         // Respiratory rate (breaths/min)
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

function parsePFDateTime(dateStr) {
  if (!dateStr) return null;
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
  return null;
}

function calculateBMI(heightInches, weightLbs) {
  if (!heightInches || !weightLbs || heightInches <= 0) return null;
  const bmi = (weightLbs / (heightInches * heightInches)) * 703;
  return Math.round(bmi * 10) / 10;
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  PRACTICE FUSION → PATIENT VITALS IMPORT');
  console.log(`  Mode: ${DRY_RUN ? '🔍 DRY RUN' : '🚀 LIVE'}`);
  console.log(`${'═'.repeat(60)}\n`);

  // ── Step 1: Parse PF data ────────────────────────────────────────────
  console.log('📂 Parsing PF export files...');
  const demographics = parseTSV(join(PF_DIR, 'patient-demographics.tsv'));
  const encounterObs = parseTSV(join(PF_DIR, 'patient-encounter-observations.tsv'));

  console.log(`  Demographics:      ${demographics.length} patients`);
  console.log(`  Encounter Obs:     ${encounterObs.length} rows`);

  // ── Step 2: Build PF patient lookup ──────────────────────────────────
  console.log('\n👥 Building patient mapping...');
  const pfPatients = {};
  for (const row of demographics) {
    pfPatients[row.PatientPracticeGuid] = {
      firstName: (row.FirstName || '').trim(),
      lastName: (row.LastName || '').trim(),
      nameKey: normalizeNameKey(row.FirstName, row.LastName),
    };
  }

  // ── Step 3: Fetch ALL CRM patients (paginated — Supabase returns max 1000) ─
  let crmPatients = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error: pErr } = await supabase
      .from('patients')
      .select('id, name, first_name, last_name')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (pErr) throw new Error(`Failed to fetch patients: ${pErr.message}`);
    crmPatients = crmPatients.concat(data || []);
    if (!data || data.length < pageSize) break;
    page++;
  }
  console.log(`  CRM patients: ${crmPatients.length}`);

  const crmMap = {};
  for (const p of crmPatients) {
    const name = (p.name || '').trim().toLowerCase();
    crmMap[name] = p.id;
    if (p.first_name && p.last_name) {
      const key = normalizeNameKey(p.first_name, p.last_name);
      crmMap[key] = p.id;
    }
    const cleaned = name.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleaned !== name) crmMap[cleaned] = p.id;
  }

  function findCRMPatient(pfGuid) {
    const pf = pfPatients[pfGuid];
    if (!pf) return null;

    const fullName = `${pf.firstName} ${pf.lastName}`.toLowerCase().trim();
    if (crmMap[fullName]) return crmMap[fullName];
    if (crmMap[pf.nameKey]) return crmMap[pf.nameKey];

    if (NAME_ALIASES[pf.nameKey]) {
      const aliasKey = NAME_ALIASES[pf.nameKey];
      if (crmMap[aliasKey]) return crmMap[aliasKey];
      const [af, al] = aliasKey.split('|');
      const aliasName = `${af} ${al}`;
      if (crmMap[aliasName]) return crmMap[aliasName];
    }

    const firstWord = pf.firstName.split(/\s+/)[0].toLowerCase();
    const firstWordKey = `${firstWord} ${pf.lastName.toLowerCase()}`;
    if (crmMap[firstWordKey]) return crmMap[firstWordKey];

    return null;
  }

  // ── Step 4: Group observations by encounter ──────────────────────────
  console.log('\n🔬 Grouping vitals by encounter...');

  // Each encounter has multiple observation rows — one per vital sign.
  // Group by (PatientPracticeGuid + EncounterGuid) to build one vitals record per encounter.
  const encounterMap = {}; // key = encounterGuid

  const loincCodes = new Set(Object.values(LOINC));
  let skippedMeta = 0;
  let skippedNoValue = 0;

  for (const obs of encounterObs) {
    const code = obs.ObservationCode;

    // Skip PF-LOCAL meta rows (OBSERVATION_SET, TRANSCRIPT_SET)
    if (!loincCodes.has(code)) {
      skippedMeta++;
      continue;
    }

    if (!obs.Value) {
      skippedNoValue++;
      continue;
    }

    const encGuid = obs.EncounterGuid;
    if (!encounterMap[encGuid]) {
      encounterMap[encGuid] = {
        patientGuid: obs.PatientPracticeGuid,
        encounterGuid: encGuid,
        dateTime: obs.ObservationDateTimeUtc,
        providerGuid: obs.LastModifiedByProviderGuid,
        values: {},
      };
    }

    encounterMap[encGuid].values[code] = parseFloat(obs.Value);
  }

  const encounters = Object.values(encounterMap);
  console.log(`  Encounters with vitals: ${encounters.length}`);
  console.log(`  Skipped meta rows: ${skippedMeta}`);
  console.log(`  Skipped empty values: ${skippedNoValue}`);

  // ── Step 5: Convert to patient_vitals records ────────────────────────
  console.log('\n🩺 Building patient_vitals records...');

  const vitalsRecords = [];
  const unmatchedPatients = new Set();

  for (const enc of encounters) {
    const patientId = findCRMPatient(enc.patientGuid);
    if (!patientId) {
      const pf = pfPatients[enc.patientGuid];
      unmatchedPatients.add(pf ? `${pf.firstName} ${pf.lastName}` : enc.patientGuid);
      continue;
    }

    const v = enc.values;
    const recordedAt = parsePFDateTime(enc.dateTime);
    if (!recordedAt) continue;

    // Convert units: PF stores kg → lbs, cm → inches, Celsius → °F
    const weightLbs = v[LOINC.WEIGHT] ? Math.round(v[LOINC.WEIGHT] * 2.20462 * 10) / 10 : null;
    const heightInches = v[LOINC.HEIGHT] ? Math.round(v[LOINC.HEIGHT] / 2.54 * 10) / 10 : null;
    const tempF = v[LOINC.TEMP] ? Math.round((v[LOINC.TEMP] * 9 / 5 + 32) * 10) / 10 : null;

    // Direct values (already in correct units)
    const bpSys = v[LOINC.BP_SYS] ? Math.round(v[LOINC.BP_SYS]) : null;
    const bpDia = v[LOINC.BP_DIA] ? Math.round(v[LOINC.BP_DIA]) : null;
    const pulse = v[LOINC.PULSE] ? Math.round(v[LOINC.PULSE]) : null;
    const o2Sat = v[LOINC.O2_SAT] ? Math.round(v[LOINC.O2_SAT] * 10) / 10 : null;
    const respRate = v[LOINC.RESP] ? Math.round(v[LOINC.RESP]) : null;

    // Calculate BMI if we have both height and weight
    const bmi = calculateBMI(heightInches, weightLbs);

    const providerName = PROVIDERS[enc.providerGuid] || null;

    vitalsRecords.push({
      patient_id: patientId,
      appointment_id: `pf_${enc.encounterGuid}`,
      height_inches: heightInches,
      weight_lbs: weightLbs,
      bp_systolic: bpSys,
      bp_diastolic: bpDia,
      temperature: tempF,
      pulse,
      respiratory_rate: respRate,
      o2_saturation: o2Sat,
      bmi,
      recorded_by: providerName || 'Practice Fusion Import',
      recorded_at: recordedAt,
    });
  }

  console.log(`  Vitals records to insert: ${vitalsRecords.length}`);
  console.log(`  Unmatched patients (${unmatchedPatients.size}): ${[...unmatchedPatients].sort().join(', ')}`);

  // Show sample records
  if (vitalsRecords.length > 0) {
    console.log('\n📋 Sample records:');
    for (const rec of vitalsRecords.slice(0, 5)) {
      const parts = [];
      if (rec.height_inches) {
        const ft = Math.floor(rec.height_inches / 12);
        const inn = Math.round(rec.height_inches % 12);
        parts.push(`Ht ${ft}'${inn}"`);
      }
      if (rec.weight_lbs) parts.push(`Wt ${rec.weight_lbs}`);
      if (rec.bmi) parts.push(`BMI ${rec.bmi}`);
      if (rec.bp_systolic) parts.push(`BP ${rec.bp_systolic}/${rec.bp_diastolic}`);
      if (rec.pulse) parts.push(`HR ${rec.pulse}`);
      if (rec.temperature) parts.push(`${rec.temperature}°F`);
      if (rec.respiratory_rate) parts.push(`RR ${rec.respiratory_rate}`);
      if (rec.o2_saturation) parts.push(`SpO2 ${rec.o2_saturation}%`);
      console.log(`  ${new Date(rec.recorded_at).toLocaleDateString()} | ${parts.join(' · ')} | by ${rec.recorded_by}`);
    }
  }

  // ── Step 6: Insert into patient_vitals ───────────────────────────────
  if (vitalsRecords.length === 0) {
    console.log('\n⏭  No records to insert.');
    return;
  }

  if (DRY_RUN) {
    console.log(`\n🔍 DRY RUN: Would insert ${vitalsRecords.length} vitals records.`);

    // Summary stats
    let withWeight = 0, withBP = 0, withPulse = 0, withTemp = 0, withResp = 0, withO2 = 0, withHeight = 0;
    for (const r of vitalsRecords) {
      if (r.weight_lbs) withWeight++;
      if (r.bp_systolic) withBP++;
      if (r.pulse) withPulse++;
      if (r.temperature) withTemp++;
      if (r.respiratory_rate) withResp++;
      if (r.o2_saturation) withO2++;
      if (r.height_inches) withHeight++;
    }
    console.log('\n📊 Field coverage:');
    console.log(`  Height:    ${withHeight}/${vitalsRecords.length}`);
    console.log(`  Weight:    ${withWeight}/${vitalsRecords.length}`);
    console.log(`  BP:        ${withBP}/${vitalsRecords.length}`);
    console.log(`  Pulse:     ${withPulse}/${vitalsRecords.length}`);
    console.log(`  Temp:      ${withTemp}/${vitalsRecords.length}`);
    console.log(`  Resp Rate: ${withResp}/${vitalsRecords.length}`);
    console.log(`  O2 Sat:    ${withO2}/${vitalsRecords.length}`);
    return;
  }

  // Live insert
  console.log(`\n🚀 Inserting ${vitalsRecords.length} vitals records...`);

  let inserted = 0;
  const batchSize = 50;

  for (let i = 0; i < vitalsRecords.length; i += batchSize) {
    const batch = vitalsRecords.slice(i, i + batchSize);
    const { error } = await supabase.from('patient_vitals').insert(batch);

    if (error) {
      console.error(`  ❌ Batch ${i}-${i + batch.length}: ${error.message}`);
      // Fall back to individual inserts
      for (const rec of batch) {
        const { error: e2 } = await supabase.from('patient_vitals').insert(rec);
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

  console.log(`\n✅ Done! Inserted ${inserted}/${vitalsRecords.length} vitals records.`);

  // Count unique patients
  const uniquePatients = new Set(vitalsRecords.map(r => r.patient_id));
  console.log(`  Patients with vitals: ${uniquePatients.size}`);
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
