// /pages/api/protocols/[id]/log-blood-draw.js
// Log or update a blood draw for an HRT protocol
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { addGHLNote } from '../../../../lib/ghl-sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { drawLabel, completedDate, action } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  if (!drawLabel) {
    return res.status(400).json({ error: 'Draw label required (e.g. "Initial Labs", "8-Week Labs")' });
  }

  try {
    // Get protocol with patient info
    const { data: protocol, error: fetchError } = await supabase
      .from('protocols')
      .select('*, patients(id, name, ghl_contact_id)')
      .eq('id', id)
      .single();

    if (fetchError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const patientName = protocol.patients?.name || 'Unknown Patient';
    const ghlContactId = protocol.patients?.ghl_contact_id;

    // Check for existing blood_draw log with this label
    const { data: existingLogs } = await supabase
      .from('protocol_logs')
      .select('*')
      .eq('protocol_id', id)
      .eq('log_type', 'blood_draw')
      .eq('notes', drawLabel);

    if (action === 'undo') {
      // Remove the blood draw log
      if (existingLogs && existingLogs.length > 0) {
        await supabase
          .from('protocol_logs')
          .delete()
          .eq('id', existingLogs[0].id);

        // Sync: revert matching lab protocol back to draw_scheduled
        try {
          const { data: labProtos } = await supabase
            .from('protocols')
            .select('id, start_date, program_name, notes')
            .eq('patient_id', protocol.patient_id)
            .eq('program_type', 'labs')
            .eq('status', 'blood_draw_complete');

          if (labProtos && labProtos.length > 0) {
            let matchId = null;
            for (const lp of labProtos) {
              if ((lp.program_name || '').includes(drawLabel) || (lp.notes || '').includes(drawLabel)) {
                matchId = lp.id;
                break;
              }
            }
            if (matchId) {
              await supabase
                .from('protocols')
                .update({ status: 'draw_scheduled', updated_at: new Date().toISOString() })
                .eq('id', matchId);
              console.log(`✓ Synced lab protocol ${matchId} back to draw_scheduled`);
            }
          }
        } catch (syncErr) {
          console.error('Lab undo sync error (non-fatal):', syncErr);
        }

        console.log(`✓ Blood draw undone: ${drawLabel} for ${patientName}`);

        return res.status(200).json({
          success: true,
          message: `${drawLabel} marked as not completed`,
          action: 'undone'
        });
      }
      return res.status(200).json({ success: true, message: 'No log found to undo' });
    }

    // Mark as completed
    const logDate = completedDate || new Date().toISOString().split('T')[0];

    if (existingLogs && existingLogs.length > 0) {
      // Update existing log date
      await supabase
        .from('protocol_logs')
        .update({ log_date: logDate })
        .eq('id', existingLogs[0].id);
    } else {
      // Create new blood draw log
      await supabase
        .from('protocol_logs')
        .insert({
          protocol_id: id,
          patient_id: protocol.patient_id,
          log_type: 'blood_draw',
          log_date: logDate,
          notes: drawLabel
        });
    }

    // Sync: advance matching auto-scheduled lab protocol to blood_draw_complete
    try {
      const windowDays = 28;
      const logDateMs = new Date(logDate + 'T00:00:00').getTime();
      const windowMs = windowDays * 24 * 60 * 60 * 1000;

      // Find matching lab protocol: same patient, draw_scheduled, start_date within ±28 days
      const { data: labProtos } = await supabase
        .from('protocols')
        .select('id, start_date, program_name, notes')
        .eq('patient_id', protocol.patient_id)
        .eq('program_type', 'labs')
        .eq('status', 'draw_scheduled');

      if (labProtos && labProtos.length > 0) {
        // Find best match: by label first, then by date proximity
        let matchId = null;
        for (const lp of labProtos) {
          if ((lp.program_name || '').includes(drawLabel) || (lp.notes || '').includes(drawLabel)) {
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
            .update({ status: 'blood_draw_complete', updated_at: new Date().toISOString() })
            .eq('id', matchId);
          console.log(`✓ Synced lab protocol ${matchId} to blood_draw_complete`);
        }
      }
    } catch (syncErr) {
      console.error('Lab sync error (non-fatal):', syncErr);
    }

    // Add note to GHL
    if (ghlContactId) {
      const ghlNote = `🩸 BLOOD DRAW COMPLETED\n\nPatient: ${patientName}\nDraw: ${drawLabel}\nDate: ${logDate}`;
      try {
        await addGHLNote(ghlContactId, ghlNote);
      } catch (ghlError) {
        console.error('GHL note error (non-fatal):', ghlError);
      }
    }

    console.log(`✓ Blood draw logged: ${drawLabel} for ${patientName} on ${logDate}`);

    return res.status(200).json({
      success: true,
      message: `${drawLabel} marked as completed`,
      logDate,
      action: 'completed'
    });

  } catch (error) {
    console.error('Error logging blood draw:', error);
    return res.status(500).json({ error: error.message });
  }
}
