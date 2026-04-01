// pages/api/patients/synopsis.js
// AI-generated patient synopsis for the profile header
// Summarizes appointments, notes, protocols, and recent activity into a quick staff briefing

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { patient_id, force } = req.body;
  if (!patient_id) return res.status(400).json({ error: 'patient_id required' });

  // Check for cached synopsis (generated in last 24 hours)
  if (!force) {
    const { data: existing } = await supabase
      .from('patients')
      .select('ai_synopsis, ai_synopsis_generated_at')
      .eq('id', patient_id)
      .single();

    if (existing?.ai_synopsis && existing?.ai_synopsis_generated_at) {
      const generatedAt = new Date(existing.ai_synopsis_generated_at);
      const hoursSince = (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        return res.status(200).json({ success: true, synopsis: existing.ai_synopsis, cached: true });
      }
    }
  }

  // Gather patient context
  const [
    { data: patient },
    { data: appointments },
    { data: notes },
    { data: protocols },
    { data: serviceLogs },
    { data: purchases },
  ] = await Promise.all([
    supabase.from('patients').select('first_name, last_name, gender, date_of_birth, created_at, email, phone').eq('id', patient_id).single(),
    supabase.from('appointments').select('service_name, service_category, start_time, status, notes').eq('patient_id', patient_id).order('start_time', { ascending: false }).limit(20),
    supabase.from('patient_notes').select('body, note_date, created_by, source, note_category, created_at').eq('patient_id', patient_id).order('note_date', { ascending: false }).limit(15),
    supabase.from('protocols').select('program_name, program_type, medication, status, start_date, selected_dose, delivery_method, total_sessions, sessions_used, next_expected_date').eq('patient_id', patient_id).order('created_at', { ascending: false }).limit(20),
    supabase.from('service_logs').select('service_type, service_date, notes, employee_name').eq('patient_id', patient_id).order('service_date', { ascending: false }).limit(15),
    supabase.from('purchases').select('description, amount_cents, purchase_date, status').eq('patient_id', patient_id).order('purchase_date', { ascending: false }).limit(10),
  ]);

  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  // Build context string — use Pacific time for all date/time formatting
  const TZ = 'America/Los_Angeles';
  const today = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  const patientAge = patient.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const memberSince = patient.created_at ? new Date(patient.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown';

  let context = `TODAY: ${today}\n`;
  context += `PATIENT: ${patient.first_name} ${patient.last_name}`;
  if (patientAge) context += `, ${patientAge}yo ${patient.gender || ''}`;
  context += `\nMember since: ${memberSince}\n`;

  // Active protocols
  const activeProtos = (protocols || []).filter(p => p.status === 'active');
  const completedProtos = (protocols || []).filter(p => p.status === 'completed');
  if (activeProtos.length > 0) {
    context += `\nACTIVE PROTOCOLS:\n`;
    activeProtos.forEach(p => {
      const name = p.program_name || p.medication || p.program_type;
      const dose = p.selected_dose ? ` — ${p.selected_dose}` : '';
      const delivery = p.delivery_method ? ` (${p.delivery_method})` : '';
      const sessions = p.total_sessions ? ` [${p.sessions_used || 0}/${p.total_sessions} sessions]` : '';
      const nextRefill = p.next_expected_date ? ` Next refill: ${p.next_expected_date}` : '';
      context += `- ${name}${dose}${delivery}${sessions}${nextRefill}\n`;
    });
  }
  if (completedProtos.length > 0) {
    context += `\nCOMPLETED PROTOCOLS (${completedProtos.length}):\n`;
    completedProtos.slice(0, 5).forEach(p => {
      context += `- ${p.program_name || p.medication || p.program_type}\n`;
    });
  }

  // Recent appointments
  if (appointments?.length > 0) {
    context += `\nRECENT APPOINTMENTS (last 20):\n`;
    appointments.forEach(a => {
      const date = a.start_time ? new Date(a.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: TZ }) : 'Unknown';
      const time = a.start_time ? new Date(a.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ }) : '';
      context += `- ${date} ${time}: ${a.service_name || a.service_category || 'Appointment'} — Status: ${a.status || 'unknown'}`;
      if (a.notes) context += ` — Notes: ${a.notes}`;
      context += '\n';
    });
  }

  // Recent service logs
  if (serviceLogs?.length > 0) {
    context += `\nRECENT SERVICE LOGS (last 15):\n`;
    serviceLogs.forEach(s => {
      const date = s.service_date || 'Unknown';
      context += `- ${date}: ${s.service_type || 'Service'}`;
      if (s.employee_name) context += ` by ${s.employee_name}`;
      if (s.notes) context += ` — ${s.notes}`;
      context += '\n';
    });
  }

  // Internal staff notes
  const staffNotes = (notes || []).filter(n => n.note_category === 'internal' || (!n.note_category && !['encounter', 'addendum', 'protocol'].includes(n.source)));
  if (staffNotes.length > 0) {
    context += `\nSTAFF NOTES (internal):\n`;
    staffNotes.slice(0, 10).forEach(n => {
      const date = n.note_date || n.created_at?.split('T')[0] || 'Unknown';
      context += `- ${date}${n.created_by ? ` (${n.created_by})` : ''}: ${(n.body || '').slice(0, 300)}\n`;
    });
  }

  // Recent purchases
  if (purchases?.length > 0) {
    context += `\nRECENT PURCHASES:\n`;
    purchases.forEach(p => {
      const amount = p.amount_cents ? `$${(p.amount_cents / 100).toFixed(0)}` : '';
      context += `- ${p.purchase_date || 'Unknown'}: ${p.description || 'Purchase'} ${amount}\n`;
    });
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: `You are a staff briefing assistant for Range Medical, a regenerative medicine clinic. Generate a concise patient synopsis that helps any staff member quickly understand this patient's current status and context.

FORMAT: Write 3-5 short bullet points. Each bullet should be one sentence max. Use plain language, no jargon.

FOCUS ON:
- Current treatment status (what they're on, how far along)
- Appointment patterns (rescheduled? no-shows? regular? new patient?)
- Anything a staff member should know before interacting (e.g., recent concerns, upcoming refills, special notes)
- Recent activity or notable changes

DO NOT:
- Include the patient's name (it's already displayed)
- Repeat raw data — synthesize it into insights
- Include medical advice or recommendations
- Use headers or section labels — just bullet points
- Mention if there are no issues — only flag things worth noting

Keep it under 5 bullets. Be direct and useful. If there's genuinely nothing notable, just say "New patient — no activity yet." or give a brief status summary.`,
      messages: [{ role: 'user', content: context }],
    });

    const synopsis = response.content[0]?.text || '';

    // Cache it
    await supabase
      .from('patients')
      .update({ ai_synopsis: synopsis, ai_synopsis_generated_at: new Date().toISOString() })
      .eq('id', patient_id);

    return res.status(200).json({ success: true, synopsis, cached: false });
  } catch (error) {
    console.error('Synopsis generation error:', error);
    return res.status(500).json({ error: 'Failed to generate synopsis' });
  }
}
