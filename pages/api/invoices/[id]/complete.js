// POST /api/invoices/[id]/complete
// Complete invoice after successful payment

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { stripe_payment_intent_id } = req.body;

  try {
    // Get invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(200).json({ invoice, message: 'Invoice already paid' });
    }

    // Update invoice to paid
    const { data: updated, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        stripe_payment_intent_id: stripe_payment_intent_id || null,
        paid_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Complete invoice error:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    // Record each item as a purchase via the existing record-purchase flow
    if (invoice.patient_id && invoice.items?.length > 0) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.rangemedical.com';

      for (const item of invoice.items) {
        try {
          await fetch(`${baseUrl}/api/stripe/record-purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patient_id: invoice.patient_id,
              amount: item.price_cents * (item.quantity || 1),
              description: item.name,
              service_category: item.category || null,
              service_name: item.name,
              stripe_payment_intent_id,
              payment_method: 'stripe_invoice',
            }),
          });
        } catch (err) {
          console.error(`Record purchase error for item ${item.name}:`, err);
        }
      }
    }

    return res.status(200).json({ invoice: updated });
  } catch (error) {
    console.error('Complete invoice error:', error);
    return res.status(500).json({ error: error.message });
  }
}
