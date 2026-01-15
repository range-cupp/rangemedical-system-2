// /pages/api/admin/protocols/[id]/extend.js
// Extend Protocol Duration
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { days, start_date } = req.body;

  if (!days || days < 1) {
    return res.status(400).json({ error: 'Days required' });
  }

  try {
    // Get current protocol
    let protocol = null;
    let isOldTable = false;

    const { data: newProtocol } = await supabase
      .from('patient_protocols')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (newProtocol) {
      protocol = newProtocol;
    } else {
      const { data: oldProtocol } = await supabase
        .from('protocols')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (oldProtocol) {
        protocol = oldProtocol;
        isOldTable = true;
      }
    }

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Calculate new end date
    const currentEndDate = protocol.end_date ? new Date(protocol.end_date) : new Date();
    const extensionStart = start_date ? new Date(start_date) : new Date(currentEndDate);
    extensionStart.setDate(extensionStart.getDate() + 1); // Start day after current end

    const newEndDate = new Date(extensionStart);
    newEndDate.setDate(newEndDate.getDate() + days - 1);

    const currentTotal = protocol.total_sessions || protocol.total_days || 0;
    const newTotal = currentTotal + days;

    // Update protocol - also set status back to active
    if (isOldTable) {
      await supabase
        .from('protocols')
        .update({
          end_date: newEndDate.toISOString().split('T')[0],
          total_sessions: newTotal,
          total_days: newTotal,
          duration_days: newTotal,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
    } else {
      await supabase
        .from('patient_protocols')
        .update({
          end_date: newEndDate.toISOString().split('T')[0],
          total_sessions: newTotal,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
    }

    // Create new sessions
    const newSessions = [];
    for (let i = currentTotal + 1; i <= newTotal; i++) {
      const sessionDate = new Date(extensionStart);
      sessionDate.setDate(extensionStart.getDate() + (i - currentTotal - 1));
      
      newSessions.push({
        protocol_id: id,
        session_number: i,
        scheduled_date: sessionDate.toISOString().split('T')[0],
        status: 'scheduled'
      });
    }

    if (newSessions.length > 0) {
      await supabase.from('protocol_sessions').insert(newSessions);
    }

    return res.status(200).json({
      success: true,
      new_end_date: newEndDate.toISOString().split('T')[0],
      new_total: newTotal,
      sessions_added: days
    });

  } catch (error) {
    console.error('Extend protocol error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
