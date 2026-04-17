// /pages/api/app/voice-settings.js
// GET ?employee_id=<uuid>  → { voice_browser_enabled }
// POST { employee_id, voice_browser_enabled } → { voice_browser_enabled }
//
// Powers the "Ring this computer on incoming calls" toggle on /app/more.
// When toggled OFF, the inbound TwiML router immediately stops including this
// employee's <Client> in the ring group (presence is also cleared).
// Range Medical Employee App

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const employeeId = (req.query.employee_id || '').trim();
    if (!employeeId) {
      return res.status(400).json({ error: 'employee_id is required' });
    }

    const { data, error } = await supabase
      .from('employees')
      .select('id, voice_browser_enabled')
      .eq('id', employeeId)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    return res.status(200).json({
      voice_browser_enabled: !!data.voice_browser_enabled,
    });
  }

  if (req.method === 'POST') {
    const { employee_id, voice_browser_enabled } = req.body || {};
    if (!employee_id) {
      return res.status(400).json({ error: 'employee_id is required' });
    }
    if (typeof voice_browser_enabled !== 'boolean') {
      return res.status(400).json({ error: 'voice_browser_enabled must be boolean' });
    }

    const update = {
      voice_browser_enabled,
      // Clear presence when turning off so the ring group drops this user immediately,
      // rather than waiting for the 90s staleness window.
      ...(voice_browser_enabled ? {} : { voice_last_registered_at: null }),
    };

    const { data, error } = await supabase
      .from('employees')
      .update(update)
      .eq('id', employee_id)
      .select('voice_browser_enabled')
      .maybeSingle();

    if (error || !data) {
      console.error('[voice-settings] update failed:', error);
      return res.status(500).json({ error: 'Failed to update settings' });
    }

    return res.status(200).json({
      voice_browser_enabled: !!data.voice_browser_enabled,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
