#!/usr/bin/env node
// Rewrite Tim Keating's Retatrutide block to reflect reality:
// - 4/8 in-clinic injection (done)
// - 4/15 take-home injection (done)
// - 4/22 in-clinic (upcoming)
// - 4/29 in-clinic (upcoming)
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envFile = readFileSync(resolve(import.meta.dirname, '..', '.env.local'), 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const PATIENT_ID  = 'cc6d8d0d-7939-4aa4-913e-4de8c2d3794b';
const PROTOCOL_ID = '4d44b9b7-f5e6-4929-b5d3-16cb5350f08e';
const OLD_PICKUP_ID = 'e73bbf24-af85-42d3-993c-4e75bf2a373c';

// 1. Update the existing pickup: move to 4/15, quantity 1, dosage 2mg
const { error: updErr } = await supabase
  .from('service_logs')
  .update({
    entry_date: '2026-04-15',
    quantity: 1,
    dosage: '2mg',
    notes: 'Take-home injection (week 2 of in-clinic block)',
  })
  .eq('id', OLD_PICKUP_ID);

if (updErr) { console.error('Pickup update failed:', updErr); process.exit(1); }
console.log('Updated pickup → 4/15, qty 1, 2mg');

// 2. Insert the 4/8 in-clinic injection
const { data: inserted, error: insErr } = await supabase
  .from('service_logs')
  .insert({
    patient_id: PATIENT_ID,
    protocol_id: PROTOCOL_ID,
    category: 'weight_loss',
    entry_type: 'injection',
    entry_date: '2026-04-08',
    medication: 'Retatrutide',
    dosage: '2mg',
    quantity: 1,
    fulfillment_method: 'in_clinic',
    tracking_number: null,
    notes: 'First in-clinic injection (week 1 of in-clinic block)',
  })
  .select()
  .single();

if (insErr) { console.error('Injection insert failed:', insErr); process.exit(1); }
console.log('Inserted injection on 4/8:', inserted.id);

// 3. Verify final state
const { data: logs } = await supabase
  .from('service_logs')
  .select('id, entry_date, entry_type, medication, dosage, quantity, fulfillment_method, notes')
  .eq('patient_id', PATIENT_ID)
  .order('entry_date', { ascending: true });

console.log('\nFinal service logs:');
for (const l of logs || []) {
  console.log(`  ${l.entry_date}  ${l.entry_type.padEnd(13)}  qty=${l.quantity ?? '-'}  ${l.dosage ?? '-'}  ${l.fulfillment_method ?? '-'}  — ${l.notes ?? ''}`);
}
