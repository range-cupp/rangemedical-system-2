// /pages/api/portal/[token]/check-in.js
// Weekly symptom check-in API
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Find patient by token
    let patientId = null;

    // Try patient_tokens
    const { data: tokenData } = await supabase
      .from('patient_tokens')
      .select('patient_id')
      .eq('token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (tokenData?.patient_id) {
      patientId = tokenData.patient_id;
    }

    // Fallback: protocols.access_token
    if (!patientId) {
      const { data: protocol } = await supabase
        .from('protocols')
        .select('patient_id, ghl_contact_id')
        .eq('access_token', token)
        .maybeSingle();

      if (protocol?.patient_id) {
        patientId = protocol.patient_id;
      } else if (protocol?.ghl_contact_id) {
        const { data: patient } = await supabase
          .from('patients')
          .select('id')
          .eq('ghl_contact_id', protocol.ghl_contact_id)
          .maybeSingle();
        
        patientId = patient?.id;
      }
    }

    if (!patientId) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get check-in data from request
    const { energy, sleep, mood, brain_fog, pain, libido, weight, notes } = req.body;

    const today = new Date().toISOString().split('T')[0];

    // Upsert check-in (update if exists for today, insert otherwise)
    const { data: checkIn, error } = await supabase
      .from('check_ins')
      .upsert({
        patient_id: patientId,
        check_in_date: today,
        energy_score: energy,
        sleep_score: sleep,
        mood_score: mood,
        brain_fog_score: brain_fog,
        pain_score: pain,
        libido_score: libido,
        overall_score: Math.round((energy + sleep + mood + brain_fog + pain + libido) / 6),
        weight: weight || null,
        notes: notes || null,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'patient_id,check_in_date'
      })
      .select()
      .single();

    if (error) {
      console.error('Check-in error:', error);
      return res.status(500).json({ error: 'Failed to save check-in' });
    }

    // If weight provided, also save to weight_logs
    if (weight) {
      await supabase
        .from('weight_logs')
        .upsert({
          patient_id: patientId,
          log_date: today,
          weight: parseFloat(weight),
          source: 'check_in'
        }, {
          onConflict: 'patient_id,log_date'
        });
    }

    return res.status(200).json({ 
      success: true, 
      check_in: checkIn,
      message: 'Check-in saved successfully'
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
