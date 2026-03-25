// /pages/api/notes/create.js
// Create a new clinical note for a patient
// Supports pre-formatted text (from AI preview) or raw text (formats on save)
// UPDATED: 2026-03-17 - Auto-sync weight loss notes to service_logs, vitals, and protocol

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { isWeightLossType } from '../../../lib/protocol-config';
import { todayPacific } from '../../../lib/date-utils';

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

    // ── Auto-create appointment if encounter note has no linked appointment ──
    // When staff creates an encounter note for a patient with no appointment today,
    // automatically create a visit on the schedule under the note author
    if (!appointment_id && encounter_service && patient_id) {
      try {
        const noteDay = note_date
          ? new Date(note_date).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
          : todayPacific();

        // Check if patient already has an appointment today
        const dayStart = `${noteDay}T00:00:00-08:00`;
        const dayEnd = `${noteDay}T23:59:59-08:00`;

        const { data: existingAppts } = await supabase
          .from('appointments')
          .select('id')
          .eq('patient_id', patient_id)
          .gte('start_time', dayStart)
          .lte('start_time', dayEnd)
          .not('status', 'in', '("cancelled","no_show")')
          .limit(1);

        if (!existingAppts || existingAppts.length === 0) {
          // Look up patient name
          const { data: patientRow } = await supabase
            .from('patients')
            .select('name, phone')
            .eq('id', patient_id)
            .single();

          if (patientRow) {
            // Use the note_date time or current time for the appointment
            const apptTime = note_date ? new Date(note_date) : new Date();
            const startTime = apptTime.toISOString();
            const endTime = new Date(apptTime.getTime() + 30 * 60 * 1000).toISOString();

            const { data: newAppt } = await supabase
              .from('appointments')
              .insert({
                patient_id,
                patient_name: patientRow.name,
                patient_phone: patientRow.phone || null,
                service_name: encounter_service,
                provider: created_by || null,
                location: 'Range Medical — Newport Beach',
                start_time: startTime,
                end_time: endTime,
                duration_minutes: 30,
                status: 'completed',
                source: 'encounter_note',
                created_by: created_by || null,
                notes: 'Auto-created from encounter note',
              })
              .select('id')
              .single();

            if (newAppt) {
              // Link the note to the new appointment
              await supabase
                .from('patient_notes')
                .update({ appointment_id: newAppt.id })
                .eq('id', data.id);

              data.appointment_id = newAppt.id;

              // Log the event
              await supabase.from('appointment_events').insert({
                appointment_id: newAppt.id,
                event_type: 'created',
                new_status: 'completed',
                metadata: { created_by, source: 'encounter_note', auto_created: true },
              });

              console.log(`Auto-created appointment ${newAppt.id} from encounter note for ${patientRow.name}`);
            }
          }
        }
      } catch (apptErr) {
        // Don't fail the note save if auto-appointment creation fails
        console.error('Auto-appointment creation error (non-fatal):', apptErr.message);
      }
    }

    // ── Weight Loss: Sync note data → service_logs, protocol, vitals ──
    // Detect weight loss encounter by encounter_service string or form type
    const esLower = (encounter_service || '').toLowerCase();
    const isWLEncounter = isWeightLossType(esLower) ||
      esLower.includes('weight') ||
      esLower === 'weight_loss' ||
      structured_data?.form_type === 'weight_loss';

    if (isWLEncounter && structured_data?.weight_vitals?.current_weight) {
      try {
        const weight = parseFloat(structured_data.weight_vitals.current_weight);
        const dose = structured_data?.medication?.dose || null;
        const medication = structured_data?.medication?.medication_name || null;
        const logDate = note_date
          ? new Date(note_date).toISOString().split('T')[0]
          : todayPacific();

        if (!isNaN(weight)) {
          // Find the patient's active weight loss protocol
          const { data: protocols } = await supabase
            .from('protocols')
            .select('id, starting_weight, sessions_used, total_sessions, selected_dose, dose, patient_id')
            .eq('patient_id', patient_id)
            .in('category', ['weight_loss'])
            .in('status', ['active', 'in_progress'])
            .order('created_at', { ascending: false })
            .limit(1);

          const activeProtocol = protocols?.[0];

          if (activeProtocol) {
            // 1. Create service_logs entry (source of truth for protocol session table)
            const { data: existingServiceLog } = await supabase
              .from('service_logs')
              .select('id')
              .eq('patient_id', patient_id)
              .eq('category', 'weight_loss')
              .eq('entry_date', logDate)
              .neq('entry_type', 'pickup')
              .maybeSingle();

            if (existingServiceLog) {
              // Update existing entry for today
              await supabase
                .from('service_logs')
                .update({
                  weight,
                  dosage: dose,
                  medication: medication,
                  notes: `Via encounter note by ${created_by || 'Staff'}`,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingServiceLog.id);
              console.log(`Updated service_log ${existingServiceLog.id} for ${logDate}`);
            } else {
              // Create new service log entry
              await supabase
                .from('service_logs')
                .insert({
                  patient_id,
                  protocol_id: activeProtocol.id,
                  category: 'weight_loss',
                  entry_type: 'injection',
                  entry_date: logDate,
                  medication: medication,
                  dosage: dose,
                  weight,
                  notes: `Via encounter note by ${created_by || 'Staff'}`,
                  administered_by: created_by || null,
                });
              console.log(`Created service_log for weight loss on ${logDate}`);
            }

            // 2. Update protocol: dose + sessions_used + starting_weight
            const protocolUpdates = {
              updated_at: new Date().toISOString(),
            };

            // Update dose on protocol if provided
            if (dose) {
              protocolUpdates.selected_dose = dose;
              protocolUpdates.dose = dose;
            }

            // Increment sessions_used only if we created a new service log (not updating existing)
            if (!existingServiceLog) {
              protocolUpdates.sessions_used = (activeProtocol.sessions_used || 0) + 1;
            }

            // Set starting weight if not already set
            if (!activeProtocol.starting_weight && structured_data.weight_vitals.starting_weight) {
              const startWeight = parseFloat(structured_data.weight_vitals.starting_weight);
              if (!isNaN(startWeight)) {
                protocolUpdates.starting_weight = startWeight;
              }
            }

            await supabase
              .from('protocols')
              .update(protocolUpdates)
              .eq('id', activeProtocol.id);

            console.log(`Protocol ${activeProtocol.id} updated: dose=${dose}, weight=${weight}`);

            // 3. Also log to weight_logs for backwards compatibility
            const { data: existingWeightLog } = await supabase
              .from('weight_logs')
              .select('id')
              .eq('protocol_id', activeProtocol.id)
              .eq('log_date', logDate)
              .maybeSingle();

            if (existingWeightLog) {
              await supabase
                .from('weight_logs')
                .update({ weight, notes: `Via encounter note by ${created_by || 'Staff'}` })
                .eq('id', existingWeightLog.id);
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
          } else {
            console.log(`No active weight loss protocol found for patient ${patient_id}`);
          }

          // 4. Save to patient_vitals (powers the overview vitals table)
          try {
            const vitalsData = {
              patient_id,
              weight_lbs: weight,
              recorded_by: created_by || 'Staff',
              recorded_at: new Date().toISOString(),
            };

            // If there's an appointment_id, upsert by appointment
            if (appointment_id) {
              vitalsData.appointment_id = appointment_id;
              const { data: existingVitals } = await supabase
                .from('patient_vitals')
                .select('id')
                .eq('appointment_id', appointment_id)
                .maybeSingle();

              if (existingVitals) {
                await supabase
                  .from('patient_vitals')
                  .update(vitalsData)
                  .eq('id', existingVitals.id);
              } else {
                await supabase
                  .from('patient_vitals')
                  .insert(vitalsData);
              }
            } else {
              // No appointment — create standalone vitals record
              await supabase
                .from('patient_vitals')
                .insert(vitalsData);
            }
            console.log(`Vitals saved: weight=${weight} lbs for patient ${patient_id}`);
          } catch (vitalsErr) {
            console.error('Vitals save error (non-fatal):', vitalsErr.message);
          }
        }
      } catch (syncErr) {
        // Don't fail the note save if sync fails
        console.error('Weight loss sync error (non-fatal):', syncErr.message);
      }
    }

    return res.status(201).json({ note: data });
  } catch (error) {
    console.error('Note create error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create note' });
  }
}
