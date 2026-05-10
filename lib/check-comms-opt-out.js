// lib/check-comms-opt-out.js
// Checks patient communication preferences before sending
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Check if a patient has opted out of a specific channel or type.
 * Returns { allowed: true } or { allowed: false, reason: '...' }
 *
 * @param {Object} opts
 * @param {string}  [opts.patientId]  - Patient UUID
 * @param {string}  [opts.phone]      - Phone number (fallback lookup if no patientId)
 * @param {'sms'|'email'|'call'} opts.channel - Communication channel
 * @param {boolean} [opts.isMarketing]   - Whether this is a marketing message
 * @param {boolean} [opts.isAutomation]  - Whether this is an automated message (cron, reminder)
 */
export async function checkCommsOptOut({ patientId, phone, channel, isMarketing = false, isAutomation = false }) {
  try {
    let patient;

    if (patientId) {
      const { data } = await supabase
        .from('patients')
        .select('sms_opt_out, email_opt_out, call_opt_out, marketing_opt_out, automations_opt_out')
        .eq('id', patientId)
        .single();
      patient = data;
    } else if (phone) {
      const normalized = phone.replace(/\D/g, '').slice(-10);
      const { data } = await supabase
        .from('patients')
        .select('sms_opt_out, email_opt_out, call_opt_out, marketing_opt_out, automations_opt_out')
        .or(`phone.ilike.%${normalized},mobile_phone.ilike.%${normalized}`)
        .limit(1)
        .single();
      patient = data;
    }

    if (!patient) return { allowed: true };

    const channelField = `${channel}_opt_out`;
    if (patient[channelField]) {
      return { allowed: false, reason: `Patient opted out of ${channel}` };
    }
    if (isMarketing && patient.marketing_opt_out) {
      return { allowed: false, reason: 'Patient opted out of marketing' };
    }
    if (isAutomation && patient.automations_opt_out) {
      return { allowed: false, reason: 'Patient opted out of automations' };
    }

    return { allowed: true };
  } catch (err) {
    console.error('checkCommsOptOut error:', err.message);
    return { allowed: true };
  }
}

/**
 * Supabase filter string to exclude opted-out patients from queries.
 * Use with .or() in cron job queries:
 *   .or('sms_opt_out.is.null,sms_opt_out.eq.false')
 */
export const SMS_NOT_OPTED_OUT = 'sms_opt_out.is.null,sms_opt_out.eq.false';
export const EMAIL_NOT_OPTED_OUT = 'email_opt_out.is.null,email_opt_out.eq.false';
export const AUTOMATIONS_NOT_OPTED_OUT = 'automations_opt_out.is.null,automations_opt_out.eq.false';
export const MARKETING_NOT_OPTED_OUT = 'marketing_opt_out.is.null,marketing_opt_out.eq.false';
