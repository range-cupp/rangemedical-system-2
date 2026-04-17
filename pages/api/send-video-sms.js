// /pages/api/send-video-sms.js
// Send injection demo video links to patients via SMS
// Range Medical

import { sendSMS, normalizePhone } from '../../lib/send-sms';
import { logComm } from '../../lib/comms-log';
import { hasBlooioOptIn, queuePendingLinkMessage, isBlooioProvider } from '../../lib/blooio-optin';
import { INJECTION_VIDEOS } from '../../lib/injection-videos';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone, firstName, videoSlugs, videoSlug, patientId, patientName, ghlContactId } = req.body;

    // Support single slug or array
    const slugs = videoSlugs || (videoSlug ? [videoSlug] : []);

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'Valid phone number required' });
    }

    if (slugs.length === 0) {
      return res.status(400).json({ error: 'At least one video must be selected' });
    }

    const validSlugs = slugs.filter(s => INJECTION_VIDEOS[s]);
    if (validSlugs.length === 0) {
      return res.status(400).json({ error: 'No valid videos selected' });
    }

    const digits = phone.replace(/\D/g, '');
    const normalizedPhone = normalizePhone(digits.length === 10 ? digits : phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const baseUrl = 'https://www.range-medical.com';
    const greeting = firstName ? `Hi ${firstName}! ` : '';

    let messageBody;
    if (validSlugs.length === 1) {
      const v = INJECTION_VIDEOS[validSlugs[0]];
      messageBody = `${greeting}Range Medical here. Here's your ${v.name} injection video:\n\n${baseUrl}/v/${v.slug}`;
    } else {
      const links = validSlugs.map(s => {
        const v = INJECTION_VIDEOS[s];
        return `${v.name}: ${baseUrl}/v/${v.slug}`;
      }).join('\n');
      messageBody = `${greeting}Range Medical here. Here are your injection videos:\n\n${links}`;
    }

    const videoNames = validSlugs.map(s => INJECTION_VIDEOS[s].name).join(', ');

    // Blooio two-step: first contact cannot include links
    if (isBlooioProvider()) {
      const optedIn = await hasBlooioOptIn(normalizedPhone);

      if (!optedIn) {
        const videoCount = validSlugs.length;
        const optInMessage = videoCount === 1
          ? `${greeting}Range Medical here. We have your ${INJECTION_VIDEOS[validSlugs[0]].name} injection video ready for you. Reply YES to receive it.`
          : `${greeting}Range Medical here. We have ${videoCount} injection videos ready for you. Reply YES to receive them.`;

        const optInResult = await sendSMS({ to: normalizedPhone, message: optInMessage });

        if (!optInResult.success) {
          console.error('Opt-in SMS send error:', optInResult.error);
          return res.status(500).json({ error: 'Failed to send opt-in SMS', details: optInResult.error });
        }

        await logComm({
          channel: 'sms',
          messageType: 'blooio_optin_request',
          message: optInMessage,
          source: `send-video-sms(${optInResult.provider || 'sms'})`,
          patientId: patientId || null,
          patientName: patientName || firstName || null,
          ghlContactId: ghlContactId || null,
          recipient: normalizedPhone,
          twilioMessageSid: optInResult.messageSid,
          direction: 'outbound',
          provider: optInResult.provider || null,
        });

        await queuePendingLinkMessage({
          phone: normalizedPhone,
          message: messageBody,
          messageType: 'injection_video_links',
          patientId: patientId || null,
          patientName: patientName || firstName || null,
        });

        console.log(`Video opt-in sent to ${normalizedPhone}: ${videoNames} — awaiting reply`);

        return res.status(200).json({
          success: true,
          twoStep: true,
          videosSent: validSlugs.length,
          messageSid: optInResult.messageSid,
          message: 'Opt-in message sent. Videos will be delivered automatically when the patient replies.',
        });
      }
    }

    // Direct send
    const result = await sendSMS({ to: normalizedPhone, message: messageBody });

    if (!result.success) {
      console.error('SMS send error:', result.error);
      return res.status(500).json({ error: 'Failed to send SMS', details: result.error });
    }

    await logComm({
      channel: 'sms',
      messageType: 'injection_video_links',
      message: messageBody,
      source: `send-video-sms(${result.provider || 'sms'})`,
      patientId: patientId || null,
      patientName: patientName || firstName || null,
      ghlContactId: ghlContactId || null,
      recipient: normalizedPhone,
      twilioMessageSid: result.messageSid,
      direction: 'outbound',
      provider: result.provider || null,
    });

    console.log(`Video SMS sent to ${normalizedPhone}: ${videoNames}`);

    return res.status(200).json({
      success: true,
      videosSent: validSlugs.length,
      messageSid: result.messageSid,
      message: 'Videos sent successfully',
    });

  } catch (error) {
    console.error('Send video SMS error:', error);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
