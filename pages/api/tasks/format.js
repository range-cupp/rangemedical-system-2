// /pages/api/tasks/format.js
// AI-powered task description formatting
// Takes rough/dictated text and returns a clear, actionable task description
// Range Medical System

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
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: `You are a task formatter for Range Medical, a regenerative medicine clinic. Your job is to take rough, messy, or dictated text and rewrite it as a clear, actionable task description.

Rules:
- Keep the same meaning and intent — do NOT add information that wasn't in the original
- Make it clear and concise — focus on the action needed
- Use professional but casual tone appropriate for internal team communication
- Start with the action verb when possible (e.g., "Prepare peptides for...", "Call patient to...")
- Include specific names, times, or details that were mentioned
- Do NOT use markdown formatting — plain text only
- Keep it to 1-3 sentences max
- If it mentions a patient pickup, delivery, or follow-up, make the timing clear`,
      messages: [
        { role: 'user', content: raw_text }
      ],
    });

    const formatted = message.content[0].text;
    return res.status(200).json({ formatted });
  } catch (error) {
    console.error('Task format error:', error);
    return res.status(500).json({ error: 'Failed to format task', details: error.message || String(error) });
  }
}
