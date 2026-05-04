// /pages/api/assessment/book.js
// Books the Range Assessment appointment via the native scheduling engine.
// Cal.com is no longer in the loop — createAppointment handles inserts,
// shadow row, notifications, automations, and audit.

import { createClient } from '@supabase/supabase-js';
import { createAppointment } from '../../../lib/create-appointment';
import { pickProviderForSlot } from '../../../lib/scheduling';
import { runPostBookingNotifications } from '../../../lib/assessment-post-booking';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId, eventTypeId, start, patientName, patientEmail, patientPhone } = req.body;

    if (!leadId || !start || !patientName || !patientEmail) {
      return res.status(400).json({ error: 'leadId, start, patientName, and patientEmail are required' });
    }

    const { data: lead, error: leadError } = await supabase
      .from('assessment_leads')
      .select('payment_status')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ error: 'Assessment lead not found' });
    }
    if (lead.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment must be completed before booking' });
    }

    // Resolve service slug. Falls back to range-assessment-injury (the
    // default behind /assessment) if the eventTypeId doesn't map.
    let serviceSlug = 'range-assessment-injury';
    if (eventTypeId) {
      const { data: svc } = await supabase
        .from('services')
        .select('slug')
        .eq('legacy_calcom_event_type_id', parseInt(eventTypeId, 10))
        .maybeSingle();
      if (svc?.slug) serviceSlug = svc.slug;
    }

    const provider = await pickProviderForSlot({ serviceSlug, startISO: start });
    if (!provider) {
      return res.status(409).json({
        error: 'No provider available at that time. Please pick another slot or call (949) 997-3988.',
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + 30 * 60000);

    // Look up patient by email if one already exists.
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('email', patientEmail.toLowerCase().trim())
      .maybeSingle();
    const patientId = existingPatient?.id || null;

    const result = await createAppointment({
      patient_id: patientId,
      patient_name: patientName,
      patient_phone: patientPhone || null,
      service_name: 'Range Assessment',
      service_category: 'assessment',
      service_slug: serviceSlug,
      provider: provider.displayLabel || provider.name,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      duration_minutes: 30,
      notes: 'Injury & Recovery Assessment — booked via website',
      visit_reason: 'Injury & Recovery Assessment',
      source: 'patient',
      created_by: 'website-assessment',
      send_notification: true,
    });

    console.log(`Assessment booking created: appointment=${result.appointment.id} for lead ${leadId}`);

    // Update assessment_leads with booking info AND verified contact info.
    const verifiedFirst = (patientName.trim().split(/\s+/)[0] || '').trim();
    const verifiedLast = patientName.trim().split(/\s+/).slice(1).join(' ').trim();
    const verifiedEmail = patientEmail.toLowerCase().trim();
    await supabase
      .from('assessment_leads')
      .update({
        calcom_booking_uid: result.appointment.id,        // legacy column → appointment.id
        booking_start_time: startDate.toISOString(),
        first_name: verifiedFirst || undefined,
        last_name: verifiedLast || undefined,
        email: verifiedEmail || undefined,
        phone: patientPhone || undefined,
      })
      .eq('id', leadId);

    // Fire intake email + Damon's task + pipeline insert. Idempotent.
    runPostBookingNotifications({
      supabase,
      leadId,
      patientId,
      verified: {
        firstName: verifiedFirst,
        lastName: verifiedLast,
        email: verifiedEmail,
        phone: patientPhone || '',
      },
    }).catch((err) => console.error('[book] post-booking notifications failed:', err.message));

    return res.status(200).json({
      success: true,
      booking: { uid: result.appointment.id, start: startDate.toISOString() },
    });
  } catch (error) {
    console.error('Assessment booking error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
