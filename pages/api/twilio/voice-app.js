// /pages/api/twilio/voice-app.js
// TwiML webhook for outbound calls from the Range Medical Staff App (browser VoIP)
// Twilio calls this URL when a Twilio.Device makes an outbound call
// The `To` param is the phone number the staff member wants to dial

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/xml');

  // Only accept POST from Twilio
  if (req.method !== 'POST') {
    return res.status(405).send('<Response><Say>Method not allowed</Say></Response>');
  }

  const to   = req.body?.To   || req.body?.to   || '';
  const from = req.body?.From || req.body?.from || process.env.TWILIO_PHONE_NUMBER;

  // Validate — must look like a phone number
  if (!to || !/^\+?\d{7,15}$/.test(to.replace(/[\s\-().]/g, ''))) {
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, the phone number was not recognized. Please try again.</Say>
</Response>`);
  }

  // Normalize E.164
  let dialNumber = to.replace(/[\s\-().]/g, '');
  if (!dialNumber.startsWith('+')) {
    dialNumber = dialNumber.length === 10 ? '+1' + dialNumber : '+' + dialNumber;
  }

  const callerIdNumber = process.env.TWILIO_PHONE_NUMBER || '+19499973988';

  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${callerIdNumber}" timeout="30" record="record-from-answer-dual-channel" recordingStatusCallback="/api/twilio/recording/status">
    <Number statusCallbackEvent="initiated ringing answered completed" statusCallback="/api/twilio/status-callback">
      ${dialNumber}
    </Number>
  </Dial>
</Response>`);
}
