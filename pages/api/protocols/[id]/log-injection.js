// /pages/api/protocols/[id]/log-injection.js
// Log an injection for a weight loss protocol (supports backfilling historical data)
// Range Medical
// UPDATED: 2026-03-17 — Consolidated to service_logs as single source of truth

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'PATCH' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  // DELETE — remove an injection log entry
  if (req.method === 'DELETE') {
    const { log_id, source } = req.body;
    if (!log_id) {
      return res.status(400).json({ error: 'log_id required' });
    }
    try {
      // Fetch entry before deleting
      const { data: entry } = await supabase
        .from('service_logs')
        .select('entry_date')
        .eq('id', log_id)
        .single();

      // Delete from service_logs
      const { error: delErr } = await supabase
        .from('service_logs')
        .delete()
        .eq('id', log_id);

      if (delErr) {
        // Fallback: try injection_logs (legacy)
        const { error: ilErr } = await supabase
          .from('injection_logs')
          .delete()
          .eq('id', log_id);
        if (ilErr) {
          console.error('Delete log error:', delErr, ilErr);
          return res.status(500).json({ error: 'Failed to delete log entry' });
        }
      }

      // Recount sessions from service_logs only
      const { count: slCount } = await supabase
        .from('service_logs')
        .select('*', { count: 'exact', head: true })
        .eq('protocol_id', id)
        .in('entry_type', ['injection', 'session']);

      const newSessionsUsed = slCount || 0;

      // Find the most recent remaining injection date
      const { data: latestSL } = await supabase
        .from('service_logs')
        .select('entry_date')
        .eq('protocol_id', id)
        .in('entry_type', ['injection', 'session'])
        .order('entry_date', { ascending: false })
        .limit(1);

      const lastDate = latestSL?.[0]?.entry_date || null;

      const updateData = {
        sessions_used: newSessionsUsed,
        updated_at: new Date().toISOString(),
      };

      if (lastDate) {
        updateData.last_visit_date = lastDate;
        const nextDate = new Date(lastDate + 'T12:00:00');
        nextDate.setDate(nextDate.getDate() + 7);
        updateData.next_expected_date = nextDate.toISOString().split('T')[0];
      } else {
        updateData.last_visit_date = null;
        updateData.next_expected_date = null;
      }

      await supabase.from('protocols').update(updateData).eq('id', id);

      console.log(`✓ Injection cleared for protocol ${id}: sessions_used=${newSessionsUsed}, last_visit=${lastDate}`);

      return res.status(200).json({
        success: true,
        message: 'Injection cleared',
        sessions_used: newSessionsUsed
      });
    } catch (err) {
      console.error('DELETE log-injection error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // PATCH — update an existing log entry (date, weight, dose, type)
  if (req.method === 'PATCH') {
    const { log_id, log_date: newDate, source, log_type: newLogType, weight: newWeight, update_weight, dose: newDose, update_dose } = req.body;
    if (!log_id) {
      return res.status(400).json({ error: 'log_id required' });
    }
    if (!newDate && !newLogType && !update_weight && !update_dose) {
      return res.status(400).json({ error: 'At least one field to update required' });
    }
    try {
      // Build update fields for service_logs
      const updateFields = {};
      if (newDate) updateFields.entry_date = newDate;
      if (newLogType) updateFields.entry_type = newLogType === 'injection' ? 'injection' : 'pickup';
      if (update_weight) updateFields.weight = newWeight;
      if (update_dose) updateFields.dosage = newDose;

      const { data: updated, error: updateErr } = await supabase
        .from('service_logs')
        .update(updateFields)
        .eq('id', log_id)
        .select()
        .single();

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

  // POST — log a new injection
  const { log_date, weight, dose, side_effects, notes, delivery_method, blood_pressure, missed, force } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  if (!log_date) {
    return res.status(400).json({ error: 'Date required' });
  }

  try {
    // ── Duplicate check (skip if missed or force:true) ──
    if (!force && !missed) {
      const { data: existingSL } = await supabase
        .from('service_logs')
        .select('id, entry_date, entry_type')
        .eq('protocol_id', id)
        .eq('entry_date', log_date)
        .in('entry_type', ['injection', 'session', 'weight_check'])
        .limit(1);

      if (existingSL && existingSL.length > 0) {
        return res.status(409).json({
          success: false,
          duplicate: true,
          message: `An injection was already logged for this protocol on ${log_date}. Log another anyway?`
        });
      }
    }

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

    // Determine entry type
    const entryType = missed ? 'missed' : (delivery_method === 'in_clinic' ? 'injection' : 'injection');

    // Insert into service_logs (single source of truth)
    const { data: insertedLog, error: logError } = await supabase
      .from('service_logs')
      .insert({
        patient_id: protocol.patient_id,
        protocol_id: id,
        category: 'weight_loss',
        entry_type: entryType,
        entry_date: log_date,
        medication: protocol.medication || null,
        dosage: dose || protocol.selected_dose || null,
        weight: weight || null,
        notes: logNotes || null,
      })
      .select()
      .single();

    if (logError) {
      console.error('Log insert error:', logError);
      return res.status(500).json({ error: 'Failed to create log entry' });
    }

    // Count injection/session logs for this protocol from service_logs
    const { count: logCount } = await supabase
      .from('service_logs')
      .select('*', { count: 'exact', head: true })
      .eq('protocol_id', id)
      .in('entry_type', ['injection', 'session']);

    const newSessionsUsed = logCount || ((protocol.sessions_used || 0) + 1);
    const sessionsRemaining = totalSessions - newSessionsUsed;

    // Update log notes with injection number if no notes were provided
    if (insertedLog && !logNotes) {
      await supabase
        .from('service_logs')
        .update({ notes: `Injection #${newSessionsUsed}` })
        .eq('id', insertedLog.id);
    }

    // Update protocol sessions_used + next_expected_date + last_visit_date
    const nextExpected = new Date(log_date + 'T12:00:00');
    nextExpected.setDate(nextExpected.getDate() + 7);
    const nextExpectedStr = nextExpected.toISOString().split('T')[0];

    const protocolUpdate = {
      sessions_used: newSessionsUsed,
      last_visit_date: log_date,
      updated_at: new Date().toISOString(),
    };

    if (!missed) {
      protocolUpdate.next_expected_date = nextExpectedStr;
    }

    const { error: updateError } = await supabase
      .from('protocols')
      .update(protocolUpdate)
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
