// /pages/api/admin/patient/[id].js
// Patient Profile API
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'range2024admin';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check authorization
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Patient ID is required' });
  }

  try {
    // Fetch protocols for this patient
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select('*')
      .eq('ghl_contact_id', id)
      .order('start_date', { ascending: false });

    if (protocolsError) {
      console.error('Protocols fetch error:', protocolsError);
    }

    // Fetch purchases for this patient
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('ghl_contact_id', id)
      .order('purchase_date', { ascending: false });

    if (purchasesError) {
      console.error('Purchases fetch error:', purchasesError);
    }

    // Fetch questionnaire responses for this patient
    const { data: questionnaires, error: questionnaireError } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('ghl_contact_id', id)
      .order('created_at', { ascending: false });

    if (questionnaireError) {
      console.error('Questionnaire fetch error:', questionnaireError);
    }

    // Build patient info from the most recent protocol or purchase
    let patient = null;
    
    if (protocols && protocols.length > 0) {
      const p = protocols[0];
      patient = {
        id: id,
        name: p.patient_name,
        email: p.patient_email,
        phone: p.patient_phone
      };
    } else if (purchases && purchases.length > 0) {
      const p = purchases[0];
      patient = {
        id: id,
        name: p.patient_name,
        email: p.patient_email,
        phone: p.patient_phone
      };
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    return res.status(200).json({
      patient,
      protocols: protocols || [],
      purchases: purchases || [],
      questionnaires: questionnaires || []
    });

  } catch (error) {
    console.error('Patient API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
