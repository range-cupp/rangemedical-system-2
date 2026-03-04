// /pages/api/twilio/voicemail.js
// Voicemail fallback — if Grandstream doesn't answer, forward to cell or take voicemail
// Range Medical

export default async function handler(req, res) {
  const dialStatus = req.body?.DialCallStatus || req.query?.DialCallStatus || '';

  res.setHeader('Content-Type', 'text/xml');

  // If the SIP endpoint answered, no action needed
  if (dialStatus === 'completed') {
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`);
  }

  // SIP didn't answer — try forwarding to cell phone as backup
  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="20" callerId="+19499973988">
    <Number>+19496900339</Number>
  </Dial>
  <Say voice="alice">You've reached Range Medical. Please leave a message after the tone.</Say>
  <Record maxLength="120" transcribe="true" />
</Response>`);
}
