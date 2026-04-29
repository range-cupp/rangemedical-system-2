// pages/api/send-forms-sms.js
// Sends selected form links via SMS — creates a form bundle with single link
// Range Medical

import { sendSMS, normalizePhone } from '../../lib/send-sms';
import { logComm } from '../../lib/comms-log';
import { createFormBundle, FORM_DEFINITIONS } from '../../lib/form-bundles';

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

    // Blooio two-step auto-send removed — always send form links directly

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
