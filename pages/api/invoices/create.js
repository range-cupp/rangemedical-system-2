// POST /api/invoices/create
// Creates a new invoice and returns a payment URL

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      patient_id,
      patient_name,
      patient_email,
      patient_phone,
      items,
      subtotal_cents,
      discount_cents,
      discount_description,
      total_cents,
      notes,
      created_by,
    } = req.body;

    if (!patient_name || !items || total_cents == null) {
      return res.status(400).json({ error: 'patient_name, items, and total_cents are required' });
    }

    // Generate PHI-safe display names for patient-facing invoices
    const itemsWithDisplayNames = items.map(item => {
      const cat = (item.category || '').toLowerCase();
      const nameLower = (item.name || '').toLowerCase();
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

    // Expires in 30 days
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 30);

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        patient_id: patient_id || null,
        patient_name,
        patient_email: patient_email || null,
        patient_phone: patient_phone || null,
        items: itemsWithDisplayNames,
        subtotal_cents: subtotal_cents || total_cents,
        discount_cents: discount_cents || 0,
        discount_description: discount_description || null,
        total_cents,
        status: 'pending',
        notes: notes || null,
        created_by: created_by || null,
        expires_at: expires_at.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Create invoice error:', error);
      return res.status(500).json({ error: error.message });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';
    const payment_url = `${baseUrl}/invoice/${invoice.id}`;

    return res.status(200).json({ invoice, payment_url });
  } catch (error) {
    console.error('Create invoice error:', error);
    return res.status(500).json({ error: error.message });
  }
}
