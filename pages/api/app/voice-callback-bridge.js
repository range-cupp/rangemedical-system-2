// /pages/api/app/voice-callback-bridge.js
// TwiML endpoint — Twilio fetches this when the staff member answers their cell.
// It plays a brief announcement then bridges them to the destination number.
// Caller ID to the patient is always (949) 997-3988.

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/xml');

  const to = req.query.to || req.body?.to || '';
  const toName = req.query.to_name || req.body?.to_name || '';

  if (!to) {
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, no destination number was provided.</Say>
  <Hangup/>
</Response>`);
  }

  const host = req.headers.host || 'rangemedical-system-2.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const statusUrl = `${protocol}://${host}/api/twilio/call-status`;

  const announcement = toName
    ? `Connecting you to ${toName}.`
    : 'Connecting your call now.';

  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${announcement}</Say>
  <Dial callerId="+19499973988" timeout="30">
    <Number statusCallbackEvent="initiated ringing answered completed" statusCallback="${statusUrl}" statusCallbackMethod="POST">${to}</Number>
  </Dial>
</Response>`);
}
