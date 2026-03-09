// /pages/api/sms/format.js
// AI-powered SMS formatting — takes rough/dictated text and returns
// a clean, concise patient-facing SMS using Claude
// Range Medical System

import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { raw_text, recipientName } = req.body;

  if (!raw_text || !raw_text.trim()) {
    return res.status(400).json({ error: 'raw_text is required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const contextHints = [];
    if (recipientName) contextHints.push(`The patient's name is ${recipientName}.`);

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: `You are an SMS formatter for Range Medical, a regenerative medicine and wellness clinic in Newport Beach, CA. Your job is to take rough, messy, or dictated text and rewrite it as a clear, warm, and professional text message.

Rules:
- Keep the same meaning and intent — do NOT add information that wasn't in the original
- Keep it concise — SMS messages should be short and to the point
- Use a warm but professional tone
- Start with the patient's first name if available (e.g., "Hi Sarah,")
- Do NOT use markdown or special formatting — plain text only
- Do NOT include a sign-off like "Best, Range Medical" — the clinic name is added automatically
- If it mentions scheduling, lab results, or follow-ups, make those details clear
- Keep it under 300 characters when possible, but prioritize clarity over brevity
- Use natural, conversational language appropriate for a text message
${contextHints.length > 0 ? '\nContext:\n' + contextHints.join('\n') : ''}`,
      messages: [
        { role: 'user', content: raw_text }
      ],
    });

    const formatted = message.content[0].text;
    return res.status(200).json({ formatted });
  } catch (error) {
    console.error('SMS format error:', error);
    return res.status(500).json({ error: 'Failed to format SMS', details: error.message || String(error) });
  }
}
