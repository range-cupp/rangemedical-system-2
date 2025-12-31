// /pages/api/protocols/add-completed.js
// Add a historical completed protocol

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
      templateId,
      peptideId,
      selectedDose,
      frequency,
      startDate,
      endDate,
      notes
    } = req.body;

    if (!patientId || !templateId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get template info
    const { data: template } = await supabase
      .from('protocol_templates')
      .select('*')
      .eq('id', templateId)
      .single();

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

    // Create the completed protocol
    const { data: protocol, error } = await supabase
      .from('protocols')
      .insert({
        patient_id: patientId,
        program_name: template?.name || 'Protocol',
        program_type: template?.program_type || 'other',
        medication: peptideName,
        selected_dose: selectedDose || null,
        frequency: frequency || null,
        start_date: startDate,
        end_date: endDate,
        status: 'completed',
        notes: notes || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating protocol:', error);
      return res.status(500).json({ error: 'Failed to create protocol', details: error.message });
    }

    return res.status(200).json({ success: true, protocol });

  } catch (error) {
    console.error('Add completed error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
