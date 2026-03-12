// scripts/backfill-names-from-intakes.js
// One-time sweep: update patient first_name, last_name, name, and preferred_name
// from their linked intake forms (intake is the authoritative source for legal name).
//
// Usage: node scripts/backfill-names-from-intakes.js
// Add --dry-run to preview without writing to the DB.

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DRY_RUN = process.argv.includes('--dry-run');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- Safety Guard: Smart capitalize that preserves Mc/Mac/O'/hyphenated patterns ---
function smartCapitalizeWord(word) {
  if (!word) return '';
  word = word.trim();
  if (!word) return '';

  const lower = word.toLowerCase();

  // Mc prefix: McDonald, McAdoo, McRae, McLane
  if (lower.startsWith('mc') && word.length > 2 && word.length <= 12) {
    return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase();
  }

  // Mac prefix (only if 7+ chars and not a common non-prefix word): MacDonald, MacGregor
  // Skip shorter Mac names — too many false positives (Mackey, Mackay, Macon, etc.)
  if (lower.startsWith('mac') && word.length >= 7 && /^mac[a-z]/.test(lower)) {
    const nonPrefixMac = ['mace', 'mack', 'macy', 'macro', 'macho', 'machine', 'macon', 'macey', 'macie', 'mackie', 'macomb', 'machin', 'mackie'];
    if (!nonPrefixMac.some(w => lower === w || lower.startsWith(w))) {
      return 'Mac' + word.charAt(3).toUpperCase() + word.slice(4).toLowerCase();
    }
  }

  // O' prefix: O'Brien, O'Banion, O'Connell
  if (lower.startsWith("o'") && word.length > 2) {
    return "O'" + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase();
  }

  // Default: simple capitalize
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function smartCapitalize(str) {
  if (!str) return '';
  str = str.trim().replace(/\s+/g, ' ');
  if (!str) return '';

  // Handle hyphenated names: Mary-Jane, Smith-Jones
  if (str.includes('-')) {
    return str.split('-').map(part => smartCapitalize(part)).join('-');
  }

  // Handle multi-word names: split on spaces, capitalize each word
  if (str.includes(' ')) {
    return str.split(' ').map(word => smartCapitalizeWord(word)).join(' ');
  }

  return smartCapitalizeWord(str);
}

// --- Safety Guards ---

// Guard 1: Test records
function isTestRecord(firstName, lastName) {
  const combined = `${firstName} ${lastName}`.toLowerCase();
  return (
    combined.includes('test') ||
    combined.includes('demo') ||
    combined.includes('sample') ||
    combined.includes('fake') ||
    combined.includes('xxx') ||
    /^[a-z]$/.test(firstName?.toLowerCase() || '') || // single letter first name
    /^[a-z]$/.test(lastName?.toLowerCase() || '')     // single letter last name
  );
}

// Guard 2: Detect if names are too different (likely wrong person linked to intake)
function levenshtein(a, b) {
  if (!a || !b) return Math.max((a || '').length, (b || '').length);
  a = a.toLowerCase();
  b = b.toLowerCase();
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function namesTooDifferent(intakeFirst, intakeLast, patientFirst, patientLast) {
  // If patient has no name at all, intake is always an improvement
  if (!patientFirst && !patientLast) return false;

  // If intake has no first name, skip
  if (!intakeFirst || intakeFirst.trim().length === 0) return true;

  // Compare first names — if both exist and are wildly different, flag it
  if (patientFirst && intakeFirst) {
    const dist = levenshtein(intakeFirst, patientFirst);
    const maxLen = Math.max(intakeFirst.length, patientFirst.length);
    // If edit distance is > 50% of the longer name, it's too different
    if (maxLen >= 3 && dist / maxLen > 0.5) {
      return true;
    }
  }

  // Compare last names similarly
  if (patientLast && intakeLast) {
    const dist = levenshtein(intakeLast, patientLast);
    const maxLen = Math.max(intakeLast.length, patientLast.length);
    if (maxLen >= 3 && dist / maxLen > 0.5) {
      return true;
    }
  }

  return false;
}

// Guard 3: Detect duplicated name parts (e.g., "Emilia schmidt Schmidt")
function hasDuplicatedParts(firstName, lastName) {
  if (!firstName || !lastName) return false;
  const first = firstName.toLowerCase().trim();
  const last = lastName.toLowerCase().trim();
  // First name appears in last name or vice versa
  if (last.includes(first) && first.length > 2) return true;
  if (first.includes(last) && last.length > 2) return true;
  return false;
}

// Guard 4: Detect swapped first/last (intake first = patient last AND intake last = patient first)
function namesSwapped(intakeFirst, intakeLast, patientFirst, patientLast) {
  if (!intakeFirst || !intakeLast || !patientFirst || !patientLast) return false;
  const iF = intakeFirst.toLowerCase().trim();
  const iL = intakeLast.toLowerCase().trim();
  const pF = patientFirst.toLowerCase().trim();
  const pL = patientLast.toLowerCase().trim();
  return (iF === pL && iL === pF) && (iF !== iL); // swapped and not same name
}

// Guard 5: Check if intake name looks malformed
function looksMalformed(str) {
  if (!str) return false;
  str = str.trim();
  // Starts with special chars (not letter, apostrophe, or hyphen)
  if (/^[^a-zA-Z']/.test(str)) return true;
  return false;
}

// Guard 6: Close-but-not-identical names — likely a typo in one direction
// If patient already has a name and the intake is similar (1-2 edits) but NOT case-insensitive identical,
// skip it because we can't know which is correct
function isLikelyTypo(intakeName, patientName) {
  if (!intakeName || !patientName) return false;
  const iLower = intakeName.toLowerCase().trim();
  const pLower = patientName.toLowerCase().trim();
  // If they're identical ignoring case, it's fine (just capitalization fix)
  if (iLower === pLower) return false;
  // If edit distance is small, it's ambiguous — could be typo in either direction
  const dist = levenshtein(iLower, pLower);
  const minLen = Math.min(iLower.length, pLower.length);
  // For short names (< 7 chars), flag distance 1-3 as ambiguous
  // For longer names, flag distance 1-2
  const maxDist = minLen < 7 ? 3 : 2;
  if (dist >= 1 && dist <= maxDist && minLen >= 3) {
    return true;
  }
  return false;
}

async function run() {
  console.log(`\n=== Backfill Names from Intakes ${DRY_RUN ? '[DRY RUN]' : '[LIVE]'} ===\n`);

  // Fetch all intakes that are linked to a patient and have name data
  const { data: intakes, error } = await supabase
    .from('intakes')
    .select('id, patient_id, first_name, last_name, preferred_name, submitted_at')
    .not('patient_id', 'is', null)
    .or('first_name.neq.,last_name.neq.')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching intakes:', error);
    process.exit(1);
  }

  console.log(`Found ${intakes.length} linked intakes with name data.\n`);

  // Deduplicate: keep only the most recent intake per patient
  const latestByPatient = {};
  for (const intake of intakes) {
    if (!latestByPatient[intake.patient_id]) {
      latestByPatient[intake.patient_id] = intake;
    }
  }
  const uniqueIntakes = Object.values(latestByPatient);
  console.log(`Unique patients to process: ${uniqueIntakes.length}\n`);

  // Fetch current patient records for comparison (batch to avoid header overflow)
  const patientIds = uniqueIntakes.map(i => i.patient_id);
  const patientMap = {};
  const BATCH_SIZE = 50;
  for (let i = 0; i < patientIds.length; i += BATCH_SIZE) {
    const batch = patientIds.slice(i, i + BATCH_SIZE);
    const { data: patients, error: pErr } = await supabase
      .from('patients')
      .select('id, first_name, last_name, name, preferred_name')
      .in('id', batch);

    if (pErr) {
      console.error('Error fetching patients batch:', pErr);
      process.exit(1);
    }
    for (const p of patients) patientMap[p.id] = p;
  }
  console.log(`Fetched ${Object.keys(patientMap).length} patient records.\n`);

  let updated = 0;
  let skipped = 0;
  let unchanged = 0;
  const changes = [];
  const skippedReasons = {};

  function skipWith(reason, patientName, intakeFirst, intakeLast) {
    skippedReasons[reason] = (skippedReasons[reason] || 0) + 1;
    console.log(`  [SKIP: ${reason}] ${patientName || '(no name)'} — intake: ${intakeFirst || ''} ${intakeLast || ''}`);
    skipped++;
  }

  for (const intake of uniqueIntakes) {
    const patient = patientMap[intake.patient_id];
    if (!patient) {
      console.warn(`  WARN: Patient ${intake.patient_id} not found in DB — skipping`);
      skipped++;
      continue;
    }

    const rawFirst = (intake.first_name || '').trim().replace(/\s+/g, ' ');
    const rawLast = (intake.last_name || '').trim().replace(/\s+/g, ' ');

    // --- Run safety guards ---

    // Guard 1: Skip test records
    if (isTestRecord(rawFirst, rawLast)) {
      skipWith('TEST_RECORD', patient.name, rawFirst, rawLast);
      continue;
    }

    // Guard 2: Skip if intake name looks malformed (before capitalization)
    if (looksMalformed(intake.first_name) || looksMalformed(intake.last_name)) {
      skipWith('MALFORMED', patient.name, rawFirst, rawLast);
      continue;
    }

    // Guard 3: Skip if names are too different (likely wrong person)
    if (namesTooDifferent(rawFirst, rawLast, patient.first_name, patient.last_name)) {
      skipWith('TOO_DIFFERENT', patient.name, rawFirst, rawLast);
      continue;
    }

    // Guard 4: Skip if first/last appear swapped
    if (namesSwapped(rawFirst, rawLast, patient.first_name, patient.last_name)) {
      skipWith('SWAPPED', patient.name, rawFirst, rawLast);
      continue;
    }

    // Guard 5: Skip if duplicated name parts
    if (hasDuplicatedParts(rawFirst, rawLast)) {
      skipWith('DUPLICATED_PARTS', patient.name, rawFirst, rawLast);
      continue;
    }

    // Guard 6: Skip if intake name is close-but-not-identical to patient name
    // (likely a typo in one direction — can't know which is correct)
    if (isLikelyTypo(rawFirst, patient.first_name)) {
      skipWith('LIKELY_TYPO_FIRST', patient.name, rawFirst, rawLast);
      continue;
    }
    if (isLikelyTypo(rawLast, patient.last_name)) {
      skipWith('LIKELY_TYPO_LAST', patient.name, rawFirst, rawLast);
      continue;
    }

    // --- Apply smart capitalization ---
    const capFirst = smartCapitalize(rawFirst) || patient.first_name || '';
    const capLast = smartCapitalize(rawLast) || patient.last_name || '';
    const newName = `${capFirst} ${capLast}`.trim();

    // Guard 7: Skip if the update would make the name WORSE
    // (intake name is shorter by 3+ chars — likely truncated or typo)
    if (patient.first_name && capFirst && capFirst.length < patient.first_name.length - 2) {
      skipWith('SHORTER_FIRST', patient.name, capFirst, capLast);
      continue;
    }
    if (patient.last_name && capLast && capLast.length < patient.last_name.length - 2) {
      skipWith('SHORTER_LAST', patient.name, capFirst, capLast);
      continue;
    }

    const nameChanged =
      capFirst !== (patient.first_name || '') ||
      capLast !== (patient.last_name || '') ||
      newName !== (patient.name || '');
    const preferredChanged =
      intake.preferred_name && intake.preferred_name !== patient.preferred_name;

    if (!nameChanged && !preferredChanged) {
      unchanged++;
      continue;
    }

    const updates = {};
    if (nameChanged) {
      updates.first_name = capFirst;
      updates.last_name = capLast;
      updates.name = newName;
    }
    if (preferredChanged) {
      updates.preferred_name = intake.preferred_name;
    }

    const changeLog = {
      patient_id: patient.id,
      old: { name: patient.name, first_name: patient.first_name, last_name: patient.last_name, preferred_name: patient.preferred_name },
      new: { name: newName, first_name: capFirst, last_name: capLast, preferred_name: intake.preferred_name || patient.preferred_name },
    };

    console.log(`  ${DRY_RUN ? '[WOULD UPDATE]' : '[UPDATING]'} ${patient.name || '(no name)'} → ${newName}${preferredChanged ? ` (goes by: ${intake.preferred_name})` : ''}`);
    changes.push(changeLog);

    if (!DRY_RUN) {
      const { error: uErr } = await supabase.from('patients').update(updates).eq('id', patient.id);
      if (uErr) {
        console.error(`  ERROR updating patient ${patient.id}:`, uErr.message);
        skipped++;
        continue;
      }
    }
    updated++;
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Updated:   ${updated}`);
  console.log(`  Unchanged: ${unchanged}`);
  console.log(`  Skipped:   ${skipped}`);

  if (Object.keys(skippedReasons).length > 0) {
    console.log(`\n  Skip reasons:`);
    for (const [reason, count] of Object.entries(skippedReasons).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${reason}: ${count}`);
    }
  }

  if (DRY_RUN) {
    console.log(`\nDry run complete. Run without --dry-run to apply changes.`);
  } else {
    console.log(`\nBackfill complete.`);
  }
}

run().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
