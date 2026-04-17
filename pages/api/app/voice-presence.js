// /pages/api/app/voice-presence.js
// POST: heartbeat from an active browser softphone session.
// Updates employees.voice_last_registered_at so the inbound TwiML router
// knows this employee's browser is currently online and should be rung.
//
// Called by useVoiceCall every 30 seconds while the device is registered.
// Stale threshold is 90s — if no heartbeat in 90s, the inbound router
// treats them as offline and skips their client.
// Range Medical Employee App

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const employeeId = (req.body?.employee_id || '').trim();
  if (!employeeId) {
    return res.status(400).json({ error: 'employee_id is required' });
  }

  // Only bump presence if the employee is still opted-in. If they disabled
  // the toggle mid-session, we stop counting them as online immediately.
  const { data: employee, error: lookupErr } = await supabase
    .from('employees')
    .select('id, voice_browser_enabled, is_active')
    .eq('id', employeeId)
    .maybeSingle();

  if (lookupErr || !employee || !employee.is_active) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  if (!employee.voice_browser_enabled) {
    return res.status(403).json({ enabled: false });
  }

  const { error: updateErr } = await supabase
    .from('employees')
    .update({ voice_last_registered_at: new Date().toISOString() })
    .eq('id', employeeId);

  if (updateErr) {
    console.error('[voice-presence] update failed:', updateErr);
    return res.status(500).json({ error: 'Failed to update presence' });
  }

  return res.status(200).json({ ok: true });
}
