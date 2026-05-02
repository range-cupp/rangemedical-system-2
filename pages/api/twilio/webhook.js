// /pages/api/twilio/webhook.js
// Receive inbound SMS from Twilio
// Stores messages in comms_log for conversation view
// Auto-replies:
//   1. HRT IV scheduling prompts — patient replies YES → sends booking link
//   2. Lab prep reminders — patient replies READY → sends lab prep instructions link
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';
import { sendSMS } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { pushAllEmployees } from '../../../lib/web-push';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Positive reply keywords for scheduling prompt
const POSITIVE_REPLIES = ['yes', 'y', 'yeah', 'sure', 'yep', 'yea', 'ok', 'okay'];

// Lab prep reply keywords (includes POSITIVE_REPLIES + lab-specific)
const LAB_PREP_REPLIES = ['ready', 'got it', ...POSITIVE_REPLIES];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    // Return TwiML empty response for GET (Twilio health checks)
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send('<Response></Response>');
  }

  try {
    const {
      From,           // sender phone number in E.164
      To,             // your Twilio number
      Body,           // message text
      MessageSid,     // Twilio message ID
      NumMedia,       // number of media attachments
    } = req.body;

    console.log(`Inbound SMS from ${From}: ${Body}`);

    // Try to match the sender to a patient by phone.
    // Phones may be stored in many formats: +19495395023, (949) 539-5023, 9495395023, etc.
    // Pass 1: fast DB query — catches E.164 (+1...) and plain-digit formats
    // Pass 2: JS-side normalization fallback — strips non-digits from stored values
    //         and compares last 10 digits, catching (949) 539-5023 style storage
    let patient = null;
    if (From) {
      const normalizedFrom = From.replace(/\D/g, '').slice(-10);

      // Pass 1: DB-level match (E.164 and digit-only formats)
      const { data: phoneMatch } = await supabase
        .from('patients')
        .select('id, name, first_name, last_name, phone, ghl_contact_id')
        .or(`phone.ilike.%${normalizedFrom},phone.eq.+1${normalizedFrom},phone.eq.${normalizedFrom}`)
        .limit(1)
        .maybeSingle();

      patient = phoneMatch || null;

      // Pass 2: JS normalization fallback — handles (949) 539-5023 stored format
      if (!patient && normalizedFrom.length === 10) {
        const areaCode = normalizedFrom.substring(0, 3);
        const { data: candidates } = await supabase
          .from('patients')
          .select('id, name, first_name, last_name, phone, ghl_contact_id')
          .ilike('phone', `%${areaCode}%`)
          .limit(500);

        if (candidates?.length) {
          const found = candidates.find(p => {
            const digits = (p.phone || '').replace(/\D/g, '').slice(-10);
            return digits === normalizedFrom;
          });
          patient = found || null;
        }
      }

      if (patient) {
        console.log(`Inbound SMS matched to patient: ${patient.first_name} ${patient.last_name} (${patient.id})`);
      } else {
        console.warn(`Inbound SMS from ${From} — no matching patient found`);
      }
    }

    // Store in comms_log
    const { error: insertError } = await supabase
      .from('comms_log')
      .insert({
        patient_id: patient?.id || null,
        patient_name: patient
          ? (patient.first_name && patient.last_name
              ? `${patient.first_name} ${patient.last_name}`
              : patient.name)
          : From,
        ghl_contact_id: patient?.ghl_contact_id || null,
        channel: 'sms',
        message_type: 'inbound_sms',
        message: Body || '',
        source: 'twilio/webhook',
        status: 'received',
        recipient: From, // store the sender's phone
        direction: 'inbound',
        provider: 'twilio',
        needs_response: true,
      });

    if (insertError) {
      console.error('Error storing inbound SMS:', insertError);
    }

    // Web push to all employees with notifications enabled — best-effort, non-blocking.
    try {
      const previewBody = (Body || '').slice(0, 140);
      const titleName = patient
        ? (patient.first_name && patient.last_name ? `${patient.first_name} ${patient.last_name}` : (patient.name || From))
        : From;
      pushAllEmployees({
        title: titleName,
        body: previewBody || 'New SMS',
        data: {
          kind: 'patient_sms',
          patient_id: patient?.id || null,
          patient_name: titleName,
          recipient: From,
        },
      }).catch((err) => console.warn('[twilio webhook] push failed:', err?.message || err));
    } catch (pushErr) {
      console.warn('[twilio webhook] push error (non-fatal):', pushErr?.message || pushErr);
    }

    // ================================================================
    // AUTO-REPLY: HRT IV Scheduling Prompt
    // If patient replies YES to a recent scheduling prompt, send booking link
    // ================================================================
    if (patient?.id && Body) {
      const normalizedBody = (Body || '').trim().toLowerCase();

      if (POSITIVE_REPLIES.includes(normalizedBody)) {
        // Check for a recent (last 30 days) unanswered hrt_iv_schedule_prompt
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: pendingPrompt } = await supabase
          .from('comms_log')
          .select('id, created_at')
          .eq('patient_id', patient.id)
          .eq('message_type', 'hrt_iv_schedule_prompt')
          .eq('direction', 'outbound')
          .neq('status', 'replied')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingPrompt) {
          console.log(`HRT IV schedule YES reply from ${patient.name} — sending booking link`);

          // Look up patient email for pre-filling the booking form
          const { data: patientDetails } = await supabase
            .from('patients')
            .select('email, first_name, name')
            .eq('id', patient.id)
            .single();

          const linkParams = new URLSearchParams();
          const displayName = patientDetails?.first_name || patientDetails?.name || patient.name || '';
          if (displayName) linkParams.set('name', displayName);
          if (patientDetails?.email) linkParams.set('email', patientDetails.email);
          const queryStr = linkParams.toString();
          const scheduleLink = `https://app.range-medical.com/schedule-iv${queryStr ? '?' + queryStr : ''}`;
          const linkMessage = `Here's your link to schedule your Range IV: ${scheduleLink} — Range Medical`;

          const linkResult = await sendSMS({ to: From, message: linkMessage }).catch(err => {
            console.error('HRT IV schedule link SMS error:', err);
            return { success: false, error: err.message };
          });

          // Log the scheduling link SMS
          await logComm({
            channel: 'sms',
            messageType: 'hrt_iv_schedule_link',
            message: linkMessage,
            source: 'twilio/webhook',
            patientId: patient.id,
            patientName: patient.name,
            recipient: From,
            status: linkResult.success ? 'sent' : 'error',
            errorMessage: linkResult.error || null,
            twilioMessageSid: linkResult.messageSid || null,
            provider: linkResult.provider || null,
            direction: 'outbound',
          }).catch(err => { console.error('comms_log error:', err.message); });

          // Mark the original prompt as replied (prevents duplicate link sends)
          await supabase
            .from('comms_log')
            .update({ status: 'replied' })
            .eq('id', pendingPrompt.id)
            .catch(err => { console.error('comms_log error:', err.message); });

          if (linkResult.success) {
            console.log(`HRT IV scheduling link sent to ${patient.name} (${From})`);
          }
        }
      }
    }

    // ================================================================
    // AUTO-REPLY: Lab Prep Reminder
    // If patient replies READY/YES to a recent lab prep reminder, send instructions link
    // ================================================================
    if (patient?.id && Body) {
      const normalizedBody = (Body || '').trim().toLowerCase();

      if (LAB_PREP_REPLIES.includes(normalizedBody)) {
        // Check for a recent (last 3 days) unanswered lab_prep_reminder
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const { data: pendingReminder } = await supabase
          .from('comms_log')
          .select('id, created_at')
          .eq('patient_id', patient.id)
          .eq('message_type', 'lab_prep_reminder')
          .eq('direction', 'outbound')
          .neq('status', 'replied')
          .gte('created_at', threeDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingReminder) {
          const firstName = patient.first_name || (patient.name || '').split(' ')[0] || 'there';
          console.log(`Lab prep READY reply from ${patient.name} — sending instructions link`);

          // Generate a lab prep token for acknowledgment tracking
          let labPrepUrl = 'https://www.range-medical.com/lab-prep';
          try {
            const { createLabPrepToken, buildLabPrepUrl } = await import('../../../lib/lab-prep-token');
            const token = await createLabPrepToken({
              patientId: patient.id,
              patientName: patient.name,
              patientPhone: From,
            });
            labPrepUrl = buildLabPrepUrl(token);
          } catch (err) {
            console.error('Lab prep token creation failed, using plain URL:', err);
          }

          const prepMessage = `Here are your lab prep instructions \u2014 please review and confirm:\n\n${labPrepUrl}\n\nQuestions? Call (949) 997-3988. See you tomorrow! \u2014 Range Medical`;

          const prepResult = await sendSMS({ to: From, message: prepMessage }).catch(err => {
            console.error('Lab prep instructions SMS error:', err);
            return { success: false, error: err.message };
          });

          // Log the instructions link SMS
          await logComm({
            channel: 'sms',
            messageType: 'lab_prep_instructions_sent',
            message: prepMessage,
            source: 'twilio/webhook',
            patientId: patient.id,
            patientName: patient.name,
            recipient: From,
            status: prepResult.success ? 'sent' : 'error',
            errorMessage: prepResult.error || null,
            twilioMessageSid: prepResult.messageSid || null,
            provider: prepResult.provider || null,
            direction: 'outbound',
          }).catch(err => { console.error('comms_log error:', err.message); });

          // Mark the original reminder as replied (prevents duplicate sends)
          await supabase
            .from('comms_log')
            .update({ status: 'replied' })
            .eq('id', pendingReminder.id)
            .catch(err => { console.error('comms_log error:', err.message); });

          if (prepResult.success) {
            console.log(`Lab prep instructions sent to ${patient.name} (${From})`);
          }
        }
      }
    }

    // ================================================================
    // AUTO-REPLY: Giveaway Scholarship Offer
    // If sender replies YES to a recent scholarship SMS, flip their status
    // to 'scholarship_interested', send details, and create a staff task.
    // Matched by phone (last 10 digits) — patient record not required.
    // ================================================================
    if (From && Body) {
      const normalizedBody = (Body || '').trim().toLowerCase();

      if (POSITIVE_REPLIES.includes(normalizedBody)) {
        const lastTen = From.replace(/\D/g, '').slice(-10);

        if (lastTen.length === 10) {
          const nowIso = new Date().toISOString();

          // Find a non-expired scholarship offer for this phone
          const { data: candidates } = await supabase
            .from('giveaway_entries')
            .select('*')
            .eq('status', 'scholarship_offered')
            .gt('scholarship_expires_at', nowIso)
            .limit(50);

          const match = (candidates || []).find((e) => {
            const digits = (e.phone || '').replace(/\D/g, '').slice(-10);
            return digits === lastTen;
          });

          if (match) {
            const firstName = (match.name || '').trim().split(/\s+/)[0] || 'there';
            console.log(`Giveaway scholarship YES reply from ${match.name} (${From})`);

            await supabase
              .from('giveaway_entries')
              .update({ status: 'scholarship_interested' })
              .eq('id', match.id)
              .catch((err) => { console.error('giveaway_entries update error:', err.message); });

            const replyMessage = `Awesome ${firstName}! Your $1,000 scholarship on the 6-Week Cellular Energy Reset is locked in — $2,999 → $1,999. Someone from Range Medical will reach out shortly to get you scheduled. Do weekdays or Saturdays work better to start?\n\n- Range Medical`;

            const replyResult = await sendSMS({ to: From, message: replyMessage }).catch((err) => {
              console.error('Giveaway scholarship reply SMS error:', err);
              return { success: false, error: err.message };
            });

            await logComm({
              channel: 'sms',
              messageType: 'giveaway_scholarship_reply',
              message: replyMessage,
              source: 'twilio/webhook',
              patientId: match.patient_id || null,
              patientName: firstName,
              recipient: From,
              status: replyResult.success ? 'sent' : 'error',
              errorMessage: replyResult.error || null,
              twilioMessageSid: replyResult.messageSid || null,
              provider: replyResult.provider || null,
              direction: 'outbound',
            }).catch((err) => { console.error('comms_log error:', err.message); });

            // Create a follow-up task for Damon
            try {
              const { data: damon } = await supabase
                .from('employees')
                .select('id')
                .eq('email', 'damon@range-medical.com')
                .maybeSingle();

              if (damon) {
                await supabase.from('tasks').insert({
                  title: `Giveaway scholarship: ${match.name} replied YES`,
                  description: `${match.name} said YES to the $1,000 scholarship on the 6-Week Cellular Energy Reset.\n\nPhone: ${match.phone}\nEmail: ${match.email}\nTier: ${match.lead_tier} (score ${match.lead_score})\nBad day: ${match.bad_day_description}\nWhat would change: ${match.desired_change}\n\nScholarship expires: ${match.scholarship_expires_at}. Call to book the kickoff.`,
                  assigned_to: damon.id,
                  assigned_by: damon.id,
                  patient_id: match.patient_id || null,
                  patient_name: match.name,
                  priority: 'high',
                  status: 'pending',
                });
              }
            } catch (taskErr) {
              console.error('Giveaway scholarship task creation error:', taskErr);
            }
          }
        }
      }
    }

    // Return TwiML (empty = no auto-reply via TwiML, replies sent via API above)
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send('<Response></Response>');

  } catch (error) {
    console.error('Twilio webhook error:', error);
    // Always return 200 to Twilio to prevent retries
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send('<Response></Response>');
  }
}

// Twilio sends form-encoded POST data
export const config = {
  api: {
    bodyParser: true,
  },
};
