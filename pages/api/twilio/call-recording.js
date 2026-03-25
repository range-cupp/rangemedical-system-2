// /pages/api/twilio/call-recording.js
// Looks up and streams the recording for a given Twilio Call SID
// GET ?callSid=CA... — returns audio/mpeg stream
// Range Medical System V2

export default async function handler(req, res) {
  const { callSid } = req.query;

  if (!callSid) {
    return res.status(400).json({ error: 'callSid required' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return res.status(500).json({ error: 'Twilio credentials not configured' });
  }

  const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  try {
    // Fetch recordings for this call
    const recUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}/Recordings.json`;
    const recRes = await fetch(recUrl, {
      headers: { Authorization: `Basic ${authHeader}` },
    });

    if (!recRes.ok) {
      return res.status(404).json({ error: 'Call not found' });
    }

    const recData = await recRes.json();
    const recordings = recData.recordings || [];

    if (recordings.length === 0) {
      return res.status(404).json({ error: 'No recording for this call' });
    }

    // Use the first recording
    const recordingSid = recordings[0].sid;

    // Stream the MP3 from Twilio
    const mp3Url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;
    const audioRes = await fetch(mp3Url, {
      headers: { Authorization: `Basic ${authHeader}` },
    });

    if (!audioRes.ok) {
      return res.status(404).json({ error: 'Recording audio not found' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `inline; filename="call-${callSid}.mp3"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const buffer = await audioRes.arrayBuffer();
    return res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    console.error('Call recording error:', err);
    return res.status(500).json({ error: 'Failed to fetch recording' });
  }
}
