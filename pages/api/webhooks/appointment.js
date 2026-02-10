// /pages/api/webhooks/appointment.js
// Range Medical - Appointment Webhook Handler
// Logs appointments to clinic_appointments table for historical tracking
// Session counting is handled exclusively through the Service Log
// UPDATED: 2026-02-10 - Removed session decrement/tracking (now Service Log only)

import { createClient } from '@supabase/supabase-js';
// addGHLNote/sendStaffSMS removed — session tracking now via Service Log only

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
  'Injection - Peptide': { type: 'peptide', action: 'track_visit' },

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
          .in('program_type', ['weight_loss', 'hrt', 'peptide'])
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
    // SESSION TRACKING REMOVED
    // All session counting is now handled through the Service Log.
    // This webhook only logs appointments for historical tracking.
    // =====================================================

    console.log(`📋 Appointment logged for ${mapping.type} (action: ${mapping.action}) - no session tracking`);

    return res.status(200).json({
      success: true,
      message: `Appointment logged for ${mapping.type} - session tracking handled via Service Log`,
      action: 'log_only',
      appointment: {
        title: appointmentTitle,
        status: appointmentStatus,
        type: mapping.type
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
