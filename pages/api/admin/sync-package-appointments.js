// /pages/api/admin/sync-package-appointments.js
// Sync past clinic_appointments to package protocols (HBOT, RLT, IV, Injections)
// Range Medical - 2026-02-08
// GET = preview, POST = sync

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map calendar names to protocol types
const CALENDAR_TO_PROTOCOL = {
  // HBOT
  'Hyperbaric Oxygen Therapy': 'hbot',
  'HBOT': 'hbot',
  // Red Light Therapy
  'Red Light Therapy': 'rlt',
  'RLT': 'rlt',
  // IV Therapy
  'Range IV': 'iv',
  'NAD+ IV (250mg)': 'iv',
  'NAD+ IV (500mg)': 'iv',
  'NAD+ IV (750mg)': 'iv',
  'NAD+ IV (1000mg)': 'iv',
  'High Dose Vitamin C IV': 'iv',
  'Vitamin C IV': 'iv',
  'Glutathione IV': 'iv',
  'Methylene Blue IV': 'iv',
  'MB + Vit C + Mag Combo': 'iv',
  'Exosome IV Therapy': 'iv',
  'BYO - IV': 'iv',
  'BYO IV': 'iv',
  'Hydration IV': 'iv',
  // Injection packs
  'Range Injections': 'injection',
  'NAD+ Injection': 'injection',
  'NAD+ Injection (50mg)': 'injection',
  'NAD+ Injection (75mg)': 'injection',
  'NAD+ Injection (100mg)': 'injection',
  'NAD+ Injection (125mg)': 'injection',
  'NAD+ Injection (150mg)': 'injection',
  'Glutathione Injection': 'injection',
  'B12 Injection': 'injection',
  'Vitamin Injection': 'injection'
};

// Get protocol type from calendar name
function getProtocolType(calendarName) {
  // Exact match first
  if (CALENDAR_TO_PROTOCOL[calendarName]) {
    return CALENDAR_TO_PROTOCOL[calendarName];
  }

  // Partial match
  const lowerName = calendarName.toLowerCase();
  if (lowerName.includes('hbot') || lowerName.includes('hyperbaric')) return 'hbot';
  if (lowerName.includes('red light') || lowerName.includes('rlt')) return 'rlt';
  if (lowerName.includes(' iv') || lowerName.includes('iv ')) return 'iv';
  if (lowerName.includes('injection') && !lowerName.includes('testosterone') && !lowerName.includes('weight loss') && !lowerName.includes('peptide')) return 'injection';

  return null;
}

export default async function handler(req, res) {
  const dryRun = req.method === 'GET';
  const { patientId } = req.query; // Optional: sync only for specific patient

  try {
    // Get all package protocols (HBOT, RLT, IV, Injection packs)
    let protocolQuery = supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        program_name,
        program_type,
        status,
        total_sessions,
        sessions_used,
        created_at,
        patients (
          id,
          name,
          ghl_contact_id
        )
      `)
      .in('program_type', ['hbot', 'rlt', 'iv', 'injection', 'iv_therapy', 'red_light', 'injection_pack'])
      .not('total_sessions', 'is', null);

    if (patientId) {
      protocolQuery = protocolQuery.eq('patient_id', patientId);
    }

    const { data: protocols, error: protocolsError } = await protocolQuery;

    if (protocolsError) {
      return res.status(500).json({ error: protocolsError.message });
    }

    const results = {
      total: protocols?.length || 0,
      synced: [],
      errors: [],
      skipped: []
    };

    for (const protocol of protocols || []) {
      const ghlContactId = protocol.patients?.ghl_contact_id;
      const patientName = protocol.patients?.name || 'Unknown';
      const protocolType = protocol.program_type;

      if (!ghlContactId) {
        results.skipped.push({
          protocol_id: protocol.id,
          patient: patientName,
          reason: 'No GHL contact ID'
        });
        continue;
      }

      try {
        // Fetch all appointments for this patient
        const { data: allAppointments, error: aptError } = await supabase
          .from('clinic_appointments')
          .select('*')
          .eq('ghl_contact_id', ghlContactId)
          .in('status', ['showed', 'completed'])
          .order('appointment_date', { ascending: true });

        if (aptError) {
          results.errors.push({
            protocol_id: protocol.id,
            patient: patientName,
            error: aptError.message
          });
          continue;
        }

        // Filter appointments that match this protocol type
        const matchingAppointments = (allAppointments || []).filter(apt => {
          const aptType = getProtocolType(apt.calendar_name);
          // Match HBOT with hbot, IV with iv/iv_therapy, etc.
          if (protocolType === 'hbot' && aptType === 'hbot') return true;
          if ((protocolType === 'rlt' || protocolType === 'red_light') && aptType === 'rlt') return true;
          if ((protocolType === 'iv' || protocolType === 'iv_therapy') && aptType === 'iv') return true;
          if ((protocolType === 'injection' || protocolType === 'injection_pack') && aptType === 'injection') return true;
          return false;
        });

        // Filter appointments that occurred after protocol creation
        const protocolCreated = new Date(protocol.created_at);
        const appointmentsAfterCreation = matchingAppointments.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate >= protocolCreated;
        });

        const appointmentCount = appointmentsAfterCreation.length;
        const currentUsed = protocol.sessions_used || 0;

        if (appointmentCount === 0) {
          results.skipped.push({
            protocol_id: protocol.id,
            patient: patientName,
            program: protocol.program_name,
            reason: 'No matching appointments found'
          });
          continue;
        }

        if (appointmentCount === currentUsed) {
          results.skipped.push({
            protocol_id: protocol.id,
            patient: patientName,
            program: protocol.program_name,
            reason: `Already synced (${currentUsed} sessions)`
          });
          continue;
        }

        // Update the protocol with correct session count
        if (!dryRun) {
          const newStatus = appointmentCount >= (protocol.total_sessions || 0) ? 'completed' : protocol.status;

          const { error: updateError } = await supabase
            .from('protocols')
            .update({
              sessions_used: appointmentCount,
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', protocol.id);

          if (updateError) {
            results.errors.push({
              protocol_id: protocol.id,
              patient: patientName,
              error: updateError.message
            });
            continue;
          }
        }

        results.synced.push({
          protocol_id: protocol.id,
          patient: patientName,
          program: protocol.program_name,
          type: protocolType,
          previous_sessions: currentUsed,
          new_sessions: appointmentCount,
          total_sessions: protocol.total_sessions,
          appointments: appointmentsAfterCreation.map(a => ({
            date: a.appointment_date,
            calendar: a.calendar_name,
            status: a.status
          }))
        });

      } catch (err) {
        results.errors.push({
          protocol_id: protocol.id,
          patient: patientName,
          error: err.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      dryRun,
      message: dryRun ? 'Preview - no changes made' : 'Sync completed',
      results
    });

  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({ error: error.message });
  }
}
