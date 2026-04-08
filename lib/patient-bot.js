// lib/patient-bot.js
// AI-powered setter bot for patient inbound messages
// Uses Claude tool use + Cal.com to qualify, book, and respond
// Auto-replies are logged with source 'patient-bot' and DO NOT clear needs_response
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { getAvailableSlots, createBooking } from './calcom';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cal.com event type IDs — map protocol types to bookable services
const EVENT_TYPES = {
  'injection-testosterone':  { id: 4858872, name: 'Injection - Testosterone', duration: 15 },
  'injection-weight-loss':   { id: 4858873, name: 'Injection - Weight Loss', duration: 15 },
  'injection-peptide':       { id: 4858874, name: 'Injection - Peptide', duration: 15 },
  'injection-medical':       { id: 4858875, name: 'Injection - Medical', duration: 15 },
  'range-injections':        { id: 4858870, name: 'Range Injections', duration: 15 },
  'nad-injection':           { id: 4858871, name: 'NAD+ Injection', duration: 15 },
  'range-iv':                { id: 4858878, name: 'Range IV', duration: 60 },
  'nad-iv-250':              { id: 4858879, name: 'NAD+ IV (250mg)', duration: 60 },
  'nad-iv-500':              { id: 4858881, name: 'NAD+ IV (500mg)', duration: 90 },
  'nad-iv-750':              { id: 4858882, name: 'NAD+ IV (750mg)', duration: 120 },
  'nad-iv-1000':             { id: 4858883, name: 'NAD+ IV (1000mg)', duration: 180 },
  'vitamin-c-iv':            { id: 4858884, name: 'Vitamin C IV', duration: 90 },
  'specialty-iv':            { id: 4858885, name: 'Specialty IV', duration: 60 },
  'hbot':                    { id: 4858876, name: 'Hyperbaric Oxygen Therapy (HBOT)', duration: 60 },
  'red-light-therapy':       { id: 4858877, name: 'Red Light Therapy', duration: 30 },
  'initial-consultation':    { id: 4858886, name: 'Initial Consultation', duration: 45 },
  'follow-up-consultation':  { id: 4858888, name: 'Follow-Up Consultation', duration: 20 },
  'new-patient-blood-draw':  { id: 4858865, name: 'New Patient Blood Draw', duration: 15 },
  'follow-up-blood-draw':    { id: 4858866, name: 'Follow Up Blood Draw', duration: 15 },
  'range-assessment':        { id: 5018317, name: 'Range Assessment', duration: 30 },
  'medication-pickup':       { id: null, name: 'Medication Pickup', duration: 15 },
  'mb-combo-iv':             { id: 5057000, name: 'MB + Vitamin C + Magnesium Combo IV', duration: 120 },
  'methylene-blue-iv':       { id: 5056999, name: 'Methylene Blue IV', duration: 60 },
  'glutathione-iv':          { id: 5057001, name: 'Glutathione IV', duration: 60 },
};

// Map protocol program_type to Cal.com event slug
const PROTOCOL_TO_EVENT = {
  weight_loss: 'injection-weight-loss',
  hrt: 'injection-testosterone',
  peptide: 'injection-peptide',
  iv: 'range-iv',
  hbot: 'hbot',
  rlt: 'red-light-therapy',
};

// Messages the bot should NOT auto-reply to
const SKIP_PATTERNS = [
  /^(ok|okay|k|thanks|thank you|thx|ty|got it|sounds good|perfect|great|cool|awesome|nice|yes|no|y|n|yep|nope|yea|yeah|nah)\.?$/i,
  /^(👍|👌|🙏|❤️|😊|😀|👏|🎉|✅|💪)$/,
  /^\d{1,2}$/, // Just a 1-2 digit number (but allow times like "1030", "230", etc.)
  /^\.+$/, // Just dots
];

// Keywords that indicate the message needs a HUMAN, not a bot
const ESCALATION_PATTERNS = [
  /\b(emergency|urgent|er|911|hospital|ambulance)\b/i,
  /\b(allergic reaction|can'?t breathe|chest pain|severe pain|anaphyla)\b/i,
  /\b(refund|dispute|complaint|lawyer|attorney|sue)\b/i,
  /\b(speak to|talk to|see the doctor|dr\.?\s+burgess)\b/i,
];

/**
 * Determine if a patient message should get an auto-reply
 * Returns: { shouldReply: boolean, reason: string }
 */
export function shouldAutoReply(messageText) {
  const text = (messageText || '').trim();

  if (!text || text.length < 2) {
    return { shouldReply: false, reason: 'too_short' };
  }

  // Skip simple acknowledgments
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(text)) {
      return { shouldReply: false, reason: 'acknowledgment' };
    }
  }

  // Escalate to human — don't auto-reply
  for (const pattern of ESCALATION_PATTERNS) {
    if (pattern.test(text)) {
      return { shouldReply: false, reason: 'escalation_needed' };
    }
  }

  // Auto-reply to everything else
  return { shouldReply: true, reason: 'eligible' };
}

/**
 * Search the knowledge base for relevant content
 */
async function searchKnowledge(query) {
  const STOP_WORDS = new Set(['the','and','for','are','but','not','you','all','can','had','her','was','one','our','out','how','much','per','what','does','have','this','that','with','from','your','about','would','there','their','been','some','when','who','will','more','into','just','also','than','them','very','after','should','these','could','other']);
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2 && !STOP_WORDS.has(t));
  if (!terms.length) {
    const fallback = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (!fallback.length) return [];
    terms.push(...fallback);
  }

  try {
    const { data: rows } = await supabase
      .from('sop_knowledge')
      .select('category, title, content')
      .eq('active', true)
      .in('category', ['patient_education', 'pre_service', 'post_service', 'faq', 'clinical'])
      .or(terms.map(t => `title.ilike.%${t}%,content.ilike.%${t}%`).join(','))
      .order('sort_order')
      .limit(20);

    if (!rows?.length) return [];

    return rows
      .map(r => {
        const titleLower = r.title.toLowerCase();
        const combined = `${r.title} ${r.content}`.toLowerCase();
        let score = terms.reduce((s, t) => s + (combined.includes(t) ? 1 : 0), 0);
        score += terms.reduce((s, t) => s + (titleLower.includes(t) ? 2 : 0), 0);
        if (r.category === 'faq') score += 3;
        return { ...r, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  } catch (err) {
    console.error('Patient bot knowledge search error:', err);
    return [];
  }
}

/**
 * Get patient context for personalized replies
 */
async function getPatientContext(patientId) {
  if (!patientId) return null;

  try {
    const [patientRes, protocolRes, appointmentRes] = await Promise.all([
      supabase
        .from('patients')
        .select('first_name, last_name, name, email, phone')
        .eq('id', patientId)
        .single(),
      supabase
        .from('protocols')
        .select('program_name, program_type, status, start_date, end_date, medication, dose, frequency')
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .limit(5),
      supabase
        .from('appointments')
        .select('service_name, start_time, status')
        .eq('patient_id', patientId)
        .gte('start_time', new Date().toISOString())
        .in('status', ['confirmed', 'pending', 'scheduled'])
        .order('start_time')
        .limit(3),
    ]);

    return {
      patient: patientRes.data,
      activeProtocols: protocolRes.data || [],
      upcomingAppointments: appointmentRes.data || [],
    };
  } catch (err) {
    console.error('Patient bot context error:', err);
    return null;
  }
}

/**
 * Get recent conversation history for context
 */
async function getRecentMessages(patientId, limit = 6) {
  if (!patientId) return [];

  try {
    const { data } = await supabase
      .from('comms_log')
      .select('direction, message, message_type, created_at')
      .eq('patient_id', patientId)
      .eq('channel', 'sms')
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []).reverse();
  } catch {
    return [];
  }
}

/**
 * Execute a tool call from Claude
 */
async function executeTool(toolName, toolInput, context) {
  const { patientId, patientName, patientEmail, patientPhone } = context;

  if (toolName === 'check_availability') {
    const { event_type_slug, date } = toolInput;
    const eventType = EVENT_TYPES[event_type_slug];
    if (!eventType || !eventType.id) {
      return { error: `Unknown event type: ${event_type_slug}. Available: ${Object.keys(EVENT_TYPES).join(', ')}` };
    }

    // Build date range — check the full day requested
    const startDate = new Date(`${date}T00:00:00-07:00`);
    const endDate = new Date(`${date}T23:59:59-07:00`);

    try {
      const slots = await getAvailableSlots(
        eventType.id,
        startDate.toISOString(),
        endDate.toISOString(),
        'America/Los_Angeles'
      );

      if (!slots || Object.keys(slots).length === 0) {
        return { available: false, message: `No availability for ${eventType.name} on ${date}. Suggest the patient try another day.` };
      }

      // Flatten slot data — Cal.com returns { "YYYY-MM-DD": [{ start, end }] }
      const daySlots = [];
      for (const [, slotList] of Object.entries(slots)) {
        for (const slot of (Array.isArray(slotList) ? slotList : [])) {
          const dt = new Date(slot.start);
          daySlots.push({
            start: slot.start,
            time: dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' }),
          });
        }
      }

      if (daySlots.length === 0) {
        return { available: false, message: `No availability for ${eventType.name} on ${date}. Suggest the patient try another day.` };
      }

      // Return up to 6 slots so Jack can offer options
      return {
        available: true,
        service: eventType.name,
        date,
        slots: daySlots.slice(0, 6).map(s => ({ start: s.start, time: s.time })),
        total_slots: daySlots.length,
      };
    } catch (err) {
      console.error('Patient bot check_availability error:', err);
      return { error: 'Failed to check availability. Tell the patient the team will confirm their time.' };
    }
  }

  if (toolName === 'book_appointment') {
    const { event_type_slug, start_time, patient_notes } = toolInput;
    const eventType = EVENT_TYPES[event_type_slug];
    if (!eventType || !eventType.id) {
      return { error: `Unknown event type: ${event_type_slug}` };
    }

    // Need patient email for Cal.com — use real email or generate placeholder
    const email = patientEmail || `patient-${patientId || 'unknown'}@range-medical.com`;
    const name = patientName || 'Patient';
    const phone = patientPhone || null;

    try {
      const result = await createBooking({
        eventTypeId: eventType.id,
        start: start_time,
        name,
        email,
        phoneNumber: phone,
        notes: patient_notes || `Booked by Jack (patient bot) via SMS`,
      });

      if (result.error) {
        console.error('Patient bot booking error:', result.error);
        return { success: false, error: 'Booking failed. Tell the patient the team will follow up to confirm their time.' };
      }

      const startDt = new Date(start_time);
      const formattedTime = startDt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });
      const formattedDate = startDt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Los_Angeles' });

      console.log(`Patient bot BOOKED: ${name} for ${eventType.name} on ${formattedDate} at ${formattedTime}`);

      return {
        success: true,
        service: eventType.name,
        date: formattedDate,
        time: formattedTime,
        booking_id: result.uid || result.id || null,
      };
    } catch (err) {
      console.error('Patient bot book_appointment error:', err);
      return { success: false, error: 'Booking failed. Tell the patient the team will follow up to confirm their time.' };
    }
  }

  return { error: `Unknown tool: ${toolName}` };
}

// Claude tool definitions
const TOOLS = [
  {
    name: 'check_availability',
    description: 'Check available appointment slots for a specific service on a specific date. Use this when a patient mentions a day/date they want to come in. Returns available time slots.',
    input_schema: {
      type: 'object',
      properties: {
        event_type_slug: {
          type: 'string',
          description: 'The Cal.com event type slug. Use: injection-testosterone (HRT), injection-weight-loss (weight loss), injection-peptide (peptide), range-injections (vitamin/B12/etc), nad-injection, range-iv, nad-iv-250/500/750/1000, vitamin-c-iv, specialty-iv, hbot, red-light-therapy, initial-consultation, follow-up-consultation, new-patient-blood-draw, follow-up-blood-draw, range-assessment, medication-pickup, mb-combo-iv, methylene-blue-iv, glutathione-iv',
        },
        date: {
          type: 'string',
          description: 'The date to check in YYYY-MM-DD format. Convert relative dates like "tomorrow", "Thursday", "next week" to actual dates. Today is ' + new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }),
        },
      },
      required: ['event_type_slug', 'date'],
    },
  },
  {
    name: 'book_appointment',
    description: 'Book an appointment for the patient. Only call this AFTER confirming the time with the patient (either they gave a specific time, or you offered slots and they picked one). Never book without the patient agreeing to a specific time.',
    input_schema: {
      type: 'object',
      properties: {
        event_type_slug: {
          type: 'string',
          description: 'The Cal.com event type slug (same as check_availability).',
        },
        start_time: {
          type: 'string',
          description: 'The appointment start time in ISO 8601 format (e.g., 2026-03-20T14:00:00-07:00). Must be one of the available slots returned by check_availability.',
        },
        patient_notes: {
          type: 'string',
          description: 'Optional notes about the appointment (e.g., what the patient mentioned they need).',
        },
      },
      required: ['event_type_slug', 'start_time'],
    },
  },
];

/**
 * Generate an auto-reply using Claude with tool use
 */
export async function generateReply(messageText, patientId) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Patient bot: ANTHROPIC_API_KEY not set');
    return null;
  }

  // Gather context in parallel
  const [knowledge, context, recentMessages] = await Promise.all([
    searchKnowledge(messageText),
    getPatientContext(patientId),
    getRecentMessages(patientId),
  ]);

  const patientName = context?.patient?.first_name || context?.patient?.name || 'there';
  const patientEmail = context?.patient?.email || null;
  const patientPhone = context?.patient?.phone || null;

  // Build knowledge context
  let knowledgeBlock = '';
  if (knowledge.length > 0) {
    console.log('Patient bot knowledge matches:', knowledge.map(k => `${k.title} (score: ${k.score})`).join(', '));
    knowledgeBlock = '\n\nRELEVANT KNOWLEDGE BASE ENTRIES (use this information to answer the patient):\n' +
      knowledge.map(k => `[${k.title}]\n${k.content.substring(0, 1500)}`).join('\n\n');
  } else {
    console.log('Patient bot: no knowledge matches found');
  }

  // Build patient context
  let patientBlock = '';
  if (context) {
    const parts = [];
    if (context.activeProtocols.length > 0) {
      parts.push('Active protocols:\n' + context.activeProtocols.map(p => {
        let desc = `- ${p.program_name} (type: ${p.program_type})`;
        if (p.medication) desc += `, medication: ${p.medication}`;
        if (p.dose) desc += `, dose: ${p.dose}`;
        if (p.frequency) desc += `, frequency: ${p.frequency}`;
        return desc;
      }).join('\n'));
    }
    if (context.upcomingAppointments.length > 0) {
      parts.push('Upcoming appointments: ' + context.upcomingAppointments.map(a => {
        const dt = new Date(a.start_time);
        return `${a.service_name} on ${dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' , timeZone: 'America/Los_Angeles' })} at ${dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' })}`;
      }).join('; '));
    }
    if (parts.length > 0) {
      patientBlock = '\n\nPATIENT CONTEXT:\n' + parts.join('\n');
    }
  }

  // Build conversation history
  let historyBlock = '';
  if (recentMessages.length > 0) {
    historyBlock = '\n\nRECENT CONVERSATION:\n' + recentMessages.map(m => {
      const role = m.direction === 'inbound' ? 'Patient' : 'Range Medical';
      const prefix = m.message_type?.includes('auto') ? ' (auto)' : '';
      return `${role}${prefix}: ${(m.message || '').substring(0, 200)}`;
    }).join('\n');
  }

  // Build available event types list for the prompt
  const eventTypesList = Object.entries(EVENT_TYPES)
    .filter(([, v]) => v.id)
    .map(([slug, v]) => `${slug}: ${v.name} (${v.duration}m)`)
    .join('\n');

  const systemPrompt = `You are Jack, Range Medical's helpful bot. You are an AI setter. Patients know you're a bot.

CRITICAL: On your VERY FIRST message to any patient, you MUST open with: "Hey [name]! This is Jack, Range Medical's helpful bot." This is non-negotiable. Every first reply starts this way.

Your ONLY goals are:
1. Respond instantly to every inbound message
2. Qualify the lead
3. Book them into an appointment or visit
4. Or escalate to the human team

You are a SETTER, not a closer. You move the conversation toward a decision. You do not diagnose, give medical advice, or negotiate pricing.

CLINIC INFO:
- Name: Range Medical
- Phone: (949) 997-3988
- Address: 1901 Westcliff Drive, Suite 10, Newport Beach, CA
- Hours: Mon-Fri 9am-6pm, Saturday 9am-2pm, Sunday closed
- Website: range-medical.com
- Services: IV Therapy, NAD+, Hormone Optimization (HRT), Weight Loss (semaglutide/tirzepatide/retatrutide), Peptide Therapy, Hyperbaric Oxygen (HBOT), Red Light Therapy, PRP, Lab Work
- Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' })}
${knowledgeBlock}${patientBlock}${historyBlock}

AVAILABLE SERVICES FOR BOOKING:
${eventTypesList}

PROTOCOL-TO-SERVICE MAPPING:
- weight_loss protocol → injection-weight-loss
- hrt protocol → injection-testosterone
- peptide protocol → injection-peptide
- iv protocol → range-iv
- hbot protocol → hbot
- rlt protocol → red-light-therapy

PROTOCOL-AWARE SERVICE IDENTIFICATION:
When a patient wants to come in for an injection or appointment, you MUST identify the correct service. Check their active protocols listed above.
- If they have ONE protocol, reference that specific service by name.
- If they have MULTIPLE protocols, ask which one: "I see you're on a couple programs with us. Which one are you coming in for, your [protocol A] or your [protocol B]?"
- If they have NO protocols and say "injection" without specifying, ask: "Which injection are you coming in for? We do testosterone, weight loss, peptide, vitamin, and NAD+ injections."
- NEVER guess. If you're not sure which service, ASK.

BOOKING FLOW (YOU MUST USE TOOLS):
1. Identify the service (from their protocol or by asking)
2. Ask when they want to come in: "When works best for you?"
3. When they give a day/time, you MUST call the check_availability tool. Do NOT skip this step. Do NOT just say "let me check" without actually calling the tool.
4. After check_availability returns available slots, present the options and ask the patient to confirm a time.
5. Once the patient confirms a specific time, you MUST call the book_appointment tool. Do NOT tell the patient they are booked without calling this tool.
6. Only after book_appointment returns success, confirm the booking to the patient.

CRITICAL TOOL USE RULES:
- You MUST call check_availability before confirming any time slot. NEVER skip this.
- You MUST call book_appointment before telling a patient they are booked. NEVER fake a booking with just text.
- If you say "you're all set" or "you're booked" without having called book_appointment, you are LYING to the patient. Never do this.
- If a tool call fails, tell the patient the team will follow up to confirm. Do not pretend it succeeded.

CONVERSATION PRINCIPLES:
- Be fast, clear, and human. Short sentences, simple language, friendly but direct.
- Always personalize using what you know about them (their name, their protocols, their goals, what they just said).
- Every message should either: clarify their situation, increase their belief we can help, or move them toward booking. Nothing else.
- NEVER leave a dead end. Always end with a question or a clear next step.

QUALIFICATION FLOW (for NEW leads or people asking about services):
1. WHAT THEY WANT: "What are you hoping to improve or work on?"
2. WHAT THEY'VE TRIED: "What have you tried so far?"
3. PRIORITY: "How important is it for you to get this handled soon?"
4. TIMING: "If we found a good fit, when would you want to get started?"
Skip steps you already have answers to. For EXISTING patients asking to come in, skip qualification and go straight to booking.

DECISION LOGIC:
- If they're ready and interested → present the relevant service with pricing from the knowledge base, then propose a visit.
- If interested but hesitant → offer a low-friction next step: "The best first step is just coming in for a quick assessment with our provider."
- If clearly not a fit → be honest and polite.
- If they ask a clinical/medical question → redirect to a visit with the provider.

RULES:
1. Keep replies SHORT. 1-3 sentences max. This is SMS, not email.
2. Be warm, confident, and direct. You're a setter, move conversations forward.
3. When the knowledge base has the answer (pricing, hours, services), include specific numbers. Never say "pricing varies" or "check the website."
4. NEVER give medical advice, dosage changes, or diagnose anything. Redirect clinical questions to a visit.
5. NEVER make up information. Share what you know confidently. If you don't know, say the team will follow up.
6. Use the patient's first name naturally, but do NOT start every single message with "Hey [name]!" — only use it on the first message or when it feels natural. Vary your openings.
7. Match their tone. Casual if they're casual, professional if they're formal.
8. Sign off as "- Jack, Range Medical's Helpful Bot" on your messages.
9. NEVER use markdown formatting. No **bold**, no *italics*, no bullet lists. Plain SMS text only.
10. Do not use emojis excessively. One is fine occasionally.
11. NEVER use em dashes (—) in your replies. Use commas, periods, or just break into separate sentences instead.`;

  try {
    let messages = [
      {
        role: 'user',
        content: `Patient "${patientName}" just texted: "${messageText}"\n\nReply as Jack. Keep it short and move the conversation forward. If they mention wanting to come in, schedule, or book, and you know the service + day, you MUST call the check_availability tool right now. Do not just respond with text. Use the tools. Always end with a question or next step.`,
      },
    ];

    // Tool use loop — Claude may call tools, we execute them, then Claude generates final reply
    let attempts = 0;
    const MAX_ATTEMPTS = 3;

    while (attempts < MAX_ATTEMPTS) {
      attempts++;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          system: systemPrompt,
          messages,
          tools: TOOLS,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Patient bot Claude API error:', response.status, errText);
        return null;
      }

      const data = await response.json();
      console.log(`Patient bot Claude response: stop_reason=${data.stop_reason}, content_types=${(data.content || []).map(b => b.type).join(',')}`);

      // Check if Claude wants to use a tool
      if (data.stop_reason === 'tool_use') {
        // Find tool use blocks
        const toolUseBlocks = data.content.filter(b => b.type === 'tool_use');
        const toolResults = [];

        for (const toolBlock of toolUseBlocks) {
          console.log(`Patient bot tool call: ${toolBlock.name}(${JSON.stringify(toolBlock.input)})`);
          const result = await executeTool(toolBlock.name, toolBlock.input, {
            patientId,
            patientName,
            patientEmail,
            patientPhone,
          });
          console.log(`Patient bot tool result: ${JSON.stringify(result).substring(0, 200)}`);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: JSON.stringify(result),
          });
        }

        // Add assistant message and tool results to conversation
        messages.push({ role: 'assistant', content: data.content });
        messages.push({ role: 'user', content: toolResults });
        continue;
      }

      // No tool use — extract the text reply
      const textBlock = data.content.find(b => b.type === 'text');
      let reply = textBlock?.text?.trim();

      if (!reply) {
        console.error('Patient bot: empty reply from Claude');
        return null;
      }

      // Strip markdown and em dashes - plain SMS only
      reply = reply.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
      reply = reply.replace(/\s*—\s*/g, ', ').replace(/\s*–\s*/g, ', ');

      // Safety check: reject replies that are too long for SMS
      if (reply.length > 480) {
        return reply.substring(0, 477) + '...';
      }

      return reply;
    }

    console.error('Patient bot: exceeded max tool use attempts');
    return null;
  } catch (err) {
    console.error('Patient bot generateReply error:', err);
    return null;
  }
}
