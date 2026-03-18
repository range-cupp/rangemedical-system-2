// /lib/provider-notifications.js
// Sends SMS notifications to providers/staff when appointments are booked, cancelled, or rescheduled
// Looks up employee by name or email to find their phone number
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendSMS as sendSMSRouter, normalizePhone } from './send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================================
// DATE/TIME FORMATTING (Pacific timezone)
// =====================================================

function formatShortDateTime(isoString) {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
  });
}

// =====================================================
// SMS TEMPLATES (for providers)
// =====================================================

const PROVIDER_SMS_TEMPLATES = {
  created: ({ patientName, serviceName, dateTime }) =>
    `New booking: ${patientName} — ${serviceName} on ${dateTime}. - Range Medical`,
  cancelled: ({ patientName, serviceName, dateTime }) =>
    `Cancelled: ${patientName} — ${serviceName} on ${dateTime} has been cancelled. - Range Medical`,
  rescheduled: ({ patientName, serviceName, dateTime }) =>
    `Rescheduled: ${patientName} — ${serviceName} moved to ${dateTime}. - Range Medical`,
};

// =====================================================
// LOOK UP EMPLOYEE PHONE
// =====================================================

async function findEmployeePhone({ staffName, staffEmail, provider }) {
  // Try email first (most reliable match from Cal.com)
  if (staffEmail) {
    const { data } = await supabase
      .from('employees')
      .select('id, name, phone')
      .eq('email', staffEmail.toLowerCase())
      .eq('is_active', true)
      .single();
    if (data?.phone) return data;
  }

  // Try name match (from manual appointments or Cal.com host name)
  const nameToSearch = staffName || provider;
  if (nameToSearch) {
    const { data } = await supabase
      .from('employees')
      .select('id, name, phone')
      .ilike('name', `%${nameToSearch}%`)
      .eq('is_active', true)
      .limit(1)
      .single();
    if (data?.phone) return data;
  }

  return null;
}

// =====================================================
// MAIN EXPORT: sendProviderNotification
// =====================================================

/**
 * Send SMS notification to the assigned provider/staff member
 *
 * @param {Object} params
 * @param {'created'|'cancelled'|'rescheduled'} params.type - Notification type
 * @param {Object} params.staff - { name, email } from Cal.com or manual booking
 * @param {string} [params.provider] - Provider name from manual appointment
 * @param {Object} params.appointment - { patientName, serviceName, startTime }
 */
export async function sendProviderNotification({ type, staff = {}, provider, appointment }) {
  try {
    const employee = await findEmployeePhone({
      staffName: staff.name,
      staffEmail: staff.email,
      provider,
    });

    if (!employee || !employee.phone) {
      console.log(`Provider SMS skipped: no phone for ${staff.name || staff.email || provider || 'unknown'}`);
      return;
    }

    const normalized = normalizePhone(employee.phone);
    if (!normalized) {
      console.log(`Provider SMS skipped: invalid phone for ${employee.name}`);
      return;
    }

    const dateTime = formatShortDateTime(appointment.startTime);
    const template = PROVIDER_SMS_TEMPLATES[type];
    if (!template) return;

    const message = template({
      patientName: appointment.patientName || 'A patient',
      serviceName: appointment.serviceName || 'Appointment',
      dateTime,
    });

    const result = await sendSMSRouter({ to: normalized, message });

    if (result.success) {
      console.log(`Provider SMS sent: ${type} -> ${employee.name} (${normalized})`);
    } else {
      console.error(`Provider SMS failed for ${employee.name}:`, result.error);
    }
  } catch (err) {
    console.error('sendProviderNotification error:', err);
  }
}
