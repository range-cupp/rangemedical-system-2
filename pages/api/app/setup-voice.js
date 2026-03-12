// /pages/api/app/setup-voice.js
// ONE-TIME setup: creates Twilio API Key + TwiML App, saves to system_config
// Protected by CRON_SECRET. Idempotent — safe to call multiple times.
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Auth check
  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const appUrl     = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.host}`;

  if (!accountSid || !authToken) {
    return res.status(500).json({ error: 'TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing' });
  }

  try {
    // Check if already configured
    const { data: existing } = await supabase
      .from('system_config')
      .select('key, value')
      .in('key', ['twilio_api_key_sid', 'twilio_twiml_app_sid']);

    if (existing && existing.length >= 2) {
      return res.status(200).json({
        message: 'Already configured',
        configured: true,
        keys: existing.map(r => r.key),
      });
    }

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    // 1. Create API Key
    const keyRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Keys.json`, {
      method: 'POST',
      headers,
      body: new URLSearchParams({ FriendlyName: 'Range Medical Staff App' }).toString(),
    });

    if (!keyRes.ok) {
      const err = await keyRes.text();
      console.error('[setup-voice] API Key creation failed:', err);
      return res.status(500).json({ error: 'Failed to create Twilio API Key', detail: err });
    }

    const keyData = await keyRes.json();

    // 2. Create TwiML App
    const voiceUrl = `${appUrl}/api/twilio/voice-app`;
    const appRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Applications.json`, {
      method: 'POST',
      headers,
      body: new URLSearchParams({
        FriendlyName: 'Range Medical Staff App',
        VoiceUrl: voiceUrl,
        VoiceMethod: 'POST',
      }).toString(),
    });

    if (!appRes.ok) {
      const err = await appRes.text();
      console.error('[setup-voice] TwiML App creation failed:', err);
      return res.status(500).json({ error: 'Failed to create TwiML App', detail: err });
    }

    const appData = await appRes.json();

    // 3. Save all three values to system_config
    const configs = [
      { key: 'twilio_api_key_sid',    value: keyData.sid },
      { key: 'twilio_api_key_secret', value: keyData.secret },
      { key: 'twilio_twiml_app_sid',  value: appData.sid },
      { key: 'twilio_voice_url',      value: voiceUrl },
    ];

    const { error: upsertError } = await supabase
      .from('system_config')
      .upsert(configs, { onConflict: 'key' });

    if (upsertError) {
      console.error('[setup-voice] Supabase upsert failed:', upsertError);
      return res.status(500).json({ error: 'Failed to save config to database' });
    }

    console.log('[setup-voice] ✅ Voice configured:', {
      api_key_sid: keyData.sid,
      twiml_app_sid: appData.sid,
      voice_url: voiceUrl,
    });

    return res.status(200).json({
      success: true,
      message: 'Twilio Voice configured successfully',
      api_key_sid: keyData.sid,
      twiml_app_sid: appData.sid,
      voice_url: voiceUrl,
    });

  } catch (err) {
    console.error('[setup-voice] Unexpected error:', err);
    return res.status(500).json({ error: err.message || 'Setup failed' });
  }
}
