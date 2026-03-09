// pages/api/send-guide-sms.js
// Sends guide links via SMS using Twilio
// Range Medical

import { sendSMS, normalizePhone } from '../../lib/send-sms';
import { logComm } from '../../lib/comms-log';
import { hasBlooioOptIn, queuePendingLinkMessage, isBlooioProvider } from '../../lib/blooio-optin';

const GUIDE_DEFINITIONS = {
  'hrt-guide': { name: 'HRT Guide', path: '/hrt-guide' },
  'tirzepatide-guide': { name: 'Tirzepatide Guide', path: '/tirzepatide-guide' },
  'retatrutide-guide': { name: 'Retatrutide Guide', path: '/retatrutide-guide' },
  'weight-loss-medication-guide-page': { name: 'WL Medication Guide', path: '/weight-loss-medication-guide-page' },
  'bpc-tb4-guide': { name: 'BPC/TB4 Guide', path: '/bpc-tb4-guide' },
  'glow-guide': { name: 'GLOW Guide', path: '/glow-guide' },
  'ghk-cu-guide': { name: 'GHK-Cu Guide', path: '/ghk-cu-guide' },
  '3x-blend-guide': { name: '3x Blend Guide', path: '/3x-blend-guide' },
  'nad-guide': { name: 'NAD+ Guide', path: '/nad-guide' },
  'methylene-blue-iv-guide': { name: 'Methylene Blue Guide', path: '/methylene-blue-iv-guide' },
  'methylene-blue-combo-iv-guide': { name: 'MB+VitC Combo Guide', path: '/methylene-blue-combo-iv-guide' },
  'glutathione-iv-guide': { name: 'Glutathione Guide', path: '/glutathione-iv-guide' },
  'vitamin-c-iv-guide': { name: 'Vitamin C Guide', path: '/vitamin-c-iv-guide' },
  'range-iv-guide': { name: 'Range IV Guide', path: '/range-iv-guide' },
  'cellular-reset-guide': { name: 'Cellular Reset Guide', path: '/cellular-reset-guide' },
  'hbot-guide': { name: 'HBOT Guide', path: '/hbot-guide' },
  'red-light-guide': { name: 'Red Light Guide', path: '/red-light-guide' },
  'combo-membership-guide': { name: 'Combo Membership', path: '/combo-membership-guide' },
  'hbot-membership-guide': { name: 'HBOT Membership', path: '/hbot-membership-guide' },
  'rlt-membership-guide': { name: 'RLT Membership', path: '/rlt-membership-guide' },
  'essential-panel-male-guide': { name: 'Essential Male Panel', path: '/essential-panel-male-guide' },
  'essential-panel-female-guide': { name: 'Essential Female Panel', path: '/essential-panel-female-guide' },
  'elite-panel-male-guide': { name: 'Elite Male Panel', path: '/elite-panel-male-guide' },
  'elite-panel-female-guide': { name: 'Elite Female Panel', path: '/elite-panel-female-guide' },
  'the-blu-guide': { name: 'The Blu', path: '/the-blu-guide' },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone, firstName, guideIds, guideId, patientId, patientName, ghlContactId } = req.body;

    // Support both single guideId (legacy) and multiple guideIds (new)
    const ids = guideIds || (guideId ? [guideId] : []);

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'Valid phone number required' });
    }

    if (ids.length === 0) {
      return res.status(400).json({ error: 'At least one guide must be selected' });
    }

    // Validate guide IDs
    const validGuideIds = ids.filter(id => GUIDE_DEFINITIONS[id]);
    if (validGuideIds.length === 0) {
      return res.status(400).json({ error: 'No valid guides selected' });
    }

    // Normalize phone
    const digits = phone.replace(/\D/g, '');
    const normalizedPhone = normalizePhone(digits.length === 10 ? digits : phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Build the base URL — guides are on the marketing site
    const baseUrl = 'https://www.range-medical.com';

    // Build SMS message
    const greeting = firstName ? `Hi ${firstName}! ` : '';

    let messageBody;
    if (validGuideIds.length === 1) {
      const guide = GUIDE_DEFINITIONS[validGuideIds[0]];
      messageBody = `${greeting}Range Medical here. Here's your ${guide.name}:\n\n${baseUrl}${guide.path}`;
    } else {
      const guideLinks = validGuideIds.map(id => {
        const guide = GUIDE_DEFINITIONS[id];
        return `${guide.name}: ${baseUrl}${guide.path}`;
      }).join('\n');

      messageBody = `${greeting}Range Medical here. Here are your treatment guides:\n\n${guideLinks}`;
    }

    const guideNames = validGuideIds.map(id => GUIDE_DEFINITIONS[id].name).join(', ');

    // Blooio two-step: first contact cannot include links
    if (isBlooioProvider()) {
      const optedIn = await hasBlooioOptIn(normalizedPhone);

      if (!optedIn) {
        // Step 1: Send link-free opt-in message
        const guideCount = validGuideIds.length;
        const optInMessage = guideCount === 1
          ? `${greeting}Range Medical here. We have your ${GUIDE_DEFINITIONS[validGuideIds[0]].name} ready for you. Reply YES to receive it.`
          : `${greeting}Range Medical here. We have ${guideCount} treatment guides ready for you. Reply YES to receive them.`;

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
          source: `send-guide-sms(${optInResult.provider || 'sms'})`,
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
          messageType: 'guide_links',
          patientId: patientId || null,
          patientName: patientName || firstName || null,
        });

        console.log(`Guide opt-in sent to ${normalizedPhone}: ${guideNames} — awaiting reply`);

        return res.status(200).json({
          success: true,
          twoStep: true,
          guidesSent: validGuideIds.length,
          messageSid: optInResult.messageSid,
          message: 'Opt-in message sent. Guides will be delivered automatically when the patient replies.',
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
      messageType: 'guide_links',
      message: messageBody,
      source: `send-guide-sms(${result.provider || 'sms'})`,
      patientId: patientId || null,
      patientName: patientName || firstName || null,
      ghlContactId: ghlContactId || null,
      recipient: normalizedPhone,
      twilioMessageSid: result.messageSid,
      direction: 'outbound',
      provider: result.provider || null,
    });

    console.log(`Guide SMS sent to ${normalizedPhone}: ${guideNames}`);

    return res.status(200).json({
      success: true,
      guidesSent: validGuideIds.length,
      messageSid: result.messageSid,
      message: 'Guides sent successfully',
    });

  } catch (error) {
    console.error('Send guide SMS error:', error);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
