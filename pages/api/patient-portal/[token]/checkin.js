// /pages/api/patient-portal/[token]/checkin.js
// Submit symptom check-in
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { token } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    protocol_id,
    checkin_type,
    pain_score,
    mobility_score,
    swelling_score,
    sleep_score,
    energy_score,
    mood_score,
    libido_score,
    appetite_score,
    nausea_score,
    cravings_score,
    weight
  } = req.body;

  if (!protocol_id) {
    return res.status(400).json({ error: 'protocol_id required' });
  }

  try {
    // Get protocol to find patient_id
    const { data: protocol } = await supabase
      .from('protocols')
      .select('patient_id, ghl_contact_id')
      .eq('id', protocol_id)
      .single();

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const { data: existing } = await supabase
      .from('protocol_checkins')
      .select('id')
      .eq('protocol_id', protocol_id)
      .eq('checkin_date', today)
      .maybeSingle();

    if (existing) {
      // Update existing
      await supabase
        .from('protocol_checkins')
        .update({
          pain_score,
          mobility_score,
          swelling_score,
          sleep_score,
          energy_score,
          mood_score,
          libido_score,
          appetite_score,
          nausea_score,
          cravings_score,
          weight
        })
        .eq('id', existing.id);

      return res.status(200).json({ success: true, updated: true });
    }

    // Create new checkin
    await supabase
      .from('protocol_checkins')
      .insert({
        protocol_id,
        patient_id: protocol.patient_id,
        checkin_date: today,
        checkin_type: checkin_type || 'recovery',
        pain_score,
        mobility_score,
        swelling_score,
        sleep_score,
        energy_score,
        mood_score,
        libido_score,
        appetite_score,
        nausea_score,
        cravings_score,
        weight
      });

    // If weight loss, also log to weight_logs
    if (weight && protocol.patient_id) {
      await supabase
        .from('weight_logs')
        .upsert({
          patient_id: protocol.patient_id,
          log_date: today,
          weight,
          source: 'checkin'
        }, { onConflict: 'patient_id,log_date' });
    }

    return res.status(200).json({ success: true, created: true });

  } catch (error) {
    console.error('Checkin API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
