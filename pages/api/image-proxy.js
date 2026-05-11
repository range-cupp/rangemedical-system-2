// /pages/api/image-proxy.js
// Converts non-browser-friendly images (HEIC, TIFF, etc.) to JPEG
// Used by the slideout viewer to display HEIC photo IDs

import sharp from 'sharp';
import heicConvert from 'heic-convert';

function isHeic(buf) {
  if (buf.length < 12) return false;
  if (buf.slice(4, 8).toString('ascii') !== 'ftyp') return false;
  const brand = buf.slice(8, 12).toString('ascii').toLowerCase();
  return ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'].includes(brand);
}

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url parameter required' });

  // Only proxy Supabase storage URLs
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url.startsWith(supabaseUrl)) {
    return res.status(403).json({ error: 'Only Supabase storage URLs allowed' });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).json({ error: 'Failed to fetch image' });

    let buffer = Buffer.from(await response.arrayBuffer());

    if (isHeic(buffer)) {
      const out = await heicConvert({ buffer, format: 'JPEG', quality: 0.9 });
      buffer = Buffer.from(out);
    }

    const jpegBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(jpegBuffer);
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({ error: 'Failed to convert image' });
  }
}
