#!/usr/bin/env node
// Timothy Keating uploaded an iPhone HEIC photo saved as .jpg — browsers can't
// render HEIC. This converts the stored HEIC (already converted locally via
// `sips` to /tmp/keaton-small.jpg) and re-uploads it, updating the intake row.
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

const patientId = 'cc6d8d0d-7939-4aa4-913e-4de8c2d3794b';
const intakeId  = '6b200afd-84c4-452b-965f-c1228457b4de';
const oldPath   = 'photo-ids/patient-cc6d8d0d-7939-4aa4-913e-4de8c2d3794b-1776797022467-q4s0ls.jpg';

const jpegBuffer = readFileSync('/tmp/keaton-small.jpg');
const newPath = `photo-ids/patient-${patientId}-${Date.now()}-fixed.jpg`;

const { error: upErr } = await supabase.storage
  .from('medical-documents')
  .upload(newPath, jpegBuffer, { contentType: 'image/jpeg', upsert: false });

if (upErr) { console.error('Upload failed:', upErr); process.exit(1); }

const { data: { publicUrl } } = supabase.storage
  .from('medical-documents')
  .getPublicUrl(newPath);

const { error: updErr } = await supabase
  .from('intakes')
  .update({ photo_id_url: publicUrl })
  .eq('id', intakeId);

if (updErr) { console.error('Intake update failed:', updErr); process.exit(1); }

// Remove the bad HEIC file
await supabase.storage.from('medical-documents').remove([oldPath]);

console.log('Done. New URL:', publicUrl);
