// pages/api/send-forms-sms.js
// Sends selected form links via SMS — creates a form bundle with single link
// Range Medical

import { sendSMS, normalizePhone } from '../../lib/send-sms';
import { logComm } from '../../lib/comms-log';
import { createFormBundle, FORM_DEFINITIONS } from '../../lib/form-bundles';
import { hasBlooioOptIn, queuePendingLinkMessage, isBlooioProvider } from '../../lib/blooio-optin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone, firstName, formIds, patientId, patientName, ghlContactId, patientEmail } = req.body;

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'Valid phone number required' });
    }

    if (!formIds || formIds.length === 0) {
      return res.status(400).json({ error: 'At least one form must be selected' });
    }

    // Validate and sort form IDs — intake first, hipaa second, then rest
    const PRIORITY_ORDER = ['intake', 'hipaa'];
    const validFormIds = formIds
      .filter(id => FORM_DEFINITIONS[id])
      .sort((a, b) => {
        const aIdx = PRIORITY_ORDER.indexOf(a);
        const bIdx = PRIORITY_ORDER.indexOf(b);
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return 0;
      });
    if (validFormIds.length === 0) {
      return res.status(400).json({ error: 'No valid forms selected' });
    }

    // Normalize phone
    const digits = phone.replace(/\D/g, '');
    const normalizedPhone = normalizePhone(digits.length === 10 ? digits : phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Create form bundle with single link
    const bundle = await createFormBundle({
      formIds: validFormIds,
      patientId: patientId || null,
      patientName: patientName || firstName || null,
      patientEmail: patientEmail || null,
      patientPhone: normalizedPhone,
      ghlContactId: ghlContactId || null,
    });

    // Build SMS message with single bundle link
    const greeting = firstName ? `Hi ${firstName}! ` : '';
    const formNames = validFormIds.map(id => FORM_DEFINITIONS[id].name).join(', ');

    let messageBody;
    if (validFormIds.length === 1) {
      const form = FORM_DEFINITIONS[validFormIds[0]];
      messageBody = `${greeting}Range Medical here. Please complete your ${form.name} before your visit:\n\n${bundle.url}`;
    } else {
      messageBody = `${greeting}Range Medical here. Please complete your ${validFormIds.length} forms before your visit:\n\n${bundle.url}`;
    }

    // Blooio two-step: first contact cannot include links
    if (isBlooioProvider()) {
      const optedIn = await hasBlooioOptIn(normalizedPhone);

      if (!optedIn) {
        // Step 1: Send link-free opt-in message
        const formCount = validFormIds.length;
        const optInMessage = formCount === 1
          ? `${greeting}Range Medical here. We have your ${FORM_DEFINITIONS[validFormIds[0]].name} ready for you. Reply YES to receive it.`
          : `${greeting}Range Medical here. We have ${formCount} forms ready for you. Reply YES to receive them.`;

        const optInResult = await sendSMS({ to: normalizedPhone, message: optInMessage });

        if (!optInResult.success) {
          console.error('Opt-in SMS send error:', optInResult.error);
          return res.status(500).json({ error: 'Failed to send opt-in SMS', details: optInResult.error });
        }

        // Log opt-in message to comms_log
        await logComm({
          channel: 'sms',
          messageType: 'blooio_optin_request',
          message: optInMessage,
          source: `send-forms-sms(${optInResult.provider || 'sms'})`,
          patientId: patientId || null,
          patientName: patientName || firstName || null,
          ghlContactId: ghlContactId || null,
          recipient: normalizedPhone,
          twilioMessageSid: optInResult.messageSid,
          direction: 'outbound',
          provider: optInResult.provider || null,
        });

        // Queue the link message for auto-send when patient replies
        await queuePendingLinkMessage({
          phone: normalizedPhone,
          message: messageBody,
          messageType: 'form_links',
          patientId: patientId || null,
          patientName: patientName || firstName || null,
          formBundleId: bundle.id || null,
        });

        console.log(`Forms opt-in sent to ${normalizedPhone}: ${formNames} (bundle: ${bundle.token}) — awaiting reply`);

        // GHL tagging still happens
        if (ghlContactId || phone) {
          tagGHLContact(phone, firstName, validFormIds, ghlContactId).catch(err => {
            console.error('GHL tagging error (non-critical):', err.message);
          });
        }

        return res.status(200).json({
          success: true,
          twoStep: true,
          formsSent: validFormIds.length,
          messageSid: optInResult.messageSid,
          bundleToken: bundle.token,
          bundleUrl: bundle.url,
          message: 'Opt-in message sent. Forms will be delivered automatically when the patient replies.',
        });
      }
    }

    // Direct send — either not Blooio, or patient already opted in
    const result = await sendSMS({ to: normalizedPhone, message: messageBody });

    if (!result.success) {
      console.error('SMS send error:', result.error);
      return res.status(500).json({ error: 'Failed to send SMS', details: result.error });
    }

    // Log to comms_log
    await logComm({
      channel: 'sms',
      messageType: 'form_links',
      message: messageBody,
      source: `send-forms-sms(${result.provider || 'sms'})`,
      patientId: patientId || null,
      patientName: patientName || firstName || null,
      ghlContactId: ghlContactId || null,
      recipient: normalizedPhone,
      twilioMessageSid: result.messageSid,
      direction: 'outbound',
      provider: result.provider || null,
    });

    console.log(`Forms SMS sent to ${normalizedPhone}: ${formNames} (bundle: ${bundle.token})`);

    // Also tag GHL contact in background (non-blocking)
    if (ghlContactId || phone) {
      tagGHLContact(phone, firstName, validFormIds, ghlContactId).catch(err => {
        console.error('GHL tagging error (non-critical):', err.message);
      });
    }

    return res.status(200).json({
      success: true,
      formsSent: validFormIds.length,
      messageSid: result.messageSid,
      bundleToken: bundle.token,
      bundleUrl: bundle.url,
      message: 'Forms sent successfully',
    });

  } catch (error) {
    console.error('Send forms SMS error:', error);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}

// Background GHL tagging — non-blocking, best-effort
async function tagGHLContact(phone, firstName, formIds, existingContactId) {
  const GHL_API_KEY = process.env.GHL_API_KEY;
  const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
  if (!GHL_API_KEY || !GHL_LOCATION_ID) return;

  const headers = {
    'Authorization': `Bearer ${GHL_API_KEY}`,
    'Version': '2021-07-28',
    'Content-Type': 'application/json',
  };

  let contactId = existingContactId;

  // Find contact if no ID provided
  if (!contactId) {
    const digits = phone.replace(/\D/g, '');
    const formattedPhone = '+1' + (digits.length === 10 ? digits : digits.slice(-10));
    const searchParams = new URLSearchParams({ locationId: GHL_LOCATION_ID, query: formattedPhone });
    const searchRes = await fetch(`https://services.leadconnectorhq.com/contacts/?${searchParams}`, {
      method: 'GET', headers
    });
    if (searchRes.ok) {
      const data = await searchRes.json();
      contactId = data.contacts?.[0]?.id;
    }
  }

  if (!contactId) return;

  // Tag contact
  const formTags = formIds.map(id => `${id}-pending`);
  await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ tags: ['forms-sent', ...formTags] }),
  });
}
