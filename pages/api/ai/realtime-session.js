export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { instructions, tools } = req.body;

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview',
        voice: 'coral',
        instructions: instructions || '',
        tools: tools || [],
        tool_choice: 'auto',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: { model: 'whisper-1' },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 700,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI Realtime session error:', err);
      return res.status(response.status).json({ error: 'Failed to create session' });
    }

    const data = await response.json();
    return res.status(200).json({ clientSecret: data.client_secret?.value, expiresAt: data.client_secret?.expires_at });
  } catch (err) {
    console.error('Realtime session error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
