// /pages/api/protocols/send-wl-link.js
// Manually send WL page link SMS to a patient for an existing protocol
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { protocolId } = req.body;
  if (!protocolId) return res.status(400).json({ error: 'protocolId required' });

  // Get protocol with access_token
  const { data: protocol } = await supabase
    .from('protocols')
    .select('id, patient_id, access_token, program_type, medication')
    .eq('id', protocolId)
    .single();

  if (!protocol) return res.status(404).json({ error: 'Protocol not found' });
  if (!protocol.access_token) return res.status(400).json({ error: 'Protocol has no access token' });

  // Get patient info
  const { data: patient } = await supabase
    .from('patients')
    .select('first_name, name, phone')
    .eq('id', protocol.patient_id)
    .single();

  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const phone = patient.phone ? normalizePhone(patient.phone) : null;
  if (!phone) return res.status(400).json({ error: 'Patient has no phone number' });

  const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : 'there');
  const pageUrl = `https://www.range-medical.com/wl/${protocol.access_token}`;
  const message = `Hi ${firstName}! Congrats on starting your weight loss program with Range Medical. Here's your personalized page to set your injection day, track your progress, and check in each week: ${pageUrl} - Range Medical`;

  const smsResult = await sendSMS({ to: phone, message });

  if (smsResult.success) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
    await supabase.from('protocol_logs').insert({
      protocol_id: protocol.id,
      patient_id: protocol.patient_id,
      log_type: 'wl_welcome_sms',
      log_date: today,
      notes: message
    });
    const patientName = patient.name || `${patient.first_name || ''}`.trim();
    await logComm({ channel: 'sms', messageType: 'wl_welcome_sms', message, source: 'manual', patientId: protocol.patient_id, protocolId: protocol.id, patientName, provider: smsResult.provider });

    return res.status(200).json({ success: true, provider: smsResult.provider });
  } else {
    return res.status(500).json({ error: smsResult.error || 'Failed to send SMS' });
  }
}
