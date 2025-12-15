// =====================================================
// PROTOCOL DETAIL API
// /pages/api/admin/protocol/[id].js
// Returns protocol with patient info and injection log
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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Protocol ID required' });
  }

  try {
    // Get protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', id)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }

    // Get patient
    let patient = null;
    if (protocol.patient_id) {
      const { data: patientData } = await supabase
        .from('patients')
        .select('id, ghl_contact_id, full_name, name, email, phone')
        .eq('id', protocol.patient_id)
        .single();
      patient = patientData;
    } else if (protocol.ghl_contact_id) {
      const { data: patientData } = await supabase
        .from('patients')
        .select('id, ghl_contact_id, full_name, name, email, phone')
        .eq('ghl_contact_id', protocol.ghl_contact_id)
        .single();
      patient = patientData;
    }

    // If still no patient, create basic info from protocol
    if (!patient) {
      patient = {
        id: null,
        ghl_contact_id: protocol.ghl_contact_id,
        full_name: protocol.patient_name,
        email: protocol.patient_email,
        phone: protocol.patient_phone
      };
    }

    // Get injection log for this protocol
    const { data: injections } = await supabase
      .from('injection_log')
      .select('*')
      .eq('program_id', id)
      .order('injection_date', { ascending: false });

    return res.status(200).json({
      success: true,
      data: {
        protocol: {
          id: protocol.id,
          program_name: protocol.program_name,
          program_type: protocol.program_type,
          status: protocol.status,
          primary_peptide: protocol.primary_peptide,
          secondary_peptide: protocol.secondary_peptide,
          peptide_route: protocol.peptide_route,
          dose_amount: protocol.dose_amount,
          dose_frequency: protocol.dose_frequency,
          duration_days: protocol.duration_days,
          start_date: protocol.start_date,
          end_date: protocol.end_date,
          special_instructions: protocol.special_instructions,
          goal: protocol.goal,
          injections_completed: protocol.injections_completed || 0,
          prescribing_provider: protocol.prescribing_provider,
          notes: protocol.notes,
          amount_paid: protocol.amount_paid,
          payment_date: protocol.payment_date
        },
        patient,
        injections: injections || []
      }
    });

  } catch (error) {
    console.error('Protocol detail API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
