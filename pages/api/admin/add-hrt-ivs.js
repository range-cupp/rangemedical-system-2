// /pages/api/admin/add-hrt-ivs.js
// Add a Range IV (1 Pack) to every patient with an active HRT protocol
// GET = preview (dry run), POST = execute
// Skips patients who already have an active Range IV protocol

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const dryRun = req.method === 'GET';

  try {
    // 1. Get all patients with active HRT protocols
    const { data: hrtProtocols, error: hrtError } = await supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        medication,
        program_type,
        program_name,
        status,
        patients (
          id,
          name
        )
      `)
      .eq('program_type', 'hrt')
      .eq('status', 'active');

    if (hrtError) throw hrtError;

    // Get unique patient IDs from active HRT protocols
    const patientMap = {};
    for (const p of hrtProtocols || []) {
      if (!patientMap[p.patient_id]) {
        patientMap[p.patient_id] = {
          patient_id: p.patient_id,
          patient_name: p.patients?.name || 'Unknown',
          hrt_medication: p.medication,
          hrt_program: p.program_name
        };
      }
    }

    const hrtPatientIds = Object.keys(patientMap);

    // 2. Check which of these patients already have an active Range IV
    const { data: existingIVs, error: ivError } = await supabase
      .from('protocols')
      .select('patient_id, medication, status')
      .eq('program_type', 'iv')
      .eq('medication', 'Range IV')
      .eq('status', 'active')
      .in('patient_id', hrtPatientIds.length > 0 ? hrtPatientIds : ['none']);

    if (ivError) throw ivError;

    const alreadyHasIV = new Set((existingIVs || []).map(iv => iv.patient_id));

    // 3. Determine who needs an IV added
    const toAdd = [];
    const skipped = [];

    for (const patientId of hrtPatientIds) {
      const info = patientMap[patientId];
      if (alreadyHasIV.has(patientId)) {
        skipped.push({
          patient_name: info.patient_name,
          patient_id: patientId,
          reason: 'Already has active Range IV'
        });
      } else {
        toAdd.push(info);
      }
    }

    // 4. Add Range IV protocols
    const added = [];
    const errors = [];
    const today = new Date().toISOString().split('T')[0];

    if (!dryRun) {
      for (const patient of toAdd) {
        try {
          const { data: newProtocol, error: insertError } = await supabase
            .from('protocols')
            .insert({
              patient_id: patient.patient_id,
              program_type: 'iv',
              medication: 'Range IV',
              program_name: 'Range IV - 1 Pack',
              delivery_method: 'in_clinic',
              frequency: 'As scheduled',
              total_sessions: 1,
              sessions_used: 0,
              status: 'active',
              start_date: today,
              notes: 'Monthly IV included with HRT program'
            })
            .select()
            .single();

          if (insertError) throw insertError;

          added.push({
            patient_name: patient.patient_name,
            patient_id: patient.patient_id,
            hrt_medication: patient.hrt_medication,
            new_iv_protocol_id: newProtocol.id
          });
        } catch (err) {
          errors.push({
            patient_name: patient.patient_name,
            patient_id: patient.patient_id,
            error: err.message
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      dryRun,
      message: dryRun
        ? `Preview: ${toAdd.length} patients would get a Range IV added (${skipped.length} already have one)`
        : `Done: ${added.length} Range IVs added (${skipped.length} skipped, ${errors.length} errors)`,
      summary: {
        total_active_hrt_patients: hrtPatientIds.length,
        to_add: toAdd.length,
        already_has_iv: skipped.length,
        ...(dryRun ? {} : { added: added.length, errors: errors.length })
      },
      patients_to_add: dryRun ? toAdd : added,
      skipped,
      ...(errors.length > 0 ? { errors } : {})
    });

  } catch (error) {
    console.error('Add HRT IVs error:', error);
    return res.status(500).json({ error: error.message });
  }
}
