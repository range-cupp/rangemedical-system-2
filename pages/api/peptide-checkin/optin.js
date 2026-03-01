// /pages/api/peptide-checkin/optin.js
// Handle patient opt-in/out for weekly peptide check-in texts
// Range Medical
//
// When a new peptide protocol is started, the patient receives
// an SMS asking if they'd like weekly check-in texts. This endpoint
// records their choice by updating peptide_reminders_enabled on the protocol.

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contact_id, protocol_id, opt_in } = req.body;

    if (!contact_id) {
      return res.status(400).json({ error: 'Contact ID required' });
    }

    if (typeof opt_in !== 'boolean') {
      return res.status(400).json({ error: 'opt_in must be true or false' });
    }

    // Find patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, name, first_name, ghl_contact_id')
      .eq('ghl_contact_id', contact_id)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : 'there');

    // Find the protocol to update
    let protocol;
    if (protocol_id) {
      const { data, error } = await supabase
        .from('protocols')
        .select('id, patient_id, medication, program_name')
        .eq('id', protocol_id)
        .eq('patient_id', patient.id)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Protocol not found' });
      }
      protocol = data;
    } else {
      // Find most recent active peptide protocol
      const { data, error } = await supabase
        .from('protocols')
        .select('id, patient_id, medication, program_name')
        .eq('patient_id', patient.id)
        .eq('status', 'active')
        .or('program_type.eq.peptide,program_name.ilike.%peptide%')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'No active peptide protocol found' });
      }
      protocol = data;
    }

    // Update the protocol's peptide_reminders_enabled flag
    const { error: updateError } = await supabase
      .from('protocols')
      .update({ peptide_reminders_enabled: opt_in })
      .eq('id', protocol.id);

    if (updateError) {
      console.error('Error updating protocol:', updateError);
      return res.status(500).json({ error: 'Failed to save preference' });
    }

    // Log the opt-in decision
    const logType = opt_in ? 'peptide_checkin_optin' : 'peptide_checkin_optout';
    const logNotes = opt_in
      ? 'Patient opted IN to weekly peptide check-in texts'
      : 'Patient opted OUT of weekly peptide check-in texts';

    await supabase.from('protocol_logs').insert({
      protocol_id: protocol.id,
      patient_id: patient.id,
      log_type: logType,
      log_date: new Date().toISOString().split('T')[0],
      notes: logNotes
    });

    // Log to comms_log
    await logComm({
      channel: 'web_form',
      messageType: logType,
      message: logNotes,
      source: 'peptide-checkin-optin',
      patientId: patient.id,
      protocolId: protocol.id,
      ghlContactId: contact_id,
      patientName: patient.name
    });

    // Send confirmation SMS
    if (GHL_API_KEY && contact_id) {
      let confirmMsg;
      if (opt_in) {
        confirmMsg = `Thanks ${firstName}! You're signed up for weekly check-ins on your recovery peptide protocol. You'll get your first one around day 7. Quick & easy — just 30 seconds each week. 💪\n\n- Range Medical`;
      } else {
        confirmMsg = `Got it, ${firstName}. You won't receive weekly check-in texts. If you ever have questions about your protocol, just text us or call (949) 997-3988.\n\n- Range Medical`;
      }

      try {
        await fetch('https://services.leadconnectorhq.com/conversations/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-04-15',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'SMS',
            contactId: contact_id,
            message: confirmMsg
          })
        });

        await logComm({
          channel: 'sms',
          messageType: `${logType}_confirmation`,
          message: confirmMsg,
          source: 'peptide-checkin-optin',
          patientId: patient.id,
          protocolId: protocol.id,
          ghlContactId: contact_id,
          patientName: patient.name
        });
      } catch (smsError) {
        console.error('Confirmation SMS error:', smsError);
      }
    }

    console.log(`✓ Patient ${patient.name} opted ${opt_in ? 'IN' : 'OUT'} of peptide check-in texts (protocol ${protocol.id})`);

    return res.status(200).json({
      success: true,
      opted_in: opt_in,
      message: opt_in ? 'Opted in to weekly check-ins' : 'Opted out of weekly check-ins'
    });

  } catch (error) {
    console.error('Peptide optin API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
