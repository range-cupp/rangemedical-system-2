// /lib/wl-note-parser.js
// Parse weight-loss encounter note body markdown to extract the same fields
// the structured_data form normally provides. Used as a fallback when an
// encounter note is saved without structured_data (legacy clients, edits via
// the body PATCH endpoint, or any path that bypasses the form).
//
// The body format we parse looks like:
//   **Medication:** Retatrutide
//   **Dose:** 1mg
//   **Route:** Subcutaneous (SubQ)
//   **Injection Site:** LLQ (Abd)
//
//   **Current Weight:** 128 lbs
//   **Vitals:** BP 97/62 | HR 65 | Temp 97.8°F | O2 98%
//
//   **Side Effects:** None reported. ...

function field(body, label) {
  const re = new RegExp(`\\*\\*${label}:\\*\\*\\s*([^\\n]+)`, 'i');
  const m = body.match(re);
  return m ? m[1].trim() : null;
}

function parseWeightLbs(raw) {
  if (!raw) return null;
  const m = String(raw).match(/(-?\d+\.?\d*)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return isNaN(n) ? null : n;
}

// Strip trailing punctuation/whitespace and normalize "1 mg" → "1mg"
function normalizeDose(raw) {
  if (!raw) return null;
  const cleaned = String(raw).trim().replace(/\.$/, '');
  // Collapse spaces between number and unit: "1 mg" → "1mg"
  return cleaned.replace(/(\d+\.?\d*)\s+(mg|mcg|ml|iu)\b/i, '$1$2');
}

/**
 * Parse a weight-loss encounter note body into the same shape that
 * structured_data carries. Returns null if no recognizable WL fields are
 * present (so callers can detect "not actually a WL note" cases).
 */
export function parseWLNoteBody(body) {
  if (!body || typeof body !== 'string') return null;

  const medication = field(body, 'Medication');
  const doseRaw = field(body, 'Dose');
  const weightRaw = field(body, 'Current Weight') || field(body, 'Weight');
  const sideEffects = field(body, 'Side Effects');
  const route = field(body, 'Route');
  const site = field(body, 'Injection Site');

  // If we found nothing recognizable, don't fabricate a WL sync payload.
  if (!medication && !doseRaw && !weightRaw) return null;

  return {
    medication: medication || null,
    dose: normalizeDose(doseRaw),
    weight: parseWeightLbs(weightRaw),
    side_effects: sideEffects || null,
    route: route || null,
    site: site || null,
  };
}

/**
 * Merge structured_data and body-parsed fields into a single canonical
 * shape. structured_data wins when present; body-parsed fills any gaps.
 * Returns null if neither source yielded anything usable.
 */
export function extractWLFields(structured_data, body) {
  const fromBody = parseWLNoteBody(body);
  const sd = structured_data || {};

  const dose = sd?.medication?.dose || fromBody?.dose || null;
  const medication = sd?.medication?.medication_name || fromBody?.medication || null;
  const weightRaw = sd?.weight_vitals?.current_weight;
  const weight = weightRaw != null && weightRaw !== ''
    ? parseFloat(weightRaw)
    : fromBody?.weight ?? null;
  const startingWeightRaw = sd?.weight_vitals?.starting_weight;
  const startingWeight = startingWeightRaw != null && startingWeightRaw !== ''
    ? parseFloat(startingWeightRaw)
    : null;
  const goalWeightRaw = sd?.weight_vitals?.goal_weight;
  const goalWeight = goalWeightRaw != null && goalWeightRaw !== ''
    ? parseFloat(goalWeightRaw)
    : null;

  if (!dose && !medication && (weight == null || isNaN(weight))) return null;

  return {
    dose,
    medication,
    weight: weight != null && !isNaN(weight) ? weight : null,
    starting_weight: startingWeight != null && !isNaN(startingWeight) ? startingWeight : null,
    goal_weight: goalWeight != null && !isNaN(goalWeight) ? goalWeight : null,
    plan: sd?.assessment?.plan || null,
    additional_notes: sd?.additional?.notes || null,
    side_effects: fromBody?.side_effects || null,
    source: structured_data ? 'structured_data' : 'body_markdown',
  };
}
