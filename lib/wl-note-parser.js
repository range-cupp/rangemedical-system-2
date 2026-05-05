// /lib/wl-note-parser.js
// Parse weight-loss encounter note body to extract the same fields the
// structured_data form normally provides. Handles two body formats:
//
// 1. Markdown (Range encounter form):
//      **Medication:** Retatrutide
//      **Dose:** 1mg
//      **Current Weight:** 128 lbs
//
// 2. HTML (Practice Fusion / older form templates):
//      <strong>Medication:</strong> Retatrutide<br>
//      <strong>Dose:</strong> 1mg<br>
//      <strong>Current Weight:</strong> 128 lbs<br>
//
// Both come through patient_notes.body and need to be parseable so the
// note-sync helper can stamp dose/weight onto a service_log row.

function field(body, label) {
  // 1) Markdown: **Label:** value
  const mdRe = new RegExp(`\\*\\*${label}:\\*\\*\\s*([^\\n]+)`, 'i');
  const md = body.match(mdRe);
  if (md) return md[1].trim();

  // 2) HTML: <strong>Label:</strong> value (or <b>Label:</b>)
  // Value runs to the next tag (e.g. <br>) or newline.
  const htmlRe = new RegExp(`<(?:strong|b)>\\s*${label}:\\s*</(?:strong|b)>\\s*([^\\n<]+)`, 'i');
  const html = body.match(htmlRe);
  if (html) {
    return html[1]
      .trim()
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#x2014;|&mdash;/g, '—');
  }

  return null;
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
