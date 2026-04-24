// pages/api/iv-booking/confirm.js
// After successful payment + Cal.com booking, records purchase and sends consent forms via SMS

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { createFormBundle, FORM_DEFINITIONS } from '../../../lib/form-bundles';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { hasBlooioOptIn, queuePendingLinkMessage, isBlooioProvider } from '../../../lib/blooio-optin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      paymentIntentId,
      selectedIV,
      addOns,
      bloodWork,
      patientInfo,
      calcomBookingUid,
      appointmentTime,
    } = req.body;

    const patientName = `${patientInfo.firstName} ${patientInfo.lastName}`;
    const patientEmail = patientInfo.email;
    const patientPhone = patientInfo.phone;

    // 1. Find or create patient
    let patientId = null;
    if (patientEmail) {
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('email', patientEmail)
        .single();

      if (existingPatient) {
        patientId = existingPatient.id;
      }
    }

    // 2. Record purchase
    let totalCents = selectedIV.priceCents;
    const addOnCount = addOns?.length || 0;
    if (addOnCount > 0) totalCents += addOnCount * 3500;
    if (bloodWork) totalCents += 12500;

    const purchaseDescription = addOnCount > 0
      ? `${selectedIV.name} + ${addOnCount} add-on${addOnCount > 1 ? 's' : ''} (${addOns.join(', ')})`
      : selectedIV.name;

    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com'}/api/stripe/record-purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        amount: totalCents,
        description: purchaseDescription,
        payment_method: 'stripe',
        service_category: selectedIV.category === 'specialty' ? 'specialty_iv' : 'iv_therapy',
        service_name: selectedIV.name,
        quantity: 1,
        stripe_payment_intent_id: paymentIntentId,
      }),
    }).catch(err => console.error('Record purchase error (non-fatal):', err));

    // 3. Check if patient has completed IV consent + HIPAA
    let needsForms = [];
    if (patientId) {
      const { data: existingConsents } = await supabase
        .from('consents')
        .select('consent_type')
        .eq('patient_id', patientId)
        .eq('consent_given', true)
        .in('consent_type', ['iv', 'iv_injection', 'hipaa']);

      const completedTypes = (existingConsents || []).map(c => c.consent_type);
      if (!completedTypes.includes('iv') && !completedTypes.includes('iv_injection')) {
        needsForms.push('iv');
      }
      if (!completedTypes.includes('hipaa')) {
        needsForms.push('hipaa');
      }
    } else {
      // New patient — needs both forms
      needsForms = ['hipaa', 'iv'];
    }

    // 4. Send consent forms via SMS if needed
    // AUTO FORM-SEND DISABLED — staff send forms manually from the patient profile.
    const AUTO_SEND_FORMS_ON_BOOKING = false;
    let formBundleUrl = null;
    if (AUTO_SEND_FORMS_ON_BOOKING && needsForms.length > 0 && patientPhone) {
      const normalizedPhone = normalizePhone(patientPhone);
      if (normalizedPhone) {
        try {
          const bundle = await createFormBundle({
            formIds: needsForms,
            patientId,
            patientName,
            patientEmail,
            patientPhone: normalizedPhone,
          });
          formBundleUrl = bundle.url;

          const greeting = patientInfo.firstName ? `Hi ${patientInfo.firstName}! ` : '';
          const formCount = needsForms.length;
          const messageBody = formCount === 1
            ? `${greeting}Range Medical here. Please complete your ${FORM_DEFINITIONS[needsForms[0]].name} before your IV appointment:\n\n${bundle.url}`
            : `${greeting}Range Medical here. Please complete your ${formCount} forms before your IV appointment:\n\n${bundle.url}`;

          // Handle Blooio two-step if needed
          if (isBlooioProvider()) {
            const optedIn = await hasBlooioOptIn(normalizedPhone);
            if (!optedIn) {
              const optInMsg = `${greeting}Range Medical here. We have ${formCount} form${formCount > 1 ? 's' : ''} ready for your upcoming IV appointment. Reply YES to receive ${formCount > 1 ? 'them' : 'it'}.`;
              await sendSMS({ to: normalizedPhone, message: optInMsg });
              await queuePendingLinkMessage({
                phone: normalizedPhone,
                message: messageBody,
                messageType: 'form_links',
                patientId,
                patientName,
                formBundleId: bundle.id || null,
              });
            } else {
              await sendSMS({ to: normalizedPhone, message: messageBody });
            }
          } else {
            const result = await sendSMS({ to: normalizedPhone, message: messageBody });
            if (result.success) {
              await logComm({
                channel: 'sms',
                messageType: 'iv_booking_forms',
                message: messageBody,
                source: 'iv-booking-confirm',
                patientId,
                patientName,
                recipient: normalizedPhone,
                twilioMessageSid: result.messageSid,
                direction: 'outbound',
                provider: result.provider || null,
              });
            }
          }
        } catch (smsErr) {
          console.error('Consent SMS error (non-fatal):', smsErr);
        }
      }
    }

    // 5. Send staff notification email
    const addOnsText = addOnCount > 0 ? `\nAdd-Ons: ${addOns.join(', ')}` : '';
    const bloodWorkText = bloodWork ? '\nPre-Screening Blood Work: Required (G6PD, CMP, CBC)' : '';
    const formsText = needsForms.length > 0 ? `\nConsent Forms Needed: ${needsForms.map(f => FORM_DEFINITIONS[f]?.name).join(', ')} (send manually)` : '\nConsent Forms: Already completed';

    const staffHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#000;padding:24px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:20px;letter-spacing:0.1em;">RANGE MEDICAL</h1>
          <p style="margin:8px 0 0;color:#a3a3a3;font-size:13px;">New IV Booking</p>
        </div>
        <div style="padding:30px;background:#fff;">
          <div style="border-left:4px solid #000;padding-left:16px;margin-bottom:20px;">
            <p style="margin:0 0 4px;color:#737373;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Patient</p>
            <p style="margin:0;color:#171717;font-size:16px;font-weight:700;">${patientName}</p>
            <p style="margin:4px 0 0;color:#525252;font-size:14px;">${patientEmail}${patientPhone ? ` · ${patientPhone}` : ''}</p>
          </div>
          <div style="border-left:4px solid #0891b2;padding-left:16px;margin-bottom:20px;">
            <p style="margin:0 0 4px;color:#737373;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">IV Selected</p>
            <p style="margin:0;color:#171717;font-size:16px;font-weight:700;">${selectedIV.name}</p>
            ${addOnCount > 0 ? `<p style="margin:4px 0 0;color:#525252;font-size:14px;">Add-ons: ${addOns.join(', ')}</p>` : ''}
            ${bloodWork ? `<p style="margin:4px 0 0;color:#dc2626;font-size:14px;font-weight:600;">⚠ Pre-screening blood work required (G6PD, CMP, CBC)</p>` : ''}
          </div>
          <div style="border-left:4px solid #16a34a;padding-left:16px;margin-bottom:20px;">
            <p style="margin:0 0 4px;color:#737373;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Payment</p>
            <p style="margin:0;color:#171717;font-size:16px;font-weight:700;">$${(totalCents / 100).toFixed(2)} paid</p>
          </div>
          ${appointmentTime ? `
          <div style="border-left:4px solid #7c3aed;padding-left:16px;margin-bottom:20px;">
            <p style="margin:0 0 4px;color:#737373;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Appointment</p>
            <p style="margin:0;color:#171717;font-size:14px;">${new Date(appointmentTime).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' })}</p>
          </div>` : ''}
          <div style="background:#f5f5f5;padding:12px 16px;border-radius:8px;margin-top:16px;">
            <p style="margin:0;color:#525252;font-size:13px;">
              ${needsForms.length > 0 ? `Consent forms needed — send manually: ${needsForms.map(f => FORM_DEFINITIONS[f]?.name).join(', ')}` : 'All consent forms already completed.'}
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
      subject: `New IV Booking: ${patientName} — ${selectedIV.name}`,
      html: staffHtml,
    }).catch(err => console.error('Staff email error (non-fatal):', err));

    return res.status(200).json({
      success: true,
      formsSent: needsForms.length,
      formBundleUrl,
      totalCents,
    });
  } catch (error) {
    console.error('IV booking confirm error:', error);
    return res.status(500).json({ error: 'Failed to confirm booking', details: error.message });
  }
}
