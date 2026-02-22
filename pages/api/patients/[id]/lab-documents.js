// /pages/api/patients/[id]/lab-documents.js
// Get all lab documents for a patient and generate signed URLs

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id: patientId } = req.query;

  if (!patientId) {
    return res.status(400).json({ error: 'Patient ID is required' });
  }

  if (req.method === 'GET') {
    try {
      // Get all documents for this patient
      const { data: documents, error } = await supabase
        .from('lab_documents')
        .select('*')
        .eq('patient_id', patientId)
        .order('collection_date', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error fetching documents:', error);
        return res.status(500).json({ error: 'Failed to fetch documents' });
      }

      // Generate signed URLs for each document (valid for 1 hour)
      const documentsWithUrls = await Promise.all(
        (documents || []).map(async (doc) => {
          const { data: signedUrl } = await supabase.storage
            .from('lab-documents')
            .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

          return {
            ...doc,
            url: signedUrl?.signedUrl || null,
          };
        })
      );

      return res.status(200).json({ documents: documentsWithUrls });

    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'DELETE') {
    const { documentId } = req.body || {};

    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    try {
      // Get the document to find file path
      const { data: doc, error: fetchError } = await supabase
        .from('lab_documents')
        .select('file_path')
        .eq('id', documentId)
        .eq('patient_id', patientId)
        .single();

      if (fetchError || !doc) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('lab-documents')
        .remove([doc.file_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('lab_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        return res.status(500).json({ error: 'Failed to delete document record' });
      }

      return res.status(200).json({ success: true });

    } catch (error) {
      console.error('Delete error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
