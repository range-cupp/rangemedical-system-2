// Translate a protocol record into the fields a draft prescription needs.
// Used both when auto-creating the linked prescription on protocol create,
// and when backfilling existing protocols. The patient page also uses the
// linked protocol as the source of truth at render time, so any later
// edit to the protocol (dose change, sig fix) shows up everywhere.
//
// Note: protocols are categorized via the `program_type` column. The API
// layer also computes a `category` field for the client; both are accepted
// here so this works against raw DB rows or API-shaped rows.

function categoryOf(protocol) {
  const raw = (protocol?.category || protocol?.program_type || '').toLowerCase();
  if (raw === 'hrt' || raw.includes('testosterone') || raw === 'hrt_male' || raw === 'hrt_female') return 'hrt';
  if (raw.includes('weight')) return 'weight_loss';
  if (raw === 'peptide' || raw.includes('peptide')) return 'peptide';
  return raw;
}

// Pick a sensible "form" string from how the protocol is dispensed.
function deriveForm(protocol) {
  if (!protocol) return null;
  const supply = (protocol.supply_type || '').toLowerCase();
  if (supply.includes('prefilled') || supply.includes('syringe')) return 'Prefilled Syringe';
  if (supply.includes('vial')) return 'Vial';
  const cat = categoryOf(protocol);
  if (cat === 'peptide') return 'Prefilled Syringe';
  if (cat === 'weight_loss') return 'Prefilled Syringe';
  if (cat === 'hrt') return 'Solution';
  return null;
}

export function protocolToPrescriptionFields(protocol) {
  if (!protocol) return null;
  const dose = protocol.selected_dose || protocol.starting_dose || protocol.current_dose || null;
  return {
    medication_name: protocol.medication || protocol.program_name || null,
    strength: dose,
    sig: protocol.sig || null,
    form: deriveForm(protocol),
    category: categoryOf(protocol) || null,
  };
}

// Whether this protocol type/status should auto-generate a prescription.
// Skip lab orders, in-clinic-only services (HBOT, RLT, IV), and protocols
// that look like placeholders (generic name, no dose, no sig). Provider
// can still hand-write a prescription on the encounter modal in those cases.
const PLACEHOLDER_NAMES = new Set([
  'weight loss program',
  'peptide protocol',
  'hrt protocol',
  'lab panel',
  'tbd',
]);

export function shouldAutoPrescribe(protocol) {
  if (!protocol) return false;
  const cat = categoryOf(protocol);
  if (!['hrt', 'weight_loss', 'peptide'].includes(cat)) return false;
  const med = (protocol.medication || '').trim();
  if (!med) return false;
  if (PLACEHOLDER_NAMES.has(med.toLowerCase())) return false;
  if (protocol.delivery_method === 'in_clinic') return false;
  // If we have neither a dose nor sig there's nothing rx-shaped to write yet
  const hasDose = protocol.selected_dose || protocol.starting_dose || protocol.current_dose;
  if (!hasDose && !protocol.sig) return false;
  return true;
}
