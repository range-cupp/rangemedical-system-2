// /pages/api/ai/today-schedule.js
// Returns today's (or a given date's) appointment schedule for the AI assistant
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { CONSENT_TYPE_TO_FORM_ID } from '../../../lib/form-bundles';
import { REQUIRED_FORMS } from '../../../lib/appointment-services';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function todayPacific() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

function getPacificDayBounds(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  });
  const fakeUtc = Date.UTC(
    ...dateStr.split('-').map((v, i) => i === 1 ? +v - 1 : +v),
    0, 0, 0
  );
  const realUtc = new Date(fakeUtc);
  const parts = Object.fromEntries(
    f.formatToParts(realUtc).map(({ type, value }) => [type, value])
  );
  const ptFakeUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  const offsetMs = ptFakeUtc - realUtc.getTime();
  const offsetMin = Math.round(offsetMs / 60000);
  const sign = offsetMin <= 0 ? '-' : '+';
  const abs = Math.abs(offsetMin);
  const oh = String(Math.floor(abs / 60)).padStart(2, '0');
  const om = String(abs % 60).padStart(2, '0');
  const offset = `${sign}${oh}:${om}`;

  return {
    start: `${dateStr}T00:00:00${offset}`,
    end: `${dateStr}T23:59:59${offset}`,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const date = req.query.date || todayPacific();
  const { start, end } = getPacificDayBounds(date);

  try {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('id, patient_id, patient_name, patient_phone, service_name, service_category, provider, start_time, end_time, duration_minutes, status, modality, visit_reason, checked_in_at, notes')
      .gte('start_time', start)
      .lte('start_time', end)
      .not('status', 'eq', 'cancelled')
      .order('start_time', { ascending: true });

    if (error) throw error;

    // Batch-fetch consent form status for all patients on the schedule
    const patientIds = [...new Set((appointments || []).map(a => a.patient_id).filter(Boolean))];
    let consentsByPatient = {};
    if (patientIds.length > 0) {
      const { data: consents } = await supabase
        .from('consents')
        .select('patient_id, consent_type, consent_given')
        .in('patient_id', patientIds)
        .eq('consent_given', true);
      for (const c of (consents || [])) {
        if (!consentsByPatient[c.patient_id]) consentsByPatient[c.patient_id] = new Set();
        const formId = CONSENT_TYPE_TO_FORM_ID[c.consent_type] || c.consent_type;
        consentsByPatient[c.patient_id].add(formId);
      }

      // Also check intakes table — intake records live there, not in consents
      const { data: intakes } = await supabase
        .from('intakes')
        .select('patient_id')
        .in('patient_id', patientIds);
      for (const i of (intakes || [])) {
        if (!consentsByPatient[i.patient_id]) consentsByPatient[i.patient_id] = new Set();
        consentsByPatient[i.patient_id].add('intake');
      }
    }

    const formatted = (appointments || []).map(a => {
      const signed = consentsByPatient[a.patient_id] || new Set();
      const hasIntake = signed.has('intake');
      const hasHipaa = signed.has('hipaa');
      const required = REQUIRED_FORMS[a.service_category] || ['intake', 'hipaa'];
      const missing = required.filter(r => !signed.has(r));

      return {
        id: a.id,
        patient_id: a.patient_id,
        patient_name: a.patient_name,
        patient_phone: a.patient_phone,
        service: a.service_name,
        category: a.service_category,
        provider: a.provider,
        time: new Date(a.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' }),
        start_time: a.start_time,
        duration: a.duration_minutes,
        status: a.status,
        modality: a.modality,
        visit_reason: a.visit_reason,
        checked_in: !!a.checked_in_at,
        notes: a.notes,
        forms_complete: missing.length === 0,
        forms_missing: missing,
        has_intake: hasIntake,
        has_hipaa: hasHipaa,
      };
    });

    const summary = {
      total: formatted.length,
      confirmed: formatted.filter(a => a.status === 'confirmed').length,
      scheduled: formatted.filter(a => a.status === 'scheduled').length,
      completed: formatted.filter(a => a.status === 'completed').length,
    };

    return res.status(200).json({ date, appointments: formatted, summary });
  } catch (err) {
    console.error('Today schedule error:', err);
    return res.status(500).json({ error: 'Failed to fetch schedule' });
  }
}
