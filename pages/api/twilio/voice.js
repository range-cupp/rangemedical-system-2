// /pages/api/twilio/voice.js
// Twilio Voice Webhook — routes incoming calls and handles extension transfers
// Range Medical

const { EXTENSIONS, ALL_SIP_ENDPOINTS } = require('../../../lib/extensions');

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

  // --- Incoming call — ring all Grandstream phones simultaneously ---
  const sipEndpoints = ALL_SIP_ENDPOINTS.map(sip =>
    `    <Sip statusCallbackEvent="initiated ringing answered completed" statusCallback="${statusCallback}" statusCallbackMethod="POST">${sip}</Sip>`
  ).join('\n');

  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="30" action="${baseUrl}/api/twilio/voicemail">
${sipEndpoints}
  </Dial>
</Response>`);
}
