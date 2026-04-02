// lib/generate-assessment-synopsis.js
// AI-powered clinical assessment synopsis generator for provider review.
// Analyzes baseline questionnaire scores in context of patient protocols,
// intake data, and Range Medical's treatment menu.

import Anthropic from '@anthropic-ai/sdk';
import { allBiomarkerKeys, biomarkerMap, categoryOrder, computeFlag } from './biomarker-config';

const SYSTEM_PROMPT = `You are a clinical assessment analyst for Range Medical, a longevity and regenerative medicine clinic in Newport Beach, California. The reviewing provider is Dr. Burgess, a longevity medicine specialist.

Your job is to produce a concise, clinically actionable synopsis of a patient's baseline assessment results. Write for a physician — use medical terminology freely, be direct, skip introductory fluff.

IMPORTANT: The patient's CURRENT ACTIVE PROTOCOLS will be provided if they exist. Factor these into your analysis:
- If a patient is on HRT, correlate with AMS/MENQOL scores and sexual function scores
- If on a weight loss protocol, correlate with TFEQ-R18 eating behavior scores
- If on peptides (BPC-157, GH secretagogues), consider impact on sleep, energy, mood
- If on HBOT/RLT, note expected improvements in energy, sleep, cognitive function
- Do NOT re-recommend treatments the patient is already on unless an adjustment is warranted
- DO suggest complementary protocols that would address unresolved findings

IMPORTANT: Do NOT include the patient's name, provider name, or any identifying header. The patient info is already displayed in the UI — jump straight into the clinical analysis.

VALIDATED INSTRUMENTS & INTERPRETATION:

PHQ-9 (Depression): 0-4 Minimal, 5-9 Mild, 10-14 Moderate, 15-19 Moderately Severe, 20-27 Severe
- Scores ≥10 suggest clinical significance and warrant intervention
- Track response: ≥50% reduction = treatment response, score <5 = remission

GAD-7 (Anxiety): 0-4 Minimal, 5-9 Mild, 10-14 Moderate, 15-21 Severe
- Scores ≥10 suggest clinical significance
- High anxiety + hormonal imbalance = common in peri/menopause and low testosterone

PHQ-9 + GAD-7 COMORBIDITY: When both are elevated, strongly suggests HPA axis dysregulation — cortisol, DHEA-S, and thyroid should be assessed via labs. Hormone optimization often improves both simultaneously.

AMS (Aging Males' Symptoms): 17-26 None, 27-36 Mild, 37-49 Moderate, 50-85 Severe
- Comprehensive male hormone deficiency screen covering fatigue, mood, libido, strength, cognition
- Scores >36 strongly correlate with low free testosterone
- Expected to improve significantly on TRT within 8-12 weeks

MENQOL (Menopause Quality of Life): Covers vasomotor, psychosocial, physical, sexual domains
- Higher scores = worse quality of life
- Vasomotor symptoms (hot flashes, sweating) respond best to HRT
- Psychosocial symptoms may need combined approach (HRT + peptides + lifestyle)

IIEF-5 (Erectile Function): 22-25 Normal, 17-21 Mild ED, 12-16 Mild-Moderate, 8-11 Moderate, 5-7 Severe
- Sexual function is a strong retention signal — patients who see improvement here stay on protocol
- Low IIEF-5 + low free T = strong TRT candidate
- Consider PT-141 or Kisspeptin as adjunct if IIEF-5 doesn't improve on TRT alone

FSFI-6 (Female Sexual Function): Lower scores = worse function
- Low libido in women is under-reported — this instrument captures it objectively
- Consider testosterone (female dosing), PT-141, oxytocin based on specific domain scores

TFEQ-R18 (Eating Behavior): Three subscales — Cognitive Restraint, Uncontrolled Eating, Emotional Eating
- High Uncontrolled Eating = strong GLP-1 candidate (tirzepatide/retatrutide directly target satiety/craving axis)
- High Emotional Eating = may benefit from mood support alongside weight loss protocol
- GLP-1 therapy fundamentally changes these scores — track at 90 days to demonstrate behavioral transformation
- A patient who loses 10 lbs but whose Uncontrolled Eating score drops from 45 to 18 is showing the mechanism of action

PSQI / Sleep Quality: 0-3 Good, 4-5 Fair, 6+ Poor
- Sleep is upstream of everything — poor sleep tanks hormones, recovery, weight loss, cognition
- DSIP peptide for sleep onset/quality
- CJC/Ipamorelin improves deep sleep via GH pulse during sleep
- HBOT + RLT protocol has evidence for sleep quality improvement
- Rule out sleep apnea if sleep score is poor + patient is overweight or on TRT (TRT can worsen apnea)

FATIGUE VAS (Energy Level 0-10): Higher = better energy
- Energy <5 = clinically significant fatigue
- Consider: NAD+ (cellular energy), IV therapy, thyroid optimization, iron/ferritin levels
- HBOT + RLT Cellular Energy Reset is the flagship protocol for fatigue
- If energy is low + sleep is poor, address sleep first

INJURY BASELINE:
- Pain Severity 0-10 (NRS): >7 = severe, warrants aggressive intervention
- Functional Limitation 0-10: How much daily life is impacted
- Trajectory: Getting better / Staying same / Getting worse
- BPC-157 + TB-4 is first-line for musculoskeletal injury
- Recovery 4-Blend (BPC-157/TB-4/KPV/MGF) for complex or chronic injuries
- HBOT accelerates tissue healing — consider combining with peptide protocol

LAB CORRELATION GUIDANCE:
When lab results are provided, correlate them with assessment findings:
- Low free testosterone + high AMS score = strong biochemical + symptomatic confirmation of hypogonadism
- Elevated fasting insulin/glucose + high TFEQ uncontrolled eating = metabolic dysfunction driving eating behavior
- Low vitamin D + poor sleep + low energy = common triad, D optimization may improve all three
- Elevated hs-CRP + high PHQ-9/GAD-7 = inflammation-mood axis, address inflammation alongside mood support
- Thyroid markers (TSH, Free T3, Free T4) + fatigue/brain fog/weight = thyroid contribution to symptoms
- Low ferritin + fatigue = iron deficiency contributing to energy complaints
- Elevated cortisol/DHEA-S ratio + anxiety + poor sleep = HPA axis dysregulation
- ApoB/lipid markers + TFEQ + weight = cardiovascular risk context for weight loss urgency
- Hematocrit on TRT + sleep quality = sleep apnea screening consideration
- IGF-1 levels + sleep quality = GH secretagogue response assessment

When labs confirm or contradict assessment findings, call it out specifically. When labs suggest a cause for assessment scores, explain the mechanism. When assessment scores suggest labs should be ordered, recommend them.

FORMAT YOUR RESPONSE WITH THESE EXACT SECTION HEADERS:

KEY FINDINGS
- Summarize the most clinically significant scores
- Group related findings (e.g., mood + sleep + energy as a cluster)
- Note any scores that warrant immediate attention or referral

CLINICAL PATTERNS
- Identify cross-instrument correlations
- Examples: high PHQ-9 + high GAD-7 + poor sleep = HPA axis pattern; high AMS + low energy + poor sleep = classic male hypogonadism presentation; high TFEQ uncontrolled eating + low energy = metabolic dysfunction pattern
- Connect symptom clusters to likely underlying mechanisms

CURRENT PROTOCOL ASSESSMENT
- Only include if patient has active protocols
- Assess whether current treatments should address the assessment findings
- Note expected timelines for improvement
- Flag any gaps — symptoms not covered by current protocols

RANGE MEDICAL TREATMENT RECOMMENDATIONS
Based on findings, recommend specific treatments from Range Medical's menu:

RANGE MEDICAL CLINICAL PROTOCOLS:

1. HRT - TESTOSTERONE (MALE): Cypionate 200mg/mL, IM 2x/week or SubQ daily. 100-200mg/week.
2. HRT - TESTOSTERONE (FEMALE): Cypionate 100mg/mL, 10-40mg/week.
3. GH SECRETAGOGUE - 2X BLEND (CJC-1295/Ipamorelin): SubQ evening, 5on/2off. 3-phase dosing.
4. GH SECRETAGOGUE - 3X BLEND (Tesamorelin/MGF/Ipamorelin): Adds MGF for regenerative response.
5. GH SECRETAGOGUE - 4X BLEND (GHRP-2/Tesamorelin/MGF/Ipamorelin): Maximum GH output.
6. BPC-157 + TB-4: 500mcg each daily SubQ. 10/20/30-day programs. Healing/recovery.
7. RECOVERY 4-BLEND (BPC-157/TB-4/KPV/MGF): Advanced recovery protocol.
8. MOTS-c: Metabolic optimization, insulin resistance, mitochondrial function.
9. NAD+ INJECTION: SubQ 3x weekly. Cellular energy, cognitive function.
10. BDNF 3-PHASE: Cognitive — brain fog, focus, mood, verbal fluency.
11. GHK-Cu: Skin/hair/tissue regeneration.
12. DSIP: Sleep quality, cortisol regulation. 500mcg-1mg SubQ before bed.
13. RETATRUTIDE: GLP-1/GIP/Glucagon triple agonist. Weekly SubQ. ~28.7% body weight loss.
14. TIRZEPATIDE: GLP-1/GIP dual agonist. Weekly SubQ. 15-22% body weight loss.
15. CELLULAR ENERGY RESET (HBOT + RLT): 6-week intensive, 3x weekly. ATP, mitochondria, stem cells.
16. CELLULAR ENERGY MAINTENANCE (HBOT + RLT): 1-2x weekly after reset.

OTHER AVAILABLE:
- IV Therapy: NAD+ IV, Glutathione IV, High-dose Vitamin C IV, Range IV, Exosome IV
- Cognitive: Dihexa, Semax, Selank, PE-22-28
- Sexual Health: PT-141, Kisspeptin, Oxytocin
- Immune: TA1, Thymalin, LL-37, KPV

LAB CORRELATION
- Only include if lab results are provided
- Connect specific biomarker values to specific assessment scores
- Explain what the labs confirm, contradict, or add to the clinical picture from the assessment
- Identify biomarker-symptom pairs that reinforce treatment decisions
- Call out any labs that should be ordered based on assessment findings but are missing

FOLLOW-UP PLAN
- Recommend reassessment timeline (typically 90 days)
- Note which scores to track most closely
- Suggest any labs that should be ordered to correlate with assessment findings

RULES:
- Be concise but thorough — this is a clinical reference, not patient-facing
- Use dashes (-) for bullet points
- No markdown formatting (no **, no ##, no backticks)
- Keep each section focused and scannable
- Never diagnose — frame as "findings consistent with" or "suggestive of"
- Connect every recommendation to a specific finding from the assessment
- When a patient has active protocols, assess results IN CONTEXT of those treatments
- If injury + optimization scores are both present (combined baseline), address both domains`;

/**
 * Generate an AI clinical synopsis for a baseline assessment.
 * Returns the synopsis text, or null on failure.
 */
export async function generateAssessmentSynopsis(supabase, questionnaireId, patientId) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[assessment-synopsis] ANTHROPIC_API_KEY not configured');
      return null;
    }

    // 1. Fetch the questionnaire record
    const { data: questionnaire, error: qErr } = await supabase
      .from('baseline_questionnaires')
      .select('*')
      .eq('id', questionnaireId)
      .single();

    if (qErr || !questionnaire) {
      console.error('[assessment-synopsis] Questionnaire fetch error:', qErr?.message);
      return null;
    }

    if (questionnaire.status !== 'completed') {
      console.log('[assessment-synopsis] Questionnaire not completed yet');
      return null;
    }

    // 2. Fetch patient info
    const { data: patient } = await supabase
      .from('patients')
      .select('id, name, first_name, last_name, date_of_birth, gender')
      .eq('id', patientId)
      .single();

    const patientName = patient?.name || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim() || 'Unknown';
    const gender = patient?.gender || null;

    // 3. Fetch intake data for medical context
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
      console.error('[assessment-synopsis] Intake fetch error:', e.message);
    }

    // 4. Fetch active protocols
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
      console.error('[assessment-synopsis] Protocol fetch error:', e.message);
    }

    // 5. Fetch prior baseline for trend comparison
    let priorBaselineText = '';
    try {
      const { data: priorBaseline } = await supabase
        .from('baseline_questionnaires')
        .select('scored_totals, responses, door, submitted_at')
        .eq('patient_id', patientId)
        .eq('status', 'completed')
        .neq('id', questionnaireId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (priorBaseline && priorBaseline.scored_totals) {
        const priorScores = [];
        for (const [key, data] of Object.entries(priorBaseline.scored_totals)) {
          if (data.score != null) {
            priorScores.push(`${key}: ${data.score}/${data.maxScore || '?'} (answered ${data.answered || '?'}/${data.totalQuestions || '?'})`);
          }
        }
        if (priorScores.length > 0) {
          priorBaselineText = `\nPRIOR BASELINE ASSESSMENT (${priorBaseline.submitted_at?.split('T')[0] || 'date unknown'}):\n${priorScores.join('\n')}`;
        }
      }
    } catch (e) {
      console.error('[assessment-synopsis] Prior baseline fetch error:', e.message);
    }

    // 6. Fetch most recent lab results for correlation
    let labDataText = '';
    try {
      const { data: lab } = await supabase
        .from('labs')
        .select('*')
        .eq('patient_id', patientId)
        .order('test_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lab) {
        // Fetch reference ranges
        let rangesQuery = supabase.from('lab_reference_ranges').select('*');
        if (gender) {
          rangesQuery = rangesQuery.or(`gender.eq.${gender},gender.eq.Both`);
        }
        const { data: ranges } = await rangesQuery;
        const rangesMap = {};
        (ranges || []).forEach(r => { rangesMap[r.biomarker] = r; });

        const groupedOutput = {};
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
          const category = meta?.category || 'Other';

          if (!groupedOutput[category]) groupedOutput[category] = [];
          const refRange = (refLow !== null && refHigh !== null) ? `ref: ${refLow}-${refHigh}` : '';
          const optRange = (optLow !== null && optHigh !== null) ? `optimal: ${optLow}-${optHigh}` : '';
          const rangeStr = [refRange, optRange].filter(Boolean).join(', ');
          groupedOutput[category].push(
            `${meta?.label || key}: ${typeof value === 'number' ? value : parseFloat(value)} ${meta?.unit || ''} [${flag?.toUpperCase() || 'N/A'}] ${rangeStr ? `(${rangeStr})` : ''}`
          );
        }

        if (Object.keys(groupedOutput).length > 0) {
          labDataText = `\nMOST RECENT LAB RESULTS (${lab.test_date || 'date unknown'}):\n`;
          for (const cat of categoryOrder) {
            if (!groupedOutput[cat]) continue;
            labDataText += `\n${cat}:\n${groupedOutput[cat].join('\n')}\n`;
          }
        }
      }
    } catch (e) {
      console.error('[assessment-synopsis] Lab fetch error:', e.message);
    }

    // 7. Build user message
    const scores = questionnaire.scored_totals || {};
    const responses = questionnaire.responses || {};
    const door = questionnaire.door;
    const doorLabel = door === 1 ? 'Injury Baseline' : door === 2 ? 'Optimization Baseline' : 'Combined Baseline';

    let userMessage = `PATIENT: ${patientName}\nGENDER: ${gender || 'Not specified'}\nDOB: ${patient?.date_of_birth || 'Not on file'}\nASSESSMENT TYPE: ${doorLabel} (Door ${door})\nSUBMITTED: ${questionnaire.submitted_at?.split('T')[0] || 'Unknown'}\n`;

    if (responses.primary_goal) {
      userMessage += `\nPATIENT'S STATED GOAL: "${responses.primary_goal}"\n`;
    }

    if (medicalContext) {
      userMessage += `\nMEDICAL CONTEXT:\n${medicalContext}\n`;
    }

    if (activeProtocolsText) {
      userMessage += activeProtocolsText + '\n';
    }

    // Injury baseline data
    if (door === 1 || door === 3) {
      userMessage += '\nINJURY BASELINE:\n';
      if (responses.pain_severity != null) userMessage += `Pain Severity: ${responses.pain_severity}/10\n`;
      if (responses.functional_limitation != null) userMessage += `Functional Limitation: ${responses.functional_limitation}/10\n`;
      if (responses.trajectory) userMessage += `Trajectory: ${responses.trajectory}\n`;
    }

    // Scored instruments
    if (Object.keys(scores).length > 0) {
      userMessage += '\nASSESSMENT SCORES:\n';
      for (const [key, data] of Object.entries(scores)) {
        if (data.score != null) {
          userMessage += `${key}: ${data.score}/${data.maxScore || '?'} (answered ${data.answered || '?'}/${data.totalQuestions || '?'})\n`;
        }
      }
    }

    // Raw responses for context
    if (responses.fatigue_vas != null) {
      userMessage += `\nEnergy Level (Fatigue VAS): ${responses.fatigue_vas}/10\n`;
    }

    // Sleep details
    const sleepFields = ['bedtime', 'sleep_hours', 'sleep_quality', 'sleep_disturbance', 'daytime_dysfunction'];
    const hasSleep = sleepFields.some(f => responses[f] != null);
    if (hasSleep) {
      userMessage += '\nSLEEP DETAILS:\n';
      if (responses.bedtime) userMessage += `Usual Bedtime: ${responses.bedtime}\n`;
      if (responses.sleep_hours) userMessage += `Hours of Sleep: ${responses.sleep_hours}\n`;
      if (responses.sleep_quality) userMessage += `Sleep Quality: ${responses.sleep_quality}\n`;
      if (responses.sleep_disturbance) userMessage += `Sleep Disturbance: ${responses.sleep_disturbance}\n`;
      if (responses.daytime_dysfunction) userMessage += `Daytime Dysfunction: ${responses.daytime_dysfunction}\n`;
    }

    if (labDataText) {
      userMessage += labDataText;
    }

    if (priorBaselineText) {
      userMessage += priorBaselineText;
    }

    // 8. Call Claude API
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }]
    });

    const synopsis = message.content?.[0]?.text || null;

    if (!synopsis) {
      console.error('[assessment-synopsis] Empty response from Claude API');
      return null;
    }

    // 8. Store in database
    await supabase
      .from('baseline_questionnaires')
      .update({
        ai_synopsis: synopsis,
        ai_synopsis_generated_at: new Date().toISOString()
      })
      .eq('id', questionnaireId);

    console.log(`[assessment-synopsis] Synopsis generated for ${patientName} (questionnaire ${questionnaireId})`);
    return synopsis;

  } catch (error) {
    console.error('[assessment-synopsis] Generation error:', error.message);
    return null;
  }
}
