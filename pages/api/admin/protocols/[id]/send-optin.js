// /pages/api/admin/protocols/[id]/send-optin.js
// Send peptide check-in opt-in SMS from the protocol detail page
// Range Medical

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { logComm } from '../../../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    // Fetch protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('id, patient_id, medication, program_name, access_token, ghl_contact_id, patient_name')
      .eq('id', id)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Get patient info (need ghl_contact_id and first_name)
    const { data: patient } = await supabase
      .from('patients')
      .select('id, name, first_name, ghl_contact_id')
      .eq('id', protocol.patient_id)
      .single();

    const ghlContactId = protocol.ghl_contact_id || patient?.ghl_contact_id;
    if (!ghlContactId) {
      return res.status(400).json({ error: 'Patient has no GHL contact ID — cannot send SMS' });
    }

    const firstName = patient?.first_name || (patient?.name ? patient.name.split(' ')[0] : 'there');

    // Check if opt-in was already sent
    const { data: existingLog } = await supabase
      .from('protocol_logs')
      .select('id')
      .eq('protocol_id', id)
      .eq('log_type', 'peptide_checkin_optin_sent')
      .maybeSingle();

    if (existingLog) {
      return res.status(409).json({ error: 'Opt-in SMS was already sent for this protocol' });
    }

    // Generate access token if missing
    let accessToken = protocol.access_token;
    if (!accessToken) {
      accessToken = crypto.randomBytes(32).toString('hex');
      await supabase
        .from('protocols')
        .update({ access_token: accessToken })
        .eq('id', id);
    }

    const shortCode = accessToken.slice(0, 8);
    const optinUrl = `${BASE_URL}/optin/${shortCode}`;
    const message = `Hi ${firstName}! You've started your recovery peptide protocol at Range Medical. We'd like to send quick weekly check-ins via text to track your progress — just 30 seconds each.\n\nTap here to get started:\n${optinUrl}\n\n- Range Medical`;

    // Send SMS
    const smsRes = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15'
      },
      body: JSON.stringify({ type: 'SMS', contactId: ghlContactId, message })
    });

    const smsData = await smsRes.json();
    if (!smsRes.ok) {
      return res.status(500).json({ error: 'SMS failed', details: smsData.message || smsData });
    }

    // Log it
    await supabase.from('protocol_logs').insert({
      protocol_id: id,
      patient_id: protocol.patient_id,
      log_type: 'peptide_checkin_optin_sent',
      log_date: new Date().toISOString().split('T')[0],
      notes: message
    });

    await logComm({
      channel: 'sms',
      messageType: 'peptide_checkin_optin_sent',
      message,
      source: 'admin-protocol-page',
      patientId: protocol.patient_id,
      protocolId: id,
      ghlContactId,
      patientName: patient?.name || protocol.patient_name
    });

    return res.status(200).json({ success: true, message: 'Opt-in SMS sent' });

  } catch (error) {
    console.error('Send opt-in error:', error);
    return res.status(500).json({ error: error.message });
  }
}
