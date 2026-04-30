// POST /api/invoices/[id]/mark-paid
// Admin-side mark invoice as paid (comp, cash, card-over-phone, etc.)
// Triggers the same purchase recording as patient self-pay

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
  const { payment_method, notes, skip_notification } = req.body;
  // payment_method: 'comp', 'cash', 'card', 'other'

  try {
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

    if (invoice.status === 'voided' || invoice.status === 'cancelled') {
      return res.status(400).json({ error: `Cannot pay a ${invoice.status} invoice` });
    }

    // Update invoice to paid
    const updateData = {
      status: 'paid',
      paid_at: new Date().toISOString(),
    };
    if (notes) {
      updateData.notes = invoice.notes
        ? `${invoice.notes}\n---\nMarked paid by admin: ${notes}`
        : `Marked paid by admin: ${notes}`;
    }

    const { data: updated, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Mark paid error:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    // Record each item as a purchase (same logic as complete.js)
    if (invoice.patient_id && invoice.total_cents > 0) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';
      const hasDiscount = invoice.discount_cents > 0;
      const subtotalCents = invoice.subtotal_cents || 0;

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

      // Fallback: if invoice has no line items, record the total as a single purchase
      // so the payment still shows up in the patient's purchases tab.
      const itemsToRecord = invoice.items?.length > 0
        ? invoice.items
        : [{ name: 'Invoice payment', category: null, price_cents: invoice.total_cents, quantity: 1 }];

      for (const item of itemsToRecord) {
        const itemSubtotal = item.price_cents * (item.quantity || 1);
        let itemAmount = itemSubtotal;
        let itemOriginalAmount = null;
        if (hasDiscount && subtotalCents > 0) {
          const proportion = itemSubtotal / subtotalCents;
          const itemDiscount = Math.round(invoice.discount_cents * proportion);
          itemAmount = Math.max(itemSubtotal - itemDiscount, 0);
          itemOriginalAmount = itemSubtotal;
        }

        // Use internal_name (with actual peptide) for protocol creation, not
        // the patient-facing display name. Pass through builder configs.
        const serviceName = item.internal_name || item.name;
        try {
          await fetch(`${baseUrl}/api/stripe/record-purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patient_id: invoice.patient_id,
              amount: itemAmount,
              description: item.name,
              service_category: item.category || null,
              service_name: serviceName,
              payment_method: payment_method === 'comp' ? 'comp' : payment_method === 'cash' ? 'cash' : 'admin_manual',
              skip_receipt: !!skip_notification,
              quantity: item.quantity || 1,
              delivery_method: item.delivery_method || null,
              duration_days: item.duration_days || null,
              peptide_config: item.peptide_config || null,
              wl_config: item.wl_config || null,
              hrt_config: item.hrt_config || null,
              injection_frequency: item.inj_config?.frequency || null,
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

    return res.status(200).json({
      invoice: updated,
      message: `Invoice marked as paid (${payment_method || 'manual'})`,
    });
  } catch (error) {
    console.error('Mark paid error:', error);
    return res.status(500).json({ error: error.message });
  }
}
