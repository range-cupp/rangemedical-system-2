// Finalize a document upload: the file has already been uploaded directly to
// Supabase Storage by the browser (via signed upload URL). This endpoint just
// creates the DB record and generates a signed view URL.
import { createClient } from '@supabase/supabase-js';

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
    const {
      filePath,
      fileName,
      fileSize,
      documentName,
      documentType,
      notes,
      uploaded_by,
    } = req.body || {};

    if (!filePath || !fileName) {
      return res.status(400).json({ error: 'filePath and fileName are required' });
    }

    // Confirm the file actually landed in storage before creating the DB row.
    const segments = filePath.split('/');
    const objectName = segments.pop();
    const folder = segments.join('/');
    const { data: listData, error: listError } = await supabase.storage
      .from('patient-documents')
      .list(folder, { search: objectName });

    if (listError) {
      console.error('Storage list error:', listError);
      return res.status(500).json({ error: 'Failed to verify upload', details: listError.message });
    }

    const found = (listData || []).find((f) => f.name === objectName);
    if (!found) {
      return res.status(400).json({ error: 'File not found in storage — upload may have failed' });
    }

    const resolvedSize = typeof fileSize === 'number' && fileSize > 0
      ? fileSize
      : found.metadata?.size || 0;

    // Generate signed URL for viewing
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
        file_size: resolvedSize,
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
