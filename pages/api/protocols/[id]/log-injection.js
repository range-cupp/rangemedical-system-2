// /pages/api/protocols/[id]/log-injection.js
// Log an injection for a weight loss protocol (supports backfilling historical data)
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  // PATCH — update an existing log entry (date, weight, and/or delivery method)
  if (req.method === 'PATCH') {
    const { log_id, log_date: newDate, source, log_type: newLogType, weight: newWeight, update_weight } = req.body;
    if (!log_id) {
      return res.status(400).json({ error: 'log_id required' });
    }
    if (!newDate && !newLogType && !update_weight) {
      return res.status(400).json({ error: 'At least one field to update required' });
    }
    try {
      let updated = null;
      let updateErr = null;

      if (source === 'service_log') {
        // Build update fields for service_logs (entry_date, entry_type, weight)
        const updateFields = {};
        if (newDate) updateFields.entry_date = newDate;
        if (newLogType) updateFields.entry_type = newLogType === 'injection' ? 'injection' : 'pickup';
        if (update_weight) updateFields.weight = newWeight;

        const { data: slData, error: slErr } = await supabase
          .from('service_logs')
          .update(updateFields)
          .eq('id', log_id)
          .select()
          .single();

        if (!slErr && slData) {
          updated = slData;
        } else {
          // Try injection_logs table
          const { data: ilData, error: ilErr } = await supabase
            .from('injection_logs')
            .update(updateFields)
            .eq('id', log_id)
            .select()
            .single();

          if (!ilErr && ilData) {
            updated = ilData;
          } else {
            updateErr = slErr || ilErr;
          }
        }
      } else {
        // Build update fields for protocol_logs (log_date, log_type, weight)
        const updateFields = {};
        if (newDate) updateFields.log_date = newDate;
        if (newLogType) updateFields.log_type = newLogType;
        if (update_weight) updateFields.weight = newWeight;

        const result = await supabase
          .from('protocol_logs')
          .update(updateFields)
          .eq('id', log_id)
          .eq('protocol_id', id)
          .select()
          .single();

        updated = result.data;
        updateErr = result.error;
      }

      if (updateErr || !updated) {
        console.error('Update log entry error:', updateErr);
        return res.status(500).json({ error: 'Failed to update log entry' });
      }

      return res.status(200).json({ success: true, message: 'Log updated', log: updated });
    } catch (err) {
      console.error('PATCH log-injection error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  const { log_date, weight, dose, side_effects, notes, delivery_method, blood_pressure, missed } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  if (!log_date) {
    return res.status(400).json({ error: 'Date required' });
  }

  try {
    // Get protocol with patient info
    const { data: protocol, error: fetchError } = await supabase
      .from('protocols')
      .select(`
        *,
        patients (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const totalSessions = protocol.total_sessions || 4;

    // Build log notes
    let logNotes = '';
    if (missed) {
      logNotes = 'MISSED WEEK';
    }
    if (dose) {
      logNotes += logNotes ? ' | ' : '';
      logNotes += `Dose: ${dose}`;
    }
    if (side_effects && side_effects.length > 0 && !side_effects.includes('None')) {
      logNotes += logNotes ? ' | ' : '';
      logNotes += `Side effects: ${side_effects.join(', ')}`;
    }
    if (blood_pressure) {
      logNotes += logNotes ? ' | ' : '';
      logNotes += `BP: ${blood_pressure}`;
    }
    if (notes && notes.trim()) {
      logNotes += logNotes ? ' | ' : '';
      logNotes += notes.trim();
    }

    // Determine log type based on delivery method (or missed)
    const logType = missed ? 'missed' : (delivery_method === 'in_clinic' ? 'injection' : 'checkin');

    // Insert log entry FIRST
    const logEntry = {
      protocol_id: id,
      patient_id: protocol.patient_id,
      log_type: logType,
      log_date: log_date,
      weight: weight || null,
      notes: logNotes || null  // Will be set after counting
    };

    const { data: insertedLog, error: logError } = await supabase
      .from('protocol_logs')
      .insert(logEntry)
      .select()
      .single();

    if (logError) {
      console.error('Log insert error:', logError);
    }

    // Count actual injection/checkin logs for this protocol (race-condition-safe)
    const { count: logCount } = await supabase
      .from('protocol_logs')
      .select('*', { count: 'exact', head: true })
      .eq('protocol_id', id)
      .in('log_type', ['checkin', 'injection']);

    const newSessionsUsed = logCount || ((protocol.sessions_used || 0) + 1);
    const sessionsRemaining = totalSessions - newSessionsUsed;

    // Update log notes with correct injection number
    if (insertedLog && !logNotes) {
      await supabase
        .from('protocol_logs')
        .update({ notes: `Injection #${newSessionsUsed}` })
        .eq('id', insertedLog.id);
    }

    // Update protocol sessions_used based on actual count
    const { error: updateError } = await supabase
      .from('protocols')
      .update({
        sessions_used: newSessionsUsed,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Update protocol error:', updateError);
      return res.status(500).json({ error: 'Failed to update protocol' });
    }

    const patientName = protocol.patients?.name || 'Unknown';
    console.log(`✓ Injection logged for ${patientName}: #${newSessionsUsed}/${totalSessions} on ${log_date}`);

    return res.status(200).json({
      success: true,
      message: `Injection #${newSessionsUsed} logged`,
      injection_number: newSessionsUsed,
      injections_remaining: sessionsRemaining,
      log_id: insertedLog?.id
    });

  } catch (err) {
    console.error('Log injection error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
