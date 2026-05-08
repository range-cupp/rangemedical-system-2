// /pages/api/app/voice-callback.js
// POST: click-to-call — Twilio calls the staff member's cell phone, then
// bridges them to the destination number. The patient sees caller ID
// (949) 997-3988. Staff gets a normal phone call (earpiece, bluetooth, etc.)
// instead of a browser speakerphone WebRTC call.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { employee_id, to, to_name } = req.body || {};

  if (!employee_id) return res.status(400).json({ error: 'employee_id is required' });
  if (!to) return res.status(400).json({ error: 'to (destination number) is required' });

  const { data: employee, error: empErr } = await supabase
    .from('employees')
    .select('id, name, phone, is_active')
    .eq('id', employee_id)
    .maybeSingle();

  if (empErr || !employee || !employee.is_active) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  if (!employee.phone) {
    return res.status(400).json({ error: 'No cell phone number on file for your account. Ask an admin to add it.' });
  }

  // Normalize destination to E.164
  let dest = to.replace(/[\s\-().]/g, '');
  if (!/^\+?\d{7,15}$/.test(dest)) {
    return res.status(400).json({ error: 'Invalid destination number' });
  }
  if (!dest.startsWith('+')) {
    dest = dest.length === 10 ? '+1' + dest : '+' + dest;
  }

  // Normalize staff cell to E.164
  let staffCell = employee.phone.replace(/[\s\-().]/g, '');
  if (!staffCell.startsWith('+')) {
    staffCell = staffCell.length === 10 ? '+1' + staffCell : '+' + staffCell;
  }

  const host = req.headers.host || 'rangemedical-system-2.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const bridgeUrl = `${baseUrl}/api/app/voice-callback-bridge?to=${encodeURIComponent(dest)}&to_name=${encodeURIComponent(to_name || '')}`;
  const statusUrl = `${baseUrl}/api/twilio/call-status`;

  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const call = await client.calls.create({
      to: staffCell,
      from: '+19499973988',
      url: bridgeUrl,
      statusCallback: statusUrl,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      machineDetection: 'Enable',
      timeout: 30,
    });

    return res.status(200).json({
      success: true,
      call_sid: call.sid,
      message: `Calling your phone (${employee.phone})...`,
    });
  } catch (err) {
    console.error('[voice-callback] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to initiate callback' });
  }
}
