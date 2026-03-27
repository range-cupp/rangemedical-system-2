// /pages/api/app/upload-image.js
// Upload an image to Supabase Storage for sending via SMS/iMessage
// Returns public URL for the uploaded image
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: { bodyParser: false },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'message-attachments';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm({
      maxFileSize: MAX_SIZE,
      keepExtensions: true,
    });

    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const file = files.image?.[0] || files.image;
    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const mimetype = file.mimetype || file.type;
    if (!ALLOWED_TYPES.includes(mimetype)) {
      return res.status(400).json({ error: `Unsupported file type: ${mimetype}` });
    }

    // Read file buffer
    const buffer = fs.readFileSync(file.filepath || file.path);
    const ext = path.extname(file.originalFilename || file.newFilename || 'image.jpg') || '.jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const storagePath = `attachments/${filename}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload image' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    return res.status(200).json({
      success: true,
      url: urlData.publicUrl,
      filename,
    });
  } catch (err) {
    console.error('Upload image error:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
}
