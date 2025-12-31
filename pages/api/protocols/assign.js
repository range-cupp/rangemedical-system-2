// /pages/api/protocols/assign.js
// Assign a protocol to a patient - with peptide support

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      patientId, 
      templateId, 
      notificationId,
      purchaseId,
      startDate,
      notes,
      peptideId,
      selectedDose,
      vialDuration
    } = req.body;

    if (!patientId || !templateId) {
      return res.status(400).json({ error: 'Patient ID and template ID are required' });
    }

    // Get template details
    const { data: template, error: templateError } = await supabase
      .from('protocol_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    // Get peptide details if provided
    let peptideData = null;
    if (peptideId) {
      const { data: peptide, error: peptideError } = await supabase
        .from('peptides')
        .select('*')
        .eq('id', peptideId)
        .single();
      
      if (!peptideError) {
        peptideData = peptide;
      }
    }

    // Calculate end date (use vialDuration if provided, otherwise template duration)
    const start = new Date(startDate);
    let endDate = null;
    const durationDays = vialDuration || template.duration_days;
    if (durationDays) {
      endDate = new Date(start);
      endDate.setDate(endDate.getDate() + durationDays);
    }

    // Build protocol name
    let protocolName = template.name;
    if (peptideData) {
      const duration = vialDuration || template.duration_days;
      const isVial = template.name.includes('Vial');
      protocolName = `${peptideData.name} - ${isVial ? 'Vial' : duration + ' Day'}`;
    }

    // Create the patient protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('patient_protocols')
      .insert({
        patient_id: patientId,
        template_id: templateId,
        purchase_id: purchaseId || null,
        protocol_name: protocolName,
        category: template.category,
        status: 'active',
        start_date: startDate,
        end_date: endDate?.toISOString().split('T')[0] || null,
        medication: peptideData?.name || template.medication,
        dose: selectedDose || template.dose,
        frequency: peptideData?.frequency || template.frequency,
        notes: notes || peptideData?.notes,
        peptide_id: peptideId || null,
        selected_dose: selectedDose || null
      })
      .select()
      .single();

    if (protocolError) throw protocolError;

    // Mark notification as processed if provided
    if (notificationId) {
      await supabase
        .from('purchase_notifications')
        .update({ 
          status: 'processed',
          processed_at: new Date().toISOString()
        })
        .eq('id', notificationId);
    }

    res.status(200).json({ 
      success: true, 
      protocol,
      message: `Protocol assigned: ${protocolName}`
    });

  } catch (error) {
    console.error('Error assigning protocol:', error);
    res.status(500).json({ error: error.message });
  }
}
