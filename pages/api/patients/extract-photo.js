// /pages/api/patients/extract-photo.js
// Uses Claude Vision to locate a face in a photo ID, crops it with sharp,
// uploads the cropped headshot to Supabase storage, and saves the URL on the patient.

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_id, photo_id_url } = req.body;

  if (!patient_id || !photo_id_url) {
    return res.status(400).json({ error: 'patient_id and photo_id_url are required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    // 1. Fetch the photo ID image
    const imageResponse = await fetch(photo_id_url);
    if (!imageResponse.ok) {
      return res.status(400).json({ error: 'Failed to fetch photo ID image' });
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Get image dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;

    // 2. Convert to base64 for Claude Vision
    // Resize if very large to stay within limits
    let processedBuffer = imageBuffer;
    let processedWidth = width;
    let processedHeight = height;

    if (width > 2000 || height > 2000) {
      const resized = await sharp(imageBuffer)
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      const resizedMeta = await sharp(resized).metadata();
      processedBuffer = resized;
      processedWidth = resizedMeta.width;
      processedHeight = resizedMeta.height;
    }

    const base64Image = processedBuffer.toString('base64');
    const mediaType = photo_id_url.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    // 3. Ask Claude Vision to find the face bounding box
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const visionResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `This is a photo ID (driver's license, passport, or similar). Locate the person's face/headshot photo on the ID.

Return ONLY a JSON object with the bounding box of the face photo as pixel coordinates relative to the full image dimensions (${processedWidth}x${processedHeight}):

{"x": <left edge>, "y": <top edge>, "w": <width>, "h": <height>}

Make the box slightly larger than the face to include some padding (forehead to chin plus ~20% margin on each side). Return ONLY the JSON, no other text.`,
            },
          ],
        },
      ],
    });

    const responseText = visionResponse.content[0].text.trim();

    // Parse the bounding box — handle markdown code blocks
    let bbox;
    try {
      const jsonStr = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      bbox = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('Failed to parse bbox:', responseText);
      return res.status(500).json({ error: 'Failed to identify face location', raw: responseText });
    }

    // Validate bounding box
    if (!bbox.x && bbox.x !== 0 || !bbox.y && bbox.y !== 0 || !bbox.w || !bbox.h) {
      return res.status(500).json({ error: 'Invalid bounding box from AI', bbox });
    }

    // Clamp values to image boundaries
    const cropX = Math.max(0, Math.round(bbox.x));
    const cropY = Math.max(0, Math.round(bbox.y));
    const cropW = Math.min(Math.round(bbox.w), processedWidth - cropX);
    const cropH = Math.min(Math.round(bbox.h), processedHeight - cropY);

    if (cropW < 20 || cropH < 20) {
      return res.status(500).json({ error: 'Detected face region too small', bbox: { x: cropX, y: cropY, w: cropW, h: cropH } });
    }

    // 4. Crop the face and create a clean square headshot
    const croppedBuffer = await sharp(processedBuffer)
      .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
      .resize(300, 300, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 90 })
      .toBuffer();

    // 5. Upload to Supabase storage
    const fileName = `profile-photos/${patient_id}.jpg`;

    // Delete existing if any
    await supabase.storage.from('medical-documents').remove([fileName]);

    const { error: uploadError } = await supabase.storage
      .from('medical-documents')
      .upload(fileName, croppedBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload cropped photo', detail: uploadError.message });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('medical-documents')
      .getPublicUrl(fileName);

    // Add cache buster so browser picks up new photo
    const photoUrl = `${publicUrl}?v=${Date.now()}`;

    // 6. Save URL to patient record
    const { error: updateError } = await supabase
      .from('patients')
      .update({ profile_photo_url: photoUrl })
      .eq('id', patient_id);

    if (updateError) {
      console.error('Patient update error:', updateError);
      return res.status(500).json({ error: 'Photo saved but failed to update patient record', photoUrl });
    }

    return res.status(200).json({
      success: true,
      profile_photo_url: photoUrl,
      bbox: { x: cropX, y: cropY, w: cropW, h: cropH },
    });
  } catch (error) {
    console.error('Extract photo error:', error);
    return res.status(500).json({ error: 'Failed to extract photo', detail: error.message });
  }
}
