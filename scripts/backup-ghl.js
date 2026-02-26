#!/usr/bin/env node
// scripts/backup-ghl.js
// One-time backup of all GHL contact data and notes into Range patient profiles.
// Usage: node scripts/backup-ghl.js [--dry-run]

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env vars from .env.local
const envPath = resolve(import.meta.dirname, '..', '.env.local');
const envFile = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
}

const DRY_RUN = process.argv.includes('--dry-run');

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const GHL_API_KEY = env.GHL_API_KEY;
const GHL_LOCATION_ID = env.GHL_LOCATION_ID;
const GHL_BASE = 'https://services.leadconnectorhq.com';

const GHL_HEADERS = {
  'Authorization': `Bearer ${GHL_API_KEY}`,
  'Version': '2021-07-28',
  'Content-Type': 'application/json'
};

// Normalize phone to last 10 digits for matching
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '').slice(-10);
  return digits.length === 10 ? digits : null;
}

// Sleep helper
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Fetch with 429 retry
async function ghlFetch(url, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers: GHL_HEADERS });

    if (res.status === 429) {
      console.log('    Rate limited (429) — waiting 60s...');
      await sleep(60000);
      continue;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GHL API ${res.status}: ${text}`);
    }

    return res.json();
  }
  throw new Error(`GHL API failed after ${retries + 1} attempts`);
}

async function main() {
  console.log(`\n=== GHL Data Backup ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  // -------------------------------------------------------
  // Step 1: Fetch ALL GHL contacts (paginated)
  // -------------------------------------------------------
  console.log('Step 1: Fetching all GHL contacts...');
  const allContacts = [];
  let nextPageUrl = null;
  let page = 1;

  do {
    const url = nextPageUrl ||
      `${GHL_BASE}/contacts/?locationId=${GHL_LOCATION_ID}&limit=100`;

    const data = await ghlFetch(url);
    const contacts = data.contacts || [];
    allContacts.push(...contacts);
    console.log(`  Page ${page}: ${contacts.length} contacts`);

    nextPageUrl = data.meta?.nextPageUrl || null;
    page++;

    if (page > 50) {
      console.log('  Reached page limit (50), stopping pagination');
      break;
    }
  } while (nextPageUrl);

  console.log(`  Total GHL contacts: ${allContacts.length}\n`);

  // -------------------------------------------------------
  // Step 2: Fetch all existing patients from Supabase
  // -------------------------------------------------------
  console.log('Step 2: Fetching patients from Supabase...');
  const { data: patients, error: pErr } = await supabase
    .from('patients')
    .select('id, first_name, last_name, email, phone, date_of_birth, gender, ghl_contact_id');

  if (pErr) {
    console.error('Failed to fetch patients:', pErr);
    process.exit(1);
  }
  console.log(`  Found ${patients.length} patients\n`);

  // -------------------------------------------------------
  // Step 3: Build lookup maps
  // -------------------------------------------------------
  console.log('Step 3: Building lookup maps...');

  const byGhlId = {};
  const byEmail = {};
  const byPhone = {};

  for (const p of patients) {
    if (p.ghl_contact_id) {
      byGhlId[p.ghl_contact_id] = p;
    }
    if (p.email) {
      const key = p.email.toLowerCase().trim();
      if (!byEmail[key]) byEmail[key] = p;
    }
    if (p.phone) {
      const key = normalizePhone(p.phone);
      if (key && !byPhone[key]) byPhone[key] = p;
    }
  }

  console.log(`  By GHL ID: ${Object.keys(byGhlId).length}`);
  console.log(`  By email: ${Object.keys(byEmail).length}`);
  console.log(`  By phone: ${Object.keys(byPhone).length}\n`);

  // -------------------------------------------------------
  // Step 4: Match contacts to patients, backfill demographics
  // -------------------------------------------------------
  console.log('Step 4: Matching contacts to patients & backfilling demographics...\n');

  const matched = [];
  const unmatched = [];
  const created = [];
  let demographicsUpdated = 0;
  let ghlLinked = 0;

  for (const contact of allContacts) {
    const contactId = contact.id;
    const email = contact.email?.toLowerCase()?.trim();
    const phone = normalizePhone(contact.phone);

    // Match priority: ghl_contact_id → email → phone
    let patient = byGhlId[contactId] || null;
    let matchType = 'ghl_id';

    if (!patient && email) {
      patient = byEmail[email] || null;
      matchType = 'email';
    }
    if (!patient && phone) {
      patient = byPhone[phone] || null;
      matchType = 'phone';
    }

    if (patient) {
      matched.push({ contact, patient, matchType });

      // Backfill empty demographic fields
      const updates = {};
      if (!patient.first_name && contact.firstName) updates.first_name = contact.firstName;
      if (!patient.last_name && contact.lastName) updates.last_name = contact.lastName;
      if (!patient.email && contact.email) updates.email = contact.email;
      if (!patient.phone && contact.phone) updates.phone = contact.phone;
      if (!patient.date_of_birth && contact.dateOfBirth) updates.date_of_birth = contact.dateOfBirth;
      if (!patient.gender && contact.gender) updates.gender = contact.gender;

      // Link ghl_contact_id if matched by email/phone but missing the link
      if (!patient.ghl_contact_id) {
        updates.ghl_contact_id = contactId;
        ghlLinked++;
      }

      if (Object.keys(updates).length > 0) {
        demographicsUpdated++;
        if (!DRY_RUN) {
          const { error } = await supabase
            .from('patients')
            .update(updates)
            .eq('id', patient.id);
          if (error) {
            console.error(`  FAILED updating ${patient.first_name} ${patient.last_name}: ${error.message}`);
          }
        }
      }
    } else {
      // Unmatched — create new patient if they have at least a name or email
      const hasName = contact.firstName || contact.lastName;
      const hasEmail = contact.email;

      if (hasName || hasEmail) {
        const name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
        const newPatient = {
          name: name || contact.email || 'Unknown',
          first_name: contact.firstName || null,
          last_name: contact.lastName || null,
          email: contact.email || null,
          phone: contact.phone || null,
          date_of_birth: contact.dateOfBirth || null,
          gender: contact.gender || null,
          ghl_contact_id: contactId
        };

        if (!DRY_RUN) {
          const { data: inserted, error } = await supabase
            .from('patients')
            .insert(newPatient)
            .select('id')
            .single();

          if (error) {
            console.error(`  FAILED creating patient for ${contact.firstName} ${contact.lastName}: ${error.message}`);
            unmatched.push({ contact, reason: 'insert_failed' });
            continue;
          }
          newPatient.id = inserted.id;
        } else {
          newPatient.id = 'dry-run-id';
        }

        created.push({ contact, patient: newPatient });

        // Add to lookup maps so notes can reference this patient
        byGhlId[contactId] = newPatient;
      } else {
        unmatched.push({ contact, reason: 'no_name_or_email' });
      }
    }
  }

  console.log(`  Matched: ${matched.length}`);
  console.log(`  Created: ${created.length}`);
  console.log(`  Unmatched (skipped): ${unmatched.length}`);
  console.log(`  Demographics backfilled: ${demographicsUpdated}`);
  console.log(`  GHL IDs newly linked: ${ghlLinked}\n`);

  // Print match details
  if (matched.length > 0) {
    console.log('--- MATCHES (sample) ---');
    const sample = matched.slice(0, 20);
    for (const m of sample) {
      const name = `${m.contact.firstName || ''} ${m.contact.lastName || ''}`.trim();
      console.log(`  ${name.padEnd(30)} → ${(m.patient.first_name || '')} ${(m.patient.last_name || '')} (${m.matchType})`);
    }
    if (matched.length > 20) console.log(`  ... and ${matched.length - 20} more`);
    console.log('');
  }

  if (unmatched.length > 0) {
    console.log('--- UNMATCHED (skipped) ---');
    const sample = unmatched.slice(0, 10);
    for (const u of sample) {
      const name = `${u.contact.firstName || ''} ${u.contact.lastName || ''}`.trim() || '(no name)';
      console.log(`  ${name} — ${u.reason}`);
    }
    if (unmatched.length > 10) console.log(`  ... and ${unmatched.length - 10} more`);
    console.log('');
  }

  // -------------------------------------------------------
  // Step 5: Fetch notes for each contact (batched 10 concurrent)
  // -------------------------------------------------------
  console.log('Step 5: Fetching notes for all contacts...');

  // Build contactId → patientId map from matched + created
  const contactToPatient = {};
  for (const m of matched) contactToPatient[m.contact.id] = m.patient.id;
  for (const c of created) contactToPatient[c.contact.id] = c.patient.id;

  const contactIds = Object.keys(contactToPatient);
  const allNotes = [];
  let notesFetchErrors = 0;

  for (let i = 0; i < contactIds.length; i += 10) {
    const batch = contactIds.slice(i, i + 10);

    const results = await Promise.allSettled(
      batch.map(async (contactId) => {
        try {
          const data = await ghlFetch(`${GHL_BASE}/contacts/${contactId}/notes`);
          const notes = data.notes || [];
          return notes.map(n => ({
            patient_id: contactToPatient[contactId],
            ghl_note_id: n.id,
            body: n.body,
            note_date: n.dateAdded || n.createdAt || null
          }));
        } catch (err) {
          // Retry once
          try {
            await sleep(1000);
            const data = await ghlFetch(`${GHL_BASE}/contacts/${contactId}/notes`);
            const notes = data.notes || [];
            return notes.map(n => ({
              patient_id: contactToPatient[contactId],
              ghl_note_id: n.id,
              body: n.body,
              note_date: n.dateAdded || n.createdAt || null
            }));
          } catch {
            notesFetchErrors++;
            return [];
          }
        }
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allNotes.push(...result.value);
      }
    }

    if (i + 10 < contactIds.length) {
      process.stdout.write(`  Fetched notes for ${Math.min(i + 10, contactIds.length)}/${contactIds.length} contacts\r`);
      await sleep(500);
    }
  }

  console.log(`  Fetched notes for ${contactIds.length}/${contactIds.length} contacts`);
  console.log(`  Total notes found: ${allNotes.length}`);
  if (notesFetchErrors > 0) console.log(`  Fetch errors (skipped): ${notesFetchErrors}`);
  console.log('');

  // -------------------------------------------------------
  // Step 6: Upsert notes into patient_notes
  // -------------------------------------------------------
  if (allNotes.length > 0) {
    console.log(`Step 6: Upserting ${allNotes.length} notes into patient_notes...`);

    if (DRY_RUN) {
      console.log(`  DRY RUN — would upsert ${allNotes.length} notes\n`);
    } else {
      let notesInserted = 0;
      let notesSkipped = 0;
      let notesErrors = 0;

      // Insert in batches of 50
      for (let i = 0; i < allNotes.length; i += 50) {
        const batch = allNotes.slice(i, i + 50);
        const { error } = await supabase
          .from('patient_notes')
          .upsert(batch, { onConflict: 'ghl_note_id', ignoreDuplicates: true });

        if (error) {
          console.error(`  Batch error: ${error.message}`);
          notesErrors += batch.length;
        } else {
          notesInserted += batch.length;
        }
      }

      console.log(`  Inserted: ${notesInserted}, Errors: ${notesErrors}\n`);
    }
  } else {
    console.log('Step 6: No notes to upsert.\n');
  }

  // -------------------------------------------------------
  // Step 7: Summary
  // -------------------------------------------------------
  console.log('=== SUMMARY ===');
  console.log(`GHL contacts fetched:      ${allContacts.length}`);
  console.log(`Patients matched:          ${matched.length}`);
  console.log(`Patients created:          ${created.length}`);
  console.log(`Contacts skipped:          ${unmatched.length}`);
  console.log(`Demographics backfilled:   ${demographicsUpdated}`);
  console.log(`GHL IDs linked:            ${ghlLinked}`);
  console.log(`Notes found:               ${allNotes.length}`);
  console.log(`Notes fetch errors:        ${notesFetchErrors}`);

  if (DRY_RUN) {
    console.log(`\nDRY RUN — no changes were made. Run without --dry-run to apply.\n`);
  } else {
    console.log(`\nBackup complete.\n`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
