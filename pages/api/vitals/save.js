// pages/api/vitals/save.js
// Upsert vitals for an encounter (create or update)
// Range Medical

import { createClient } from '@supabase/supabase-js';

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

    return res.status(200).json({ success: true, vitals: result });

  } catch (error) {
    console.error('Vitals save error:', error);
    return res.status(500).json({ error: error.message });
  }
}
