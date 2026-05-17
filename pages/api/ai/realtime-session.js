export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { instructions, tools } = req.body;

  try {
    const body = {
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'coral',
      modalities: ['audio', 'text'],
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
    };

    console.log('Creating realtime session with model:', body.model);

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    if (!response.ok) {
      console.error('OpenAI Realtime session error:', response.status, text);
      return res.status(response.status).json({ error: 'Failed to create session', detail: text });
    }

    const data = JSON.parse(text);
    const secret = data.client_secret?.value || data.client_secret;
    console.log('Realtime session created, has secret:', !!secret, 'keys:', Object.keys(data));
    return res.status(200).json({ clientSecret: secret, expiresAt: data.client_secret?.expires_at });
  } catch (err) {
    console.error('Realtime session error:', err.message || err);
    return res.status(500).json({ error: 'Internal error', detail: err.message });
  }
}
