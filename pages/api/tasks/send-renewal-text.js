// /pages/api/tasks/send-renewal-text.js
// Send a renewal follow-up SMS to a patient from a task
// Range Medical System

import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_id, patient_name, patient_phone, message, task_id } = req.body;

  if (!patient_phone || !message) {
    return res.status(400).json({ error: 'patient_phone and message are required' });
  }

  const phone = normalizePhone(patient_phone);
  if (!phone) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  try {
    // Look up employee from auth header for logging
    let employeeName = null;
    let employeeId = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const authClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const { data: { user } } = await authClient.auth.getUser(token);
      if (user) {
        const { data: emp } = await supabase
          .from('employees')
          .select('id, name')
          .eq('auth_user_id', user.id)
          .single();
        if (emp) {
          employeeId = emp.id;
          employeeName = emp.name;
        }
      }
    }

    // Get patient GHL contact ID for comms log
    let ghlContactId = null;
    if (patient_id) {
      const { data: patient } = await supabase
        .from('patients')
        .select('ghl_contact_id')
        .eq('id', patient_id)
        .single();
      ghlContactId = patient?.ghl_contact_id || null;
    }

    const result = await sendSMS({ to: phone, message });

    if (result.success) {
      await logComm({
        channel: 'sms',
        messageType: 'renewal_followup',
        message,
        source: `task-renewal(${result.provider || 'sms'})`,
        patientId: patient_id || null,
        patientName: patient_name || null,
        ghlContactId,
        recipient: phone,
        twilioMessageSid: result.messageSid,
        direction: 'outbound',
        provider: result.provider || null,
        sentByEmployeeId: employeeId,
        sentByEmployeeName: employeeName,
      });

      return res.status(200).json({ success: true, provider: result.provider });
    }

    return res.status(500).json({ error: result.error || 'SMS send failed' });
  } catch (error) {
    console.error('Send renewal text error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
