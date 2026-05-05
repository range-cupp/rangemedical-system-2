// /pages/api/notes/create.js
// Create a new clinical note for a patient
// Supports pre-formatted text (from AI preview) or raw text (formats on save)
// UPDATED: 2026-03-17 - Auto-sync weight loss notes to service_logs, vitals, and protocol

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { isWeightLossType } from '../../../lib/protocol-config';
import { todayPacific, nowPacificISO } from '../../../lib/date-utils';
import { buildAdaptiveHRTSchedule, isHRTProtocol } from '../../../lib/hrt-lab-schedule';
import { extractWLFields } from '../../../lib/wl-note-parser';
import { syncWLNoteToServiceLog, isWLEncounter } from '../../../lib/wl-note-sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function isClinicalProvider(createdBy) {
  if (!createdBy) return false;
  const lower = createdBy.toLowerCase();
  return ['burgess', 'brendyn', 'lily', 'evan'].some(key => lower.includes(key))
    || lower.includes('practice fusion');
}

// Tolerant medication-name comparison. Matches exact (case-insensitive) and
// common shorthand ("Reta" → "Retatrutide"). "Other" wildcards through.
function medicationMatches(noteMed, protocolMed) {
  if (!noteMed || !protocolMed) return true;
  const a = String(noteMed).trim().toLowerCase();
  const b = String(protocolMed).trim().toLowerCase();
  if (!a || !b) return true;
  if (a === b) return true;
  if (a === 'other' || b === 'other') return true;
  if (a.length >= 3 && b.includes(a)) return true;
  if (b.length >= 3 && a.includes(b)) return true;
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_id, raw_input, body, created_by, protocol_id, protocol_name, appointment_id, encounter_service, note_category, structured_data, note_date, visit_group_id } = req.body;

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

    // ── Medication-mismatch guard (WL encounter notes) ──
    // A WL encounter note must reference a medication that matches one of the
    // patient's active WL protocols. This blocks the failure mode where staff
    // pick the wrong medication on a charting form and silently create a new
    // protocol/service_log on the wrong drug (Lauren Lopez-Galvez, 2026-04-30).
    // The form-level lock in InteractiveEncounterForm.js seeds the medication
    // from the active protocol; this is the server-side backstop for any path
    // (copy-previous, body-only edits, freetext) that bypasses the form lock.
    {
      const esLower = (encounter_service || '').toLowerCase();
      const isWLEncounter = isWeightLossType(esLower) ||
        esLower.includes('weight') ||
        esLower === 'weight_loss' ||
        structured_data?.form_type === 'weight_loss';

      if (isWLEncounter) {
        const wl = extractWLFields(structured_data, noteBody);
        const noteMed = wl?.medication || null;
        if (noteMed) {
          const { data: activeWL } = await supabase
            .from('protocols')
            .select('id, medication')
            .eq('patient_id', patient_id)
            .ilike('program_type', 'weight_loss%')
            .in('status', ['active', 'in_progress']);

          const activeMeds = (activeWL || [])
            .map(p => p.medication)
            .filter(Boolean);

          // If we have at least one active WL protocol with a medication on
          // file, require the note to reference one of those medications. We
          // only enforce when there's a baseline to compare against — if no
          // protocol exists yet (e.g. brand-new patient charted before
          // checkout), there's nothing to mismatch against.
          if (activeMeds.length > 0) {
            const matches = activeMeds.some(m => medicationMatches(noteMed, m));
            if (!matches) {
              return res.status(409).json({
                error: `This note lists ${noteMed}, but the patient's active weight loss protocol is ${activeMeds.join(' / ')}. Notes can't change a patient's medication. Cancel this note and re-open the form, or update the protocol from the Meds tab first.`,
                code: 'medication_mismatch',
                note_medication: noteMed,
                active_medications: activeMeds,
              });
            }
          }
        }
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
        note_date: note_date || nowPacificISO(),
        source: (appointment_id || encounter_service) ? 'encounter' : (protocol_id ? 'protocol' : 'manual'),
        status: 'draft',
        protocol_id: protocol_id || null,
        protocol_name: protocol_name || null,
        appointment_id: appointment_id || null,
        encounter_service: encounter_service || null,
        note_category: note_category === 'internal' ? 'internal'
          : (isClinicalProvider(created_by) && (note_category === 'clinical' || appointment_id || encounter_service || protocol_id)) ? 'clinical'
          : 'internal',
        visit_group_id: visit_group_id || null,
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
          note_date: nowPacificISO(),
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

    // ── Auto-complete "Document encounter" task when note is created ──
    const resolvedApptId = data.appointment_id || appointment_id;
    if (resolvedApptId) {
      try {
        await supabase
          .from('tasks')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('appointment_id', resolvedApptId)
          .eq('status', 'pending')
          .ilike('title', 'Document encounter%');

        console.log(`Auto-completed encounter task for appointment ${resolvedApptId}`);
      } catch (taskErr) {
        console.error('Task auto-complete error (non-fatal):', taskErr.message);
      }
    }

    // ── Weight Loss: Sync note data → service_logs, protocol, vitals ──
    // Detect weight loss encounter by encounter_service string or form type
    const esLower = (encounter_service || '').toLowerCase();
    const isWLNote = isWLEncounter(encounter_service) ||
      structured_data?.form_type === 'weight_loss';

    // Surfaces back to the UI if we stripped a dose write; the client should
    // prompt staff to use the Dose Change modal to get Burgess approval.
    let doseGuardBlocked = false;
    let doseGuardReason = null;

    if (isWLNote) {
      try {
        const syncResult = await syncWLNoteToServiceLog(supabase, {
          id: data.id,
          patient_id,
          body: noteBody,
          structured_data,
          encounter_service,
          source: 'encounter',
          note_date,
          created_by,
          appointment_id: data.appointment_id || appointment_id,
        }, {
          approvedDoseChangeRequestId: req.body.approved_dose_change_request_id,
        });

        if (syncResult.synced) {
          if (syncResult.doseGuardBlocked) {
            doseGuardBlocked = true;
            doseGuardReason = syncResult.doseGuardReason;
          }
          console.log(`[wl-sync] note ${data.id} → service_log ${syncResult.serviceLogId} (sessions ${syncResult.sessionsUsed}/${syncResult.totalSessions})`);
        } else {
          console.warn(`[wl-sync] note ${data.id} not synced: ${syncResult.reason}`);
        }
      } catch (syncErr) {
        // Don't fail the note save if sync fails
        console.error('Weight loss sync error (non-fatal):', syncErr.message);
      }
    }


    // ── Blood Draw: Auto-log follow-up lab on HRT protocol ──
    // Check both encounter_service AND note body for blood draw keywords
    const bodyLower = (noteBody || '').toLowerCase();
    const bloodDrawKeywords = ['blood draw', 'blood_draw', 'venipuncture', 'phlebotomy', 'lab draw'];
    const isBloodDrawEncounter = bloodDrawKeywords.some(kw => esLower.includes(kw)) ||
      bloodDrawKeywords.some(kw => bodyLower.includes(kw));

    if (isBloodDrawEncounter && patient_id) {
      try {
        const logDate = note_date
          ? new Date(note_date).toISOString().split('T')[0]
          : todayPacific();

        // Find active HRT protocols for this patient
        const { data: hrtProtocols } = await supabase
          .from('protocols')
          .select('id, patient_id, program_type, start_date, first_followup_weeks')
          .eq('patient_id', patient_id)
          .in('status', ['active', 'in_progress'])
          .order('created_at', { ascending: false });

        const activeHRT = (hrtProtocols || []).filter(p => isHRTProtocol(p.program_type));

        for (const protocol of activeHRT) {
          // Get existing blood draw logs for this protocol
          const { data: existingLogs } = await supabase
            .from('protocol_logs')
            .select('*')
            .eq('protocol_id', protocol.id)
            .eq('log_type', 'blood_draw');

          // Get labs and lab protocols for adaptive schedule
          const { data: labs } = await supabase
            .from('labs')
            .select('id, test_date, completed_date')
            .eq('patient_id', patient_id);

          const { data: labProtocols } = await supabase
            .from('protocols')
            .select('id, start_date, status, program_name, notes')
            .eq('patient_id', patient_id)
            .eq('program_type', 'labs');

          // Build the adaptive schedule
          const schedule = buildAdaptiveHRTSchedule(
            protocol.start_date,
            protocol.first_followup_weeks || 8,
            existingLogs || [],
            labs || [],
            labProtocols || []
          );

          // Find the next due draw (overdue first, then upcoming)
          const nextDraw = schedule.find(d => d.status === 'overdue') ||
            schedule.find(d => d.status === 'upcoming');

          if (nextDraw) {
            // Check if this draw label already has a log
            const alreadyLogged = (existingLogs || []).some(l => l.notes === nextDraw.label);
            if (!alreadyLogged) {
              // Log the blood draw
              await supabase
                .from('protocol_logs')
                .insert({
                  protocol_id: protocol.id,
                  patient_id,
                  log_type: 'blood_draw',
                  log_date: logDate,
                  notes: nextDraw.label,
                });

              // Sync matching lab protocol to awaiting_results
              const windowDays = 28;
              const logDateMs = new Date(logDate + 'T00:00:00').getTime();
              const windowMs = windowDays * 24 * 60 * 60 * 1000;

              const { data: labProtos } = await supabase
                .from('protocols')
                .select('id, start_date, program_name, notes')
                .eq('patient_id', patient_id)
                .eq('program_type', 'labs')
                .eq('status', 'draw_scheduled');

              if (labProtos && labProtos.length > 0) {
                let matchId = null;
                for (const lp of labProtos) {
                  if ((lp.program_name || '').includes(nextDraw.label) || (lp.notes || '').includes(nextDraw.label)) {
                    matchId = lp.id;
                    break;
                  }
                }
                if (!matchId) {
                  for (const lp of labProtos) {
                    if (lp.start_date) {
                      const lpMs = new Date(lp.start_date + 'T00:00:00').getTime();
                      if (Math.abs(lpMs - logDateMs) <= windowMs) {
                        matchId = lp.id;
                        break;
                      }
                    }
                  }
                }
                if (matchId) {
                  await supabase
                    .from('protocols')
                    .update({ status: 'awaiting_results', updated_at: new Date().toISOString() })
                    .eq('id', matchId);
                  console.log(`Blood draw encounter: synced lab protocol ${matchId} to awaiting_results`);
                }
              }

              console.log(`Blood draw encounter: logged ${nextDraw.label} for HRT protocol ${protocol.id}`);
            }
          }
        }
      } catch (bloodDrawErr) {
        console.error('Blood draw HRT sync error (non-fatal):', bloodDrawErr.message);
      }
    }

    return res.status(201).json({
      note: data,
      dose_change_blocked: doseGuardBlocked,
      dose_change_blocked_reason: doseGuardReason,
    });
  } catch (error) {
    console.error('Note create error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create note' });
  }
}
