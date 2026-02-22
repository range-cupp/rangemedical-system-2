// /pages/api/patients/[id]/upload-lab.js
// Upload lab PDF for a patient - No external dependencies version

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: patientId } = req.query;

  if (!patientId) {
    return res.status(400).json({ error: 'Patient ID is required' });
  }

  try {
    const { fileData, fileName, labType, panelType, collectionDate, notes } = req.body;

    if (!fileData || !fileName) {
      return res.status(400).json({ error: 'File data and name are required' });
    }

    // Convert base64 to buffer
    const base64Data = fileData.replace(/^data:application\/pdf;base64,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${patientId}/${timestamp}-${safeName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('lab-documents')
      .upload(filePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file', details: uploadError.message });
    }

    // Create database record
    const { data: docRecord, error: dbError } = await supabase
      .from('lab_documents')
      .insert({
        patient_id: patientId,
        file_name: fileName,
        file_path: filePath,
        file_size: fileBuffer.length,
        lab_type: labType || 'Baseline',
        panel_type: panelType || null,
        collection_date: collectionDate || null,
        notes: notes || null,
        uploaded_by: 'staff',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Try to clean up uploaded file
      await supabase.storage.from('lab-documents').remove([filePath]);
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
