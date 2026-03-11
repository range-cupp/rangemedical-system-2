// /pages/api/notes/format.js
// AI-powered clinical note formatting
// Takes raw text and optional note_type, returns structured clinical note using Claude

import Anthropic from '@anthropic-ai/sdk';
import { getFormatPromptForNoteType } from '../../../lib/encounter-templates';

const BASE_RULES = `Rules:
- Keep the same meaning and intent — do NOT add information that wasn't in the original
- Clean up grammar, punctuation, and organization
- Use bullet points (•) for lists of items
- Keep it concise and professional
- Do not include markdown formatting like ** or ## — just plain text
- Section headers should be in ALL CAPS if used
- If the input is already clean and organized, make minimal changes`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { raw_text, note_type } = req.body;

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

    // Build system prompt based on note type
    let systemPrompt;

    if (note_type && note_type !== 'progress') {
      const typePrompt = getFormatPromptForNoteType(note_type);
      systemPrompt = `You are a clinical note formatter for Range Medical, a regenerative medicine clinic. Your job is to take messy, raw, or dictated text and clean it up into a professional, structured clinical note.

${typePrompt}

${BASE_RULES}`;
    } else {
      // Default adaptive formatting (original behavior)
      systemPrompt = `You are a clinical note formatter for Range Medical, a regenerative medicine clinic. Your job is to take messy, raw, or dictated text and clean it up into a professional note.

Adapt your format to match the content:

For CLINICAL VISIT NOTES (treatments, visits, procedures), use sections like:
VISIT SUMMARY • TREATMENT • VITALS • ASSESSMENT • PLAN
Only include sections that have relevant information from the input.

For GENERAL NOTES (phone calls, follow-ups, reminders, observations, conversations), just clean up the language into clear, organized paragraphs or bullet points. Do not force clinical sections onto non-clinical content.

${BASE_RULES}`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: systemPrompt,
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
