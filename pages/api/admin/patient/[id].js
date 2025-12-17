import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Patient ID required' });
  }

  try {
    let patient = null;

    // Try by UUID first
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (isUUID) {
      const { data } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      if (data) patient = data;
    }

    // Try by ghl_contact_id
    if (!patient) {
      const { data } = await supabase
        .from('patients')
        .select('*')
        .eq('ghl_contact_id', id)
        .single();
      if (data) patient = data;
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientId = patient.id;

    // Fetch all related data
    const [protocols, purchases, intakes, consents] = await Promise.all([
      supabase.from('protocols').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
      supabase.from('purchases').select('*').eq('patient_id', patientId).order('purchase_date', { ascending: false }),
      supabase.from('intakes').select('*').eq('patient_id', patientId).order('submitted_at', { ascending: false }),
      supabase.from('consents').select('*').eq('patient_id', patientId).order('submitted_at', { ascending: false })
    ]);

    return res.status(200).json({
      ...patient,
      protocols: protocols.data || [],
      purchases: purchases.data || [],
      intakes: intakes.data || [],
      consents: consents.data || []
    });

  } catch (error) {
    console.error('Patient API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
