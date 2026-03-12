#!/usr/bin/env node
// scripts/reimport-missing-pinned-notes-v3.js
// Fixed: properly parse demographics TSV with multi-line UnPinnedNote field.
// Uses column-position-aware parsing to extract email correctly.

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');
const { join } = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PF_DIR = '/Users/chriscupp/Library/Mobile Documents/com~apple~CloudDocs/Claude CUPP 2nd brain/Range Medical CRM/PracticeExport_5449226f-7ac3-4d00-9470-e28b28c51103_20260308_181507_1';

function stripHTML(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/div>\s*<div[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .trim();
}

function parseDemographics(filePath) {
  // Custom parser: demographics has 50 columns. Column 47 (UnPinnedNote) may contain newlines.
  // Strategy: each new record starts with a UUID pattern. Concatenate continuation lines.
  const content = readFileSync(filePath, 'utf-8');
  const allLines = content.split('\n');
  const headers = allLines[0].split('\t');

  // Merge continuation lines (lines that don't start with a UUID)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\t/;
  const mergedLines = [];

  for (let i = 1; i < allLines.length; i++) {
    const line = allLines[i];
    if (!line.trim()) continue;

    if (uuidPattern.test(line)) {
      mergedLines.push(line);
    } else if (mergedLines.length > 0) {
      // Continuation of previous record's multi-line field
      mergedLines[mergedLines.length - 1] += '\n' + line;
    }
  }

  // Parse merged lines
  const records = [];
  for (const line of mergedLines) {
    const vals = line.split('\t');
    const obj = {};
    // Only grab the first 50 columns (anything extra is from multi-line content)
    for (let i = 0; i < Math.min(headers.length, vals.length); i++) {
      obj[headers[i].trim()] = (vals[i] || '').trim();
    }
    records.push(obj);
  }

  return records;
}

function parseTSV(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const allLines = content.split('\n');
  const headers = allLines[0].split('\t');

  // Same UUID-based merging for pinned notes (NoteText may have newlines in HTML)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\t/;
  const mergedLines = [];

  for (let i = 1; i < allLines.length; i++) {
    const line = allLines[i];
    if (!line.trim()) continue;
    if (uuidPattern.test(line)) {
      mergedLines.push(line);
    } else if (mergedLines.length > 0) {
      mergedLines[mergedLines.length - 1] += '\n' + line;
    }
  }

  return mergedLines.map(line => {
    const vals = line.split('\t');
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] || '').trim(); });
    return obj;
  });
}

async function main() {
  console.log('\n📌 Re-import Missing Pinned Notes (V3 - Fixed Parser)\n');

  const demographics = parseDemographics(join(PF_DIR, 'patient-demographics.tsv'));
  const pinnedNotes = parseTSV(join(PF_DIR, 'pinned-notes.tsv'));

  console.log(`PF Demographics: ${demographics.length} patients`);
  console.log(`PF Pinned Notes: ${pinnedNotes.length} notes`);

  // Build PF GUID → email/name/phone
  const pfInfo = {};
  let emailCount = 0;
  for (const row of demographics) {
    const guid = row.PatientPracticeGuid;
    if (!guid) continue;
    const email = (row.Email || '').toLowerCase().trim();
    if (email && email !== '\\n' && email.includes('@')) emailCount++;
    pfInfo[guid] = {
      firstName: (row.FirstName || '').trim(),
      lastName: (row.LastName || '').trim(),
      email: (email && email.includes('@')) ? email : '',
      phone: (row.MobilePhone || row.HomePhone || '').replace(/\D/g, '').slice(-10),
    };
  }
  console.log(`PF patients with valid email: ${emailCount}`);

  // Fetch ALL CRM patients (paginated past 1000-row limit)
  const crmPatients = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data } = await supabase
      .from('patients')
      .select('id, first_name, last_name, email, phone')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (!data || data.length === 0) break;
    crmPatients.push(...data);
    if (data.length < pageSize) break;
    page++;
  }

  const crmByEmail = {};
  const crmByName = {};
  for (const p of crmPatients) {
    if (p.email) crmByEmail[p.email.toLowerCase().trim()] = p;
    const first = (p.first_name || '').toLowerCase().trim();
    const last = (p.last_name || '').toLowerCase().trim();
    if (first && last) crmByName[`${first}|${last}`] = p;
  }
  console.log(`CRM patients: ${crmPatients.length}, with email: ${Object.keys(crmByEmail).length}`);

  // Get existing pinned notes
  const { data: existingPinned } = await supabase
    .from('patient_notes')
    .select('patient_id')
    .eq('pinned', true);
  const alreadyPinned = new Set((existingPinned || []).map(n => n.patient_id));
  console.log(`Already have pinned notes: ${alreadyPinned.size}\n`);

  let added = 0;
  let alreadyHas = 0;
  let noMatch = 0;
  const noMatchList = [];

  for (const note of pinnedNotes) {
    const guid = note.PatientPracticeGuid;
    if (!guid) continue;

    const body = stripHTML(note.NoteText);
    if (!body || body.length < 2) continue;

    const pf = pfInfo[guid];
    if (!pf) {
      noMatch++;
      noMatchList.push(`[no demographics] ${guid}`);
      continue;
    }

    let patient = null;
    let method = '';

    // 1. Email match
    if (pf.email && crmByEmail[pf.email]) {
      patient = crmByEmail[pf.email];
      method = 'email';
    }

    // 2. Exact name match
    if (!patient) {
      const key = `${pf.firstName.toLowerCase().trim()}|${pf.lastName.toLowerCase().trim()}`;
      if (crmByName[key]) {
        patient = crmByName[key];
        method = 'name';
      }
    }

    // 3. First name variations (Jonathon/Jonathan, etc.)
    if (!patient) {
      const pfFirst = pf.firstName.toLowerCase().trim();
      const pfLast = pf.lastName.toLowerCase().trim();
      // Try common variations
      for (const p of crmPatients) {
        const cFirst = (p.first_name || '').toLowerCase().trim();
        const cLast = (p.last_name || '').toLowerCase().trim();
        if (cLast !== pfLast) continue;
        // Check if first names are close (first 3 chars match + similar length)
        if (cFirst.length >= 3 && pfFirst.length >= 3 &&
            cFirst.substring(0, 3) === pfFirst.substring(0, 3) &&
            Math.abs(cFirst.length - pfFirst.length) <= 3) {
          patient = p;
          method = 'fuzzy-name';
          break;
        }
      }
    }

    if (!patient) {
      noMatch++;
      noMatchList.push(`${pf.firstName} ${pf.lastName} (${pf.email || 'no email'})`);
      continue;
    }

    if (alreadyPinned.has(patient.id)) {
      alreadyHas++;
      continue;
    }

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
      console.log(`  ❌ ${pf.firstName} ${pf.lastName}: ${error.message}`);
    } else {
      console.log(`  ✅ ${pf.firstName} ${pf.lastName} → ${patient.first_name} ${patient.last_name} (${method})`);
      alreadyPinned.add(patient.id);
      added++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`  Added: ${added}`);
  console.log(`  Already had pinned note: ${alreadyHas}`);
  console.log(`  No match: ${noMatch}`);

  if (noMatchList.length > 0) {
    console.log(`\n⚠️  Still unmatched (${noMatchList.length}):`);
    noMatchList.forEach(n => console.log(`  ${n}`));
  }

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
