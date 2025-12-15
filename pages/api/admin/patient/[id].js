// =====================================================
// STAFF PATIENT PROFILE API
// /pages/api/admin/patient/[id].js
// Returns complete patient data with all services
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

  const { id } = req.query; // ghl_contact_id

  if (!id) {
    return res.status(400).json({ success: false, error: 'Patient ID required' });
  }

  try {
    // Get patient by ghl_contact_id
    let { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('ghl_contact_id', id)
      .single();

    // If not found by ghl_contact_id, try by uuid
    if (patientError || !patient) {
      const { data: patientById, error: byIdError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (byIdError || !patientById) {
        return res.status(404).json({ success: false, error: 'Patient not found' });
      }
      patient = patientById;
    }

    const ghlContactId = patient.ghl_contact_id;
    const patientId = patient.id;
    const today = new Date();

    // Build complete patient data object
    const patientData = {
      id: patient.id,
      ghl_contact_id: patient.ghl_contact_id,
      name: patient.name,
      full_name: patient.full_name || patient.name,
      first_name: patient.first_name,
      last_name: patient.last_name,
      email: patient.email,
      phone: patient.phone,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      address: patient.address,
      city: patient.city,
      state: patient.state,
      zip: patient.zip_code || patient.zip,
      status: patient.status
    };

    // =====================================================
    // HRT MEMBERSHIP
    // =====================================================
    const { data: hrt } = await supabase
      .from('hrt_memberships')
      .select('*')
      .or(`patient_id.eq.${patientId},ghl_contact_id.eq.${ghlContactId}`)
      .eq('status', 'active')
      .single();

    if (hrt) {
      // Get current period
      const { data: period } = await supabase
        .from('hrt_monthly_periods')
        .select('*')
        .eq('membership_id', hrt.id)
        .lte('period_start', today.toISOString().split('T')[0])
        .gte('period_end', today.toISOString().split('T')[0])
        .single();

      let ivDaysLeft = null;
      if (period && !period.iv_used) {
        const periodEnd = new Date(period.period_end);
        ivDaysLeft = Math.ceil((periodEnd - today) / (1000 * 60 * 60 * 24));
      }

      patientData.hrt = {
        id: hrt.id,
        status: hrt.status,
        membership_type: hrt.membership_type,
        start_date: hrt.start_date,
        next_lab_due: hrt.next_lab_due,
        next_lab_type: hrt.next_lab_type,
        iv_used: period?.iv_used || false,
        iv_days_left: ivDaysLeft,
        current_period: period?.period_label,
        monthly_rate: hrt.monthly_rate
      };
    }

    // =====================================================
    // WEIGHT LOSS PROGRAM
    // =====================================================
    const { data: weightLoss } = await supabase
      .from('weight_loss_programs')
      .select('*')
      .or(`patient_id.eq.${patientId},ghl_contact_id.eq.${ghlContactId}`)
      .eq('status', 'active')
      .single();

    if (weightLoss) {
      patientData.weight_loss = {
        id: weightLoss.id,
        status: weightLoss.status,
        medication: weightLoss.medication,
        current_dose: weightLoss.current_dose,
        current_weight: weightLoss.current_weight,
        starting_weight: weightLoss.starting_weight,
        goal_weight: weightLoss.goal_weight,
        injection_frequency: weightLoss.injection_frequency,
        next_refill_date: weightLoss.next_refill_date
      };
    }

    // =====================================================
    // PROTOCOLS (PEPTIDES)
    // =====================================================
    const { data: protocols } = await supabase
      .from('protocols')
      .select('*')
      .or(`patient_id.eq.${patientId},ghl_contact_id.eq.${ghlContactId}`)
      .order('created_at', { ascending: false });

    if (protocols?.length > 0) {
      patientData.protocols = protocols.map(p => {
        let daysRemaining = null;
        if (p.end_date) {
          const endDate = new Date(p.end_date);
          daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        }
        return {
          id: p.id,
          program_name: p.program_name,
          program_type: p.program_type,
          status: p.status,
          primary_peptide: p.primary_peptide,
          secondary_peptide: p.secondary_peptide,
          dose_amount: p.dose_amount,
          dose_frequency: p.dose_frequency,
          duration_days: p.duration_days,
          start_date: p.start_date,
          end_date: p.end_date,
          days_remaining: daysRemaining,
          special_instructions: p.special_instructions,
          injections_completed: p.injections_completed,
          goal: p.goal
        };
      });
    }

    // =====================================================
    // SESSION PACKS
    // =====================================================
    const { data: sessionPacks } = await supabase
      .from('session_packages')
      .select('*')
      .or(`patient_id.eq.${patientId},ghl_contact_id.eq.${ghlContactId}`)
      .eq('status', 'active');

    if (sessionPacks?.length > 0) {
      patientData.session_packs = sessionPacks.map(p => ({
        id: p.id,
        service_type: p.service_type,
        package_name: p.package_name,
        sessions_purchased: p.sessions_purchased,
        sessions_used: p.sessions_used,
        sessions_remaining: p.sessions_purchased - p.sessions_used,
        purchase_date: p.purchase_date,
        expiration_date: p.expiration_date
      }));
    }

    // =====================================================
    // PURCHASES
    // =====================================================
    const { data: purchases } = await supabase
      .from('purchases')
      .select('*')
      .eq('ghl_contact_id', ghlContactId)
      .order('purchase_date', { ascending: false });

    if (purchases?.length > 0) {
      patientData.purchases = purchases;
    }

    // =====================================================
    // MEDICAL INTAKES
    // =====================================================
    const { data: intakes } = await supabase
      .from('intakes')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (intakes?.length > 0) {
      patientData.intakes = intakes;
    }

    // =====================================================
    // CONSENTS
    // =====================================================
    const { data: consents } = await supabase
      .from('consents')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (consents?.length > 0) {
      patientData.consents = consents;
    }

    // =====================================================
    // CHALLENGES
    // =====================================================
    const { data: challenges } = await supabase
      .from('challenges')
      .select('*')
      .or(`patient_id.eq.${patientId},ghl_contact_id.eq.${ghlContactId}`)
      .eq('status', 'active');

    if (challenges?.length > 0) {
      patientData.challenges = challenges.map(c => ({
        id: c.id,
        challenge_name: c.challenge_name,
        start_date: c.start_date,
        end_date: c.end_date,
        hbot_sessions_included: c.hbot_sessions_included,
        hbot_sessions_used: c.hbot_sessions_used,
        rlt_sessions_included: c.rlt_sessions_included,
        rlt_sessions_used: c.rlt_sessions_used
      }));
    }

    // =====================================================
    // INJECTION LOG
    // =====================================================
    const { data: injectionLog } = await supabase
      .from('injection_log')
      .select('*')
      .eq('patient_id', patientId)
      .order('injection_date', { ascending: false })
      .limit(20);

    if (injectionLog?.length > 0) {
      patientData.injection_log = injectionLog;
    }

    return res.status(200).json({
      success: true,
      data: patientData
    });

  } catch (error) {
    console.error('Patient profile API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
