// /pages/api/admin/send-wl-checkin.js
// Manually send the weight loss check-in SMS to a single protocol. Phrasing
// follows the protocol's cadence (weekly / biweekly / N-day).
// Usage: POST /api/admin/send-wl-checkin?protocol_id=<uuid>&secret=<CRON_SECRET>
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { parseFrequencyDays } from '../../../lib/protocol-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const protocolId = req.query.protocol_id || req.body?.protocol_id;
  if (!protocolId) {
    return res.status(400).json({ error: 'protocol_id required' });
  }

  const { data: protocol, error } = await supabase
    .from('protocols')
    .select(`
      id,
      patient_id,
      frequency,
      patients!inner ( id, name, first_name, phone, ghl_contact_id )
    `)
    .eq('id', protocolId)
    .single();

  if (error || !protocol) {
    return res.status(404).json({ error: 'Protocol not found', details: error?.message });
  }

  const patient = protocol.patients;
  const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : 'there');
  const phone = normalizePhone(patient.phone);
  if (!phone) {
    return res.status(400).json({ error: 'No phone number on file for patient' });
  }

  const checkinUrl = 'https://app.range-medical.com/patient-checkin.html?contact_id=' + (patient.ghl_contact_id || patient.id);
  const cadenceDays = parseFrequencyDays(protocol.frequency);
  const cadenceWord = cadenceDays === 7 ? 'weekly' : cadenceDays === 14 ? 'biweekly' : `${cadenceDays}-day`;
  const message = 'Hi ' + firstName + '! 📊\n\nTime for your ' + cadenceWord + ' weight loss check-in. Takes 30 seconds:\n\n' + checkinUrl + '\n\n- Range Medical';

  const smsResult = await sendSMS({ to: phone, message });

  try {
    await supabase.from('checkin_reminders_log').insert({
      protocol_id: protocol.id,
      patient_id: patient.id,
      ghl_contact_id: patient.ghl_contact_id,
      patient_name: patient.name,
      status: smsResult.success ? 'sent' : 'error',
      error_message: smsResult.success ? null : smsResult.error,
      message_content: message,
    });
  } catch (e) {
    console.error('Failed to log reminder:', e);
  }

  await logComm({
    channel: 'sms',
    messageType: 'wl_weekly_checkin',
    message,
    source: 'admin-send-wl-checkin',
    patientId: patient.id,
    protocolId: protocol.id,
    ghlContactId: patient.ghl_contact_id,
    patientName: patient.name,
    recipient: phone,
    twilioMessageSid: smsResult.messageSid,
    status: smsResult.success ? undefined : 'error',
    errorMessage: smsResult.success ? undefined : smsResult.error,
    provider: smsResult.provider || null,
    direction: 'outbound',
  });

  if (!smsResult.success) {
    return res.status(500).json({ error: smsResult.error });
  }

  return res.status(200).json({
    success: true,
    patient: patient.name,
    phone,
    messageSid: smsResult.messageSid,
  });
}
