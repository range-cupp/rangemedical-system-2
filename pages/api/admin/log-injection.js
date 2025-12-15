// =====================================================
// STAFF INJECTION LOG API
// /pages/api/admin/log-injection.js
// Staff logs injections for patients (in-clinic or take-home)
// =====================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      patient_id,
      injection_type,
      injection_date,
      injection_site,
      location,
      dose,
      notes
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({ success: false, error: 'Patient ID required' });
    }

    // Get patient info
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patient_id)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    // Determine medication based on injection type
    let medication = '';
    let programId = null;
    let programType = injection_type;

    if (injection_type === 'hrt') {
      // Get HRT membership
      const { data: hrt } = await supabase
        .from('hrt_memberships')
        .select('*')
        .or(`patient_id.eq.${patient_id},ghl_contact_id.eq.${patient.ghl_contact_id}`)
        .eq('status', 'active')
        .single();

      if (hrt) {
        medication = hrt.injection_type || 'Testosterone';
        programId = hrt.id;
        programType = 'hrt';
      }
    } else if (injection_type === 'weight_loss') {
      // Get weight loss program
      const { data: wl } = await supabase
        .from('weight_loss_programs')
        .select('*')
        .or(`patient_id.eq.${patient_id},ghl_contact_id.eq.${patient.ghl_contact_id}`)
        .eq('status', 'active')
        .single();

      if (wl) {
        medication = wl.medication;
        programId = wl.id;
        programType = 'weight_loss';
      }
    } else if (injection_type.startsWith('peptide_')) {
      // It's a protocol ID
      const protocolId = injection_type.replace('peptide_', '');
      const { data: protocol } = await supabase
        .from('protocols')
        .select('*')
        .eq('id', protocolId)
        .single();

      if (protocol) {
        medication = protocol.program_name;
        programId = protocol.id;
        programType = 'peptide';
        
        // Increment injections_completed
        await supabase
          .from('protocols')
          .update({ 
            injections_completed: (protocol.injections_completed || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', protocolId);
      }
    }

    // Log the injection
    const { data: logEntry, error: logError } = await supabase
      .from('injection_log')
      .insert({
        patient_id,
        injection_type: programType,
        medication,
        dose: dose || null,
        injection_date: injection_date || new Date().toISOString().split('T')[0],
        injection_site: injection_site || 'abdomen',
        program_id: programId,
        program_type: programType,
        location: location || 'in_clinic',
        logged_by: 'staff',
        notes
      })
      .select()
      .single();

    if (logError) throw logError;

    return res.status(200).json({
      success: true,
      data: logEntry,
      message: 'Injection logged successfully'
    });

  } catch (error) {
    console.error('Staff log injection error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
