// /pages/api/protocols/[id]/update.js
// Update a protocol

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

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID is required' });
  }

  try {
    const {
      status,
      delivery_method,
      start_date,
      end_date,
      total_sessions,
      sessions_used,
      nad_dose,
      selected_dose,
      notes,
      injection_day,
      checkin_reminder_enabled,
      medication,
      pickup_frequency,
      frequency
    } = req.body;

    const updateData = {};

    // Only update fields that are provided
    if (status !== undefined) updateData.status = status;
    if (delivery_method !== undefined) updateData.delivery_method = delivery_method;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date || null;
    if (total_sessions !== undefined) updateData.total_sessions = parseInt(total_sessions) || 0;
    if (sessions_used !== undefined) updateData.sessions_used = parseInt(sessions_used) || 0;
    if (nad_dose !== undefined) updateData.nad_dose = nad_dose || null;
    if (selected_dose !== undefined) updateData.selected_dose = selected_dose || null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (injection_day !== undefined) updateData.injection_day = injection_day || null;
    if (checkin_reminder_enabled !== undefined) updateData.checkin_reminder_enabled = checkin_reminder_enabled;
    if (medication !== undefined) updateData.medication = medication || null;
    if (pickup_frequency !== undefined) updateData.pickup_frequency = pickup_frequency || null;
    if (frequency !== undefined) updateData.frequency = frequency || null;

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('protocols')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, protocol: data });

  } catch (error) {
    console.error('Error updating protocol:', error);
    return res.status(500).json({ error: error.message });
  }
}
