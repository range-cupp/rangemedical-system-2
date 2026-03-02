// /pages/api/admin/sms-diagnostic.js
// Quick diagnostic to check SMS configuration and recent failures
// Range Medical — temporary diagnostic

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const diagnostics = {};

  // 1. Check Twilio env vars
  diagnostics.twilio = {
    accountSidSet: !!process.env.TWILIO_ACCOUNT_SID,
    authTokenSet: !!process.env.TWILIO_AUTH_TOKEN,
    phoneNumberSet: !!process.env.TWILIO_PHONE_NUMBER,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
      ? process.env.TWILIO_PHONE_NUMBER.replace(/(\+\d{1})\d{6}(\d{4})/, '$1******$2')
      : 'NOT SET',
  };

  // 2. Check recent SMS comms_log entries (last 7 days)
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data: smsLogs, error: logsErr } = await supabase
    .from('comms_log')
    .select('id, created_at, channel, message_type, patient_name, status, error_message, source, recipient')
    .eq('channel', 'sms')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(20);

  diagnostics.recentSmsLogs = smsLogs || [];
  diagnostics.smsLogsError = logsErr?.message || null;

  // 3. Check recent email logs for comparison
  const { data: emailLogs } = await supabase
    .from('comms_log')
    .select('id, created_at, channel, message_type, patient_name, status, error_message, source, recipient')
    .eq('channel', 'email')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  diagnostics.recentEmailLogs = emailLogs || [];

  // 4. Check notification_queue for pending SMS
  const { data: queuedSms } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('channel', 'sms')
    .order('created_at', { ascending: false })
    .limit(10);

  diagnostics.queuedSms = queuedSms || [];

  // 5. Look up specific patients
  const { data: lilyPatient } = await supabase
    .from('patients')
    .select('id, name, email, phone')
    .ilike('name', '%nikou%')
    .limit(1)
    .maybeSingle();

  diagnostics.lilyNikou = lilyPatient || 'NOT FOUND';

  const { data: renePatient } = await supabase
    .from('patients')
    .select('id, name, email, phone')
    .ilike('name', '%gardner%')
    .limit(1)
    .maybeSingle();

  diagnostics.reneGardner = renePatient || 'NOT FOUND';

  // 6. Check recent appointments for Lily
  if (lilyPatient) {
    const { data: lilyAppts } = await supabase
      .from('appointments')
      .select('id, service_name, start_time, status, patient_phone, created_at')
      .eq('patient_id', lilyPatient.id)
      .order('created_at', { ascending: false })
      .limit(3);

    diagnostics.lilyAppointments = lilyAppts || [];

    // Check comms_log for Lily specifically
    const { data: lilyComms } = await supabase
      .from('comms_log')
      .select('id, created_at, channel, message_type, status, error_message, source, recipient')
      .eq('patient_id', lilyPatient.id)
      .order('created_at', { ascending: false })
      .limit(10);

    diagnostics.lilyCommsLog = lilyComms || [];
  }

  // 7. Check Rene comms
  if (renePatient) {
    const { data: reneComms } = await supabase
      .from('comms_log')
      .select('id, created_at, channel, message_type, status, error_message, source, recipient')
      .eq('patient_id', renePatient.id)
      .order('created_at', { ascending: false })
      .limit(10);

    diagnostics.reneCommsLog = reneComms || [];
  }

  return res.status(200).json(diagnostics);
}
