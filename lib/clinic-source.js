// /lib/clinic-source.js
// Single source of truth for classifying patients as Range Medical vs Range Sports Therapy.
// Derivation rule (in order):
//   1. patients.referral_source — canonical, editable on patient profile
//   2. intakes.how_heard — fallback for patients who haven't been manually tagged
//
// Bucket rule:
//   - Contains "Dr. G" (as a word), "Aaron Berger", or "Range Sports Therapy" -> range_sports_therapy
//     (substring match handles nested variants like "Friend or Family Member: Dr.G"
//      or "Friend or Family Member: Aaron Berger")
//   - Any other non-empty string -> range_medical
//   - Null / empty -> unknown

export const CLINIC_SOURCES = {
  RANGE_MEDICAL: 'range_medical',
  RANGE_SPORTS_THERAPY: 'range_sports_therapy',
  UNKNOWN: 'unknown',
};

export const CLINIC_SOURCE_LABELS = {
  range_medical: 'Range Medical',
  range_sports_therapy: 'Range Sports Therapy',
  unknown: 'Unknown',
};

// Word-boundary "Dr. G" matches "Dr. G", "Dr G", "Dr.G" but NOT "Dr. Gerald" or "Dr. Gonzalez"
const RST_PATTERNS = [
  /\bdr\.?\s*g\b/i,
  /\baaron\s+berger\b/i,
  /\brange\s+sports\s+therapy\b/i,
];

export function bucketReferralSource(rawValue) {
  if (!rawValue || typeof rawValue !== 'string') return CLINIC_SOURCES.UNKNOWN;
  const normalized = rawValue.trim();
  if (!normalized) return CLINIC_SOURCES.UNKNOWN;
  for (const pat of RST_PATTERNS) {
    if (pat.test(normalized)) return CLINIC_SOURCES.RANGE_SPORTS_THERAPY;
  }
  return CLINIC_SOURCES.RANGE_MEDICAL;
}

export function resolveReferralSource(patient, intake) {
  const patientValue = patient?.referral_source?.trim?.() || null;
  if (patientValue) return patientValue;
  const intakeValue = intake?.how_heard?.trim?.() || null;
  return intakeValue || null;
}

export function getClinicSource(patient, intake) {
  return bucketReferralSource(resolveReferralSource(patient, intake));
}
