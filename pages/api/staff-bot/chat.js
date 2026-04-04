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
  handleGetPatientProtocols,
  handleGetPatientAppointments,
  handleRescheduleAppointment,
  handleSendDocument,
  handleSearchKnowledge,
  DOCUMENT_CATALOG,
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
        patient_id: { type: 'string', description: 'Patient UUID from context. Always include when available.' },
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
        patient_id: { type: 'string', description: 'Patient UUID from context. Always include when available.' },
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
        patient_id: { type: 'string', description: 'Patient UUID from context. Always include when available.' },
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
        patient_id: { type: 'string', description: 'Patient UUID from context. Always include when available.' },
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
        patient_id: { type: 'string', description: 'Patient UUID from context. Always include when available.' },
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
        patient_id: { type: 'string', description: 'Patient UUID from context. Always include when available.' },
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
        patient_id: { type: 'string', description: 'Patient UUID from context. Always include when available.' },
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
  {
    name: 'get_patient_protocols',
    description: "Get a patient's active protocols — includes HRT, weight loss, peptide, IV, HBOT, and RLT programs. Shows dosing, schedule, session counts, and upcoming lab dates. Use this when staff asks what a patient is on, what their protocol is, or what they're currently taking.",
    input_schema: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: 'Full or partial name of the patient' },
        patient_id: { type: 'string', description: 'Patient UUID from context. Always include when available.' },
        include_inactive: { type: 'boolean', description: 'If true, also return completed/paused protocols. Default is active only.' },
      },
      required: ['patient_name'],
    },
  },
  {
    name: 'get_patient_appointments',
    description: "Get a patient's upcoming (or past) appointments. Returns scheduled/confirmed bookings from the calendar. Use this when staff asks about a patient's next appointment, appointment history, or what they have coming up.",
    input_schema: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: 'Full or partial name of the patient' },
        patient_id: { type: 'string', description: 'Patient UUID from context. Always include when available.' },
        include_past: { type: 'boolean', description: 'If true, return past appointments instead of upcoming ones.' },
        limit: { type: 'number', description: 'Max number of appointments to return. Default 10, max 20.' },
      },
      required: ['patient_name'],
    },
  },
  {
    name: 'reschedule_appointment',
    description: 'Reschedule an existing appointment to a new date and time. Looks up the booking by patient name, moves it in Cal.com, updates the system, and sends notifications to the patient and provider. Always confirm the specific booking and new time with the user before calling this.',
    input_schema: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: 'Full or partial name of the patient' },
        patient_id: { type: 'string', description: 'Patient UUID from context. Always include when available.' },
        new_date: { type: 'string', description: 'New date in YYYY-MM-DD format' },
        new_time: { type: 'string', description: 'New time in HH:MM 24hr format' },
        current_date: { type: 'string', description: 'Optional: current appointment date in YYYY-MM-DD format to narrow down which booking to reschedule' },
        service_type: { type: 'string', description: 'Optional: service name to narrow down which booking, e.g. "Range IV"' },
      },
      required: ['patient_name', 'new_date', 'new_time'],
    },
  },
  {
    name: 'search_knowledge',
    description: 'Search the clinic knowledge base for SOPs, pre/post-service instructions, clinical protocols, and admin procedures. Use this when staff asks about how to do something, what a patient should do before or after a service, what a clinical protocol requires, or any question about clinic procedures and policies.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Keywords to search for, e.g. "HBOT pre-service instructions", "peptide injection protocol", "post IV care", "cancellation policy"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'send_document',
    description: `Send a link to a Range Medical service page to a patient via SMS or email. These are branded web pages on app.range-medical.com — not PDFs. Use this when staff says things like "send John the HBOT info", "text Sarah about hyperbaric oxygen", "email the tirzepatide page to Mike", "send the red light info to [patient]", or "send [patient] info about [service]". The document parameter should be the natural-language description of what to send (e.g. "hyperbaric oxygen", "tirzepatide", "methylene blue combo", "red light therapy", "NAD", "weight loss"). Available pages: ${DOCUMENT_CATALOG.map(d => d.name).join(', ')}.`,
    input_schema: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: 'Full or partial name of the patient' },
        patient_id: { type: 'string', description: 'Patient UUID from context. Always include when available.' },
        document: { type: 'string', description: 'Natural language description of what to send, e.g. "HBOT guide", "tirzepatide info", "methylene blue combo"' },
        method: { type: 'string', enum: ['sms', 'email'], description: 'Delivery method. Default: sms' },
      },
      required: ['patient_name', 'document'],
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
    case 'get_available_providers':   return await handleGetAvailableProviders(toolInput);
    case 'get_service_info':          return await handleGetServiceInfo(toolInput);
    case 'get_patient_protocols':     return await handleGetPatientProtocols(toolInput);
    case 'get_patient_appointments':  return await handleGetPatientAppointments(toolInput);
    case 'reschedule_appointment':    return await handleRescheduleAppointment(toolInput);
    case 'send_document':             return await handleSendDocument(toolInput);
    case 'search_knowledge':          return await handleSearchKnowledge(toolInput);
    default:                          return `Unknown tool: ${toolName}`;
  }
}

// ── System prompt ────────────────────────────────────────────────────────────

async function buildSystemPrompt(staff) {
  // Fetch live service catalog from pos_services — injected into prompt so
  // the bot always knows current pricing without needing a tool call.
  // Grouped by category for readability.
  let liveCatalogBlock = '';
  try {
    const { data: services } = await supabase
      .from('pos_services')
      .select('name, category, price_cents, recurring, interval, description')
      .eq('active', true)
      .order('category')
      .order('sort_order');

    if (services && services.length > 0) {
      const grouped = {};
      for (const s of services) {
        if (!grouped[s.category]) grouped[s.category] = [];
        grouped[s.category].push(s);
      }
      const categoryLabels = {
        assessment:   'ASSESSMENT',
        lab_panels:   'LAB PANELS',
        iv_therapy:   'IV THERAPY',
        injections:   'INJECTIONS',
        hbot:         'HBOT',
        regenerative: 'RED LIGHT THERAPY',
        packages:     'PACKAGES',
        prp:          'PRP',
        hrt:          'HRT',
        weight_loss:  'WEIGHT LOSS (GLP-1)',
        peptide:      'PEPTIDES',
      };
      const lines = ['── LIVE PRICE CATALOG (from POS) ───────────────────────────────────'];
      for (const [cat, items] of Object.entries(grouped)) {
        lines.push(`\n${categoryLabels[cat] || cat.toUpperCase()}`);
        for (const s of items) {
          const price = s.price_cents > 0
            ? `$${(s.price_cents / 100).toFixed(0)}${s.recurring ? `/${s.interval || 'mo'}` : ''}`
            : 'pricing by consultation';
          const desc = s.description ? ` — ${s.description}` : '';
          lines.push(`  ${s.name}: ${price}${desc}`);
        }
      }
      lines.push('────────────────────────────────────────────────────────────────────');
      liveCatalogBlock = lines.join('\n');
    }
  } catch (err) {
    console.warn('[StaffBot] Could not load live catalog:', err.message);
    liveCatalogBlock = '(Live catalog unavailable — use get_service_info tool for pricing)';
  }

  // Knowledge base is now on-demand via the search_knowledge tool.
  // No bulk injection here — keeps system prompt token-lean so multi-step
  // operations (cancel both, book + confirm) don't exceed the 50K input
  // tokens/minute rate limit. The bot calls search_knowledge when it needs
  // SOP content instead of having everything pre-loaded.
  const knowledgeBlock = '';

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

  return `You are the Range Medical staff assistant — a concise AI helper for the clinic team.

Today is ${today} (${todayISO}). Time: ${timeNow} Pacific.
Tomorrow = ${tomorrowISO}.
THIS week: ${Object.entries(thisWeekDates).map(([d,iso]) => `${d}=${iso}`).join(', ')}.
NEXT week: ${Object.entries(nextWeekDates).map(([d,iso]) => `${d}=${iso}`).join(', ')}.
DATE RULES: "Tuesday" = ${thisWeekDates['Tuesday']}. "Next Tuesday" = ${nextWeekDates['Next Tuesday']}.
Staff: ${staff.name}${staff.title ? ` (${staff.title})` : ''}.

CLINIC: Range Medical, 1901 Westcliff Drive Suite 10, Newport Beach CA 92660. (949) 997-3988. Mon–Fri 8am–5pm. Cash/card/HSA/FSA only — no insurance.

PRICING QUICK-REF: Range IV $225 | NAD+ IV from $375 | Vit C IV from $215 | Glutathione IV from $170 | MB Combo $750 | Standard injection $35 | Premium injection $50 | HBOT $185 | RLT $85 | HRT $250/mo | Essential Labs $350 | Elite Labs $750 | Range Assessment $197 (credited toward treatment) | PRP $750
For detailed pricing or service descriptions → use get_service_info or search_knowledge tools.

${liveCatalogBlock}

LOCATIONS: Newport Beach (default) and Placentia.
- Lily Diaz works Monday mornings at PLACENTIA ONLY — not Newport Beach on Mondays.
- If booking Lily on Monday without location specified, ask which location first.

BOOKING WORKFLOW:
1. PATIENT: Partial name → lookup_patient. 2+ matches → ask which one.
2. PROVIDER: Call get_available_providers with service + date. Present list, let staff pick (skip if already specified).
3. AVAILABILITY: Call check_availability. If unavailable, show closest slots.
4. CONFIRM: Show summary (patient, service, date/time, provider) → wait for "yes".
5. BOOK: Call book_appointment. Report exact result.
Never book without confirmed "yes." "Book WITH [name]" = provider, not patient.

RESCHEDULE: get_patient_appointments → confirm which booking → confirm new time → reschedule_appointment.

TASK WORKFLOW:
1. Parse the request for: task description, who to assign it to, due date, priority, related patient.
2. If due date is missing, ALWAYS ask: "When should this be due?" Accept natural language dates ("tomorrow", "end of week", "Friday", etc.) and resolve them using the date table above.
3. If assignee is missing or ambiguous, ask who to assign it to.
4. CONFIRM before creating: show a quick summary — task, assigned to, due date, priority — and wait for "yes" or approval.
5. Only call create_task after confirmation.
Never create a task without confirming the due date first.

BEHAVIOR:
- Direct and efficient. One question at a time.
- When a patient_id is provided in context, ALWAYS include it in every tool call. This ensures exact patient matching.
- For service details, prep instructions, SOPs, protocols → use search_knowledge tool.
- For patient data → use lookup_patient, get_patient_protocols, get_patient_appointments.
- On tool errors, report exact error text — never invent generic messages.
- Resolve dates using the table above. Emoji OK sparingly (✅ ❌ 📋 📅).`;
}

// ── Main API handler ─────────────────────────────────────────────────────────

// Allow longer execution for multi-step tool loops
export const config = { maxDuration: 60 };

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
    // Trim history to last 6 turns to stay well under token limits
    const trimmedHistory = history.slice(-6).map((m) => ({ role: m.role, content: m.content }));
    const loopMessages = [
      ...trimmedHistory,
      { role: 'user', content: message.trim() },
    ];

    const systemPrompt = await buildSystemPrompt(employee);

    // ── Agentic loop: Claude → tool calls → results → Claude ────────────────
    let finalResponse = null;
    const MAX_ITERATIONS = 6;

    // Helper: call Claude API with one short retry on rate limit (429)
    async function callClaude(messages) {
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
          messages,
        }),
      });

      if (claudeRes.status === 429) {
        // One quick retry after 2 seconds
        console.warn('[StaffBot] Rate limited (429), retrying in 2s');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return await fetch('https://api.anthropic.com/v1/messages', {
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
            messages,
          }),
        });
      }

      return claudeRes;
    }

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const claudeRes = await callClaude(loopMessages);

      if (!claudeRes.ok) {
        const errText = await claudeRes.text();
        console.error('[StaffBot] Claude API error:', claudeRes.status, errText);
        // Friendly message for rate limits
        if (claudeRes.status === 429) {
          return res.status(200).json({
            response: '⚠️ The assistant is getting a lot of requests right now. Please wait a few seconds and try again.',
            employee: { name: employee.name, title: employee.title },
          });
        }
        let detail = '';
        try { detail = JSON.parse(errText)?.error?.message || ''; } catch {}
        return res.status(200).json({
          response: `⚠️ AI service error (${claudeRes.status})${detail ? `: ${detail}` : ''}. Please try again.`,
          employee: { name: employee.name, title: employee.title },
          _debug: { claudeStatus: claudeRes.status, claudeError: errText.slice(0, 500) },
        });
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
    console.error('[StaffBot] Unhandled error:', error.message, error.stack);
    return res.status(500).json({
      error: 'Something went wrong. Please try again.',
      _debug: error.message,
    });
  }
}
