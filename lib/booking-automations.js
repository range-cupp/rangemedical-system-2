// /lib/booking-automations.js
// Shared booking automation functions (T-02, T-03, T-05)
// Called from both Cal.com webhook and internal appointment creation
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { slugRequiresBloodWork, BLOOD_WORK_VALIDITY_DAYS, getPrepInstructions, TELEMEDICINE_LINK_APPEND, REQUIRED_FORMS } from './appointment-services';
import { sendBlooioMessage } from './blooio';
import { createFormBundle, FORM_DEFINITIONS } from './form-bundles';
import { sendSMS as sendSMSRouter, normalizePhone as normalizePhoneUtil } from './send-sms';
import { logComm } from './comms-log';
import { hasBlooioOptIn, queuePendingLinkMessage, isBlooioProvider } from './blooio-optin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper: update appointment by ID or cal_com_booking_id
async function updateAppointment(updates, { appointmentId, calcomBookingId }) {
  if (appointmentId) {
    return supabase.from('appointments').update(updates).eq('id', appointmentId);
  }
  if (calcomBookingId) {
    return supabase.from('appointments').update(updates).eq('cal_com_booking_id', calcomBookingId);
  }
  console.error('No appointmentId or calcomBookingId for update');
}

// =====================================================
// T-05: BLOOD WORK PREREQUISITE CHECK
// =====================================================

export async function checkBloodWorkPrereq(patientId, slug, { patientName, serviceName, startTime, appointmentId, calcomBookingId }) {
  if (!slugRequiresBloodWork(slug)) return { met: true, skipped: true };

  // If no patient matched, we can't verify — flag for Tara
  if (!patientId) {
    console.log(`Blood work prereq: no patient_id for ${patientName}, flagging as unmet`);
    await alertTaraPrereqMissing({ patientName, serviceName, startTime, reason: 'Patient not matched in system' });
    return { met: false };
  }

  // Calculate the cutoff date (90 days ago)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - BLOOD_WORK_VALIDITY_DAYS);
  const cutoffISO = cutoff.toISOString().split('T')[0];

  const { data: recentLab } = await supabase
    .from('labs')
    .select('id, test_date, status')
    .eq('patient_id', patientId)
    .gte('test_date', cutoffISO)
    .in('status', ['results_in', 'reviewed', 'provider_reviewed', 'consult_complete', 'collected', 'uploaded', 'under_review', 'ready_to_schedule', 'in_treatment'])
    .order('test_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentLab) {
    console.log(`✓ Blood work prereq met for ${patientName}: lab ${recentLab.id} from ${recentLab.test_date}`);
    await updateAppointment({ prereqs_met: true }, { appointmentId, calcomBookingId });
    return { met: true };
  }

  // No valid blood work on file — alert Tara
  console.log(`✗ Blood work prereq NOT met for ${patientName} — no labs within ${BLOOD_WORK_VALIDITY_DAYS} days`);
  await alertTaraPrereqMissing({ patientName, serviceName, startTime, reason: `No blood work on file within ${BLOOD_WORK_VALIDITY_DAYS} days` });
  return { met: false };
}

async function alertTaraPrereqMissing({ patientName, serviceName, startTime, reason }) {
  const taraPhone = process.env.TARA_PHONE;
  if (!taraPhone) {
    console.error('TARA_PHONE env var not set — cannot send prereq alert');
    return;
  }

  const apptDate = startTime
    ? new Date(startTime).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles'
      })
    : 'Unknown date';

  const message = `⚠️ PREREQ ALERT — Blood work missing\n\nPatient: ${patientName}\nService: ${serviceName}\nAppointment: ${apptDate}\nReason: ${reason}\n\nPlease verify blood work is on file before this appointment. Do NOT cancel — resolve with patient.`;

  try {
    await sendBlooioMessage({ to: taraPhone, message });
    console.log(`Prereq alert sent to Tara for ${patientName}`);
  } catch (err) {
    console.error('Failed to send Tara prereq alert:', err);
  }
}

// =====================================================
// T-02: PRE-VISIT INSTRUCTION SEND
// =====================================================

export async function sendPrepInstructions({ eventTypeSlug, patientId, patientName, patientEmail, patientPhone, serviceName, startTime, appointmentId, calcomBookingId }) {
  // Blood draws use gender-specific logic in appointment-notifications.js (already sent with confirmation)
  const BLOOD_DRAW_SLUGS = ['new-patient-blood-draw', 'follow-up-blood-draw'];
  if (BLOOD_DRAW_SLUGS.includes(eventTypeSlug)) {
    await updateAppointment({ instructions_sent: true }, { appointmentId, calcomBookingId });
    return;
  }

  const prep = getPrepInstructions(eventTypeSlug);
  if (!prep) {
    console.log(`No prep instructions for slug: ${eventTypeSlug}`);
    return;
  }

  const firstName = (patientName || 'there').split(' ')[0];

  const isTelemedicine = eventTypeSlug?.includes('telemedicine');
  let smsBody = `Hi ${firstName}! ${prep.sms}`;
  if (isTelemedicine) {
    smsBody += TELEMEDICINE_LINK_APPEND;
  }
  smsBody += ' — Range Medical';

  const phone = patientPhone ? normalizePhoneUtil(patientPhone) : null;

  if (phone) {
    try {
      const smsResult = await sendSMSRouter({ to: phone, message: smsBody });
      await logComm({
        channel: 'sms',
        messageType: 'prep_instructions',
        message: smsBody,
        source: 'booking-automation',
        patientId,
        patientName,
        recipient: phone,
        status: smsResult.success ? 'sent' : 'error',
        errorMessage: smsResult.error || null,
        provider: smsResult.provider || null,
        direction: 'outbound',
      });
      if (smsResult.success) {
        console.log(`Prep instructions SMS sent for ${patientName} (${eventTypeSlug})`);
      }
    } catch (err) {
      console.error('Prep instructions SMS error:', err);
    }
  }

  // Mark instructions_sent
  await updateAppointment({ instructions_sent: true }, { appointmentId, calcomBookingId });
}

// =====================================================
// T-03: AUTO-SEND INTAKE AND CONSENT FORMS
// =====================================================

// Auto form-send is disabled — staff send forms manually from the patient profile.
// Flip this to re-enable automatic SMS form delivery on booking.
const AUTO_SEND_FORMS_ON_BOOKING = false;

export async function sendRequiredForms({ eventTypeSlug, serviceCategory, patientId, patientName, patientEmail, patientPhone, appointmentId, calcomBookingId }) {
  if (!AUTO_SEND_FORMS_ON_BOOKING) {
    console.log(`Auto form-send disabled — skipping for ${patientName} (${serviceCategory})`);
    return;
  }

  const requiredFormIds = REQUIRED_FORMS[serviceCategory];
  if (!requiredFormIds || requiredFormIds.length === 0) {
    console.log(`No required forms for category: ${serviceCategory}`);
    return;
  }

  // Check which forms the patient already has on file
  let completedFormIds = [];
  if (patientId) {
    const { data: consents } = await supabase
      .from('consents')
      .select('consent_type')
      .eq('patient_id', patientId);

    if (consents) {
      const consentMap = {
        'hipaa': 'hipaa', 'blood_draw': 'blood-draw', 'blood-draw': 'blood-draw',
        'hrt': 'hrt', 'peptide': 'peptide', 'iv': 'iv', 'iv_injection': 'iv', 'iv-injection': 'iv',
        'hbot': 'hbot', 'weight_loss': 'weight-loss', 'weight-loss': 'weight-loss',
        'red_light': 'red-light', 'red-light': 'red-light', 'prp': 'prp',
        'exosome_iv': 'exosome-iv', 'exosome-iv': 'exosome-iv',
        'knee_aspiration': 'knee-aspiration', 'knee-aspiration': 'knee-aspiration',
      };
      completedFormIds = consents.map(c => consentMap[c.consent_type] || c.consent_type).filter(Boolean);
    }

    if (requiredFormIds.includes('intake')) {
      const { data: intakes } = await supabase
        .from('intakes')
        .select('id')
        .eq('patient_id', patientId)
        .limit(1);
      if (intakes && intakes.length > 0) {
        completedFormIds.push('intake');
      }
    }
  }

  const completedSet = new Set(completedFormIds);
  const missingFormIds = requiredFormIds.filter(id => !completedSet.has(id));

  if (missingFormIds.length === 0) {
    console.log(`All forms already on file for ${patientName} (${serviceCategory})`);
    await updateAppointment({ forms_complete: true }, { appointmentId, calcomBookingId });
    return;
  }

  console.log(`Missing forms for ${patientName}: ${missingFormIds.join(', ')}`);

  const phone = patientPhone ? normalizePhoneUtil(patientPhone) : null;
  if (!phone && !patientEmail) {
    console.log(`No contact info for form send — skipping for ${patientName}`);
    return;
  }

  try {
    const bundle = await createFormBundle({
      formIds: missingFormIds,
      patientId: patientId || null,
      patientName: patientName || null,
      patientEmail: patientEmail || null,
      patientPhone: phone || null,
      metadata: { source: 'auto_booking', calcomBookingId: calcomBookingId || null, appointmentId: appointmentId || null },
    });

    const firstName = (patientName || 'there').split(' ')[0];

    if (phone) {
      const formCount = missingFormIds.length;
      const messageBody = formCount === 1
        ? `Hi ${firstName}! Range Medical here. Please complete your ${FORM_DEFINITIONS[missingFormIds[0]]?.name || 'form'} before your visit:\n\n${bundle.url}`
        : `Hi ${firstName}! Range Medical here. Please complete your ${formCount} forms before your visit:\n\n${bundle.url}`;

      let formsSendResult;
      if (isBlooioProvider()) {
        const optedIn = await hasBlooioOptIn(phone);
        if (!optedIn) {
          const optInMsg = formCount === 1
            ? `Hi ${firstName}! Range Medical here. We have your ${FORM_DEFINITIONS[missingFormIds[0]]?.name || 'form'} ready for you. Reply YES to receive it.`
            : `Hi ${firstName}! Range Medical here. We have ${formCount} forms ready for you. Reply YES to receive them.`;

          formsSendResult = await sendSMSRouter({ to: phone, message: optInMsg });
          await queuePendingLinkMessage({
            phone,
            message: messageBody,
            messageType: 'form_links',
            patientId: patientId || null,
            patientName: patientName || null,
          });
          console.log(`Form opt-in sent for ${patientName} (bundle: ${bundle.token})`);
        } else {
          formsSendResult = await sendSMSRouter({ to: phone, message: messageBody });
          console.log(`Forms SMS sent for ${patientName} (bundle: ${bundle.token})`);
        }
      } else {
        formsSendResult = await sendSMSRouter({ to: phone, message: messageBody });
        console.log(`Forms SMS sent for ${patientName} (bundle: ${bundle.token})`);
      }

      await logComm({
        channel: 'sms',
        messageType: 'form_links',
        message: `Auto-sent ${formCount} form(s) for ${serviceCategory} booking`,
        source: 'booking-automation',
        patientId: patientId || null,
        patientName,
        recipient: phone,
        status: 'sent',
        provider: formsSendResult?.provider || null,
        direction: 'outbound',
      });
    }
  } catch (err) {
    console.error('Form auto-send error:', err);
  }
}

// =====================================================
// RUN ALL BOOKING AUTOMATIONS
// =====================================================

export async function runBookingAutomations({ appointmentId, calcomBookingId, eventTypeSlug, serviceCategory, patientId, patientName, patientEmail, patientPhone, serviceName, startTime }) {
  // T-05: Blood work prereq check
  if (eventTypeSlug && slugRequiresBloodWork(eventTypeSlug)) {
    await checkBloodWorkPrereq(patientId, eventTypeSlug, {
      patientName, serviceName, startTime, appointmentId, calcomBookingId,
    });
  }

  // T-02: Send prep instructions
  if (eventTypeSlug) {
    await sendPrepInstructions({
      eventTypeSlug, patientId, patientName, patientEmail, patientPhone,
      serviceName, startTime, appointmentId, calcomBookingId,
    });
  }

  // T-03: Send required forms
  if (serviceCategory) {
    await sendRequiredForms({
      eventTypeSlug, serviceCategory, patientId, patientName, patientEmail,
      patientPhone, appointmentId, calcomBookingId,
    });
  }
}
