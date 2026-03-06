#!/usr/bin/env node
// Quick script to look up patients missing emails from the failed SMS list

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envFile = readFileSync(resolve(import.meta.dirname, '..', '.env.local'), 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// The 12 phone numbers from failed SMS with no email
const phones = [
  { phone: '+19499337628', name: 'Riley' },
  { phone: '+164212335560', name: 'Josiah' },
  { phone: '+19492167583', name: 'Zachary' },
  { phone: '+19492370873', name: 'Soraya' },
  { phone: '+19493007809', name: 'Ken' },
  { phone: '+19495664730', name: 'HRT IV reminder' },
  { phone: '+19493077404', name: 'HRT IV reminder' },
  { phone: '+17144588107', name: 'Jennifer' },
  { phone: '+19099730163', name: 'Anthony' },
  { phone: '+17143231421', name: 'Deborah' },
  { phone: '+17147203186', name: 'Richard' },
  { phone: '+19492442323', name: 'James' },
];

const { data: patients } = await supabase
  .from('patients')
  .select('id, name, full_name, first_name, email, phone')
  .order('name');

console.log('\n=== Patients with failed SMS but no email ===\n');

for (const entry of phones) {
  const digits = entry.phone.replace(/\D/g, '');
  const last10 = digits.slice(-10);

  const match = patients.find(p => {
    if (!p.phone) return false;
    const pDigits = p.phone.replace(/\D/g, '');
    const pLast10 = pDigits.slice(-10);
    return pLast10 === last10;
  });

  if (match) {
    console.log(`${entry.phone} (${entry.name})`);
    console.log(`  Patient: ${match.full_name || match.name}`);
    console.log(`  Email:   ${match.email || '❌ NONE'}`);
    console.log(`  Phone:   ${match.phone}`);
    console.log(`  ID:      ${match.id}`);
    console.log('');
  } else {
    console.log(`${entry.phone} (${entry.name})`);
    console.log(`  ❌ NO PATIENT RECORD FOUND`);
    console.log('');
  }
}
