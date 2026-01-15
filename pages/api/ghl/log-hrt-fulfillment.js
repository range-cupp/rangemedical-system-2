// /pages/api/ghl/log-hrt-fulfillment.js
// GHL Form Webhook - Log HRT Medication Fulfillment/Pickup
// Range Medical
// CREATED: 2026-01-04

import { createClient } from '@supabase/supabase-js';
import { syncHRTFulfillment } from '../../../lib/ghl-sync';

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
      status: 'HRT Fulfillment webhook active',
      version: '2026-01-04'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    console.log('=== HRT Fulfillment Form Received ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const contactId = payload.contact_id || payload.contactId || payload.contact?.id;
    const contactName = payload.contact_name || payload.full_name || payload.name || 
                        `${payload.first_name || ''} ${payload.last_name || ''}`.trim();
    const fulfillmentType = payload.fulfillment_type || payload.hrt_fulfillment || '';
    const medication = payload.medication || payload.hrt_medication || '';
    const dosage = payload.dosage || payload.hrt_dosage || '';

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

    // Log to protocol_logs for record keeping
    const { data: protocol } = await supabase
      .from('protocols')
      .select('id')
      .eq('patient_id', patient.id)
      .eq('status', 'active')
      .or('program_type.eq.hrt,program_name.ilike.%hrt%')
      .limit(1)
      .single();

    if (protocol) {
      await supabase.from('protocol_logs').insert({
        protocol_id: protocol.id,
        patient_id: patient.id,
        log_type: 'fulfillment',
        log_date: new Date().toISOString().split('T')[0],
        notes: `HRT Fulfillment: ${medication} ${dosage} (${fulfillmentType})`
      });
    }

    // Sync to GHL
    await syncHRTFulfillment(contactId, patient.name || contactName, {
      fulfillmentType,
      medication,
      dosage
    });

    console.log('✓ HRT Fulfillment logged');

    return res.status(200).json({
      success: true,
      message: 'HRT Fulfillment logged'
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
