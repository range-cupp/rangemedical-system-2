// Backfill: signed WL encounter notes that have no linked service_log
// Range Medical — 2026-05-06
//
// Background: wl-note-sync is supposed to fire on note create / update / sign
// and stamp a service_log row keyed by note_id. But 21 signed WL encounter
// notes from the last 90 days have no service_log at all (Keely Julian's
// Apr 30 note is the canonical example). The note exists with a complete body
// (medication / dose / weight / side effects), the appointment is marked
// completed, but the protocol's sessions_used is short by one.
//
// This script finds those orphan notes and creates the missing service_log
// rows with note_id linkage, then recounts each affected protocol's
// sessions_used from actual log entries.

import { createClient } from '@supabase/supabase-js';

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ── Inline copy of the parser (lib/wl-note-parser.js) ──
function field(body, label) {
  const mdRe = new RegExp(`\\*\\*${label}:\\*\\*\\s*([^\\n]+)`, 'i');
  const md = body.match(mdRe);
  if (md) return md[1].trim();
  const htmlRe = new RegExp(`<(?:strong|b)>\\s*${label}:\\s*</(?:strong|b)>\\s*([^\\n<]+)`, 'i');
  const html = body.match(htmlRe);
  if (html) {
    return html[1].trim().replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#x2014;|&mdash;/g, '—');
  }
  return null;
}

function parseWeight(raw) {
  if (!raw) return null;
  const m = String(raw).match(/(-?\d+\.?\d*)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return isNaN(n) ? null : n;
}

function normalizeDose(raw) {
  if (!raw) return null;
  return String(raw).trim().replace(/\.$/, '').replace(/(\d+\.?\d*)\s+(mg|mcg|ml|iu)\b/i, '$1$2');
}

function parseWlNote(body) {
  if (!body) return null;
  const medication = field(body, 'Medication');
  const doseRaw = field(body, 'Dose');
  const weightRaw = field(body, 'Current Weight') || field(body, 'Weight');
  const sideEffects = field(body, 'Side Effects');
  if (!medication && !doseRaw && !weightRaw) return null;
  return {
    medication: medication || null,
    dose: normalizeDose(doseRaw),
    weight: parseWeight(weightRaw),
    side_effects: sideEffects || null,
  };
}

const apply = process.argv.includes('--apply');

// Find signed WL encounter notes from last 90 days
const since = new Date(); since.setDate(since.getDate() - 90);
const { data: notes } = await s.from('patient_notes')
  .select('id, patient_id, body, note_date, encounter_service, signed_at, appointment_id, created_by, edited_after_signing')
  .eq('encounter_service', 'weight_loss')
  .not('signed_at', 'is', null)
  .gte('created_at', since.toISOString())
  .order('note_date');

console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}`);
console.log(`Total signed WL encounter notes: ${notes?.length}`);

// Filter to orphans
const orphans = [];
for (const n of notes) {
  const { data: byId } = await s.from('service_logs').select('id').eq('note_id', n.id).limit(1);
  if (byId?.length) continue;
  const noteDate = new Date(n.note_date).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const { data: byDate } = await s.from('service_logs')
    .select('id, note_id')
    .eq('patient_id', n.patient_id)
    .eq('category', 'weight_loss')
    .eq('entry_type', 'injection')
    .eq('entry_date', noteDate)
    .limit(1);
  if (byDate?.length) {
    // There's a same-date log without note_id — link it instead of creating a new row
    orphans.push({ ...n, noteDate, mode: 'link', existingLogId: byDate[0].id });
    continue;
  }
  orphans.push({ ...n, noteDate, mode: 'create' });
}

console.log(`Orphan notes needing fix: ${orphans.length}`);
console.log(`  → create new log: ${orphans.filter(o => o.mode === 'create').length}`);
console.log(`  → link existing same-date log: ${orphans.filter(o => o.mode === 'link').length}`);
console.log('');

const affectedProtocols = new Set();
const skipped = [];

for (const o of orphans) {
  // Get patient name for output
  const { data: pt } = await s.from('patients').select('first_name, last_name').eq('id', o.patient_id).single();
  const name = `${pt?.first_name} ${pt?.last_name}`;

  // Parse note body
  const fields = parseWlNote(o.body);
  if (!fields) {
    console.log(`  ⊘ ${o.noteDate}  ${name.padEnd(28)}  body has no parseable WL fields — skipping`);
    skipped.push({ ...o, reason: 'no_fields' });
    continue;
  }

  // Find active WL protocol
  const { data: protocols } = await s.from('protocols')
    .select('id, sessions_used, total_sessions, status')
    .eq('patient_id', o.patient_id)
    .ilike('program_type', 'weight_loss%')
    .in('status', ['active', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1);
  const proto = protocols?.[0];
  if (!proto) {
    console.log(`  ⊘ ${o.noteDate}  ${name.padEnd(28)}  no active WL protocol — skipping`);
    skipped.push({ ...o, reason: 'no_protocol' });
    continue;
  }

  if (o.mode === 'link') {
    // Link existing log to this note
    if (apply) {
      const { error } = await s.from('service_logs').update({
        note_id: o.id,
        protocol_id: proto.id,
        medication: fields.medication || 'Retatrutide',
        dosage: fields.dose,
        weight: fields.weight,
      }).eq('id', o.existingLogId);
      if (error) { console.log(`  ✗ ${name}: ${error.message}`); continue; }
    }
    console.log(`  ↗ ${o.noteDate}  ${name.padEnd(28)}  linked existing log to note`);
  } else {
    // Create new log
    if (apply) {
      const { error } = await s.from('service_logs').insert({
        patient_id: o.patient_id,
        protocol_id: proto.id,
        category: 'weight_loss',
        entry_type: 'injection',
        entry_date: o.noteDate,
        medication: fields.medication || 'Retatrutide',
        dosage: fields.dose,
        weight: fields.weight,
        fulfillment_method: 'in_clinic',
        administered_by: o.created_by || null,
        note_id: o.id,
        notes: 'Backfill: encounter note existed but wl-note-sync never produced a service_log',
      });
      if (error) { console.log(`  ✗ ${name}: ${error.message}`); continue; }
    }
    console.log(`  ✓ ${o.noteDate}  ${name.padEnd(28)}  created log (dose=${fields.dose}, wt=${fields.weight})`);
  }
  affectedProtocols.add(proto.id);
}

console.log('');
console.log(`Affected protocols: ${affectedProtocols.size}`);

// Recount sessions_used for each affected protocol
if (apply) {
  for (const protoId of affectedProtocols) {
    const { count } = await s.from('service_logs')
      .select('*', { count: 'exact', head: true })
      .eq('protocol_id', protoId)
      .in('entry_type', ['injection', 'session']);
    await s.from('protocols').update({ sessions_used: count || 0, updated_at: new Date().toISOString() }).eq('id', protoId);
    console.log(`  recounted ${protoId.slice(0,8)} → sessions_used = ${count}`);
  }
}

console.log('');
console.log(`Skipped: ${skipped.length}`);
for (const sk of skipped) console.log(`  ${sk.noteDate}  reason=${sk.reason}`);
