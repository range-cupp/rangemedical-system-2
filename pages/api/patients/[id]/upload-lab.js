// /pages/api/patients/[id]/upload-lab.js
// Upload lab PDF for a patient

import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // Disable body parser for file uploads
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
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
    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      filter: ({ mimetype }) => mimetype === 'application/pdf',
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = files.file?.[0] || files.file;
    if (!file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Read the file
    const fileBuffer = fs.readFileSync(file.filepath);
    
    // Generate unique filename
    const timestamp = Date.now();
    const safeName = file.originalFilename?.replace(/[^a-zA-Z0-9.-]/g, '_') || 'lab-results.pdf';
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

    // Get field values (handle both array and string formats from formidable)
    const panelType = Array.isArray(fields.panelType) ? fields.panelType[0] : fields.panelType;
    const collectionDate = Array.isArray(fields.collectionDate) ? fields.collectionDate[0] : fields.collectionDate;
    const notes = Array.isArray(fields.notes) ? fields.notes[0] : fields.notes;

    // Create database record
    const { data: docRecord, error: dbError } = await supabase
      .from('lab_documents')
      .insert({
        patient_id: patientId,
        file_name: file.originalFilename || safeName,
        file_path: filePath,
        file_size: file.size,
        panel_type: panelType || null,
        collection_date: collectionDate || null,
        notes: notes || null,
        uploaded_by: 'staff', // Could be enhanced with actual user info
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Try to clean up uploaded file
      await supabase.storage.from('lab-documents').remove([filePath]);
      return res.status(500).json({ error: 'Failed to save document record', details: dbError.message });
    }

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      success: true,
      document: docRecord,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed', details: error.message });
  }
}
