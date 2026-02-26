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

      const hasDiscount = invoice.discount_cents > 0;
      const subtotalCents = invoice.subtotal_cents || 0;

      // Parse discount type/amount from description (e.g., "20% off" or "$125 off")
      let discountType = null;
      let discountAmount = null;
      if (hasDiscount && invoice.discount_description) {
        const desc = invoice.discount_description;
        if (desc.includes('%')) {
          discountType = 'percent';
          discountAmount = parseFloat(desc);
        } else if (desc.includes('$')) {
          discountType = 'dollar';
          discountAmount = parseFloat(desc.replace('$', ''));
        }
      }

      for (const item of invoice.items) {
        const itemSubtotal = item.price_cents * (item.quantity || 1);

        // Prorate invoice discount across items
        let itemAmount = itemSubtotal;
        let itemOriginalAmount = null;
        if (hasDiscount && subtotalCents > 0) {
          const proportion = itemSubtotal / subtotalCents;
          const itemDiscount = Math.round(invoice.discount_cents * proportion);
          itemAmount = Math.max(itemSubtotal - itemDiscount, 0);
          itemOriginalAmount = itemSubtotal;
        }

        try {
          await fetch(`${baseUrl}/api/stripe/record-purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patient_id: invoice.patient_id,
              amount: itemAmount,
              description: item.name,
              service_category: item.category || null,
              service_name: item.name,
              stripe_payment_intent_id,
              payment_method: 'stripe_invoice',
              ...(hasDiscount && itemOriginalAmount ? {
                discount_type: discountType,
                discount_amount: discountAmount,
                original_amount: itemOriginalAmount,
              } : {}),
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
