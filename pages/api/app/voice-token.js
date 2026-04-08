// /pages/api/app/voice-token.js
// GET: generate a Twilio Access Token with VoiceGrant for the staff app
// Reads credentials from env vars first, falls back to system_config in Supabase
// Range Medical Employee App

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cache config in memory for 10 min (avoids DB hit on every call)
let configCache = null;
let configCacheTime = 0;
const CONFIG_TTL = 10 * 60 * 1000;

async function getVoiceConfig() {
  // Prefer env vars
  if (
    process.env.TWILIO_API_KEY_SID &&
    process.env.TWILIO_API_KEY_SECRET &&
    process.env.TWILIO_TWIML_APP_SID
  ) {
    return {
      accountSid:   process.env.TWILIO_ACCOUNT_SID,
      apiKeySid:    process.env.TWILIO_API_KEY_SID,
      apiKeySecret: process.env.TWILIO_API_KEY_SECRET,
      twimlAppSid:  process.env.TWILIO_TWIML_APP_SID,
    };
  }

  // Fall back to Supabase system_config
  if (configCache && Date.now() - configCacheTime < CONFIG_TTL) {
    return configCache;
  }

  const { data: rows, error } = await supabase
    .from('system_config')
    .select('key, value')
    .in('key', ['twilio_api_key_sid', 'twilio_api_key_secret', 'twilio_twiml_app_sid']);

  if (error || !rows || rows.length < 3) {
    return null;
  }

  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
  configCache = {
    accountSid:   process.env.TWILIO_ACCOUNT_SID,
    apiKeySid:    map.twilio_api_key_sid,
    apiKeySecret: map.twilio_api_key_secret,
    twimlAppSid:  map.twilio_twiml_app_sid,
  };
  configCacheTime = Date.now();
  return configCache;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const config = await getVoiceConfig();

  if (!config || !config.apiKeySid || !config.apiKeySecret || !config.twimlAppSid) {
    return res.status(503).json({
      error: 'Voice calling not yet configured. Run /api/app/setup-voice to initialize.',
      configured: false,
    });
  }

  try {
    const twilio = await import('twilio');
    const { AccessToken } = twilio.default.jwt;
    const { VoiceGrant }  = AccessToken;

    const identity = (req.query.identity || 'staff')
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .slice(0, 64);

    const token = new AccessToken(
      config.accountSid,
      config.apiKeySid,
      config.apiKeySecret,
      { identity, ttl: 3600 }
    );

    token.addGrant(new VoiceGrant({
      outgoingApplicationSid: config.twimlAppSid,
      incomingAllow: true,
    }));

    return res.status(200).json({
      token: token.toJwt(),
      identity,
      expires_in: 3600,
    });
  } catch (err) {
    console.error('[voice-token] Error:', err);
    return res.status(500).json({ error: 'Failed to generate voice token' });
  }
}
