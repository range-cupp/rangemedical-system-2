#!/usr/bin/env node
// scripts/import-pf-encounters.js
// One-time migration: Import Practice Fusion encounter notes into Range Medical CRM.
// Matches PF patients to CRM patients by name, links notes to appointments by date.
//
// Usage:
//   node scripts/import-pf-encounters.js --dry-run    # Preview without inserting
//   node scripts/import-pf-encounters.js              # Run the import

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
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

// ── Name Aliases ────────────────────────────────────────────────────────
// PF name → CRM name for known mismatches (lowercase "first|last" format)
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
};

// ── Helpers ─────────────────────────────────────────────────────────────

function parseTSV(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');
  if (lines.length < 2) return [];

  // Strip BOM and parse headers
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
      // Unescape TSV escape sequences (PostgreSQL COPY format)
      if (val) val = val.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\\\/g, '\\');
      obj[h] = val;
    });
    rows.push(obj);
  }

  return rows;
}

function stripHTML(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...')
    .replace(/&#\d+;/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildNoteBody(encounter) {
  const sections = [];

  if (encounter.ChiefComplaint) {
    sections.push(`CHIEF COMPLAINT\n${encounter.ChiefComplaint.trim()}`);
  }

  const subj = stripHTML(encounter.Subjective);
  if (subj) sections.push(`SUBJECTIVE\n${subj}`);

  const obj = stripHTML(encounter.Objective);
  if (obj) sections.push(`OBJECTIVE\n${obj}`);

  const assess = stripHTML(encounter.Assessment);
  if (assess) sections.push(`ASSESSMENT\n${assess}`);

  const plan = stripHTML(encounter.Plan);
  if (plan) sections.push(`PLAN\n${plan}`);

  if (sections.length === 0) return null; // Skip empty notes

  return sections.join('\n\n');
}

// Parse PF date (MM/DD/YYYY) → YYYY-MM-DD
function parsePFDate(dateStr) {
  if (!dateStr) return null;
  const datePart = dateStr.split(' ')[0];
  const parts = datePart.split('/');
  if (parts.length !== 3) return null;
  const [month, day, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Parse PF datetime → ISO string
function parsePFDateTime(dateTimeStr) {
  if (!dateTimeStr) return null;
  // Try ISO format first
  if (dateTimeStr.includes('T') || (dateTimeStr.includes('-') && !dateTimeStr.includes('/'))) {
    const d = new Date(dateTimeStr);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  // MM/DD/YYYY HH:MM:SS AM/PM
  const match = dateTimeStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let [, month, day, year, hour, min, sec, ampm] = match;
  hour = parseInt(hour);
  if (ampm) {
    if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
  }
  return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), hour, parseInt(min), parseInt(sec))).toISOString();
}

function normalizeNameKey(firstName, lastName) {
  return `${(firstName || '').trim().toLowerCase()}|${(lastName || '').trim().toLowerCase()}`;
}

// Convert UTC timestamp to Pacific date (YYYY-MM-DD)
function utcToPacificDate(utcStr) {
  if (!utcStr) return null;
  const d = new Date(utcStr);
  if (isNaN(d.getTime())) return null;
  // en-CA locale gives YYYY-MM-DD format
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

// ── Main Import ─────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Practice Fusion → Range Medical CRM Import');
  console.log(`  Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes)' : '🚀 LIVE IMPORT'}`);
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Parse PF data files
  console.log('📂 Reading Practice Fusion export files...');
  const pfEncounters = parseTSV(join(PF_DIR, 'patient-encounters.tsv'));
  const pfDemographics = parseTSV(join(PF_DIR, 'patient-demographics.tsv'));
  const pfAddendums = parseTSV(join(PF_DIR, 'patient-encounter-addendums.tsv'));

  console.log(`   Encounters:  ${pfEncounters.length}`);
  console.log(`   Patients:    ${pfDemographics.length}`);
  console.log(`   Addendums:   ${pfAddendums.length}`);

  // 2. Build PF patient lookup: PatientPracticeGuid → { firstName, lastName, nameKey }
  const pfPatientMap = {};
  pfDemographics.forEach(p => {
    pfPatientMap[p.PatientPracticeGuid] = {
      firstName: p.FirstName,
      lastName: p.LastName,
      nameKey: normalizeNameKey(p.FirstName, p.LastName),
    };
  });

  // 3. Fetch all CRM patients
  console.log('\n📊 Fetching CRM data...');
  const allPatients = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name')
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Failed to fetch patients: ${error.message}`);
    allPatients.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(`   CRM Patients: ${allPatients.length}`);

  // Build CRM patient lookup: nameKey → patient_id (first match wins)
  // Also index by cleaned-up names (strip parenthetical nicknames like "Richard (rick)")
  const crmPatientMap = {};
  allPatients.forEach(p => {
    const key = normalizeNameKey(p.first_name, p.last_name);
    if (!crmPatientMap[key]) {
      crmPatientMap[key] = p.id;
    }
    // Also index by name with parenthetical stripped: "Richard (rick)" → "Richard"
    const cleanFirst = (p.first_name || '').replace(/\s*\([^)]*\)\s*/g, '').trim();
    if (cleanFirst !== (p.first_name || '').trim()) {
      const cleanKey = normalizeNameKey(cleanFirst, p.last_name);
      if (!crmPatientMap[cleanKey]) {
        crmPatientMap[cleanKey] = p.id;
      }
    }
  });

  // Multi-strategy patient lookup function
  function findCRMPatient(pfFirstName, pfLastName) {
    const nameKey = normalizeNameKey(pfFirstName, pfLastName);
    // 1. Exact match
    if (crmPatientMap[nameKey]) return crmPatientMap[nameKey];
    // 2. Alias map
    if (NAME_ALIASES[nameKey] && crmPatientMap[NAME_ALIASES[nameKey]]) return crmPatientMap[NAME_ALIASES[nameKey]];
    // 3. Try first word of first name only (handles "Deborah Gayle" → "Deborah")
    const firstWord = (pfFirstName || '').trim().split(/\s+/)[0];
    if (firstWord && firstWord.toLowerCase() !== (pfFirstName || '').trim().toLowerCase()) {
      const shortKey = normalizeNameKey(firstWord, pfLastName);
      if (crmPatientMap[shortKey]) return crmPatientMap[shortKey];
    }
    // 4. Try first word of last name only (handles "Walker Shivers" → "Walker")
    const lastFirstWord = (pfLastName || '').trim().split(/\s+/)[0];
    if (lastFirstWord && lastFirstWord.toLowerCase() !== (pfLastName || '').trim().toLowerCase()) {
      const shortKey = normalizeNameKey(pfFirstName, lastFirstWord);
      if (crmPatientMap[shortKey]) return crmPatientMap[shortKey];
    }
    return null;
  }

  // 4. Fetch CRM appointments (both tables)
  const allClinicApts = [];
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('clinic_appointments')
      .select('id, patient_id, start_time, calendar_name, appointment_title')
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Failed to fetch clinic_appointments: ${error.message}`);
    allClinicApts.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  const allRegularApts = [];
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('appointments')
      .select('id, patient_id, start_time, service_name')
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Failed to fetch appointments: ${error.message}`);
    allRegularApts.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  console.log(`   Clinic Appointments: ${allClinicApts.length}`);
  console.log(`   Appointments:        ${allRegularApts.length}`);

  // Build appointment lookup: "patient_id|YYYY-MM-DD" → [{ id, service }]
  const aptMap = {};
  const addAptToMap = (apt, serviceName) => {
    if (!apt.patient_id || !apt.start_time) return;
    const dateStr = utcToPacificDate(apt.start_time);
    if (!dateStr) return;
    const key = `${apt.patient_id}|${dateStr}`;
    if (!aptMap[key]) aptMap[key] = [];
    aptMap[key].push({ id: apt.id, service: serviceName });
  };

  allClinicApts.forEach(a => addAptToMap(a, a.calendar_name || a.appointment_title));
  allRegularApts.forEach(a => addAptToMap(a, a.service_name));

  // 5. Check for existing PF imports (dedup via ghl_note_id)
  const existingGuids = new Set();
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('patient_notes')
      .select('ghl_note_id')
      .eq('source', 'practice_fusion')
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Failed to check existing imports: ${error.message}`);
    data.forEach(n => { if (n.ghl_note_id) existingGuids.add(n.ghl_note_id); });
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(`   Existing PF imports: ${existingGuids.size}`);

  // 6. Process encounters
  console.log('\n🔄 Processing encounters...\n');

  const stats = {
    total: pfEncounters.length,
    patientMatched: 0,
    patientUnmatched: 0,
    appointmentMatched: 0,
    appointmentUnmatched: 0,
    inserted: 0,
    skippedDuplicate: 0,
    skippedEmpty: 0,
    skippedNoPatient: 0,
    errors: 0,
  };

  const unmatchedPatients = new Map(); // name → count
  const insertBatch = [];

  for (const enc of pfEncounters) {
    // Skip if already imported
    if (existingGuids.has(enc.EncounterGuid)) {
      stats.skippedDuplicate++;
      continue;
    }

    // Look up PF patient by guid
    const pfPatient = pfPatientMap[enc.PatientPracticeGuid];
    if (!pfPatient) {
      stats.skippedNoPatient++;
      continue;
    }

    // Match to CRM patient by name (multi-strategy)
    const crmPatientId = findCRMPatient(pfPatient.firstName, pfPatient.lastName);
    if (!crmPatientId) {
      stats.patientUnmatched++;
      const name = `${pfPatient.firstName} ${pfPatient.lastName}`;
      unmatchedPatients.set(name, (unmatchedPatients.get(name) || 0) + 1);
      continue;
    }
    stats.patientMatched++;

    // Build note body from SOAP fields
    const body = buildNoteBody(enc);
    if (!body) {
      stats.skippedEmpty++;
      continue;
    }

    // Parse encounter date
    const encounterDate = parsePFDate(enc.DateOfService);
    if (!encounterDate) {
      stats.errors++;
      console.log(`   ⚠️  Bad date: ${enc.DateOfService} for ${pfPatient.firstName} ${pfPatient.lastName}`);
      continue;
    }

    // Try to match to a CRM appointment (patient + same date)
    const aptKey = `${crmPatientId}|${encounterDate}`;
    const matchedApts = aptMap[aptKey] || [];
    let appointmentId = null;
    let encounterService = enc.ChartNoteType || 'SOAP Note';

    if (matchedApts.length > 0) {
      appointmentId = matchedApts[0].id;
      stats.appointmentMatched++;
      // Use the appointment's service name for encounter_service
      if (matchedApts[0].service) {
        encounterService = matchedApts[0].service;
      }
    } else {
      stats.appointmentUnmatched++;
    }

    // Provider info
    const signedBy = PROVIDERS[enc.SignedByProviderGuid] || null;
    const seenBy = PROVIDERS[enc.SeenByProviderGuid] || null;
    const signedAt = parsePFDateTime(enc.SignedDateTimeUtc);
    const isSigned = !!signedBy && !!signedAt;

    // Build note record
    const noteRecord = {
      patient_id: crmPatientId,
      body: body,
      note_date: `${encounterDate}T12:00:00-08:00`,
      source: 'practice_fusion',
      created_by: seenBy || signedBy || 'Practice Fusion Import',
      appointment_id: appointmentId,
      encounter_service: encounterService,
      status: isSigned ? 'signed' : 'draft',
      signed_by: isSigned ? signedBy : null,
      signed_at: isSigned ? signedAt : null,
      ghl_note_id: enc.EncounterGuid, // Re-used for dedup
      created_at: parsePFDateTime(enc.LastModifiedDateTimeUtc) || `${encounterDate}T12:00:00-08:00`,
    };

    insertBatch.push(noteRecord);
  }

  // Print stats
  console.log(`   Total PF encounters:    ${stats.total}`);
  console.log(`   Patient matched:        ${stats.patientMatched}`);
  console.log(`   Patient unmatched:      ${stats.patientUnmatched}`);
  console.log(`   PF patient not in demo: ${stats.skippedNoPatient}`);
  console.log(`   Appointment linked:     ${stats.appointmentMatched}`);
  console.log(`   Standalone (no apt):    ${stats.appointmentUnmatched}`);
  console.log(`   Skipped (duplicate):    ${stats.skippedDuplicate}`);
  console.log(`   Skipped (empty):        ${stats.skippedEmpty}`);
  console.log(`   Ready to insert:        ${insertBatch.length}`);

  if (unmatchedPatients.size > 0) {
    console.log(`\n   ⚠️  Unmatched patients (${unmatchedPatients.size} unique):`);
    const sorted = [...unmatchedPatients.entries()].sort((a, b) => b[1] - a[1]);
    sorted.slice(0, 40).forEach(([name, count]) => {
      console.log(`      ${name} (${count} encounter${count > 1 ? 's' : ''})`);
    });
    if (sorted.length > 40) console.log(`      ... and ${sorted.length - 40} more`);
  }

  // 7. Insert notes
  if (!DRY_RUN && insertBatch.length > 0) {
    console.log(`\n📥 Inserting ${insertBatch.length} notes...`);

    const BATCH_SIZE = 50;
    for (let i = 0; i < insertBatch.length; i += BATCH_SIZE) {
      const batch = insertBatch.slice(i, i + BATCH_SIZE);
      const { error: insertErr } = await supabase
        .from('patient_notes')
        .insert(batch);

      if (insertErr) {
        console.error(`   ❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} error: ${insertErr.message}`);
        // Try one by one to find the problem record
        for (const record of batch) {
          const { error: singleErr } = await supabase
            .from('patient_notes')
            .insert(record);
          if (singleErr) {
            stats.errors++;
            console.error(`      Failed: ${record.created_by} ${record.note_date} — ${singleErr.message}`);
          } else {
            stats.inserted++;
          }
        }
      } else {
        stats.inserted += batch.length;
        process.stdout.write(`   Inserted: ${stats.inserted} / ${insertBatch.length}\r`);
      }
    }
    console.log(`\n   ✓ Insertion complete: ${stats.inserted} notes`);
  }

  // 8. Handle addendums
  if (pfAddendums.length > 0 && !DRY_RUN) {
    console.log(`\n📎 Processing ${pfAddendums.length} addendum(s)...`);

    for (const add of pfAddendums) {
      // Skip if already imported
      if (existingGuids.has(`${add.EncounterGuid}_addendum`)) {
        console.log(`   ⏭  Addendum already imported for ${add.EncounterGuid}`);
        continue;
      }

      // Find the parent note by EncounterGuid
      const { data: parentNotes } = await supabase
        .from('patient_notes')
        .select('id, patient_id, appointment_id')
        .eq('ghl_note_id', add.EncounterGuid)
        .eq('source', 'practice_fusion')
        .limit(1);

      if (!parentNotes || parentNotes.length === 0) {
        console.log(`   ⚠️  Parent encounter not found for addendum: ${add.EncounterGuid}`);
        continue;
      }

      const parent = parentNotes[0];
      const addBody = stripHTML(add.Addendum);
      if (!addBody) continue;

      const addRecord = {
        patient_id: parent.patient_id,
        body: `ADDENDUM\n\n${addBody}`,
        note_date: parsePFDateTime(add.LastModifiedDateTimeUtc),
        source: 'practice_fusion',
        created_by: PROVIDERS[add.LastModifiedByProviderGuid] || 'Unknown',
        appointment_id: parent.appointment_id,
        status: add.AmendmentStatus === 'Accepted' ? 'signed' : 'draft',
        parent_note_id: parent.id,
        ghl_note_id: `${add.EncounterGuid}_addendum`,
      };

      const { error: addErr } = await supabase
        .from('patient_notes')
        .insert(addRecord);

      if (addErr) {
        console.log(`   ❌ Addendum insert error: ${addErr.message}`);
        stats.errors++;
      } else {
        console.log(`   ✓ Addendum inserted`);
        stats.inserted++;
      }
    }
  }

  // 9. Summary
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Import Summary');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Total PF encounters:     ${stats.total}`);
  console.log(`  Patient matches:         ${stats.patientMatched}`);
  console.log(`  Patient unmatched:       ${stats.patientUnmatched}`);
  console.log(`  Appointment linked:      ${stats.appointmentMatched}`);
  console.log(`  Standalone (no apt):     ${stats.appointmentUnmatched}`);
  console.log(`  Skipped (duplicate):     ${stats.skippedDuplicate}`);
  console.log(`  Skipped (empty):         ${stats.skippedEmpty}`);
  console.log(`  Inserted:                ${stats.inserted}`);
  console.log(`  Errors:                  ${stats.errors}`);
  console.log('═══════════════════════════════════════════════════\n');

  if (DRY_RUN) {
    console.log('💡 This was a dry run. Run without --dry-run to insert notes.\n');
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
