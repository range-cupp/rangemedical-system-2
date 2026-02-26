// GET /api/appointments/[id]
// Return single appointment with its events

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
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Get appointment error:', error);
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const { data: events } = await supabase
      .from('appointment_events')
      .select('*')
      .eq('appointment_id', id)
      .order('created_at', { ascending: true });

    return res.status(200).json({ appointment, events: events || [] });
  } catch (error) {
    console.error('Get appointment error:', error);
    return res.status(500).json({ error: error.message });
  }
}
