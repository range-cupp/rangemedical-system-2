// /pages/api/image-proxy.js
// Converts non-browser-friendly images (HEIC, TIFF, etc.) to JPEG
// Used by the slideout viewer to display HEIC photo IDs

import sharp from 'sharp';

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

    const buffer = Buffer.from(await response.arrayBuffer());
    const jpegBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(jpegBuffer);
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({ error: 'Failed to convert image' });
  }
}
