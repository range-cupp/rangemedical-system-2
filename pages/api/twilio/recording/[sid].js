// /pages/api/twilio/recording/[sid].js
// Proxy Twilio recordings so they can be played directly in the browser
// Adds Twilio auth and streams audio back with correct content-type
// Range Medical

export default async function handler(req, res) {
  const { sid } = req.query;

  if (!sid) {
    return res.status(400).json({ error: 'Recording SID required' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return res.status(500).json({ error: 'Twilio credentials not configured' });
  }

  try {
    // Fetch the recording from Twilio with Basic Auth
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${sid}.mp3`;
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const response = await fetch(twilioUrl, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Recording not found' });
    }

    // Stream the audio back with correct headers for browser playback
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `inline; filename="voicemail-${sid}.mp3"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const buffer = await response.arrayBuffer();
    return res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    console.error('Recording proxy error:', err);
    return res.status(500).json({ error: 'Failed to fetch recording' });
  }
}
