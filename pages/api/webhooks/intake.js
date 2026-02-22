// /pages/api/webhooks/intake.js
// Webhook handler for medical intake form submissions
// Range Medical
//
// Receives intake submissions and:
// 1. Stores them in the intakes table
// 2. Auto-links to patient record via ghl_contact_id, email, or phone
// 3. Parses medical data for display in patient profile

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper to find patient by various identifiers
async function findPatient(ghlContactId, email, phone) {
  // Try ghl_contact_id first
  if (ghlContactId) {
    const { data } = await supabase
      .from('patients')
      .select('id, ghl_contact_id')
      .eq('ghl_contact_id', ghlContactId)
      .single();
    if (data) return data;
  }

  // Try email
  if (email) {
    const { data } = await supabase
      .from('patients')
      .select('id, ghl_contact_id')
      .ilike('email', email)
      .single();
    if (data) return data;
  }

  // Try phone
  if (phone) {
    const normalizedPhone = phone.replace(/\D/g, '');
    const last10 = normalizedPhone.slice(-10);
    
    const { data } = await supabase
      .from('patients')
      .select('id, ghl_contact_id, phone')
      .or(`phone.ilike.%${last10}%`);
    
    if (data && data.length > 0) {
      for (const p of data) {
        const pNormalized = p.phone?.replace(/\D/g, '') || '';
        if (pNormalized.endsWith(last10) || last10.endsWith(pNormalized.slice(-10))) {
          return p;
        }
      }
      return data[0];
    }
  }

  return null;
}

// Parse medical data from raw intake form
function parseMedicalData(payload) {
  const medical = {
    conditions: [],
    medications: [],
    allergies: [],
    surgeries: [],
    family_history: []
  };

  // Look for common field patterns
  const fieldMappings = {
    conditions: ['conditions', 'medical_conditions', 'health_conditions', 'current_conditions'],
    medications: ['medications', 'current_medications', 'medicines', 'drugs'],
    allergies: ['allergies', 'drug_allergies', 'medication_allergies', 'known_allergies'],
    surgeries: ['surgeries', 'past_surgeries', 'surgical_history', 'operations'],
    family_history: ['family_history', 'familyHistory', 'family_medical_history']
  };

  for (const [category, fields] of Object.entries(fieldMappings)) {
    for (const field of fields) {
      if (payload[field]) {
        const value = payload[field];
        if (Array.isArray(value)) {
          medical[category] = value;
        } else if (typeof value === 'string') {
          medical[category] = value.split(/[,;]/).map(s => s.trim()).filter(Boolean);
        }
        break;
      }
    }
  }

  return medical;
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const payload = req.body;
    
    console.log('Intake webhook received:', JSON.stringify(payload, null, 2));

    // Parse medical data
    const medicalData = parseMedicalData(payload);

    // Extract data from various possible field names
    const intakeData = {
      first_name: payload.first_name || payload.firstName || payload.name?.split(' ')[0] || '',
      last_name: payload.last_name || payload.lastName || payload.name?.split(' ').slice(1).join(' ') || '',
      email: payload.email || payload.Email || '',
      phone: payload.phone || payload.Phone || payload.mobile || '',
      ghl_contact_id: payload.ghl_contact_id || payload.contactId || payload.contact_id || '',
      date_of_birth: payload.date_of_birth || payload.dob || payload.birthdate || null,
      gender: payload.gender || payload.sex || '',
      address: payload.address || '',
      city: payload.city || '',
      state: payload.state || '',
      zip: payload.zip || payload.zip_code || payload.postal_code || '',
      emergency_contact_name: payload.emergency_contact_name || payload.emergency_contact || '',
      emergency_contact_phone: payload.emergency_contact_phone || '',
      height: payload.height || '',
      weight: payload.weight || null,
      conditions: medicalData.conditions,
      medications: medicalData.medications,
      allergies: medicalData.allergies,
      surgeries: medicalData.surgeries,
      family_history: medicalData.family_history,
      pdf_url: payload.pdf_url || payload.pdfUrl || payload.pdf || '',
      submitted_at: payload.submitted_at || payload.submittedAt || payload.timestamp || new Date().toISOString(),
      raw_data: payload
    };

    // Find matching patient
    const patient = await findPatient(
      intakeData.ghl_contact_id,
      intakeData.email,
      intakeData.phone
    );

    if (patient) {
      intakeData.patient_id = patient.id;
      intakeData.ghl_contact_id = patient.ghl_contact_id || intakeData.ghl_contact_id;
    }

    // Check for existing intake from same person (avoid duplicates)
    // Only check if email is provided — empty emails would match all empty-email intakes
    let existing = null;
    if (intakeData.email) {
      const { data: dup } = await supabase
        .from('intakes')
        .select('id')
        .ilike('email', intakeData.email)
        .gte('submitted_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .maybeSingle();
      existing = dup;
    }

    if (existing) {
      console.log('Duplicate intake detected, updating existing:', existing.id);
      const { error: updateError } = await supabase
        .from('intakes')
        .update(intakeData)
        .eq('id', existing.id);

      if (updateError) throw updateError;
      return res.status(200).json({ success: true, action: 'updated', id: existing.id });
    }

    // Insert new intake
    const { data: intake, error: insertError } = await supabase
      .from('intakes')
      .insert(intakeData)
      .select()
      .single();

    if (insertError) throw insertError;

    console.log('Intake saved:', intake.id, patient ? `(linked to patient ${patient.id})` : '(no patient match)');

    return res.status(200).json({ 
      success: true, 
      action: 'created',
      id: intake.id,
      patient_linked: !!patient
    });

  } catch (error) {
    console.error('Intake webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
