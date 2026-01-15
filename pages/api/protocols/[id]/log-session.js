// /pages/api/protocols/[id]/log-session.js
// Log a session, injection, or weight for a protocol
// Range Medical
// UPDATED: 2026-01-04 - Added comprehensive GHL sync for all protocol types

import { createClient } from '@supabase/supabase-js';
import { syncSessionLogToGHL } from '../../../../lib/ghl-sync';

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
    // Get current protocol with patient info
    const { data: protocol, error: fetchError } = await supabase
      .from('protocols')
      .select('*, patients(id, name, ghl_contact_id)')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const ghlContactId = protocol.patients?.ghl_contact_id;
    const patientName = protocol.patients?.name || protocol.patient_name || 'Unknown';

    // Determine log type - default to injection for session-based
    const finalLogType = log_type || 'injection';
    
    // Create log entry
    const logEntry = {
      protocol_id: id,
      patient_id: protocol.patient_id,
      log_type: finalLogType,
      log_date: log_date || new Date().toISOString().split('T')[0],
      notes: notes || null
    };
    
    // Add weight if provided (for both injection and weigh_in logs)
    if (weight) {
      logEntry.weight = parseFloat(weight);
    }
    
    // Add dose if provided (for injection logs)
    if (dose) {
      logEntry.dose = dose;
    }

    const { data: insertedLog, error: logError } = await supabase
      .from('protocol_logs')
      .insert(logEntry)
      .select()
      .single();

    if (logError) {
      console.error('Error creating log:', logError);
      // Continue even if log fails - still increment sessions for non-weight logs
    }

    let newSessionsUsed = protocol.sessions_used || 0;
    let protocolCompleted = false;

    // Only increment sessions_used for injection/session logs, not weigh_ins
    if (protocol.total_sessions && finalLogType !== 'weigh_in') {
      newSessionsUsed = (protocol.sessions_used || 0) + 1;
      
      const updates = {
        sessions_used: newSessionsUsed,
        updated_at: new Date().toISOString()
      };

      // Auto-complete if all sessions used
      if (newSessionsUsed >= protocol.total_sessions) {
        updates.status = 'completed';
        protocolCompleted = true;
      }

      const { error: updateError } = await supabase
        .from('protocols')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
    }

    // Update protocol object with new values for GHL sync
    const updatedProtocol = {
      ...protocol,
      sessions_used: newSessionsUsed,
      status: protocolCompleted ? 'completed' : protocol.status
    };

    // ============================================
    // SYNC TO GHL
    // ============================================
    if (ghlContactId && finalLogType !== 'weigh_in') {
      console.log('Syncing session to GHL:', ghlContactId);
      
      try {
        await syncSessionLogToGHL(ghlContactId, updatedProtocol, insertedLog || logEntry, patientName);
      } catch (syncError) {
        console.error('GHL sync error (non-fatal):', syncError);
        // Don't fail the request if GHL sync fails
      }
    }

    return res.status(200).json({ 
      success: true,
      sessionsUsed: newSessionsUsed,
      totalSessions: protocol.total_sessions,
      completed: protocolCompleted,
      ghlSynced: !!ghlContactId
    });

  } catch (error) {
    console.error('Error logging session:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
