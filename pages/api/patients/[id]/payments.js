// /pages/api/patients/[id]/payments.js
// Per-patient invoices and purchases API
// Range Medical System V2

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
    // Fetch invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: false });

    // Fetch all purchases (not just pending)
    const { data: purchases } = await supabase
      .from('purchases')
      .select('*')
      .eq('patient_id', id)
      .order('purchase_date', { ascending: false });

    return res.status(200).json({
      invoices: invoices || [],
      purchases: purchases || []
    });

  } catch (error) {
    console.error('Payments API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
