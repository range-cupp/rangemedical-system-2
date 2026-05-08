// /pages/api/voice-agent/token.js
// Generates a Retell access token for web-based voice calls.
// The frontend calls this to get a short-lived token before starting a call.

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'RETELL_API_KEY not configured' });
  }

  try {
    const response = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: process.env.RETELL_AGENT_ID || 'agent_83d9113dd29c88cabd052fbdab',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Retell create-web-call error:', errText);
      return res.status(500).json({ error: 'Failed to create voice call' });
    }

    const data = await response.json();
    return res.status(200).json({ access_token: data.access_token });
  } catch (err) {
    console.error('Retell token error:', err);
    return res.status(500).json({ error: 'Failed to create voice call' });
  }
}
