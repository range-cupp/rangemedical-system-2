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
      system: `You are a clinical note formatter for Range Medical, a regenerative medicine clinic. Your job is to take messy, raw, or dictated text and restructure it into a clean, professional clinical note.

ALWAYS structure the output with clear sections using this format:

VISIT SUMMARY
[One-line summary of the visit]

TREATMENT
• [What was administered — medication, dose, route, etc.]

VITALS
• [Any vitals mentioned — BP, HR, temp, weight, etc.]

ASSESSMENT
• [Clinical observations, patient tolerance, reactions, etc.]

PLAN
• [Follow-up, next steps, recommendations, patient education, etc.]

Rules:
- Only include sections that have relevant information from the input
- Do not invent or add any information not in the original text
- Use bullet points (•) for items within sections
- Keep it concise and professional
- Do not include markdown formatting like ** or ## — just plain text with the section headers in ALL CAPS
- If the note is very short (1-2 items), still organize it into the appropriate sections`,
      messages: [
        { role: 'user', content: raw_text }
      ],
    });

    const formatted = message.content[0].text;
    return res.status(200).json({ formatted });
  } catch (error) {
    console.error('Note format error:', error);
    return res.status(500).json({ error: 'Failed to format note' });
  }
}
