// /pages/api/twilio/voice.js
// Twilio Voice Webhook — routes incoming calls and handles extension transfers.
// Inbound calls simulring:
//   - Grandstream desk phones (always)
//   - Browser softphones for employees who have opted-in AND are currently online
// Range Medical

const { createClient } = require('@supabase/supabase-js');
const { EXTENSIONS, ALL_SIP_ENDPOINTS } = require('../../../lib/extensions');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// How recent a heartbeat has to be for a browser client to count as "online".
// The hook sends a heartbeat every 30s, so 90s gives 2 missed beats of slack.
const PRESENCE_STALE_MS = 90 * 1000;

async function getOnlineBrowserClients() {
  try {
    const cutoff = new Date(Date.now() - PRESENCE_STALE_MS).toISOString();
    const { data, error } = await supabase
      .from('employees')
      .select('id')
      .eq('is_active', true)
      .eq('voice_browser_enabled', true)
      .gte('voice_last_registered_at', cutoff);

    if (error) {
      console.error('[voice] presence query failed:', error);
      return [];
    }
    return (data || []).map(e => e.id);
  } catch (err) {
    console.error('[voice] presence query threw:', err);
    return [];
  }
}

export default async function handler(req, res) {
  const to = req.body?.To || req.query?.To || '';
  const from = req.body?.From || req.query?.From || '';
  const direction = req.body?.Direction || '';

  const host = req.headers.host || 'app.range-medical.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;
  const statusCallback = `${baseUrl}/api/twilio/call-status`;

  res.setHeader('Content-Type', 'text/xml');

  // --- Outbound call from Grandstream (SIP → extension or PSTN) ---
  if (from.includes('sip:') || direction === 'outbound') {
    // Extract the dialed number/extension from SIP To header
    let dialed = to.replace('sip:', '').split('@')[0].replace(/\D/g, '');

    // Check if it's an extension
    const ext = EXTENSIONS[dialed];
    if (ext) {
      if (ext.type === 'sip') {
        // Transfer to another Grandstream
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="+19499973988" timeout="30">
    <Sip statusCallbackEvent="initiated ringing answered completed" statusCallback="${statusCallback}" statusCallbackMethod="POST">${ext.sip}</Sip>
  </Dial>
</Response>`);
      }
      if (ext.type === 'phone') {
        // Transfer to cell phone
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="+19499973988" timeout="25" action="${baseUrl}/api/twilio/voicemail">
    <Number statusCallbackEvent="initiated ringing answered completed" statusCallback="${statusCallback}" statusCallbackMethod="POST">${ext.number}</Number>
  </Dial>
</Response>`);
      }
    }

    // Not an extension — regular outbound PSTN call
    if (dialed.length === 10) dialed = '1' + dialed;
    if (!dialed.startsWith('+')) dialed = '+' + dialed;

    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="+19499973988">
    <Number statusCallbackEvent="initiated ringing answered completed" statusCallback="${statusCallback}" statusCallbackMethod="POST">${dialed}</Number>
  </Dial>
</Response>`);
  }

  // --- Incoming call — ring Grandstream desk phones + online browser clients ---
  const browserClientIds = await getOnlineBrowserClients();

  const sipLegs = ALL_SIP_ENDPOINTS.map(sip =>
    `    <Sip statusCallbackEvent="initiated ringing answered completed" statusCallback="${statusCallback}" statusCallbackMethod="POST">${sip}</Sip>`
  );

  const clientLegs = browserClientIds.map(id =>
    `    <Client statusCallbackEvent="initiated ringing answered completed" statusCallback="${statusCallback}" statusCallbackMethod="POST">${id}</Client>`
  );

  const allLegs = [...sipLegs, ...clientLegs].join('\n');

  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="30" action="${baseUrl}/api/twilio/voicemail">
${allLegs}
  </Dial>
</Response>`);
}
