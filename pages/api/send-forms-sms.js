// pages/api/send-forms-sms.js
// Sends selected form links via SMS using Twilio
// Range Medical

import { sendSMS, normalizePhone } from '../../lib/send-sms';
import { logComm } from '../../lib/comms-log';

const FORM_DEFINITIONS = {
  'intake': { name: 'Medical Intake', path: '/intake' },
  'hipaa': { name: 'HIPAA Notice', path: '/consent/hipaa' },
  'blood-draw': { name: 'Blood Draw Consent', path: '/consent/blood-draw' },
  'hrt': { name: 'HRT Consent', path: '/consent/hrt' },
  'peptide': { name: 'Peptide Consent', path: '/consent/peptide' },
  'iv': { name: 'IV/Injection Consent', path: '/consent/iv' },
  'hbot': { name: 'HBOT Consent', path: '/consent/hbot' },
  'weight-loss': { name: 'Weight Loss Consent', path: '/consent/weight-loss' },
  'red-light': { name: 'Red Light Therapy Consent', path: '/consent/red-light' },
  'prp': { name: 'PRP Consent', path: '/consent/prp' },
  'exosome-iv': { name: 'Exosome IV Consent', path: '/consent/exosome-iv' },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone, firstName, formIds, patientId, patientName, ghlContactId } = req.body;

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

    // Build the base URL
    const baseUrl = 'https://app.range-medical.com';

    // Build SMS message
    const greeting = firstName ? `Hi ${firstName}! ` : '';

    let messageBody;
    if (validFormIds.length === 1) {
      const form = FORM_DEFINITIONS[validFormIds[0]];
      messageBody = `${greeting}Range Medical here. Please complete your ${form.name} before your visit:\n\n${baseUrl}${form.path}\n\nQuestions? (949) 997-3988`;
    } else {
      const formLinks = validFormIds.map(id => {
        const form = FORM_DEFINITIONS[id];
        return `${form.name}: ${baseUrl}${form.path}`;
      }).join('\n');

      messageBody = `${greeting}Range Medical here. Please complete these forms before your visit:\n\n${formLinks}\n\nQuestions? (949) 997-3988`;
    }

    // Send via SMS provider (Blooio/Twilio based on SMS_PROVIDER env)
    const result = await sendSMS({ to: normalizedPhone, message: messageBody });

    if (!result.success) {
      console.error('SMS send error:', result.error);
      return res.status(500).json({ error: 'Failed to send SMS', details: result.error });
    }

    // Log to comms_log
    const formNames = validFormIds.map(id => FORM_DEFINITIONS[id].name).join(', ');
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

    console.log(`Forms SMS sent to ${normalizedPhone}: ${formNames}`);

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
