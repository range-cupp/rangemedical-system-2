// Upload document (PDF, JPG, PNG) for a patient profile
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: patientId } = req.query;

  if (!patientId) {
    return res.status(400).json({ error: 'Patient ID is required' });
  }

  try {
    const { fileData, fileName, fileType, documentName, documentType, notes, uploaded_by } = req.body;

    if (!fileData || !fileName) {
      return res.status(400).json({ error: 'File data and name are required' });
    }

    // Validate file type
    const contentType = fileType || 'application/pdf';
    if (!ALLOWED_TYPES[contentType]) {
      return res.status(400).json({ error: 'File type not supported. Use PDF, JPG, or PNG.' });
    }

    // Strip base64 prefix
    const base64Prefix = /^data:[^;]+;base64,/;
    const base64Data = fileData.replace(base64Prefix, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${patientId}/${timestamp}-${safeName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('patient-documents')
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file', details: uploadError.message });
    }

    // Generate signed URL
    const { data: urlData } = await supabase.storage
      .from('patient-documents')
      .createSignedUrl(filePath, 60 * 60); // 1 hour

    // Create database record
    const { data: docRecord, error: dbError } = await supabase
      .from('medical_documents')
      .insert({
        patient_id: patientId,
        document_name: documentName || fileName,
        document_url: urlData?.signedUrl || null,
        document_type: documentType || 'General',
        file_path: filePath,
        file_size: fileBuffer.length,
        notes: notes || null,
        uploaded_by: uploaded_by || 'Staff',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      await supabase.storage.from('patient-documents').remove([filePath]);
      return res.status(500).json({ error: 'Failed to save document record', details: dbError.message });
    }

    return res.status(200).json({
      success: true,
      document: docRecord,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed', details: error.message });
  }
}
