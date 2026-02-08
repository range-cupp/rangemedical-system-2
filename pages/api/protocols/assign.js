// /pages/api/protocols/assign.js
// Assign a protocol to a patient from a purchase
// Range Medical
// UPDATED: 2026-01-04 - Added comprehensive GHL sync for all protocol types

import { createClient } from '@supabase/supabase-js';
import { syncProtocolToGHL } from '../../../lib/ghl-sync';

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
      wlDuration,
      // Peptide vial specific fields
      numVials,
      peptideDurationDays,
      // Weight loss specific fields
      wlMedication,
      pickupFrequencyDays,
      injectionFrequencyDays,
      injectionDay,
      checkinReminderEnabled,
      // HRT vial-specific fields
      dosePerInjection,
      injectionsPerWeek,
      vialSize,
      supplyType
    } = req.body;

    // For non-weight-loss, template is required
    if (!isWeightLoss && !templateId) {
      return res.status(400).json({ error: 'Template is required' });
    }

    // Find or determine patient_id and ghl_contact_id
    let finalPatientId = patientId;
    let finalGhlContactId = ghlContactId;

    if (!finalPatientId && ghlContactId) {
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id, ghl_contact_id')
        .eq('ghl_contact_id', ghlContactId)
        .single();

      if (existingPatient) {
        finalPatientId = existingPatient.id;
        finalGhlContactId = existingPatient.ghl_contact_id;
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
        finalGhlContactId = newPatient.ghl_contact_id;
      }
    }

    // If we have patientId but no ghlContactId, look it up
    if (finalPatientId && !finalGhlContactId) {
      const { data: patient } = await supabase
        .from('patients')
        .select('ghl_contact_id')
        .eq('id', finalPatientId)
        .single();
      
      finalGhlContactId = patient?.ghl_contact_id;
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
      // Use pickupFrequencyDays as the payment period (determines protocol duration)
      const paymentPeriod = pickupFrequencyDays || wlDuration || 28;
      const durationLabel = paymentPeriod === 7 ? 'Weekly' : paymentPeriod === 14 ? 'Every 2 Weeks' : 'Monthly';
      programName = `Weight Loss - ${durationLabel}`;
      programType = 'weight_loss';

      // Set total sessions based on payment period (weekly injections)
      // Weekly = 1 session, Every 2 weeks = 2 sessions, Monthly = 4 sessions
      if (deliveryMethod === 'in_clinic') {
        finalTotalSessions = totalSessions || Math.floor(paymentPeriod / 7);
      } else {
        // Take-home: sessions based on pickup period
        finalTotalSessions = totalSessions || Math.floor(paymentPeriod / 7);
      }

      // Calculate end date based on payment period
      if (startDate && paymentPeriod) {
        const start = new Date(startDate);
        start.setDate(start.getDate() + paymentPeriod);
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

      // For weight loss templates, override end_date with pickupFrequencyDays
      if (programType === 'weight_loss' && pickupFrequencyDays && startDate) {
        const start = new Date(startDate);
        start.setDate(start.getDate() + pickupFrequencyDays);
        endDate = start.toISOString().split('T')[0];
      }

      // For peptide templates, override end_date with peptideDurationDays
      if (programType === 'peptide' && peptideDurationDays && startDate) {
        const start = new Date(startDate);
        start.setDate(start.getDate() + peptideDurationDays);
        endDate = start.toISOString().split('T')[0];

        // For in-clinic peptides, set total_sessions based on duration (1 injection per day)
        if (deliveryMethod === 'in_clinic') {
          finalTotalSessions = peptideDurationDays;
        }
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

    // For weight loss, use wlMedication as the medication name
    if (isWeightLoss && wlMedication) {
      medicationName = wlMedication;
    }

    // For weight loss from template, also use wlMedication
    if (programType === 'weight_loss' && wlMedication) {
      medicationName = wlMedication;
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
        // Peptide vial specific fields
        num_vials: numVials || null,
        // Weight loss specific fields
        pickup_frequency: pickupFrequencyDays || null,
        injection_frequency: injectionFrequencyDays || null,
        injection_day: injectionDay || null,
        checkin_reminder_enabled: checkinReminderEnabled || false,
        // HRT vial-specific fields
        dose_per_injection: dosePerInjection ? parseFloat(dosePerInjection) : null,
        injections_per_week: injectionsPerWeek ? parseInt(injectionsPerWeek) : null,
        vial_size: vialSize ? parseFloat(vialSize) : null,
        supply_type: supplyType || null,
        last_refill_date: startDate, // Initialize refill date to start date
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (protocolError) {
      console.error('Protocol creation error:', protocolError);
      throw protocolError;
    }

    // Link purchase to protocol - set BOTH protocol_id and protocol_created
    if (purchaseId) {
      console.log('Linking purchase to protocol:', purchaseId, '->', protocol.id);
      
      const { data: updatedPurchase, error: updateError } = await supabase
        .from('purchases')
        .update({ 
          protocol_id: protocol.id,
          protocol_created: true
        })
        .eq('id', purchaseId)
        .select();
      
      if (updateError) {
        console.error('Error updating purchase:', updateError);
      } else {
        console.log('Purchase linked successfully:', updatedPurchase);
      }
    } else {
      console.warn('No purchaseId provided - purchase will remain in pipeline');
    }

    // ============================================
    // SYNC TO GHL
    // ============================================
    if (finalGhlContactId) {
      console.log('Syncing protocol to GHL:', finalGhlContactId);
      
      try {
        await syncProtocolToGHL(finalGhlContactId, protocol, patientName, 'created');
      } catch (syncError) {
        console.error('GHL sync error (non-fatal):', syncError);
        // Don't fail the request if GHL sync fails
      }
    } else {
      console.log('No GHL contact ID - skipping GHL sync');
    }

    res.status(200).json({ 
      success: true, 
      protocol,
      purchaseUpdated: !!purchaseId,
      ghlSynced: !!finalGhlContactId,
      message: `Protocol created: ${programName}`
    });

  } catch (error) {
    console.error('Error assigning protocol:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
}
