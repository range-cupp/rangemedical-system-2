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
    const ghlContactId = patient.ghl_contact_id;

    // Fetch all related data in parallel
    const [protocolsRes, intakesRes, consentsRes, purchasesRes] = await Promise.all([
      // Protocols - by patient_id OR ghl_contact_id
      supabase
        .from('protocols')
        .select('*')
        .or(`patient_id.eq.${patientId},ghl_contact_id.eq.${ghlContactId}`)
        .order('created_at', { ascending: false }),
      
      // Intakes - by patient_id
      supabase
        .from('intakes')
        .select('*')
        .eq('patient_id', patientId)
        .order('submitted_at', { ascending: false }),
      
      // Consents - by patient_id
      supabase
        .from('consents')
        .select('*')
        .eq('patient_id', patientId)
        .order('submitted_at', { ascending: false }),
      
      // Purchases - by ghl_contact_id (this table uses ghl_contact_id, not patient_id)
      ghlContactId ? supabase
        .from('purchases')
        .select('*')
        .eq('ghl_contact_id', ghlContactId)
        .order('purchase_date', { ascending: false }) : { data: [] }
    ]);

    return res.status(200).json({
      ...patient,
      protocols: protocolsRes.data || [],
      intakes: intakesRes.data || [],
      consents: consentsRes.data || [],
      purchases: purchasesRes.data || []
    });

  } catch (error) {
    console.error('Patient API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
