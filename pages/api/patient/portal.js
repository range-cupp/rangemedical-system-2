// /pages/api/patient/portal.js
// Patient Portal API - Returns complete patient history
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    // First, find the protocol with this token to get ghl_contact_id
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('ghl_contact_id, patient_name')
      .eq('access_token', token)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ error: 'Invalid access token' });
    }

    const ghlContactId = protocol.ghl_contact_id;

    // Get patient info
    const { data: patient } = await supabase
      .from('patients')
      .select('id, first_name, last_name, email, phone, ghl_contact_id')
      .eq('ghl_contact_id', ghlContactId)
      .maybeSingle();

    // Get all protocols for this patient
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select('*')
      .eq('ghl_contact_id', ghlContactId)
      .order('created_at', { ascending: false });

    if (protocolsError) {
      console.error('Error fetching protocols:', protocolsError);
    }

    // Get all purchases for this patient
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('ghl_contact_id', ghlContactId)
      .order('purchase_date', { ascending: false });

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
    }

    // Build response
    const response = {
      patient: patient || {
        first_name: protocol.patient_name?.split(' ')[0] || 'Patient',
        last_name: protocol.patient_name?.split(' ').slice(1).join(' ') || '',
        ghl_contact_id: ghlContactId
      },
      protocols: protocols || [],
      purchases: purchases || [],
      summary: {
        total_protocols: protocols?.length || 0,
        active_protocols: protocols?.filter(p => p.status === 'active').length || 0,
        completed_protocols: protocols?.filter(p => p.status === 'completed').length || 0,
        total_purchases: purchases?.length || 0,
        total_spent: purchases?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Portal API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
