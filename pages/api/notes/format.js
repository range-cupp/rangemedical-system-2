// /pages/api/notes/format.js
// AI-powered clinical note formatting
// Takes raw text and optional note_type, returns structured clinical note using Claude

import Anthropic from '@anthropic-ai/sdk';
import { getFormatPromptForNoteType } from '../../../lib/encounter-templates';
import { getStaffRole } from '../../../lib/staff-config';

const BASE_RULES = `Rules:
- Keep the same meaning and intent — do NOT add information that wasn't in the original
- Clean up grammar, punctuation, and organization
- Use bullet points (•) for lists of items
- Keep it concise and professional
- Section headers (like SUBJECTIVE, HISTORY OF PRESENT ILLNESS, ASSESSMENT, PLAN, etc.) must be in ALL CAPS and wrapped in **bold** markdown (e.g. **SUBJECTIVE**)
- Do NOT use emoji, symbols, or decorative markers (like 📌, 🔹, ▸, ►, etc.) next to section headers — just bold all-caps text
- Do not use ## or other heading markdown — only **bold** for headers
- If the input is already clean and organized, make minimal changes`;

// Tone guidance based on author's role
const ROLE_TONE = {
  provider: '', // providers (NPs, MDs) — default clinical tone, no extra guidance needed
  clinical: `The author is a registered nurse. Write in a clinical but observational tone — document what was done, observed, or communicated. Do not write as if the author is making diagnoses or medical decisions.`,
  admin: `The author is non-clinical staff (front desk, management, operations). Write in a clear, professional, conversational tone — NOT clinical or provider-like. Do not use clinical terminology, assessment language, or phrases like "patient presents with" or "plan of care." Just clean up the note into clear, organized language appropriate for an internal staff memo.`,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { raw_text, note_type, vitals, author_email, note_context } = req.body;

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

    // Determine author role for tone adjustment
    const authorRole = getStaffRole(author_email);
    const roleTone = ROLE_TONE[authorRole] || '';

    // Build system prompt based on note type
    let systemPrompt;

    // Staff notes from non-provider/non-clinical authors get a simpler formatter
    if (note_context === 'staff_note' && authorRole === 'admin') {
      systemPrompt = `You are a note formatter for Range Medical, a regenerative medicine clinic. Your job is to take messy, raw, or dictated text and clean it up into a professional internal staff note.

${roleTone}

${BASE_RULES}`;
    } else if (note_type && note_type !== 'progress') {
      const typePrompt = getFormatPromptForNoteType(note_type);
      systemPrompt = `You are a clinical note formatter for Range Medical, a regenerative medicine clinic. Your job is to take messy, raw, or dictated text and clean it up into a professional, structured clinical note.

${roleTone ? roleTone + '\n\n' : ''}${typePrompt}

${BASE_RULES}`;
    } else {
      // Default adaptive formatting (original behavior)
      systemPrompt = `You are a ${authorRole === 'admin' ? 'note' : 'clinical note'} formatter for Range Medical, a regenerative medicine clinic. Your job is to take messy, raw, or dictated text and clean it up into a professional note.

${roleTone ? roleTone + '\n\n' : ''}Adapt your format to match the content:

${authorRole !== 'admin' ? `For CLINICAL VISIT NOTES (treatments, visits, procedures), use sections like:
VISIT SUMMARY • TREATMENT • VITALS • ASSESSMENT • PLAN
Only include sections that have relevant information from the input.

` : ''}For GENERAL NOTES (phone calls, follow-ups, reminders, observations, conversations), just clean up the language into clear, organized paragraphs or bullet points. Do not force clinical sections onto non-clinical content.

${BASE_RULES}`;
    }

    // Build user content — prepend vitals if provided (for SOAP OBJECTIVE section)
    let userContent = raw_text;
    if (vitals && typeof vitals === 'object') {
      const vLines = [];
      if (vitals.height_inches) {
        const ft = Math.floor(vitals.height_inches / 12);
        const inc = Math.round(vitals.height_inches % 12);
        vLines.push(`Height: ${ft}'${inc}"`);
      }
      if (vitals.weight_lbs) vLines.push(`Weight: ${vitals.weight_lbs} lbs`);
      if (vitals.bmi) vLines.push(`BMI: ${vitals.bmi}`);
      if (vitals.bp_systolic && vitals.bp_diastolic) vLines.push(`BP: ${vitals.bp_systolic}/${vitals.bp_diastolic} mmHg`);
      if (vitals.pulse) vLines.push(`Pulse: ${vitals.pulse} bpm`);
      if (vitals.temperature) vLines.push(`Temp: ${vitals.temperature}°F`);
      if (vitals.respiratory_rate) vLines.push(`RR: ${vitals.respiratory_rate}`);
      if (vitals.o2_saturation) vLines.push(`SpO2: ${vitals.o2_saturation}%`);

      if (vLines.length > 0) {
        userContent = `VITALS (include in OBJECTIVE section):\n${vLines.join('\n')}\n\nCLINICAL NOTE:\n${raw_text}`;
      }
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userContent }
      ],
    });

    const formatted = message.content[0].text;
    return res.status(200).json({ formatted });
  } catch (error) {
    console.error('Note format error:', error);
    return res.status(500).json({ error: 'Failed to format note' });
  }
}
