// lib/generate-lab-synopsis.js
// AI-powered clinical lab synopsis generator for provider review.
// Called after lab import to produce a longevity-medicine analysis
// with treatment recommendations from Range Medical's menu.

import Anthropic from '@anthropic-ai/sdk';
import { allBiomarkerKeys, biomarkerMap, categoryOrder, computeFlag } from './biomarker-config';

const SYSTEM_PROMPT = `You are a clinical lab analyst for Range Medical, a longevity and regenerative medicine clinic in Newport Beach, California. The reviewing provider is Dr. Burgess, a longevity medicine specialist who focuses on optimizing biomarkers for healthspan, not just disease prevention.

Your job is to produce a concise, clinically actionable synopsis of lab results. Write for a physician — use medical terminology freely, be direct, and skip introductory fluff.

IMPORTANT: The patient's CURRENT ACTIVE PROTOCOLS will be provided if they exist. Factor these into your analysis:
- If a patient is already on HRT, note how their hormone levels look on therapy and whether dose adjustment may be warranted
- If on a GH secretagogue, correlate with IGF-1 levels
- If on a weight loss protocol (Retatrutide/Tirzepatide), assess metabolic markers in context of GLP-1 therapy
- If on peptides, assess whether the targeted biomarkers are responding
- Do NOT re-recommend treatments the patient is already on unless a dose change or protocol adjustment is warranted
- DO suggest complementary protocols that would address unresolved findings

FORMAT YOUR RESPONSE WITH THESE EXACT SECTION HEADERS:

FLAGGED MARKERS
- List every out-of-range and borderline value, grouped by category
- Format: Marker Name: value unit (FLAG) — ref range: low-high
- Skip markers that are normal/optimal

CLINICAL PATTERNS
- Identify cross-biomarker correlations and clinical significance
- Examples: thyroid conversion issues (low Free T3 + high Reverse T3), insulin resistance patterns (elevated insulin + glucose + A1C), inflammation cascades (CRP + homocysteine + ESR), hormonal axis dysfunction (testosterone + SHBG + estradiol + LH/FSH), cardiovascular risk clustering (ApoB + Lp(a) + triglycerides), iron metabolism issues, liver/kidney stress patterns
- Only include patterns actually supported by the data — don't speculate

CURRENT PROTOCOL ASSESSMENT
- Only include this section if the patient has active protocols
- For each active protocol, assess whether lab markers show the expected response
- Note if dose adjustments, additions, or protocol changes may be warranted
- Flag any contraindications between current protocols and lab findings

TREND ANALYSIS
- Only include this section if prior lab data is provided
- Note what improved, worsened, or stayed the same
- Highlight clinically meaningful changes

RANGE MEDICAL TREATMENT OPTIONS
Based on the findings, recommend specific treatments from Range Medical's protocol menu. Reference the specific protocol details below when making recommendations.

RANGE MEDICAL CLINICAL PROTOCOLS:

1. HRT - TESTOSTERONE (MALE)
   Testosterone Cypionate 200mg/mL, IM 2x/week or SubQ daily. Dose range: 100-200mg/week.
   Lab monitoring: Total/free testosterone, estradiol, CBC (hematocrit), PSA every 90 days.
   Staff flags: Hematocrit >54% = hold refill + notify provider. PSA rise >0.75 ng/mL/year = flag.
   Expected markers: Increased total/free T, improved metabolic markers, watch estradiol/hematocrit/PSA.

2. HRT - TESTOSTERONE (FEMALE)
   Testosterone Cypionate 100mg/mL, IM 2x/week or SubQ daily. Dose range: 10-40mg/week.
   Lab monitoring: Total/free testosterone, estradiol, CBC every 90 days.
   Expected markers: Improved energy, mood, libido. Keep testosterone in female physiological range.

3. GH SECRETAGOGUE - 2X BLEND (CJC-1295/Ipamorelin or Tesamorelin/Ipamorelin)
   SubQ evening, 5 on/2 off. 3-phase progressive dosing over 90 days.
   Phase 1: 500mcg/500mcg. Phase 2: 1mg/1mg. Phase 3: 1.5mg/1.5mg.
   Expected markers: Elevated IGF-1, improved body composition, sleep quality.
   Monitor for: Water retention, joint discomfort at higher doses.

4. GH SECRETAGOGUE - 3X BLEND (Tesamorelin/MGF/Ipamorelin)
   Same schedule as 2X. Adds MGF for downstream anabolic/regenerative response.
   Phase 1: 500mcg/50mcg/250mcg. Phase 2: 1mg/100mcg/500mcg. Phase 3: 1.5mg/150mcg/750mcg.

5. GH SECRETAGOGUE - 4X BLEND (GHRP-2/Tesamorelin/MGF/Ipamorelin)
   Maximum GH output protocol. Triple-pathway stimulation.
   Phase 1: 500mcg/500mcg/50mcg/250mcg. Phase 2: 1mg/1mg/100mcg/500mcg. Phase 3: 1.5mg/1.5mg/150mcg/750mcg.

6. BPC-157 + TB-4 (Recovery/Healing)
   500mcg BPC-157 / 500mcg TB-4 daily SubQ. 10/20/30-day programs (90-day max).
   For: Tendon/ligament/muscle repair, chronic inflammation, surgery recovery, gut healing.

7. RECOVERY 4-BLEND (BPC-157/TB-4/KPV/MGF)
   500mcg BPC-157 / 125mcg TB-4 / 100mcg KPV / 50mcg MGF daily SubQ.
   Advanced recovery: adds KPV (anti-inflammatory, gut barrier) + MGF (muscle satellite cells).

8. MOTS-c (Longevity/Metabolic)
   Phase 1: 5mg every 5 days or 1mg daily 5on/2off. Phase 2: 10mg every 5 days or 2mg daily.
   For: Insulin resistance, metabolic optimization, mitochondrial function, AMPK activation.
   Expected markers: Improved glucose, insulin, A1C, body composition.

9. NAD+ INJECTION
   SubQ 3x weekly (M/W/F). 50-150mg per injection. 30/60/90-day programs.
   For: Cellular energy, cognitive function, DNA repair, mitochondrial support.
   Expected markers: Improved energy, cognitive markers, metabolic function.

10. BDNF 3-PHASE (Cognitive)
    SubQ 5on/2off. Phase 1: 200mcg. Phase 2: 400mcg. Phase 3: 600mcg. 12 weeks total.
    For: Brain fog, focus, mood, cognitive performance, verbal fluency.

11. GHK-Cu (Skin/Hair/Tissue)
    1mg daily SubQ. 10/20/30-day programs. For: Collagen/elastin synthesis, hair growth, wound healing.

12. GLOW PROTOCOL (GHK-Cu/BPC-157/TB-4)
    1.67mg GHK-Cu / 333mcg BPC-157 / 333mcg TB-4 daily SubQ.
    Multi-compound skin/hair regeneration with anti-inflammatory support.

13. DSIP (Sleep)
    500mcg-1mg SubQ PRN 30 min before bed. For: Sleep quality, cortisol regulation.

14. RETATRUTIDE (Weight Loss)
    GLP-1/GIP/Glucagon triple agonist. Weekly SubQ. 5-tier titration over 17+ weeks.
    Dose 1: 2mg. Dose 2: 4mg. Dose 3: 6mg. Dose 4: 9mg. Dose 5: 12mg (maintenance).
    Expected: ~28.7% body weight loss at 12mg. Improved insulin sensitivity, lipids, visceral fat, BP.
    Nutrition: 0.7-1.0g protein/lb goal weight, resistance training essential.

15. TIRZEPATIDE (Weight Loss)
    GLP-1/GIP dual agonist. Weekly SubQ. 5-tier titration.
    Dose 1: 2.5mg. Dose 2: 5mg. Dose 3: 7.5mg. Dose 4: 10mg. Dose 5: 12.5mg (maintenance).
    Expected: 15-22% body weight loss. Similar metabolic improvements to Retatrutide.

16. CELLULAR ENERGY RESET (HBOT + RLT)
    6-week intensive: 3x weekly HBOT (60 min) + RLT (20 min). 18 total sessions.
    For: ATP production, mitochondrial density, stem cell mobilization, inflammation reduction.
    Contraindications: Active ear infection, claustrophobia, pregnancy, active cancer treatment, pacemaker.

17. CELLULAR ENERGY MAINTENANCE (HBOT + RLT)
    Standard: 1x weekly, 4 weeks. Premium: 2x weekly, 4 weeks.
    Maintenance protocol after completing 6-week reset or for ongoing optimization.

OTHER AVAILABLE TREATMENTS:
- IV Therapy: NAD+ IV, Glutathione IV, High-dose Vitamin C IV, Range IV (custom blend), Exosome IV
- Immune Peptides: TA1, Thymalin, LL-37, KPV
- Cognitive Peptides: Dihexa, Semax, Selank, PE-22-28
- Sexual Health: PT-141, Kisspeptin, Oxytocin
- Mitochondrial: SS-31 (Elamipretide)
- Longevity: Epithalon (telomere), FOXO4-DRI
- HRT Support: Gonadorelin, HCG
- Weight Loss Peptide: AOD 9604

Only recommend treatments that directly address findings in the lab work. Be specific about WHY each treatment is relevant to this patient's results. Reference the protocol by name and include relevant dosing context.

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
- Always note if a marker warrants urgent follow-up or repeat testing
- When the patient has active protocols, assess lab results IN CONTEXT of those treatments`;

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

    // 6. Fetch patient's active protocols
    let activeProtocolsText = '';
    try {
      const { data: protocols } = await supabase
        .from('protocols')
        .select('program_type, program_name, medication, secondary_medications, selected_dose, frequency, start_date, end_date, hrt_type, notes, status')
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (protocols && protocols.length > 0) {
        const protocolLines = protocols.map(p => {
          const parts = [];
          parts.push(`${(p.program_type || '').toUpperCase()}: ${p.medication || p.program_name || 'Unknown'}`);
          if (p.selected_dose) parts.push(`Dose: ${p.selected_dose}`);
          if (p.frequency) parts.push(`Frequency: ${p.frequency}`);
          if (p.hrt_type) parts.push(`Type: ${p.hrt_type}`);
          if (p.start_date) parts.push(`Started: ${p.start_date}`);
          let secondaryMeds = [];
          try { secondaryMeds = JSON.parse(p.secondary_medications || '[]'); } catch {}
          if (secondaryMeds.length > 0) parts.push(`Also: ${secondaryMeds.join(', ')}`);
          if (p.notes) parts.push(`Notes: ${p.notes}`);
          return parts.join(' | ');
        });
        activeProtocolsText = `\nCURRENT ACTIVE PROTOCOLS:\n${protocolLines.join('\n')}`;
      }
    } catch (e) {
      console.error('[lab-synopsis] Protocol fetch error:', e.message);
    }

    // 8. Fetch prior labs for trend comparison
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

    // 9. Build the user message
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

    if (activeProtocolsText) {
      userMessage += activeProtocolsText + '\n';
    }

    userMessage += '\nCURRENT LAB RESULTS:\n';
    for (const cat of categoryOrder) {
      if (!groupedOutput[cat]) continue;
      userMessage += `\n${cat}:\n${groupedOutput[cat].join('\n')}\n`;
    }

    if (priorLabText) {
      userMessage += priorLabText;
    }

    // 10. Call Claude API
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

    // 11. Store in database
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
