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

// Look up the specific patients by name
const names = ['Riley Kerrigan', 'Zachary Zarvos', 'Soraya Burwell', 'Richard Wilner', 'Anthony Napolitan', 'Anthony Rinna'];

for (const name of names) {
  const { data } = await supabase
    .from('patients')
    .select('id, name, full_name, email, phone')
    .ilike('name', `%${name.split(' ')[1]}%`);

  const match = data.find(p => (p.full_name || p.name || '').toLowerCase().includes(name.split(' ')[1].toLowerCase()));
  if (match) {
    console.log(`${match.full_name || match.name} | email: ${match.email || 'NO EMAIL'} | phone: ${match.phone || 'NO PHONE'} | id: ${match.id}`);
  } else {
    console.log(`${name} — NOT FOUND`);
  }
}

// Also check Anthony by phone +19099730163
console.log('\n--- Anthony by phone 909-973-0163 ---');
const { data: allPatients } = await supabase.from('patients').select('id, name, full_name, email, phone');
const anthonyMatch = allPatients.find(p => {
  if (!p.phone) return false;
  return p.phone.replace(/\D/g, '').includes('9099730163');
});
if (anthonyMatch) {
  console.log(`${anthonyMatch.full_name || anthonyMatch.name} | email: ${anthonyMatch.email || 'NO EMAIL'} | phone: ${anthonyMatch.phone}`);
} else {
  console.log('No patient with phone 909-973-0163 found');
}
