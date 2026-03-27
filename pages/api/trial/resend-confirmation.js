// /api/trial/resend-confirmation
// One-off utility to resend trial confirmation SMS
// POST { trialId, phone, firstName }
// Range Medical

import { sendTrialConfirmation } from '../../../lib/trial-sms';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { isBlooioProvider, hasBlooioOptIn, queuePendingLinkMessage } from '../../../lib/blooio-optin';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://range-medical.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { trialId, phone, firstName } = req.body;
  if (!trialId || !phone || !firstName) {
    return res.status(400).json({ error: 'trialId, phone, and firstName required' });
  }

  try {
    const normalizedPhone = normalizePhone(phone);
    const useBlooio = isBlooioProvider();
    const optedIn = useBlooio ? await hasBlooioOptIn(normalizedPhone) : true;

    if (optedIn) {
      const result = await sendTrialConfirmation({ phone: normalizedPhone, firstName, trialId });
      return res.status(200).json({ sent: true, method: 'direct', result });
    } else {
      // Two-step: plain intro first, queue link
      const surveyLink = `${BASE_URL}/rlt-trial/survey?trial_id=${trialId}&type=pre`;

      const introMessage = `Hey ${firstName}! Your Red Light Trial is confirmed — 3 sessions over 7 days. Reply YES to get your energy survey link and book your first session.\n\n- Range Medical`;
      await sendSMS({ to: normalizedPhone, message: introMessage });
      await logComm({
        channel: 'sms',
        messageType: 'rlt_trial_confirmation_intro',
        message: introMessage,
        source: 'trial-resend',
        recipient: normalizedPhone,
        patientName: firstName,
        status: 'sent',
        provider: useBlooio ? 'blooio' : 'twilio',
      });

      const linkMessage = `Here's your 60-second energy survey:\n${surveyLink}\n\nComplete it before your first session — it takes less than a minute.\n\n- Range Medical`;
      await queuePendingLinkMessage({
        phone: normalizedPhone,
        message: linkMessage,
        messageType: 'rlt_trial_survey_link',
        patientId: null,
        patientName: `${firstName}`,
      });

      return res.status(200).json({ sent: true, method: 'two_step', queued: true });
    }
  } catch (err) {
    console.error('Resend confirmation error:', err);
    return res.status(500).json({ error: err.message });
  }
}
