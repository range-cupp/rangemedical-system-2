// /pages/api/review/book.js
// Books a free review gift injection via Cal.com and marks the gift as booked
// Same host preference logic as birthday bookings

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
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
      notes: '[GOOGLE REVIEW GIFT] Free injection - do not charge',
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

    // Notify Chris via email
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const injectionLabel = injectionType === 'nad-injection' ? 'NAD+ Injection' : 'Range Injection';
      const bookingTime = new Date(slotStart).toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      await resend.emails.send({
        from: 'Range Medical <noreply@range-medical.com>',
        to: 'cupp@range-medical.com',
        subject: `Google Review Gift Booked: ${patientName}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="font-size: 18px; margin: 0 0 16px;">Google Review Gift Booked</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Patient</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600;">${patientName}</td></tr>
              <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Injection</td><td style="padding: 8px 0; font-size: 14px;">${injectionLabel}</td></tr>
              <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Time</td><td style="padding: 8px 0; font-size: 14px;">${bookingTime}</td></tr>
            </table>
            <p style="font-size: 13px; color: #888; margin-top: 20px;">This is a free injection from a Google review gift.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Failed to send review gift notification email:', emailErr);
      // Non-fatal — booking still succeeded
    }

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
