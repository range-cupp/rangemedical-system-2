// /lib/staff-bot.js
// Range Medical Staff SMS Bot
// Handles natural language commands from staff members via Blooio SMS
// Staff texts the clinic number → bot parses intent → queries/updates CRM → replies

import { createClient } from '@supabase/supabase-js';
import { getEventTypes, getAvailableSlots, createBooking, reassignBooking, cancelBooking } from './calcom';
import { sendBlooioMessage } from './blooio';
import { createFormBundle, FORM_DEFINITIONS } from './form-bundles';
import { sendSMS, normalizePhone } from './send-sms';

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

async function findEventType(serviceName) {
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

  // Exact or substring match
  return (
    allEvents.find(
      (et) =>
        et.title?.toLowerCase() === needle ||
        et.title?.toLowerCase().includes(needle) ||
        needle.includes(et.title?.toLowerCase())
    ) || null
  );
}

// ================================================================
// INTENT HANDLERS
// ================================================================

async function handleCheckAvailability(params) {
  try {
    const eventType = await findEventType(params.service);
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
    // Find patient
    const patient = await findPatient(params.patient_name);
    if (!patient) {
      return `❌ Patient "${params.patient_name}" not found in the CRM. Check the name and try again.`;
    }
    const patientName = `${patient.first_name} ${patient.last_name}`;

    // Find event type
    const eventType = await findEventType(params.service);
    if (!eventType) {
      return `❌ Service "${params.service}" not found on the calendar. Available services can be checked via Cal.com.`;
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
    const date = params.date;

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

    const lines = employees.map((e) => {
      const count = bookingCounts[e.name] || 0;
      const load = count === 0 ? 'open' : `${count} appt${count !== 1 ? 's' : ''} scheduled`;
      return `• ${e.name}${e.title ? ` (${e.title})` : ''} — ${load}`;
    });

    return (
      `Providers for ${formatDate(date)}:\n${lines.join('\n')}\n\n` +
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

    // Build query: match by patient name + non-cancelled status
    let query = supabase
      .from('calcom_bookings')
      .select('id, calcom_uid, patient_name, start_time, service_type, status')
      .ilike('patient_name', `%${patient_name}%`)
      .not('status', 'eq', 'cancelled')
      .order('start_time', { ascending: true });

    // Narrow by date if provided
    if (date) {
      const offset = getPacificOffset(date);
      const startOfDay = `${date}T00:00:00${offset}`;
      const endOfDay   = `${date}T23:59:59${offset}`;
      query = query.gte('start_time', startOfDay).lte('start_time', endOfDay);
    }

    // Narrow by service if provided
    if (service_type) {
      query = query.ilike('service_type', `%${service_type}%`);
    }

    const { data: bookings, error } = await query.limit(5);
    if (error) throw error;

    if (!bookings || bookings.length === 0) {
      const who = patient_name;
      const when = date ? ` on ${formatDate(date)}` : '';
      const what = service_type ? ` for ${service_type}` : '';
      return `❌ No active bookings found for ${who}${what}${when}. They may already be cancelled or not yet in the system.`;
    }

    // If multiple matches, return them so Claude can ask for confirmation
    if (bookings.length > 1 && !date && !service_type) {
      const list = bookings.map(b => {
        const dt = new Date(b.start_time).toLocaleString('en-US', {
          timeZone: 'America/Los_Angeles',
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit',
        });
        return `• ${b.service_type || 'Appointment'} on ${dt}`;
      }).join('\n');
      return `Found multiple upcoming bookings for ${patient_name}:\n${list}\n\nWhich one should I cancel?`;
    }

    const booking = bookings[0];

    // Cancel in Cal.com
    if (booking.calcom_uid) {
      const calResult = await cancelBooking(booking.calcom_uid, reason);
      if (calResult && calResult.error) {
        console.error('Cal.com cancel error:', calResult);
        // Don't block — still update local status
      }
    }

    // Update local record
    const { error: updateError } = await supabase
      .from('calcom_bookings')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', booking.id);

    if (updateError) throw updateError;

    const dt = new Date(booking.start_time).toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      weekday: 'long', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });

    return `✅ Cancelled: **${booking.service_type || 'Appointment'}** for **${booking.patient_name}** on **${dt}**.\n\nThe booking has been removed from Cal.com and marked cancelled in the system.`;
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

        await sendSMS({ to: normalized, message: msg }).catch((e) =>
          console.warn('Staff-bot SMS send failed:', e.message)
        );
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
// MAIN ENTRY POINT
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
  findPatient,
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
