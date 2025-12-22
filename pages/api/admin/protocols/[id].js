// /pages/api/admin/protocols/[id].js
// Get Protocol Details
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try new patient_protocols table first
    let { data: protocol, error: newError } = await supabase
      .from('patient_protocols')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    // If not found, try old protocols table
    if (!protocol) {
      const { data: oldProtocol, error: oldError } = await supabase
        .from('protocols')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (oldProtocol) {
        // Map old schema to new format
        protocol = {
          id: oldProtocol.id,
          patient_id: oldProtocol.patient_id,
          ghl_contact_id: oldProtocol.ghl_contact_id,
          patient_name: oldProtocol.patient_name,
          patient_phone: oldProtocol.patient_phone,
          patient_email: oldProtocol.patient_email,
          
          protocol_name: oldProtocol.program_name || `${oldProtocol.total_days || 10}-Day Recovery Protocol`,
          medication: oldProtocol.primary_peptide,
          dosage: oldProtocol.dose_amount,
          frequency: oldProtocol.dose_frequency || 'daily',
          delivery_method: 'take_home',
          
          start_date: oldProtocol.start_date,
          end_date: oldProtocol.end_date,
          total_sessions: oldProtocol.total_sessions || oldProtocol.total_days,
          sessions_completed: oldProtocol.injections_completed || 0,
          
          status: oldProtocol.status,
          access_token: oldProtocol.access_token,
          notes: oldProtocol.notes,
          
          created_at: oldProtocol.created_at,
          _from_old_table: true
        };
      }
    }

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Get sessions
    let sessions = [];
    
    // Try protocol_sessions table
    const { data: newSessions } = await supabase
      .from('protocol_sessions')
      .select('*')
      .eq('protocol_id', id)
      .order('session_number', { ascending: true });

    if (newSessions?.length) {
      sessions = newSessions;
    } else {
      // Try old injection_logs table
      const { data: oldLogs } = await supabase
        .from('injection_logs')
        .select('*')
        .eq('protocol_id', id)
        .order('day_number', { ascending: true });

      if (oldLogs?.length) {
        sessions = oldLogs.map(log => ({
          id: log.id,
          protocol_id: log.protocol_id,
          session_number: log.day_number,
          scheduled_date: log.completed_at?.split('T')[0] || null,
          status: log.completed ? 'completed' : 'scheduled',
          completed_at: log.completed_at
        }));
      } else if (protocol.total_sessions && protocol.start_date) {
        // Generate sessions if none exist
        const start = new Date(protocol.start_date);
        for (let i = 1; i <= protocol.total_sessions; i++) {
          const sessionDate = new Date(start);
          sessionDate.setDate(start.getDate() + i - 1);
          sessions.push({
            id: `generated-${i}`,
            protocol_id: id,
            session_number: i,
            scheduled_date: sessionDate.toISOString().split('T')[0],
            status: i <= (protocol.sessions_completed || 0) ? 'completed' : 'scheduled'
          });
        }
      }
    }

    // Get checkins
    let checkins = [];
    const { data: newCheckins } = await supabase
      .from('protocol_checkins')
      .select('*')
      .eq('protocol_id', id)
      .order('checkin_date', { ascending: false });

    if (newCheckins?.length) {
      checkins = newCheckins;
    }

    return res.status(200).json({
      protocol,
      sessions,
      checkins
    });

  } catch (error) {
    console.error('Protocol fetch error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
