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
  injection: {
    label: 'Injection',
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
  if (name.includes('iv') || name.includes('infusion') || name.includes('nad') || name.includes('drip')) return 'iv_therapy';
  if (name.includes('hrt') || name.includes('testosterone') || name.includes('hormone') || name.includes('trt')) return 'hrt_followup';
  if (name.includes('weight') || name.includes('glp') || name.includes('sema') || name.includes('tirz') || name.includes('mounjaro') || name.includes('ozempic')) return 'weight_loss';
  if (name.includes('hbot') || name.includes('hyperbaric')) return 'hbot_session';
  if (name.includes('rlt') || name.includes('red light')) return 'rlt_session';
  if (name.includes('injection') || name.includes('b12') || name.includes('lipo')) return 'injection';
  if (name.includes('consult') || name.includes('follow') || name.includes('new patient')) return 'consultation';
  return 'general';
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
