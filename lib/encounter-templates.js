// lib/encounter-templates.js
// Note templates per service type for encounter notes

export const NOTE_TYPES = {
  soap: {
    label: 'SOAP Note',
    description: 'Subjective, Objective, Assessment, Plan',
    sections: ['SUBJECTIVE', 'OBJECTIVE', 'ASSESSMENT', 'PLAN'],
  },
  dap: {
    label: 'DAP Note',
    description: 'Data, Assessment, Plan',
    sections: ['DATA', 'ASSESSMENT', 'PLAN'],
  },
  procedure: {
    label: 'Procedure Note',
    description: 'Procedure, Indication, Technique, Findings, Plan',
    sections: ['PROCEDURE', 'INDICATION', 'TECHNIQUE', 'FINDINGS', 'COMPLICATIONS', 'PLAN'],
  },
  progress: {
    label: 'Progress Note',
    description: 'Free-form clinical progress note',
    sections: [],
  },
  phone: {
    label: 'Phone/Message Note',
    description: 'Brief communication log',
    sections: ['CONTACT', 'DISCUSSION', 'ACTION ITEMS'],
  },
};

export const ENCOUNTER_TEMPLATES = {
  iv_therapy: {
    label: 'IV Therapy',
    defaultNoteType: 'procedure',
    quickNotes: [
      'Tolerated well',
      'No adverse reactions',
      'Patient rested during infusion',
      'IV site clean, no infiltration',
      'Vitals stable throughout',
    ],
  },
  hrt_followup: {
    label: 'HRT Follow-up',
    defaultNoteType: 'soap',
    quickNotes: [
      'No side effects reported',
      'Labs reviewed — within normal range',
      'Energy improved',
      'Continue current protocol',
      'Dose adjustment recommended',
    ],
  },
  weight_loss: {
    label: 'Weight Loss Check-in',
    defaultNoteType: 'soap',
    quickNotes: [
      'Medication compliant',
      'Appetite decreased',
      'No nausea or GI side effects',
      'Weight trending down',
      'Discussed diet and exercise',
    ],
  },
  peptide_injection: {
    label: 'Peptide Injection',
    defaultNoteType: 'procedure',
    quickNotes: [
      'Deltoid L',
      'Deltoid R',
      'Gluteal L',
      'Gluteal R',
      'Abdomen L',
      'Abdomen R',
      'No reaction at injection site',
      'Patient tolerated well',
    ],
  },
  injection: {
    label: 'Range Injection',
    defaultNoteType: 'procedure',
    quickNotes: [
      'Deltoid L',
      'Deltoid R',
      'Gluteal L',
      'Gluteal R',
      'No reaction at injection site',
      'Administered without incident',
    ],
  },
  hbot_session: {
    label: 'HBOT Session',
    defaultNoteType: 'progress',
    quickNotes: [
      'Completed full session',
      'Tolerated pressure well',
      'No ear discomfort',
      'Patient reports feeling energized',
    ],
  },
  rlt_session: {
    label: 'Red Light Therapy',
    defaultNoteType: 'progress',
    quickNotes: [
      'Completed full session',
      'No skin irritation',
      'Patient reports improvement',
    ],
  },
  consultation: {
    label: 'Consultation',
    defaultNoteType: 'soap',
    quickNotes: [
      'New patient consultation',
      'Follow-up consultation',
      'Discussed treatment options',
      'Patient agrees to proceed',
      'Labs ordered',
    ],
  },
  general: {
    label: 'General',
    defaultNoteType: 'progress',
    quickNotes: [],
  },
};

// Map appointment service names to template keys
export function getTemplateForService(serviceName) {
  const name = (serviceName || '').toLowerCase();
  if (name.includes('iv') || name.includes('infusion') || name.includes('nad') || name.includes('drip') || name.includes('glutathione') || name.includes('vitamin c') || name.includes('methylene') || name.startsWith('mb ')) return 'iv_therapy';
  if (name.includes('hrt') || name.includes('testosterone') || name.includes('hormone') || name.includes('trt')) return 'hrt_followup';
  if (name.includes('weight') || name.includes('glp') || name.includes('sema') || name.includes('tirz') || name.includes('mounjaro') || name.includes('ozempic')) return 'weight_loss';
  if (name.includes('hbot') || name.includes('hyperbaric')) return 'hbot_session';
  if (name.includes('rlt') || name.includes('red light')) return 'rlt_session';
  if (name.includes('peptide') || name.includes('bpc') || name.includes('tb-4') || name.includes('tb4')) return 'peptide_injection';
  if (name.includes('phlebotomy') || name.includes('blood draw') || name.includes('venipuncture')) return 'injection';
  if (name.includes('injection') || name.includes('b12') || name.includes('lipo')) return 'injection';
  if (name.includes('consult') || name.includes('follow') || name.includes('new patient')) return 'consultation';
  return 'general';
}

// Pre-filled clinical note templates (Nurse Lily's templates)
// ?? markers are fill-in-the-blank fields for the clinician
export const NURSE_TEMPLATES = {
  injection: {
    label: 'Injection Note',
    category: 'injection',
    defaultNoteType: 'procedure',
    body: `The patient's identity has been verified. The patient's allergies have been reviewed. Risk and benefits have been explained, and the patient has had ample time to ask questions regarding risk/benefits/outcomes. The patient has verbalized understanding. The patient denies contraindications. Consent obtained.

**Medication:** ??
**Dose:** ??
**Route:** ??
**Site:** ??
**Lot/Expiration:** ??
**Ultrasound Guided:** ??
**Outcome:** Patient tolerated injection well. No bleeding, hematoma, or adverse reaction observed. Bandaid applied.
**Post-Care:** Patient provided with written instructions (virtually and hard copy). Risks, benefits, and possible side effects reviewed. Patient verbalized understanding. Hard copy of education sheet given.
**Follow up:** PRN
**Performed By:** ??`,
  },

  blood_draw: {
    label: 'Blood Draw Note',
    category: 'injection',
    defaultNoteType: 'procedure',
    body: `**Procedure:** Venipuncture for Laboratory Testing
**Tests Ordered:** ??
**Fasting Status:** ??
**Site:** ?? Antecubital Fossa
**Needle Size:** ??G Butterfly
**Tubes Collected:** ?? SST ?? Lavender
**Patient Tolerance:** Procedure well tolerated; no adverse reaction noted.
**Post-Procedure Care:** Gauze applied and secured with Coban; no active bleeding or hematoma observed.
**Patient Care Instructions:** Patient advised they can remove the dressing in 30 minutes. The patient was instructed to keep the site clean and dry, and to report any pain, swelling, and redness to the clinic.
**Performed By:** ??`,
  },

  peptide_injection: {
    label: 'Peptide Injection Note',
    category: 'injection',
    defaultNoteType: 'procedure',
    body: `The patient's identity has been verified. The patient's allergies have been reviewed. Risk and benefits have been explained, and the patient has had ample time to ask questions regarding risk/benefits/outcomes. The patient has verbalized understanding. The patient denies contraindications. Consent obtained.

**PROGRESS NOTE**
**Medication:** BPC-157/TB-4 combination
**Dose:** 500mcg/500mcg
**Route:** Subcutaneous
**Site:** ??
**Lot/Expiration:** ??
**Outcome:** Patient tolerated injection well. No bleeding, hematoma, or adverse reaction observed. Bandaid applied.
**Post-Care:** Patient provided with written instructions (virtually and hard copy). Risks, benefits, and possible side effects reviewed. Patient verbalized understanding. Hard copy of education sheet given.
**Performed By:** ??`,
  },

  iv_nad: {
    label: 'IV Infusion: NAD',
    category: 'iv_therapy',
    defaultNoteType: 'procedure',
    body: `**IV Access**
**IV catheter size:** ?? gauge
**Location:** ??
**Number of attempts:** ??
**Patient tolerance to IV start:** well tolerated
**Blood return confirmed; line flushed easily without resistance**

**IV Infusion Note** Prepared and administered the following infusion in ?? mL of 0.9% Normal Saline:

**Medications:**
NAD+ – ?? MG
Zofran (Ondansetron) – 4 mg IV for nausea prevention

**Pre-Infusion Vitals:** BP ??/?? | HR ?? | O2 Sat ??%
**Post-Infusion Vitals:** BP ??/?? | HR ?? | O2 Sat ??%

The infusion was completed approximately ?? minutes without complications. The patient tolerated the procedure well with no pain, burning, or discomfort. The IV site remained clean, dry, and intact throughout the treatment with no evidence of infiltration or phlebitis.
Upon completion, the catheter was removed intact. Gauze and Coban pressure dressing were applied to the puncture site. No hematoma or active bleeding was noted.
The patient was discharged from Range Medical in stable condition. Post-infusion and emergency precautions were reviewed, including instructions to maintain hydration and seek immediate medical attention if any concerning symptoms occur. The patient verbalized understanding.
**Performed By:** ??`,
  },

  iv_range: {
    label: 'IV Infusion: Range',
    category: 'iv_therapy',
    defaultNoteType: 'procedure',
    body: `**IV Access**
**IV catheter size:** ?? gauge
**Location:** ??
**Number of attempts:** ??
**Patient tolerance to IV start:** well tolerated
**Blood return confirmed; line flushed easily without resistance**

**IV Infusion Note** Prepared and administered the following infusion in ?? mL of 0.9% Normal Saline:

**Vitamins:**
Vitamin C – 2ml (500 mg/mL)
Vitamin B12 (Hydroxocobalamin) – 2ml (5 mg/mL)
Vitamin B1 (Thiamine) 20 mg/ml and B6 (Pyridoxine) 100 mg/ml – 1ml
B-Complex – 3 mL (B1 100/ B2 2/B3 100/B5 2/B6 2 mg/mL)
Biotin – 2ml (10 mg/mL)
PlenishIV™ Nutrient Cocktail: 10 ml
Dexpanthenol (Vitamin B5) – 5.0 mg/mL
Pyridoxine HCl (Vitamin B6) – 2.0 mg/mL
Thiamine HCl (Vitamin B1) – 6.0 mg/mL
Niacinamide (Vitamin B3) – 0.05 mg/mL
Riboflavin (Vitamin B2) – 10.5 mg/mL

**Amino Acids and Blends:**
AminoMultiPlex (Preserved) : 2 ml
Arginine HCl – 50 mg/mL
Glutamine – 15 mg/mL
Lysine HCl – 15 mg/mL
Proline – 25 mg/mL
Amino Blend – 2 mL (Glutamine/Ornithine/Citrulline/Lysine/Carnitine/Arginine – 30/50/50/50/100/100 mg/mL)
BCAA – 2 mL (L-Isoleucine/L-Leucine/L-Valine – 15/10/40 mg/mL)
L-Carnitine – 1ml (500 mg/mL)
Lysine – 1 mL (100 mg/mL)
Taurine – 2 ml (50 mg/mL)

**Minerals:**
Magnesium Chloride – 2ml (200 mg/mL)
Zinc – 2ml (10 mg/mL)
Mineral Blend – 2 mL (Magnesium/Zinc/Manganese/Copper – 80/1/0.02/0.2 mg/mL)
Calcium Gluconate – ??

**Antioxidants and Supportive Agents:**
N-Acetylcysteine (NAC) – 2ml (200 mg/mL)
Lipoic Acid / Alpha-Lipoic Acid (ALA) – 10 ml (25 mg/mL)
Glutathione – 400 mg (200 mg/mL), administered via slow IV push at completion of infusion

**Medications:**
Zofran (Ondansetron) – 4 mg IV for nausea prevention
Toradol (Ketorolac) – 30 mg IV push for anti-inflammatory and analgesic support

**Pre-Infusion Vitals:** BP ??/?? | HR ?? | O2 Sat ??%
**Post-Infusion Vitals:** BP ??/?? | HR ?? | O2 Sat ??%

The infusion was completed approximately ?? minutes without complications. The patient tolerated the procedure well with no pain, burning, or discomfort. The IV site remained clean, dry, and intact throughout the treatment with no evidence of infiltration or phlebitis.
Upon completion, the line was flushed with normal saline and the catheter was removed intact. Gauze and Coban pressure dressing were applied to the puncture site. No hematoma or active bleeding was noted.
The patient was discharged from Range Medical in stable condition. Post-infusion and emergency precautions were reviewed, including instructions to maintain hydration and seek immediate medical attention if any concerning symptoms occur. The patient verbalized understanding.
**Performed By:** ??`,
  },

  iv_specialty: {
    label: 'IV Infusion: Specialty',
    category: 'iv_therapy',
    defaultNoteType: 'procedure',
    body: `**IV Access**
**IV catheter size:** ?? gauge
**Location:** ??
**Number of attempts:** ??
**Patient tolerance to IV start:** well tolerated
**Blood return confirmed; line flushed easily without resistance**

**IV Infusion Note** – Specialty IV (Methylene Blue, High dose Vitamin C and Magnesium) Prepared and administered the following in 500 mL of 0.9% Normal Saline:
**Vitamin C:** ?? g (500mg/ml)
**Magnesium Chloride:** 400 mg (200mg/ml)
**Methylene Blue:** 5 mg (5mg/ml)

**Pre-Infusion Vitals:** BP ??/?? | HR ?? | O2 Sat ??%
**Post-Infusion Vitals:** BP ??/?? | HR ?? | O2 Sat ??%

The infusion was completed approximately ?? minutes without complications. The patient tolerated the procedure well with no complaints of discomfort, pain, or burning. The IV site remained clean, dry, and intact throughout the infusion with no signs of infiltration or phlebitis.
Upon completion, the line was flushed with normal saline, and the IV catheter was removed with the tip intact. Gauze and Coban pressure dressing were applied to the insertion site. No hematoma, redness, or active bleeding was observed.
The patient was discharged from Range Medical in stable condition. Post-infusion and emergency precautions were reviewed, including instructions to call 911 in the event of any medical emergency. The patient verbalized understanding of all post-infusion instructions. Post infusion care instructions was sent via text.
**Performed By:** ??`,
  },

  therapeutic_phlebotomy: {
    label: 'Therapeutic Phlebotomy',
    category: 'injection',
    defaultNoteType: 'procedure',
    body: `**Procedure:** Therapeutic Phlebotomy
**Indication:** Elevated hematocrit
**Patient Condition on Arrival:** Alert and oriented ×4; ambulatory; denies dizziness, chest pain, shortness of breath, or active bleeding.

**Pre-Procedure Assessment:**

Vital signs obtained.
Peripheral vein assessed and found adequate for phlebotomy.
Patient educated on procedure, expected sensations, hydration importance, and post-procedure precautions.
Consent verified.
No contraindications identified.

**Procedure Details:**

Site prepped with antiseptic using sterile technique.
Venipuncture performed to (site: LAC/RAC).
**Volume removed:** ?? mL
The patient tolerated venipuncture well; no infiltration or complications noted.
Hemostasis achieved with direct pressure × several minutes; clean dressing applied.

**Pre-Hydration:**

**?? mL 0.9% normal saline infused via peripheral IV prior to phlebotomy.**
The patient tolerated hydration without adverse symptoms.

**Post-Procedure Assessment:**

The patient was observed for 15 minutes.
Post-vitals stable.
The patient denies dizziness, lightheadedness, nausea, or visual changes.
Oral fluids provided/encouraged.
The patient ambulated without difficulty.

**Education & Discharge Instructions:**

Increase hydration for next 24 hours.
Avoid strenuous activity, hot showers, or alcohol for 24 hours.
Keep dressing on for at least 2 hours.
Report dizziness, excessive bleeding, palpitations, or shortness of breath.
Discussed next scheduled phlebotomy session as per provider order.
**Patient discharged in stable condition with verbalized understanding of instructions.**
**Performed By:** ??`,
  },

  weight_loss_therapy: {
    label: 'Weight Loss Therapy Note',
    category: 'weight_loss',
    defaultNoteType: 'progress',
    body: `**Assessment:** Weight management therapy in progress. The patient is responding appropriately to the current treatment plan. No adverse effects observed.

**Plan:**
Continue current medication: ?? (e.g., Retatrutide, Semaglutide, Tirzepatide, etc.)
Reinforce hydration, high-protein diet, and balanced nutrition.
Encourage regular exercise (minimum 150 min/week moderate activity).
Monitor for side effects: nausea, fatigue, constipation, or injection site irritation.
Follow up in ?? weeks for reassessment and weight check.
Emergency precautions reviewed.

**Patient Education:** Discussed medication administration, potential side effects, and when to seek medical attention. Patient verbalized understanding.

**Dosage:** ?? mg

**Progress Note:**
?? mg ?? administered subcutaneously to ?? abdomen. No complications noted; skin left open to air. The patient denies any concerns at this time and reports satisfaction with progress. Reinforced importance of maintaining a balanced diet and regular exercise.
**Performed By:** ??`,
  },

  weight_loss_followup: {
    label: 'Weight Loss – Weekly Follow-Up',
    category: 'weight_loss',
    defaultNoteType: 'progress',
    body: `**Patient submitted weekly weight update via:** ??
**Current weight** reported and charted in vital signs.
**Side effect(s) reported:** ??
Denies additional new or concerning symptoms at this time. Side effects were addressed by reviewing supportive management strategies including ?? (e.g., hydration optimization, protein intake reinforcement, fiber adjustment, meal timing modification, antacid guidance, injection technique review). Education provided regarding expected medication effects and warning signs requiring medical attention.
**Plan:** ?? (continue current dose / adjust dose to ?? / hold therapy)
**Follow-up:** Scheduled for 1 week. The patient verbalizes understanding and agrees with the plan.
**Performed By:** ??`,
  },

  // ── Dr. Burgess Templates ──────────────────────────────────────────

  dr_injection: {
    label: 'Dr. B – Injection (Steroid/PRP/Testosterone)',
    category: 'injection',
    defaultNoteType: 'procedure',
    body: `Patient's identity has been verified.
Patient's allergies have been reviewed.
Risk and benefits have been explained, and patient has had ample time to ask questions regarding risk/benefits/outcomes.
Patient has verbalized understanding.
Patient denies contraindications.
Consent obtained.

**Medication:** ??
**Dose:** ??
**Route:** ??
**Site:** ??
**Ultrasound Guided:** ??
**Outcome:** Patient tolerated injection well. No bleeding, hematoma, or adverse reaction observed. Bandaid applied.
**Post-Care:** Patient provided with written instructions (virtually and hard copy). Risks, benefits, and possible side effects reviewed. Patient verbalized understanding. Hard copy of education sheet given.
**Follow up:** PRN`,
  },

  dr_bpc_injection: {
    label: 'Dr. B – BPC Injection',
    category: 'injection',
    defaultNoteType: 'procedure',
    body: `**PROGRESS NOTE**
**Medication:** BPC-157/TB-500 combination
**Dose:** 500mcg/500mcg
**Route:** Subcutaneous
**Site:** ??
**Outcome:** Patient tolerated injection well. No bleeding, hematoma, or adverse reaction observed. Bandaid applied.
**Post-Care:** Patient provided with written instructions (virtually and hard copy). Risks, benefits, and possible side effects reviewed. Patient verbalized understanding. Hard copy of education sheet given.`,
  },

  dr_iv_access: {
    label: 'Dr. B – IV Access + NAD Infusion',
    category: 'iv_therapy',
    defaultNoteType: 'procedure',
    body: `**IV Access**
**IV catheter size:** ?? gauge
**Location:** ??
**Number of attempts:** ??
**Patient tolerance to IV start:** well tolerated
Blood return confirmed; line flushed easily without resistance

**IV Infusion Note** Prepared and administered the following infusion in ?? mL of 0.9% Normal Saline:

**Medications:**
NAD+ – ?? MG
Zofran (Ondansetron) – 4 mg IV for nausea prevention

The infusion was completed over approximately ?? minutes without complications. The patient tolerated the procedure well with no pain, burning, or discomfort. The IV site remained clean, dry, and intact throughout the treatment with no evidence of infiltration or phlebitis. Upon completion, the catheter was removed intact. Gauze and Coban pressure dressing were applied to the puncture site. No hematoma or active bleeding was noted. The patient was discharged from Range Medical in stable condition. Post-infusion and emergency precautions were reviewed, including instructions to maintain hydration and seek immediate medical attention if any concerning symptoms occur. The patient verbalized understanding.`,
  },

  dr_iv_full: {
    label: 'Dr. B – IV Full Infusion',
    category: 'iv_therapy',
    defaultNoteType: 'procedure',
    body: `**IV Infusion Note**
Prepared and administered the following infusion in ?? mL of 0.9% Normal Saline:

**Vitamins:**
Vitamin C – 2ml (500 mg/mL)
Vitamin B12 (Hydroxocobalamin) – 2ml (5 mg/mL)
Vitamin B1 (Thiamine) 20 mg/ml and B6 (Pyridoxine) 100 mg/ml – 1ml
B-Complex – 3 mL (B1 100/ B2 2/B3 100/B5 2/B6 2 mg/mL)
Biotin – 2ml (10 mg/mL)
PlenishIV™ Nutrient Cocktail: 10 ml
Dexpanthenol (Vitamin B5) – 5.0 mg/mL
Pyridoxine HCl (Vitamin B6) – 2.0 mg/mL
Thiamine HCl (Vitamin B1) – 6.0 mg/mL
Niacinamide (Vitamin B3) – 0.05 mg/mL
Riboflavin (Vitamin B2) – 10.5 mg/mL

**Amino Acids and Blends:**
AminoMultiPlex (Preserved) : 2 ml
Arginine HCl – 50 mg/mL
Glutamine – 15 mg/mL
Lysine HCl – 15 mg/mL
Proline – 25 mg/mL
Amino Blend – 2 mL (Glutamine/Ornithine/Citrulline/Lysine/Carnitine/Arginine – 30/50/50/50/100/100 mg/mL)
BCAA – 2 mL (L-Isoleucine/L-Leucine/L-Valine – 15/10/40 mg/mL)
L-Carnitine – 1ml (500 mg/mL)
Lysine – 1 mL (100 mg/mL)
Taurine – 2 ml (50 mg/mL)

**Minerals:**
Magnesium Chloride – 2ml (200 mg/mL)
Zinc – 2ml (10 mg/mL)
Mineral Blend – 2 mL (Magnesium/Zinc/Manganese/Copper – 80/1/0.02/0.2 mg/mL)
Calcium Gluconate – ??

**Antioxidants and Supportive Agents:**
N-Acetylcysteine (NAC) – 2ml (200 mg/mL)
Lipoic Acid / Alpha-Lipoic Acid (ALA) – 10 ml (25 mg/mL)
Glutathione – 400 mg (200 mg/mL), administered via slow IV push at completion of infusion

**Medications:**
Zofran (Ondansetron) – 4 mg IV for nausea prevention
Toradol (Ketorolac) – 30 mg IV push for anti-inflammatory and analgesic support

The infusion was completed over approximately ?? minutes without complications. The patient tolerated the procedure well with no pain, burning, or discomfort. The IV site remained clean, dry, and intact throughout the treatment with no evidence of infiltration or phlebitis.
Upon completion, the line was flushed with normal saline and the catheter was removed intact. Gauze and Coban pressure dressing were applied to the puncture site. No hematoma or active bleeding was noted.
The patient was discharged from Range Medical in stable condition. Post-infusion and emergency precautions were reviewed, including instructions to maintain hydration and seek immediate medical attention if any concerning symptoms occur. The patient verbalized understanding.`,
  },

  dr_weight_loss: {
    label: 'Dr. B – Weight Loss Note',
    category: 'weight_loss',
    defaultNoteType: 'progress',
    body: `**Assessment:** Weight management therapy in progress. Patient is responding appropriately to current treatment plan. No adverse effects observed.

**Plan:**
Continue current medication: ?? (e.g., Retatrutide, Semaglutide, Tirzepatide, etc.)
Reinforce hydration, high-protein diet, and balanced nutrition.
Encourage regular exercise (minimum 150 min/week moderate activity).
Monitor for side effects: nausea, fatigue, constipation, or injection site irritation.
Follow up in ?? weeks for reassessment and weight check.
Emergency precautions reviewed.

**Patient Education:** Discussed medication administration, potential side effects, and when to seek medical attention. Patient verbalized understanding.

**Dosage:** ?? mg

**Progress Note:**
?? mg ?? administered subcutaneously to ?? abdomen. No complications noted; skin left open to air. Patient denies any concerns at this time and reports satisfaction with progress. Reinforced importance of maintaining a balanced diet and regular exercise. Patient verbalized understanding.`,
  },

  dr_phlebotomy: {
    label: 'Dr. B – Therapeutic Phlebotomy',
    category: 'injection',
    defaultNoteType: 'procedure',
    body: `**Procedure:** Therapeutic Phlebotomy
**Indication:** Elevated hematocrit
**Patient Condition on Arrival:** Alert and oriented ×4; ambulatory; denies dizziness, chest pain, shortness of breath, or active bleeding.

**Pre-Procedure Assessment:**
Vital signs obtained.
Peripheral vein assessed and found adequate for phlebotomy.
Patient educated on procedure, expected sensations, hydration importance, and post-procedure precautions.
Consent verified.
No contraindications identified.

**Procedure Details:**
Site prepped with antiseptic using sterile technique.
Venipuncture performed to (site: LAC/RAC).
**Volume removed:** ?? mL
Patient tolerated venipuncture well; no infiltration or complications noted.
Hemostasis achieved with direct pressure × several minutes; clean dressing applied.

**Post-Procedure Assessment:**
Patient observed for 15 minutes.
Post-vitals stable.
Patient denies dizziness, lightheadedness, nausea, or visual changes.
Oral fluids provided/encouraged.
Patient ambulated without difficulty.

**Education & Discharge Instructions:**
Increase hydration for next 24 hours.
Avoid strenuous activity, hot showers, or alcohol for 24 hours.
Keep dressing on for at least 2 hours.
Report dizziness, excessive bleeding, palpitations, or shortness of breath.
Discussed next scheduled phlebotomy session as per provider order.
Patient discharged in stable condition with verbalized understanding of instructions.`,
  },
};

// Get nurse templates relevant to a service category
export function getTemplatesForCategory(templateKey) {
  const categoryMap = {
    iv_therapy: 'iv_therapy',
    peptide_injection: 'injection',
    injection: 'injection',
    weight_loss: 'weight_loss',
    hrt_followup: 'injection', // HRT often involves injections
    hbot_session: null,
    rlt_session: null,
    consultation: null,
    general: null,
  };
  const category = categoryMap[templateKey];
  const matched = [];
  const other = [];
  Object.entries(NURSE_TEMPLATES).forEach(([key, tmpl]) => {
    if (category && tmpl.category === category) {
      matched.push({ key, ...tmpl });
    } else {
      other.push({ key, ...tmpl });
    }
  });
  return { matched, other };
}

// Get the AI formatting prompt for a given note type
export function getFormatPromptForNoteType(noteType) {
  const prompts = {
    soap: `Format this clinical note as a SOAP note with these sections:
SUBJECTIVE — What the patient reports (symptoms, complaints, how they're feeling)
OBJECTIVE — Observable/measurable findings (vitals, exam findings, lab values mentioned)
ASSESSMENT — Clinical assessment and diagnosis
PLAN — Treatment plan, next steps, follow-up`,

    dap: `Format this clinical note as a DAP note with these sections:
DATA — Objective and subjective data gathered during the session
ASSESSMENT — Clinical interpretation of the data
PLAN — Actions to be taken, next steps`,

    procedure: `Format this clinical note as a Procedure Note with these sections:
PROCEDURE — Name of the procedure performed
INDICATION — Why the procedure was done
TECHNIQUE — How it was performed (site, method, materials)
FINDINGS — What was observed
COMPLICATIONS — Any complications (or "None")
PLAN — Post-procedure instructions, follow-up`,

    progress: `Format this as a professional clinical progress note. Clean up the language, organize into clear paragraphs or bullet points. Keep it concise and professional.`,

    phone: `Format this as a brief phone/message communication note with these sections:
CONTACT — Who was contacted and method (phone, text, email)
DISCUSSION — What was discussed
ACTION ITEMS — Any follow-up actions needed`,
  };

  return prompts[noteType] || prompts.progress;
}
