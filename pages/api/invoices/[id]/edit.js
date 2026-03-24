// PUT /api/invoices/[id]/edit
// Edit an existing invoice (only pending or sent invoices)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const {
    patient_name,
    patient_email,
    patient_phone,
    items,
    subtotal_cents,
    discount_cents,
    discount_description,
    total_cents,
    notes,
  } = req.body;

  try {
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status !== 'pending' && invoice.status !== 'sent') {
      return res.status(400).json({ error: `Cannot edit a ${invoice.status} invoice` });
    }

    const updateData = {};
    if (patient_name !== undefined) updateData.patient_name = patient_name;
    if (patient_email !== undefined) updateData.patient_email = patient_email;
    if (patient_phone !== undefined) updateData.patient_phone = patient_phone;
    if (items !== undefined) {
      // Generate PHI-safe display names for patient-facing invoices
      updateData.items = items.map(item => {
        const cat = (item.category || '').toLowerCase();
        let display_name = null;
        if (cat === 'weight_loss') {
          display_name = 'Weight Loss Program';
        } else if (cat === 'peptide' || cat === 'vials') {
          const isRecovery = /bpc|tb[-\s]?500|thymosin|kpv|mgf/i.test(item.name || '')
            && !/blend|2x|3x|4x|ghrp/i.test(item.name || '');
          const label = isRecovery ? 'Injury & Recovery Protocol' : 'Energy & Optimization Protocol';
          const durationMatch = (item.name || '').match(/(\d+)\s*Day/i);
          const duration = durationMatch ? durationMatch[1] : null;
          display_name = duration ? `${label} — ${duration} Day` : label;
        }
        return display_name ? { ...item, display_name } : item;
      });
    }
    if (subtotal_cents !== undefined) updateData.subtotal_cents = subtotal_cents;
    if (discount_cents !== undefined) updateData.discount_cents = discount_cents;
    if (discount_description !== undefined) updateData.discount_description = discount_description;
    if (total_cents !== undefined) updateData.total_cents = total_cents;
    if (notes !== undefined) updateData.notes = notes;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data: updated, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Edit invoice error:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({ invoice: updated });
  } catch (error) {
    console.error('Edit invoice error:', error);
    return res.status(500).json({ error: error.message });
  }
}
