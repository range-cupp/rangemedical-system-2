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
      supplyDuration,
      isWeightLoss,
      wlDuration
    } = req.body;

    // For non-weight-loss, template is required
    if (!isWeightLoss && !templateId) {
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

    let template = null;
    let programName = '';
    let programType = '';
    let endDate = null;
    let finalTotalSessions = null;
    let isSingle = false;

    if (isWeightLoss) {
      // Weight Loss Protocol - no template needed
      const durationLabel = wlDuration === 7 ? 'Weekly' : wlDuration === 14 ? 'Two Weeks' : 'Monthly';
      programName = `Weight Loss - ${durationLabel}`;
      programType = 'weight_loss';
      
      // Calculate end date based on duration
      if (startDate && wlDuration) {
        const start = new Date(startDate);
        start.setDate(start.getDate() + wlDuration);
        endDate = start.toISOString().split('T')[0];
      }
    } else {
      // Get template info
      const { data: templateData } = await supabase
        .from('protocol_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (!templateData) {
        return res.status(400).json({ error: 'Template not found' });
      }
      
      template = templateData;
      programName = template.name;
      programType = template.category;

      // Calculate end date from template
      if (supplyDuration && startDate) {
        const start = new Date(startDate);
        start.setDate(start.getDate() + parseInt(supplyDuration));
        endDate = start.toISOString().split('T')[0];
      } else if (template.duration_days && startDate) {
        const start = new Date(startDate);
        start.setDate(start.getDate() + template.duration_days);
        endDate = start.toISOString().split('T')[0];
      }

      // Determine total sessions from template or request
      finalTotalSessions = totalSessions || template.total_sessions || null;
      
      // Parse from template name if session-based
      if (!finalTotalSessions && template.name) {
        const packMatch = template.name.match(/(\d+)\s*Pack/i);
        if (packMatch) {
          finalTotalSessions = parseInt(packMatch[1]);
        }
      }

      // Check if single session
      isSingle = template.name?.toLowerCase().includes('single');
      if (isSingle) {
        finalTotalSessions = 1;
      }
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

    // Create the protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .insert({
        patient_id: finalPatientId,
        program_name: programName,
        program_type: programType,
        medication: medicationName,
        selected_dose: selectedDose || null,
        frequency: frequency || template?.frequency,
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

    // Mark purchase as having a protocol - THIS IS CRITICAL
    if (purchaseId) {
      console.log('Updating purchase:', purchaseId);
      
      const { data: updatedPurchase, error: updateError } = await supabase
        .from('purchases')
        .update({ 
          protocol_created: true
        })
        .eq('id', purchaseId)
        .select();
      
      if (updateError) {
        console.error('Error updating purchase:', updateError);
      } else {
        console.log('Purchase updated successfully:', updatedPurchase);
      }
    } else {
      console.warn('No purchaseId provided - purchase will remain in pipeline');
    }

    res.status(200).json({ 
      success: true, 
      protocol,
      purchaseUpdated: !!purchaseId,
      message: `Protocol created: ${programName}`
    });

  } catch (error) {
    console.error('Error assigning protocol:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
}
