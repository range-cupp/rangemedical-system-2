// /pages/api/admin/clear-appointments.js
// Clear appointments for a specific date to allow fresh sync
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date } = req.body;
  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  try {
    const { data, error } = await supabase
      .from('clinic_appointments')
      .delete()
      .eq('appointment_date', date)
      .select('id');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      deleted: data?.length || 0,
      date
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
