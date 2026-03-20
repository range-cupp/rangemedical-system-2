// lib/patient-bot.js
// AI-powered auto-responder for patient inbound messages
// Uses Claude + knowledge base + patient context to generate helpful replies
// Auto-replies are logged with source 'patient-bot' and DO NOT clear needs_response
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Messages the bot should NOT auto-reply to
const SKIP_PATTERNS = [
  /^(ok|okay|k|thanks|thank you|thx|ty|got it|sounds good|perfect|great|cool|awesome|nice|yes|no|y|n|yep|nope|yea|yeah|nah)\.?$/i,
  /^(👍|👌|🙏|❤️|😊|😀|👏|🎉|✅|💪)$/,
  /^\d+$/, // Just a number
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
    // If all terms are stop words, use the original words longer than 2 chars
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

    // Score by term matches — boost FAQ/pricing entries and title matches
    return rows
      .map(r => {
        const titleLower = r.title.toLowerCase();
        const combined = `${r.title} ${r.content}`.toLowerCase();
        let score = terms.reduce((s, t) => s + (combined.includes(t) ? 1 : 0), 0);
        // Boost: title match is worth more than body match
        score += terms.reduce((s, t) => s + (titleLower.includes(t) ? 2 : 0), 0);
        // Boost: FAQ entries (pricing, hours, etc.) are more useful for patient questions
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
        .in('status', ['confirmed', 'pending'])
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
 * Generate an auto-reply using Claude
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
        if (p.medication) desc += ` — medication: ${p.medication}`;
        if (p.dose) desc += `, dose: ${p.dose}`;
        if (p.frequency) desc += `, frequency: ${p.frequency}`;
        return desc;
      }).join('\n'));
    }
    if (context.upcomingAppointments.length > 0) {
      parts.push('Upcoming appointments: ' + context.upcomingAppointments.map(a => {
        const dt = new Date(a.start_time);
        return `${a.service_name} on ${dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' })}`;
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

  const systemPrompt = `You are Jack, Range Medical's helpful bot. You are an AI setter — patients know you're a bot.

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
${knowledgeBlock}${patientBlock}${historyBlock}

PROTOCOL-AWARE CONTEXT:
If the patient has active protocols listed above, use them to personalize. Reference their specific program when relevant.
- weight_loss protocol → "Weight Loss Injection" appointment
- hrt protocol → "HRT" appointment
- peptide protocol → "Peptide Pickup" or "Peptide Injection"
- iv protocol → "Range IV" appointment

CONVERSATION PRINCIPLES:
- Be fast, clear, and human. Short sentences, simple language, friendly but direct.
- Always personalize using what you know about them (their name, their protocols, their goals, what they just said).
- Every message should either: clarify their situation, increase their belief we can help, or move them toward booking. Nothing else.
- NEVER leave a dead end. Always end with a question or a clear next step.

QUALIFICATION FLOW (use naturally in conversation, not as a form):
For NEW leads or people asking about services:
1. WHAT THEY WANT: "What are you hoping to improve or work on?"
2. WHAT THEY'VE TRIED: "What have you tried so far?" (follow up with "What else?" once if appropriate)
3. PRIORITY: "How important is it for you to get this handled soon?"
4. TIMING: "If we found a good fit, when would you want to get started?"
Skip steps you already have answers to. For EXISTING patients asking to come in, skip qualification and go straight to booking.

DECISION LOGIC:
- If they're ready and interested → present the relevant service with pricing from the knowledge base, then propose a visit: "When works best for you this week? We're open Mon-Fri 9-6 and Saturday 9-2."
- If interested but hesitant → summarize their situation in their own words, restate the outcome we help with, and offer a low-friction next step: "The best first step is just coming in for a quick assessment with our provider. No commitment, we just see where you're at."
- If clearly not a fit → be honest and polite: "Based on what you're describing, we might not be the best fit for that, but I can have the team reach out if you'd like a second opinion."
- If they ask a clinical/medical question → "Great question. That's something our provider Dr. Burgess can go over with you in person. Want me to get you on the schedule?"

BOOKING SCRIPT:
When they're ready: "Based on what you shared about [their goal], I think [specific service] would be a great fit. The best next step is coming in so our team can walk you through everything. When works best for you this week?"
Once they pick a time: "Got it, I'll let the team know and they'll confirm your spot. Anything else you want to make sure we cover?"

FOLLOW-UP:
If they go quiet mid-conversation, reference what they told you specifically, not generic follow-ups. Example: "Hey [name], just circling back on the [service] we were talking about. Still want to get that going?"

RULES:
1. Keep replies SHORT. 1-3 sentences max. This is SMS, not email.
2. Be warm, confident, and direct. You're a setter — move conversations forward.
3. When the knowledge base has the answer (pricing, hours, services), include specific numbers. Never say "pricing varies" or "check the website."
4. NEVER give medical advice, dosage changes, or diagnose anything. Redirect clinical questions to a visit.
5. NEVER make up information. Share what you know confidently. If you don't know, say the team will follow up.
6. Use the patient's first name.
7. Match their tone — casual if they're casual, professional if they're formal.
8. Sign off as "- Jack, Range Medical's Helpful Bot" on your messages.
10. NEVER use markdown formatting. No **bold**, no *italics*, no bullet lists. Plain SMS text only.
11. Do not use emojis excessively — one is fine occasionally.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Patient "${patientName}" just texted: "${messageText}"\n\nReply as Jack. Keep it short and move the conversation forward. If they're asking about a service, give them the info AND move toward booking. If they want to come in, get them scheduled. If they're a new lead, qualify them naturally. Always end with a question or next step.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Patient bot Claude API error:', response.status, errText);
      return null;
    }

    const data = await response.json();
    let reply = data.content?.[0]?.text?.trim();

    if (!reply) {
      console.error('Patient bot: empty reply from Claude');
      return null;
    }

    // Strip markdown formatting — this is plain SMS
    reply = reply.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');

    // Safety check: reject replies that are too long for SMS
    if (reply.length > 480) {
      return reply.substring(0, 477) + '...';
    }

    return reply;
  } catch (err) {
    console.error('Patient bot generateReply error:', err);
    return null;
  }
}
