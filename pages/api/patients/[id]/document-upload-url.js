// Generate a signed upload URL so the browser can upload files directly to
// Supabase Storage, bypassing the Vercel serverless body-size limit.
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: patientId } = req.query;
  if (!patientId) {
    return res.status(400).json({ error: 'Patient ID is required' });
  }

  try {
    const { fileName, fileType } = req.body || {};

    if (!fileName) {
      return res.status(400).json({ error: 'File name is required' });
    }

    const contentType = fileType || 'application/pdf';
    if (!ALLOWED_TYPES.has(contentType)) {
      return res.status(400).json({ error: 'File type not supported. Use PDF, JPG, or PNG.' });
    }

    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${patientId}/${timestamp}-${safeName}`;

    const { data, error } = await supabase.storage
      .from('patient-documents')
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error('Signed upload URL error:', error);
      return res.status(500).json({ error: 'Failed to create upload URL', details: error.message });
    }

    return res.status(200).json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      filePath,
    });
  } catch (error) {
    console.error('Upload URL error:', error);
    return res.status(500).json({ error: 'Upload URL failed', details: error.message });
  }
}
