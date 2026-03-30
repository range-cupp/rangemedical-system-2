// /pages/api/book/create.js
// Creates a Cal.com booking for a patient's in-clinic injection
// Prefers Lily/Evan over Damien, notifies front desk + assigned provider via SMS

import { createClient } from '@supabase/supabase-js';
import { createBooking, reassignBooking } from '../../../lib/calcom';
import { sendProviderNotification } from '../../../lib/provider-notifications';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cal.com user IDs — prefer Lily/Evan for injections
const PREFERRED_HOSTS = [
  { id: 2197567, name: 'Lily' },
  { id: 2197566, name: 'Evan' },
];
const DAMIEN_ID = 2197563;

// Front desk number for booking notifications
const FRONT_DESK_PHONE = '+19495395023';

function formatDateTimePST(isoString) {
  return new Date(isoString).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, eventTypeId, slug, slotStart, patientName, patientEmail, patientPhone } = req.body;

  if (!token || !eventTypeId || !slotStart) {
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

    // Create booking via Cal.com
    const booking = await createBooking({
      eventTypeId: parseInt(eventTypeId),
      start: slotStart,
      name: patientName,
      email: patientEmail || `patient-${protocol.patient_id}@range-medical.com`,
      phoneNumber: patientPhone || undefined,
      notes: `Self-booked via patient booking link (${protocol.program_type})`,
    });

    if (booking.error) {
      console.error('Cal.com booking error:', booking.error);
      return res.status(500).json({ error: 'Failed to create booking. Please try another time slot.' });
    }

    const bookingUid = booking.uid || booking.id;
    let assignedHost = null;

    // Check if Damien was assigned — if so, reassign to Lily or Evan
    const assignedHostId = booking.hosts?.[0]?.id || booking.host?.id || null;
    const assignedHostName = booking.hosts?.[0]?.name || booking.host?.name || null;

    if (assignedHostId === DAMIEN_ID) {
      for (const preferred of PREFERRED_HOSTS) {
        const result = await reassignBooking(bookingUid, preferred.id);
        if (!result.error) {
          assignedHost = preferred.name;
          console.log(`Injection booking reassigned from Damien to ${preferred.name} (booking ${bookingUid})`);
          break;
        }
        console.log(`Could not reassign to ${preferred.name}, trying next...`);
      }
      // If reassign failed, Damien stays
      if (!assignedHost) assignedHost = 'Damien';
    } else {
      assignedHost = assignedHostName || 'Staff';
    }

    const serviceName = slug === 'injection-testosterone' ? 'Testosterone Injection'
      : slug === 'injection-weight-loss' ? 'Weight Loss Injection'
      : 'Injection';

    const dateTime = formatDateTimePST(slotStart);

    // Send front desk notification
    const frontDeskMsg = `New self-booking: ${patientName} — ${serviceName} on ${dateTime}. Assigned to ${assignedHost}. - Range Medical`;
    const normalizedFrontDesk = normalizePhone(FRONT_DESK_PHONE);
    if (normalizedFrontDesk) {
      sendSMS({ to: normalizedFrontDesk, message: frontDeskMsg }).catch((err) => {
        console.error('Front desk SMS failed:', err);
      });
    }

    // Send provider notification
    sendProviderNotification({
      type: 'created',
      staff: { name: assignedHost },
      appointment: {
        patientName,
        serviceName,
        startTime: slotStart,
      },
    }).catch((err) => {
      console.error('Provider notification failed:', err);
    });

    return res.status(200).json({
      success: true,
      booking: {
        uid: bookingUid,
        start: slotStart,
        assignedTo: assignedHost,
      },
    });
  } catch (error) {
    console.error('Book create error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
