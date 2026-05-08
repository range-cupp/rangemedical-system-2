// pages/api/cron/free-session-backfill-forms.js
// One-time backfill: sends forms (intake, HIPAA, HBOT consent) to existing
// booked free HBOT sessions that were scheduled before the auto-form-send
// was added to the booking flow. Idempotent — safe to re-run.
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { createFormBundle, FORM_DEFINITIONS } from '../../../lib/form-bundles';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { hasBlooioOptIn, queuePendingLinkMessage, isBlooioProvider } from '../../../lib/blooio-optin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function isAuthorized(req) {
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const authHeader = req.headers['authorization'];
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  return isVercelCron || (
    process.env.CRON_SECRET && (
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`
    )
  );
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data: trials, error } = await supabase
      .from('trial_passes')
      .select('id, patient_id, first_name, last_name, email, phone, trial_type')
      .eq('trial_type', 'hbot')
      .eq('status', 'scheduled')
      .gte('scheduled_start_time', new Date().toISOString())
      .not('phone', 'is', null);

    if (error) {
      console.error('backfill-forms query error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!trials || trials.length === 0) {
      return res.status(200).json({ success: true, considered: 0, sent: 0, message: 'No eligible sessions' });
    }

    let sent = 0;
    let skipped = 0;
    const results = [];

    for (const trial of trials) {
      const { data: priorComms } = await supabase
        .from('comms_log')
        .select('id')
        .eq('patient_id', trial.patient_id)
        .in('message_type', ['form_links', 'free_session_form_optin'])
        .in('source', ['free-session-book', 'free-session-backfill'])
        .limit(1);

      if (priorComms && priorComms.length > 0) {
        results.push({ trialId: trial.id, skipped: 'forms_already_sent' });
        skipped++;
        continue;
      }

      const normalizedTo = normalizePhone(trial.phone);
      if (!normalizedTo) {
        results.push({ trialId: trial.id, skipped: 'no_phone' });
        skipped++;
        continue;
      }

      const requiredFormIds = ['intake', 'hipaa', 'hbot'];
      const completedFormIds = new Set();
      if (trial.patient_id) {
        const [{ data: consents }, { data: intakes }] = await Promise.all([
          supabase.from('consents').select('consent_type').eq('patient_id', trial.patient_id).in('consent_type', ['hipaa', 'hbot']),
          supabase.from('intakes').select('id').eq('patient_id', trial.patient_id).limit(1),
        ]);
        if (consents) consents.forEach(c => completedFormIds.add(c.consent_type));
        if (intakes && intakes.length > 0) completedFormIds.add('intake');
      }
      const missingFormIds = requiredFormIds.filter(id => !completedFormIds.has(id));

      if (missingFormIds.length === 0) {
        results.push({ trialId: trial.id, skipped: 'all_forms_complete' });
        skipped++;
        continue;
      }

      try {
        const customerName = `${trial.first_name || ''} ${trial.last_name || ''}`.trim();
        const firstName = trial.first_name || 'there';
        const formCount = missingFormIds.length;

        const bundle = await createFormBundle({
          formIds: missingFormIds,
          patientId: trial.patient_id || null,
          patientName: customerName,
          patientEmail: trial.email || null,
          patientPhone: normalizedTo,
          metadata: { source: 'free_session_backfill', trialPassId: trial.id },
        });

        const linkMessage = formCount === 1
          ? `Hi ${firstName}! Range Medical here. Please complete your ${FORM_DEFINITIONS[missingFormIds[0]]?.name || 'form'} before your visit:\n\n${bundle.url}`
          : `Hi ${firstName}! Range Medical here. Please complete your ${formCount} forms before your visit:\n\n${bundle.url}`;

        const useBlooioTwoStep = isBlooioProvider() && !(await hasBlooioOptIn(normalizedTo));

        if (useBlooioTwoStep) {
          const optInMsg = formCount === 1
            ? `Hi ${firstName}! Range Medical here. We have your ${FORM_DEFINITIONS[missingFormIds[0]]?.name || 'form'} ready for your free Hyperbaric Oxygen session. Reply YES to receive it.`
            : `Hi ${firstName}! Range Medical here. We have ${formCount} forms ready for your free Hyperbaric Oxygen session. Reply YES to receive them.`;

          const optInResult = await sendSMS({ to: normalizedTo, message: optInMsg });
          await queuePendingLinkMessage({ phone: normalizedTo, message: linkMessage, messageType: 'form_links', patientId: trial.patient_id || null, patientName: customerName });
          await logComm({ channel: 'sms', messageType: 'free_session_form_optin', message: optInMsg, source: 'free-session-backfill', patientId: trial.patient_id, patientName: customerName, recipient: normalizedTo, status: optInResult.success ? 'sent' : 'error', errorMessage: optInResult.error || null, twilioMessageSid: optInResult.messageSid || null, provider: optInResult.provider || null, direction: 'outbound' });
          if (optInResult.success) sent++;
          results.push({ trialId: trial.id, sent: optInResult.success, twoStep: true });
        } else {
          const smsResult = await sendSMS({ to: normalizedTo, message: linkMessage });
          await logComm({ channel: 'sms', messageType: 'form_links', message: linkMessage, source: 'free-session-backfill', patientId: trial.patient_id, patientName: customerName, recipient: normalizedTo, status: smsResult.success ? 'sent' : 'error', errorMessage: smsResult.error || null, twilioMessageSid: smsResult.messageSid || null, provider: smsResult.provider || null, direction: 'outbound' });
          if (smsResult.success) sent++;
          results.push({ trialId: trial.id, sent: smsResult.success, twoStep: false });
        }
      } catch (sendErr) {
        console.error(`backfill-forms send error for trial ${trial.id}:`, sendErr);
        results.push({ trialId: trial.id, error: sendErr.message });
      }
    }

    return res.status(200).json({ success: true, considered: trials.length, sent, skipped, results });
  } catch (err) {
    console.error('free-session-backfill-forms error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
