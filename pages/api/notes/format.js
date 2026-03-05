// /pages/api/notes/format.js
// AI-powered clinical note formatting
// Takes raw text and returns structured clinical note using Claude

import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { raw_text } = req.body;

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

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2048,
      system: `You are a medical note formatter for a regenerative medicine clinic (Range Medical). Take the raw clinical note text and format it into a clean, structured, readable clinical note.

Guidelines:
- Use clear headers and sections where appropriate
- Use bullet points for lists of symptoms, medications, or observations
- Keep all medical information accurate and complete
- Do not add information that was not in the original note
- Do not remove any information from the original note
- If the text is already well-structured, make only minor formatting improvements
- Keep the tone professional and clinical
- Use standard medical abbreviations where appropriate
- Format dates, vitals, and dosages consistently`,
      messages: [
        { role: 'user', content: `Format this clinical note:\n\n${raw_text}` }
      ],
    });

    const formatted = message.content[0].text;
    return res.status(200).json({ formatted });
  } catch (error) {
    console.error('Note format error:', error);
    return res.status(500).json({ error: 'Failed to format note' });
  }
}
