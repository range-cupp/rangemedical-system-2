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
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (!terms.length) return [];

  try {
    const { data: rows } = await supabase
      .from('sop_knowledge')
      .select('category, title, content')
      .eq('active', true)
      .in('category', ['patient_education', 'pre_service', 'post_service', 'faq', 'clinical'])
      .or(terms.map(t => `title.ilike.%${t}%,content.ilike.%${t}%`).join(','))
      .order('sort_order')
      .limit(5);

    if (!rows?.length) return [];

    // Score by term matches
    return rows
      .map(r => {
        const combined = `${r.title} ${r.content}`.toLowerCase();
        const score = terms.reduce((s, t) => s + (combined.includes(t) ? 1 : 0), 0);
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
        .select('protocol_name, category, status, start_date, end_date')
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
    knowledgeBlock = '\n\nRELEVANT KNOWLEDGE BASE ENTRIES:\n' +
      knowledge.map(k => `[${k.title}]\n${k.content.substring(0, 800)}`).join('\n\n');
  }

  // Build patient context
  let patientBlock = '';
  if (context) {
    const parts = [];
    if (context.activeProtocols.length > 0) {
      parts.push('Active protocols: ' + context.activeProtocols.map(p => p.protocol_name).join(', '));
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

  const systemPrompt = `You are a helpful text message assistant for Range Medical, a regenerative medicine clinic in Newport Beach, CA.

ROLE: You auto-reply to patient text messages with helpful, accurate information. A staff member will also review the conversation, so you don't need to handle everything — just provide an immediate helpful response.

CLINIC INFO:
- Name: Range Medical
- Phone: (949) 997-3988
- Address: 1901 Westcliff Drive, Suite 10, Newport Beach, CA
- Hours: Mon-Fri 9am-5pm, some Saturdays by appointment
- Website: range-medical.com
- Booking: app.range-medical.com/schedule-iv (for IV appointments)
- Services: IV Therapy, NAD+, Hormone Optimization (HRT), Weight Loss (semaglutide/tirzepatide/retatrutide), Peptide Therapy, Hyperbaric Oxygen (HBOT), Red Light Therapy, PRP, Lab Work
${knowledgeBlock}${patientBlock}${historyBlock}

RULES:
1. Keep replies SHORT — 1-3 sentences max. This is SMS, not email.
2. Be warm, professional, and helpful. Sign off as "- Range Medical" only if it feels natural.
3. If you know the answer from the knowledge base, give it directly.
4. For scheduling questions, direct them to call/text (949) 997-3988 or book online.
5. NEVER give specific medical advice, dosage changes, or diagnose anything. For clinical questions, say the team will follow up.
6. NEVER make up information. If unsure, say the team will get back to them.
7. Use the patient's first name when you know it.
8. Don't mention that you're an AI or automated — just be helpful.
9. Match the patient's tone — casual if they're casual, professional if they're formal.
10. For appointment confirmation/changes, acknowledge and say the team will confirm.
11. Do NOT use emojis excessively — one is fine occasionally.`;

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
        max_tokens: 256,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Patient "${patientName}" just texted: "${messageText}"\n\nGenerate a helpful SMS reply. Keep it short and natural.`,
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
    const reply = data.content?.[0]?.text?.trim();

    if (!reply) {
      console.error('Patient bot: empty reply from Claude');
      return null;
    }

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
