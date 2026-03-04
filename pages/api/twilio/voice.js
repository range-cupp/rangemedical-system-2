// /pages/api/twilio/voice.js
// Twilio Voice Webhook — routes incoming calls to Grandstream SIP phone
// Also handles outbound calls from Grandstream
// Range Medical

export default async function handler(req, res) {
  // Determine if this is an incoming call to the business number
  // or an outbound call from the Grandstream
  const to = req.body?.To || req.query?.To || '';
  const from = req.body?.From || req.query?.From || '';
  const direction = req.body?.Direction || '';

  // Set content type for TwiML response
  res.setHeader('Content-Type', 'text/xml');

  // Outbound call from Grandstream (SIP → PSTN)
  if (from.includes('sip:') || direction === 'outbound') {
    // Extract the dialed number from the SIP To header
    let dialNumber = to.replace('sip:', '').split('@')[0];
    // Clean up — ensure it has +1 prefix for US numbers
    dialNumber = dialNumber.replace(/\D/g, '');
    if (dialNumber.length === 10) dialNumber = '1' + dialNumber;
    if (!dialNumber.startsWith('+')) dialNumber = '+' + dialNumber;

    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="+19499973988">
    <Number>${dialNumber}</Number>
  </Dial>
</Response>`);
  }

  // Incoming call — ring the Grandstream via SIP
  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="30" action="/api/twilio/voicemail">
    <Sip>sip:rangemedical@rangemedical.sip.twilio.com</Sip>
  </Dial>
</Response>`);
}
