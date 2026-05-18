// pages/api/offers/confirm-booking.js
// Books the appointment after a paid new-patient offer checkout.
// Records the purchase and sends staff notification.

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { getOfferById } from '../../../lib/offer-config';
import { createAppointment, CreateAppointmentError } from '../../../lib/create-appointment';
import { pickProviderForSlot } from '../../../lib/scheduling';
import { createFormBundle, FORM_DEFINITIONS } from '../../../lib/form-bundles';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, paymentIntentId, offerId, slotStart, firstName, lastName, email, phone } = req.body;

  if (!offerId || !slotStart || !firstName) {
    return res.status(400).json({ error: 'offerId, slotStart, and firstName are required' });
  }

  const offer = getOfferById(offerId);
  if (!offer) {
    return res.status(400).json({ error: `Unknown offer: ${offerId}` });
  }

  const patientName = `${firstName} ${lastName || ''}`.trim();

  try {
    // Find or create patient
    let patientId = null;
    if (email) {
      const { data: existing } = await supabase
        .from('patients')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existing) {
        patientId = existing.id;
      } else {
        const { data: created } = await supabase
          .from('patients')
          .insert({
            first_name: firstName,
            last_name: lastName || '',
            email: email.toLowerCase(),
            phone: phone || null,
            source: 'new_patient_offer',
          })
          .select('id')
          .single();
        if (created) patientId = created.id;
      }
    }

    // One-per-patient guard
    if (patientId) {
      const { data: priorOffer } = await supabase
        .from('purchases')
        .select('id')
        .eq('patient_id', patientId)
        .ilike('description', '%New Patient Offer%')
        .limit(1);
      if (priorOffer && priorOffer.length > 0) {
        return res.status(409).json({
          error: 'This email has already used a new patient offer. These are limited to one per patient.',
          alreadyUsed: true,
        });
      }
    }

    // Pick provider
    const picked = await pickProviderForSlot({
      serviceSlug: offer.serviceSlug,
      startISO: slotStart,
    });
    if (!picked) {
      return res.status(409).json({
        error: 'This time slot is no longer available. Please pick another time.',
        slotUnavailable: true,
      });
    }

    const startDate = new Date(slotStart);
    const endDate = new Date(startDate.getTime() + offer.durationMinutes * 60000);

    // Create appointment
    const result = await createAppointment({
      patient_id: patientId,
      patient_name: patientName,
      patient_phone: phone || null,
      service_name: offer.name,
      service_category: offer.serviceSlug === 'range-iv' ? 'iv' : offer.serviceSlug === 'hbot' ? 'hbot' : 'rlt',
      service_slug: offer.serviceSlug,
      provider: picked.displayLabel || picked.name,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      duration_minutes: offer.durationMinutes,
      notes: `New Patient Offer: ${offer.name} (${offer.priceDisplay})`,
      visit_reason: offer.name,
      source: 'new_patient_offer',
      created_by: 'OfferCheckout',
      send_notification: true,
    });

    // Record purchase
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com'}/api/stripe/record-purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        amount: offer.priceCents,
        description: `New Patient Offer: ${offer.name}`,
        payment_method: 'stripe',
        service_category: offer.serviceSlug === 'range-iv' ? 'iv_therapy' : offer.serviceSlug === 'hbot' ? 'hbot' : 'rlt',
        service_name: offer.name,
        quantity: offer.id === 'intro-rlt' ? 3 : 1,
        stripe_payment_intent_id: paymentIntentId || null,
        stripe_checkout_session_id: sessionId || null,
      }),
    }).catch(err => console.error('Record purchase error (non-fatal):', err));

    // Staff notification email
    const staffHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#000;padding:24px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:20px;letter-spacing:0.1em;">RANGE MEDICAL</h1>
          <p style="margin:8px 0 0;color:#a3a3a3;font-size:13px;">New Patient Offer Booking</p>
        </div>
        <div style="padding:30px;background:#fff;">
          <div style="border-left:4px solid #000;padding-left:16px;margin-bottom:20px;">
            <p style="margin:0 0 4px;color:#737373;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Patient</p>
            <p style="margin:0;color:#171717;font-size:16px;font-weight:700;">${patientName}</p>
            <p style="margin:4px 0 0;color:#525252;font-size:14px;">${email || 'No email'}${phone ? ` · ${phone}` : ''}</p>
          </div>
          <div style="border-left:4px solid #2E5D3A;padding-left:16px;margin-bottom:20px;">
            <p style="margin:0 0 4px;color:#737373;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Offer</p>
            <p style="margin:0;color:#171717;font-size:16px;font-weight:700;">${offer.name} — ${offer.priceDisplay}</p>
          </div>
          <div style="border-left:4px solid #7c3aed;padding-left:16px;margin-bottom:20px;">
            <p style="margin:0 0 4px;color:#737373;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Appointment</p>
            <p style="margin:0;color:#171717;font-size:14px;">${startDate.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' })}</p>
            <p style="margin:4px 0 0;color:#525252;font-size:14px;">Provider: ${picked.displayLabel || picked.name}</p>
          </div>
          <div style="background:#fef3c7;padding:12px 16px;border-radius:8px;margin-top:16px;">
            <p style="margin:0;color:#92400e;font-size:13px;font-weight:600;">
              New patient offer — good opportunity for Range Assessment conversation during the visit.
            </p>
          </div>
        </div>
        <div style="background:#fafafa;padding:20px;text-align:center;border-top:2px solid #e5e5e5;">
          <p style="margin:0;color:#737373;font-size:12px;">Range Medical · Newport Beach, CA · (949) 997-3988</p>
        </div>
      </div>
    `;

    resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      replyTo: 'info@range-medical.com',
      to: ['intake@range-medical.com'],
      subject: `New Patient Offer: ${patientName} — ${offer.name}`,
      html: staffHtml,
    }).catch(err => console.error('Staff email error (non-fatal):', err));

    // Send consent forms + medical intake to patient
    if (email) {
      const formIds = ['intake', ...offer.consentTypes];
      const formList = formIds
        .filter(id => FORM_DEFINITIONS[id])
        .map(id => `<li style="padding:4px 0;color:#525252;">${FORM_DEFINITIONS[id].name} <span style="color:#a0a0a0;">(${FORM_DEFINITIONS[id].time})</span></li>`)
        .join('');

      createFormBundle({
        formIds,
        patientId,
        patientName,
        patientEmail: email.toLowerCase(),
        patientPhone: phone || null,
        metadata: { source: 'new_patient_offer', offerId: offer.id },
      }).then(bundle => {
        const apptDateStr = startDate.toLocaleString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric',
          hour: 'numeric', minute: '2-digit',
          timeZone: 'America/Los_Angeles',
        });

        const patientHtml = `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#000;padding:24px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:20px;letter-spacing:0.1em;">RANGE MEDICAL</h1>
            </div>
            <div style="padding:30px;background:#fff;">
              <p style="margin:0 0 20px;color:#171717;font-size:16px;line-height:1.6;">
                Hi ${firstName},
              </p>
              <p style="margin:0 0 20px;color:#525252;font-size:15px;line-height:1.6;">
                Your <strong>${offer.name}</strong> is booked for <strong>${apptDateStr}</strong>. Before your visit, please complete the following forms:
              </p>
              <ul style="margin:0 0 24px;padding-left:20px;line-height:1.8;font-size:14px;">
                ${formList}
              </ul>
              <div style="text-align:center;margin:28px 0;">
                <a href="${bundle.url}" style="display:inline-block;padding:14px 36px;background:#1a1a1a;color:#fff;text-decoration:none;font-size:15px;font-weight:700;border-radius:999px;letter-spacing:0.01em;">
                  Complete Your Forms
                </a>
              </div>
              <p style="margin:0 0 12px;color:#a0a0a0;font-size:13px;line-height:1.5;text-align:center;">
                Takes about ${formIds.reduce((sum, id) => sum + (parseInt(FORM_DEFINITIONS[id]?.time) || 5), 0)} minutes total. Please complete before your appointment.
              </p>
              <div style="border-top:1px solid #e5e5e5;padding-top:20px;margin-top:24px;">
                <p style="margin:0 0 4px;color:#737373;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Location</p>
                <p style="margin:0;color:#171717;font-size:14px;font-weight:600;">Range Medical</p>
                <p style="margin:4px 0 0;color:#525252;font-size:14px;">1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660</p>
              </div>
            </div>
            <div style="background:#fafafa;padding:20px;text-align:center;border-top:2px solid #e5e5e5;">
              <p style="margin:0;color:#737373;font-size:12px;">Questions? Call or text (949) 997-3988</p>
            </div>
          </div>
        `;

        resend.emails.send({
          from: 'Range Medical <noreply@range-medical.com>',
          replyTo: 'info@range-medical.com',
          to: [email.toLowerCase()],
          subject: `Your forms for ${offer.name} — please complete before your visit`,
          html: patientHtml,
        }).catch(err => console.error('Patient forms email error (non-fatal):', err));
      }).catch(err => console.error('Form bundle creation error (non-fatal):', err));
    }

    return res.status(200).json({
      success: true,
      appointmentId: result.appointment?.id,
      scheduledStart: slotStart,
    });
  } catch (e) {
    if (e instanceof CreateAppointmentError) {
      return res.status(e.statusCode).json({ error: e.message, slotUnavailable: e.statusCode === 409 });
    }
    console.error('Offer confirm-booking error:', e);
    return res.status(500).json({ error: 'Failed to book appointment' });
  }
}
