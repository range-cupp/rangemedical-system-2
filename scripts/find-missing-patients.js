#!/usr/bin/env node
// Search for patients by name (case-insensitive) who might not have been found by phone number

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

const searchNames = ['Riley', 'Zachary', 'Soraya', 'Anthony', 'Richard'];

console.log('\n=== Searching patients by name ===\n');

for (const searchName of searchNames) {
  // Use ilike to do case-insensitive search on both name and full_name
  const { data: matches, error } = await supabase
    .from('patients')
    .select('id, name, full_name, email, phone')
    .or(`name.ilike.%${searchName}%,full_name.ilike.%${searchName}%`)
    .order('name');

  if (error) {
    console.log(`Search for "${searchName}": ERROR - ${error.message}\n`);
    continue;
  }

  if (!matches || matches.length === 0) {
    console.log(`Search for "${searchName}": No matches found\n`);
    continue;
  }

  console.log(`Search for "${searchName}": ${matches.length} match(es)`);
  for (const p of matches) {
    console.log(`  Name:      ${p.name || '(none)'}`);
    console.log(`  Full Name: ${p.full_name || '(none)'}`);
    console.log(`  Email:     ${p.email || '(none)'}`);
    console.log(`  Phone:     ${p.phone || '(none)'}`);
    console.log(`  ID:        ${p.id}`);
    console.log('');
  }
}
