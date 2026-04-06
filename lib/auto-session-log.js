// lib/auto-session-log.js
// Shared auto-session-logging logic for appointment completion
// Used by both /api/appointments/[id]/status and /api/appointments/update

import { createClient } from '@supabase/supabase-js';
import { todayPacific } from './date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map appointment service names to service log categories and protocol types
// Injections: must contain "injection" keyword + one of these
const INJECTION_APPOINTMENT_TYPES = {
  'peptide': { category: 'peptide', programType: 'peptide', entryType: 'injection' },
  'weight loss': { category: 'weight_loss', programType: 'weight_loss', entryType: 'injection' },
  'testosterone': { category: 'testosterone', programType: 'hrt', entryType: 'injection' },
  'hrt': { category: 'testosterone', programType: 'hrt', entryType: 'injection' },
  'b12': { category: 'injection', programType: 'injection', entryType: 'injection' },
  'b-12': { category: 'injection', programType: 'injection', entryType: 'injection' },
  'vitamin': { category: 'injection', programType: 'injection', entryType: 'injection' },
  'nad': { category: 'injection', programType: 'injection', entryType: 'injection' },
  'glutathione': { category: 'injection', programType: 'injection', entryType: 'injection' },
};

// Session types: matched by keyword alone (no "injection" required)
const SESSION_APPOINTMENT_TYPES = {
  'hbot': { category: 'hbot', programType: 'hbot', entryType: 'session' },
  'hyperbaric': { category: 'hbot', programType: 'hbot', entryType: 'session' },
  'red light': { category: 'red_light', programType: 'red_light', entryType: 'session' },
  'rlt': { category: 'red_light', programType: 'red_light', entryType: 'session' },
  'iv therapy': { category: 'iv_therapy', programType: 'iv_therapy', entryType: 'session' },
  'iv drip': { category: 'iv_therapy', programType: 'iv_therapy', entryType: 'session' },
  'myers': { category: 'iv_therapy', programType: 'iv_therapy', entryType: 'session' },
  'nad+ iv': { category: 'iv_therapy', programType: 'iv_therapy', entryType: 'session' },
  'immunity drip': { category: 'iv_therapy', programType: 'iv_therapy', entryType: 'session' },
  'hydration': { category: 'iv_therapy', programType: 'iv_therapy', entryType: 'session' },
};

// Detect what type of service this appointment is
export function detectAppointmentServiceType(appointment) {
  const name = (appointment.service_name || appointment.appointment_title || '').toLowerCase();
  const category = (appointment.service_category || '').toLowerCase();

  // Check injection types (requires "injection" in name)
  if (name.includes('injection')) {
    for (const [keyword, config] of Object.entries(INJECTION_APPOINTMENT_TYPES)) {
      if (name.includes(keyword)) return config;
    }
    // Generic injection fallback
    return { category: 'injection', programType: 'injection', entryType: 'injection' };
  }

  // Check session types (keyword match alone)
  for (const [keyword, config] of Object.entries(SESSION_APPOINTMENT_TYPES)) {
    if (name.includes(keyword) || category.includes(keyword)) return config;
  }

  // Check category-based matching as fallback
  if (category === 'hbot' || category === 'hyperbaric') return { category: 'hbot', programType: 'hbot', entryType: 'session' };
  if (category === 'red_light' || category === 'rlt') return { category: 'red_light', programType: 'red_light', entryType: 'session' };
  if (category === 'iv_therapy' || category === 'iv') return { category: 'iv_therapy', programType: 'iv_therapy', entryType: 'session' };

  return null;
}

export async function autoLogSessionFromAppointment(appointment) {
  const serviceType = detectAppointmentServiceType(appointment);
  if (!serviceType) return;

  // Skip weight loss and HRT — these use encounter notes as their single source of truth.
  const encounterNoteCategories = ['weight_loss', 'testosterone'];
  if (encounterNoteCategories.includes(serviceType.category)) {
    console.log(`Auto-session-log: skipping ${serviceType.category} — encounter note is the source of truth`);
    return;
  }

  const patientId = appointment.patient_id;
  if (!patientId) {
    console.log('Auto-session-log: no patient_id on appointment, skipping');
    return;
  }

  const todayStr = todayPacific();
  const provider = appointment.provider || null;

  // Find active protocol for this type
  const { data: protocol } = await supabase
    .from('protocols')
    .select('id, medication, selected_dose, program_type, sessions_used, total_sessions, frequency')
    .eq('patient_id', patientId)
    .eq('program_type', serviceType.programType)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Check for duplicate on same date + same type
  const dupQuery = supabase
    .from('service_logs')
    .select('id')
    .eq('patient_id', patientId)
    .eq('entry_date', todayStr)
    .eq('category', serviceType.category)
    .eq('entry_type', serviceType.entryType);
  if (protocol) dupQuery.eq('protocol_id', protocol.id);
  const { data: existing } = await dupQuery.limit(1);
  if (existing && existing.length > 0) {
    console.log(`Auto-session-log: already logged ${serviceType.category} ${serviceType.entryType} for patient ${patientId} on ${todayStr}, skipping`);
    return;
  }

  // Log to service_logs
  const { error: slErr } = await supabase.from('service_logs').insert({
    patient_id: patientId,
    protocol_id: protocol?.id || null,
    category: serviceType.category,
    entry_type: serviceType.entryType,
    entry_date: todayStr,
    medication: protocol?.medication || null,
    dosage: protocol?.selected_dose || null,
    administered_by: provider,
    notes: `Auto-logged from completed appointment: ${appointment.service_name || appointment.appointment_title || 'Session'}${provider ? ` — ${provider}` : ''}`,
  });

  if (slErr) {
    console.error('Auto-session-log service_log error:', slErr);
    return;
  }

  // Update sessions_used + scheduling fields on the protocol if one exists
  if (protocol) {
    const newSessionsUsed = (protocol.sessions_used || 0) + 1;
    const freq = (protocol.frequency || '').toLowerCase();
    let dayInterval = 7; // default weekly
    if (freq.includes('daily') || freq.includes('every day')) dayInterval = 1;
    else if (freq.includes('2 week') || freq.includes('every 2')) dayInterval = 14;
    else if (freq.includes('monthly')) dayInterval = 28;

    const nextDate = new Date(todayStr + 'T12:00:00');
    nextDate.setDate(nextDate.getDate() + dayInterval);
    const nextExpected = nextDate.toISOString().split('T')[0];

    await supabase
      .from('protocols')
      .update({
        sessions_used: newSessionsUsed,
        last_visit_date: todayStr,
        next_expected_date: nextExpected,
        updated_at: new Date().toISOString(),
      })
      .eq('id', protocol.id);

    console.log(`Auto-session-log: logged ${serviceType.category} ${serviceType.entryType} for patient ${patientId}, protocol ${protocol.id} (${provider || 'no provider'}). Sessions: ${newSessionsUsed}/${protocol.total_sessions || '∞'}`);
  } else {
    console.log(`Auto-session-log: logged ${serviceType.category} ${serviceType.entryType} for patient ${patientId} (no protocol). ${provider || 'no provider'}`);
  }
}
