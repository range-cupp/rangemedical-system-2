// lib/short-link.js
// Helpers for creating and resolving short URLs via the short_links table.
// Range Medical

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateCode(length = 8) {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

// Match Supabase signed URLs:
//   https://<project>.supabase.co/storage/v1/object/sign/<bucket>/<path>?token=...
// Returns { bucket, path } or null.
export function parseSupabaseSignedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/storage\/v1\/object\/sign\/([^/]+)\/([^?]+)/);
  if (!match) return null;
  try {
    return { bucket: match[1], path: decodeURIComponent(match[2]) };
  } catch {
    return null;
  }
}

// Match Supabase public URLs:
//   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
// Returns { bucket, path } or null.
export function parseSupabasePublicUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!match) return null;
  try {
    return { bucket: match[1], path: decodeURIComponent(match[2]) };
  } catch {
    return null;
  }
}

// Create a short link record. Returns { code, error }.
// Pass either { storageBucket, storagePath } for refreshable storage objects,
// or { targetUrl } for plain URLs.
export async function createShortLink({
  storageBucket = null,
  storagePath = null,
  targetUrl = null,
  description = null,
  patientId = null,
  createdBy = null,
  expiresInDays = 90,
} = {}) {
  if (!storageBucket && !targetUrl) {
    return { code: null, error: 'Must provide storageBucket+storagePath or targetUrl' };
  }
  if (storageBucket && !storagePath) {
    return { code: null, error: 'storagePath required when storageBucket is set' };
  }

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  // Generate a unique code, retrying on collision (extremely rare with 8 chars).
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode(8);
    const { error } = await supabase
      .from('short_links')
      .insert({
        code,
        storage_bucket: storageBucket,
        storage_path: storagePath,
        target_url: targetUrl,
        description,
        patient_id: patientId,
        created_by: createdBy,
        expires_at: expiresAt,
      });

    if (!error) return { code, error: null };

    // 23505 = unique violation; retry with a new code.
    if (error.code !== '23505') {
      return { code: null, error: error.message };
    }
  }

  return { code: null, error: 'Failed to generate unique short code after 5 attempts' };
}

// Build the public short URL for a given code.
export function buildShortUrl(code, baseUrl) {
  const base = baseUrl
    || process.env.NEXT_PUBLIC_APP_URL
    || process.env.NEXT_PUBLIC_BASE_URL
    || 'https://app.range-medical.com';
  return `${base.replace(/\/$/, '')}/api/r/${code}`;
}

// Convenience: if `url` is a Supabase signed URL, register a short link
// pointing at the same bucket+path and return the short URL. Otherwise return
// the original URL unchanged.
export async function shortenIfSupabaseUrl(url, opts = {}) {
  const signed = parseSupabaseSignedUrl(url);
  if (signed) {
    const { code, error } = await createShortLink({
      storageBucket: signed.bucket,
      storagePath: signed.path,
      ...opts,
    });
    if (code) return buildShortUrl(code, opts.baseUrl);
    console.error('shortenIfSupabaseUrl error:', error);
    return url;
  }

  // Public URLs are shorter but still benefit from a short code (and let us
  // track clicks). Skip if it's already very short.
  if (url && url.length > 200) {
    const pub = parseSupabasePublicUrl(url);
    if (pub) {
      const { code, error } = await createShortLink({
        storageBucket: pub.bucket,
        storagePath: pub.path,
        ...opts,
      });
      if (code) return buildShortUrl(code, opts.baseUrl);
      console.error('shortenIfSupabaseUrl (public) error:', error);
    }
  }

  return url;
}
