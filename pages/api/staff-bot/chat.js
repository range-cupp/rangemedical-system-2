// /pages/api/staff-bot/chat.js
// Range Medical Staff Assistant — Claude-powered with tool use
// Claude acts as the conversational brain; tools execute real CRM actions.

import { createClient } from '@supabase/supabase-js';
import {
  handleCheckAvailability,
  handleBookAppointment,
  handleSendForms,
  handleQueryBilling,
  handleAddNote,
  handleCreateTask,
  handleGetSchedule,
  handleLookupPatient,
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
      },
      required: ['service', 'date'],
    },
  },
  {
    name: 'book_appointment',
    description: 'Book an appointment on the calendar for a patient.',
    input_schema: {
      type: 'object',
      properties: {
        service: { type: 'string', description: 'Service name' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        time: { type: 'string', description: 'Time in HH:MM 24hr format' },
        patient_name: { type: 'string', description: 'Full name of the patient' },
      },
      required: ['service', 'date', 'time', 'patient_name'],
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
];

// ── Execute a tool call from Claude ─────────────────────────────────────────

async function executeTool(toolName, toolInput, staff) {
  console.log(`[StaffBot] Tool: ${toolName}`, JSON.stringify(toolInput));
  switch (toolName) {
    case 'check_availability':   return await handleCheckAvailability(toolInput);
    case 'book_appointment':     return await handleBookAppointment(toolInput);
    case 'send_forms':           return await handleSendForms(toolInput);
    case 'query_billing':        return await handleQueryBilling(toolInput);
    case 'add_note':             return await handleAddNote(toolInput, staff);
    case 'create_task':          return await handleCreateTask(toolInput, staff);
    case 'get_schedule':         return await handleGetSchedule(toolInput);
    case 'lookup_patient':       return await handleLookupPatient(toolInput);
    default:                     return `Unknown tool: ${toolName}`;
  }
}

// ── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(staff) {
  const now = new Date();
  const today = now.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const todayISO = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const timeNow = now.toLocaleTimeString('en-US', {
    timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit',
  });

  // Pre-compute useful dates for the prompt
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

  // Next occurrence of each weekday from today
  function nextWeekday(dayIndex) {
    const d = new Date(now);
    const current = d.getDay();
    let diff = dayIndex - current;
    if (diff <= 0) diff += 7;
    d.setDate(d.getDate() + diff);
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  }
  const nextDates = {
    Sunday: nextWeekday(0), Monday: nextWeekday(1), Tuesday: nextWeekday(2),
    Wednesday: nextWeekday(3), Thursday: nextWeekday(4), Friday: nextWeekday(5), Saturday: nextWeekday(6),
  };

  return `You are the Range Medical staff assistant — a smart, concise AI helper for the clinic team at Range Medical in Newport Beach, CA.

Today is ${today} (${todayISO}). Current time: ${timeNow} Pacific.
Tomorrow = ${tomorrowISO}.
Next weekdays: ${Object.entries(nextDates).map(([d,iso]) => `${d} = ${iso}`).join(', ')}.
You are assisting: ${staff.name}${staff.title ? ` (${staff.title})` : ''}.

SERVICES: Range IV, specialty drips, HBOT (hyperbaric oxygen), Red Light Therapy (RLT), HRT (hormone/testosterone replacement), Peptide therapy, Weight loss (semaglutide/tirzepatide), PRP, Exosome IV, Lab panels (Essential $350 / Elite $750), Initial consult.

── BOOKING WORKFLOW (follow this every time) ────────────────────────
1. PATIENT: If given only a first name or partial name, call lookup_patient first.
   - If 1 match → proceed with that patient.
   - If 2+ matches → ask "I found [names] — which one?" before proceeding.
   - If 0 matches → say so and ask for clarification.

2. AVAILABILITY: Always call check_availability for the requested service + date before booking.
   - Parse the returned time list to see if the requested time is available.
   - If the exact time IS available → call book_appointment immediately, no confirmation needed.
   - If the exact time is NOT available → do NOT book. Instead say:
     "[time] isn't open for [service] on [day]. Here are the closest available slots:
     • [time 1]  • [time 2]  • [time 3]
     Which one works?"
     Then wait for a reply before booking.

3. BOOK: Once you have a confirmed patient + confirmed available time → call book_appointment.

4. CONFIRM: After a successful booking, reply concisely:
   "✅ Booked — [Patient name], [Service], [Day] at [time]."

Never skip the availability check. Never ask the staff member for permission to proceed through these steps — just do them.
─────────────────────────────────────────────────────────────────────

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
