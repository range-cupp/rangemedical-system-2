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
      patient_id,
      appointment_id,
      height_inches,
      weight_lbs,
      bp_systolic,
      bp_diastolic,
      temperature,
      pulse,
      respiratory_rate,
      o2_saturation,
      recorded_by
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

    const vitalsData = {
      patient_id,
      appointment_id: appointment_id || null,
      height_inches: h,
      weight_lbs: w,
      bp_systolic: parseInt2(bp_systolic),
      bp_diastolic: parseInt2(bp_diastolic),
      temperature: parseNum(temperature),
      pulse: parseInt2(pulse),
      respiratory_rate: parseInt2(respiratory_rate),
      o2_saturation: parseNum(o2_saturation),
      bmi,
      recorded_by: recorded_by || null,
      recorded_at: new Date().toISOString()
    };

    // Check if vitals already exist for this appointment
    let existingId = null;
    if (appointment_id) {
      const { data: existing } = await supabase
        .from('patient_vitals')
        .select('id')
        .eq('appointment_id', appointment_id)
        .maybeSingle();

      if (existing) {
        existingId = existing.id;
      }
    }

    let result;
    if (existingId) {
      // Update existing
      const { data, error } = await supabase
        .from('patient_vitals')
        .update(vitalsData)
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
          // In-clinic WL patients: weight entry via vitals = injection session
          // Take-home WL patients: weight entry via vitals = weight_check only
          const isInClinic = wlProtocol.delivery_method === 'in_clinic';
          const entryType = isInClinic ? 'injection' : 'weight_check';

          // Check for existing service_log entry today (any non-pickup type)
          const { data: existingLog } = await supabase
            .from('service_logs')
            .select('id, entry_type')
            .eq('patient_id', patient_id)
            .eq('category', 'weight_loss')
            .eq('entry_date', logDate)
            .neq('entry_type', 'pickup')
            .maybeSingle();

          if (existingLog) {
            // Update existing entry — also upgrade weight_check → injection for in-clinic
            const updateData = { weight: w, updated_at: new Date().toISOString() };
            if (isInClinic && existingLog.entry_type === 'weight_check') {
              updateData.entry_type = 'injection';
            }
            await supabase
              .from('service_logs')
              .update(updateData)
              .eq('id', existingLog.id);
          } else {
            await supabase
              .from('service_logs')
              .insert({
                patient_id,
                protocol_id: wlProtocol.id,
                category: 'weight_loss',
                entry_type: entryType,
                entry_date: logDate,
                medication: wlProtocol.medication || null,
                dosage: wlProtocol.selected_dose || null,
                weight: w,
                notes: `Via vitals by ${recorded_by || 'Staff'}`,
              });

            // Increment sessions_used for in-clinic injection entries
            if (isInClinic) {
              await supabase
                .from('protocols')
                .update({
                  sessions_used: (wlProtocol.sessions_used || 0) + 1,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', wlProtocol.id);
            }
          }

          // Auto-set starting_weight if missing
          if (!wlProtocol.starting_weight) {
            await supabase
              .from('protocols')
              .update({ starting_weight: w, updated_at: new Date().toISOString() })
              .eq('id', wlProtocol.id);
          }
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
