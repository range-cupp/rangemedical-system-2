// /pages/api/app/voice-token.js
// GET: generate a Twilio Access Token with VoiceGrant for the staff app
// Token is valid for 1 hour. Client uses it to initialize Twilio.Device.
// Range Medical Employee App

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const accountSid    = process.env.TWILIO_ACCOUNT_SID;
  const apiKeySid     = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret  = process.env.TWILIO_API_KEY_SECRET;
  const twimlAppSid   = process.env.TWILIO_TWIML_APP_SID;

  if (!accountSid || !apiKeySid || !apiKeySecret || !twimlAppSid) {
    console.error('[voice-token] Missing Twilio Voice env vars. Run scripts/setup-twilio-voice-app.js');
    return res.status(503).json({
      error: 'Voice calling not configured. Contact your system administrator.',
      missing: !twimlAppSid ? 'TWILIO_TWIML_APP_SID' : 'TWILIO_API_KEY_SID or TWILIO_API_KEY_SECRET',
    });
  }

  try {
    // Dynamic import of twilio (server-side only)
    const twilio = await import('twilio');
    const { AccessToken } = twilio.default.jwt;
    const { VoiceGrant }  = AccessToken;

    // Identity from query (staff name → used as caller identity)
    const identity = (req.query.identity || 'staff').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 64);

    const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
      identity,
      ttl: 3600, // 1 hour
    });

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true, // Allow inbound calls to this device identity
    });
    token.addGrant(voiceGrant);

    return res.status(200).json({
      token: token.toJwt(),
      identity,
      expires_in: 3600,
    });
  } catch (err) {
    console.error('[voice-token] Error generating token:', err);
    return res.status(500).json({ error: 'Failed to generate voice token' });
  }
}
