// /pages/api/notes/create.js
// Create a new clinical note for a patient
// Supports pre-formatted text (from AI preview) or raw text (formats on save)

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_id, raw_input, body, created_by, protocol_id, protocol_name, appointment_id, encounter_service, note_category } = req.body;

  if (!patient_id) {
    return res.status(400).json({ error: 'patient_id is required' });
  }
  if (!raw_input && !body) {
    return res.status(400).json({ error: 'Note content is required' });
  }

  try {
    // If body is provided, use it directly (user already previewed/edited the AI-formatted text)
    // If only raw_input provided, format with AI first
    let noteBody = body;

    if (!noteBody && raw_input) {
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
          });

          const message = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 2048,
            system: `You are a medical note formatter for a regenerative medicine clinic (Range Medical). Take the raw clinical note text and format it into a clean, structured, readable clinical note. Keep all medical information accurate and complete. Do not add or remove information.`,
            messages: [
              { role: 'user', content: `Format this clinical note:\n\n${raw_input}` }
            ],
          });

          noteBody = message.content[0].text;
        } catch (aiError) {
          console.error('AI formatting failed, saving raw text:', aiError.message);
          noteBody = raw_input;
        }
      } else {
        // No API key — save raw text as-is
        noteBody = raw_input;
      }
    }

    // Try with new columns first, fallback to base columns if migration hasn't run
    let data, error;
    ({ data, error } = await supabase
      .from('patient_notes')
      .insert({
        patient_id,
        body: noteBody,
        raw_input: raw_input || null,
        created_by: created_by || null,
        note_date: new Date().toISOString(),
        source: appointment_id ? 'encounter' : (protocol_id ? 'protocol' : 'manual'),
        status: 'draft',
        protocol_id: protocol_id || null,
        protocol_name: protocol_name || null,
        appointment_id: appointment_id || null,
        encounter_service: encounter_service || null,
        note_category: note_category || (appointment_id ? 'clinical' : (protocol_id ? 'clinical' : 'internal')),
      })
      .select()
      .single());

    if (error && error.message?.includes('column')) {
      // Fallback: insert without new columns (migration not run yet)
      ({ data, error } = await supabase
        .from('patient_notes')
        .insert({
          patient_id,
          body: noteBody,
          note_date: new Date().toISOString(),
          source: 'manual',
        })
        .select()
        .single());
    }

    if (error) throw error;

    return res.status(201).json({ note: data });
  } catch (error) {
    console.error('Note create error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create note' });
  }
}
