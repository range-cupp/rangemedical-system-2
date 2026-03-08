// /pages/api/appointments/update.js
// Update appointment status, notes, category
// Supports both 'appointments' and 'clinic_appointments' tables

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED_TABLES = ['appointments', 'clinic_appointments'];
const ALLOWED_STATUSES = ['scheduled', 'confirmed', 'showed', 'completed', 'no_show', 'cancelled'];

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, table, status, notes, category } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Missing appointment id' });
  }

  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: 'Invalid table' });
  }

  if (status && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const updates = { updated_at: new Date().toISOString() };

    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    // Category field differs between tables
    if (category !== undefined) {
      if (table === 'appointments') {
        updates.service_category = category;
      } else {
        updates.appointment_title = category;
      }
    }

    const { error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating appointment:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Appointment update error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
