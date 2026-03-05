// /pages/api/twilio/voicemail.js
// Voicemail fallback — if Grandstream doesn't answer, play greeting and record message
// Range Medical

export default async function handler(req, res) {
  const dialStatus = req.body?.DialCallStatus || req.query?.DialCallStatus || '';

  res.setHeader('Content-Type', 'text/xml');

  // If the SIP endpoint answered, no action needed
  if (dialStatus === 'completed') {
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`);
  }

  // SIP didn't answer — go straight to voicemail
  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Thank you for calling Range Medical. We're sorry we missed your call. Our office hours are Monday through Friday, 9 A.M. to 6 P.M., and Saturday, 9 A.M. to 2 P.M. Please leave your name, number, and a brief message, and we'll return your call as soon as possible. If this is a medical emergency, please call 9 1 1. Thank you.</Say>
  <Record maxLength="120" transcribe="true" playBeep="true" />
</Response>`);
}
