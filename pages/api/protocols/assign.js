// /pages/api/protocols/assign.js
// Assign a protocol to a patient from a purchase

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
      patientId,
      ghlContactId,
      patientName,
      purchaseId,
      templateId,
      peptideId,
      selectedDose,
      frequency,
      startDate,
      notes
    } = req.body;

    if (!templateId) {
      return res.status(400).json({ error: 'Template is required' });
    }

    // Find or determine patient_id
    let finalPatientId = patientId;

    if (!finalPatientId && ghlContactId) {
      // Try to find patient by ghl_contact_id
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('ghl_contact_id', ghlContactId)
        .single();

      if (existingPatient) {
        finalPatientId = existingPatient.id;
      } else {
        // Create a new patient record
        const { data: newPatient, error: createError } = await supabase
          .from('patients')
          .insert({
            ghl_contact_id: ghlContactId,
            name: patientName || 'Unknown Patient',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating patient:', createError);
          return res.status(500).json({ error: 'Failed to create patient record' });
        }

        finalPatientId = newPatient.id;
      }
    }

    if (!finalPatientId) {
      return res.status(400).json({ error: 'Could not determine patient' });
    }

    // Get template info
    const { data: template } = await supabase
      .from('protocol_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (!template) {
      return res.status(400).json({ error: 'Template not found' });
    }

    // Get peptide info if provided
    let peptideName = null;
    if (peptideId) {
      const { data: peptide } = await supabase
        .from('peptides')
        .select('name')
        .eq('id', peptideId)
        .single();
      peptideName = peptide?.name;
    }

    // Calculate end date based on template duration
    let endDate = null;
    if (template.duration_days && startDate) {
      const start = new Date(startDate);
      start.setDate(start.getDate() + template.duration_days);
      endDate = start.toISOString().split('T')[0];
    }

    // Create the protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .insert({
        patient_id: finalPatientId,
        program_name: template.name,
        program_type: template.program_type || 'other',
        medication: peptideName,
        selected_dose: selectedDose || null,
        frequency: frequency || null,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        notes: notes || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (protocolError) {
      console.error('Error creating protocol:', protocolError);
      return res.status(500).json({ error: 'Failed to create protocol', details: protocolError.message });
    }

    // Mark purchase as having protocol created
    if (purchaseId) {
      const { error: updateError } = await supabase
        .from('purchases')
        .update({ protocol_created: true })
        .eq('id', purchaseId);
      
      if (updateError) {
        console.error('Error updating purchase:', updateError);
      }
    }

    return res.status(200).json({ success: true, protocol });

  } catch (error) {
    console.error('Assign protocol error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
