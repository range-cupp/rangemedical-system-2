// GET /api/invoices/[id]
// Returns invoice detail (public-accessible for payment page)

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

  try {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('id, patient_name, patient_id, items, subtotal_cents, discount_cents, discount_description, total_cents, status, paid_at, expires_at, notes, created_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Get invoice error:', error);
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check if expired
    if (invoice.status !== 'paid' && invoice.expires_at && new Date(invoice.expires_at) < new Date()) {
      invoice.status = 'expired';
    }

    return res.status(200).json({ invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    return res.status(500).json({ error: error.message });
  }
}
