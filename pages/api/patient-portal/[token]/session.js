// /pages/api/patient-portal/[token]/session.js
// Mark session/injection complete
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { token } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { protocol_id, session_number } = req.body;

  if (!protocol_id) {
    return res.status(400).json({ error: 'protocol_id required' });
  }

  try {
    // Verify access
    const { data: protocol } = await supabase
      .from('patient_protocols')
      .select('*')
      .eq('id', protocol_id)
      .single();

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // For peptide/therapy protocols with session numbers
    if (session_number && protocol.total_sessions) {
      // Find the session
      const { data: session } = await supabase
        .from('protocol_sessions')
        .select('*')
        .eq('protocol_id', protocol_id)
        .eq('session_number', session_number)
        .maybeSingle();

      if (session) {
        // Toggle completion
        const newStatus = session.status === 'completed' ? 'scheduled' : 'completed';
        
        await supabase
          .from('protocol_sessions')
          .update({
            status: newStatus,
            completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
            completed_by: 'patient'
          })
          .eq('id', session.id);

        // Update protocol sessions_completed count
        const { data: completedSessions } = await supabase
          .from('protocol_sessions')
          .select('id')
          .eq('protocol_id', protocol_id)
          .eq('status', 'completed');

        await supabase
          .from('patient_protocols')
          .update({
            sessions_completed: completedSessions?.length || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', protocol_id);

        return res.status(200).json({ success: true, status: newStatus });
      }
    }

    // For HRT/Weight Loss (no session number, just logging an injection)
    if (!session_number) {
      const today = new Date().toISOString().split('T')[0];

      // Check if already logged today
      const { data: existing } = await supabase
        .from('protocol_sessions')
        .select('*')
        .eq('protocol_id', protocol_id)
        .eq('scheduled_date', today)
        .maybeSingle();

      if (existing) {
        // Toggle
        const newStatus = existing.status === 'completed' ? 'scheduled' : 'completed';
        await supabase
          .from('protocol_sessions')
          .update({
            status: newStatus,
            completed_at: newStatus === 'completed' ? new Date().toISOString() : null
          })
          .eq('id', existing.id);

        return res.status(200).json({ success: true, toggled: true });
      }

      // Create new session entry
      const sessionNumber = (protocol.sessions_completed || 0) + 1;
      
      await supabase
        .from('protocol_sessions')
        .insert({
          protocol_id,
          session_number: sessionNumber,
          scheduled_date: today,
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: 'patient'
        });

      // Update protocol
      const updates = {
        sessions_completed: sessionNumber,
        updated_at: new Date().toISOString()
      };

      // For HRT: update supply remaining
      if (protocol.supply_type === 'prefilled') {
        updates.supply_remaining = Math.max(0, (protocol.supply_remaining || 8) - 1);
      } else if (protocol.supply_type === 'vial' && protocol.dose_per_injection) {
        const mlPerInjection = protocol.dose_per_injection / 200; // 200mg/ml
        updates.supply_remaining = Math.max(0, (protocol.supply_remaining || 10) - mlPerInjection);
      }

      // For Weight Loss: track titration
      if (protocol.current_dose) {
        updates.injections_at_current_dose = (protocol.injections_at_current_dose || 0) + 1;
      }

      await supabase
        .from('patient_protocols')
        .update(updates)
        .eq('id', protocol_id);

      // Create titration alert if on 4th injection
      if (updates.injections_at_current_dose === 4) {
        await supabase.from('staff_alerts').insert({
          protocol_id,
          patient_id: protocol.patient_id,
          alert_type: 'titration_due',
          title: `Titration review: ${protocol.patient_name}`,
          message: `${protocol.protocol_name} - 4 injections at ${protocol.current_dose}, consider titration`,
          due_date: today,
          priority: 'medium'
        });
      }

      // Create refill alert if supply low
      if (protocol.supply_type === 'prefilled' && updates.supply_remaining <= 2) {
        await supabase.from('staff_alerts').insert({
          protocol_id,
          patient_id: protocol.patient_id,
          alert_type: 'refill_due',
          title: `Refill needed: ${protocol.patient_name}`,
          message: `HRT - ${updates.supply_remaining} injections remaining`,
          due_date: today,
          priority: 'high'
        });
      }

      return res.status(200).json({ success: true, created: true });
    }

    return res.status(400).json({ error: 'Invalid request' });

  } catch (error) {
    console.error('Session API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
