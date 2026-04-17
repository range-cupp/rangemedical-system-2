// /pages/api/app/voice-token.js
// GET: generate a Twilio Access Token with VoiceGrant for the staff app.
// Reads Twilio credentials from env vars first, falls back to system_config.
//
// Requires ?employee_id=<uuid>. Will 403 if the employee has
// voice_browser_enabled = false (e.g. provider opted out of ringing their laptop).
// Identity = employee.id (stable UUID), so inbound TwiML can target specific clients.
//
// Also records voice_last_registered_at so the inbound router knows who's online.
// Range Medical Employee App

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cache Twilio config in memory for 10 min (avoids DB hit on every call)
let configCache = null;
let configCacheTime = 0;
const CONFIG_TTL = 10 * 60 * 1000;

// Defensive — trims whitespace/newlines that can sneak into Vercel env values
// when pasted, which silently break JWT minting (AccessTokenInvalid 20101).
const clean = (v) => (v == null ? '' : String(v).trim());

async function getVoiceConfig() {
  // Prefer env vars
  if (
    process.env.TWILIO_API_KEY_SID &&
    process.env.TWILIO_API_KEY_SECRET &&
    process.env.TWILIO_TWIML_APP_SID
  ) {
    return {
      accountSid:   clean(process.env.TWILIO_ACCOUNT_SID),
      apiKeySid:    clean(process.env.TWILIO_API_KEY_SID),
      apiKeySecret: clean(process.env.TWILIO_API_KEY_SECRET),
      twimlAppSid:  clean(process.env.TWILIO_TWIML_APP_SID),
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

  const map = Object.fromEntries(rows.map(r => [r.key, clean(r.value)]));
  configCache = {
    accountSid:   clean(process.env.TWILIO_ACCOUNT_SID),
    apiKeySid:    map.twilio_api_key_sid,
    apiKeySecret: map.twilio_api_key_secret,
    twimlAppSid:  map.twilio_twiml_app_sid,
  };
  configCacheTime = Date.now();
  return configCache;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const employeeId = (req.query.employee_id || '').trim();
  if (!employeeId) {
    return res.status(400).json({ error: 'employee_id is required' });
  }

  // 1. Verify employee exists, is active, and has opted in to browser calling
  const { data: employee, error: empErr } = await supabase
    .from('employees')
    .select('id, name, is_active, voice_browser_enabled')
    .eq('id', employeeId)
    .maybeSingle();

  if (empErr || !employee || !employee.is_active) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  if (!employee.voice_browser_enabled) {
    return res.status(403).json({
      error: 'Browser phone is disabled for this user. Enable it in More → Browser Phone.',
      enabled: false,
    });
  }

  // 2. Load Twilio config
  const config = await getVoiceConfig();
  if (!config || !config.apiKeySid || !config.apiKeySecret || !config.twimlAppSid) {
    return res.status(503).json({
      error: 'Voice calling not yet configured. Run /api/app/setup-voice to initialize.',
      configured: false,
    });
  }

  // 3. Mint the token
  try {
    const twilio = await import('twilio');
    const { AccessToken } = twilio.default.jwt;
    const { VoiceGrant }  = AccessToken;

    // Use employee UUID as Twilio identity — stable, unique, URL-safe.
    const identity = employee.id;

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

    // 4. Record presence — fire-and-forget, don't block token response
    supabase
      .from('employees')
      .update({ voice_last_registered_at: new Date().toISOString() })
      .eq('id', employee.id)
      .then(() => {}, () => {});

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
