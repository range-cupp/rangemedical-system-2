// /pages/api/protocols/assign.js
// Assign a protocol to a patient from a purchase
// Range Medical
// UPDATED: 2026-01-04 - Added comprehensive GHL sync for all protocol types

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { syncProtocolToGHL } from '../../../lib/ghl-sync';
import { WL_DRIP_EMAILS, personalizeEmail } from '../../../lib/wl-drip-emails';
import { isRecoveryPeptide, RECOVERY_CYCLE_MAX_DAYS, RECOVERY_CYCLE_OFF_DAYS, isGHPeptide, GH_CYCLE_MAX_DAYS, GH_CYCLE_OFF_DAYS, getCycleConfig, isWeightLossType, isHRTType } from '../../../lib/protocol-config';
import { logComm } from '../../../lib/comms-log';
import { calculateNextExpectedDate } from '../../../lib/auto-protocol';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { isInQuietHours } from '../../../lib/quiet-hours';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Guide URL mapping for all protocol types
// Returns a URL slug (e.g. '/hrt-guide') or null if no guide exists
function getGuideUrl(programType, programName, medicationName, patientGender) {
  const name = (programName || '').toLowerCase();
  const med = (medicationName || '').toLowerCase();

  // HRT
  if (isHRTType(programType)) return '/hrt-guide';

  // Weight Loss — medication-specific
  if (isWeightLossType(programType)) {
    if (med.includes('tirzepatide')) return '/tirzepatide-guide';
    if (med.includes('retatrutide')) return '/retatrutide-guide';
    return null; // semaglutide has no guide yet
  }

  // IV Therapy — match medication name
  if (programType === 'iv' || programType === 'iv_therapy') {
    if (med.includes('cellular reset') || name.includes('cellular reset')) return '/cellular-reset-guide';
    if (med.includes('mb + vit c') || med.includes('combo') || name.includes('combo')) return '/methylene-blue-combo-iv-guide';
    if (med.includes('methylene blue')) return '/methylene-blue-iv-guide';
    if (med.includes('nad')) return '/nad-guide';
    if (med.includes('glutathione')) return '/glutathione-iv-guide';
    if (med.includes('vitamin c')) return '/vitamin-c-iv-guide';
    if (med.includes('range iv') || name.includes('range iv')) return '/range-iv-guide';
    return null;
  }

  // HBOT
  if (programType === 'hbot') return '/hbot-guide';

  // RLT
  if (programType === 'rlt' || programType === 'red_light') return '/red-light-guide';

  // Combo membership
  if (name.includes('combo')) return '/combo-membership-guide';

  // Peptide vials — match medication/program name to guide page
  if (programType === 'peptide') {
    if (name.includes('nad') || med.includes('nad')) return '/nad-guide';
    if (name.includes('bpc') || name.includes('tb4') || name.includes('thymosin') || med.includes('bpc') || med.includes('tb4')) return '/bpc-tb4-guide';
    if (name.includes('mots') || med.includes('mots')) return '/mots-c-guide';
    if (name.includes('tesamorelin') || name.includes('tesam') || med.includes('tesamorelin')) return '/tesamorelin-ipamorelin';
    if (name.includes('cjc') || med.includes('cjc')) return '/cjc-ipamorelin-guide';
    if (name.includes('aod') || med.includes('aod')) return '/aod-9604';
    if (name.includes('glow') || med.includes('glow')) return '/glow-guide';
  }

  // The Blu
  if (med.includes('blu') || name.includes('blu')) return '/the-blu-guide';

  // Labs — gender-specific guides
  if (programType === 'labs') {
    const isElite = med.includes('elite') || name.includes('elite');
    const isMale = patientGender?.toLowerCase() === 'male';
    if (isElite) return isMale ? '/elite-panel-male-guide' : '/elite-panel-female-guide';
    return isMale ? '/essential-panel-male-guide' : '/essential-panel-female-guide';
  }

  return null;
}

// Generate branded email HTML for protocol guide links
function generateGuideEmailHtml({ firstName, guideName, guideUrl }) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Guide — Range Medical</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; max-width: 600px;">
                    <tr>
                        <td style="background-color: #000000; padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.1em;">RANGE MEDICAL</h1>
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">Your Protocol Guide</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Hi ${firstName},</p>
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Here's your guide for your ${guideName} protocol. It covers everything you need to know — dosing, schedule, and what to expect.</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <a href="${guideUrl}" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 500;">
                                            View Your Guide
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 8px; color: #666; font-size: 13px; line-height: 1.6;">If you have any questions about your protocol, don't hesitate to reach out to us.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 30px; border-top: 1px solid #e5e5e5; background-color: #fafafa;">
                            <p style="margin: 0 0 4px; color: #999; font-size: 12px;">Range Medical</p>
                            <p style="margin: 0 0 4px; color: #999; font-size: 12px;">Questions? Call us at (949) 997-3988</p>
                            <p style="margin: 0; color: #999; font-size: 12px;">www.range-medical.com</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

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
      dosesPerVial,
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
      injectionMethod,
      hrtRemindersEnabled,
      hrtReminderSchedule,
      followupDate,
      hrtInitialQuantity,
      secondaryMedication,
      // Membership override fields
      programTypeOverride,
      programNameOverride,
      membershipEndDays
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

      // Standardize HRT program name
      if (programType === 'hrt') programName = 'HRT Protocol';

      // Apply membership overrides
      if (programTypeOverride) programType = programTypeOverride;
      if (programNameOverride) programName = programNameOverride;

      // For memberships, set end_date to N days from start
      if (membershipEndDays && startDate) {
        const start = new Date(startDate);
        start.setDate(start.getDate() + membershipEndDays);
        endDate = start.toISOString().split('T')[0];
      }

      // combo_membership is not a valid program_type — should always be overridden
      if (programType === 'combo_membership' && !programTypeOverride) {
        programType = 'hbot';
      }

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
      if (isWeightLossType(programType) && pickupFrequencyDays && startDate) {
        const start = new Date(startDate);
        start.setDate(start.getDate() + pickupFrequencyDays);
        endDate = start.toISOString().split('T')[0];
      }

      // For peptide templates with vial data, compute total_sessions and duration from vials
      if (programType === 'peptide' && numVials && dosesPerVial && startDate) {
        const totalDoses = parseInt(numVials) * parseInt(dosesPerVial);
        finalTotalSessions = totalDoses;

        // Calculate duration based on frequency
        const freq = frequency || template?.frequency || 'Daily';
        let durationDays;
        if (freq === '5 on / 2 off') {
          durationDays = Math.ceil(totalDoses * 7 / 5);
        } else if (freq === 'Every other day') {
          durationDays = totalDoses * 2;
        } else if (freq === '2x per week') {
          durationDays = Math.ceil(totalDoses / 2 * 7);
        } else if (freq === '3x per week') {
          durationDays = Math.ceil(totalDoses / 3 * 7);
        } else if (freq === 'Weekly') {
          durationDays = totalDoses * 7;
        } else if (freq === '2x daily') {
          durationDays = Math.ceil(totalDoses / 2);
        } else {
          durationDays = totalDoses; // Daily or default
        }

        const start = new Date(startDate);
        start.setDate(start.getDate() + durationDays);
        endDate = start.toISOString().split('T')[0];
      }
      // Fallback: use peptideDurationDays if provided without vial data
      else if (programType === 'peptide' && peptideDurationDays && startDate) {
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
    if (isWeightLossType(programType) && wlMedication) {
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

    // ============================================
    // DUPLICATE PREVENTION — For take-home HRT/weight_loss/peptide,
    // check if an active protocol already exists. If so, extend it
    // instead of creating a duplicate.
    // ============================================
    const takeHomeTypes = ['hrt', 'weight_loss', 'peptide'];
    if (takeHomeTypes.includes(programType) && deliveryMethod !== 'in_clinic') {
      const { data: existingProtocols } = await supabase
        .from('protocols')
        .select('*')
        .eq('patient_id', finalPatientId)
        .eq('program_type', programType)
        .eq('status', 'active');

      // Find a matching protocol (same medication if specified)
      const matchingProtocol = (existingProtocols || []).find(p => {
        if (medicationName && p.medication) {
          return p.medication.toLowerCase() === medicationName.toLowerCase();
        }
        return true; // If no medication specified, match any active protocol of this type
      });

      if (matchingProtocol) {
        console.log(`Duplicate prevention: Found existing active ${programType} protocol ${matchingProtocol.id} for patient ${finalPatientId}. Extending instead of creating new.`);

        // Calculate new end date (extend by 30 days)
        const currentEndDate = matchingProtocol.end_date ? new Date(matchingProtocol.end_date + 'T12:00:00') : new Date();
        const today = new Date();
        const startFrom = currentEndDate < today ? today : currentEndDate;
        const newEnd = new Date(startFrom);
        newEnd.setDate(newEnd.getDate() + 30);
        const newEndDate = newEnd.toISOString().split('T')[0];

        // Extend the existing protocol
        const { data: updatedProtocol, error: updateError } = await supabase
          .from('protocols')
          .update({
            end_date: newEndDate,
            last_payment_date: new Date().toISOString().split('T')[0],
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', matchingProtocol.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error extending existing protocol:', updateError);
          throw updateError;
        }

        // Link purchase to existing protocol
        if (purchaseId) {
          await supabase
            .from('purchases')
            .update({
              protocol_id: matchingProtocol.id,
              protocol_created: true
            })
            .eq('id', purchaseId);
        }

        // Create a payment log entry
        await supabase
          .from('protocol_logs')
          .insert({
            protocol_id: matchingProtocol.id,
            patient_id: finalPatientId,
            log_type: 'payment',
            log_date: new Date().toISOString().split('T')[0],
            notes: `Monthly payment recorded (auto-linked from purchase). New end date: ${newEndDate}`
          });

        return res.status(200).json({
          success: true,
          linkedToExisting: true,
          protocol: updatedProtocol,
          message: `Linked to existing ${programType} protocol and extended end date to ${newEndDate}`
        });
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
        num_vials: numVials ? parseInt(numVials) : null,
        doses_per_vial: dosesPerVial ? parseInt(dosesPerVial) : null,
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
        injection_method: injectionMethod || null,
        hrt_reminders_enabled: hrtRemindersEnabled || false,
        hrt_reminder_schedule: hrtReminderSchedule || null,
        hrt_followup_date: followupDate || null,
        secondary_medication: secondaryMedication || null,
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
    if (isWeightLossType(programType)) {
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
    // Uses direct SMS — not GHL. Respects quiet hours.
    // ============================================
    let peptideGuideSent = false;
    if (programType === 'peptide' && isRecoveryPeptide(medicationName)) {
      try {
        const { data: existingGuide } = await supabase
          .from('protocol_logs')
          .select('id')
          .eq('patient_id', finalPatientId)
          .eq('log_type', 'peptide_guide_sent')
          .limit(1);

        if (existingGuide && existingGuide.length > 0) {
          console.log('Peptide guide already sent to patient', finalPatientId, '- skipping');
        } else if (!isInQuietHours()) {
          const { data: patientData } = await supabase
            .from('patients')
            .select('first_name, name, phone')
            .eq('id', finalPatientId)
            .single();

          const pepPhone = patientData?.phone ? normalizePhone(patientData.phone) : null;
          if (pepPhone) {
            const firstName = patientData?.first_name || (patientData?.name ? patientData.name.split(' ')[0] : 'there');
            const guideMessage = `Hi ${firstName}! Here's your guide to your recovery peptide protocol: https://www.range-medical.com/bpc-tb4-guide - Range Medical`;

            const smsResult = await sendSMS({ to: pepPhone, message: guideMessage });
            if (smsResult.success) {
              await supabase.from('protocols').update({ peptide_guide_sent: true }).eq('id', protocol.id);
              await supabase.from('protocol_logs').insert({ protocol_id: protocol.id, patient_id: finalPatientId, log_type: 'peptide_guide_sent', log_date: new Date().toISOString().split('T')[0], notes: guideMessage });
              await logComm({ channel: 'sms', messageType: 'peptide_guide_sent', message: guideMessage, source: 'assign', patientId: finalPatientId, protocolId: protocol.id, patientName, provider: smsResult.provider });
              peptideGuideSent = true;
              console.log('Peptide guide SMS sent via', smsResult.provider, 'to', pepPhone);
            } else {
              console.error('Peptide guide SMS error:', smsResult.error);
            }
          }
        } else {
          console.log('Peptide guide SMS skipped (quiet hours) for patient', finalPatientId);
        }
      } catch (guideError) {
        console.error('Peptide guide SMS error (non-fatal):', guideError);
      }
    }

    // ============================================
    // SEND PEPTIDE GUIDE EMAIL (recovery peptides — email fallback)
    // ============================================
    if (programType === 'peptide' && isRecoveryPeptide(medicationName)) {
      try {
        const { data: existingEmailGuide } = await supabase
          .from('protocol_logs')
          .select('id')
          .eq('patient_id', finalPatientId)
          .eq('log_type', 'peptide_guide_email_sent')
          .limit(1);

        if (!existingEmailGuide || existingEmailGuide.length === 0) {
          const { data: pepEmailPatient } = await supabase
            .from('patients')
            .select('email, first_name, name')
            .eq('id', finalPatientId)
            .single();

          if (pepEmailPatient?.email) {
            const pepFirstName = pepEmailPatient.first_name || (pepEmailPatient.name ? pepEmailPatient.name.split(' ')[0] : 'there');
            const pepGuideUrl = 'https://www.range-medical.com/bpc-tb4-guide';
            const pepEmailHtml = generateGuideEmailHtml({ firstName: pepFirstName, guideName: 'Recovery Peptide', guideUrl: pepGuideUrl });

            const resend = new Resend(process.env.RESEND_API_KEY);
            const { error: pepEmailError } = await resend.emails.send({
              from: 'Range Medical <noreply@range-medical.com>',
              to: pepEmailPatient.email,
              subject: 'Your Recovery Peptide Guide — Range Medical',
              html: pepEmailHtml,
            });

            if (!pepEmailError) {
              await supabase.from('protocol_logs').insert({
                protocol_id: protocol.id, patient_id: finalPatientId,
                log_type: 'peptide_guide_email_sent',
                log_date: new Date().toISOString().split('T')[0],
                notes: 'Peptide guide sent via email'
              });
              await logComm({ channel: 'email', messageType: 'peptide_guide_email_sent', message: pepEmailHtml, source: 'assign', patientId: finalPatientId, protocolId: protocol.id, patientName, recipient: pepEmailPatient.email, subject: 'Your Recovery Peptide Guide — Range Medical' });
              console.log('Peptide guide email sent to', pepEmailPatient.email);
            } else {
              console.error('Peptide guide email error:', pepEmailError);
            }
          }
        }
      } catch (pepEmailErr) {
        console.error('Peptide guide email error (non-fatal):', pepEmailErr);
      }
    }

    // ============================================
    // SEND SKIN PEPTIDE GUIDE SMS (GLOW protocols only, not KLOW)
    // Uses direct SMS — not GHL. Respects quiet hours.
    // ============================================
    let skinGuideSent = false;
    const isSkinPeptide = (name) => name && name.toLowerCase().includes('glow') && !name.toLowerCase().includes('klow');

    if (programType === 'peptide' && isSkinPeptide(medicationName)) {
      try {
        const { data: existingSkinGuide } = await supabase
          .from('protocol_logs')
          .select('id')
          .eq('patient_id', finalPatientId)
          .eq('log_type', 'skin_guide_sent')
          .limit(1);

        if (existingSkinGuide && existingSkinGuide.length > 0) {
          console.log('Skin peptide guide already sent to patient', finalPatientId, '- skipping');
        } else if (!isInQuietHours()) {
          const { data: skinPatientData } = await supabase
            .from('patients')
            .select('first_name, name, phone')
            .eq('id', finalPatientId)
            .single();

          const skinPhone = skinPatientData?.phone ? normalizePhone(skinPatientData.phone) : null;
          if (skinPhone) {
            const skinFirstName = skinPatientData?.first_name || (skinPatientData?.name ? skinPatientData.name.split(' ')[0] : 'there');
            const skinGuideMessage = `Hi ${skinFirstName}! Here's your guide to your GLOW peptide protocol: https://www.range-medical.com/glow-guide - Range Medical`;

            const smsResult = await sendSMS({ to: skinPhone, message: skinGuideMessage });
            if (smsResult.success) {
              await supabase.from('protocols').update({ peptide_guide_sent: true }).eq('id', protocol.id);
              await supabase.from('protocol_logs').insert({ protocol_id: protocol.id, patient_id: finalPatientId, log_type: 'skin_guide_sent', log_date: new Date().toISOString().split('T')[0], notes: skinGuideMessage });
              await logComm({ channel: 'sms', messageType: 'skin_guide_sent', message: skinGuideMessage, source: 'assign', patientId: finalPatientId, protocolId: protocol.id, patientName, provider: smsResult.provider });
              skinGuideSent = true;
              console.log('Skin peptide guide SMS sent via', smsResult.provider, 'to', skinPhone);
            } else {
              console.error('Skin peptide guide SMS error:', smsResult.error);
            }
          }
        } else {
          console.log('Skin peptide guide SMS skipped (quiet hours) for patient', finalPatientId);
        }
      } catch (skinGuideError) {
        console.error('Skin peptide guide SMS error (non-fatal):', skinGuideError);
      }
    }

    // ============================================
    // SEND SKIN PEPTIDE GUIDE EMAIL (GLOW — email fallback)
    // ============================================
    if (programType === 'peptide' && isSkinPeptide(medicationName)) {
      try {
        const { data: existingSkinEmailGuide } = await supabase
          .from('protocol_logs')
          .select('id')
          .eq('patient_id', finalPatientId)
          .eq('log_type', 'skin_guide_email_sent')
          .limit(1);

        if (!existingSkinEmailGuide || existingSkinEmailGuide.length === 0) {
          const { data: skinEmailPatient } = await supabase
            .from('patients')
            .select('email, first_name, name')
            .eq('id', finalPatientId)
            .single();

          if (skinEmailPatient?.email) {
            const skinEmailFirstName = skinEmailPatient.first_name || (skinEmailPatient.name ? skinEmailPatient.name.split(' ')[0] : 'there');
            const skinGuideUrl = 'https://www.range-medical.com/glow-guide';
            const skinEmailHtml = generateGuideEmailHtml({ firstName: skinEmailFirstName, guideName: 'GLOW Peptide', guideUrl: skinGuideUrl });

            const resend = new Resend(process.env.RESEND_API_KEY);
            const { error: skinEmailError } = await resend.emails.send({
              from: 'Range Medical <noreply@range-medical.com>',
              to: skinEmailPatient.email,
              subject: 'Your GLOW Peptide Guide — Range Medical',
              html: skinEmailHtml,
            });

            if (!skinEmailError) {
              await supabase.from('protocol_logs').insert({
                protocol_id: protocol.id, patient_id: finalPatientId,
                log_type: 'skin_guide_email_sent',
                log_date: new Date().toISOString().split('T')[0],
                notes: 'GLOW peptide guide sent via email'
              });
              await logComm({ channel: 'email', messageType: 'skin_guide_email_sent', message: skinEmailHtml, source: 'assign', patientId: finalPatientId, protocolId: protocol.id, patientName, recipient: skinEmailPatient.email, subject: 'Your GLOW Peptide Guide — Range Medical' });
              console.log('Skin peptide guide email sent to', skinEmailPatient.email);
            } else {
              console.error('Skin peptide guide email error:', skinEmailError);
            }
          }
        }
      } catch (skinEmailErr) {
        console.error('Skin peptide guide email error (non-fatal):', skinEmailErr);
      }
    }

    // ============================================
    // SEND GUIDE SMS (all protocol types)
    // One guide per type per patient — deduped via protocol_logs
    // Respects quiet hours (8am-8pm Pacific)
    // Uses direct SMS (Blooio/Twilio) — not GHL
    // ============================================
    let guideSent = false;

    try {
      // Look up patient gender for lab guides + phone for SMS
      const { data: guidePatientData } = await supabase
        .from('patients')
        .select('first_name, name, phone, gender')
        .eq('id', finalPatientId)
        .single();

      const patientGender = guidePatientData?.gender || null;
      const patientPhone = guidePatientData?.phone ? normalizePhone(guidePatientData.phone) : null;

      const guideSlug = getGuideUrl(programType, programName, medicationName, patientGender);

      if (guideSlug && patientPhone) {
        const guideLogType = `guide_sent_${guideSlug.replace(/^\//, '')}`;

        // Check if this patient has already received this specific guide
        const { data: existingGuide } = await supabase
          .from('protocol_logs')
          .select('id')
          .eq('patient_id', finalPatientId)
          .eq('log_type', guideLogType)
          .limit(1);

        if (existingGuide && existingGuide.length > 0) {
          console.log(`Guide ${guideSlug} already sent to patient ${finalPatientId} - skipping`);
        } else if (isInQuietHours()) {
          // Outside 8am-8pm Pacific — log but don't send
          console.log(`Guide ${guideSlug} skipped (quiet hours) for patient ${finalPatientId}`);
          // Still log it to prevent double-sends on next protocol creation
          const guideFirstName = guidePatientData?.first_name || (guidePatientData?.name ? guidePatientData.name.split(' ')[0] : 'there');
          const guideUrl = `https://www.range-medical.com${guideSlug}`;
          const guideMessage = `Hi ${guideFirstName}! Here's your guide: ${guideUrl} - Range Medical`;
          await supabase.from('protocol_logs').insert({
            protocol_id: protocol.id,
            patient_id: finalPatientId,
            log_type: guideLogType,
            log_date: new Date().toISOString().split('T')[0],
            notes: `[QUEUED - quiet hours] ${guideMessage}`
          });
        } else {
          const guideFirstName = guidePatientData?.first_name || (guidePatientData?.name ? guidePatientData.name.split(' ')[0] : 'there');
          const guideUrl = `https://www.range-medical.com${guideSlug}`;
          const guideMessage = `Hi ${guideFirstName}! Here's your guide: ${guideUrl} - Range Medical`;

          const smsResult = await sendSMS({ to: patientPhone, message: guideMessage });

          if (smsResult.success) {
            await supabase.from('protocol_logs').insert({
              protocol_id: protocol.id,
              patient_id: finalPatientId,
              log_type: guideLogType,
              log_date: new Date().toISOString().split('T')[0],
              notes: guideMessage
            });

            await logComm({ channel: 'sms', messageType: guideLogType, message: guideMessage, source: 'assign', patientId: finalPatientId, protocolId: protocol.id, patientName, provider: smsResult.provider });

            guideSent = true;
            console.log(`Guide SMS (${guideSlug}) sent via ${smsResult.provider} to ${patientPhone}`);
          } else {
            console.error('Guide SMS error:', smsResult.error);
            await logComm({ channel: 'sms', messageType: guideLogType, message: guideMessage, source: 'assign', patientId: finalPatientId, protocolId: protocol.id, patientName, status: 'error', errorMessage: smsResult.error || 'SMS failed' });
          }
        }
      }
    } catch (guideError) {
      console.error('Guide SMS error (non-fatal):', guideError);
    }

    // ============================================
    // SEND GUIDE EMAIL (all protocol types — email fallback)
    // Same dedup logic as SMS but with email-specific log type
    // ============================================
    let guideEmailSent = false;

    try {
      // Look up patient gender for lab guides
      let emailPatientGender = null;
      if (programType === 'labs') {
        const { data: genderData } = await supabase
          .from('patients')
          .select('gender')
          .eq('id', finalPatientId)
          .single();
        emailPatientGender = genderData?.gender || null;
      }

      const emailGuideSlug = getGuideUrl(programType, programName, medicationName, emailPatientGender);

      if (emailGuideSlug) {
        const emailGuideLogType = `guide_email_sent_${emailGuideSlug.replace(/^\//, '')}`;

        // Check if this patient has already received this specific guide via email
        const { data: existingEmailGuide } = await supabase
          .from('protocol_logs')
          .select('id')
          .eq('patient_id', finalPatientId)
          .eq('log_type', emailGuideLogType)
          .limit(1);

        if (!existingEmailGuide || existingEmailGuide.length === 0) {
          const { data: emailGuidePatient } = await supabase
            .from('patients')
            .select('email, first_name, name')
            .eq('id', finalPatientId)
            .single();

          if (emailGuidePatient?.email) {
            const emailGuideFirstName = emailGuidePatient.first_name || (emailGuidePatient.name ? emailGuidePatient.name.split(' ')[0] : 'there');
            const emailGuideUrl = `https://www.range-medical.com${emailGuideSlug}`;

            // Derive a friendly guide name from the slug
            const guideDisplayName = emailGuideSlug
              .replace(/^\//, '')
              .replace(/-guide$/, '')
              .replace(/-/g, ' ')
              .replace(/\b\w/g, c => c.toUpperCase());

            const guideEmailHtml = generateGuideEmailHtml({ firstName: emailGuideFirstName, guideName: guideDisplayName, guideUrl: emailGuideUrl });
            const guideEmailSubject = `Your ${guideDisplayName} Guide — Range Medical`;

            const resend = new Resend(process.env.RESEND_API_KEY);
            const { error: guideEmailError } = await resend.emails.send({
              from: 'Range Medical <noreply@range-medical.com>',
              to: emailGuidePatient.email,
              subject: guideEmailSubject,
              html: guideEmailHtml,
            });

            if (!guideEmailError) {
              await supabase.from('protocol_logs').insert({
                protocol_id: protocol.id, patient_id: finalPatientId,
                log_type: emailGuideLogType,
                log_date: new Date().toISOString().split('T')[0],
                notes: `Guide email sent: ${emailGuideSlug}`
              });
              await logComm({ channel: 'email', messageType: emailGuideLogType, message: guideEmailHtml, source: 'assign', patientId: finalPatientId, protocolId: protocol.id, patientName, recipient: emailGuidePatient.email, subject: guideEmailSubject });
              guideEmailSent = true;
              console.log(`Guide email (${emailGuideSlug}) sent to`, emailGuidePatient.email);
            } else {
              console.error('Guide email error:', guideEmailError);
            }
          } else {
            console.log('No patient email — skipping guide email');
          }
        } else {
          console.log(`Guide email ${emailGuideSlug} already sent to patient ${finalPatientId} — skipping`);
        }
      }
    } catch (guideEmailErr) {
      console.error('Guide email error (non-fatal):', guideEmailErr);
    }

    res.status(200).json({
      success: true,
      protocol,
      purchaseUpdated: !!purchaseId,
      ghlSynced: !!finalGhlContactId,
      dripEmailSent,
      peptideGuideSent,
      skinGuideSent,
      guideSent,
      guideEmailSent,
      message: `Protocol created: ${programName}`
    });

  } catch (error) {
    console.error('Error assigning protocol:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
}
