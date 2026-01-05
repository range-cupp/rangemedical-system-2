// /pages/api/ghl/appointment-status.js
// Webhook for GHL Appointment Status Changes
// When appointment marked "Showed" → decrements session from protocol
// Range Medical
// CREATED: 2026-01-04

import { createClient } from '@supabase/supabase-js';
import { 
  syncHBOTSessionLogged,
  syncRLTSessionLogged,
  syncIVSessionLogged,
  syncInjectionSessionLogged,
  addGHLNote
} from '../../../lib/ghl-sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Calendar IDs mapped to protocol types
const CALENDAR_MAP = {
  '68fbb36bde21d1840e5f412e': { type: 'hbot', name: 'HBOT', sync: syncHBOTSessionLogged },
  '68fbb3888eb4bc0d9dc758cb': { type: 'rlt', name: 'Red Light Therapy', sync: syncRLTSessionLogged },
  '68efcd8ae4e0ed94b9390a06': { type: 'iv_therapy', name: 'IV Therapy', sync: syncIVSessionLogged },
  // Add more calendars here as needed:
  // 'calendar_id_for_injection': { type: 'injection', name: 'Injection Therapy', sync: syncInjectionSessionLogged },
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'Appointment Status webhook active',
      version: '2026-01-04',
      calendars: Object.keys(CALENDAR_MAP)
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    console.log('=== Appointment Status Webhook ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // GHL sends different payload structures - handle both
    const appointment = payload.appointment || payload;
    const contactId = appointment.contactId || appointment.contact_id || payload.contactId || payload.contact_id;
    const calendarId = appointment.calendarId || appointment.calendar_id || payload.calendarId || payload.calendar_id;
    const status = (appointment.status || appointment.appointmentStatus || payload.status || '').toLowerCase();
    const appointmentDate = appointment.startTime || appointment.start_time || appointment.selectedDate || new Date().toISOString();

    console.log('Parsed: contactId=', contactId, 'calendarId=', calendarId, 'status=', status);

    // Only process if status is "showed" or "completed"
    if (status !== 'showed' && status !== 'completed' && status !== 'confirmed_showed') {
      console.log('Status not showed/completed, ignoring:', status);
      return res.status(200).json({ 
        success: true, 
        message: `Ignored - status is "${status}", not "showed"` 
      });
    }

    // Check if this calendar triggers session tracking
    const calendarConfig = CALENDAR_MAP[calendarId];
    if (!calendarConfig) {
      console.log('Calendar not configured for session tracking:', calendarId);
      return res.status(200).json({ 
        success: true, 
        message: 'Calendar not configured for session tracking' 
      });
    }

    if (!contactId) {
      console.log('No contact ID in payload');
      return res.status(200).json({ error: 'No contact ID provided' });
    }

    // Find patient by GHL contact ID
    const { data: patient } = await supabase
      .from('patients')
      .select('id, name, ghl_contact_id')
      .eq('ghl_contact_id', contactId)
      .single();

    if (!patient) {
      console.log('Patient not found for contact:', contactId);
      // Still return 200 to not cause webhook errors
      return res.status(200).json({ 
        success: false, 
        message: 'Patient not found in system' 
      });
    }

    console.log('Found patient:', patient.name);

    // Find active protocol for this type
    const { data: protocol } = await supabase
      .from('protocols')
      .select('*')
      .eq('patient_id', patient.id)
      .eq('status', 'active')
      .or(`program_type.eq.${calendarConfig.type},program_name.ilike.%${calendarConfig.name}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!protocol) {
      console.log('No active protocol found for type:', calendarConfig.type);
      
      // Add note to GHL about missing protocol
      await addGHLNote(contactId, `⚠️ APPOINTMENT SHOWED - NO ACTIVE PACKAGE

${calendarConfig.name} appointment marked as showed, but no active package found.
Please verify patient has an active ${calendarConfig.name} package.`);

      return res.status(200).json({ 
        success: false, 
        message: `No active ${calendarConfig.name} protocol found` 
      });
    }

    console.log('Found protocol:', protocol.id, protocol.program_name);

    // Check if sessions available
    const sessionsUsed = protocol.sessions_used || 0;
    const totalSessions = protocol.total_sessions || 0;
    
    if (totalSessions > 0 && sessionsUsed >= totalSessions) {
      console.log('No sessions remaining');
      
      await addGHLNote(contactId, `⚠️ APPOINTMENT SHOWED - NO SESSIONS REMAINING

${calendarConfig.name} appointment marked as showed, but package has 0 sessions remaining.
Package: ${protocol.program_name}
Sessions Used: ${sessionsUsed}/${totalSessions}

Please collect payment for new package.`);

      return res.status(200).json({ 
        success: false, 
        message: 'No sessions remaining in package' 
      });
    }

    // Decrement session
    const newSessionsUsed = sessionsUsed + 1;
    const sessionsRemaining = totalSessions - newSessionsUsed;
    
    const updates = {
      sessions_used: newSessionsUsed,
      updated_at: new Date().toISOString()
    };

    // Mark complete if no sessions remaining
    if (totalSessions > 0 && newSessionsUsed >= totalSessions) {
      updates.status = 'completed';
    }

    // Update protocol in Supabase
    await supabase
      .from('protocols')
      .update(updates)
      .eq('id', protocol.id);

    // Create log entry
    const logDate = appointmentDate.split('T')[0];
    await supabase.from('protocol_logs').insert({
      protocol_id: protocol.id,
      patient_id: patient.id,
      log_type: 'session',
      log_date: logDate,
      notes: `${calendarConfig.name} session - Appointment showed`
    });

    // Sync to GHL
    const updatedProtocol = {
      ...protocol,
      sessions_used: newSessionsUsed,
      total_sessions: totalSessions,
      status: updates.status || protocol.status
    };

    await calendarConfig.sync(contactId, updatedProtocol, patient.name);

    console.log(`✓ ${calendarConfig.name} session logged: ${newSessionsUsed}/${totalSessions}`);

    return res.status(200).json({
      success: true,
      message: `${calendarConfig.name} session logged`,
      sessions_used: newSessionsUsed,
      sessions_remaining: sessionsRemaining,
      protocol_status: updates.status || 'active'
    });

  } catch (error) {
    console.error('Appointment status webhook error:', error);
    // Return 200 to prevent GHL from retrying
    return res.status(200).json({ error: error.message });
  }
}
