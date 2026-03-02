// /pages/api/admin/protocols/[id]/send-guide.js
// Send peptide guide SMS from the protocol detail page
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    // Fetch protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('id, patient_id, medication, program_name, ghl_contact_id, patient_name, peptide_guide_sent')
      .eq('id', id)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Get patient info
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

    // Check if guide was already sent (check protocol flag AND protocol_logs)
    if (protocol.peptide_guide_sent) {
      return res.status(409).json({ error: 'Peptide guide was already sent for this protocol' });
    }

    const { data: existingLog } = await supabase
      .from('protocol_logs')
      .select('id')
      .eq('protocol_id', id)
      .eq('log_type', 'peptide_guide_sent')
      .maybeSingle();

    if (existingLog) {
      return res.status(409).json({ error: 'Peptide guide was already sent for this protocol' });
    }

    // Build and send guide SMS
    const guideMessage = `Hi ${firstName}! Here's your guide to your recovery peptide protocol: https://www.range-medical.com/bpc-tb4-guide - Range Medical`;

    const smsRes = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15'
      },
      body: JSON.stringify({ type: 'SMS', contactId: ghlContactId, message: guideMessage })
    });

    const smsData = await smsRes.json();
    if (!smsRes.ok) {
      return res.status(500).json({ error: 'SMS failed', details: smsData.message || smsData });
    }

    // Mark guide sent on protocol
    await supabase
      .from('protocols')
      .update({ peptide_guide_sent: true })
      .eq('id', id);

    // Log to protocol_logs
    await supabase.from('protocol_logs').insert({
      protocol_id: id,
      patient_id: protocol.patient_id,
      log_type: 'peptide_guide_sent',
      log_date: new Date().toISOString().split('T')[0],
      notes: guideMessage
    });

    // Log to comms_log
    await logComm({
      channel: 'sms',
      messageType: 'peptide_guide_sent',
      message: guideMessage,
      source: 'admin-protocol-page',
      patientId: protocol.patient_id,
      protocolId: id,
      ghlContactId,
      patientName: patient?.name || protocol.patient_name
    });

    return res.status(200).json({ success: true, message: 'Peptide guide SMS sent' });

  } catch (error) {
    console.error('Send guide error:', error);
    return res.status(500).json({ error: error.message });
  }
}
