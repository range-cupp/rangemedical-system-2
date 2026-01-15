// /pages/api/admin/purchases/link-contacts.js
// Links purchases to GHL contacts using patient data
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Normalize name for matching
const normalizeName = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '') // Remove non-letters
    .replace(/\s+/g, ' ')      // Normalize spaces
    .trim();
};

// Clean phone number to last 10 digits
const cleanPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get ALL purchases (not just missing info) to ensure complete linking
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('id, patient_name, patient_email, patient_phone, ghl_contact_id');

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      return res.status(500).json({ error: 'Failed to fetch purchases' });
    }

    // Get all patients with contact info
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, first_name, last_name, email, phone, ghl_contact_id');

    if (patientsError) {
      console.error('Error fetching patients:', patientsError);
      return res.status(500).json({ error: 'Failed to fetch patients' });
    }

    // Build lookup maps
    const patientsByName = {};
    const patientsByFirstLast = {};
    const patientsByEmail = {};
    const patientsByPhone = {};
    const patientsByGhlId = {};

    patients.forEach(p => {
      // Full name lookup
      const fullName = normalizeName(`${p.first_name || ''} ${p.last_name || ''}`);
      if (fullName) patientsByName[fullName] = p;
      
      // First + Last separate lookup
      const first = normalizeName(p.first_name);
      const last = normalizeName(p.last_name);
      if (first && last) {
        patientsByFirstLast[`${first}|${last}`] = p;
        patientsByFirstLast[`${last}|${first}`] = p; // Also try reversed
      }
      
      // Email lookup
      if (p.email) patientsByEmail[p.email.toLowerCase().trim()] = p;
      
      // Phone lookup
      const phone = cleanPhone(p.phone);
      if (phone.length === 10) patientsByPhone[phone] = p;
      
      // GHL ID lookup
      if (p.ghl_contact_id) patientsByGhlId[p.ghl_contact_id] = p;
    });

    let updated = 0;
    let skipped = 0;
    let alreadyComplete = 0;
    const updates = [];

    for (const purchase of purchases) {
      // Check if purchase already has all info
      if (purchase.ghl_contact_id && purchase.patient_email && purchase.patient_phone) {
        alreadyComplete++;
        continue;
      }

      let matchedPatient = null;

      // 1. Try to match by GHL contact ID first (most reliable)
      if (purchase.ghl_contact_id && patientsByGhlId[purchase.ghl_contact_id]) {
        matchedPatient = patientsByGhlId[purchase.ghl_contact_id];
      }
      
      // 2. Try by email (very reliable)
      if (!matchedPatient && purchase.patient_email) {
        const email = purchase.patient_email.toLowerCase().trim();
        if (patientsByEmail[email]) {
          matchedPatient = patientsByEmail[email];
        }
      }
      
      // 3. Try by phone (reliable)
      if (!matchedPatient && purchase.patient_phone) {
        const phone = cleanPhone(purchase.patient_phone);
        if (phone.length === 10 && patientsByPhone[phone]) {
          matchedPatient = patientsByPhone[phone];
        }
      }
      
      // 4. Try by exact name match
      if (!matchedPatient && purchase.patient_name) {
        const purchaseName = normalizeName(purchase.patient_name);
        if (patientsByName[purchaseName]) {
          matchedPatient = patientsByName[purchaseName];
        }
      }
      
      // 5. Try by first/last name parts
      if (!matchedPatient && purchase.patient_name) {
        const parts = normalizeName(purchase.patient_name).split(' ').filter(p => p.length > 1);
        if (parts.length >= 2) {
          const key1 = `${parts[0]}|${parts[parts.length - 1]}`;
          const key2 = `${parts[parts.length - 1]}|${parts[0]}`;
          if (patientsByFirstLast[key1]) {
            matchedPatient = patientsByFirstLast[key1];
          } else if (patientsByFirstLast[key2]) {
            matchedPatient = patientsByFirstLast[key2];
          }
        }
      }
      
      // 6. Try fuzzy name match (contains)
      if (!matchedPatient && purchase.patient_name) {
        const purchaseName = normalizeName(purchase.patient_name);
        for (const [name, patient] of Object.entries(patientsByName)) {
          // Check if names are similar enough
          if (name.includes(purchaseName) || purchaseName.includes(name)) {
            matchedPatient = patient;
            break;
          }
        }
      }

      if (matchedPatient) {
        const updateData = {};
        
        if (!purchase.ghl_contact_id && matchedPatient.ghl_contact_id) {
          updateData.ghl_contact_id = matchedPatient.ghl_contact_id;
        }
        if (!purchase.patient_email && matchedPatient.email) {
          updateData.patient_email = matchedPatient.email;
        }
        if (!purchase.patient_phone && matchedPatient.phone) {
          updateData.patient_phone = matchedPatient.phone;
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('purchases')
            .update(updateData)
            .eq('id', purchase.id);

          if (!updateError) {
            updated++;
            updates.push({
              id: purchase.id,
              purchase_name: purchase.patient_name,
              matched_to: `${matchedPatient.first_name} ${matchedPatient.last_name}`,
              fields_updated: Object.keys(updateData)
            });
          }
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }
    }

    return res.status(200).json({
      success: true,
      total_purchases: purchases.length,
      total_patients: patients.length,
      already_complete: alreadyComplete,
      updated,
      skipped,
      updates: updates.slice(0, 100) // Return first 100 for review
    });

  } catch (error) {
    console.error('Link contacts error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
