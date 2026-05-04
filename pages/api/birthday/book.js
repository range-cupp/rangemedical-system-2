// /pages/api/birthday/book.js
// Books a free birthday injection via the native scheduling engine.
// Cal.com is no longer in the loop — createAppointment writes the
// appointments row, the shadow calcom_bookings row, and triggers
// notifications + automations + audit log.

import { createClient } from '@supabase/supabase-js';
import { createAppointment } from '../../../lib/create-appointment';
import { pickProviderForSlot } from '../../../lib/scheduling';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, injectionType, eventTypeId, slotStart, patientName, patientEmail, patientPhone } = req.body;

  if (!token || !injectionType || !slotStart) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data: gift, error: giftError } = await supabase
      .from('birthday_gifts')
      .select('id, patient_id, status, expires_at')
      .eq('token', token)
      .maybeSingle();
    if (giftError) throw giftError;

    if (!gift) return res.status(404).json({ error: 'Gift not found' });
    if (gift.status !== 'active') {
      return res.status(400).json({ error: `Gift is already ${gift.status}` });
    }
    if (new Date() > new Date(gift.expires_at)) {
      await supabase.from('birthday_gifts').update({ status: 'expired' }).eq('id', gift.id);
      return res.status(400).json({ error: 'Gift has expired' });
    }

    // Resolve the service slug from the legacy event type id (for back-compat)
    // or fall back to the injection type the patient picked.
    let serviceSlug = injectionType === 'nad-injection' ? 'nad-injection' : 'range-injections';
    if (eventTypeId) {
      const { data: svc } = await supabase
        .from('services')
        .select('slug')
        .eq('legacy_calcom_event_type_id', parseInt(eventTypeId, 10))
        .maybeSingle();
      if (svc?.slug) serviceSlug = svc.slug;
    }

    // Pick the least-busy eligible provider for this slot.
    const provider = await pickProviderForSlot({ serviceSlug, startISO: slotStart });
    if (!provider) {
      return res.status(409).json({ error: 'No provider available for that time. Please pick another.' });
    }

    const startDate = new Date(slotStart);
    const endDate = new Date(startDate.getTime() + 15 * 60 * 1000);
    const injectionLabel = injectionType === 'nad-injection' ? 'NAD+ Injection' : 'Range Injections';

    const result = await createAppointment({
      patient_id: gift.patient_id,
      patient_name: patientName,
      patient_phone: patientPhone || null,
      service_name: injectionLabel,
      service_category: 'injection',
      service_slug: serviceSlug,
      provider: provider.displayLabel || provider.name,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      duration_minutes: 15,
      notes: '[BIRTHDAY GIFT] Free injection from Range Medical',
      visit_reason: 'Birthday gift — free injection',
      source: 'patient',
      created_by: 'birthday-gift',
      send_notification: true,
    });

    // Mark gift as booked and link to the local appointment.
    await supabase
      .from('birthday_gifts')
      .update({
        status: 'booked',
        injection_type: injectionType,
        calcom_booking_uid: result.appointment.id, // legacy column, now stores appointment.id
        booked_at: new Date().toISOString(),
      })
      .eq('id', gift.id);

    return res.status(200).json({
      success: true,
      booking: {
        uid: result.appointment.id,
        start: slotStart,
        injectionType,
      },
    });
  } catch (error) {
    console.error('Birthday book error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
