// /pages/api/ghl/log-hrt-blooddraw.js
// GHL Form Webhook - Log HRT Blood Draw
// Range Medical
// CREATED: 2026-01-04

import { createClient } from '@supabase/supabase-js';
import { syncHRTBloodDraw } from '../../../lib/ghl-sync';

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
      status: 'HRT Blood Draw webhook active',
      version: '2026-01-04'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    console.log('=== HRT Blood Draw Form Received ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const contactId = payload.contact_id || payload.contactId || payload.contact?.id;
    const contactName = payload.contact_name || payload.full_name || payload.name || 
                        `${payload.first_name || ''} ${payload.last_name || ''}`.trim();
    const logDate = payload.date || new Date().toISOString().split('T')[0];
    const panelType = payload.panel_type || 'Blood Draw';
    const notes = payload.notes || null;

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

    // Log to protocol_logs
    const { data: protocol } = await supabase
      .from('protocols')
      .select('id')
      .eq('patient_id', patient.id)
      .eq('status', 'active')
      .or('program_type.eq.hrt,program_name.ilike.%hrt%')
      .limit(1)
      .single();

    let logNotes = `${panelType} completed`;
    if (notes) {
      logNotes += ` | ${notes}`;
    }

    if (protocol) {
      await supabase.from('protocol_logs').insert({
        protocol_id: protocol.id,
        patient_id: patient.id,
        log_type: 'blood_draw',
        log_date: logDate,
        notes: logNotes
      });
    }

    // Sync to GHL
    await syncHRTBloodDraw(contactId, patient.name || contactName, { 
      date: logDate, 
      panel_type: panelType,
      notes: notes 
    });

    console.log('✓ HRT Blood Draw logged:', panelType);

    return res.status(200).json({
      success: true,
      message: `${panelType} logged`
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
