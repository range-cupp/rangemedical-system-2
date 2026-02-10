// /pages/api/ghl/log-session.js
// GHL Form Webhook - Log Session (IV, HBOT, RLT, Injection Packs)
// Range Medical
// CREATED: 2026-01-04
// UPDATED: 2026-02-10 - Removed session incrementing (now Service Log only)

import { createClient } from '@supabase/supabase-js';
import { syncSessionLogToGHL } from '../../../lib/ghl-sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers for staff form
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'Session Log webhook active',
      version: '2026-01-04'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    console.log('=== Session Log Form Received ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const contactId = payload.contact_id || payload.contactId || payload.contact?.id;
    const contactName = payload.contact_name || payload.full_name || payload.name || 
                        `${payload.first_name || ''} ${payload.last_name || ''}`.trim();
    
    // Session type: iv, hbot, rlt, injection
    const sessionType = (payload.session_type || payload.type || 'session').toLowerCase();
    const notes = payload.notes || '';

    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID required' });
    }

    // Find patient
    const { data: patient } = await supabase
      .from('patients')
      .select('id, name, ghl_contact_id')
      .eq('ghl_contact_id', contactId)
      .single();

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Build query based on session type
    let typeFilter = '';
    if (sessionType === 'iv') {
      typeFilter = 'program_type.eq.iv_therapy,program_name.ilike.%iv%';
    } else if (sessionType === 'hbot') {
      typeFilter = 'program_type.eq.hbot,program_name.ilike.%hbot%,program_name.ilike.%hyperbaric%';
    } else if (sessionType === 'rlt' || sessionType === 'red light') {
      typeFilter = 'program_type.eq.red_light,program_name.ilike.%red light%,program_name.ilike.%rlt%';
    } else {
      typeFilter = 'program_type.eq.injection,total_sessions.gt.0';
    }

    // Find active protocol
    const { data: protocol } = await supabase
      .from('protocols')
      .select('*')
      .eq('patient_id', patient.id)
      .eq('status', 'active')
      .or(typeFilter)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!protocol) {
      return res.status(404).json({ error: `No active ${sessionType} protocol found` });
    }

    console.log('Found protocol:', protocol.id, protocol.program_name);

    // Create log entry
    const logEntry = {
      protocol_id: protocol.id,
      patient_id: patient.id,
      log_type: 'session',
      log_date: new Date().toISOString().split('T')[0],
      notes: notes || `${sessionType.toUpperCase()} session`
    };

    const { data: insertedLog } = await supabase
      .from('protocol_logs')
      .insert(logEntry)
      .select()
      .single();

    // Session incrementing removed - now handled exclusively through Service Log
    // Just sync the log entry to GHL for notes
    await syncSessionLogToGHL(
      contactId,
      protocol,
      insertedLog || logEntry,
      patient.name || contactName
    );

    console.log('✓ Session logged (no session increment - handled via Service Log)');

    return res.status(200).json({
      success: true,
      message: `${sessionType.toUpperCase()} session logged (session counting via Service Log)`,
      protocol_id: protocol.id,
      protocol_status: protocol.status
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
