// =====================================================
// PATIENT INJECTION LOG API
// /pages/api/patient/log-injection.js
// Patients log their at-home injections
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
      injection_type, // 'hrt', 'weight_loss', 'peptide', or protocol ID
      injection_date,
      injection_site,
      dose,
      weight,
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

    // Determine injection details based on type
    let medication = '';
    let programId = null;
    let programType = injection_type;

    if (injection_type === 'hrt') {
      // Get HRT membership
      const { data: hrt } = await supabase
        .from('hrt_memberships')
        .select('*')
        .eq('patient_id', patient_id)
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
        .eq('patient_id', patient_id)
        .eq('status', 'active')
        .single();

      if (wl) {
        medication = wl.medication;
        programId = wl.id;
        programType = 'weight_loss';

        // Update current weight if provided
        if (weight) {
          await supabase
            .from('weight_loss_programs')
            .update({ 
              current_weight: parseFloat(weight),
              updated_at: new Date().toISOString()
            })
            .eq('id', wl.id);

          // Log weight
          await supabase
            .from('weight_log')
            .insert({
              program_id: wl.id,
              patient_id: patient_id,
              log_date: injection_date || new Date().toISOString().split('T')[0],
              weight: parseFloat(weight),
              logged_by: 'patient'
            });
        }
      }
    } else {
      // Assume it's a protocol ID - could be 'peptide_xxx' format or just ID
      const protocolId = injection_type.startsWith('peptide_') 
        ? injection_type.replace('peptide_', '') 
        : injection_type;
        
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
        location: 'take_home',
        logged_by: 'patient',
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
    console.error('Log injection error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
