// /pages/api/protocols/assign.js
// Assign a protocol to a patient from a purchase
// Range Medical
// UPDATED: 2026-01-04 - Added comprehensive GHL sync for all protocol types

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { syncProtocolToGHL } from '../../../lib/ghl-sync';
import { WL_DRIP_EMAILS, personalizeEmail } from '../../../lib/wl-drip-emails';
import { isRecoveryPeptide, RECOVERY_CYCLE_MAX_DAYS, RECOVERY_CYCLE_OFF_DAYS, isGHPeptide, GH_CYCLE_MAX_DAYS, GH_CYCLE_OFF_DAYS, getCycleConfig } from '../../../lib/protocol-config';
import { logComm } from '../../../lib/comms-log';
import { calculateNextExpectedDate } from '../../../lib/auto-protocol';

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
      supplyType,
      // HRT additional fields
      hrtType,
      hrtRemindersEnabled,
      hrtReminderSchedule,
      followupDate,
      hrtInitialQuantity
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
      programName = 'Weight Loss Program';
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

    // For labs, store panel type (Essential/Elite) as medication
    if (programType === 'labs') {
      const templateNameLower = (programName || '').toLowerCase();
      medicationName = templateNameLower.includes('elite') ? 'Elite' : 'Essential';
    }

    // ============================================
    // PEPTIDE CYCLE TRACKING (Recovery + GH)
    // ============================================
    let cycleStartDate = null;
    const cycleConfig = getCycleConfig(medicationName);
    if (cycleConfig) {
      const filterFn = cycleConfig.type === 'recovery' ? isRecoveryPeptide : isGHPeptide;
      const maxDays = cycleConfig.maxDays;
      const offDays = cycleConfig.offDays;

      // Query existing peptide protocols with cycle_start_date for this patient
      const { data: existingCycleProtocols } = await supabase
        .from('protocols')
        .select('id, medication, start_date, end_date, status, cycle_start_date')
        .eq('patient_id', finalPatientId)
        .eq('program_type', 'peptide')
        .not('status', 'in', '("cancelled","merged")')
        .not('cycle_start_date', 'is', null)
        .order('cycle_start_date', { ascending: false });

      // Filter to only the same peptide type (recovery or GH)
      const matchingProtocols = (existingCycleProtocols || []).filter(p => filterFn(p.medication));

      if (matchingProtocols.length === 0) {
        // No prior cycle — start a new one
        cycleStartDate = startDate;
      } else {
        // Find the latest cycle
        const latestCycleDate = matchingProtocols[0].cycle_start_date;
        const cycleProtocols = matchingProtocols.filter(p => p.cycle_start_date === latestCycleDate);

        // Sum days used in this cycle
        let cycleDaysUsed = 0;
        for (const p of cycleProtocols) {
          const s = new Date(p.start_date + 'T12:00:00');
          const e = p.end_date ? new Date(p.end_date + 'T12:00:00') : new Date();
          cycleDaysUsed += Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
        }

        if (cycleDaysUsed < maxDays) {
          // Cycle not exhausted — continue same cycle
          cycleStartDate = latestCycleDate;
        } else {
          // Cycle exhausted — check if off period has passed
          const latestEnd = cycleProtocols
            .filter(p => p.end_date)
            .map(p => new Date(p.end_date + 'T12:00:00'))
            .sort((a, b) => b - a)[0];

          if (latestEnd) {
            const offEnd = new Date(latestEnd);
            offEnd.setDate(offEnd.getDate() + offDays);
            // Whether off period passed or not, start a new cycle (warning only, no block)
            cycleStartDate = startDate;
          } else {
            cycleStartDate = startDate;
          }
        }
      }
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
        starting_dose: selectedDose || null, // Track initial dose for WL protocols
        frequency: frequency || template?.frequency,
        delivery_method: deliveryMethod || template?.delivery_method || null,
        start_date: startDate,
        end_date: endDate,
        total_sessions: finalTotalSessions,
        sessions_used: 0,
        status: programType === 'labs' ? 'blood_draw_complete' : (isSingle ? 'completed' : 'active'),
        notes: notes,
        // Peptide vial specific fields
        num_vials: numVials || null,
        // Weight loss specific fields
        pickup_frequency: pickupFrequencyDays || null,
        injection_frequency: injectionFrequencyDays || null,
        injection_day: injectionDay || null,
        checkin_reminder_enabled: checkinReminderEnabled || false,
        peptide_reminders_enabled: (programType === 'peptide' && isRecoveryPeptide(medicationName)) ? true : false,
        // HRT vial-specific fields
        dose_per_injection: dosePerInjection ? parseFloat(dosePerInjection) : null,
        injections_per_week: injectionsPerWeek ? parseInt(injectionsPerWeek) : null,
        vial_size: vialSize ? parseFloat(vialSize) : null,
        supply_type: supplyType || null,
        // HRT additional fields
        hrt_type: hrtType || null,
        hrt_reminders_enabled: hrtRemindersEnabled || false,
        hrt_reminder_schedule: hrtReminderSchedule || null,
        hrt_followup_date: followupDate || null,
        last_refill_date: startDate, // Initialize refill date to start date
        next_expected_date: (() => {
          // For HRT take-home, calculate next supply date from initial quantity
          if (programType === 'hrt' && hrtInitialQuantity && (deliveryMethod || 'take_home') === 'take_home') {
            const perWeek = injectionsPerWeek ? parseInt(injectionsPerWeek) : 2;
            const qty = parseInt(hrtInitialQuantity);
            const weeksSupply = qty / perWeek;
            const supplyDays = Math.round(weeksSupply * 7);
            const nextDate = new Date(startDate + 'T12:00:00');
            nextDate.setDate(nextDate.getDate() + supplyDays);
            return nextDate.toISOString().split('T')[0];
          }
          return calculateNextExpectedDate({
            protocolType: programType,
            startDate,
            supplyType: supplyType || null,
            pickupFrequency: pickupFrequencyDays || null,
          });
        })(),
        cycle_start_date: cycleStartDate,
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
    // CHECK FOR PAST APPOINTMENTS (for package protocols)
    // Automatically sync sessions_used from past "showed" appointments
    // ============================================
    const packageTypes = ['hbot', 'rlt', 'red_light', 'iv', 'iv_therapy', 'injection', 'injection_pack'];
    if (packageTypes.includes(programType) && finalTotalSessions && finalGhlContactId) {
      console.log('Checking for past appointments for package protocol:', programType);

      try {
        // Map protocol type to calendar names
        const calendarMappings = {
          'hbot': ['Hyperbaric Oxygen Therapy', 'HBOT'],
          'rlt': ['Red Light Therapy', 'RLT'],
          'red_light': ['Red Light Therapy', 'RLT'],
          'iv': ['Range IV', 'NAD+ IV', 'Vitamin C IV', 'Glutathione IV', 'Methylene Blue IV', 'Hydration IV', 'Exosome IV', 'BYO IV', 'BYO - IV'],
          'iv_therapy': ['Range IV', 'NAD+ IV', 'Vitamin C IV', 'Glutathione IV', 'Methylene Blue IV', 'Hydration IV', 'Exosome IV', 'BYO IV', 'BYO - IV'],
          'injection': ['Range Injections', 'NAD+ Injection', 'Glutathione Injection', 'B12 Injection', 'Vitamin Injection'],
          'injection_pack': ['Range Injections', 'NAD+ Injection', 'Glutathione Injection', 'B12 Injection', 'Vitamin Injection']
        };

        const targetCalendars = calendarMappings[programType] || [];

        // Fetch past appointments with status "showed" or "completed"
        const { data: pastAppointments, error: aptError } = await supabase
          .from('clinic_appointments')
          .select('*')
          .eq('ghl_contact_id', finalGhlContactId)
          .in('status', ['showed', 'completed'])
          .order('appointment_date', { ascending: true });

        if (!aptError && pastAppointments && pastAppointments.length > 0) {
          // Filter appointments that match this protocol type
          const matchingAppointments = pastAppointments.filter(apt => {
            const calName = apt.calendar_name || '';
            // Partial match for calendar names
            return targetCalendars.some(target =>
              calName.toLowerCase().includes(target.toLowerCase()) ||
              target.toLowerCase().includes(calName.toLowerCase())
            );
          });

          if (matchingAppointments.length > 0) {
            console.log(`Found ${matchingAppointments.length} past ${programType} appointments`);

            // Update protocol with sessions_used
            const sessionsUsed = Math.min(matchingAppointments.length, finalTotalSessions);
            const newStatus = sessionsUsed >= finalTotalSessions ? 'completed' : 'active';

            const { error: updateError } = await supabase
              .from('protocols')
              .update({
                sessions_used: sessionsUsed,
                status: newStatus,
                updated_at: new Date().toISOString()
              })
              .eq('id', protocol.id);

            if (updateError) {
              console.error('Error updating sessions from past appointments:', updateError);
            } else {
              console.log(`Updated protocol: ${sessionsUsed}/${finalTotalSessions} sessions from past appointments`);
              // Update protocol object for response
              protocol.sessions_used = sessionsUsed;
              protocol.status = newStatus;
            }
          }
        }
      } catch (syncError) {
        console.error('Past appointment sync error (non-fatal):', syncError);
      }
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

    // ============================================
    // SEND FIRST DRIP EMAIL (weight loss only)
    // ============================================
    let dripEmailSent = false;
    if (programType === 'weight_loss') {
      try {
        // Check if this patient has EVER received drip emails from any WL protocol
        const { data: previousDrips } = await supabase
          .from('protocol_logs')
          .select('id')
          .eq('patient_id', finalPatientId)
          .eq('log_type', 'drip_email')
          .limit(1);

        if (previousDrips && previousDrips.length > 0) {
          console.log(`Patient ${finalPatientId} already received WL drip emails — skipping (monthly renewal)`);
          // Mark all 4 as "sent" on this protocol so the cron skips it too
          const today = new Date().toISOString().split('T')[0];
          await supabase.from('protocol_logs').insert([
            { protocol_id: protocol.id, patient_id: finalPatientId, log_type: 'drip_email', log_date: today, notes: 'Drip emails skipped — patient previously received sequence' },
            { protocol_id: protocol.id, patient_id: finalPatientId, log_type: 'drip_email', log_date: today, notes: 'Drip email 2 skipped' },
            { protocol_id: protocol.id, patient_id: finalPatientId, log_type: 'drip_email', log_date: today, notes: 'Drip email 3 skipped' },
            { protocol_id: protocol.id, patient_id: finalPatientId, log_type: 'drip_email', log_date: today, notes: 'Drip email 4 skipped' }
          ]);
        } else {
        // Look up patient email and first name
        const { data: patientData } = await supabase
          .from('patients')
          .select('email, first_name, name')
          .eq('id', finalPatientId)
          .single();

        if (patientData?.email) {
          const firstName = patientData.first_name || (patientData.name ? patientData.name.split(' ')[0] : null);
          const emailTemplate = WL_DRIP_EMAILS[0];
          const personalizedHtml = personalizeEmail(emailTemplate.html, firstName);

          const resend = new Resend(process.env.RESEND_API_KEY);
          const { error: sendError } = await resend.emails.send({
            from: 'Range Medical <noreply@range-medical.com>',
            replyTo: 'info@range-medical.com',
            to: patientData.email,
            subject: emailTemplate.subject,
            html: personalizedHtml
          });

          if (sendError) {
            console.error('Drip email 1 send error:', sendError);
            await logComm({ channel: 'email', messageType: 'drip_email_1', message: `Drip email 1: ${emailTemplate.subject}`, source: 'assign', patientId: finalPatientId, protocolId: protocol.id, patientName, recipient: patientData.email, subject: emailTemplate.subject, status: 'error', errorMessage: sendError.message });
          } else {
            // Log so the cron doesn't re-send it
            await supabase.from('protocol_logs').insert({
              protocol_id: protocol.id,
              patient_id: finalPatientId,
              log_type: 'drip_email',
              log_date: new Date().toISOString().split('T')[0],
              notes: `Drip email 1: ${emailTemplate.subject}`
            });
            await logComm({ channel: 'email', messageType: 'drip_email_1', message: `Drip email 1: ${emailTemplate.subject}`, source: 'assign', patientId: finalPatientId, protocolId: protocol.id, patientName, recipient: patientData.email, subject: emailTemplate.subject });
            dripEmailSent = true;
            console.log('Drip email 1 sent to', patientData.email);
          }
        } else {
          console.log('No patient email - skipping drip email 1');
        }
        } // close else (no previous drips)
      } catch (dripError) {
        console.error('Drip email error (non-fatal):', dripError);
      }
    }

    // ============================================
    // SEND PEPTIDE GUIDE SMS (recovery peptides only)
    // Skip if patient has already received the guide before (any previous protocol)
    // ============================================
    let peptideGuideSent = false;
    if (programType === 'peptide' && isRecoveryPeptide(medicationName) && finalGhlContactId) {
      try {
        // Check if this patient has already received the peptide guide
        const { data: existingGuide } = await supabase
          .from('protocol_logs')
          .select('id')
          .eq('patient_id', finalPatientId)
          .eq('log_type', 'peptide_guide_sent')
          .limit(1);

        if (existingGuide && existingGuide.length > 0) {
          console.log('Peptide guide already sent to patient', finalPatientId, '- skipping');
          peptideGuideSent = false;
        } else {

        // Look up patient first name
        const { data: patientData } = await supabase
          .from('patients')
          .select('first_name, name')
          .eq('id', finalPatientId)
          .single();

        const firstName = patientData?.first_name || (patientData?.name ? patientData.name.split(' ')[0] : 'there');

        const guideMessage = `Hi ${firstName}! Here's your guide to your recovery peptide protocol: https://www.range-medical.com/bpc-tb4-guide - Range Medical`;

        const smsRes = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
            'Content-Type': 'application/json',
            'Version': '2021-04-15'
          },
          body: JSON.stringify({
            type: 'SMS',
            contactId: finalGhlContactId,
            message: guideMessage
          })
        });

        const smsData = await smsRes.json();

        if (smsRes.ok) {
          // Mark guide sent on protocol
          await supabase
            .from('protocols')
            .update({ peptide_guide_sent: true })
            .eq('id', protocol.id);

          // Log to protocol_logs to prevent double-sends
          await supabase.from('protocol_logs').insert({
            protocol_id: protocol.id,
            patient_id: finalPatientId,
            log_type: 'peptide_guide_sent',
            log_date: new Date().toISOString().split('T')[0],
            notes: guideMessage
          });

          await logComm({ channel: 'sms', messageType: 'peptide_guide_sent', message: guideMessage, source: 'assign', patientId: finalPatientId, protocolId: protocol.id, ghlContactId: finalGhlContactId, patientName });

          peptideGuideSent = true;
          console.log('Peptide guide SMS sent to', finalGhlContactId);
        } else {
          console.error('Peptide guide SMS error:', smsData);
          await logComm({ channel: 'sms', messageType: 'peptide_guide_sent', message: guideMessage, source: 'assign', patientId: finalPatientId, protocolId: protocol.id, ghlContactId: finalGhlContactId, patientName, status: 'error', errorMessage: smsData?.message || 'SMS failed' });
        }

        } // end else (guide not previously sent)
      } catch (guideError) {
        console.error('Peptide guide SMS error (non-fatal):', guideError);
      }
    }

    // ============================================
    // SEND SKIN PEPTIDE GUIDE SMS (GLOW protocols only, not KLOW)
    // Skip if patient has already received the skin guide before
    // ============================================
    let skinGuideSent = false;
    const isSkinPeptide = (name) => name && name.toLowerCase().includes('glow') && !name.toLowerCase().includes('klow');

    if (programType === 'peptide' && isSkinPeptide(medicationName) && finalGhlContactId) {
      try {
        // Check if this patient has already received the skin peptide guide
        const { data: existingSkinGuide } = await supabase
          .from('protocol_logs')
          .select('id')
          .eq('patient_id', finalPatientId)
          .eq('log_type', 'skin_guide_sent')
          .limit(1);

        if (existingSkinGuide && existingSkinGuide.length > 0) {
          console.log('Skin peptide guide already sent to patient', finalPatientId, '- skipping');
          skinGuideSent = false;
        } else {

        // Look up patient first name
        const { data: skinPatientData } = await supabase
          .from('patients')
          .select('first_name, name')
          .eq('id', finalPatientId)
          .single();

        const skinFirstName = skinPatientData?.first_name || (skinPatientData?.name ? skinPatientData.name.split(' ')[0] : 'there');

        const skinGuideMessage = `Hi ${skinFirstName}! Here's your guide to your GLOW skin peptide protocol: https://www.range-medical.com/glow-guide - Range Medical`;

        const skinSmsRes = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
            'Content-Type': 'application/json',
            'Version': '2021-04-15'
          },
          body: JSON.stringify({
            type: 'SMS',
            contactId: finalGhlContactId,
            message: skinGuideMessage
          })
        });

        const skinSmsData = await skinSmsRes.json();

        if (skinSmsRes.ok) {
          // Mark guide sent on protocol
          await supabase
            .from('protocols')
            .update({ peptide_guide_sent: true })
            .eq('id', protocol.id);

          // Log to protocol_logs to prevent double-sends
          await supabase.from('protocol_logs').insert({
            protocol_id: protocol.id,
            patient_id: finalPatientId,
            log_type: 'skin_guide_sent',
            log_date: new Date().toISOString().split('T')[0],
            notes: skinGuideMessage
          });

          await logComm({ channel: 'sms', messageType: 'skin_guide_sent', message: skinGuideMessage, source: 'assign', patientId: finalPatientId, protocolId: protocol.id, ghlContactId: finalGhlContactId, patientName });

          skinGuideSent = true;
          console.log('Skin peptide guide SMS sent to', finalGhlContactId);
        } else {
          console.error('Skin peptide guide SMS error:', skinSmsData);
          await logComm({ channel: 'sms', messageType: 'skin_guide_sent', message: skinGuideMessage, source: 'assign', patientId: finalPatientId, protocolId: protocol.id, ghlContactId: finalGhlContactId, patientName, status: 'error', errorMessage: skinSmsData?.message || 'SMS failed' });
        }

        } // end else (skin guide not previously sent)
      } catch (skinGuideError) {
        console.error('Skin peptide guide SMS error (non-fatal):', skinGuideError);
      }
    }

    res.status(200).json({
      success: true,
      protocol,
      purchaseUpdated: !!purchaseId,
      ghlSynced: !!finalGhlContactId,
      dripEmailSent,
      peptideGuideSent,
      skinGuideSent,
      message: `Protocol created: ${programName}`
    });

  } catch (error) {
    console.error('Error assigning protocol:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
}
