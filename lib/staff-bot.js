// /lib/staff-bot.js
// Range Medical Staff SMS Bot
// Handles natural language commands from staff members via Blooio SMS
// Staff texts the clinic number → bot parses intent → queries/updates CRM → replies

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { getEventTypes, getAvailableSlots, createBooking, reassignBooking, cancelBooking, rescheduleBooking } from './calcom';
import { sendBlooioMessage } from './blooio';
import { createFormBundle, FORM_DEFINITIONS } from './form-bundles';
import { sendSMS, normalizePhone } from './send-sms';
import { sendAppointmentNotification } from './appointment-notifications';
import { logComm } from './comms-log';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ================================================================
// FORM BUNDLE MAPPINGS
// Maps natural-language bundle names → form IDs (mirrors UI behavior)
// intake + hipaa are always the base for any new-patient scenario
// ================================================================

export const FORM_BUNDLE_MAP = {
  // New patient / general onboarding
  'new-patient':   ['intake', 'hipaa'],
  'onboarding':    ['intake', 'hipaa'],
  'intake':        ['intake', 'hipaa'],

  // Service-specific — always includes intake + hipaa
  'blood-draw':    ['intake', 'hipaa', 'blood-draw'],
  'labs':          ['intake', 'hipaa', 'blood-draw'],
  'lab':           ['intake', 'hipaa', 'blood-draw'],
  'iv':            ['intake', 'hipaa', 'iv'],
  'iv-therapy':    ['intake', 'hipaa', 'iv'],
  'range-iv':      ['intake', 'hipaa', 'iv'],
  'injection':     ['intake', 'hipaa', 'iv'],
  'hrt':           ['intake', 'hipaa', 'hrt'],
  'hormone':       ['intake', 'hipaa', 'hrt'],
  'testosterone':  ['intake', 'hipaa', 'hrt'],
  'peptide':       ['intake', 'hipaa', 'peptide'],
  'peptides':      ['intake', 'hipaa', 'peptide'],
  'hbot':          ['intake', 'hipaa', 'hbot'],
  'hyperbaric':    ['intake', 'hipaa', 'hbot'],
  'oxygen':        ['intake', 'hipaa', 'hbot'],
  'weight-loss':   ['intake', 'hipaa', 'weight-loss'],
  'semaglutide':   ['intake', 'hipaa', 'weight-loss'],
  'tirzepatide':   ['intake', 'hipaa', 'weight-loss'],
  'red-light':     ['intake', 'hipaa', 'red-light'],
  'rlt':           ['intake', 'hipaa', 'red-light'],
  'prp':           ['intake', 'hipaa', 'prp'],
  'exosome':       ['intake', 'hipaa', 'exosome-iv'],
};

// Resolve a free-text bundle type string to a key in FORM_BUNDLE_MAP
export function resolveBundleType(text) {
  const t = (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

  // Direct key match
  if (FORM_BUNDLE_MAP[t]) return t;

  // Keyword scanning
  if (/new\s*patient|onboard/.test(t))         return 'new-patient';
  if (/blood\s*draw/.test(t))                  return 'blood-draw';
  if (/\blab(s)?\b/.test(t))                   return 'labs';
  if (/hbot|hyperbaric|oxygen therapy/.test(t)) return 'hbot';
  if (/\biv\b|intravenous|range iv/.test(t))   return 'iv';
  if (/hormone|testosterone|\bhrt\b/.test(t))  return 'hrt';
  if (/peptide/.test(t))                        return 'peptide';
  if (/weight\s*loss|semaglutide|tirzepatide/.test(t)) return 'weight-loss';
  if (/red\s*light|\brlt\b/.test(t))            return 'red-light';
  if (/\bprp\b/.test(t))                        return 'prp';
  if (/exosome/.test(t))                        return 'exosome';
  if (/injection/.test(t))                      return 'injection';

  return null;
}

// ================================================================
// STAFF IDENTIFICATION
// ================================================================

export async function identifyStaff(phone) {
  if (!phone) return null;
  const normalized = phone.replace(/\D/g, '').slice(-10);

  const { data: employee } = await supabase
    .from('employees')
    .select('id, name, title, is_admin, phone, calcom_user_id')
    .ilike('phone', `%${normalized}`)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  return employee || null;
}

// ================================================================
// INTENT PARSING via Claude Haiku
// ================================================================

// ================================================================
// REGEX FALLBACK — handles common intents without Claude API
// ================================================================

function parseDateFromText(text, todayISO) {
  const t = text.toLowerCase();
  const now = new Date();

  // tomorrow
  if (t.includes('tomorrow')) {
    const d = new Date(now.toLocaleDateString('en-CA', { timeZone: TZ }) + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-CA', { timeZone: TZ });
  }

  // today / tonight
  if (t.includes('today') || t.includes('tonight')) return todayISO;

  // day names: "monday", "this friday", "next tuesday"
  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  for (let i = 0; i < dayNames.length; i++) {
    if (t.includes(dayNames[i])) {
      const base = new Date(todayISO + 'T12:00:00');
      const currentDay = base.getDay();
      let diff = i - currentDay;
      if (diff <= 0) diff += 7;
      base.setDate(base.getDate() + diff);
      return base.toLocaleDateString('en-CA', { timeZone: TZ });
    }
  }

  // "March 15" or "3/15" or "03/15"
  const mdMatch = t.match(/\b(\d{1,2})\/(\d{1,2})\b/);
  if (mdMatch) {
    const year = now.getFullYear();
    return `${year}-${String(mdMatch[1]).padStart(2,'0')}-${String(mdMatch[2]).padStart(2,'0')}`;
  }
  const monthMatch = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})\b/i);
  if (monthMatch) {
    const months = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
    const m = months[monthMatch[1].toLowerCase().slice(0,3)];
    const year = now.getFullYear();
    return `${year}-${String(m).padStart(2,'0')}-${String(monthMatch[2]).padStart(2,'0')}`;
  }

  return todayISO; // default to today
}

function parseTimeFromText(text) {
  // "10:30am", "10am", "2:30 pm", "14:00", "2pm"
  const t = text.toLowerCase();
  const match = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3];
  if (ampm === 'pm' && h < 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  if (!ampm && h < 7) h += 12; // assume pm for ambiguous low hours (1–6)
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function regexFallback(text, todayISO) {
  const t = text.toLowerCase().trim();

  // help
  if (/^help\b/.test(t) || t === 'help') return { intent: 'help', params: {} };

  // get_schedule
  if (/\b(schedule|appointments?|who.s (coming|in)|what.s (on|happening))\b/.test(t)) {
    return { intent: 'get_schedule', params: { date: parseDateFromText(t, todayISO) } };
  }

  // check_availability
  if (/availab(le|ility)|open slot|any slot|is there.*slot|slot.*available/.test(t)) {
    const date = parseDateFromText(t, todayISO);
    const time = parseTimeFromText(t);
    // Extract service name — everything before "slot/availability/available/open"
    const serviceMatch = t.match(/(?:for\s+(?:a\s+)?|book\s+)(.+?)(?:\s+(?:slot|availability|available|tomorrow|today|at|\d))/i);
    const service = serviceMatch ? serviceMatch[1].trim() : 'Range IV';
    return { intent: 'check_availability', params: { service, date, ...(time && { time }) } };
  }

  // query_billing
  if (/\b(charge[sd]?|bill|invoice|paid|owe|balance|how much)\b/.test(t)) {
    const nameMatch = t.match(/(?:charge[sd]?|bill(?:ing)?|invoice|paid|owe|for)\s+(?:to\s+)?([a-z]+(?: [a-z]+)?)/i);
    const patient_name = nameMatch ? nameMatch[1].trim() : '';
    return { intent: 'query_billing', params: { patient_name } };
  }

  // add_note
  if (/\b(add (?:a )?note|note to|notes? for)\b/.test(t)) {
    const m = text.match(/note\s+to\s+([^:]+):\s*(.+)/i)
      || text.match(/note\s+for\s+([^:]+):\s*(.+)/i);
    if (m) return { intent: 'add_note', params: { patient_name: m[1].trim(), note: m[2].trim() } };
    return { intent: 'add_note', params: { patient_name: '', note: '' } };
  }

  // create_task
  if (/\b(create task|task for|assign.*task|new task)\b/.test(t)) {
    const m = text.match(/task\s+for\s+([^:]+):\s*(.+)/i);
    if (m) return { intent: 'create_task', params: { assigned_to: m[1].trim(), title: m[2].trim() } };
    return { intent: 'create_task', params: { assigned_to: '', title: '' } };
  }

  // book_appointment
  if (/\b(book|schedul(?:e|ing)|appoint)\b/.test(t)) {
    const date = parseDateFromText(t, todayISO);
    const time = parseTimeFromText(t);
    return { intent: 'book_appointment', params: { service: 'Range IV', date, time: time || '10:00', patient_name: '' } };
  }

  // lookup_patient
  if (/\b(look ?up|find|search for|patient info|who is)\b/.test(t)) {
    const m = text.match(/(?:look ?up|find|search for|patient info(?:rmation)? (?:for|on)|who is)\s+(.+)/i);
    const patient_name = m ? m[1].trim() : '';
    return { intent: 'lookup_patient', params: { patient_name } };
  }

  // send_forms — "send [bundle] forms to [patient]" / "send [patient] the [bundle] forms"
  if (/\b(send|text|email)\b.*(form|consent|onboard|intake|hipaa)\b/i.test(t) ||
      /\b(forms?|consent|onboard|intake)\b.*\b(to|for)\b/i.test(t)) {

    // Pattern A: "send blood draw forms to John Smith"
    const patA = text.match(/(?:send|text|email)\s+(?:(?:new\s+patient|[\w\s\-]+?)\s+(?:forms?|consent|onboarding)\s+(?:to|for)|(?:forms?|consent|onboarding)\s+(?:to|for))\s+(.+)/i);
    // Pattern B: "send forms to John Smith for blood draw"
    const patB = text.match(/(?:send|text|email)\s+(?:the\s+)?(?:forms?|consent)\s+(?:to|for)\s+(.+?)(?:\s+for\s+(.+))?$/i);
    // Pattern C: "send John Smith the blood draw forms"
    const patC = text.match(/(?:send|text|email)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+the\s+(.+?)\s+(?:forms?|consent)/i);
    // Pattern D: "send new patient onboarding to John Smith"
    const patD = text.match(/(?:send|text|email)\s+(new\s+patient|[\w\s\-]+?)\s+(?:forms?|consent|onboarding|intake)\s+(?:to|for)\s+(.+)/i);

    let patient_name = '', bundle_raw = '';

    if (patD) {
      bundle_raw = patD[1].trim();
      patient_name = patD[2].trim();
    } else if (patC) {
      patient_name = patC[1].trim();
      bundle_raw = patC[2].trim();
    } else if (patA) {
      patient_name = patA[1].trim();
      // Extract bundle from before "forms/consent"
      const bm = text.match(/(?:send|text|email)\s+([\w\s\-]+?)\s+(?:forms?|consent|onboarding)/i);
      bundle_raw = bm ? bm[1].trim() : '';
    } else if (patB) {
      patient_name = patB[1].trim();
      bundle_raw = patB[2] ? patB[2].trim() : '';
    }

    // Fallback: pull everything after "to/for" as patient name
    if (!patient_name) {
      const toMatch = text.match(/\b(?:to|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
      if (toMatch) patient_name = toMatch[1].trim();
    }

    const bundle_type = resolveBundleType(bundle_raw) || 'new-patient';
    return { intent: 'send_forms', params: { patient_name, bundle_type } };
  }

  return null; // couldn't parse — fall through to Claude API
}

async function parseIntent(text, staffName) {
  const now = new Date();
  const today = now.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const todayISO = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); // YYYY-MM-DD

  // Try regex fallback first (instant, no API cost)
  // If regex matches, use it directly — only call Claude for truly ambiguous messages
  const quick = regexFallback(text, todayISO);
  if (quick) return quick;

  const systemPrompt = `You are a command parser for Range Medical, a medical clinic in Newport Beach, CA.
Parse staff member ${staffName}'s SMS message and return a JSON object only — no other text.

Today is ${today}. Today's ISO date is ${todayISO}. Timezone: America/Los_Angeles.

Supported intents and their params:

"check_availability" — check open slots on Cal.com
  params: { service (string), date (YYYY-MM-DD), time (HH:MM 24hr, optional) }

"book_appointment" — book an appointment on Cal.com for a patient
  params: { service (string), date (YYYY-MM-DD), time (HH:MM 24hr), patient_name (string) }

"query_billing" — look up patient invoices/charges
  params: { patient_name (string) }

"add_note" — add a note to a patient's file
  params: { patient_name (string), note (string) }

"create_task" — create a task and assign it to a staff member (notifies them by SMS)
  params: { assigned_to (string, first name or full name), title (string), patient_name (string, optional), due_date (YYYY-MM-DD, optional), priority ("low"|"medium"|"high", default "medium") }

"get_schedule" — get the appointment schedule for a day
  params: { date (YYYY-MM-DD) }

"lookup_patient" — look up basic patient info
  params: { patient_name (string) }

"send_forms" — send a form bundle link to a patient via SMS (and email if available)
  params: { patient_name (string), bundle_type (string) }
  bundle_type values: "new-patient", "onboarding", "blood-draw", "labs", "iv", "iv-therapy", "range-iv",
    "hrt", "hormone", "testosterone", "peptide", "hbot", "hyperbaric", "weight-loss",
    "semaglutide", "red-light", "rlt", "prp", "exosome", "injection"
  Default bundle_type to "new-patient" if unclear.

"help" — show available commands
  params: {}

"unknown" — cannot parse
  params: { original: (the original text) }

Examples:
"Is there a Range IV slot tomorrow at 10:30?" → {"intent":"check_availability","params":{"service":"Range IV","date":"TOMORROW_DATE","time":"10:30"}}
"Book Range IV for Sarah Johnson tomorrow at 2pm" → {"intent":"book_appointment","params":{"service":"Range IV","date":"TOMORROW_DATE","time":"14:00","patient_name":"Sarah Johnson"}}
"What did we charge John Smith?" → {"intent":"query_billing","params":{"patient_name":"John Smith"}}
"Add note to Mike Chen: called to confirm appointment" → {"intent":"add_note","params":{"patient_name":"Mike Chen","note":"called to confirm appointment"}}
"Create task for Ashley: call Sarah Johnson about labs - due tomorrow, high priority" → {"intent":"create_task","params":{"assigned_to":"Ashley","title":"call Sarah Johnson about labs","patient_name":"Sarah Johnson","due_date":"TOMORROW_DATE","priority":"high"}}
"What's on the schedule today?" → {"intent":"get_schedule","params":{"date":"${todayISO}"}}
"Look up Chris Cupp" → {"intent":"lookup_patient","params":{"patient_name":"Chris Cupp"}}
"Send new patient onboarding to Sarah Johnson" → {"intent":"send_forms","params":{"patient_name":"Sarah Johnson","bundle_type":"new-patient"}}
"Send blood draw forms to Mike Chen" → {"intent":"send_forms","params":{"patient_name":"Mike Chen","bundle_type":"blood-draw"}}
"Text peptide consent to John Smith" → {"intent":"send_forms","params":{"patient_name":"John Smith","bundle_type":"peptide"}}
"Send Jane Doe the HBOT forms" → {"intent":"send_forms","params":{"patient_name":"Jane Doe","bundle_type":"hbot"}}
"help" → {"intent":"help","params":{}}

Replace TOMORROW_DATE with the actual tomorrow date in YYYY-MM-DD format.
Return ONLY valid JSON. No markdown, no explanation.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: text }],
      }),
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status, await response.text());
      return quick || { intent: 'unknown', params: { original: text } };
    }

    const data = await response.json();
    const jsonText = data.content?.[0]?.text?.trim();
    return JSON.parse(jsonText);
  } catch (err) {
    console.error('Intent parsing error:', err.message);
    return quick || { intent: 'unknown', params: { original: text } };
  }
}

// ================================================================
// HELPER: Find patient by name
// ================================================================

async function findPatient(name) {
  if (!name) return null;
  const parts = name.trim().split(/\s+/);
  const first = parts[0];
  const last = parts[parts.length - 1];

  const { data: patients } = await supabase
    .from('patients')
    .select('id, first_name, last_name, email, phone, date_of_birth, ghl_contact_id')
    .or(`first_name.ilike.${first}%,last_name.ilike.${last}%`)
    .limit(5);

  if (!patients || patients.length === 0) return null;

  // Prefer exact full name match
  const exact = patients.find(
    (p) => `${p.first_name} ${p.last_name}`.toLowerCase() === name.toLowerCase()
  );
  return exact || patients[0];
}

// ================================================================
// HELPER: Pacific time utilities
// ================================================================

const TZ = 'America/Los_Angeles';

// Get the UTC offset string for Pacific time on a given date (handles PST/PDT)
// e.g. returns "-07:00" in summer, "-08:00" in winter
function getPacificOffset(dateStr) {
  const date = new Date(`${dateStr}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    timeZoneName: 'shortOffset',
  }).formatToParts(date);
  const tzName = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT-7';
  const match = tzName.match(/GMT([+-]\d+)/);
  if (!match) return '-07:00';
  const h = parseInt(match[1], 10);
  return `${h < 0 ? '-' : '+'}${String(Math.abs(h)).padStart(2, '0')}:00`;
}

// Build an ISO string in Pacific local time (e.g. "2026-03-11T10:30:00-07:00")
function toPacificISO(dateStr, timeStr) {
  return `${dateStr}T${timeStr}:00${getPacificOffset(dateStr)}`;
}

// ================================================================
// HELPER: Format date/time for SMS display
// ================================================================

function formatDate(dateStr) {
  // dateStr is YYYY-MM-DD
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    timeZone: TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(timeStr) {
  // timeStr is HH:MM (24hr)
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m}${ampm}`;
}

// Cal.com returns slots as either plain strings or objects with a .time property
function slotToIso(slot) {
  if (!slot) return null;
  if (typeof slot === 'string') return slot;
  return slot.time || slot.start || slot.dateTime || null;
}

function slotToDisplayTime(slot) {
  const iso = slotToIso(slot);
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ================================================================
// HELPER: Match service name to Cal.com event type
// ================================================================

async function findEventType(serviceName, location = null) {
  const eventTypesData = await getEventTypes();

  // getEventTypes() returns result.data — could be array or { eventTypes: [...] }
  let allEvents = [];
  if (Array.isArray(eventTypesData)) {
    allEvents = eventTypesData;
  } else if (eventTypesData?.eventTypes) {
    allEvents = eventTypesData.eventTypes;
  } else if (eventTypesData) {
    allEvents = [eventTypesData];
  }

  if (allEvents.length === 0) return null;

  const needle = serviceName?.toLowerCase() || '';
  const isPlacentia = location?.toLowerCase().includes('placentia');
  const isNewport   = !isPlacentia && (location?.toLowerCase().includes('newport') || location?.toLowerCase().includes('nb'));

  // All events whose title matches the service name
  const matches = allEvents.filter(
    (et) =>
      et.title?.toLowerCase() === needle ||
      et.title?.toLowerCase().includes(needle) ||
      needle.includes(et.title?.toLowerCase())
  );

  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  // Multiple matches — use location to disambiguate
  if (isPlacentia) {
    // Prefer event types with 'placentia' or 'tlab' in title/slug
    const hit = matches.find(
      (et) =>
        et.title?.toLowerCase().includes('placentia') ||
        et.slug?.toLowerCase().includes('placentia') ||
        et.title?.toLowerCase().includes('tlab') ||
        et.slug?.toLowerCase().includes('tlab')
    );
    if (hit) return hit;
  }

  if (isNewport || !location) {
    // Prefer event types WITHOUT placentia/tlab in title/slug (default = Newport Beach)
    const hit = matches.find(
      (et) =>
        !et.title?.toLowerCase().includes('placentia') &&
        !et.slug?.toLowerCase().includes('placentia') &&
        !et.title?.toLowerCase().includes('tlab') &&
        !et.slug?.toLowerCase().includes('tlab')
    );
    if (hit) return hit;
  }

  // Fallback: return first match
  return matches[0];
}

// ================================================================
// INTENT HANDLERS
// ================================================================

async function handleCheckAvailability(params) {
  try {
    const eventType = await findEventType(params.service, params.location);
    if (!eventType) {
      return `❌ Service "${params.service}" not found on the calendar. Check the name and try again.`;
    }

    const date = params.date;
    const offset = getPacificOffset(date);
    const startTime = `${date}T00:00:00${offset}`;
    const endTime = `${date}T23:59:59${offset}`;

    const slotsData = await getAvailableSlots(eventType.id, startTime, endTime);

    // slotsData could be { slots: { "date": [...] } } or { "date": [...] }
    const slotsObj = slotsData?.slots || slotsData || {};
    const daySlots = slotsObj[date] || [];

    if (daySlots.length === 0) {
      return `❌ No availability for ${eventType.title} on ${formatDate(date)}.`;
    }

    // If specific time was requested, check if it's available
    if (params.time) {
      const requestedHHMM = params.time; // "10:30"
      const isAvailable = daySlots.some((slot) => {
        const iso = slotToIso(slot);
        if (!iso) return false;
        const slotHHMM = new Date(iso).toLocaleTimeString('en-US', {
          timeZone: 'America/Los_Angeles',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        return slotHHMM === requestedHHMM;
      });

      if (isAvailable) {
        return (
          `✅ ${eventType.title} at ${formatTime(params.time)} on ${formatDate(date)} is available.\n\n` +
          `Reply: "Book ${params.service} ${formatDate(date)} ${formatTime(params.time)} for [Patient Name]"`
        );
      } else {
        const nearby = daySlots
          .slice(0, 6)
          .map((s) => slotToDisplayTime(s))
          .filter(Boolean)
          .join(', ');
        return (
          `❌ ${eventType.title} at ${formatTime(params.time)} on ${formatDate(date)} is taken.\n\n` +
          `Available times: ${nearby}`
        );
      }
    }

    // No specific time — show all available slots
    const displaySlots = daySlots
      .slice(0, 10)
      .map((s) => slotToDisplayTime(s))
      .filter(Boolean)
      .join(', ');
    const extra = daySlots.length > 10 ? ` +${daySlots.length - 10} more` : '';

    return `📅 ${eventType.title} — ${formatDate(date)}:\n${displaySlots}${extra}`;
  } catch (err) {
    console.error('check_availability error:', err);
    return `❌ Error checking availability: ${err.message}`;
  }
}

async function handleBookAppointment(params) {
  try {
    // Find patient — require a reasonably confident match before booking
    const patient = await findPatient(params.patient_name);
    if (!patient) {
      return `❌ Patient "${params.patient_name}" not found in the CRM. Check the spelling and try again.`;
    }
    const patientName = `${patient.first_name} ${patient.last_name}`;

    // Safety check: if the name found is substantially different from what was requested,
    // surface it so staff can confirm before the booking fires
    const requestedNorm = params.patient_name.toLowerCase().replace(/\s+/g, '');
    const foundNorm = patientName.toLowerCase().replace(/\s+/g, '');
    if (!foundNorm.includes(requestedNorm) && !requestedNorm.includes(foundNorm)) {
      return `⚠️ Closest match found: **${patientName}**. Is this the right patient? If yes, resend the booking request using their full name.`;
    }

    // Find event type
    const eventType = await findEventType(params.service, params.location);
    if (!eventType) {
      return `❌ Service "${params.service}" not found on the calendar. Available services can be checked via Cal.com.`;
    }

    // Validate: don't book in the past
    const requestedStart = new Date(toPacificISO(params.date, params.time));
    if (requestedStart < new Date()) {
      const friendly = requestedStart.toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
      });
      return `❌ Can't book in the past — ${friendly} has already passed. Please pick a future date and time.`;
    }

    // Build ISO start in Pacific local time
    const startISO = toPacificISO(params.date, params.time);

    // Resolve provider (if specified) — look up employee by name to get calcom_user_id
    let providerInfo = null;
    if (params.provider_name) {
      const providerSearch = params.provider_name.toLowerCase().trim();
      const { data: employees } = await supabase
        .from('employees')
        .select('id, name, calcom_user_id')
        .eq('is_active', true);
      if (employees) {
        const match = employees.find((e) =>
          e.name?.toLowerCase().includes(providerSearch) ||
          providerSearch.includes(e.name?.toLowerCase().split(' ')[0])
        );
        if (match) providerInfo = match;
      }
    }

    // Create booking — Cal.com email must be a valid format
    const attendeeEmail = patient.email || `patient.${patient.id.slice(0, 8)}@range-medical.com`;

    const booking = await createBooking({
      eventTypeId: eventType.id,
      start: startISO,
      name: patientName,
      email: attendeeEmail,
      phoneNumber: patient.phone || undefined,
      notes: params.provider_name
        ? `Booked via staff assistant — requested provider: ${params.provider_name}`
        : 'Booked via staff assistant',
    });

    if (booking?.error || !booking?.uid) {
      // Surface the actual Cal.com error so it can be debugged
      let errDetail = '';
      if (typeof booking?.error === 'string') {
        errDetail = booking.error;
      } else if (booking?.error?.message) {
        errDetail = booking.error.message;
      } else {
        errDetail = JSON.stringify(booking).slice(0, 300);
      }
      return `❌ Cal.com booking failed.\nError: ${errDetail}\n\nDebug: eventTypeId=${eventType.id}, start=${startISO}, email=${attendeeEmail}`;
    }

    // Save to appointments table (best-effort)
    const durationMins = eventType.length || 60;
    const endISO = new Date(
      new Date(startISO).getTime() + durationMins * 60000
    ).toISOString();

    try {
      await supabase
        .from('appointments')
        .insert({
          patient_id: patient.id,
          patient_name: patientName,
          patient_phone: patient.phone || null,
          service_name: eventType.title,
          service_category: eventType.title,
          start_time: new Date(startISO).toISOString(),
          end_time: endISO,
          duration_minutes: durationMins,
          status: 'scheduled',
          source: 'staff_assistant',
          cal_com_booking_id: booking.uid,
          notes: params.provider_name
            ? `Booked via staff assistant — provider: ${params.provider_name}`
            : 'Booked via staff assistant',
        });
    } catch (e) {
      console.warn('DB appointment insert failed:', e.message);
    }

    // Reassign to requested provider if we found their Cal.com user ID
    let providerNote = '';
    if (providerInfo?.calcom_user_id) {
      let reassigned = null;
      try {
        reassigned = await reassignBooking(booking.uid, providerInfo.calcom_user_id);
      } catch (e) {
        console.warn('Reassign failed:', e.message);
      }
      providerNote = reassigned
        ? `\n👩‍⚕️ Assigned to ${providerInfo.name}`
        : `\n⚠️ Could not auto-assign to ${providerInfo.name} — please reassign manually in Cal.com`;
    } else if (params.provider_name) {
      providerNote = `\n⚠️ Provider "${params.provider_name}" not found in staff list — booking created unassigned`;
    }

    return (
      `✅ Booked!\n` +
      `👤 ${patientName}\n` +
      `🏥 ${eventType.title}\n` +
      `📅 ${formatDate(params.date)} at ${formatTime(params.time)}` +
      providerNote + `\n` +
      `🔖 Ref: ${booking.uid}`
    );
  } catch (err) {
    console.error('book_appointment error:', err);
    return `❌ Booking error: ${err.message}`;
  }
}

async function handleQueryBilling(params) {
  try {
    const patient = await findPatient(params.patient_name);
    if (!patient) return `❌ Patient "${params.patient_name}" not found.`;

    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_cents, status, created_at, items, paid_at')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!invoices || invoices.length === 0) {
      return `No invoices found for ${patient.first_name} ${patient.last_name}.`;
    }

    const totalPaid = invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + (i.total_cents || 0), 0);

    const lines = invoices
      .map((inv) => {
        const date = new Date(inv.created_at).toLocaleDateString('en-US', {
          timeZone: TZ,
          month: 'short',
          day: 'numeric',
        });
        const items = Array.isArray(inv.items)
          ? inv.items.map((i) => i.description || i.name || 'Service').join(', ')
          : 'Service';
        return `• ${date}: $${(inv.total_cents / 100).toFixed(2)} — ${items} (${inv.status})`;
      })
      .join('\n');

    return (
      `💰 ${patient.first_name} ${patient.last_name}\n` +
      `Total paid: $${(totalPaid / 100).toFixed(2)}\n\n` +
      `Recent invoices:\n${lines}`
    );
  } catch (err) {
    console.error('query_billing error:', err);
    return `❌ Billing error: ${err.message}`;
  }
}

async function handleAddNote(params, staff) {
  try {
    const patient = await findPatient(params.patient_name);
    if (!patient) return `❌ Patient "${params.patient_name}" not found.`;

    await supabase.from('patient_notes').insert({
      patient_id: patient.id,
      body: params.note,
      note_date: new Date().toISOString(),
      source: 'staff_sms',
      created_by: staff.name,
    });

    return `✅ Note added to ${patient.first_name} ${patient.last_name}'s file.`;
  } catch (err) {
    console.error('add_note error:', err);
    return `❌ Note error: ${err.message}`;
  }
}

async function handleCreateTask(params, staff) {
  try {
    // Find assignee
    const { data: employees } = await supabase
      .from('employees')
      .select('id, name, phone')
      .eq('is_active', true);

    const assigneeName = params.assigned_to?.toLowerCase() || '';
    const assignee = employees?.find(
      (e) =>
        e.name?.toLowerCase() === assigneeName ||
        e.name?.toLowerCase().startsWith(assigneeName) ||
        assigneeName.includes(e.name?.toLowerCase().split(' ')[0])
    );

    if (!assignee) {
      const names = employees?.map((e) => e.name).join(', ') || 'none';
      return `❌ Employee "${params.assigned_to}" not found. Staff: ${names}`;
    }

    // Optional patient link
    let patientId = null;
    let patientName = params.patient_name || null;
    if (params.patient_name) {
      const p = await findPatient(params.patient_name);
      if (p) {
        patientId = p.id;
        patientName = `${p.first_name} ${p.last_name}`;
      }
    }

    // Insert task
    await supabase.from('tasks').insert({
      title: params.title,
      assigned_to: assignee.id,
      assigned_by: staff.id,
      patient_id: patientId,
      patient_name: patientName,
      priority: params.priority || 'medium',
      due_date: params.due_date || null,
      status: 'pending',
    });

    // Notify assignee by SMS (if different from sender and has a phone)
    let notifyMsg = '';
    const normalizedStaffPhone = staff.phone?.replace(/\D/g, '').slice(-10);
    const normalizedAssigneePhone = assignee.phone?.replace(/\D/g, '').slice(-10);

    if (assignee.phone && normalizedAssigneePhone !== normalizedStaffPhone) {
      const taskSMS =
        `📋 New task from ${staff.name}:\n"${params.title}"` +
        (patientName ? `\nPatient: ${patientName}` : '') +
        (params.due_date ? `\nDue: ${formatDate(params.due_date)}` : '') +
        (params.priority === 'high' ? '\n⚠️ High priority' : '');

      await sendBlooioMessage({ to: assignee.phone, message: taskSMS }).catch((e) =>
        console.warn('Task notification SMS failed:', e.message)
      );
      notifyMsg = ` ${assignee.name} has been notified by SMS.`;
    }

    return `✅ Task created for ${assignee.name}.${notifyMsg}`;
  } catch (err) {
    console.error('create_task error:', err);
    return `❌ Task error: ${err.message}`;
  }
}

async function handleGetSchedule(params) {
  try {
    const date = params.date;
    const offset = getPacificOffset(date);
    const startOfDay = `${date}T00:00:00${offset}`;
    const endOfDay = `${date}T23:59:59${offset}`;

    const { data: appointments } = await supabase
      .from('appointments')
      .select('patient_name, service_name, start_time, status, provider')
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .not('status', 'eq', 'cancelled')
      .order('start_time', { ascending: true });

    if (!appointments || appointments.length === 0) {
      return `📅 No appointments scheduled for ${formatDate(date)}.`;
    }

    const lines = appointments
      .map((a) => {
        const time = new Date(a.start_time).toLocaleTimeString('en-US', {
          timeZone: 'America/Los_Angeles',
          hour: 'numeric',
          minute: '2-digit',
        });
        return `• ${time} — ${a.patient_name} (${a.service_name})`;
      })
      .join('\n');

    return `📅 ${formatDate(date)} — ${appointments.length} appt${appointments.length !== 1 ? 's' : ''}:\n${lines}`;
  } catch (err) {
    console.error('get_schedule error:', err);
    return `❌ Schedule error: ${err.message}`;
  }
}

async function handleLookupPatient(params) {
  try {
    const parts = (params.patient_name || '').trim().split(/\s+/);
    const first = parts[0];
    const last = parts[parts.length - 1];

    const { data: patients } = await supabase
      .from('patients')
      .select('id, first_name, last_name, email, phone, date_of_birth')
      .or(`first_name.ilike.${first}%,last_name.ilike.${last}%`)
      .limit(4);

    if (!patients || patients.length === 0) {
      return `❌ No patient found for "${params.patient_name}".`;
    }

    if (patients.length === 1) {
      const p = patients[0];
      const dob = p.date_of_birth
        ? new Date(p.date_of_birth).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'N/A';
      return (
        `👤 ${p.first_name} ${p.last_name}\n` +
        `📱 ${p.phone || 'No phone'}\n` +
        `📧 ${p.email || 'No email'}\n` +
        `🎂 ${dob}`
      );
    }

    // Multiple matches
    const matches = patients
      .map((p) => `• ${p.first_name} ${p.last_name} — ${p.phone || p.email || 'no contact'}`)
      .join('\n');
    return `Found ${patients.length} matches:\n${matches}\n\nBe more specific.`;
  } catch (err) {
    console.error('lookup_patient error:', err);
    return `❌ Lookup error: ${err.message}`;
  }
}

async function handleGetAvailableProviders(params) {
  try {
    const { date, service, location } = params;

    // Get all active clinical staff who have a Cal.com user ID
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, name, title, calcom_user_id')
      .eq('is_active', true)
      .not('calcom_user_id', 'is', null);

    if (error) throw error;
    if (!employees || employees.length === 0) {
      return 'No providers found in the system with Cal.com accounts.';
    }

    // If a service is specified, filter to only providers who are hosts
    // on that Cal.com event type — this prevents showing providers who
    // don't actually perform that service (e.g. Damon doesn't do Range IVs)
    let filteredEmployees = employees;
    if (service) {
      const eventType = await findEventType(service, location);
      if (eventType && eventType.hosts && eventType.hosts.length > 0) {
        const hostUserIds = new Set(eventType.hosts.map(h => String(h.userId)));
        filteredEmployees = employees.filter(e => hostUserIds.has(String(e.calcom_user_id)));
      }
    }

    if (filteredEmployees.length === 0) {
      return `No providers found who perform "${service}" at ${location || 'this location'}. Check Cal.com event type host assignments.`;
    }

    // Count existing appointments per provider for that day
    const offset = getPacificOffset(date);
    const startOfDay = `${date}T00:00:00${offset}`;
    const endOfDay   = `${date}T23:59:59${offset}`;

    const { data: dayAppts } = await supabase
      .from('appointments')
      .select('provider, status')
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .not('status', 'eq', 'cancelled');

    const bookingCounts = {};
    (dayAppts || []).forEach((a) => {
      if (a.provider) bookingCounts[a.provider] = (bookingCounts[a.provider] || 0) + 1;
    });

    const lines = filteredEmployees.map((e) => {
      const count = bookingCounts[e.name] || 0;
      const load = count === 0 ? 'open' : `${count} appt${count !== 1 ? 's' : ''} scheduled`;
      const calWarning = !e.calcom_user_id ? ' ⚠️ no Cal.com ID — auto-assign will fail' : '';
      return `• ${e.name}${e.title ? ` (${e.title})` : ''} — ${load}${calWarning}`;
    });

    const serviceLabel = service ? ` for ${service}` : '';
    return (
      `Providers${serviceLabel} on ${formatDate(date)}:\n${lines.join('\n')}\n\n` +
      `Note: counts reflect appointments in our system. Confirm directly if anyone has time-off not yet blocked on the calendar.`
    );
  } catch (err) {
    console.error('get_available_providers error:', err);
    return `❌ Provider lookup error: ${err.message}`;
  }
}

async function handleCancelAppointment(params) {
  try {
    const { patient_name, date, service_type, reason = 'Cancelled by staff' } = params;

    if (!patient_name) return '❌ Please provide the patient name.';

    // Fetch full booking row — need patient_email, patient_id, staff_email, staff_name
    // for notifications
    let query = supabase
      .from('calcom_bookings')
      .select('id, calcom_uid, patient_id, patient_name, patient_email, start_time, end_time, duration_minutes, service_name, service_type, staff_name, staff_email, status')
      .ilike('patient_name', `%${patient_name}%`)
      .not('status', 'eq', 'cancelled')
      .order('start_time', { ascending: true });

    if (date) {
      const offset = getPacificOffset(date);
      query = query
        .gte('start_time', `${date}T00:00:00${offset}`)
        .lte('start_time', `${date}T23:59:59${offset}`);
    }

    if (service_type) {
      query = query.ilike('service_name', `%${service_type}%`);
    }

    const { data: bookings, error } = await query.limit(5);
    if (error) throw error;

    if (!bookings || bookings.length === 0) {
      const when = date ? ` on ${formatDate(date)}` : '';
      const what = service_type ? ` for ${service_type}` : '';
      return `❌ No active bookings found for ${patient_name}${what}${when}. They may already be cancelled or not yet in the system.`;
    }

    // If multiple matches with no narrowing criteria, ask which one
    if (bookings.length > 1 && !date && !service_type) {
      const list = bookings.map(b => {
        const dt = new Date(b.start_time).toLocaleString('en-US', {
          timeZone: 'America/Los_Angeles',
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit',
        });
        return `• ${b.service_name || 'Appointment'} on ${dt}`;
      }).join('\n');
      return `Found multiple upcoming bookings for ${patient_name}:\n${list}\n\nWhich one should I cancel?`;
    }

    const booking = bookings[0];
    const serviceName = booking.service_name || booking.service_type || 'Appointment';

    // 1. Cancel in Cal.com (removes it from the calendar)
    if (booking.calcom_uid) {
      const calResult = await cancelBooking(booking.calcom_uid, reason);
      if (calResult && calResult.error) {
        console.error('Cal.com cancel error:', calResult);
        // Don't block — still update local status and send notifications
      }
    }

    // 2. Update local record
    const { error: updateError } = await supabase
      .from('calcom_bookings')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', booking.id);

    if (updateError) throw updateError;

    // 3. Send patient notification (SMS + email) — same as when webhook fires
    const patientPhone = await (async () => {
      if (!booking.patient_id) return null;
      const { data } = await supabase
        .from('patients')
        .select('phone')
        .eq('id', booking.patient_id)
        .single();
      return data?.phone || null;
    })();

    sendAppointmentNotification({
      type: 'cancellation',
      patient: {
        id: booking.patient_id || null,
        name: booking.patient_name,
        email: booking.patient_email || null,
        phone: patientPhone,
      },
      appointment: {
        serviceName,
        startTime: booking.start_time,
        endTime: booking.end_time,
        durationMinutes: booking.duration_minutes,
      },
    }).catch(err => console.error('Patient cancellation notification failed:', err));

    // 4. Send provider/staff email notification
    if (booking.staff_email) {
      resend.emails.send({
        from: 'Range Medical <noreply@range-medical.com>',
        replyTo: 'info@range-medical.com',
        to: booking.staff_email,
        subject: `Cancelled: ${booking.patient_name} — ${serviceName}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#dc2626;margin:0 0 16px;">Appointment Cancelled</h2>
            <p style="margin:0 0 8px;"><strong>Patient:</strong> ${booking.patient_name}</p>
            <p style="margin:0 0 8px;"><strong>Service:</strong> ${serviceName}</p>
            <p style="margin:0 0 8px;"><strong>Time:</strong> ${new Date(booking.start_time).toLocaleString('en-US', {
              timeZone: 'America/Los_Angeles',
              weekday: 'long', month: 'long', day: 'numeric',
              hour: 'numeric', minute: '2-digit',
            })}</p>
            ${reason ? `<p style="margin:8px 0 0;color:#6b7280;font-size:13px;">Reason: ${reason}</p>` : ''}
            <hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb;"/>
            <p style="margin:0;color:#6b7280;font-size:12px;">This appointment has been removed from your calendar.</p>
          </div>
        `,
      }).catch(err => console.error('Staff cancellation notification failed:', err));
    }

    const dt = new Date(booking.start_time).toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      weekday: 'long', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });

    return `✅ Cancelled: **${serviceName}** for **${booking.patient_name}** on **${dt}**.\n\nNotifications sent to the patient${booking.staff_name ? ` and ${booking.staff_name}` : ''}.`;
  } catch (err) {
    console.error('cancel_appointment error:', err);
    return `❌ Cancellation error: ${err.message}`;
  }
}

async function handleGetServiceInfo(params) {
  try {
    const search = (params.service_name || '').toLowerCase().trim();

    let query = supabase
      .from('pos_services')
      .select('name, description, price_cents, category, active')
      .eq('active', true)
      .order('category')
      .order('sort_order');

    const { data: services, error } = await query;
    if (error) throw error;

    if (!services || services.length === 0) {
      return 'No services found in the system.';
    }

    // If searching for a specific service, filter
    const filtered = search
      ? services.filter(
          (s) =>
            s.name?.toLowerCase().includes(search) ||
            s.category?.toLowerCase().includes(search) ||
            s.description?.toLowerCase().includes(search)
        )
      : services;

    if (filtered.length === 0) {
      return `No services matching "${params.service_name}" found. Here are all active services:\n` +
        services.map((s) => `• ${s.name} — $${(s.price_cents / 100).toFixed(0)}`).join('\n');
    }

    return filtered
      .map((s) => {
        const price = s.price_cents ? `$${(s.price_cents / 100).toFixed(0)}` : 'Contact for pricing';
        return `${s.name} — ${price}${s.description ? `\n  ${s.description}` : ''}`;
      })
      .join('\n\n');
  } catch (err) {
    console.error('get_service_info error:', err);
    return `❌ Service info error: ${err.message}`;
  }
}

// ================================================================
// DOCUMENT CATALOG
// Links to live branded web pages on app.range-medical.com
// Used by handleSendDocument for fuzzy matching
// ================================================================

const DOCUMENT_CATALOG = [
  // ── IV Therapy ──
  { id: 'range_iv',          name: 'Range IV',                           url: '/range-iv-guide',                    keywords: ['range iv', 'iv therapy', 'iv drip', 'infusion', 'iv', 'hydration drip'] },
  { id: 'nad',               name: 'NAD+ Therapy',                       url: '/nad-guide',                         keywords: ['nad', 'nad+', 'nicotinamide', 'nad therapy'] },
  { id: 'nad_service',       name: 'NAD+ Therapy Info',                  url: '/nad-therapy',                       keywords: ['nad service', 'nad info page'] },
  { id: 'methylene_blue_iv', name: 'Methylene Blue IV',                  url: '/methylene-blue-iv-guide',           keywords: ['methylene blue', 'mb iv', 'methylene blue iv'] },
  { id: 'mb_vitc_combo',     name: 'MB + Vitamin C Combo',               url: '/methylene-blue-combo-iv-guide',     keywords: ['methylene blue combo', 'mb vitc', 'mb vitamin c', 'the blu', 'blu combo'] },
  { id: 'vitamin_c',         name: 'Vitamin C Infusion',                 url: '/vitamin-c-iv-guide',                keywords: ['vitamin c', 'vit c', 'ascorbic', 'high dose vitamin c', 'vitamin c iv'] },
  { id: 'glutathione',       name: 'Glutathione IV',                     url: '/glutathione-iv-guide',              keywords: ['glutathione', 'antioxidant', 'detox', 'glutathione iv'] },
  { id: 'cellular_reset',    name: '6-Week Cellular Reset',              url: '/cellular-reset-guide',              keywords: ['cellular reset', '6 week reset', 'reset package', 'reset program'] },
  { id: 'the_blu',           name: 'The Blu',                            url: '/the-blu-guide',                     keywords: ['the blu', 'blu package', 'blu guide'] },

  // ── Hyperbaric Oxygen ──
  { id: 'hbot',              name: 'Hyperbaric Oxygen Therapy',          url: '/hbot-guide',                        keywords: ['hbot', 'hyperbaric', 'oxygen therapy', 'oxygen chamber', 'hyperbaric oxygen'] },
  { id: 'hbot_service',      name: 'Hyperbaric Oxygen Info',             url: '/hyperbaric-oxygen-therapy',         keywords: ['hbot service', 'hyperbaric page', 'hbot info'] },
  { id: 'hbot_membership',   name: 'HBOT Membership',                    url: '/hbot-membership-guide',             keywords: ['hbot membership', 'hyperbaric membership'] },

  // ── Red Light Therapy ──
  { id: 'red_light',         name: 'Red Light Therapy',                  url: '/red-light-guide',                   keywords: ['red light', 'rlt', 'photobiomodulation', 'infrared', 'red light therapy'] },
  { id: 'rlt_service',       name: 'Red Light Therapy Info',             url: '/red-light-therapy',                 keywords: ['red light service', 'rlt info page'] },
  { id: 'rlt_membership',    name: 'RLT Membership',                     url: '/rlt-membership-guide',              keywords: ['red light membership', 'rlt membership'] },

  // ── Hormone / HRT ──
  { id: 'hrt',               name: 'Hormone Replacement Therapy',        url: '/hrt-guide',                         keywords: ['hrt', 'hormone', 'testosterone', 'estrogen', 'hormones', 'hormone therapy', 'hormone replacement'] },
  { id: 'hrt_service',       name: 'Hormone Optimization Info',          url: '/hormone-optimization',              keywords: ['hormone optimization', 'hrt service page'] },
  { id: 'hrt_membership',    name: 'HRT Membership',                     url: '/hrt-membership',                    keywords: ['hrt membership', 'hormone membership'] },

  // ── Weight Loss ──
  { id: 'weight_loss',       name: 'Weight Loss Program',                url: '/weight-loss',                       keywords: ['weight loss', 'semaglutide', 'ozempic', 'wegovy', 'weight loss program'] },
  { id: 'tirzepatide',       name: 'Tirzepatide Guide',                  url: '/tirzepatide-guide',                 keywords: ['tirzepatide', 'mounjaro', 'zepbound', 'glp1', 'glp-1'] },
  { id: 'retatrutide',       name: 'Retatrutide Guide',                  url: '/retatrutide-guide',                 keywords: ['retatrutide', 'glp1 peptide', 'weight loss peptide'] },
  { id: 'wl_medication',     name: 'Weight Loss Medication Guide',       url: '/weight-loss-medication-guide-page', keywords: ['weight loss medication', 'wl medication', 'injection weight loss guide'] },

  // ── Peptides ──
  { id: 'peptides',          name: 'Peptide Therapy',                    url: '/peptide-therapy',                   keywords: ['peptide therapy', 'peptides', 'peptide service'] },
  { id: 'bpc_tb4',           name: 'BPC-157 / TB4',                      url: '/bpc-tb4-guide',                     keywords: ['bpc', 'bpc157', 'bpc-157', 'tb4', 'tb-4', 'tb500', 'thymosin', 'peptide healing'] },
  { id: 'glow',              name: 'GLOW Peptide',                       url: '/glow-guide',                        keywords: ['glow', 'skin peptide', 'collagen peptide', 'beauty peptide', 'glow guide'] },
  { id: 'ghk_cu',            name: 'GHK-Cu Peptide',                     url: '/ghk-cu-cream',                      keywords: ['ghk', 'ghk-cu', 'copper peptide', 'skin healing'] },
  { id: '3x_blend',          name: '3x Blend Peptide',                   url: '/3x-blend-guide',                    keywords: ['3x blend', 'three blend', 'peptide blend', 'peptide stack'] },
  { id: 'cjc_ipamorelin',    name: 'CJC-1295 / Ipamorelin',              url: '/cjc-ipamorelin-guide',              keywords: ['cjc', 'ipamorelin', 'cjc1295', 'growth hormone peptide', 'gh peptide'] },
  { id: 'mots_c',            name: 'MOTS-c',                             url: '/mots-c-guide',                      keywords: ['mots-c', 'mots c', 'mitochondrial peptide'] },
  { id: 'aod',               name: 'AOD-9604',                           url: '/aod-9604',                          keywords: ['aod', 'aod9604', 'aod-9604', 'fat loss peptide'] },
  { id: 'recovery_blend',    name: 'Recovery Blend',                     url: '/recovery-blend-guide',              keywords: ['recovery blend', 'recovery peptide'] },
  { id: 'understanding_peptides', name: 'Understanding Peptides',        url: '/understanding-peptides',            keywords: ['understanding peptides', 'peptide education', 'what are peptides', 'intro to peptides'] },

  // ── Memberships / Packages ──
  { id: 'combo_membership',  name: 'Combo Membership (HBOT + RLT)',      url: '/combo-membership-guide',            keywords: ['combo membership', 'combo', 'hbot rlt combo', 'hbot and rlt membership'] },

  // ── Labs ──
  { id: 'labs',              name: 'Lab Panels Overview',                url: '/lab-panels',                        keywords: ['labs', 'lab panels', 'bloodwork', 'blood test', 'panel overview'] },
  { id: 'essential_male',    name: 'Essential Panel — Male',             url: '/essential-panel-male-guide',        keywords: ['essential male', 'essential panel male', 'male labs', 'essential male panel'] },
  { id: 'essential_female',  name: 'Essential Panel — Female',           url: '/essential-panel-female-guide',      keywords: ['essential female', 'essential panel female', 'female labs', 'essential female panel'] },
  { id: 'elite_male',        name: 'Elite Panel — Male',                 url: '/elite-panel-male-guide',            keywords: ['elite male', 'elite panel male', 'elite labs male', 'elite male panel'] },
  { id: 'elite_female',      name: 'Elite Panel — Female',               url: '/elite-panel-female-guide',          keywords: ['elite female', 'elite panel female', 'elite labs female', 'elite female panel'] },

  // ── Other Services ──
  { id: 'exosome',           name: 'Exosome Therapy',                    url: '/exosome-therapy',                   keywords: ['exosome', 'exosome therapy', 'stem cell exosome'] },
  { id: 'prp',               name: 'PRP Therapy',                        url: '/prp-therapy',                       keywords: ['prp', 'platelet rich plasma', 'prp therapy'] },
  { id: 'methylene_blue_oral', name: 'Methylene Blue (Oral)',            url: '/methylene-blue',                    keywords: ['oral methylene blue', 'methylene blue oral', 'mb oral'] },
  { id: 'injury_recovery',   name: 'Injury Recovery',                    url: '/injury-recovery',                   keywords: ['injury', 'recovery', 'injury recovery', 'sports injury', 'ortho recovery'] },
  { id: 'services',          name: 'All Services',                       url: '/services',                          keywords: ['all services', 'services overview', 'what do you offer', 'service list', 'everything'] },
];

// Fuzzy-match a natural language string to the best document in DOCUMENT_CATALOG
function resolveDocument(query) {
  const q = (query || '').toLowerCase();
  // Exact keyword match first
  for (const doc of DOCUMENT_CATALOG) {
    if (doc.keywords.some(k => q.includes(k))) return doc;
  }
  // Fallback: partial name match
  for (const doc of DOCUMENT_CATALOG) {
    if (doc.name.toLowerCase().split(/\s+/).some(word => word.length > 3 && q.includes(word))) return doc;
  }
  return null;
}

async function handleSendDocument(params) {
  try {
    const { patient_name, document, method = 'sms' } = params;

    if (!patient_name) return '❌ Who should I send this to? Try: "Send hyperbaric guide to John Smith"';
    if (!document)     return '❌ What document should I send? Try: "Send HBOT guide to John Smith"';

    // Resolve document
    const doc = resolveDocument(document);
    if (!doc) {
      const options = DOCUMENT_CATALOG.map(d => `• ${d.name}`).join('\n');
      return `❌ I couldn't find a document matching "${document}". Available documents:\n${options}`;
    }

    // Find patient
    const patient = await findPatient(patient_name);
    if (!patient) {
      return `❌ Patient "${patient_name}" not found. Check the spelling or try their last name.`;
    }
    const patientFullName = `${patient.first_name} ${patient.last_name}`;
    const firstName = patient.first_name;
    const fullUrl = `https://range-medical.com${doc.url}`;

    if (method === 'sms') {
      if (!patient.phone) {
        return `❌ ${patientFullName} doesn't have a phone number on file. Try email instead.`;
      }
      const phone = normalizePhone(patient.phone);
      const message = `Hi ${firstName}! We wanted to share some info about ${doc.name}:\n\n${fullUrl}\n\nFeel free to call or text us at (949) 997-3988 with any questions.\n\n- Range Medical`;
      const result = await sendSMS({ to: phone, message });
      if (!result.success) return `❌ SMS failed: ${result.error}`;
      await logComm({
        channel: 'sms',
        messageType: 'staff_bot_document',
        message,
        source: 'staff-bot(send_document)',
        patientId: patient.id,
        patientName: patientFullName,
        recipient: phone,
        direction: 'outbound',
        provider: result.provider || null,
        twilioMessageSid: result.messageSid || null,
      }).catch(() => {});
      return `✅ Sent "${doc.name}" to ${patientFullName} via SMS (${patient.phone})`;
    }

    if (method === 'email') {
      if (!patient.email) {
        return `❌ ${patientFullName} doesn't have an email on file. Try SMS instead.`;
      }
      const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<div style="background:#000;padding:24px;text-align:center"><h1 style="color:#fff;margin:0;font-size:20px;letter-spacing:0.1em">RANGE MEDICAL</h1></div>
<div style="padding:32px 0">
<p>Hi ${firstName},</p>
<p>Here's the information about <strong>${doc.name}</strong> from Range Medical:</p>
<p><a href="${fullUrl}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px">View ${doc.name}</a></p>
<p style="color:#666;font-size:13px">Have questions? Call or text us at (949) 997-3988.</p>
</div>
<div style="border-top:1px solid #eee;padding-top:16px;color:#999;font-size:12px">
<p>Range Medical · 1901 Westcliff Dr, Suite 10 · Newport Beach, CA · range-medical.com</p>
</div></body></html>`;

      const { error } = await resend.emails.send({
        from: 'Range Medical <noreply@range-medical.com>',
        to: patient.email,
        subject: `${doc.name} — Range Medical`,
        html,
      });
      if (error) return `❌ Email failed: ${error.message}`;
      return `✅ Sent "${doc.name}" to ${patientFullName} via email (${patient.email})`;
    }

    return `❌ Method must be "sms" or "email". Got: "${method}"`;
  } catch (err) {
    console.error('send_document error:', err);
    return `❌ Send document error: ${err.message}`;
  }
}

async function handleSendForms(params) {
  try {
    const { patient_name, bundle_type } = params;

    if (!patient_name) {
      return `❌ Who should I send the forms to? Try: "Send blood draw forms to John Smith"`;
    }

    // Resolve form IDs from bundle type
    const formIds = FORM_BUNDLE_MAP[bundle_type] || FORM_BUNDLE_MAP['new-patient'];

    // Look up patient
    const patient = await findPatient(patient_name);
    if (!patient) {
      return (
        `❌ No patient found for "${patient_name}".\n` +
        `Make sure the name matches what's in the system.`
      );
    }

    const fullName = `${patient.first_name} ${patient.last_name}`;
    const phone = patient.phone;
    const email = patient.email;

    if (!phone && !email) {
      return `❌ ${fullName} has no phone or email on file. Add contact info first.`;
    }

    // Create form bundle
    const bundle = await createFormBundle({
      formIds,
      patientId: patient.id,
      patientName: fullName,
      patientEmail: email || null,
      patientPhone: phone || null,
      ghlContactId: patient.ghl_contact_id || null,
    });

    // Build friendly form list
    const formNames = formIds.map((id) => FORM_DEFINITIONS[id]?.name || id).join(', ');

    // Deliver via SMS if phone available
    if (phone) {
      const normalized = normalizePhone(phone.replace(/\D/g, '').slice(-10));
      if (normalized) {
        const msg =
          `Hi ${patient.first_name}! Range Medical here. ` +
          `Please complete your forms before your visit:\n\n${bundle.url}`;

        const smsResult = await sendSMS({ to: normalized, message: msg }).catch((e) => {
          console.warn('Staff-bot SMS send failed:', e.message);
          return { success: false };
        });
        if (smsResult.success !== false) {
          await logComm({
            channel: 'sms',
            messageType: 'staff_bot_forms',
            message: msg,
            source: 'staff-bot(send_forms)',
            patientId: patient.id,
            patientName: fullName,
            recipient: normalized,
            direction: 'outbound',
            provider: smsResult.provider || null,
            twilioMessageSid: smsResult.messageSid || null,
          }).catch(() => {});
        }
      }
    }

    // Summary back to staff
    const sentVia = phone ? `📱 ${phone}` : `📧 ${email}`;
    return (
      `✅ Forms sent to ${fullName}\n` +
      `${sentVia}\n\n` +
      `📋 Forms: ${formNames}\n` +
      `🔗 ${bundle.url}`
    );
  } catch (err) {
    console.error('send_forms error:', err);
    return `❌ Form send error: ${err.message}`;
  }
}

function handleHelp(staffName) {
  return (
    `👋 Hi ${staffName}! Range Medical Assistant\n\n` +
    `🗓 AVAILABILITY\n"Is there a Range IV slot tomorrow at 2pm?"\n\n` +
    `📌 BOOK\n"Book Range IV for [Patient] on [date] at [time]"\n\n` +
    `📋 SEND FORMS\n"Send new patient onboarding to [Patient]"\n"Send blood draw forms to [Patient]"\n"Send peptide/IV/HRT/HBOT/weight loss forms to [Patient]"\n\n` +
    `💰 BILLING\n"What did we charge [Patient Name]?"\n\n` +
    `📝 NOTE\n"Add note to [Patient]: [note text]"\n\n` +
    `✅ TASK\n"Create task for [Staff]: [task] due [date]"\n\n` +
    `📅 SCHEDULE\n"What's on the schedule today/tomorrow?"\n\n` +
    `🔍 PATIENT\n"Look up [Patient Name]"`
  );
}

// ================================================================
// GET PATIENT PROTOCOLS
// Returns active (and optionally all) protocols for a patient
function deriveCategory(protocol) {
  const pt = (protocol.program_type || protocol.program_name || '').toLowerCase();
  if (pt.includes('hrt') || pt.includes('testosterone') || pt.includes('hormone')) return 'HRT';
  if (pt.includes('weight') || pt.includes('glp') || pt.includes('tirzepatide') || pt.includes('semaglutide')) return 'Weight Loss';
  if (pt.includes('peptide') || pt.includes('bpc') || pt.includes('tb-500') || pt.includes('recovery') || pt.includes('month_program') || pt.includes('jumpstart') || pt.includes('maintenance_4week') || pt.includes('gh_peptide')) return 'Peptide';
  if (pt.includes('iv') || pt.includes('infusion')) return 'IV';
  if (pt.includes('hbot') || pt.includes('hyperbaric')) return 'HBOT';
  if (pt.includes('rlt') || pt.includes('red_light') || pt.includes('red light')) return 'RLT';
  if (pt.includes('injection') || pt.includes('b12') || pt.includes('vitamin') || pt.includes('nad')) return 'Injection';
  if (pt.includes('lab')) return 'Labs';
  // Fall back to checking medication name
  const med = (protocol.medication || '').toLowerCase();
  if (med.includes('nad')) return 'Injection';
  if (med.includes('b12') || med.includes('lipo') || med.includes('taurine') || med.includes('toradol') || med.includes('glutathione')) return 'Injection';
  if (med.includes('semaglutide') || med.includes('tirzepatide') || med.includes('retatrutide')) return 'Weight Loss';
  if (med.includes('testosterone') || med.includes('estradiol') || med.includes('progesterone')) return 'HRT';
  if (med.includes('bpc') || med.includes('tb-500') || med.includes('recovery') || med.includes('glow') || med.includes('ghk')) return 'Peptide';
  return 'Other';
}

async function handleGetPatientProtocols(params) {
  try {
    const { patient_name, include_inactive } = params;
    if (!patient_name) return '❌ Patient name is required.';

    const patient = await findPatient(patient_name);
    if (!patient) return `❌ Patient "${patient_name}" not found.`;
    const patientName = `${patient.first_name} ${patient.last_name}`;

    let query = supabase
      .from('protocols')
      .select('*')
      .eq('patient_id', patient.id)
      .order('start_date', { ascending: false });

    if (!include_inactive) {
      query = query.in('status', ['active', 'paused']);
    }

    const { data: protocols, error } = await query;
    if (error) throw error;

    if (!protocols || protocols.length === 0) {
      return `📋 No ${include_inactive ? '' : 'active '}protocols found for **${patientName}**.`;
    }

    const lines = [`📋 Protocols for **${patientName}**:\n`];

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
    const today = new Date().toISOString().split('T')[0];

    for (const p of protocols) {
      const statusEmoji = p.status === 'active' ? '🟢' : p.status === 'paused' ? '🟡' : '⚪';
      const displayName = p.program_name || p.medication || 'Unnamed protocol';
      const categoryLabel = deriveCategory(p);
      const dose = p.selected_dose || p.current_dose || p.dosing || '';
      const totalSessions = p.sessions_total || p.total_sessions;
      const usedSessions = p.sessions_completed || p.sessions_used || 0;

      lines.push(`${statusEmoji} **${displayName}** (${categoryLabel})`);
      if (dose) lines.push(`   Dose: ${dose}`);
      if (p.frequency) lines.push(`   Frequency: ${p.frequency}`);
      if (p.injection_schedule) lines.push(`   Schedule: ${p.injection_schedule}`);
      if (totalSessions) {
        lines.push(`   Sessions: ${usedSessions}/${totalSessions}`);
      }
      if (p.start_date) lines.push(`   Started: ${fmtDate(p.start_date)}`);
      if (p.last_refill_date) lines.push(`   Last pickup: ${fmtDate(p.last_refill_date)}`);
      if (p.next_expected_date) {
        const overdue = p.next_expected_date < today;
        const daysUntil = Math.round((new Date(p.next_expected_date) - new Date(today)) / 86400000);
        const label = overdue ? `⚠️ OVERDUE (${Math.abs(daysUntil)}d ago)` : daysUntil <= 7 ? `⏰ ${fmtDate(p.next_expected_date)} (in ${daysUntil}d)` : fmtDate(p.next_expected_date);
        lines.push(`   Next refill: ${label}`);
      }
      if (p.next_lab_date) lines.push(`   Next labs: ${fmtDate(p.next_lab_date)}`);
      if (p.indication) lines.push(`   Indication: ${p.indication}`);
      if (p.notes) lines.push(`   Notes: ${p.notes}`);
      lines.push('');
    }

    return lines.join('\n').trim();
  } catch (err) {
    console.error('get_patient_protocols error:', err);
    return `❌ Protocol lookup error: ${err.message}`;
  }
}

// ================================================================
// GET PATIENT APPOINTMENTS
// Returns upcoming (and optionally past) bookings for a patient
async function handleGetPatientAppointments(params) {
  try {
    const { patient_name, include_past, limit: rawLimit } = params;
    if (!patient_name) return '❌ Patient name is required.';

    const patient = await findPatient(patient_name);
    if (!patient) return `❌ Patient "${patient_name}" not found.`;
    const patientName = `${patient.first_name} ${patient.last_name}`;

    const maxRows = Math.min(parseInt(rawLimit) || 10, 20);
    const now = new Date().toISOString();

    let query = supabase
      .from('calcom_bookings')
      .select('id, service_name, start_time, end_time, status, staff_name, location, notes')
      .eq('patient_id', patient.id)
      .not('status', 'eq', 'cancelled')
      .order('start_time', { ascending: !include_past })
      .limit(maxRows);

    if (!include_past) {
      query = query.gte('start_time', now);
    } else {
      query = query.lte('start_time', now);
    }

    const { data: bookings, error } = await query;
    if (error) throw error;

    if (!bookings || bookings.length === 0) {
      return `📅 No ${include_past ? 'past' : 'upcoming'} appointments found for **${patientName}**.`;
    }

    const label = include_past ? 'Past appointments' : 'Upcoming appointments';
    const lines = [`📅 ${label} for **${patientName}**:\n`];

    for (const b of bookings) {
      const dt = new Date(b.start_time).toLocaleDateString('en-US', {
        timeZone: 'America/Los_Angeles',
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      });
      const time = new Date(b.start_time).toLocaleTimeString('en-US', {
        timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit',
      });
      const statusEmoji = b.status === 'confirmed' || b.status === 'scheduled' ? '🗓' : b.status === 'completed' ? '✅' : '⚪';
      lines.push(`${statusEmoji} **${b.service_name}** — ${dt} at ${time}`);
      if (b.staff_name) lines.push(`   Provider: ${b.staff_name}`);
      if (b.location) lines.push(`   Location: ${b.location}`);
      if (b.notes) lines.push(`   Notes: ${b.notes}`);
      lines.push('');
    }

    return lines.join('\n').trim();
  } catch (err) {
    console.error('get_patient_appointments error:', err);
    return `❌ Appointment lookup error: ${err.message}`;
  }
}

// ================================================================
// RESCHEDULE APPOINTMENT
// Moves a booking to a new date/time — updates Cal.com + DB + sends notifications
async function handleRescheduleAppointment(params) {
  try {
    const { patient_name, new_date, new_time, current_date, service_type } = params;

    if (!patient_name || !new_date || !new_time) {
      return '❌ Patient name, new date, and new time are all required to reschedule.';
    }

    // Look up patient
    const patient = await findPatient(patient_name);
    if (!patient) return `❌ Patient "${patient_name}" not found.`;
    const patientName = `${patient.first_name} ${patient.last_name}`;

    // Find their upcoming booking
    let query = supabase
      .from('calcom_bookings')
      .select('*')
      .eq('patient_id', patient.id)
      .in('status', ['scheduled', 'confirmed'])
      .order('start_time', { ascending: true })
      .limit(10);

    if (current_date) {
      const dayStart = new Date(current_date + 'T00:00:00-08:00').toISOString();
      const dayEnd   = new Date(current_date + 'T23:59:59-08:00').toISOString();
      query = query.gte('start_time', dayStart).lte('start_time', dayEnd);
    }

    const { data: bookings, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    if (!bookings || bookings.length === 0) {
      return `❌ No upcoming bookings found for **${patientName}**${current_date ? ` on ${current_date}` : ''}.`;
    }

    // Narrow by service if provided
    let booking = bookings[0];
    if (service_type && bookings.length > 1) {
      const match = bookings.find((b) =>
        b.service_name?.toLowerCase().includes(service_type.toLowerCase())
      );
      if (match) booking = match;
    }

    if (!booking.calcom_uid) {
      return `❌ This booking doesn't have a Cal.com UID on file — can't reschedule automatically. Please reschedule from the Cal.com dashboard.`;
    }

    // Build new ISO start in Pacific
    const newStart = toPacificISO(new_date, new_time);
    if (!newStart) return `❌ Invalid new date/time: ${new_date} ${new_time}`;

    // Validate not in the past
    if (new Date(newStart) < new Date()) {
      return `❌ Can't reschedule to the past — ${new_date} ${new_time} has already passed.`;
    }

    // Call Cal.com reschedule
    const rescheduleResult = await rescheduleBooking(booking.calcom_uid, newStart);
    if (!rescheduleResult || rescheduleResult.error) {
      return `❌ Cal.com reschedule failed: ${rescheduleResult?.error || 'unknown error'}`;
    }

    // Update DB
    const newEnd = rescheduleResult.end || new Date(new Date(newStart).getTime() + (booking.duration_minutes || 60) * 60 * 1000).toISOString();
    const newDateOnly = new_date;

    await supabase
      .from('calcom_bookings')
      .update({
        start_time: newStart,
        end_time: newEnd,
        booking_date: newDateOnly,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id);

    // Send patient notification — rescheduled
    try {
      await sendAppointmentNotification({
        type: 'rescheduled',
        patientId: patient.id,
        patientName: patientName,
        patientPhone: patient.phone || booking.patient_phone,
        patientEmail: patient.email || booking.patient_email,
        serviceName: booking.service_name,
        startTime: newStart,
        providerName: booking.staff_name,
      });
    } catch (notifErr) {
      console.error('Reschedule notification error:', notifErr);
    }

    // Send provider email if we have one
    if (booking.staff_email) {
      const newDt = new Date(newStart).toLocaleDateString('en-US', {
        timeZone: 'America/Los_Angeles',
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      });
      const newTm = new Date(newStart).toLocaleTimeString('en-US', {
        timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit',
      });
      try {
        await resend.emails.send({
          from: 'Range Medical <noreply@range-medical.com>',
          replyTo: 'info@range-medical.com',
          to: booking.staff_email,
          subject: `Appointment Rescheduled — ${patientName}`,
          html: `<p>Hi ${booking.staff_name || 'there'},</p><p>The following appointment has been rescheduled:</p><ul><li><strong>Patient:</strong> ${patientName}</li><li><strong>Service:</strong> ${booking.service_name}</li><li><strong>New Date/Time:</strong> ${newDt} at ${newTm}</li></ul><p>— Range Medical System</p>`,
        });
      } catch (emailErr) {
        console.error('Provider reschedule email error:', emailErr);
      }
    }

    const newDt = new Date(newStart).toLocaleDateString('en-US', {
      timeZone: 'America/Los_Angeles',
      weekday: 'long', month: 'short', day: 'numeric',
    });
    const newTm = new Date(newStart).toLocaleTimeString('en-US', {
      timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit',
    });

    return `✅ Rescheduled: **${booking.service_name}** for **${patientName}** → **${newDt} at ${newTm}**.\n\nNotifications sent to the patient${booking.staff_name ? ` and ${booking.staff_name}` : ''}.`;
  } catch (err) {
    console.error('reschedule_appointment error:', err);
    return `❌ Reschedule error: ${err.message}`;
  }
}

// ================================================================
// MAIN ENTRY POINT
// ================================================================
// SEARCH KNOWLEDGE BASE
// On-demand SOP/procedure lookup — replaces bulk injection into system prompt.
// Searches title and content using case-insensitive keyword matching.
// Returns up to 3 most relevant entries so the bot can answer staff questions
// about protocols, pre/post-service instructions, and clinic policies.
// ================================================================

async function handleSearchKnowledge({ query }) {
  try {
    if (!query || !query.trim()) {
      return '❌ Please provide a search query.';
    }

    const q = query.trim();

    // Try full-text search first (requires ts_vector column), fall back to ilike
    // We use ilike on both title and content for simplicity and reliability.
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 5);

    // Build an OR filter across title and content for each term
    // Supabase doesn't support full-text OR natively in .or() across columns easily,
    // so we fetch a broader set and rank client-side.
    const { data: rows, error } = await supabase
      .from('sop_knowledge')
      .select('category, title, content')
      .eq('active', true)
      .neq('category', 'patient_education')
      .or(terms.map(t => `title.ilike.%${t}%,content.ilike.%${t}%`).join(','))
      .order('sort_order')
      .limit(10);

    if (error) throw error;

    if (!rows || rows.length === 0) {
      return `No knowledge base entries found for: "${q}". Try different keywords.`;
    }

    // Score each result by how many search terms appear in title (weighted 3x) + content
    const scored = rows.map(r => {
      const titleL = (r.title || '').toLowerCase();
      const contentL = (r.content || '').toLowerCase();
      const score = terms.reduce((s, t) => {
        return s + (titleL.includes(t) ? 3 : 0) + (contentL.includes(t) ? 1 : 0);
      }, 0);
      return { ...r, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 3);

    const categoryLabels = {
      pre_service:  'Pre-Service',
      post_service: 'Post-Service',
      clinical:     'Clinical Protocol',
      protocol:     'Protocol',
      admin:        'Admin / Operations',
      faq:          'FAQ',
      general:      'General',
    };

    const parts = top.map(e => {
      const cat = categoryLabels[e.category] || e.category;
      // Trim content to 1500 chars max per entry to stay token-efficient
      const body = e.content.length > 1500
        ? e.content.slice(0, 1500) + '\n[...truncated]'
        : e.content;
      return `── ${e.title} (${cat}) ──\n${body}`;
    });

    return parts.join('\n\n');
  } catch (err) {
    console.error('search_knowledge error:', err);
    return `❌ Knowledge search error: ${err.message}`;
  }
}

// Named exports so the Claude tool-calling API can invoke handlers directly
export {
  handleCheckAvailability,
  handleBookAppointment,
  handleCancelAppointment,
  handleSendForms,
  handleQueryBilling,
  handleAddNote,
  handleCreateTask,
  handleGetSchedule,
  handleLookupPatient,
  handleGetServiceInfo,
  handleGetAvailableProviders,
  handleGetPatientProtocols,
  handleGetPatientAppointments,
  handleRescheduleAppointment,
  handleSendDocument,
  handleSearchKnowledge,
  findPatient,
  DOCUMENT_CATALOG,
};

// ================================================================

export async function handleStaffMessage(messageText, staff) {
  console.log(`[StaffBot] ${staff.name} (${staff.phone}): "${messageText}"`);

  const parsed = await parseIntent(messageText, staff.name);
  console.log(`[StaffBot] Intent: ${parsed.intent}`, JSON.stringify(parsed.params));

  switch (parsed.intent) {
    case 'check_availability':
      return await handleCheckAvailability(parsed.params);
    case 'book_appointment':
      return await handleBookAppointment(parsed.params);
    case 'send_forms':
      return await handleSendForms(parsed.params);
    case 'query_billing':
      return await handleQueryBilling(parsed.params);
    case 'add_note':
      return await handleAddNote(parsed.params, staff);
    case 'create_task':
      return await handleCreateTask(parsed.params, staff);
    case 'get_schedule':
      return await handleGetSchedule(parsed.params);
    case 'lookup_patient':
      return await handleLookupPatient(parsed.params);
    case 'help':
      return handleHelp(staff.name);
    default:
      return `❓ I didn't understand that. Say "help" to see available commands.`;
  }
}
