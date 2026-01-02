// /pages/api/protocols/assign.js
// Assign a protocol to a patient from a purchase
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
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
      medication,
      frequency,
      startDate,
      notes,
      deliveryMethod,
      totalSessions,
      supplyDuration
    } = req.body;

    if (!templateId) {
      return res.status(400).json({ error: 'Template is required' });
    }

    // Find or determine patient_id
    let finalPatientId = patientId;

    if (!finalPatientId && ghlContactId) {
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('ghl_contact_id', ghlContactId)
        .single();

      if (existingPatient) {
        finalPatientId = existingPatient.id;
      } else {
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
    let medicationName = medication || null;
    if (!medicationName && peptideId) {
      const { data: peptide } = await supabase
        .from('peptides')
        .select('name')
        .eq('id', peptideId)
        .single();
      medicationName = peptide?.name;
    }

    // Calculate end date
    let endDate = null;
    if (supplyDuration && startDate) {
      // For take-home with custom supply duration
      const start = new Date(startDate);
      start.setDate(start.getDate() + parseInt(supplyDuration));
      endDate = start.toISOString().split('T')[0];
    } else if (template.duration_days && startDate) {
      // From template
      const start = new Date(startDate);
      start.setDate(start.getDate() + template.duration_days);
      endDate = start.toISOString().split('T')[0];
    }

    // Determine total sessions from template or request
    let finalTotalSessions = totalSessions || template.total_sessions || null;
    
    // Parse from template name if session-based
    if (!finalTotalSessions && template.name) {
      const packMatch = template.name.match(/(\d+)\s*Pack/i);
      if (packMatch) {
        finalTotalSessions = parseInt(packMatch[1]);
      }
    }

    // Check if single session
    const isSingle = template.name?.toLowerCase().includes('single');
    if (isSingle) {
      finalTotalSessions = 1;
    }

    // Create the protocol - only use columns that exist in the table
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .insert({
        patient_id: finalPatientId,
        program_name: template.name,
        program_type: template.category,  // Use program_type instead of category
        medication: medicationName,
        selected_dose: selectedDose || null,
        frequency: frequency || template.frequency,
        delivery_method: deliveryMethod || null,
        start_date: startDate,
        end_date: endDate,
        total_sessions: finalTotalSessions,
        sessions_used: 0,
        status: isSingle ? 'completed' : 'active',
        notes: notes,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (protocolError) {
      console.error('Protocol creation error:', protocolError);
      throw protocolError;
    }

    // Mark purchase as having a protocol
    if (purchaseId) {
      const { error: updateError } = await supabase
        .from('purchases')
        .update({ 
          protocol_id: protocol.id,
          has_protocol: true,
          protocol_created: true
        })
        .eq('id', purchaseId);
      
      if (updateError) {
        console.error('Error updating purchase:', updateError);
      }
    }

    res.status(200).json({ 
      success: true, 
      protocol,
      message: `Protocol created: ${template.name}`
    });

  } catch (error) {
    console.error('Error assigning protocol:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
}
