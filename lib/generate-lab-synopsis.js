// lib/generate-lab-synopsis.js
// AI-powered clinical lab synopsis generator for provider review.
// Called after lab import to produce a longevity-medicine analysis
// with treatment recommendations from Range Medical's menu.

import Anthropic from '@anthropic-ai/sdk';
import { allBiomarkerKeys, biomarkerMap, categoryOrder, computeFlag } from './biomarker-config';

const SYSTEM_PROMPT = `You are a clinical lab analyst for Range Medical, a longevity and regenerative medicine clinic in Newport Beach, California. The reviewing provider is Dr. Burgess, a longevity medicine specialist who focuses on optimizing biomarkers for healthspan, not just disease prevention.

Your job is to produce a concise, clinically actionable synopsis of lab results. Write for a physician — use medical terminology freely, be direct, and skip introductory fluff.

FORMAT YOUR RESPONSE WITH THESE EXACT SECTION HEADERS:

FLAGGED MARKERS
- List every out-of-range and borderline value, grouped by category
- Format: Marker Name: value unit (FLAG) — ref range: low-high
- Skip markers that are normal/optimal

CLINICAL PATTERNS
- Identify cross-biomarker correlations and clinical significance
- Examples: thyroid conversion issues (low Free T3 + high Reverse T3), insulin resistance patterns (elevated insulin + glucose + A1C), inflammation cascades (CRP + homocysteine + ESR), hormonal axis dysfunction (testosterone + SHBG + estradiol + LH/FSH), cardiovascular risk clustering (ApoB + Lp(a) + triglycerides), iron metabolism issues, liver/kidney stress patterns
- Only include patterns actually supported by the data — don't speculate

TREND ANALYSIS
- Only include this section if prior lab data is provided
- Note what improved, worsened, or stayed the same
- Highlight clinically meaningful changes

RANGE MEDICAL TREATMENT OPTIONS
Based on the findings, recommend specific treatments from Range Medical's menu:

HRT (Hormone Replacement Therapy):
- Testosterone Cypionate/Enanthate, Estrogen, Progesterone, DHEA, Pregnenolone
- Support: Gonadorelin, HCG

Peptide Therapies:
- GH Secretagogues: Sermorelin, Tesamorelin, Ipamorelin, CJC-1295, GHRP-2, MK-677 (for low IGF-1, GH optimization)
- Recovery/Healing: BPC-157, TB500, Wolverine Blend (for inflammation, tissue repair)
- Longevity: Epithalon (telomere support), MOTS-C (metabolic optimization, mitochondrial function)
- Immune: TA1, Thymalin, LL-37, KPV (for immune markers, inflammation)
- Cognitive: Dihexa, Semax, Selank, BDNF, PE-22-28 (for cognitive optimization)
- Sleep: DSIP (for cortisol/sleep issues)
- Sexual Health: PT-141, Kisspeptin, Oxytocin
- Mitochondrial: SS-31 (for cellular energy, metabolic markers)
- Weight Loss: AOD 9604, Retatrutide, Tirzepatide (for metabolic/weight markers)
- Skin/Hair: GHK-Cu, GLOW blend (for aging, collagen markers)

IV Therapy:
- NAD+ IV (cellular repair, energy, longevity)
- Glutathione IV (detox, liver support, antioxidant)
- High-dose Vitamin C IV (immune, antioxidant)
- Range IV (custom nutrient blend)
- Exosome IV (regenerative, anti-inflammatory)

Other Services:
- HBOT — Hyperbaric Oxygen Therapy (inflammation, recovery, cognitive)
- RLT — Red Light Therapy (mitochondrial function, skin, recovery)

Only recommend treatments that directly address findings in the lab work. Be specific about WHY each treatment is relevant to this patient's results.

SUPPLEMENTS & LIFESTYLE
- Recommend evidence-based supplements that could improve flagged markers
- Include dosage ranges where appropriate
- Cover: vitamins, minerals, adaptogens, omega-3s, probiotics, CoQ10, etc.
- Include relevant lifestyle modifications (sleep, exercise type, diet patterns)
- Focus on interventions with strong clinical evidence

OPTIMIZATION TARGETS
- For each major flagged area, describe the desired outcome and what combination of treatments + supplements would move markers toward optimal
- Think reverse-engineering: "To bring X marker from Y to optimal Z, consider..."
- Prioritize the most impactful interventions first

RULES:
- Be concise but thorough — this is a clinical reference, not a patient-facing document
- Use dashes (-) for bullet points
- No markdown formatting (no **, no ##, no backticks)
- Keep each section focused and scannable
- If all markers are normal/optimal, say so briefly and suggest maintenance strategies
- Never diagnose — frame everything as "findings consistent with" or "suggestive of"
- Always note if a marker warrants urgent follow-up or repeat testing`;

/**
 * Generate an AI clinical synopsis for a lab result.
 * Returns the synopsis text, or null on failure.
 *
 * @param {object} supabase - Supabase client (service role)
 * @param {string} labId - UUID of the lab record
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<string|null>}
 */
export async function generateLabSynopsis(supabase, labId, patientId) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[lab-synopsis] ANTHROPIC_API_KEY not configured');
      return null;
    }

    // 1. Fetch the lab record
    const { data: lab, error: labErr } = await supabase
      .from('labs')
      .select('*')
      .eq('id', labId)
      .single();

    if (labErr || !lab) {
      console.error('[lab-synopsis] Lab fetch error:', labErr?.message);
      return null;
    }

    // 2. Fetch patient info (for gender + context)
    const { data: patient } = await supabase
      .from('patients')
      .select('id, name, first_name, last_name, date_of_birth, gender')
      .eq('id', patientId)
      .single();

    const patientName = patient?.name || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim() || 'Unknown';
    const gender = patient?.gender || null;

    // 3. Fetch reference ranges
    let rangesQuery = supabase.from('lab_reference_ranges').select('*');
    if (gender) {
      rangesQuery = rangesQuery.or(`gender.eq.${gender},gender.eq.Both`);
    }
    const { data: ranges } = await rangesQuery;
    const rangesMap = {};
    (ranges || []).forEach(r => { rangesMap[r.biomarker] = r; });

    // 4. Build biomarker analysis
    const biomarkerData = [];
    for (const key of allBiomarkerKeys) {
      const value = lab[key];
      if (value === null || value === undefined) continue;

      const meta = biomarkerMap[key];
      const range = rangesMap[key] || {};

      const refLow = range.min_value ?? range.ref_low ?? range.reference_low ?? null;
      const refHigh = range.max_value ?? range.ref_high ?? range.reference_high ?? null;
      const optLow = range.optimal_min ?? range.optimal_low ?? null;
      const optHigh = range.optimal_max ?? range.optimal_high ?? null;

      const flag = computeFlag(value, refLow, refHigh, optLow, optHigh);

      biomarkerData.push({
        key,
        name: meta?.label || key,
        value: typeof value === 'number' ? value : parseFloat(value),
        unit: meta?.unit || range.unit || '',
        category: meta?.category || 'Other',
        ref_low: refLow,
        ref_high: refHigh,
        optimal_low: optLow,
        optimal_high: optHigh,
        flag
      });
    }

    if (biomarkerData.length === 0) {
      console.log('[lab-synopsis] No biomarker data found for lab', labId);
      return null;
    }

    // 5. Fetch patient intake summary for medical context
    let medicalContext = '';
    try {
      const { data: intake } = await supabase
        .from('intakes')
        .select('current_medications, medication_notes, allergies, allergy_reactions, what_brings_you, what_brings_you_in, symptoms, medical_conditions, on_hrt, hrt_details')
        .eq('patient_id', patientId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (intake) {
        const parts = [];
        const reason = intake.what_brings_you || intake.what_brings_you_in || intake.symptoms;
        if (reason) parts.push(`Reason for visit: ${reason}`);
        const meds = intake.current_medications || intake.medication_notes;
        if (meds) parts.push(`Current medications: ${meds}`);
        if (intake.allergies) parts.push(`Allergies: ${intake.allergies}${intake.allergy_reactions ? ` (${intake.allergy_reactions})` : ''}`);
        if (intake.on_hrt) parts.push(`Currently on HRT: ${intake.hrt_details || 'Yes'}`);

        // Medical conditions
        const mc = intake.medical_conditions || {};
        const conditions = [];
        const conditionNames = {
          hypertension: 'Hypertension', highCholesterol: 'High cholesterol',
          heartDisease: 'Heart disease', diabetes: 'Diabetes', thyroid: 'Thyroid disorder',
          depression: 'Depression/Anxiety', kidney: 'Kidney disease', liver: 'Liver disease',
          autoimmune: 'Autoimmune disorder', cancer: 'Cancer'
        };
        for (const [jsonKey, label] of Object.entries(conditionNames)) {
          if (mc[jsonKey]?.response === 'Yes') {
            let entry = label;
            if (mc[jsonKey].type) entry += ` - ${mc[jsonKey].type}`;
            if (mc[jsonKey].year) entry += ` (${mc[jsonKey].year})`;
            conditions.push(entry);
          }
        }
        if (conditions.length > 0) parts.push(`Medical history: ${conditions.join(', ')}`);

        medicalContext = parts.join('\n');
      }
    } catch (e) {
      console.error('[lab-synopsis] Intake fetch error:', e.message);
    }

    // 6. Fetch prior labs for trend comparison
    let priorLabText = '';
    try {
      const { data: priorLab } = await supabase
        .from('labs')
        .select('*')
        .eq('patient_id', patientId)
        .lt('test_date', lab.test_date)
        .order('test_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (priorLab) {
        const priorMarkers = [];
        for (const key of allBiomarkerKeys) {
          const val = priorLab[key];
          if (val === null || val === undefined) continue;
          const meta = biomarkerMap[key];
          priorMarkers.push(`${meta?.label || key}: ${val} ${meta?.unit || ''}`);
        }
        if (priorMarkers.length > 0) {
          priorLabText = `\nPRIOR LAB RESULTS (${priorLab.test_date}):\n${priorMarkers.join('\n')}`;
        }
      }
    } catch (e) {
      console.error('[lab-synopsis] Prior labs fetch error:', e.message);
    }

    // 7. Build the user message
    const groupedOutput = {};
    for (const marker of biomarkerData) {
      if (!groupedOutput[marker.category]) groupedOutput[marker.category] = [];
      const refRange = (marker.ref_low !== null && marker.ref_high !== null)
        ? `ref: ${marker.ref_low}-${marker.ref_high}`
        : '';
      const optRange = (marker.optimal_low !== null && marker.optimal_high !== null)
        ? `optimal: ${marker.optimal_low}-${marker.optimal_high}`
        : '';
      const ranges = [refRange, optRange].filter(Boolean).join(', ');
      groupedOutput[marker.category].push(
        `${marker.name}: ${marker.value} ${marker.unit} [${marker.flag?.toUpperCase() || 'N/A'}] ${ranges ? `(${ranges})` : ''}`
      );
    }

    let userMessage = `PATIENT: ${patientName}\nGENDER: ${gender || 'Not specified'}\nDOB: ${patient?.date_of_birth || 'Not on file'}\nCOLLECTION DATE: ${lab.test_date}\nPANEL: ${lab.panel_type || 'Standard'}\n`;

    if (medicalContext) {
      userMessage += `\nMEDICAL CONTEXT:\n${medicalContext}\n`;
    }

    userMessage += '\nCURRENT LAB RESULTS:\n';
    for (const cat of categoryOrder) {
      if (!groupedOutput[cat]) continue;
      userMessage += `\n${cat}:\n${groupedOutput[cat].join('\n')}\n`;
    }

    if (priorLabText) {
      userMessage += priorLabText;
    }

    // 8. Call Claude API
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }]
    });

    const synopsis = message.content?.[0]?.text || null;

    if (!synopsis) {
      console.error('[lab-synopsis] Empty response from Claude API');
      return null;
    }

    // 9. Store in database
    await supabase
      .from('labs')
      .update({
        ai_synopsis: synopsis,
        ai_synopsis_generated_at: new Date().toISOString()
      })
      .eq('id', labId);

    console.log(`[lab-synopsis] Synopsis generated for ${patientName} (lab ${labId})`);
    return synopsis;

  } catch (error) {
    console.error('[lab-synopsis] Generation error:', error.message);
    return null;
  }
}
