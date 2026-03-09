// /pages/api/email/format.js
// AI-powered email formatting — takes rough/dictated text and returns
// a professional, well-structured email body using Claude
// Range Medical System

import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { raw_text, recipientName, subject } = req.body;

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
    if (recipientName) contextHints.push(`The recipient's name is ${recipientName}.`);
    if (subject) contextHints.push(`The email subject is: "${subject}".`);

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-20250214',
      max_tokens: 1024,
      system: `You are an email formatter for Range Medical, a regenerative medicine and wellness clinic in Newport Beach, CA. Your job is to take rough, messy, or dictated text and rewrite it as a clear, professional, and warm patient-facing email.

Rules:
- Keep the same meaning and intent — do NOT add information that wasn't in the original
- Use a warm but professional tone appropriate for a medical clinic
- Start with a greeting using the patient's first name if available (e.g., "Hi Sarah,")
- Organize into short, readable paragraphs
- End with a friendly closing line if appropriate (e.g., "Please don't hesitate to reach out if you have any questions.")
- Do NOT include a sign-off like "Best regards" or a name — the email signature is added automatically
- Do NOT include any subject line — just the body
- Do NOT use markdown formatting — just plain text with line breaks
- Keep it concise — patients prefer shorter emails
- If it mentions scheduling, lab results, or follow-ups, make those details clear and easy to find
${contextHints.length > 0 ? '\nContext:\n' + contextHints.join('\n') : ''}`,
      messages: [
        { role: 'user', content: raw_text }
      ],
    });

    const formatted = message.content[0].text;
    return res.status(200).json({ formatted });
  } catch (error) {
    console.error('Email format error:', error);
    return res.status(500).json({ error: 'Failed to format email', details: error.message || String(error) });
  }
}
