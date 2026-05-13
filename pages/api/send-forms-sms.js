// pages/api/send-forms-sms.js
// Sends selected form links via SMS — creates a form bundle with single link
// Range Medical

import { sendSMS, normalizePhone } from '../../lib/send-sms';
import { logComm } from '../../lib/comms-log';
import { createFormBundle, FORM_DEFINITIONS } from '../../lib/form-bundles';
import { hasBlooioOptIn, isBlooioProvider, queuePendingLinkMessage } from '../../lib/blooio-optin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone, firstName, formIds, patientId, patientName, ghlContactId, patientEmail, metadata } = req.body;

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
      metadata: metadata || undefined,
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

    // Blooio two-step opt-in: if patient hasn't replied yet, send plain text prompt
    // and queue the link message for auto-delivery after they reply YES
    if (isBlooioProvider() && !(await hasBlooioOptIn(normalizedPhone))) {
      const displayName = firstName || 'there';
      const optinPrompt = `Hi ${displayName}! Range Medical here — we have ${validFormIds.length === 1 ? 'a form' : `${validFormIds.length} forms`} for you to complete before your visit. Reply YES and we'll send the link right over!`;

      const promptResult = await sendSMS({ to: normalizedPhone, message: optinPrompt });

      if (!promptResult.success) {
        console.error('Blooio opt-in prompt error:', promptResult.error);
        return res.status(500).json({ error: 'Failed to send SMS', details: promptResult.error });
      }

      await logComm({
        channel: 'sms',
        messageType: 'form_links_optin_prompt',
        message: optinPrompt,
        source: 'send-forms-sms(blooio-optin)',
        patientId: patientId || null,
        patientName: patientName || firstName || null,
        ghlContactId: ghlContactId || null,
        recipient: normalizedPhone,
        twilioMessageSid: promptResult.messageSid,
        direction: 'outbound',
        provider: promptResult.provider || 'blooio',
      });

      await queuePendingLinkMessage({
        phone: normalizedPhone,
        message: messageBody,
        messageType: 'form_links',
        patientId: patientId || null,
        patientName: patientName || firstName || null,
        formBundleId: bundle.id || null,
      });

      console.log(`Blooio opt-in prompt sent, link queued (bundle: ${bundle.token})`);

      return res.status(200).json({
        success: true,
        formsSent: validFormIds.length,
        messageSid: promptResult.messageSid,
        bundleToken: bundle.token,
        bundleUrl: bundle.url,
        message: 'Opt-in prompt sent — forms link will deliver after patient replies',
        pendingOptIn: true,
      });
    }

    // Patient is opted in (or not using Blooio) — send links directly
    const result = await sendSMS({ to: normalizedPhone, message: messageBody });

    if (!result.success) {
      console.error('SMS send error:', result.error);
      return res.status(500).json({ error: 'Failed to send SMS', details: result.error });
    }

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

    console.log(`Forms SMS sent: ${formNames} (bundle: ${bundle.token})`);

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
