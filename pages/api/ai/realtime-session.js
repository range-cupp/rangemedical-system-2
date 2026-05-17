export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { instructions, tools } = req.body;

  try {
    const body = {
      session: {
        type: 'realtime',
        model: 'gpt-4o-mini-realtime-preview',
        instructions: instructions || '',
        tools: tools || [],
        tool_choice: 'auto',
        audio: {
          input: {
            format: { type: 'audio/pcm' },
            turn_detection: { type: 'server_vad' },
            transcription: { model: 'gpt-4o-mini-transcribe' },
          },
          output: {
            format: { type: 'audio/pcm' },
            voice: 'coral',
          },
        },
      },
    };

    console.log('Creating realtime client_secret with model:', body.session.model);

    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    if (!response.ok) {
      console.error('OpenAI client_secret error:', response.status, text);
      return res.status(response.status).json({ error: 'Failed to create session', detail: text });
    }

    const data = JSON.parse(text);
    const secret = data.client_secret?.value || data.value || data.client_secret;
    console.log('Client secret created, keys:', Object.keys(data), 'has secret:', !!secret);
    return res.status(200).json({
      clientSecret: secret,
      expiresAt: data.client_secret?.expires_at || data.expires_at,
      model: body.session.model,
    });
  } catch (err) {
    console.error('Realtime session error:', err.message || err);
    return res.status(500).json({ error: 'Internal error', detail: err.message });
  }
}
