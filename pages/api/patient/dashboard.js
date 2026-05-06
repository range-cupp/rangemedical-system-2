// =====================================================
// PATIENT DASHBOARD API
// /pages/api/patient/dashboard.js
// Returns patient's services and status
// =====================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ success: false, error: 'Token required' });
  }

  try {
    // Find patient by token
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, ghl_contact_id, first_name, last_name, full_name, email, phone, token_expires_at')
      .eq('login_token', token)
      .single();

    if (patientError || !patient) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    if (patient.token_expires_at && new Date(patient.token_expires_at) < new Date()) {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }

    const today = new Date();
    const patientData = {
      id: patient.id,
      ghl_contact_id: patient.ghl_contact_id,
      first_name: patient.first_name,
      last_name: patient.last_name,
      full_name: patient.full_name,
      email: patient.email,
      phone: patient.phone
    };

    // Fan out independent fetches in parallel (was 5 sequential round-trips).
    const [hrtRes, wlRes, protocolsRes, packsRes, challengesRes] = await Promise.all([
      supabase
        .from('hrt_memberships')
        .select('id, status, membership_type, injection_frequency, next_lab_due')
        .eq('patient_id', patient.id)
        .eq('status', 'active')
        .maybeSingle(),
      supabase
        .from('weight_loss_programs')
        .select('status, medication, current_dose, current_weight, starting_weight, goal_weight, injection_frequency, injection_location, next_refill_date')
        .eq('patient_id', patient.id)
        .eq('status', 'active')
        .maybeSingle(),
      supabase
        .from('protocols')
        .select('id, program_name, medication, selected_dose, frequency, delivery_method, status, start_date, end_date, last_refill_date, notes, sessions_used')
        .eq('patient_id', patient.id)
        .eq('status', 'active'),
      supabase
        .from('session_packages')
        .select('id, service_type, package_name, sessions_purchased, sessions_used, status, expiration_date')
        .eq('patient_id', patient.id)
        .eq('status', 'active'),
      supabase
        .from('challenges')
        .select('id, challenge_name, start_date, end_date, hbot_sessions_included, hbot_sessions_used, rlt_sessions_included, rlt_sessions_used')
        .eq('patient_id', patient.id)
        .eq('status', 'active'),
    ]);

    const hrt = hrtRes.data;
    const wl = wlRes.data;
    const protocols = protocolsRes.data;
    const packs = packsRes.data;
    const challenges = challengesRes.data;

    if (hrt) {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const { data: period } = await supabase
        .from('hrt_monthly_periods')
        .select('iv_used, period_end, period_label')
        .eq('membership_id', hrt.id)
        .gte('period_start', monthStart)
        .maybeSingle();

      let ivDaysLeft = null;
      if (period && !period.iv_used) {
        const periodEnd = new Date(period.period_end);
        ivDaysLeft = Math.ceil((periodEnd - today) / (1000 * 60 * 60 * 24));
      }

      patientData.hrt = {
        status: hrt.status,
        membership_type: hrt.membership_type,
        injection_frequency: hrt.injection_frequency,
        injection_location: hrt.injection_frequency ? 'take_home' : null,
        next_lab_due: hrt.next_lab_due,
        iv_used: period?.iv_used || false,
        iv_days_left: ivDaysLeft,
        current_period: period?.period_label
      };
    }

    if (wl) {
      patientData.weight_loss = {
        status: wl.status,
        medication: wl.medication,
        current_dose: wl.current_dose,
        current_weight: wl.current_weight,
        starting_weight: wl.starting_weight,
        goal_weight: wl.goal_weight,
        injection_frequency: wl.injection_frequency,
        injection_location: wl.injection_location,
        next_refill_date: wl.next_refill_date
      };
    }

    if (protocols?.length > 0) {
      patientData.protocols = protocols.map(p => {
        let daysRemaining = null;
        if (p.end_date) {
          const endDate = new Date(p.end_date);
          daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        }
        return {
          id: p.id,
          protocol_name: p.program_name,
          program_name: p.program_name,
          medication: p.medication,
          selected_dose: p.selected_dose,
          frequency: p.frequency,
          delivery_method: p.delivery_method,
          primary_peptide: p.medication,
          dose_amount: p.selected_dose,
          dose_frequency: p.frequency,
          injection_location: p.delivery_method,
          status: p.status,
          dose: p.selected_dose,
          days_remaining: daysRemaining,
          start_date: p.start_date,
          end_date: p.end_date,
          last_refill_date: p.last_refill_date,
          notes: p.notes,
          injections_completed: p.sessions_used || 0
        };
      });
    }

    if (packs?.length > 0) {
      patientData.session_packs = packs.map(p => ({
        id: p.id,
        service_type: p.service_type,
        package_name: p.package_name,
        sessions_purchased: p.sessions_purchased,
        sessions_used: p.sessions_used,
        sessions_remaining: p.sessions_purchased - p.sessions_used,
        status: p.status,
        expiration_date: p.expiration_date
      }));
    }

    if (challenges?.length > 0) {
      patientData.challenges = challenges.map(c => ({
        id: c.id,
        challenge_name: c.challenge_name,
        start_date: c.start_date,
        end_date: c.end_date,
        hbot_remaining: c.hbot_sessions_included - c.hbot_sessions_used,
        rlt_remaining: c.rlt_sessions_included - c.rlt_sessions_used
      }));
    }

    // Fire-and-forget last login bump (don't block the response on it).
    supabase
      .from('patients')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', patient.id)
      .then(() => {}, () => {});

    return res.status(200).json({
      success: true,
      data: patientData
    });

  } catch (error) {
    console.error('Patient dashboard error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
