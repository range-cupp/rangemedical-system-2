// /pages/api/review/book.js
// Books a free review-gift injection via the native scheduling engine.
// Cal.com is no longer in the loop.

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
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
      .from('review_gifts')
      .select('id, patient_id, status, expires_at')
      .eq('token', token)
      .maybeSingle();
    if (giftError) throw giftError;

    if (!gift) return res.status(404).json({ error: 'Gift not found' });
    if (gift.status !== 'active') {
      return res.status(400).json({ error: `Gift is already ${gift.status}` });
    }
    if (new Date() > new Date(gift.expires_at)) {
      await supabase.from('review_gifts').update({ status: 'expired' }).eq('id', gift.id);
      return res.status(400).json({ error: 'Gift has expired' });
    }

    let serviceSlug = injectionType === 'nad-injection' ? 'nad-injection' : 'range-injections';
    if (eventTypeId) {
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

    const startDate = new Date(slotStart);
    const endDate = new Date(startDate.getTime() + 15 * 60 * 1000);
    const injectionLabelForAppt = injectionType === 'nad-injection' ? 'NAD+ Injection' : 'Range Injections';

    const result = await createAppointment({
      patient_id: gift.patient_id,
      patient_name: patientName,
      patient_phone: patientPhone || null,
      service_name: injectionLabelForAppt,
      service_category: 'injection',
      service_slug: serviceSlug,
      provider: provider.displayLabel || provider.name,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      duration_minutes: 15,
      notes: '[GOOGLE REVIEW GIFT] Free injection - do not charge',
      visit_reason: 'Google review gift — free injection',
      source: 'patient',
      created_by: 'review-gift',
      send_notification: true,
    });

    await supabase
      .from('review_gifts')
      .update({
        status: 'booked',
        injection_type: injectionType,
        calcom_booking_uid: result.appointment.id,
        booked_at: new Date().toISOString(),
      })
      .eq('id', gift.id);

    // Notify Chris via email (unchanged from previous behaviour).
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
    }

    return res.status(200).json({
      success: true,
      booking: {
        uid: result.appointment.id,
        start: slotStart,
        injectionType,
      },
    });
  } catch (error) {
    console.error('Review book error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
