// /pages/api/protocols/[id]/log-injection.js
// Log an injection for a weight loss protocol (supports backfilling historical data)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { addGHLNote, updateGHLContact } from '../../../../lib/ghl-sync';

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

  // PATCH — update an existing log entry's date
  if (req.method === 'PATCH') {
    const { log_id, log_date: newDate } = req.body;
    if (!log_id || !newDate) {
      return res.status(400).json({ error: 'log_id and log_date required' });
    }
    try {
      const { data: updated, error: updateErr } = await supabase
        .from('protocol_logs')
        .update({ log_date: newDate })
        .eq('id', log_id)
        .eq('protocol_id', id)
        .select()
        .single();

      if (updateErr) {
        console.error('Update log date error:', updateErr);
        return res.status(500).json({ error: 'Failed to update log date' });
      }

      return res.status(200).json({ success: true, message: 'Date updated', log: updated });
    } catch (err) {
      console.error('PATCH log-injection error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  const { log_date, weight, dose, side_effects, notes, delivery_method } = req.body;

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
          name,
          ghl_contact_id
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
    if (dose) {
      logNotes += `Dose: ${dose}`;
    }
    if (side_effects && side_effects.length > 0 && !side_effects.includes('None')) {
      logNotes += logNotes ? ' | ' : '';
      logNotes += `Side effects: ${side_effects.join(', ')}`;
    }
    if (notes && notes.trim()) {
      logNotes += logNotes ? ' | ' : '';
      logNotes += notes.trim();
    }

    // Determine log type based on delivery method
    const logType = delivery_method === 'in_clinic' ? 'injection' : 'checkin';

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

    // Calculate weight change if we have both weights
    let weightChange = '';
    if (weight && protocol.starting_weight) {
      const change = weight - protocol.starting_weight;
      weightChange = change < 0 
        ? `↓ ${Math.abs(change).toFixed(1)} lbs from start`
        : change > 0 
          ? `↑ ${change.toFixed(1)} lbs from start`
          : 'No change from start';
    }

    // Sync to GHL (only for today's date to avoid confusing timeline)
    const contactId = protocol.patients?.ghl_contact_id;
    const patientName = protocol.patients?.name || 'Unknown';
    const isToday = log_date === new Date().toISOString().split('T')[0];
    
    if (contactId) {
      // Update custom fields
      await updateGHLContact(contactId, {
        'wl__injections_used': String(newSessionsUsed),
        'wl__injections_remaining': String(sessionsRemaining),
        ...(weight ? { 'wl__current_weight': String(weight) } : {})
      });

      // Add note (mark if backfilled)
      const deliveryLabel = delivery_method === 'in_clinic' ? 'IN CLINIC' : 'TAKE HOME';
      let ghlNote = isToday 
        ? `💉 INJECTION LOGGED (${deliveryLabel})`
        : `💉 INJECTION LOGGED - BACKFILLED (${deliveryLabel})`;
      
      ghlNote += `\n\nDate: ${log_date}`;
      ghlNote += `\nInjection: ${newSessionsUsed} of ${totalSessions}`;
      
      if (weight) {
        ghlNote += `\nWeight: ${weight} lbs`;
        if (weightChange) {
          ghlNote += ` (${weightChange})`;
        }
      }
      
      if (dose) {
        ghlNote += `\nDose: ${dose}`;
      }
      
      if (side_effects && side_effects.length > 0 && !side_effects.includes('None')) {
        ghlNote += `\n\n⚠️ Side Effects: ${side_effects.join(', ')}`;
      }
      
      if (notes && notes.trim()) {
        ghlNote += `\n\nNotes: ${notes.trim()}`;
      }
      
      if (sessionsRemaining <= 0) {
        ghlNote += `\n\n✅ PROTOCOL COMPLETE - All ${totalSessions} injections used`;
      } else if (sessionsRemaining === 1) {
        ghlNote += `\n\n⚠️ Last injection remaining`;
      }

      await addGHLNote(contactId, ghlNote);
    }

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
