// /pages/api/staff-bot/chat.js
// Range Medical Staff Assistant — Claude-powered with tool use
// Claude acts as the conversational brain; tools execute real CRM actions.

import { createClient } from '@supabase/supabase-js';
import {
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
} from '../../../lib/staff-bot';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Tool definitions (what Claude can call) ──────────────────────────────────

const TOOLS = [
  {
    name: 'check_availability',
    description: 'Check open appointment slots on the calendar for a given service and date.',
    input_schema: {
      type: 'object',
      properties: {
        service: { type: 'string', description: 'Service name, e.g. "Range IV", "Initial Consult", "HBOT"' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        time: { type: 'string', description: 'Optional preferred time in HH:MM 24hr format' },
        location: { type: 'string', description: 'Clinic location, e.g. "Newport Beach" or "Placentia". Required when the provider works at multiple locations.' },
      },
      required: ['service', 'date'],
    },
  },
  {
    name: 'book_appointment',
    description: 'Book an appointment on the calendar for a patient. If a specific nurse or provider is requested, pass their name in provider_name so it can be reassigned to them after booking.',
    input_schema: {
      type: 'object',
      properties: {
        service: { type: 'string', description: 'Service name, e.g. "Range IV"' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        time: { type: 'string', description: 'Time in HH:MM 24hr format' },
        patient_name: { type: 'string', description: 'Full name of the patient being treated' },
        provider_name: { type: 'string', description: 'Optional: name of the specific nurse or provider to assign this to, e.g. "Lily"' },
        location: { type: 'string', description: 'Clinic location, e.g. "Newport Beach" or "Placentia". Required when the provider works at multiple locations.' },
      },
      required: ['service', 'date', 'time', 'patient_name'],
    },
  },
  {
    name: 'cancel_appointment',
    description: 'Cancel an existing appointment for a patient. Looks up their booking by name and optionally by date or service, then cancels it in Cal.com and marks it cancelled in the system. Always confirm the specific appointment with the user before calling this.',
    input_schema: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: 'Full or partial name of the patient' },
        date: { type: 'string', description: 'Optional date in YYYY-MM-DD format to narrow down which booking' },
        service_type: { type: 'string', description: 'Optional service name to narrow down which booking, e.g. "Range IV"' },
        reason: { type: 'string', description: 'Optional reason for cancellation' },
      },
      required: ['patient_name'],
    },
  },
  {
    name: 'send_forms',
    description: `Send a form bundle link to a patient via SMS (and email if on file).
Bundle types and what they include:
- new-patient / onboarding: Medical Intake + HIPAA
- blood-draw / labs: Medical Intake + HIPAA + Blood Draw Consent
- iv / range-iv / injection: Medical Intake + HIPAA + IV/Injection Consent
- hrt / hormone / testosterone: Medical Intake + HIPAA + HRT Consent
- peptide / peptides: Medical Intake + HIPAA + Peptide Consent
- hbot / hyperbaric: Medical Intake + HIPAA + HBOT Consent
- weight-loss / semaglutide / tirzepatide: Medical Intake + HIPAA + Weight Loss Consent
- red-light / rlt: Medical Intake + HIPAA + Red Light Therapy Consent
- prp: Medical Intake + HIPAA + PRP Consent
- exosome: Medical Intake + HIPAA + Exosome IV Consent`,
    input_schema: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: 'Full name of the patient' },
        bundle_type: {
          type: 'string',
          description: 'Bundle key. Default to "new-patient" if unclear.',
          enum: [
            'new-patient', 'onboarding', 'blood-draw', 'labs', 'iv', 'iv-therapy',
            'range-iv', 'injection', 'hrt', 'hormone', 'testosterone', 'peptide',
            'peptides', 'hbot', 'hyperbaric', 'weight-loss', 'semaglutide',
            'tirzepatide', 'red-light', 'rlt', 'prp', 'exosome',
          ],
        },
      },
      required: ['patient_name', 'bundle_type'],
    },
  },
  {
    name: 'query_billing',
    description: 'Look up recent invoices and charges for a patient.',
    input_schema: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: 'Full name of the patient' },
      },
      required: ['patient_name'],
    },
  },
  {
    name: 'add_note',
    description: "Add a note to a patient's file.",
    input_schema: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: 'Full name of the patient' },
        note: { type: 'string', description: 'The note text to add' },
      },
      required: ['patient_name', 'note'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a task and assign it to a staff member. They get an SMS notification.',
    input_schema: {
      type: 'object',
      properties: {
        assigned_to: { type: 'string', description: 'First or full name of the staff member' },
        title: { type: 'string', description: 'Task description' },
        patient_name: { type: 'string', description: 'Optional patient this task is about' },
        due_date: { type: 'string', description: 'Optional due date in YYYY-MM-DD format' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      },
      required: ['assigned_to', 'title'],
    },
  },
  {
    name: 'get_schedule',
    description: 'Get the appointment schedule for a specific date.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
      },
      required: ['date'],
    },
  },
  {
    name: 'lookup_patient',
    description: 'Look up a patient by name — returns contact info and basic details.',
    input_schema: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: 'Full or partial name of the patient' },
      },
      required: ['patient_name'],
    },
  },
  {
    name: 'get_available_providers',
    description: 'Get the list of providers who can perform a specific service on a given date. Filters to only staff who are hosts on that Cal.com event type — so only qualified providers are shown. Always pass the service name so the list is accurate.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        service: { type: 'string', description: 'Service name to filter providers by, e.g. "Range IV". Always pass this.' },
        location: { type: 'string', description: 'Optional location, e.g. "Newport Beach" or "Placentia"' },
      },
      required: ['date', 'service'],
    },
  },
  {
    name: 'get_service_info',
    description: 'Look up live pricing and descriptions for clinic services from the POS catalog. Use this to answer questions about how much something costs or what a service includes.',
    input_schema: {
      type: 'object',
      properties: {
        service_name: {
          type: 'string',
          description: 'Service or category to look up. Leave blank to get all active services.',
        },
      },
      required: [],
    },
  },
];

// ── Execute a tool call from Claude ─────────────────────────────────────────

async function executeTool(toolName, toolInput, staff) {
  console.log(`[StaffBot] Tool: ${toolName}`, JSON.stringify(toolInput));
  switch (toolName) {
    case 'check_availability':   return await handleCheckAvailability(toolInput);
    case 'book_appointment':     return await handleBookAppointment(toolInput);
    case 'cancel_appointment':   return await handleCancelAppointment(toolInput);
    case 'send_forms':           return await handleSendForms(toolInput);
    case 'query_billing':        return await handleQueryBilling(toolInput);
    case 'add_note':             return await handleAddNote(toolInput, staff);
    case 'create_task':          return await handleCreateTask(toolInput, staff);
    case 'get_schedule':         return await handleGetSchedule(toolInput);
    case 'lookup_patient':       return await handleLookupPatient(toolInput);
    case 'get_available_providers': return await handleGetAvailableProviders(toolInput);
    case 'get_service_info':     return await handleGetServiceInfo(toolInput);
    default:                     return `Unknown tool: ${toolName}`;
  }
}

// ── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(staff) {
  const now = new Date();

  // All date logic anchored to Pacific time — Vercel runs UTC so we must derive
  // the Pacific calendar date first, then build a noon anchor from it.
  // Using noon avoids any DST boundary issues.
  const todayISO = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); // YYYY-MM-DD in Pacific
  const today = now.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeNow = now.toLocaleTimeString('en-US', {
    timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit',
  });

  // pacificAnchor = noon on today's Pacific date. getDay() on this is always
  // the correct Pacific weekday regardless of what the server's UTC clock says.
  const pacificAnchor = new Date(todayISO + 'T12:00:00');
  const currentDayPacific = pacificAnchor.getDay();

  const tomorrowAnchor = new Date(pacificAnchor);
  tomorrowAnchor.setDate(tomorrowAnchor.getDate() + 1);
  const tomorrowISO = tomorrowAnchor.toLocaleDateString('en-CA');

  // "This [day]" = nearest upcoming occurrence (always at least 1 day in the future)
  function thisWeekday(dayIndex) {
    const d = new Date(pacificAnchor);
    let diff = dayIndex - currentDayPacific;
    if (diff <= 0) diff += 7;
    d.setDate(d.getDate() + diff);
    return d.toLocaleDateString('en-CA');
  }
  // "Next [day]" = ALWAYS 7 days after thisWeekday (the following week)
  function nextWeekday(dayIndex) {
    const d = new Date(thisWeekday(dayIndex) + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString('en-CA');
  }

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const thisWeekDates = Object.fromEntries(days.map((d,i) => [d, thisWeekday(i)]));
  const nextWeekDates = Object.fromEntries(days.map((d,i) => ['Next '+d, nextWeekday(i)]));

  return `You are the Range Medical staff assistant — a smart, concise AI helper for the clinic team at Range Medical in Newport Beach, CA.

Today is ${today} (${todayISO}). Current time: ${timeNow} Pacific.
Tomorrow = ${tomorrowISO}.
THIS week: ${Object.entries(thisWeekDates).map(([d,iso]) => `${d}=${iso}`).join(', ')}.
NEXT week: ${Object.entries(nextWeekDates).map(([d,iso]) => `${d}=${iso}`).join(', ')}.
DATE RULES: "Tuesday" or "this Tuesday" = ${thisWeekDates['Tuesday']}. "Next Tuesday" = ${nextWeekDates['Next Tuesday']}. Always use the NEXT WEEK date when the user says "next [day]".
You are assisting: ${staff.name}${staff.title ? ` (${staff.title})` : ''}.

SERVICES: Range IV, specialty drips, HBOT (hyperbaric oxygen), Red Light Therapy (RLT), HRT (hormone/testosterone replacement), Peptide therapy, Weight loss (semaglutide/tirzepatide), PRP, Exosome IV, Lab panels (Essential $350 / Elite $750), Initial consult.

── LOCATIONS ────────────────────────────────────────────────────────
Range Medical has two locations:
  - Newport Beach (default) — 1901 Westcliff Drive, Suite 10
  - Placentia — separate Cal.com event types (slugs/titles contain "placentia" or "tlab")

LOCATION RULES:
  - Default is always Newport Beach unless stated otherwise.
  - Lily Diaz (RN) works Monday mornings at PLACENTIA ONLY. She is NOT available at Newport Beach on Mondays.
  - If someone requests Lily at Newport Beach on a Monday, DO NOT check availability or proceed with the booking.
    Instead say: "Lily is at Placentia on Monday mornings and is not available at Newport Beach. Would you like to:
    1. Book Lily at Placentia on Monday, or
    2. Book with Damien Burgess at Newport Beach instead?"
    Wait for their answer before doing anything else.
  - On any other day, Lily is at Newport Beach (default).
  - Whenever booking Lily on a Monday AND the location has not been specified, STOP and ask:
    "Is this for Newport Beach or Placentia?" — wait for the answer before calling check_availability or book_appointment.
  - Always pass the confirmed location in the "location" field of check_availability and book_appointment.
  - If any other provider works at multiple locations and the user hasn't specified, ask the same question.

── BOOKING WORKFLOW (follow every time, in order) ──────────────────
PROVIDER vs PATIENT — critical distinction:
  - "Book WITH Nurse Lily" / "with Lily" → Lily is the PROVIDER (nurse/staff doing the treatment), NOT the patient.
  - The patient is the person being treated. If unclear who the patient is, ask once.

1. PATIENT: If given only a first name or partial name, call lookup_patient first.
   - 1 match → proceed.
   - 2+ matches → list them, ask "Which one?" — wait for reply.
   - 0 matches → say so, ask for clarification.

2. PROVIDER: Call get_available_providers with the service name AND date (and location if known).
   - This filters to only providers who actually perform that service — always pass service.
   - Present the list: "Available providers for [service] on [day]: [names]. Who should I book with?"
   - Wait for the staff member to pick one before proceeding.
   - If staff member already specified a provider → skip the question, just verify they're on the list.

3. AVAILABILITY: Call check_availability for the service + date.
   - If the exact time IS available → proceed to step 4.
   - If NOT available → show 3 closest slots, ask which works. Wait for reply.

4. CONFIRM: Before calling book_appointment, always show a confirmation:
   "Ready to book:
   👤 [Patient name]
   🏥 [Service]
   📅 [Day, Date] at [time]
   👩‍⚕️ [Provider]
   Confirm? (yes/no)"
   Wait for "yes" or "confirm" before booking.

5. BOOK: Call book_appointment. Report EXACT error text if it fails — do not soften it.
   On success: "✅ Booked — [Patient], [Service], [Day] at [time] with [Provider]."

Never skip any step. Never call book_appointment without a confirmed "yes."
─────────────────────────────────────────────────────────────────────

PRICING & SERVICES:
- Use get_service_info to look up live pricing from the POS catalog.
- Known pricing (use as fallback): Essential Lab Panel $350 | Elite Lab Panel $750 | HRT Membership $250/month (includes meds, labs, 1 IV/month) | Range IV $225 | Initial Consult (free assessment) | HBOT (check POS) | RLT (check POS) | Weight loss medications (check POS).
- Lab panels: Essential covers hormones, thyroid, metabolic, lipids, CBC, vitamins. Elite adds cardiovascular markers (Lp(a), ApoB), inflammation (homocysteine), advanced metabolic, and more biomarkers.
- When asked about a service (e.g. "what is HBOT?"), answer from your knowledge of the clinic, then offer to pull current pricing with get_service_info.

GENERAL BEHAVIOR:
- Be direct and efficient. Staff are busy — get to the point.
- Understand natural phrasing. "Hey could you send Chris Cupp the new patient forms" → send_forms, patient "Chris Cupp", bundle "new-patient".
- Dates: resolve "tomorrow", "Monday", "next Friday" using the date table above.
- Only ask a follow-up question when genuinely stuck. One question at a time.
- Emoji status indicators are fine (✅ ❌ 📋 📅). Don't overuse them.
- Stay focused on clinic operations. Redirect off-topic requests politely.`;
}

// ── Main API handler ─────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Auth
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid or expired session' });

    // Employee
    const { data: employee } = await supabase
      .from('employees')
      .select('id, name, title, is_admin, phone, calcom_user_id, permissions')
      .eq('email', user.email)
      .eq('is_active', true)
      .maybeSingle();
    if (!employee) return res.status(403).json({ error: 'No active employee account found' });

    // Message + conversation history
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build initial messages array from history + new user message
    const loopMessages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ];

    const systemPrompt = buildSystemPrompt(employee);

    // ── Agentic loop: Claude → tool calls → results → Claude ────────────────
    let finalResponse = null;
    const MAX_ITERATIONS = 6;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: systemPrompt,
          tools: TOOLS,
          messages: loopMessages,
        }),
      });

      if (!claudeRes.ok) {
        const errText = await claudeRes.text();
        console.error('Claude API error:', claudeRes.status, errText);
        throw new Error(`Claude API error: ${claudeRes.status}`);
      }

      const claudeData = await claudeRes.json();
      const stopReason = claudeData.stop_reason;
      const content = claudeData.content || [];

      // Append assistant turn to loop history
      loopMessages.push({ role: 'assistant', content });

      if (stopReason === 'end_turn') {
        const textBlock = content.find((b) => b.type === 'text');
        finalResponse = textBlock?.text || '✅ Done.';
        break;
      }

      if (stopReason === 'tool_use') {
        const toolUseBlocks = content.filter((b) => b.type === 'tool_use');
        const toolResults = [];

        for (const toolUse of toolUseBlocks) {
          const result = await executeTool(toolUse.name, toolUse.input, employee);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: typeof result === 'string' ? result : JSON.stringify(result),
          });
        }

        loopMessages.push({ role: 'user', content: toolResults });
        continue;
      }

      // Fallback — unexpected stop reason
      const textBlock = content.find((b) => b.type === 'text');
      finalResponse = textBlock?.text || '✅ Done.';
      break;
    }

    if (!finalResponse) {
      finalResponse = "I wasn't able to complete that. Please try again.";
    }

    return res.status(200).json({
      response: finalResponse,
      employee: { name: employee.name, title: employee.title },
    });

  } catch (error) {
    console.error('Staff bot chat error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
