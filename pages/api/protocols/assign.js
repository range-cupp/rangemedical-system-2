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
      medication,
      frequency,
      startDate,
      notes,
      // HRT specific
      hrtGender,
      hrtSupplyType,
      // Weight Loss specific
      startWeight,
      goalWeight,
      // Session-based
      totalSessions: requestedTotalSessions,
      // Supply duration for take-home
      supplyDuration,
      deliveryMethod
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

    // Update patient with weight info if provided (for weight loss)
    if (startWeight || goalWeight) {
      await supabase
        .from('patients')
        .update({
          start_weight: startWeight ? parseFloat(startWeight) : undefined,
          goal_weight: goalWeight ? parseFloat(goalWeight) : undefined
        })
        .eq('id', finalPatientId);
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

    // Get peptide info if provided, or use direct medication
    let medicationName = medication || null;
    if (!medicationName && peptideId) {
      const { data: peptide } = await supabase
        .from('peptides')
        .select('name')
        .eq('id', peptideId)
        .single();
      medicationName = peptide?.name;
    }

    // Calculate end date based on template duration or supply duration
    let endDate = null;
    const isTakeHome = deliveryMethod === 'take_home';
    
    if (supplyDuration && startDate) {
      // For take-home with supply duration
      const start = new Date(startDate);
      start.setDate(start.getDate() + parseInt(supplyDuration));
      endDate = start.toISOString().split('T')[0];
    } else if (template.duration_days && startDate) {
      const start = new Date(startDate);
      start.setDate(start.getDate() + template.duration_days);
      endDate = start.toISOString().split('T')[0];
    }

    // Check if this is a single session (IV Single, injection, etc.) - auto-complete
    const isSingleSession = template.name?.toLowerCase().includes('single') || 
                            template.duration_days === 1 ||
                            template.duration_days === 0;
    
    // Check if this is a session-based pack (in-clinic injections)
    const isPackProtocol = (template.total_sessions && template.total_sessions > 1) || 
                           requestedTotalSessions > 1;
    
    let protocolStatus = 'active';
    let protocolEndDate = endDate;
    let totalSessions = requestedTotalSessions || template.total_sessions || null;
    let sessionsUsed = 0;

    if (isSingleSession) {
      protocolStatus = 'completed';
      protocolEndDate = startDate;
      totalSessions = template.total_sessions || 1;
      sessionsUsed = template.total_sessions || 1;
    } else if (isTakeHome && supplyDuration) {
      // Take-home protocols track by time, not sessions
      protocolStatus = 'active';
      protocolEndDate = endDate;
      totalSessions = null;
      sessionsUsed = null;
    } else if (isPackProtocol) {
      // Pack protocol - no end date, track by sessions
      protocolStatus = 'active';
      protocolEndDate = null;
      sessionsUsed = 0;
    }

    // Build notes with additional info
    let finalNotes = notes || '';
    if (hrtGender || hrtSupplyType) {
      const hrtInfo = [];
      if (hrtGender) hrtInfo.push(`Gender: ${hrtGender}`);
      if (hrtSupplyType) hrtInfo.push(`Supply: ${hrtSupplyType}`);
      finalNotes = finalNotes ? `${finalNotes}\n${hrtInfo.join(', ')}` : hrtInfo.join(', ');
    }
    if (startWeight || goalWeight) {
      const wlInfo = [];
      if (startWeight) wlInfo.push(`Start: ${startWeight}lbs`);
      if (goalWeight) wlInfo.push(`Goal: ${goalWeight}lbs`);
      finalNotes = finalNotes ? `${finalNotes}\n${wlInfo.join(', ')}` : wlInfo.join(', ');
    }

    // Create the protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .insert({
        patient_id: finalPatientId,
        program_name: template.name,
        program_type: template.program_type || template.category || 'other',
        medication: medicationName,
        selected_dose: selectedDose || null,
        frequency: frequency || null,
        start_date: startDate,
        end_date: protocolEndDate,
        status: protocolStatus,
        total_sessions: totalSessions,
        sessions_used: sessionsUsed,
        delivery_method: deliveryMethod || null,
        notes: finalNotes || null,
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
