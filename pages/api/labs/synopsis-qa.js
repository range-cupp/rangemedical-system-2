// pages/api/labs/synopsis-qa.js
// POST: Provider asks a follow-up question about a lab synopsis
// Returns AI answer with full lab context

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { allBiomarkerKeys, biomarkerMap, categoryOrder, computeFlag } from '../../../lib/biomarker-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const QA_SYSTEM_PROMPT = `You are a clinical lab analyst for Range Medical, a longevity and regenerative medicine clinic in Newport Beach, California. You are answering follow-up questions from the reviewing provider (Dr. Burgess) about a patient's lab results and the AI-generated clinical synopsis.

You have the full lab data, the synopsis that was generated, the patient's medical intake information, and their active protocols. Use all of this context to answer the provider's question thoroughly and clinically.

RULES:
- Write for a physician — use medical terminology freely, be direct
- Be concise but thorough
- Reference specific lab values when relevant to the question
- If the provider asks about a treatment option, reference Range Medical's protocol menu (HRT, GH secretagogues, peptides, IV therapy, HBOT/RLT, weight loss protocols)
- If the provider asks about supplement recommendations, include specific dosages
- If asked about drug interactions or contraindications, be thorough and flag any concerns
- Do not repeat the full synopsis — just answer the question
- Use dashes (-) for bullet points
- No markdown formatting (no **, no ##, no backticks)
- Frame clinical opinions as "findings consistent with" or "suggestive of" — never diagnose
- When discussing optimal ranges, use longevity medicine targets, not just standard reference ranges`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lab_id, question, history } = req.body;

  if (!lab_id || !question) {
    return res.status(400).json({ error: 'lab_id and question required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    // Fetch lab + synopsis
    const { data: lab, error: labErr } = await supabase
      .from('labs')
      .select('*')
      .eq('id', lab_id)
      .single();

    if (labErr || !lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    // Fetch patient info
    const { data: patient } = await supabase
      .from('patients')
      .select('id, name, first_name, last_name, date_of_birth, gender')
      .eq('id', lab.patient_id)
      .single();

    const patientName = patient?.name || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim() || 'Unknown';
    const gender = patient?.gender || null;

    // Build biomarker summary
    let rangesQuery = supabase.from('lab_reference_ranges').select('*');
    if (gender) {
      rangesQuery = rangesQuery.or(`gender.eq.${gender},gender.eq.Both`);
    }
    const { data: ranges } = await rangesQuery;
    const rangesMap = {};
    (ranges || []).forEach(r => { rangesMap[r.biomarker] = r; });

    const biomarkerLines = [];
    for (const key of allBiomarkerKeys) {
      const value = lab[key];
      if (value === null || value === undefined) continue;
      const meta = biomarkerMap[key];
      const range = rangesMap[key] || {};
      const refLow = range.min_value ?? range.ref_low ?? null;
      const refHigh = range.max_value ?? range.ref_high ?? null;
      const optLow = range.optimal_min ?? range.optimal_low ?? null;
      const optHigh = range.optimal_max ?? range.optimal_high ?? null;
      const flag = computeFlag(value, refLow, refHigh, optLow, optHigh);
      const refStr = (refLow !== null && refHigh !== null) ? `ref: ${refLow}-${refHigh}` : '';
      const optStr = (optLow !== null && optHigh !== null) ? `optimal: ${optLow}-${optHigh}` : '';
      const rangeStr = [refStr, optStr].filter(Boolean).join(', ');
      biomarkerLines.push(`${meta?.label || key}: ${value} ${meta?.unit || ''} [${flag?.toUpperCase() || 'N/A'}] ${rangeStr ? `(${rangeStr})` : ''}`);
    }

    // Fetch active protocols
    let protocolsText = '';
    const { data: protocols } = await supabase
      .from('protocols')
      .select('program_type, medication, program_name, selected_dose, frequency, hrt_type, start_date, notes')
      .eq('patient_id', lab.patient_id)
      .eq('status', 'active');

    if (protocols?.length > 0) {
      protocolsText = '\nACTIVE PROTOCOLS:\n' + protocols.map(p => {
        const parts = [`${(p.program_type || '').toUpperCase()}: ${p.medication || p.program_name || 'Unknown'}`];
        if (p.selected_dose) parts.push(`Dose: ${p.selected_dose}`);
        if (p.frequency) parts.push(`Freq: ${p.frequency}`);
        if (p.start_date) parts.push(`Started: ${p.start_date}`);
        return parts.join(' | ');
      }).join('\n');
    }

    // Fetch intake context
    let intakeText = '';
    const { data: intake } = await supabase
      .from('intakes')
      .select('current_medications, medication_notes, allergies, what_brings_you, what_brings_you_in, symptoms, medical_conditions, on_hrt, hrt_details')
      .eq('patient_id', lab.patient_id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (intake) {
      const parts = [];
      const reason = intake.what_brings_you || intake.what_brings_you_in || intake.symptoms;
      if (reason) parts.push(`Reason for visit: ${reason}`);
      const meds = intake.current_medications || intake.medication_notes;
      if (meds) parts.push(`Current medications: ${meds}`);
      if (intake.allergies) parts.push(`Allergies: ${intake.allergies}`);
      if (intake.on_hrt) parts.push(`On HRT: ${intake.hrt_details || 'Yes'}`);
      if (parts.length > 0) intakeText = '\nMEDICAL CONTEXT:\n' + parts.join('\n');
    }

    // Build context message
    const contextMessage = `PATIENT: ${patientName}
GENDER: ${gender || 'Not specified'}
DOB: ${patient?.date_of_birth || 'Not on file'}
LAB DATE: ${lab.test_date}
${intakeText}
${protocolsText}

LAB RESULTS:
${biomarkerLines.join('\n')}

AI SYNOPSIS (previously generated):
${lab.ai_synopsis || 'No synopsis available'}`;

    // Build conversation messages
    const messages = [
      { role: 'user', content: contextMessage + '\n\n---\n\nThe provider is now asking follow-up questions about this patient\'s labs and synopsis. Answer their question:' }
    ];

    // Add conversation history if provided
    if (history?.length > 0) {
      // First message already sent as user, now add Q&A pairs
      for (const entry of history) {
        if (entry.role === 'provider') {
          messages.push({ role: 'user', content: entry.content });
        } else if (entry.role === 'assistant') {
          messages.push({ role: 'assistant', content: entry.content });
        }
      }
    }

    // Add current question
    messages.push({ role: 'user', content: question });

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: QA_SYSTEM_PROMPT,
      messages
    });

    const answer = response.content?.[0]?.text || null;

    if (!answer) {
      return res.status(500).json({ error: 'Empty response from AI' });
    }

    return res.status(200).json({ success: true, answer });

  } catch (error) {
    console.error('[synopsis-qa] Error:', error.message);
    return res.status(500).json({ error: 'QA generation failed' });
  }
}
