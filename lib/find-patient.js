// lib/find-patient.js
// Shared patient matching utility - single source of truth
// Used by: webhooks (consent, intake), cron (link-forms), and patient API
//
// Matching priority:
// 1. ghl_contact_id (exact match)
// 2. email (case-insensitive)
// 3. phone (last-10-digit normalized)
// 4. first_name + last_name (exact, case-insensitive)

/**
 * Find a patient by various identifiers, trying each in priority order.
 * @param {object} supabase - Supabase client instance
 * @param {object} identifiers - { ghlContactId, email, phone, firstName, lastName }
 * @returns {object|null} - { id, ghl_contact_id } or null
 */
export async function findPatientByIdentifiers(supabase, { ghlContactId, email, phone, firstName, lastName }) {
  // 1. Try ghl_contact_id (exact match)
  if (ghlContactId) {
    const { data } = await supabase
      .from('patients')
      .select('id, ghl_contact_id')
      .eq('ghl_contact_id', ghlContactId)
      .single();
    if (data) return data;
  }

  // 2. Try email (case-insensitive)
  if (email && email.trim()) {
    const { data } = await supabase
      .from('patients')
      .select('id, ghl_contact_id')
      .ilike('email', email.trim())
      .single();
    if (data) return data;
  }

  // 3. Try phone (last-10-digit normalized)
  if (phone) {
    const normalizedPhone = phone.replace(/\D/g, '');
    const last10 = normalizedPhone.slice(-10);

    if (last10.length === 10) {
      const { data } = await supabase
        .from('patients')
        .select('id, ghl_contact_id, phone')
        .or(`phone.ilike.%${last10}%`);

      if (data && data.length > 0) {
        // Find the best match by comparing normalized last-10 digits
        for (const p of data) {
          const pNormalized = (p.phone || '').replace(/\D/g, '');
          const pLast10 = pNormalized.slice(-10);
          if (pLast10 === last10) {
            return { id: p.id, ghl_contact_id: p.ghl_contact_id };
          }
        }
        // Fall back to first result if no exact last-10 match
        return { id: data[0].id, ghl_contact_id: data[0].ghl_contact_id };
      }
    }
  }

  // 4. Try first_name + last_name (case-insensitive, both must be present)
  if (firstName && lastName && firstName.trim() && lastName.trim()) {
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const { data } = await supabase
      .from('patients')
      .select('id, ghl_contact_id')
      .ilike('name', fullName)
      .single();
    if (data) return data;

    // Also try first_name/last_name columns if they exist
    const { data: data2 } = await supabase
      .from('patients')
      .select('id, ghl_contact_id')
      .ilike('first_name', firstName.trim())
      .ilike('last_name', lastName.trim())
      .single();
    if (data2) return data2;
  }

  return null;
}

/**
 * Build lookup maps from a patients array for batch matching (used by cron).
 * Returns maps keyed by ghl_contact_id, email (lowercase), phone (last-10), and name (lowercase).
 */
export function buildPatientLookupMaps(patients) {
  const byGhlId = {};
  const byEmail = {};
  const byPhone = {};
  const byName = {};

  (patients || []).forEach(p => {
    if (p.ghl_contact_id) byGhlId[p.ghl_contact_id] = p;
    if (p.email) byEmail[p.email.toLowerCase().trim()] = p;
    if (p.phone) {
      const normalized = p.phone.replace(/\D/g, '');
      byPhone[normalized] = p;
      if (normalized.length >= 10) {
        byPhone[normalized.slice(-10)] = p;
      }
    }
    // Build name key from name field or first_name + last_name
    const name = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim();
    if (name) {
      byName[name.toLowerCase()] = p;
    }
  });

  return { byGhlId, byEmail, byPhone, byName };
}

/**
 * Find a patient from pre-built lookup maps (for batch operations).
 */
export function findPatientFromMaps(maps, { ghlContactId, email, phone, firstName, lastName }) {
  const { byGhlId, byEmail, byPhone, byName } = maps;

  // 1. ghl_contact_id
  if (ghlContactId && byGhlId[ghlContactId]) {
    return byGhlId[ghlContactId];
  }

  // 2. email (case-insensitive)
  if (email && byEmail[email.toLowerCase().trim()]) {
    return byEmail[email.toLowerCase().trim()];
  }

  // 3. phone (last-10-digit normalized)
  if (phone) {
    const normalized = phone.replace(/\D/g, '');
    if (byPhone[normalized]) return byPhone[normalized];
    if (normalized.length >= 10 && byPhone[normalized.slice(-10)]) {
      return byPhone[normalized.slice(-10)];
    }
  }

  // 4. name (case-insensitive)
  if (firstName && lastName) {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.toLowerCase();
    if (byName[fullName]) return byName[fullName];
  }

  return null;
}
