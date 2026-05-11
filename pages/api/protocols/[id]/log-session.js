// /pages/api/protocols/[id]/log-session.js
// Log a session, injection, or weight for a protocol
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../../lib/date-utils';
import { createServiceLogEntry } from '../../../../lib/service-log-engine';
import { recountProtocolSessions } from '../../../../lib/recount-protocol-sessions';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { log_date, notes, log_type, weight, dose } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID is required' });
  }

  try {
    const { data: protocol, error: fetchError } = await supabase
      .from('protocols')
      .select('*, patients(id, name)')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const finalLogType = log_type || 'injection';
    const entryType = finalLogType === 'weigh_in' ? 'weight_check' : (finalLogType === 'session' ? 'session' : 'injection');

    const programType = (protocol.program_type || '').toLowerCase();
    let category = 'weight_loss';
    if (programType.includes('hrt') || programType === 'hrt') category = 'testosterone';
    else if (programType === 'peptide') category = 'peptide';
    else if (programType.includes('iv')) category = 'iv_therapy';
    else if (programType.includes('hbot')) category = 'hbot';
    else if (programType.includes('red_light')) category = 'red_light';
    else if (programType.includes('weight')) category = 'weight_loss';

    const { log, error: engineErr } = await createServiceLogEntry(supabase, {
      patient_id: protocol.patient_id,
      protocol_id: id,
      category,
      entry_type: entryType,
      entry_date: log_date || todayPacific(),
      medication: protocol.medication || null,
      dosage: dose || protocol.selected_dose || null,
      weight: weight ? parseFloat(weight) : null,
      notes: notes || null,
    });

    if (engineErr) {
      console.error('Error creating log:', engineErr);
    }

    const recount = await recountProtocolSessions(supabase, id);
    const sessionsUsed = recount?.sessions_used || protocol.sessions_used || 0;

    return res.status(200).json({
      success: true,
      sessionsUsed,
      totalSessions: protocol.total_sessions,
    });

  } catch (error) {
    console.error('Error logging session:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
