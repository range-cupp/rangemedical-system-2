#!/usr/bin/env node
// scripts/reimport-missing-pinned-notes-v2.js
// Second pass: fuzzy matching for remaining unmatched pinned notes.
// Uses phone number, partial name, and Levenshtein distance.

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

function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10); // Last 10 digits
}

function normalizeStr(s) {
  return (s || '').toLowerCase().trim().replace(/[^a-z]/g, '');
}

async function main() {
  console.log('\n📌 Re-import Missing Pinned Notes (V2 - Fuzzy Match)\n');

  const demographics = parseTSV(join(PF_DIR, 'patient-demographics.tsv'));
  const pinnedNotes = parseTSV(join(PF_DIR, 'pinned-notes.tsv'));

  // Build PF GUID → patient info
  const pfInfo = {};
  for (const row of demographics) {
    const guid = row.PatientPracticeGuid;
    if (!guid) continue;
    pfInfo[guid] = {
      firstName: (row.FirstName || '').trim(),
      lastName: (row.LastName || '').trim(),
      email: (row.Email || '').toLowerCase().trim(),
      phone: normalizePhone(row.MobilePhone || row.HomePhone || ''),
    };
  }

  // Fetch CRM patients
  const { data: crmPatients } = await supabase
    .from('patients')
    .select('id, first_name, last_name, email, phone');

  // Build multi-index
  const crmByEmail = {};
  const crmByPhone = {};
  const crmByLastFirst = {};
  const crmByLast = {};

  for (const p of crmPatients) {
    if (p.email) crmByEmail[p.email.toLowerCase().trim()] = p;
    const phone = normalizePhone(p.phone);
    if (phone) crmByPhone[phone] = p;

    const first = normalizeStr(p.first_name);
    const last = normalizeStr(p.last_name);
    if (last) {
      if (!crmByLast[last]) crmByLast[last] = [];
      crmByLast[last].push(p);
    }
    if (first && last) {
      crmByLastFirst[`${last}|${first}`] = p;
    }
  }

  // Get patients who already have pinned notes
  const { data: existingPinned } = await supabase
    .from('patient_notes')
    .select('patient_id')
    .eq('pinned', true);
  const alreadyPinned = new Set((existingPinned || []).map(n => n.patient_id));

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
    if (!pf) continue;

    // Try matching in order: email → phone → exact name → last name + first initial
    let patient = null;
    let matchMethod = '';

    // 1. Email match
    if (pf.email && crmByEmail[pf.email]) {
      patient = crmByEmail[pf.email];
      matchMethod = 'email';
    }

    // 2. Phone match
    if (!patient && pf.phone && crmByPhone[pf.phone]) {
      patient = crmByPhone[pf.phone];
      matchMethod = 'phone';
    }

    // 3. Exact first+last name match
    if (!patient) {
      const first = normalizeStr(pf.firstName);
      const last = normalizeStr(pf.lastName);
      if (crmByLastFirst[`${last}|${first}`]) {
        patient = crmByLastFirst[`${last}|${first}`];
        matchMethod = 'name';
      }
    }

    // 4. Last name + first name starts with same letter
    if (!patient) {
      const pfFirst = normalizeStr(pf.firstName);
      const pfLast = normalizeStr(pf.lastName);
      const candidates = crmByLast[pfLast] || [];
      for (const c of candidates) {
        const cFirst = normalizeStr(c.first_name);
        // Check if first names start with the same 3+ chars
        if (pfFirst.length >= 3 && cFirst.length >= 3 && pfFirst.substring(0, 3) === cFirst.substring(0, 3)) {
          patient = c;
          matchMethod = 'fuzzy-name';
          break;
        }
      }
    }

    // 5. Try splitting hyphenated or multi-part last names
    if (!patient) {
      const pfLast = normalizeStr(pf.lastName);
      const pfFirst = normalizeStr(pf.firstName);
      // Try last name without hyphens
      const lastParts = pf.lastName.toLowerCase().split(/[-\s]/);
      for (const part of lastParts) {
        const normPart = part.replace(/[^a-z]/g, '');
        if (normPart.length < 3) continue;
        const candidates = crmByLast[normPart] || [];
        for (const c of candidates) {
          const cFirst = normalizeStr(c.first_name);
          if (pfFirst.substring(0, 3) === cFirst.substring(0, 3)) {
            patient = c;
            matchMethod = 'split-name';
            break;
          }
        }
        if (patient) break;
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
      console.log(`  ✅ ${pf.firstName} ${pf.lastName} → ${patient.first_name} ${patient.last_name} (${matchMethod})`);
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
