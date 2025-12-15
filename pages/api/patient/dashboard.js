// =====================================================
// PATIENT DASHBOARD API
// /pages/api/patient/dashboard.js
// Returns patient's services and status
// =====================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
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
      .select('*')
      .eq('login_token', token)
      .single();

    if (patientError || !patient) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Check token expiration (optional)
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

    // Get HRT membership
    const { data: hrt } = await supabase
      .from('hrt_memberships')
      .select('*')
      .eq('patient_id', patient.id)
      .eq('status', 'active')
      .single();

    if (hrt) {
      // Get current period
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const { data: period } = await supabase
        .from('hrt_monthly_periods')
        .select('*')
        .eq('membership_id', hrt.id)
        .gte('period_start', monthStart)
        .single();

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

    // Get Weight Loss program
    const { data: wl } = await supabase
      .from('weight_loss_programs')
      .select('*')
      .eq('patient_id', patient.id)
      .eq('status', 'active')
      .single();

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

    // Get Protocols
    const { data: protocols } = await supabase
      .from('protocols')
      .select('*')
      .eq('patient_id', patient.id)
      .eq('status', 'active');

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
          status: p.status,
          dose: p.dose_amount,
          frequency: p.dose_frequency,
          injection_location: p.injection_location,
          days_remaining: daysRemaining,
          end_date: p.end_date,
          next_refill_date: p.next_refill_date
        };
      });
    }

    // Get Session Packs
    const { data: packs } = await supabase
      .from('session_packages')
      .select('*')
      .eq('patient_id', patient.id)
      .eq('status', 'active');

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

    // Get Challenges
    const { data: challenges } = await supabase
      .from('challenges')
      .select('*')
      .eq('patient_id', patient.id)
      .eq('status', 'active');

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

    // Update last login
    await supabase
      .from('patients')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', patient.id);

    return res.status(200).json({
      success: true,
      data: patientData
    });

  } catch (error) {
    console.error('Patient dashboard error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
