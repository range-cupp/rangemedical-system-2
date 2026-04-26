// lib/internal-message-types.js
// Message types that target STAFF phones (provider notifications, task pings,
// dose-change approval requests, EOD reports, etc.). These rows may be linked
// to a patient_id for audit purposes, but they were never sent to the patient
// and must be excluded from patient conversation threads and conversation
// previews — otherwise an SMS sent to Dr. Burgess about a patient appears as
// if it was sent to the patient.

export const INTERNAL_MESSAGE_TYPES = [
  'lab_review_scheduling',
  'daily_sales_report',
  'daily_numbers',
  'provider_created',
  'provider_rescheduled',
  'task_assignment',
  'giveaway_staff_alert',
  'wl_midpoint',
  'dose_change_request',
  'dose_change_approved',
];

// PostgREST `NOT IN` filter expects: ("a","b","c")
export const INTERNAL_TYPES_PGRST = `(${INTERNAL_MESSAGE_TYPES.map(t => `"${t}"`).join(',')})`;
