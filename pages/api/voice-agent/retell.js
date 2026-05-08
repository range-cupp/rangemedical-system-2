// /pages/api/voice-agent/retell.js
// Retell.ai webhook endpoint for voice agent function calls.
// Retell invokes this URL when the agent calls a custom function during a
// conversation. We route to the appropriate handler and return the result.

import { createClient } from '@supabase/supabase-js';
import { getAvailableSlots as engineGetAvailableSlots, pickProviderForSlot } from '../../../lib/scheduling';
import { createAppointment } from '../../../lib/create-appointment';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TZ = 'America/Los_Angeles';

// Services that can be booked directly without a prior Range Assessment.
// Everything else (HRT, weight loss, peptides, testosterone, etc.) requires
// an assessment or labs first.
const DIRECT_BOOK_CATEGORIES = new Set(['iv', 'hbot', 'rlt', 'injection']);

const ASSESSMENT_REQUIRED_MSG =
  'That service requires a Range Assessment first so one of our providers can review your health history and build a personalized plan. ' +
  'The assessment is $197 and the full amount is credited toward your treatment, so it is essentially free if you move forward. ' +
  'Would you like me to book a Range Assessment for you instead?';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Retell sends: { call_id, function_name, arguments }
  // Some Retell versions wrap in an "args" key — handle both shapes
  const { call_id, function_name, arguments: funcArgs, args } = req.body;
  const params = funcArgs || args || {};

  try {
    let result;
    switch (function_name) {
      case 'check_availability':
        result = await handleCheckAvailability(params);
        break;
      case 'book_appointment':
        result = await handleBookAppointment(params);
        break;
      case 'get_service_info':
        result = await handleGetServiceInfo(params);
        break;
      default:
        result = { error: `Unknown function: ${function_name}` };
    }

    return res.status(200).json({ result: typeof result === 'string' ? result : JSON.stringify(result) });
  } catch (err) {
    console.error(`voice-agent/${function_name} error:`, err);
    return res.status(200).json({
      result: 'I ran into a technical issue checking that. Let me have someone from the team follow up with you.',
    });
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

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

function toPacificISO(dateStr, timeStr) {
  return `${dateStr}T${timeStr}:00${getPacificOffset(dateStr)}`;
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m}${ampm}`;
}

function slotToIso(slot) {
  if (!slot) return null;
  if (typeof slot === 'string') return slot;
  return slot.time || slot.start || slot.dateTime || null;
}

function slotToDisplayTime(slot) {
  const iso = slotToIso(slot);
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Maps natural language phrases callers might say to service slugs.
const SERVICE_ALIASES = {
  'hbot': 'hbot',
  'hyperbaric': 'hbot',
  'hyperbaric oxygen': 'hbot',
  'hyperbaric oxygen therapy': 'hbot',
  'oxygen chamber': 'hbot',
  'chamber': 'hbot',
  'range assessment': 'range-assessment-energy',
  'assessment': 'range-assessment-energy',
  'initial assessment': 'range-assessment-energy',
  'range iv': 'range-iv',
  'iv therapy': 'range-iv',
  'iv drip': 'range-iv',
  'nad': 'nad-iv-225',
  'nad+': 'nad-iv-225',
  'nad iv': 'nad-iv-225',
  'nad plus': 'nad-iv-225',
  'nad injection': 'nad-injection',
  'red light': 'red-light-therapy',
  'red light therapy': 'red-light-therapy',
  'rlt': 'red-light-therapy',
  'vitamin c': 'vitamin-c-iv-25g',
  'vitamin c iv': 'vitamin-c-iv-25g',
  'glutathione': 'glutathione-iv-1g',
  'glutathione iv': 'glutathione-iv-1g',
  'methylene blue': 'methylene-blue-iv',
  'methylene blue iv': 'methylene-blue-iv',
  'weight loss': 'injection-weight-loss',
  'weight loss injection': 'injection-weight-loss',
  'semaglutide': 'injection-weight-loss',
  'tirzepatide': 'injection-weight-loss',
  'testosterone': 'injection-testosterone',
  'testosterone injection': 'injection-testosterone',
  'peptide injection': 'injection-peptide',
  'peptide': 'injection-peptide',
  'b12': 'range-injections',
  'mic': 'range-injections',
  'mic injection': 'range-injections',
  'injection': 'range-injections',
  'blood draw': 'new-patient-blood-draw',
  'labs': 'new-patient-blood-draw',
  'lab work': 'new-patient-blood-draw',
  'dexa': 'dexa-scan',
  'dexa scan': 'dexa-scan',
  'prp': 'medical-procedure-prp',
  'mb combo': 'mb-combo-iv',
  'the blu': 'mb-combo-iv',
  'combo iv': 'mb-combo-iv',
};

async function findEventType(serviceName) {
  if (!serviceName) return null;
  const needle = serviceName.toLowerCase().trim();

  const { data: services, error } = await supabase
    .from('services')
    .select('id, slug, name, category, duration_minutes, group_label')
    .eq('is_active', true);
  if (error || !services) return null;

  // Check alias map first
  const aliasSlug = SERVICE_ALIASES[needle]
    || Object.entries(SERVICE_ALIASES).find(([key]) => needle.includes(key))?.[1];
  if (aliasSlug) {
    const aliasMatch = services.find((s) => s.slug === aliasSlug);
    if (aliasMatch) {
      return { id: aliasMatch.id, slug: aliasMatch.slug, title: aliasMatch.name, category: aliasMatch.category, length: aliasMatch.duration_minutes };
    }
  }

  // Fallback: direct name/slug matching
  const matches = services.filter(
    (s) =>
      s.name?.toLowerCase() === needle ||
      s.name?.toLowerCase().includes(needle) ||
      needle.includes(s.name?.toLowerCase()) ||
      s.slug?.toLowerCase() === needle.replace(/\s+/g, '-')
  );
  if (matches.length === 0) return null;

  const pick = matches[0];
  return { id: pick.id, slug: pick.slug, title: pick.name, category: pick.category, length: pick.duration_minutes };
}

async function findPatientByPhone(phone) {
  if (!phone) return null;
  const normalized = phone.replace(/\D/g, '').slice(-10);
  const { data: patient } = await supabase
    .from('patients')
    .select('id, first_name, last_name, email, phone')
    .ilike('phone', `%${normalized}`)
    .limit(1)
    .maybeSingle();
  return patient || null;
}

async function findPatientByName(name) {
  if (!name) return null;
  const parts = name.trim().split(/\s+/);
  const first = parts[0];
  const last = parts[parts.length - 1];

  const { data: patients } = await supabase
    .from('patients')
    .select('id, first_name, last_name, email, phone')
    .or(`first_name.ilike.${first}%,last_name.ilike.${last}%`)
    .limit(5);

  if (!patients || patients.length === 0) return null;

  const exact = patients.find(
    (p) => `${p.first_name} ${p.last_name}`.toLowerCase() === name.toLowerCase()
  );
  return exact || patients[0];
}

// ── Function Handlers ──────────────────────────────────────────────────────

async function handleCheckAvailability(params) {
  const { service, date, time } = params;
  if (!service || !date) {
    return 'I need the service name and date to check availability. What service are you interested in, and what day works for you?';
  }

  const eventType = await findEventType(service);
  if (!eventType) {
    return `I couldn't find a service matching "${service}". Our popular services include Range Assessment, Range IV, NAD+ IV, HBOT, Red Light Therapy, and Weight Loss consultations.`;
  }

  const slotsResult = await engineGetAvailableSlots({ serviceSlug: eventType.slug, date });
  const daySlots = slotsResult?.slots?.[date] || [];

  if (daySlots.length === 0) {
    return `Unfortunately there are no openings for ${eventType.title} on that date. Would you like me to check a different day?`;
  }

  if (time) {
    const isAvailable = daySlots.some((slot) => {
      const iso = slotToIso(slot);
      if (!iso) return false;
      const slotHHMM = new Date(iso).toLocaleTimeString('en-US', {
        timeZone: TZ,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      return slotHHMM === time;
    });

    if (isAvailable) {
      return `Great news — ${eventType.title} at ${formatTime(time)} on that date is available. Would you like me to book that for you?`;
    } else {
      const nearby = daySlots.slice(0, 5).map(slotToDisplayTime).filter(Boolean).join(', ');
      return `That specific time isn't available, but I do have openings at ${nearby}. Would any of those work?`;
    }
  }

  const displaySlots = daySlots.slice(0, 5).map(slotToDisplayTime).filter(Boolean).join(', ');
  return `For ${eventType.title} on that date, I have openings at ${displaySlots}. Which time works best for you?`;
}

async function handleBookAppointment(params) {
  const { service, date, time, patient_name, patient_phone } = params;

  if (!service || !date || !time) {
    return 'I need the service, date, and time to book. Could you confirm those details?';
  }
  if (!patient_name) {
    return 'I just need your full name to book the appointment. What name should I put it under?';
  }

  const eventType = await findEventType(service);
  if (!eventType) {
    return `I couldn't find a service matching "${service}". Could you clarify which service you'd like to book?`;
  }

  // Only IVs, HBOT, RLT, and injections can be booked directly.
  // Everything else (HRT, weight loss, peptides, etc.) requires an assessment first.
  const isAssessment = eventType.slug?.startsWith('range-assessment') || eventType.slug === 'initial-consultation' || eventType.category === 'assessment';
  if (!isAssessment && !DIRECT_BOOK_CATEGORIES.has(eventType.category)) {
    return ASSESSMENT_REQUIRED_MSG;
  }

  // Check the slot is still open
  const requestedStart = new Date(toPacificISO(date, time));
  if (requestedStart < new Date()) {
    return 'That time has already passed. Could you pick a future date and time?';
  }

  // Look up existing patient by phone or name
  let patient = null;
  if (patient_phone) {
    patient = await findPatientByPhone(patient_phone);
  }
  if (!patient && patient_name) {
    patient = await findPatientByName(patient_name);
  }

  const startISO = toPacificISO(date, time);
  const picked = await pickProviderForSlot({ serviceSlug: eventType.slug, startISO });
  if (!picked) {
    return `No providers are available for ${eventType.title} at that time. Would you like to try a different time?`;
  }
  const providerName = picked.displayLabel || picked.name;

  const durationMins = eventType.length || 60;
  const endISO = new Date(new Date(startISO).getTime() + durationMins * 60000).toISOString();

  const result = await createAppointment({
    patient_id: patient?.id || null,
    patient_name: patient ? `${patient.first_name} ${patient.last_name}` : patient_name,
    patient_phone: patient?.phone || patient_phone || null,
    service_name: eventType.title,
    service_slug: eventType.slug,
    provider: providerName,
    start_time: new Date(startISO).toISOString(),
    end_time: endISO,
    duration_minutes: durationMins,
    notes: 'Booked via website voice assistant',
    visit_reason: `Voice agent: ${eventType.title}`,
    source: 'voice_agent',
    created_by: 'voice_agent',
    send_notification: !!patient?.id,
  });

  const displayDate = new Date(startISO).toLocaleDateString('en-US', {
    timeZone: TZ,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return `You're all set! I've booked ${eventType.title} for ${patient ? `${patient.first_name} ${patient.last_name}` : patient_name} on ${displayDate} at ${formatTime(time)}. You'll receive a confirmation text with all the details.`;
}

async function handleGetServiceInfo(params) {
  const { service } = params;
  if (!service) {
    return 'Which service would you like to know about? We offer IV therapy, HBOT, Red Light Therapy, weight loss programs, hormone optimization, peptide therapy, and more.';
  }

  const needle = service.toLowerCase().trim();

  const { data: services } = await supabase
    .from('pos_services')
    .select('name, description, price_cents, category')
    .eq('active', true);

  if (!services) {
    return 'I had trouble looking that up. You can call or text us at (949) 997-3988 for pricing details.';
  }

  const matches = services.filter(
    (s) =>
      s.name?.toLowerCase().includes(needle) ||
      needle.includes(s.name?.toLowerCase()) ||
      s.category?.toLowerCase().includes(needle)
  );

  if (matches.length === 0) {
    return `I couldn't find a service matching "${service}". Our popular services include Range Assessment, IV Therapy, NAD+, HBOT, Red Light Therapy, and Weight Loss. Which one interests you?`;
  }

  const top = matches.slice(0, 5);
  const info = top.map((s) => {
    const price = s.price_cents ? `$${(s.price_cents / 100).toFixed(0)}` : 'pricing varies';
    return `${s.name}: ${price}`;
  }).join('. ');

  return info;
}
