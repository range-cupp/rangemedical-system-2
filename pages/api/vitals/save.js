// pages/api/vitals/save.js
// Upsert vitals for an encounter (create or update)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Calculate BMI from height (inches) and weight (lbs)
function calculateBMI(heightInches, weightLbs) {
  if (!heightInches || !weightLbs || heightInches <= 0) return null;
  const bmi = (weightLbs / (heightInches * heightInches)) * 703;
  return Math.round(bmi * 10) / 10; // one decimal place
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      id,
      patient_id,
      appointment_id,
      height_inches,
      weight_lbs,
      bp_systolic,
      bp_diastolic,
      bp_arm,
      temperature,
      pulse,
      respiratory_rate,
      o2_saturation,
      recorded_by,
      recorded_at
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({ error: 'patient_id is required' });
    }

    // Parse numeric values (allow empty strings to become null)
    const parseNum = (v) => (v !== '' && v !== null && v !== undefined && !isNaN(v)) ? parseFloat(v) : null;
    const parseInt2 = (v) => (v !== '' && v !== null && v !== undefined && !isNaN(v)) ? parseInt(v) : null;

    const h = parseNum(height_inches);
    const w = parseNum(weight_lbs);
    const bmi = calculateBMI(h, w);

    // recorded_at accepts:
    //   - Full ISO datetime string ("2026-04-17T14:30:00-07:00") → stored as-is
    //   - Datetime-local ("2026-04-17T14:30") → interpreted as Pacific
    //   - Date only ("2026-04-17") → interpreted as noon Pacific (legacy)
    //   - Empty/null → current time
    const normalizeRecordedAt = (val) => {
      if (!val) return new Date().toISOString();
      if (typeof val !== 'string') return new Date(val).toISOString();
      // Already has timezone info — trust it
      if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(val)) return new Date(val).toISOString();
      // Date-only (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return new Date(val + 'T12:00:00-07:00').toISOString();
      }
      // Datetime-local (YYYY-MM-DDTHH:MM[:SS]) — treat as Pacific
      // Determine PT offset by checking DST for that date
      const d = new Date(val + 'Z'); // placeholder parse to get date parts
      const year = parseInt(val.slice(0, 4), 10);
      const month = parseInt(val.slice(5, 7), 10);
      const day = parseInt(val.slice(8, 10), 10);
      // Use a fixed reference date for DST lookup; Intl handles it
      const probe = new Date(Date.UTC(year, month - 1, day, 20, 0, 0));
      const ptParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        timeZoneName: 'shortOffset',
      }).formatToParts(probe);
      const offsetPart = ptParts.find(p => p.type === 'timeZoneName')?.value || 'GMT-8';
      const match = offsetPart.match(/GMT([+-]\d{1,2})/);
      const offsetHours = match ? parseInt(match[1], 10) : -8;
      const offsetStr = (offsetHours >= 0 ? '+' : '-') + String(Math.abs(offsetHours)).padStart(2, '0') + ':00';
      const withSeconds = val.length === 16 ? val + ':00' : val;
      return new Date(withSeconds + offsetStr).toISOString();
    };

    const vitalsData = {
      patient_id,
      appointment_id: appointment_id || null,
      height_inches: h,
      weight_lbs: w,
      bp_systolic: parseInt2(bp_systolic),
      bp_diastolic: parseInt2(bp_diastolic),
      bp_arm: bp_arm === 'left' || bp_arm === 'right' ? bp_arm : null,
      temperature: parseNum(temperature),
      pulse: parseInt2(pulse),
      respiratory_rate: parseInt2(respiratory_rate),
      o2_saturation: parseNum(o2_saturation),
      bmi,
      recorded_by: recorded_by || null,
      recorded_at: normalizeRecordedAt(recorded_at),
    };

    // Check if vitals already exist for this appointment or same day
    let existingId = id || null;
    if (!existingId && appointment_id) {
      const { data: existing } = await supabase
        .from('patient_vitals')
        .select('id')
        .eq('appointment_id', appointment_id)
        .maybeSingle();

      if (existing) {
        existingId = existing.id;
      }
    }

    // Fallback: check for same-day vitals to avoid duplicates from multiple appointments.
    // Only applies to encounter saves (has appointment_id). Standalone "Add Vitals"
    // entries (no appointment_id) always create a new record.
    let matchedViaSameDay = false;
    if (!existingId && appointment_id && patient_id) {
      const recordedDate = vitalsData.recorded_at.slice(0, 10);
      const dayStart = recordedDate + 'T00:00:00.000Z';
      const dayEnd = recordedDate + 'T23:59:59.999Z';
      const { data: sameDayVitals } = await supabase
        .from('patient_vitals')
        .select('id')
        .eq('patient_id', patient_id)
        .gte('recorded_at', dayStart)
        .lte('recorded_at', dayEnd)
        .order('recorded_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (sameDayVitals) {
        existingId = sameDayVitals.id;
        matchedViaSameDay = true;
      }
    }

    let result;
    if (existingId) {
      // Snapshot current values before overwriting
      const { data: prev } = await supabase
        .from('patient_vitals')
        .select('*')
        .eq('id', existingId)
        .single();

      if (prev) {
        await supabase.from('patient_vitals_history').insert({
          vitals_id: existingId,
          patient_id: prev.patient_id,
          appointment_id: prev.appointment_id,
          height_inches: prev.height_inches,
          weight_lbs: prev.weight_lbs,
          bp_systolic: prev.bp_systolic,
          bp_diastolic: prev.bp_diastolic,
          bp_arm: prev.bp_arm,
          temperature: prev.temperature,
          pulse: prev.pulse,
          respiratory_rate: prev.respiratory_rate,
          o2_saturation: prev.o2_saturation,
          bmi: prev.bmi,
          recorded_by: prev.recorded_by,
          recorded_at: prev.recorded_at,
          changed_by: recorded_by || null,
        });
      }

      // When matched via same-day fallback (different appointment), merge rather than
      // overwrite: only update fields that have actual values so we don't blank out
      // data entered by an earlier encounter.
      let updateData = vitalsData;
      if (matchedViaSameDay && prev) {
        const vitalFields = [
          'height_inches', 'weight_lbs', 'bp_systolic', 'bp_diastolic',
          'bp_arm', 'temperature', 'pulse', 'respiratory_rate', 'o2_saturation', 'bmi',
        ];
        updateData = { ...vitalsData, appointment_id: prev.appointment_id };
        for (const f of vitalFields) {
          if (vitalsData[f] == null && prev[f] != null) {
            updateData[f] = prev[f];
          }
        }
        // Keep the earlier recorded_at
        updateData.recorded_at = prev.recorded_at;
      }
      const { data, error } = await supabase
        .from('patient_vitals')
        .update(updateData)
        .eq('id', existingId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('patient_vitals')
        .insert(vitalsData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // ── Sync weight to service_logs if patient has active weight loss protocol ──
    if (w) {
      try {
        const { data: wlProtocol } = await supabase
          .from('protocols')
          .select('id, medication, selected_dose, starting_weight, delivery_method, sessions_used')
          .eq('patient_id', patient_id)
          .ilike('program_type', 'weight_loss%')
          .in('status', ['active', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (wlProtocol) {
          const logDate = todayPacific();

          // Stamp the weight onto today's service_log if one already exists.
          // Vitals NEVER create new service_log rows — only the encounter
          // note (via lib/wl-note-sync.js) is allowed to create injection
          // entries. This is the single-source-of-truth rule for clinical
          // injection tracking.
          const { data: existingLog } = await supabase
            .from('service_logs')
            .select('id, entry_type')
            .eq('patient_id', patient_id)
            .eq('category', 'weight_loss')
            .eq('entry_date', logDate)
            .neq('entry_type', 'pickup')
            .maybeSingle();

          if (existingLog) {
            await supabase
              .from('service_logs')
              .update({ weight: w, updated_at: new Date().toISOString() })
              .eq('id', existingLog.id);
          }
          // No existing log → weight stays in patient_vitals only. The
          // injection row will land when the provider signs the encounter
          // note (or saves with a body), which calls syncWLNoteToServiceLog.

        }
      } catch (syncErr) {
        // Don't fail vitals save if sync fails
        console.error('Weight→service_logs sync error (non-fatal):', syncErr.message);
      }
    }

    return res.status(200).json({ success: true, vitals: result });

  } catch (error) {
    console.error('Vitals save error:', error);
    return res.status(500).json({ error: error.message });
  }
}
