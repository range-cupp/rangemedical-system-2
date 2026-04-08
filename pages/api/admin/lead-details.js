// /pages/api/admin/lead-details.js
// Fetches lead + related patient data: comms, appointments, protocols
// Used by the LeadDetailPanel slide-out on the sales pipeline
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lead_id } = req.query;
  if (!lead_id) {
    return res.status(400).json({ error: 'lead_id is required' });
  }

  try {
    // 1. Get the lead from sales_pipeline
    const { data: lead, error: leadErr } = await supabase
      .from('sales_pipeline')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (leadErr || !lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // 2. Try to find matching patient by patient_id, or by phone/email
    let patient = null;
    let patientId = lead.patient_id;

    if (patientId) {
      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name, name, email, phone')
        .eq('id', patientId)
        .single();
      patient = data;
    }

    if (!patient && lead.phone) {
      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name, name, email, phone')
        .eq('phone', lead.phone)
        .limit(1)
        .single();
      if (data) {
        patient = data;
        patientId = data.id;
      }
    }

    if (!patient && lead.email) {
      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name, name, email, phone')
        .eq('email', lead.email)
        .limit(1)
        .single();
      if (data) {
        patient = data;
        patientId = data.id;
      }
    }

    // 3. Fetch comms (by patient_id or by phone match in recipient)
    let comms = [];
    if (patientId) {
      const { data } = await supabase
        .from('comms_log')
        .select('id, channel, message_type, recipient, subject, message, status, created_at')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(30);
      comms = data || [];
    } else if (lead.phone) {
      const { data } = await supabase
        .from('comms_log')
        .select('id, channel, message_type, recipient, subject, message, status, created_at')
        .eq('recipient', lead.phone)
        .order('created_at', { ascending: false })
        .limit(30);
      comms = data || [];
    }

    // 4. Fetch appointments
    let appointments = [];
    if (patientId) {
      const { data } = await supabase
        .from('appointments')
        .select('id, service_name, service_category, provider, start_time, end_time, status, notes')
        .eq('patient_id', patientId)
        .order('start_time', { ascending: false })
        .limit(20);
      appointments = data || [];
    }

    // 5. Fetch protocols
    let protocols = [];
    if (patientId) {
      const { data } = await supabase
        .from('protocols')
        .select('id, program_name, medication, status, start_date, end_date, sessions_used, total_sessions, category')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(20);
      protocols = data || [];
    }

    return res.status(200).json({
      lead,
      patient,
      patientId,
      comms,
      appointments,
      protocols,
    });
  } catch (err) {
    console.error('Lead details error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
