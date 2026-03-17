// /pages/api/admin/patient-lab-info.js
// Returns the most recent lab_id and signed PDF URL for a patient.
// Used by the tasks page to wire up "View Lab Results" and "View PDF" buttons.

import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const employee = await requireAuth(req, res);
  if (!employee) return;

  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const { patient_id } = req.query;
  if (!patient_id) return res.status(400).json({ error: 'patient_id required' });

  try {
    // Latest lab record
    const { data: lab } = await supabase
      .from('labs')
      .select('id, test_date, lab_provider')
      .eq('patient_id', patient_id)
      .order('test_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Latest lab document (PDF)
    const { data: doc } = await supabase
      .from('lab_documents')
      .select('id, file_path, file_name, collection_date')
      .eq('patient_id', patient_id)
      .order('collection_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Generate signed URL for PDF (1 hour)
    let pdfUrl = null;
    if (doc?.file_path) {
      const { data: signed } = await supabase.storage
        .from('lab-documents')
        .createSignedUrl(doc.file_path, 3600);
      pdfUrl = signed?.signedUrl || null;
    }

    return res.status(200).json({
      success: true,
      labId: lab?.id || null,
      testDate: lab?.test_date || null,
      pdfUrl,
      pdfFileName: doc?.file_name || null,
    });

  } catch (err) {
    console.error('patient-lab-info error:', err);
    return res.status(500).json({ error: err.message });
  }
}
