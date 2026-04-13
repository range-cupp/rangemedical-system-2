// /pages/api/admin/ghl-appointments.js
// Fetch clinic appointments from database (clinic_appointments + calcom appointments)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../lib/date-utils';
import { REQUIRED_FORMS } from '../../../lib/appointment-services';
import { CONSENT_TYPE_TO_FORM_ID, FORM_DEFINITIONS } from '../../../lib/form-bundles';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date } = req.query;
    const targetDate = date || todayPacific();

    // Build date range for the target day in Pacific Time
    const dayStart = `${targetDate}T00:00:00-07:00`;
    const dayEnd = `${targetDate}T23:59:59-07:00`;

    // Fetch from both tables in parallel
    const [clinicResult, nativeResult] = await Promise.all([
      supabase
        .from('clinic_appointments')
        .select(`
          *,
          patients (
            id,
            name,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('appointment_date', targetDate)
        .order('start_time', { ascending: true }),

      supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          patient_name,
          patient_phone,
          service_name,
          service_category,
          provider,
          location,
          start_time,
          end_time,
          duration_minutes,
          status,
          notes,
          source,
          cal_com_booking_id,
          ghl_appointment_id,
          created_at,
          patients (
            id,
            name,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .gte('start_time', dayStart)
        .lte('start_time', dayEnd)
        .not('status', 'eq', 'cancelled')
        .order('start_time', { ascending: true })
    ]);

    if (clinicResult.error) {
      console.error('Error fetching clinic_appointments:', clinicResult.error);
    }
    if (nativeResult.error) {
      console.error('Error fetching appointments:', nativeResult.error);
    }

    // Format clinic_appointments (GHL source)
    const clinicAppointments = (clinicResult.data || []).map(apt => {
      const patient = apt.patients;
      let patientName = patient?.name ||
        (patient?.first_name ? `${patient.first_name} ${patient.last_name || ''}`.trim() : null);

      if (!patientName && apt.appointment_title) {
        const titleParts = apt.appointment_title.split(' - ');
        if (titleParts.length >= 2) {
          patientName = titleParts[0].trim();
        }
      }
      patientName = patientName || 'Unknown';

      return {
        id: apt.id,
        ghlAppointmentId: apt.ghl_appointment_id,
        calendarName: apt.calendar_name || 'Appointment',
        calendarColor: getCalendarColor(apt.calendar_name),
        title: apt.appointment_title,
        startTime: apt.start_time,
        endTime: apt.end_time,
        status: apt.status || 'scheduled',
        notes: apt.notes,
        source: 'ghl',
        patient: patient ? {
          id: patient.id,
          name: patientName,
          email: patient.email,
          phone: patient.phone
        } : null,
        patientName,
        _dedup: apt.ghl_appointment_id || `${apt.start_time}-${patientName}`
      };
    });

    // Format native appointments (Cal.com + manual source)
    const nativeAppointments = (nativeResult.data || []).map(apt => {
      const patient = apt.patients;
      let patientName = patient?.name ||
        (patient?.first_name ? `${patient.first_name} ${patient.last_name || ''}`.trim() : null) ||
        apt.patient_name || 'Unknown';

      return {
        id: apt.id,
        calendarName: apt.service_name || 'Appointment',
        calendarColor: getCalendarColor(apt.service_name),
        title: apt.service_category || apt.service_name,
        serviceCategory: apt.service_category || null,
        startTime: apt.start_time,
        endTime: apt.end_time,
        status: apt.status || 'scheduled',
        notes: apt.notes,
        source: apt.source || 'cal_com',
        provider: apt.provider,
        patient: patient ? {
          id: patient.id,
          name: patientName,
          email: patient.email,
          phone: patient.phone
        } : (apt.patient_id ? { id: apt.patient_id, name: patientName, phone: apt.patient_phone } : null),
        patientName,
        _dedup: apt.ghl_appointment_id || `${apt.start_time}-${patientName}`
      };
    });

    // Merge and deduplicate (clinic_appointments first, native fills gaps)
    const seen = new Set();
    const merged = [];
    for (const apt of [...clinicAppointments, ...nativeAppointments]) {
      if (!seen.has(apt._dedup)) {
        seen.add(apt._dedup);
        merged.push(apt);
      }
    }
    merged.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Clean up internal field
    const formattedAppointments = merged.map(({ _dedup, ...rest }) => rest);

    // --- Missing consents check across ALL active protocols + appointment service ---
    const patientIds = [...new Set(
      formattedAppointments.map(a => a.patient?.id).filter(Boolean)
    )];

    let patientConsentsMap = {};
    if (patientIds.length > 0) {
      // Batch-fetch active protocols, consents, and intakes for all patients
      const [protocolsResult, consentsResult, intakesResult] = await Promise.all([
        supabase
          .from('protocols')
          .select('patient_id, category')
          .in('patient_id', patientIds)
          .eq('status', 'active'),
        supabase
          .from('consents')
          .select('patient_id, consent_type')
          .in('patient_id', patientIds),
        supabase
          .from('intakes')
          .select('patient_id')
          .in('patient_id', patientIds),
      ]);

      // Build per-patient data
      const protocolsByPatient = {};
      const consentsByPatient = {};
      const intakesByPatient = new Set();

      for (const p of (protocolsResult.data || [])) {
        if (!protocolsByPatient[p.patient_id]) protocolsByPatient[p.patient_id] = [];
        protocolsByPatient[p.patient_id].push(p.category);
      }
      for (const c of (consentsResult.data || [])) {
        if (!consentsByPatient[c.patient_id]) consentsByPatient[c.patient_id] = new Set();
        const formId = CONSENT_TYPE_TO_FORM_ID[c.consent_type] || c.consent_type;
        if (formId) consentsByPatient[c.patient_id].add(formId);
      }
      for (const i of (intakesResult.data || [])) {
        intakesByPatient.add(i.patient_id);
      }

      // Compute missing consents per patient
      for (const pid of patientIds) {
        const completedForms = consentsByPatient[pid] || new Set();
        if (intakesByPatient.has(pid)) completedForms.add('intake');

        // Gather all service categories: active protocols + any appointment service categories
        const categories = new Set(protocolsByPatient[pid] || []);
        for (const apt of formattedAppointments) {
          if (apt.patient?.id === pid) {
            // Use explicit serviceCategory from native appointments
            if (apt.serviceCategory && REQUIRED_FORMS[apt.serviceCategory]) {
              categories.add(apt.serviceCategory);
            }
            // For GHL appointments, try to infer category from calendar name
            if (!apt.serviceCategory && apt.calendarName) {
              const name = apt.calendarName.toLowerCase();
              if (name.includes('iv')) categories.add('iv');
              if (name.includes('hbot') || name.includes('hyperbaric')) categories.add('hbot');
              if (name.includes('red light') || name.includes('rlt')) categories.add('rlt');
              if (name.includes('injection')) categories.add('injection');
              if (name.includes('weight') || name.includes('semaglutide') || name.includes('tirzepatide')) categories.add('weight_loss');
              if (name.includes('testosterone') || name.includes('hrt')) categories.add('hrt');
              if (name.includes('peptide')) categories.add('peptide');
              if (name.includes('blood') || name.includes('lab') || name.includes('draw')) categories.add('labs');
            }
          }
        }

        // Union all required forms across all categories
        const allRequired = new Set();
        for (const cat of categories) {
          const forms = REQUIRED_FORMS[cat];
          if (forms) forms.forEach(f => allRequired.add(f));
        }
        // Every patient needs at least intake + hipaa
        allRequired.add('intake');
        allRequired.add('hipaa');

        // Find missing
        const missing = [];
        for (const formId of allRequired) {
          if (!completedForms.has(formId)) {
            const def = FORM_DEFINITIONS[formId];
            missing.push({ formId, name: def?.name || formId });
          }
        }

        patientConsentsMap[pid] = missing;
      }
    }

    // Attach missing consents to each appointment
    for (const apt of formattedAppointments) {
      apt.missingConsents = apt.patient?.id
        ? (patientConsentsMap[apt.patient.id] || [])
        : [];
    }

    // Group by status
    const scheduled = formattedAppointments.filter(a =>
      ['scheduled', 'confirmed', 'new', 'booked'].includes((a.status || '').toLowerCase())
    );
    const showed = formattedAppointments.filter(a =>
      ['showed', 'completed'].includes((a.status || '').toLowerCase())
    );
    const noShow = formattedAppointments.filter(a =>
      ['no_show', 'noshow', 'cancelled', 'canceled', 'no-show'].includes((a.status || '').toLowerCase())
    );

    return res.status(200).json({
      success: true,
      date: targetDate,
      total: formattedAppointments.length,
      appointments: formattedAppointments,
      byStatus: {
        scheduled: scheduled.length,
        showed: showed.length,
        noShow: noShow.length
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}

// Assign colors based on calendar/appointment type
function getCalendarColor(calendarName) {
  if (!calendarName) return '#6b7280';

  const name = calendarName.toLowerCase();

  if (name.includes('hbot') || name.includes('hyperbaric')) return '#3730a3';
  if (name.includes('red light') || name.includes('rlt')) return '#dc2626';
  if (name.includes('iv')) return '#c2410c';
  if (name.includes('injection') || name.includes('range injection')) return '#7c3aed';
  if (name.includes('testosterone')) return '#059669';
  if (name.includes('peptide')) return '#166534';
  if (name.includes('weight') || name.includes('medical')) return '#0891b2';
  if (name.includes('consult')) return '#6366f1';
  if (name.includes('blood') || name.includes('lab') || name.includes('draw')) return '#b45309';
  if (name.includes('birthday') || name.includes('review') || name.includes('gift')) return '#e11d48';

  return '#6b7280';
}
