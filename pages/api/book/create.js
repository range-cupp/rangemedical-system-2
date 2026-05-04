// /pages/api/book/create.js
// Books an in-clinic injection via the native scheduling engine.
// Cal.com is no longer in the loop.

import { createClient } from '@supabase/supabase-js';
import { createAppointment } from '../../../lib/create-appointment';
import { pickProviderForSlot } from '../../../lib/scheduling';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FRONT_DESK_PHONE = '+19495395023';

function formatDateTimePST(isoString) {
  return new Date(isoString).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
    timeZone: 'America/Los_Angeles',
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, eventTypeId, slug, slotStart, patientName, patientEmail, patientPhone } = req.body;

  if (!token || !slotStart) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verify the token belongs to an active in-clinic protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('id, patient_id, program_type, status, delivery_method')
      .eq('access_token', token)
      .eq('status', 'active')
      .eq('delivery_method', 'in_clinic')
      .limit(1)
      .maybeSingle();
    if (protocolError) throw protocolError;
    if (!protocol) {
      return res.status(404).json({ error: 'Invalid or expired booking link' });
    }

    // Resolve service slug
    let serviceSlug = slug || 'range-injections';
    if (!slug && eventTypeId) {
      const { data: svc } = await supabase
        .from('services')
        .select('slug')
        .eq('legacy_calcom_event_type_id', parseInt(eventTypeId, 10))
        .maybeSingle();
      if (svc?.slug) serviceSlug = svc.slug;
    }

    const provider = await pickProviderForSlot({ serviceSlug, startISO: slotStart });
    if (!provider) {
      return res.status(409).json({ error: 'No provider available for that time. Please pick another.' });
    }
    const assignedHost = provider.displayLabel || provider.name;

    const serviceName = serviceSlug === 'injection-testosterone' ? 'Testosterone Injection'
      : serviceSlug === 'injection-weight-loss' ? 'Weight Loss Injection'
      : 'Range Injection';
    const serviceCategory = serviceSlug === 'injection-testosterone' ? 'hrt'
      : serviceSlug === 'injection-weight-loss' ? 'weight_loss'
      : 'injection';

    const startDate = new Date(slotStart);
    const endDate = new Date(startDate.getTime() + 15 * 60000);

    const result = await createAppointment({
      patient_id: protocol.patient_id,
      patient_name: patientName,
      patient_phone: patientPhone || null,
      service_name: serviceName,
      service_category: serviceCategory,
      service_slug: serviceSlug,
      provider: assignedHost,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      duration_minutes: 15,
      notes: `Self-booked via patient booking link (${protocol.program_type})`,
      visit_reason: `Self-booked ${serviceName} (${protocol.program_type})`,
      source: 'patient',
      created_by: 'patient-self-book',
      send_notification: true,
    });

    // Front desk SMS notification (provider notification + patient confirmation
    // already fired from createAppointment).
    const dateTime = formatDateTimePST(slotStart);
    const frontDeskMsg = `New self-booking: ${patientName} — ${serviceName} on ${dateTime}. Assigned to ${assignedHost}. - Range Medical`;
    const normalizedFrontDesk = normalizePhone(FRONT_DESK_PHONE);
    if (normalizedFrontDesk) {
      sendSMS({
        to: normalizedFrontDesk,
        message: frontDeskMsg,
        log: {
          messageType: 'booking_staff_notification',
          source: 'book-create',
          patientId: protocol.patient_id,
        },
      }).catch((err) => console.error('Front desk SMS failed:', err));
    }

    return res.status(200).json({
      success: true,
      booking: {
        uid: result.appointment.id,
        start: slotStart,
        assignedTo: assignedHost,
      },
    });
  } catch (error) {
    console.error('Book create error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
