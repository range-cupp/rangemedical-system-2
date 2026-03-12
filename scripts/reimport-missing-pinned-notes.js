#!/usr/bin/env node
// scripts/reimport-missing-pinned-notes.js
// Re-imports pinned notes from PF export for patients who were missed in the original import.
// Matches by email (more reliable than name matching).

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');
const { join } = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PF_DIR = '/Users/chriscupp/Library/Mobile Documents/com~apple~CloudDocs/Claude CUPP 2nd brain/Range Medical CRM/PracticeExport_5449226f-7ac3-4d00-9470-e28b28c51103_20260308_181507_1';

function parseTSV(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split('\t');
  return lines.slice(1).map(line => {
    const vals = line.split('\t');
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] || '').trim(); });
    return obj;
  });
}

function stripHTML(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/div>\s*<div[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

async function main() {
  console.log('\n📌 Re-import Missing Pinned Notes\n');

  // Load PF data
  const demographics = parseTSV(join(PF_DIR, 'patient-demographics.tsv'));
  const pinnedNotes = parseTSV(join(PF_DIR, 'pinned-notes.tsv'));

  console.log(`PF Demographics: ${demographics.length} patients`);
  console.log(`PF Pinned Notes: ${pinnedNotes.length} notes`);

  // Build PF GUID → email map from demographics
  const pfGuidToEmail = {};
  const pfGuidToName = {};
  for (const row of demographics) {
    const guid = row.PatientPracticeGuid;
    if (!guid) continue;
    const email = (row.Email || '').toLowerCase().trim();
    if (email) pfGuidToEmail[guid] = email;
    pfGuidToName[guid] = `${(row.FirstName || '').trim()} ${(row.LastName || '').trim()}`;
  }

  // Fetch CRM patients
  const { data: crmPatients } = await supabase
    .from('patients')
    .select('id, first_name, last_name, email');

  // Build CRM email → patient_id map
  const crmByEmail = {};
  const crmByName = {};
  for (const p of crmPatients) {
    if (p.email) crmByEmail[p.email.toLowerCase().trim()] = p;
    const nameKey = `${(p.first_name || '').toLowerCase().trim()}|${(p.last_name || '').toLowerCase().trim()}`;
    crmByName[nameKey] = p;
  }

  // Get patients who already have pinned notes
  const { data: existingPinned } = await supabase
    .from('patient_notes')
    .select('patient_id')
    .eq('pinned', true);

  const alreadyPinned = new Set((existingPinned || []).map(n => n.patient_id));
  console.log(`Patients already with pinned notes: ${alreadyPinned.size}`);

  // Process pinned notes
  let added = 0;
  let skipped = 0;
  let alreadyHas = 0;
  let noMatch = 0;
  const noMatchList = [];

  for (const note of pinnedNotes) {
    const guid = note.PatientPracticeGuid;
    if (!guid) continue;

    const body = stripHTML(note.NoteText);
    if (!body || body.length < 2) {
      skipped++;
      continue;
    }

    // Try to find CRM patient by email first, then by name
    let patient = null;
    const email = pfGuidToEmail[guid];
    if (email && crmByEmail[email]) {
      patient = crmByEmail[email];
    }

    if (!patient) {
      // Try name match
      const pfName = pfGuidToName[guid] || '';
      const parts = pfName.split(' ');
      if (parts.length >= 2) {
        const nameKey = `${parts[0].toLowerCase().trim()}|${parts[parts.length - 1].toLowerCase().trim()}`;
        if (crmByName[nameKey]) {
          patient = crmByName[nameKey];
        }
      }
    }

    if (!patient) {
      noMatch++;
      noMatchList.push(pfGuidToName[guid] || guid);
      continue;
    }

    // Check if this patient already has a pinned note
    if (alreadyPinned.has(patient.id)) {
      alreadyHas++;
      continue;
    }

    // Insert the pinned note
    const { error } = await supabase.from('patient_notes').insert({
      patient_id: patient.id,
      body: `📌 PINNED NOTE\n\n${body}`,
      note_date: note.LastModifiedDateTimeUtc ? new Date(note.LastModifiedDateTimeUtc).toISOString() : new Date().toISOString(),
      source: 'practice_fusion',
      status: 'draft',
      encounter_service: 'Pinned Note',
      created_by: 'Practice Fusion',
      pinned: true,
    });

    if (error) {
      console.log(`  ❌ Failed: ${patient.first_name} ${patient.last_name} — ${error.message}`);
    } else {
      console.log(`  ✅ ${patient.first_name} ${patient.last_name}`);
      alreadyPinned.add(patient.id); // Prevent duplicates within this run
      added++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`  Added: ${added}`);
  console.log(`  Already had pinned note: ${alreadyHas}`);
  console.log(`  Skipped (empty body): ${skipped}`);
  console.log(`  No patient match: ${noMatch}`);

  if (noMatchList.length > 0) {
    console.log(`\n⚠️  Unmatched patients:`);
    noMatchList.forEach(name => console.log(`  ${name}`));
  }

  // Final count
  const { count } = await supabase
    .from('patient_notes')
    .select('*', { count: 'exact', head: true })
    .eq('pinned', true);

  console.log(`\n📌 Total pinned notes now: ${count}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
