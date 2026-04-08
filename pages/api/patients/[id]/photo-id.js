// pages/api/patients/[id]/photo-id.js
// Upload a photo ID for a patient outside of the intake flow.
// Accepts a base64-encoded file, uploads it to Supabase Storage, and persists
// the URL on the patient's most recent intake (or creates a stub intake if none exists).

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: { sizeLimit: '15mb' },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: patientId } = req.query;
  const { fileBase64, fileName, contentType } = req.body || {};

  if (!patientId || !fileBase64 || !fileName) {
    return res.status(400).json({ error: 'patientId, fileBase64, and fileName are required' });
  }

  try {
    // Strip data URL prefix if present
    const base64Content = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
    const buffer = Buffer.from(base64Content, 'base64');

    const ext = (fileName.split('.').pop() || 'jpg').toLowerCase();
    const safeExt = ['jpg', 'jpeg', 'png', 'pdf', 'webp', 'heic'].includes(ext) ? ext : 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const storagePath = `photo-ids/patient-${patientId}-${timestamp}-${randomStr}.${safeExt}`;

    const { error: uploadError } = await supabase.storage
      .from('medical-documents')
      .upload(storagePath, buffer, {
        contentType: contentType || 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Photo ID upload error:', uploadError);
      return res.status(500).json({ error: 'Upload failed', details: uploadError.message });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('medical-documents')
      .getPublicUrl(storagePath);

    // Find the patient's most recent intake; update it if found, otherwise create a stub.
    const { data: existingIntake } = await supabase
      .from('intakes')
      .select('id')
      .eq('patient_id', patientId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingIntake?.id) {
      const { error: updateError } = await supabase
        .from('intakes')
        .update({ photo_id_url: publicUrl })
        .eq('id', existingIntake.id);
      if (updateError) {
        console.error('Intake update error:', updateError);
        return res.status(500).json({ error: 'Failed to attach photo ID', details: updateError.message });
      }
    } else {
      // Create a stub intake to hold the photo ID
      const { data: patient } = await supabase
        .from('patients')
        .select('first_name, last_name')
        .eq('id', patientId)
        .maybeSingle();

      const { error: insertError } = await supabase
        .from('intakes')
        .insert({
          patient_id: patientId,
          first_name: patient?.first_name || '',
          last_name: patient?.last_name || '',
          photo_id_url: publicUrl,
          submitted_at: new Date().toISOString(),
        });
      if (insertError) {
        console.error('Intake insert error:', insertError);
        return res.status(500).json({ error: 'Failed to attach photo ID', details: insertError.message });
      }
    }

    return res.status(200).json({ success: true, photo_id_url: publicUrl });
  } catch (err) {
    console.error('Photo ID handler error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
