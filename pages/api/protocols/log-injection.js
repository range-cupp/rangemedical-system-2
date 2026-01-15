// /pages/api/protocols/log-injection.js
// Log an injection session for Weight Loss (In Clinic) protocols
// Records weight, increments sessions_used, links purchase
// Range Medical

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
    const {
      protocolId,
      purchaseId,
      patientId,
      weight,
      injectionDate,
      notes
    } = req.body;

    if (!protocolId) {
      return res.status(400).json({ error: 'Protocol ID is required' });
    }

    // Get current protocol state
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', protocolId)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const currentSession = (protocol.sessions_used || 0) + 1;

    // Create injection log
    const { data: log, error: logError } = await supabase
      .from('injection_logs')
      .insert({
        protocol_id: protocolId,
        patient_id: patientId || protocol.patient_id,
        purchase_id: purchaseId || null,
        session_number: currentSession,
        injection_date: injectionDate || new Date().toISOString().split('T')[0],
        weight: weight || null,
        notes: notes || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating injection log:', logError);
      return res.status(500).json({ error: 'Failed to log injection' });
    }

    // Update protocol sessions_used
    const newSessionsUsed = currentSession;
    const isComplete = protocol.total_sessions && newSessionsUsed >= protocol.total_sessions;

    const { error: updateError } = await supabase
      .from('protocols')
      .update({ 
        sessions_used: newSessionsUsed,
        status: isComplete ? 'completed' : 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', protocolId);

    if (updateError) {
      console.error('Error updating protocol:', updateError);
    }

    // Link purchase to protocol if provided
    if (purchaseId) {
      const { error: purchaseError } = await supabase
        .from('purchases')
        .update({ 
          protocol_id: protocolId,
          protocol_created: true
        })
        .eq('id', purchaseId);

      if (purchaseError) {
        console.error('Error linking purchase:', purchaseError);
      }
    }

    res.status(200).json({
      success: true,
      log,
      sessionNumber: currentSession,
      totalSessions: protocol.total_sessions,
      isComplete,
      message: `Injection ${currentSession}${protocol.total_sessions ? `/${protocol.total_sessions}` : ''} logged`
    });

  } catch (error) {
    console.error('Error logging injection:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
}
