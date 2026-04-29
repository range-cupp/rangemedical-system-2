#!/usr/bin/env node
// Extract a cropped face headshot from a patient's photo ID and save to patients.profile_photo_url.
// Usage:
//   node scripts/extract-profile-photo.mjs <patient_id>          # single patient
//   node scripts/extract-profile-photo.mjs --all                 # backfill all patients with photo_id_url but no profile_photo_url
//   node scripts/extract-profile-photo.mjs --all --limit 10      # backfill first 10
//   node scripts/extract-profile-photo.mjs --all --concurrency 3 # parallelism (default 2)
//
// Reads .env.local for SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY.

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import heicConvert from 'heic-convert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// HEIF/HEIC files start with `ftyp` at byte 4, with brands: heic, heix, hevc, mif1, msf1, etc.
function isHeic(buf) {
  if (buf.length < 12) return false;
  if (buf.slice(4, 8).toString('ascii') !== 'ftyp') return false;
  const brand = buf.slice(8, 12).toString('ascii').toLowerCase();
  return ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'].includes(brand);
}

async function ensureJpeg(buf) {
  if (isHeic(buf)) {
    const out = await heicConvert({ buffer: buf, format: 'JPEG', quality: 0.9 });
    return Buffer.from(out);
  }
  return buf;
}

// Load .env.local manually
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
  for (const line of envFile.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[m[1]]) process.env[m[1]] = v;
    }
  }
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

async function extractForPatient(patientId, photoIdUrl) {
  // 1. Fetch image
  const imageResponse = await fetch(photoIdUrl);
  if (!imageResponse.ok) throw new Error(`Failed to fetch photo (${imageResponse.status})`);
  let imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

  const lower = photoIdUrl.toLowerCase();
  if (lower.endsWith('.pdf')) {
    throw new Error('PDF photo IDs not supported');
  }

  // Convert HEIC to JPEG if needed (detected by magic bytes — extension can lie)
  imageBuffer = await ensureJpeg(imageBuffer);

  let metadata;
  try {
    metadata = await sharp(imageBuffer).metadata();
  } catch (err) {
    throw new Error(`Sharp could not read image: ${err.message}`);
  }
  let { width, height } = metadata;

  // Resize if very large
  if (width > 2000 || height > 2000) {
    imageBuffer = await sharp(imageBuffer)
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    const m = await sharp(imageBuffer).metadata();
    width = m.width;
    height = m.height;
  }

  const base64Image = imageBuffer.toString('base64');
  // After ensureJpeg() the buffer is always JPEG (HEIC was converted, others passed through).
  // Only declare PNG when the original file was actually PNG — extension is the only signal we have.
  const mediaType = lower.endsWith('.png') ? 'image/png' : 'image/jpeg';

  // 2. Ask Claude Vision to find face bbox
  const visionResponse = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
        { type: 'text', text: `This is a photo ID (driver's license, passport, or similar). Locate the person's face/headshot photo on the ID.

Return ONLY a JSON object with the bounding box of the face photo as pixel coordinates relative to the full image dimensions (${width}x${height}):

{"x": <left edge>, "y": <top edge>, "w": <width>, "h": <height>}

Make the box slightly larger than the face to include some padding (forehead to chin plus ~20% margin on each side). Return ONLY the JSON, no other text.` }
      ]
    }]
  });

  const responseText = visionResponse.content[0].text.trim();
  const jsonStr = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  const bbox = JSON.parse(jsonStr);

  if ((bbox.x === undefined && bbox.x !== 0) || (bbox.y === undefined && bbox.y !== 0) || !bbox.w || !bbox.h) {
    throw new Error(`Invalid bbox: ${JSON.stringify(bbox)}`);
  }

  const cropX = Math.max(0, Math.round(bbox.x));
  const cropY = Math.max(0, Math.round(bbox.y));
  const cropW = Math.min(Math.round(bbox.w), width - cropX);
  const cropH = Math.min(Math.round(bbox.h), height - cropY);

  if (cropW < 20 || cropH < 20) throw new Error(`Detected face region too small: ${cropW}x${cropH}`);

  // 3. Crop & resize to 300x300 headshot
  const croppedBuffer = await sharp(imageBuffer)
    .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
    .resize(300, 300, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 90 })
    .toBuffer();

  // 4. Upload to storage
  const fileName = `profile-photos/${patientId}.jpg`;
  await supabase.storage.from('medical-documents').remove([fileName]);
  const { error: uploadError } = await supabase.storage
    .from('medical-documents')
    .upload(fileName, croppedBuffer, { contentType: 'image/jpeg', cacheControl: '3600', upsert: true });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data: { publicUrl } } = supabase.storage.from('medical-documents').getPublicUrl(fileName);
  const photoUrl = `${publicUrl}?v=${Date.now()}`;

  // 5. Save to patient
  const { error: updateError } = await supabase
    .from('patients')
    .update({ profile_photo_url: photoUrl })
    .eq('id', patientId);
  if (updateError) throw new Error(`DB update failed: ${updateError.message}`);

  return photoUrl;
}

function isRateLimit(err) {
  const m = err?.message || '';
  return m.includes('429') || m.toLowerCase().includes('rate_limit');
}

async function processOne(p, { maxRetries = 4 } = {}) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const url = await extractForPatient(p.id, p.photo_id_url);
      console.log(`✓ ${p.name || p.id} → ${url.split('?')[0].split('/').pop()}`);
      return { ok: true };
    } catch (err) {
      if (isRateLimit(err) && attempt < maxRetries) {
        const wait = Math.min(60000, 5000 * Math.pow(2, attempt)); // 5s, 10s, 20s, 40s, 60s
        console.log(`… ${p.name || p.id}: rate-limited, sleeping ${wait}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      console.log(`✗ ${p.name || p.id}: ${err.message.slice(0, 200)}`);
      return { ok: false, err: err.message };
    }
  }
  return { ok: false, err: 'exhausted retries' };
}

async function main() {
  const args = process.argv.slice(2);
  const isAll = args.includes('--all');
  const limitArg = args.indexOf('--limit');
  const limit = limitArg >= 0 ? parseInt(args[limitArg + 1], 10) : null;
  const concArg = args.indexOf('--concurrency');
  const concurrency = concArg >= 0 ? parseInt(args[concArg + 1], 10) : 1;
  const delayArg = args.indexOf('--delay');
  const interRequestDelay = delayArg >= 0 ? parseInt(args[delayArg + 1], 10) : 1500;

  if (isAll) {
    // Pull all patients needing extraction (have photo_id_url, missing profile_photo_url)
    const { data, error } = await supabase.rpc('list_patients_needing_profile_photo').select?.() ?? { data: null, error: null };
    let patients = data;
    if (!patients) {
      // Fallback: query directly
      const { data: pd, error: pe } = await supabase
        .from('patients')
        .select('id, name, intakes!inner(photo_id_url)')
        .is('profile_photo_url', null)
        .not('intakes.photo_id_url', 'is', null)
        .limit(limit || 1000);
      if (pe) throw pe;
      patients = (pd || []).map(p => ({
        id: p.id,
        name: p.name,
        photo_id_url: (p.intakes || []).find(i => i.photo_id_url)?.photo_id_url
      })).filter(p => p.photo_id_url);
    }

    if (limit) patients = patients.slice(0, limit);
    console.log(`Processing ${patients.length} patients with concurrency ${concurrency}...\n`);

    let i = 0;
    let ok = 0, fail = 0;
    async function worker() {
      while (true) {
        const idx = i++;
        if (idx >= patients.length) return;
        const r = await processOne(patients[idx]);
        if (r.ok) ok++; else fail++;
        if (interRequestDelay > 0) await new Promise(r => setTimeout(r, interRequestDelay));
      }
    }
    await Promise.all(Array.from({ length: concurrency }, worker));
    console.log(`\nDone: ${ok} succeeded, ${fail} failed`);
  } else {
    const patientId = args[0];
    if (!patientId) {
      console.error('Usage: node scripts/extract-profile-photo.mjs <patient_id> | --all');
      process.exit(1);
    }
    const { data: p, error: pe } = await supabase
      .from('patients').select('id, name').eq('id', patientId).single();
    if (pe || !p) { console.error('Patient not found'); process.exit(1); }
    const { data: intakes } = await supabase
      .from('intakes').select('photo_id_url, submitted_at')
      .eq('patient_id', patientId).not('photo_id_url', 'is', null)
      .order('submitted_at', { ascending: false });
    const photoIdUrl = intakes?.[0]?.photo_id_url;
    if (!photoIdUrl) { console.error(`${p.name} has no photo_id_url`); process.exit(1); }
    await processOne({ ...p, photo_id_url: photoIdUrl });
  }
}

main().catch(err => { console.error(err); process.exit(1); });
