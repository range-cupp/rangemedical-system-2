// /pages/api/review/book.js
// Books a free review gift injection via Cal.com and marks the gift as booked
// Same host preference logic as birthday bookings

import { createClient } from '@supabase/supabase-js';
import { createBooking, reassignBooking } from '../../../lib/calcom';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, injectionType, eventTypeId, slotStart, patientName, patientEmail, patientPhone } = req.body;

  if (!token || !injectionType || !eventTypeId || !slotStart) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data: gift, error: giftError } = await supabase
      .from('review_gifts')
      .select('id, patient_id, status, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (giftError) throw giftError;

    if (!gift) {
      return res.status(404).json({ error: 'Gift not found' });
    }

    if (gift.status !== 'active') {
      return res.status(400).json({ error: `Gift is already ${gift.status}` });
    }

    if (new Date() > new Date(gift.expires_at)) {
      await supabase.from('review_gifts').update({ status: 'expired' }).eq('id', gift.id);
      return res.status(400).json({ error: 'Gift has expired' });
    }

    // Create booking via Cal.com
    const booking = await createBooking({
      eventTypeId: parseInt(eventTypeId),
      start: slotStart,
      name: patientName,
      email: patientEmail || `patient-${gift.patient_id}@range-medical.com`,
      phoneNumber: patientPhone || undefined,
      notes: 'Google review gift - free injection from Range Medical',
    });

    if (booking.error) {
      console.error('Cal.com booking error:', booking.error);
      return res.status(500).json({ error: 'Failed to create booking. Please try another time slot.' });
    }

    const bookingUid = booking.uid || booking.id;

    // Check if Damien was assigned — if so, reassign to Lily or Evan
    const assignedHostId = booking.hosts?.[0]?.id || booking.host?.id || null;
    if (assignedHostId === DAMIEN_ID) {
      for (const preferred of PREFERRED_HOSTS) {
        const result = await reassignBooking(bookingUid, preferred.id);
        if (!result.error) {
          console.log(`Review injection reassigned from Damien to ${preferred.name} (booking ${bookingUid})`);
          break;
        }
        console.log(`Could not reassign to ${preferred.name}, trying next...`);
      }
    }

    // Mark gift as booked
    await supabase
      .from('review_gifts')
      .update({
        status: 'booked',
        injection_type: injectionType,
        calcom_booking_uid: String(bookingUid),
        booked_at: new Date().toISOString(),
      })
      .eq('id', gift.id);

    return res.status(200).json({
      success: true,
      booking: {
        uid: bookingUid,
        start: slotStart,
        injectionType,
      },
    });
  } catch (error) {
    console.error('Review book error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
