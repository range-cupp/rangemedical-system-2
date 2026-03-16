// Temporary one-time fix for John Choi's Retatrutide protocol
// Fixes: end_date, sessions_used, next_expected_date
// Safe to delete after running once

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
    // Find John Choi's Retatrutide protocol
    const { data: protocols, error: findError } = await supabase
      .from('protocols')
      .select('*')
      .ilike('patient_name', '%choi%')
      .ilike('program_name', '%retatrutide%');

    if (findError) {
      return res.status(500).json({ error: findError.message });
    }

    if (!protocols || protocols.length === 0) {
      // Try broader search
      const { data: allChoi } = await supabase
        .from('protocols')
        .select('id, patient_name, program_name, start_date, end_date, total_sessions, sessions_used, next_expected_date, status, category')
        .ilike('patient_name', '%choi%');

      return res.status(404).json({
        error: 'Retatrutide protocol not found for Choi',
        all_choi_protocols: allChoi
      });
    }

    const protocol = protocols[0];
    const startDate = new Date(protocol.start_date);

    // 4 weeks = 28 days from start
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 28);
    const endDateStr = endDate.toISOString().split('T')[0];

    // All 4 injections were dispensed at purchase (overnighted)
    const updates = {
      end_date: endDateStr,
      sessions_used: 4,
      total_sessions: 4,
      next_expected_date: endDateStr, // Next refill after all 4 are used
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('protocols')
      .update(updates)
      .eq('id', protocol.id);

    if (updateError) {
      return res.status(500).json({ error: updateError.message, updates });
    }

    // Verify the update
    const { data: updated } = await supabase
      .from('protocols')
      .select('id, patient_name, program_name, start_date, end_date, total_sessions, sessions_used, next_expected_date, last_refill_date, status')
      .eq('id', protocol.id)
      .single();

    return res.status(200).json({
      success: true,
      message: 'Protocol fixed',
      before: {
        end_date: protocol.end_date,
        sessions_used: protocol.sessions_used,
        total_sessions: protocol.total_sessions,
        next_expected_date: protocol.next_expected_date
      },
      after: updated
    });

  } catch (error) {
    console.error('Fix Choi error:', error);
    return res.status(500).json({ error: error.message });
  }
}
