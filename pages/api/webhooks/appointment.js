// /pages/api/webhooks/appointment.js
// Range Medical - Appointment Webhook Handler
// Decrements sessions from protocols when appointments are completed
// Services: HBOT, Red Light, IV Therapy, In-Clinic Injections
// UPDATED: 2026-02-06 - Auto-decrement sessions for in-clinic HRT/WL with alerts

import { createClient } from '@supabase/supabase-js';
import { addGHLNote, sendStaffSMS } from '../../../lib/ghl-sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================================
// APPOINTMENT TYPE MAPPING
// Maps GHL appointment names to protocol types
// =====================================================
const APPOINTMENT_MAPPING = {
  // HBOT
  'Hyperbaric Oxygen Therapy': { type: 'hbot', action: 'decrement' },
  'HBOT': { type: 'hbot', action: 'decrement' },
  
  // Red Light Therapy
  'Red Light Therapy': { type: 'red_light', action: 'decrement' },
  'RLT': { type: 'red_light', action: 'decrement' },
  
  // IV Therapy
  'Range IV': { type: 'iv_therapy', action: 'decrement' },
  'NAD+ IV (250mg)': { type: 'iv_therapy', action: 'decrement' },
  'NAD+ IV (500mg)': { type: 'iv_therapy', action: 'decrement' },
  'NAD+ IV (750mg)': { type: 'iv_therapy', action: 'decrement' },
  'NAD+ IV (1000mg)': { type: 'iv_therapy', action: 'decrement' },
  'High Dose Vitamin C IV': { type: 'iv_therapy', action: 'decrement' },
  'Vitamin C IV': { type: 'iv_therapy', action: 'decrement' },
  'Glutathione IV': { type: 'iv_therapy', action: 'decrement' },
  'Methylene Blue IV': { type: 'iv_therapy', action: 'decrement' },
  'MB + Vit C + Mag Combo': { type: 'iv_therapy', action: 'decrement' },
  'Exosome IV Therapy': { type: 'iv_therapy', action: 'decrement' },
  'BYO - IV': { type: 'iv_therapy', action: 'decrement' },
  'BYO IV': { type: 'iv_therapy', action: 'decrement' },
  'Hydration IV': { type: 'iv_therapy', action: 'decrement' },
  
  // In-Clinic Injections
  'Range Injections': { type: 'injection_pack', action: 'decrement' },
  'NAD+ Injection': { type: 'injection_pack', action: 'decrement' },
  'NAD+ Injection (50mg)': { type: 'injection_pack', action: 'decrement' },
  'NAD+ Injection (75mg)': { type: 'injection_pack', action: 'decrement' },
  'NAD+ Injection (100mg)': { type: 'injection_pack', action: 'decrement' },
  'NAD+ Injection (125mg)': { type: 'injection_pack', action: 'decrement' },
  'NAD+ Injection (150mg)': { type: 'injection_pack', action: 'decrement' },
  'Glutathione Injection': { type: 'injection_pack', action: 'decrement' },
  'B12 Injection': { type: 'injection_pack', action: 'decrement' },
  'Vitamin Injection': { type: 'injection_pack', action: 'decrement' },
  
  // In-Clinic Injection Tracking (updates protocol visit dates and sessions)
  'Injection - Testosterone': { type: 'hrt', action: 'track_visit' },
  'Injection - Weight Loss': { type: 'weight_loss', action: 'track_visit' },

  // Log only (no session decrement or tracking)
  'Initial Consultation': { type: 'consult', action: 'log' },
  'Follow-Up Consultation': { type: 'consult', action: 'log' }
};

// =====================================================
// MAIN WEBHOOK HANDLER
// =====================================================
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📅 Appointment webhook received:', new Date().toISOString());
  console.log('📦 Payload:', JSON.stringify(req.body, null, 2));

  try {
    const payload = req.body;
    
    // =====================================================
    // EXTRACT APPOINTMENT DATA
    // GHL sends data in various formats
    // =====================================================
    
    // Contact info
    const contactId = 
      payload.contact_id ||
      payload.contactId ||
      payload.contact?.id ||
      payload.appointment?.contact_id ||
      null;
    
    const contactName = 
      payload.full_name ||
      payload.contact?.name ||
      payload.contact?.full_name ||
      `${payload.first_name || ''} ${payload.last_name || ''}`.trim() ||
      'Unknown';
    
    // Appointment info
    const appointmentId = 
      payload.appointment?.id ||
      payload.appointmentId ||
      payload.id ||
      null;
    
    const appointmentTitle = 
      payload.appointment?.title ||
      payload.appointment?.calendarName ||
      payload.appointment?.calendar_name ||
      payload.title ||
      payload.calendarName ||
      payload.calendar_name ||
      null;
    
    const appointmentStatus = 
      payload.appointment?.status ||
      payload.appointment?.appointmentStatus ||
      payload.status ||
      payload.appointmentStatus ||
      null;
    
    const appointmentDate = 
      payload.appointment?.startTime ||
      payload.appointment?.start_time ||
      payload.startTime ||
      payload.start_time ||
      new Date().toISOString();

    console.log('📋 Extracted data:', {
      contactId,
      contactName,
      appointmentId,
      appointmentTitle,
      appointmentStatus,
      appointmentDate
    });

    // =====================================================
    // CHECK IF THIS IS A "SHOWED" STATUS
    // Only decrement sessions when patient actually attended
    // Note: If status is null, assume "showed" since GHL workflow
    // is triggered by "Appointment Status Changed to Showed"
    // =====================================================

    const validStatuses = ['showed', 'completed', 'confirmed'];
    const effectiveStatus = appointmentStatus?.toLowerCase() || 'showed'; // Default to showed if null

    if (!validStatuses.includes(effectiveStatus)) {
      console.log(`⚠️ Appointment status "${appointmentStatus}" - no action needed`);
      return res.status(200).json({
        success: true,
        message: `Status "${appointmentStatus}" does not trigger session decrement`,
        action: 'none'
      });
    }

    console.log(`✅ Processing as status: ${effectiveStatus}`);

    // =====================================================
    // MATCH APPOINTMENT TO SERVICE TYPE
    // =====================================================
    
    let mapping = null;
    
    // Exact match first
    if (appointmentTitle && APPOINTMENT_MAPPING[appointmentTitle]) {
      mapping = APPOINTMENT_MAPPING[appointmentTitle];
    }
    
    // Partial match (case-insensitive)
    if (!mapping && appointmentTitle) {
      const titleLower = appointmentTitle.toLowerCase();
      for (const [key, value] of Object.entries(APPOINTMENT_MAPPING)) {
        if (titleLower.includes(key.toLowerCase()) || key.toLowerCase().includes(titleLower)) {
          mapping = value;
          break;
        }
      }
    }
    
    // If no mapping found but we have a contact ID, try to auto-detect
    // by finding any active in-clinic protocol for this patient
    if (!mapping && contactId) {
      console.log(`🔍 No mapping for "${appointmentTitle}" - trying auto-detect for contact ${contactId}`);

      // Find patient by GHL contact ID
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('ghl_contact_id', contactId)
        .single();

      if (patient) {
        // Look for any active in-clinic protocol
        const { data: inClinicProtocols } = await supabase
          .from('protocols')
          .select('program_type')
          .eq('patient_id', patient.id)
          .eq('delivery_method', 'in_clinic')
          .eq('status', 'active')
          .in('program_type', ['weight_loss', 'hrt'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (inClinicProtocols && inClinicProtocols.length > 0) {
          const protocolType = inClinicProtocols[0].program_type;
          mapping = { type: protocolType, action: 'track_visit' };
          console.log(`✅ Auto-detected in-clinic protocol: ${protocolType}`);
        }
      }
    }

    if (!mapping) {
      console.log(`⚠️ No mapping found for appointment: "${appointmentTitle}"`);
      return res.status(200).json({
        success: true,
        message: `No session tracking for appointment type: ${appointmentTitle}`,
        action: 'none'
      });
    }

    console.log(`✅ Matched appointment to: ${mapping.type} (action: ${mapping.action})`);

    // =====================================================
    // LOG THE APPOINTMENT
    // =====================================================
    
    const appointmentLog = {
      ghl_contact_id: contactId,
      ghl_appointment_id: appointmentId,
      patient_name: contactName,
      appointment_type: mapping.type,
      appointment_title: appointmentTitle,
      appointment_date: appointmentDate,
      appointment_status: appointmentStatus,
      action_taken: mapping.action,
      created_at: new Date().toISOString()
    };

    // Try to insert into appointment_logs table
    const { error: logError } = await supabase
      .from('appointment_logs')
      .insert(appointmentLog);
    
    if (logError) {
      console.log('⚠️ Could not log appointment (table may not exist):', logError.message);
    }

    // =====================================================
    // SAVE TO CLINIC_APPOINTMENTS TABLE
    // This keeps the appointments synced for historical tracking
    // =====================================================

    if (appointmentId && contactId) {
      // Extract calendar name from title (e.g., "John Smith - Injection - Weight Loss" -> "Injection - Weight Loss")
      const titleParts = (appointmentTitle || '').split(' - ');
      const calendarName = titleParts.length > 1 ? titleParts.slice(1).join(' - ') : appointmentTitle;

      // Parse the date
      const dateOnly = appointmentDate ? appointmentDate.split('T')[0] : new Date().toISOString().split('T')[0];

      // Find patient by GHL contact ID
      let patientId = null;
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('ghl_contact_id', contactId)
        .single();
      if (patient) {
        patientId = patient.id;
      }

      const clinicAppointmentData = {
        ghl_appointment_id: appointmentId,
        ghl_contact_id: contactId,
        patient_id: patientId,
        calendar_name: calendarName,
        appointment_title: appointmentTitle,
        appointment_date: dateOnly,
        start_time: appointmentDate,
        status: appointmentStatus?.toLowerCase() || 'showed',
        updated_at: new Date().toISOString()
      };

      const { error: clinicAptError } = await supabase
        .from('clinic_appointments')
        .upsert(clinicAppointmentData, { onConflict: 'ghl_appointment_id' });

      if (clinicAptError) {
        console.log('⚠️ Could not save to clinic_appointments:', clinicAptError.message);
      } else {
        console.log('✅ Saved to clinic_appointments:', appointmentId);
      }
    }

    // =====================================================
    // TRACK IN-CLINIC VISIT (for HRT and Weight Loss injections)
    // =====================================================

    if (mapping.action === 'track_visit') {
      if (!contactId) {
        console.log('⚠️ No contact ID - cannot track visit');
        return res.status(200).json({
          success: true,
          message: 'No contact ID to match patient for visit tracking',
          action: 'log_only'
        });
      }

      // Find active protocol for this patient
      const protocolTypes = mapping.type === 'hrt'
        ? ['hrt']
        : ['weight_loss'];

      // Find patient by ghl_contact_id first
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('ghl_contact_id', contactId)
        .single();

      if (patientError || !patient) {
        console.log(`⚠️ No patient found for contact ${contactId}`);
        return res.status(200).json({
          success: true,
          message: 'No patient found for contact - appointment logged only',
          action: 'log_only'
        });
      }

      // Find protocol by patient_id
      const { data: protocols, error: findError } = await supabase
        .from('protocols')
        .select('*')
        .eq('patient_id', patient.id)
        .in('program_type', protocolTypes)
        .eq('status', 'active')
        .eq('delivery_method', 'in_clinic')
        .order('created_at', { ascending: false });

      if (findError) {
        console.error('❌ Error finding protocol for visit tracking:', findError);
        return res.status(200).json({
          success: false,
          error: 'Database error finding protocol'
        });
      }

      if (!protocols || protocols.length === 0) {
        console.log(`⚠️ No active in-clinic ${mapping.type} protocol found for contact ${contactId}`);
        return res.status(200).json({
          success: true,
          message: `No active in-clinic ${mapping.type} protocol - appointment logged only`,
          action: 'log_only'
        });
      }

      const protocol = protocols[0];
      const visitDate = appointmentDate ? appointmentDate.split('T')[0] : new Date().toISOString().split('T')[0];

      // Calculate next expected date based on visit frequency
      let nextExpectedDate = null;
      const visitFrequency = protocol.visit_frequency || (mapping.type === 'weight_loss' ? 'weekly' : 'twice_weekly');

      const visitDateObj = new Date(visitDate + 'T12:00:00');
      if (visitFrequency === 'weekly') {
        visitDateObj.setDate(visitDateObj.getDate() + 7);
      } else if (visitFrequency === 'twice_weekly') {
        visitDateObj.setDate(visitDateObj.getDate() + 3); // ~3-4 days for twice weekly
      } else if (visitFrequency === 'monthly') {
        visitDateObj.setDate(visitDateObj.getDate() + 30);
      } else {
        visitDateObj.setDate(visitDateObj.getDate() + 7); // default to weekly
      }
      nextExpectedDate = visitDateObj.toISOString().split('T')[0];

      // Update protocol with visit tracking
      const updateData = {
        last_visit_date: visitDate,
        next_expected_date: nextExpectedDate,
        updated_at: new Date().toISOString()
      };

      // For BOTH HRT and Weight Loss in-clinic, track sessions
      // Always increment sessions_used, even if it exceeds total (to track overdraft)
      const currentUsed = protocol.sessions_used || 0;
      const totalSessions = protocol.total_sessions || 0;
      const newSessionsUsed = currentUsed + 1;
      const sessionsRemaining = totalSessions - newSessionsUsed;

      // Only track sessions if total_sessions is set (> 0)
      if (totalSessions > 0) {
        updateData.sessions_used = newSessionsUsed;

        console.log(`📊 Session tracking: ${currentUsed}/${totalSessions} → ${newSessionsUsed}/${totalSessions} (${sessionsRemaining} remaining)`);

        // Check if sessions are exhausted or exceeded
        if (newSessionsUsed >= totalSessions) {
          const patientName = contactName || 'Patient';
          const isOverdraft = newSessionsUsed > totalSessions;
          const overdraftCount = isOverdraft ? newSessionsUsed - totalSessions : 0;

          // Create alert in database
          const alertMessage = isOverdraft
            ? `${patientName} used ${overdraftCount} session(s) BEYOND their ${mapping.type.toUpperCase()} package limit. Sessions: ${newSessionsUsed}/${totalSessions}. Payment required for additional sessions.`
            : `${patientName} has used all sessions in their ${mapping.type.toUpperCase()} package. Sessions: ${newSessionsUsed}/${totalSessions}. Ready for renewal.`;

          const alertSeverity = isOverdraft ? 'high' : 'medium';
          const alertType = isOverdraft ? 'sessions_exceeded' : 'sessions_exhausted';

          const { error: alertError } = await supabase
            .from('alerts')
            .insert({
              patient_id: patient.id,
              alert_type: alertType,
              message: alertMessage,
              severity: alertSeverity,
              status: 'active',
              metadata: {
                protocol_id: protocol.id,
                program_type: mapping.type,
                sessions_used: newSessionsUsed,
                total_sessions: totalSessions,
                overdraft_count: overdraftCount,
                appointment_title: appointmentTitle,
                appointment_date: visitDate
              }
            });

          if (alertError) {
            console.log('⚠️ Could not create alert:', alertError.message);
          } else {
            console.log(`🚨 Alert created: ${alertType} for ${patientName}`);
          }

          // Add note to GHL
          const ghlNote = isOverdraft
            ? `🚨 SESSIONS EXCEEDED - PAYMENT NEEDED

${mapping.type.toUpperCase()} Injection appointment marked as showed.
Patient has used ${overdraftCount} session(s) BEYOND their package limit.

Package: ${protocol.program_name || mapping.type}
Sessions Used: ${newSessionsUsed}/${totalSessions}
Overdraft: ${overdraftCount} session(s)

⚠️ Please collect payment for additional sessions or new package.`
            : `⚠️ PACKAGE COMPLETE - RENEWAL NEEDED

${mapping.type.toUpperCase()} Injection appointment marked as showed.
Patient has used all sessions in their package.

Package: ${protocol.program_name || mapping.type}
Sessions Used: ${newSessionsUsed}/${totalSessions}

📋 Patient may need to purchase a new package to continue treatment.`;

          if (contactId) {
            await addGHLNote(contactId, ghlNote);
            console.log('📝 GHL note added for session alert');
          }

          // Send SMS to staff
          const smsMessage = isOverdraft
            ? `🚨 SESSIONS EXCEEDED: ${patientName} used ${overdraftCount} session(s) beyond their ${mapping.type.toUpperCase()} package (${newSessionsUsed}/${totalSessions}). Payment needed.`
            : `⚠️ PACKAGE COMPLETE: ${patientName} used all ${totalSessions} sessions in their ${mapping.type.toUpperCase()} package. Ready for renewal.`;

          await sendStaffSMS(smsMessage);
          console.log('📱 Staff SMS sent for session alert');

          // Mark protocol as completed only when EXACTLY at limit (not overdraft)
          // For overdraft, keep it active so we can see the negative balance
          if (newSessionsUsed === totalSessions) {
            updateData.status = 'completed';
            console.log(`✅ ${mapping.type} protocol completed - all sessions used`);
          }
        }
      }

      const { data: updatedProtocol, error: updateError } = await supabase
        .from('protocols')
        .update(updateData)
        .eq('id', protocol.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating protocol visit:', updateError);
        return res.status(200).json({
          success: false,
          error: 'Failed to update protocol visit tracking'
        });
      }

      console.log(`✅ In-clinic visit tracked for ${mapping.type}: last_visit=${visitDate}, next_expected=${nextExpectedDate}`);
      if (totalSessions > 0) {
        console.log(`   Sessions: ${newSessionsUsed}/${totalSessions} (${sessionsRemaining} remaining)`);
      }

      return res.status(200).json({
        success: true,
        message: 'In-clinic visit tracked',
        protocol: {
          id: protocol.id,
          type: mapping.type,
          last_visit_date: visitDate,
          next_expected_date: nextExpectedDate,
          sessions_used: newSessionsUsed,
          total_sessions: totalSessions,
          sessions_remaining: sessionsRemaining,
          status: updateData.status || 'active',
          alert_created: sessionsRemaining <= 0
        }
      });
    }

    // =====================================================
    // DECREMENT SESSION (if action is 'decrement')
    // =====================================================

    if (mapping.action !== 'decrement') {
      return res.status(200).json({
        success: true,
        message: `Appointment logged (no decrement for ${mapping.type})`,
        action: 'log'
      });
    }

    if (!contactId) {
      console.log('⚠️ No contact ID - cannot find patient protocol');
      return res.status(200).json({
        success: false,
        error: 'No contact ID to match patient'
      });
    }

    // Find active protocol for this patient and service type
    const protocolTypes = getProtocolTypesForService(mapping.type);
    
    const { data: protocols, error: protocolError } = await supabase
      .from('protocols')
      .select('*')
      .eq('ghl_contact_id', contactId)
      .in('program_type', protocolTypes)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (protocolError) {
      console.error('❌ Error finding protocol:', protocolError);
      return res.status(200).json({
        success: false,
        error: 'Database error finding protocol'
      });
    }

    if (!protocols || protocols.length === 0) {
      console.log(`⚠️ No active ${mapping.type} protocol found for contact ${contactId}`);
      return res.status(200).json({
        success: true,
        message: `No active ${mapping.type} protocol - appointment logged but no session decremented`,
        action: 'log_only'
      });
    }

    // Use the most recent active protocol
    const protocol = protocols[0];
    const currentCompleted = protocol.sessions_completed || 0;
    const totalSessions = protocol.total_sessions || 0;
    const newCompleted = currentCompleted + 1;

    console.log(`📊 Protocol ${protocol.id}: ${currentCompleted}/${totalSessions} → ${newCompleted}/${totalSessions}`);

    // Update the protocol
    const updateData = {
      sessions_completed: newCompleted,
      updated_at: new Date().toISOString()
    };

    // Auto-complete if all sessions used
    if (newCompleted >= totalSessions) {
      updateData.status = 'completed';
      console.log('✅ Protocol completed - all sessions used');
    }

    const { data: updatedProtocol, error: updateError } = await supabase
      .from('protocols')
      .update(updateData)
      .eq('id', protocol.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating protocol:', updateError);
      return res.status(200).json({
        success: false,
        error: 'Failed to update protocol'
      });
    }

    console.log(`✅ Session decremented: ${protocol.program_name} (${newCompleted}/${totalSessions})`);

    return res.status(200).json({
      success: true,
      message: 'Session decremented',
      protocol: {
        id: protocol.id,
        name: protocol.program_name,
        sessions_completed: newCompleted,
        total_sessions: totalSessions,
        sessions_remaining: totalSessions - newCompleted,
        status: updateData.status || 'active'
      }
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// =====================================================
// HELPER: Get protocol types for a service
// =====================================================
function getProtocolTypesForService(serviceType) {
  const mapping = {
    'hbot': ['hbot', 'hbot_sessions', 'hyperbaric'],
    'red_light': ['red_light', 'red_light_sessions', 'rlt'],
    'iv_therapy': ['iv_therapy', 'iv', 'iv_sessions'],
    'injection_pack': ['injection_pack', 'injection', 'single_injection']
  };
  return mapping[serviceType] || [serviceType];
}
