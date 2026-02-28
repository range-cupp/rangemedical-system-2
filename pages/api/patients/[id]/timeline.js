// /pages/api/patients/[id]/timeline.js
// Timeline aggregation API - merges events from multiple sources
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const filter = req.query.filter || 'all';

  if (!id) {
    return res.status(400).json({ error: 'Patient ID required' });
  }

  try {
    // Get patient info for fallback lookups
    const { data: patient } = await supabase
      .from('patients')
      .select('id, ghl_contact_id, email, phone')
      .eq('id', id)
      .single();

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const events = [];

    // 1. Service logs
    if (filter === 'all' || filter === 'services') {
      const { data: serviceLogs } = await supabase
        .from('service_logs')
        .select('id, category, entry_type, entry_date, medication, dosage, quantity, dispensed_by, notes, created_at')
        .eq('patient_id', id)
        .order('entry_date', { ascending: false })
        .limit(100);

      (serviceLogs || []).forEach(log => {
        events.push({
          type: 'service',
          date: log.entry_date || log.created_at,
          title: `${log.entry_type || 'Service'}: ${log.medication || log.category || 'Unknown'}`,
          detail: [log.dosage, log.quantity, log.dispensed_by ? `by ${log.dispensed_by}` : ''].filter(Boolean).join(' - '),
          metadata: { id: log.id, category: log.category, entry_type: log.entry_type }
        });
      });
    }

    // 2. Protocol events (created)
    if (filter === 'all' || filter === 'protocols') {
      const { data: protocols } = await supabase
        .from('protocols')
        .select('id, program_type, program_name, medication, status, start_date, created_at')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });

      (protocols || []).forEach(p => {
        events.push({
          type: 'protocol_created',
          date: p.created_at,
          title: `Protocol started: ${p.program_name || p.program_type}`,
          detail: [p.medication, p.status].filter(Boolean).join(' - '),
          metadata: { id: p.id, program_type: p.program_type }
        });
      });
    }

    // 3. Consent forms
    if (filter === 'all' || filter === 'documents') {
      const { data: consents } = await supabase
        .from('consents')
        .select('id, consent_type, submitted_at, created_at')
        .eq('patient_id', id)
        .order('submitted_at', { ascending: false });

      (consents || []).forEach(c => {
        events.push({
          type: 'consent_signed',
          date: c.submitted_at || c.created_at,
          title: `Consent signed: ${(c.consent_type || 'Unknown').replace(/_/g, ' ')}`,
          detail: '',
          metadata: { id: c.id, consent_type: c.consent_type }
        });
      });
    }

    // 4. Intake forms
    if (filter === 'all' || filter === 'documents') {
      const { data: intakes } = await supabase
        .from('intakes')
        .select('id, submitted_at, created_at')
        .eq('patient_id', id)
        .order('submitted_at', { ascending: false });

      (intakes || []).forEach(i => {
        events.push({
          type: 'intake_submitted',
          date: i.submitted_at || i.created_at,
          title: 'Medical intake form submitted',
          detail: '',
          metadata: { id: i.id }
        });
      });
    }

    // 5. Appointments
    if (filter === 'all' || filter === 'appointments') {
      const { data: appointments } = await supabase
        .from('clinic_appointments')
        .select('id, service_name, start_time, status, created_at')
        .eq('patient_id', id)
        .order('start_time', { ascending: false })
        .limit(50);

      (appointments || []).forEach(apt => {
        events.push({
          type: 'appointment',
          date: apt.start_time || apt.created_at,
          title: `Appointment: ${apt.service_name || 'Visit'}`,
          detail: apt.status || 'scheduled',
          metadata: { id: apt.id, status: apt.status }
        });
      });

      // Also check calcom_bookings
      const { data: bookings } = await supabase
        .from('calcom_bookings')
        .select('id, service_name, start_time, status, created_at')
        .eq('patient_id', id)
        .order('start_time', { ascending: false })
        .limit(50);

      (bookings || []).forEach(b => {
        events.push({
          type: 'appointment',
          date: b.start_time || b.created_at,
          title: `Booking: ${b.service_name || 'Appointment'}`,
          detail: b.status || 'scheduled',
          metadata: { id: b.id, source: 'calcom', status: b.status }
        });
      });
    }

    // 6. Communications
    if (filter === 'all' || filter === 'communications') {
      const { data: comms } = await supabase
        .from('comms_log')
        .select('id, channel, message_type, body, status, created_at')
        .eq('patient_id', id)
        .order('created_at', { ascending: false })
        .limit(50);

      (comms || []).forEach(c => {
        events.push({
          type: 'communication',
          date: c.created_at,
          title: `${c.channel === 'email' ? 'Email' : 'SMS'}: ${(c.message_type || 'message').replace(/_/g, ' ')}`,
          detail: c.status || 'sent',
          metadata: { id: c.id, channel: c.channel, message_type: c.message_type }
        });
      });
    }

    // 7. Notes
    if (filter === 'all') {
      const { data: notes } = await supabase
        .from('patient_notes')
        .select('id, body, note_date, source')
        .eq('patient_id', id)
        .order('note_date', { ascending: false });

      (notes || []).forEach(n => {
        events.push({
          type: 'note',
          date: n.note_date || n.created_at,
          title: 'Note',
          detail: (n.body || '').substring(0, 100) + (n.body?.length > 100 ? '...' : ''),
          metadata: { id: n.id, source: n.source }
        });
      });
    }

    // Sort all events by date descending
    events.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    // Apply pagination
    const paginated = events.slice(offset, offset + limit);

    return res.status(200).json({
      events: paginated,
      total: events.length,
      limit,
      offset
    });

  } catch (error) {
    console.error('Timeline API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
