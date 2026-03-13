// lib/duplicate-prevention.js
// Shared duplicate protocol prevention logic
// Used by: assign.js, create.js, admin/protocols.js, admin/protocols/create.js
// Range Medical - 2026-03-13

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Normalize a medication name for fuzzy comparison.
 * Strips everything except lowercase letters and digits.
 * "BPC-157/TB4 (Thymosin Beta 4)" → "bpc157tb4thymosinbeta4"
 * "BPC-157 + Thymosin Beta-4" → "bpc157thymosinbeta4"
 */
function normalizeMedication(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Check if two medication names are fuzzy-equivalent.
 * Handles variations like:
 *   "BPC-157/TB4 (Thymosin Beta 4)" vs "BPC-157 + Thymosin Beta-4"
 *   "Semaglutide" vs "semaglutide"
 *   "Testosterone Cypionate 200mg" vs "Testosterone Cypionate"
 */
function medicationsMatch(medA, medB) {
  if (!medA || !medB) return true; // If either is missing, match by type only
  const a = normalizeMedication(medA);
  const b = normalizeMedication(medB);
  if (!a || !b) return true;
  return a === b || a.includes(b) || b.includes(a);
}

/**
 * Find an existing active protocol that would be a duplicate.
 * Returns the matching protocol if found, null otherwise.
 *
 * @param {string} patientId - Patient UUID
 * @param {string} programType - Protocol type (peptide, hrt, weight_loss, etc.)
 * @param {string} medication - Medication name (optional, for fuzzy matching)
 * @returns {object|null} - Existing protocol or null
 */
export async function findDuplicateProtocol(patientId, programType, medication) {
  if (!patientId || !programType) return null;

  // Labs always get a new protocol (each lab draw is separate)
  if (programType === 'labs') return null;

  const { data: existingProtocols, error } = await supabase
    .from('protocols')
    .select('*')
    .eq('patient_id', patientId)
    .eq('program_type', programType)
    .eq('status', 'active');

  if (error) {
    console.error('Duplicate prevention: error checking for existing protocols:', error);
    return null;
  }

  if (!existingProtocols || existingProtocols.length === 0) return null;

  // Find a matching protocol by medication
  const match = existingProtocols.find(p => medicationsMatch(medication, p.medication));

  if (match) {
    console.log(`Duplicate prevention: found existing active ${programType} protocol ${match.id} (medication: ${match.medication}) for patient ${patientId}`);
  }

  return match || null;
}

/**
 * Check if a purchase is already linked to a protocol.
 * Returns the linked protocol_id if found, null otherwise.
 *
 * @param {string} purchaseId - Purchase UUID
 * @returns {string|null} - Existing protocol ID or null
 */
export async function findProtocolForPurchase(purchaseId) {
  if (!purchaseId) return null;

  const { data: purchase } = await supabase
    .from('purchases')
    .select('id, protocol_id, protocol_created')
    .eq('id', purchaseId)
    .single();

  if (purchase?.protocol_id) {
    console.log(`Duplicate prevention: purchase ${purchaseId} already linked to protocol ${purchase.protocol_id}`);
    return purchase.protocol_id;
  }

  return null;
}
