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

  const { patient_id, raw_input, body, created_by, protocol_id, protocol_name, appointment_id, encounter_service, note_category, structured_data, note_date } = req.body;

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
        note_date: note_date || new Date().toISOString(),
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

    // ── Weight Loss: Log weight to protocol if structured_data has weight ──
    if (structured_data?.weight_vitals?.current_weight && encounter_service === 'weight_loss') {
      try {
        const weight = parseFloat(structured_data.weight_vitals.current_weight);
        if (!isNaN(weight)) {
          const logDate = note_date
            ? new Date(note_date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

          // Find the patient's active weight loss protocol
          const { data: protocols } = await supabase
            .from('protocols')
            .select('id, starting_weight')
            .eq('patient_id', patient_id)
            .in('category', ['weight_loss'])
            .in('status', ['active', 'in_progress'])
            .order('created_at', { ascending: false })
            .limit(1);

          const activeProtocol = protocols?.[0];

          if (activeProtocol) {
            // Upsert weight log for today
            const { data: existing } = await supabase
              .from('weight_logs')
              .select('id')
              .eq('protocol_id', activeProtocol.id)
              .eq('log_date', logDate)
              .maybeSingle();

            if (existing) {
              await supabase
                .from('weight_logs')
                .update({ weight, notes: `Via encounter note by ${created_by || 'Staff'}` })
                .eq('id', existing.id);
            } else {
              await supabase
                .from('weight_logs')
                .insert({
                  protocol_id: activeProtocol.id,
                  log_date: logDate,
                  weight,
                  notes: `Via encounter note by ${created_by || 'Staff'}`,
                });
            }

            // If no starting weight on protocol, set it
            if (!activeProtocol.starting_weight && structured_data.weight_vitals.starting_weight) {
              const startWeight = parseFloat(structured_data.weight_vitals.starting_weight);
              if (!isNaN(startWeight)) {
                await supabase
                  .from('protocols')
                  .update({ starting_weight: startWeight })
                  .eq('id', activeProtocol.id);
              }
            }

            console.log(`Weight ${weight} lbs logged to protocol ${activeProtocol.id} for patient ${patient_id}`);
          } else {
            console.log(`No active weight loss protocol found for patient ${patient_id} — weight not logged to protocol`);
          }
        }
      } catch (weightErr) {
        // Don't fail the note save if weight logging fails
        console.error('Weight logging error (non-fatal):', weightErr.message);
      }
    }

    return res.status(201).json({ note: data });
  } catch (error) {
    console.error('Note create error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create note' });
  }
}
