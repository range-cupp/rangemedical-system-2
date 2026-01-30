// /pages/api/admin/lab-documents-analysis.js
// Analyze lab documents and their linking status

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all lab documents
    const { data: documents, error } = await supabase
      .from('lab_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch documents', details: error.message });
    }

    const total = documents?.length || 0;
    const linked = documents?.filter(d => d.patient_id)?.length || 0;
    const unlinked = total - linked;

    // Get sample of unlinked documents
    const unlinkedSamples = documents
      ?.filter(d => !d.patient_id)
      ?.slice(0, 20)
      ?.map(d => ({
        id: d.id,
        file_name: d.file_name,
        file_path: d.file_path,
        panel_type: d.panel_type,
        collection_date: d.collection_date,
        created_at: d.created_at
      }));

    // Get all unique field names from the documents
    const sampleDoc = documents?.[0];
    const fields = sampleDoc ? Object.keys(sampleDoc) : [];

    return res.status(200).json({
      summary: {
        total,
        linked,
        unlinked
      },
      fields,
      sample_document: sampleDoc,
      unlinked_samples: unlinkedSamples,
      all_documents: documents
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
