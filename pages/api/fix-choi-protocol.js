// Temporary one-time fix for John Choi's Retatrutide protocol
// Protocol ID: 67194c20-5d67-4455-9c27-11636d66311d
// Fixes: end_date (Mar 23 → Apr 13), sessions_used (1 → 4), next_expected_date, patient_name
// Safe to delete after running once

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PROTOCOL_ID = '67194c20-5d67-4455-9c27-11636d66311d';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  try {
    // Get current state
    const { data: before } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', PROTOCOL_ID)
      .single();

    if (!before) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Fix: 4 weeks from Mar 16 = Apr 13
    const updates = {
      end_date: '2026-04-13',
      sessions_used: 4,
      total_sessions: 4,
      next_expected_date: '2026-04-13',
      patient_name: 'John Choi',
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('protocols')
      .update(updates)
      .eq('id', PROTOCOL_ID);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    // Verify
    const { data: after } = await supabase
      .from('protocols')
      .select('id, patient_name, program_name, start_date, end_date, total_sessions, sessions_used, next_expected_date, last_refill_date, status')
      .eq('id', PROTOCOL_ID)
      .single();

    return res.status(200).json({
      success: true,
      message: 'John Choi protocol fixed: end_date → Apr 13, sessions_used → 4, next_expected → Apr 13',
      before: {
        end_date: before.end_date,
        sessions_used: before.sessions_used,
        total_sessions: before.total_sessions,
        next_expected_date: before.next_expected_date,
        patient_name: before.patient_name
      },
      after
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
