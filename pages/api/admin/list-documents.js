// /pages/api/admin/list-documents.js
// Quick endpoint to list intakes and consents with patient links
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    // Get recent intakes
    const { data: intakes } = await supabase
      .from('intakes')
      .select('id, patient_id, ghl_contact_id, first_name, last_name, email, submitted_at, pdf_url')
      .order('submitted_at', { ascending: false })
      .limit(20);

    // Get recent consents
    const { data: consents } = await supabase
      .from('consents')
      .select('id, patient_id, ghl_contact_id, consent_type, first_name, last_name, email, submitted_at, pdf_url, consent_given')
      .order('submitted_at', { ascending: false })
      .limit(20);

    // Find patients with documents
    const patientIds = new Set();
    (intakes || []).forEach(i => { if (i.patient_id) patientIds.add(i.patient_id); });
    (consents || []).forEach(c => { if (c.patient_id) patientIds.add(c.patient_id); });

    return res.status(200).json({
      intakes: {
        count: intakes?.length || 0,
        items: intakes || []
      },
      consents: {
        count: consents?.length || 0,
        items: consents || []
      },
      patients_with_documents: Array.from(patientIds)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
