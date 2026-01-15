// /pages/api/webhooks/consent.js
// Webhook handler for consent form submissions
// Range Medical
//
// Receives consent submissions and:
// 1. Stores them in the consents table
// 2. Auto-links to patient record via ghl_contact_id, email, or phone

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
      // Find best match
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

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const payload = req.body;
    
    console.log('Consent webhook received:', JSON.stringify(payload, null, 2));

    // Extract data from various possible field names
    const consentData = {
      consent_type: payload.consent_type || payload.consentType || payload.form_type || payload.formType || 'unknown',
      first_name: payload.first_name || payload.firstName || payload.name?.split(' ')[0] || '',
      last_name: payload.last_name || payload.lastName || payload.name?.split(' ').slice(1).join(' ') || '',
      email: payload.email || payload.Email || '',
      phone: payload.phone || payload.Phone || payload.mobile || '',
      ghl_contact_id: payload.ghl_contact_id || payload.contactId || payload.contact_id || '',
      signature: payload.signature || payload.Signature || '',
      pdf_url: payload.pdf_url || payload.pdfUrl || payload.pdf || '',
      submitted_at: payload.submitted_at || payload.submittedAt || payload.timestamp || new Date().toISOString(),
      raw_data: payload
    };

    // Find matching patient
    const patient = await findPatient(
      consentData.ghl_contact_id,
      consentData.email,
      consentData.phone
    );

    if (patient) {
      consentData.patient_id = patient.id;
      consentData.ghl_contact_id = patient.ghl_contact_id || consentData.ghl_contact_id;
    }

    // Check for existing consent of same type from same person (avoid duplicates)
    const { data: existing } = await supabase
      .from('consents')
      .select('id')
      .eq('consent_type', consentData.consent_type)
      .eq('email', consentData.email)
      .gte('submitted_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Within 5 minutes
      .single();

    if (existing) {
      console.log('Duplicate consent detected, updating existing:', existing.id);
      const { error: updateError } = await supabase
        .from('consents')
        .update(consentData)
        .eq('id', existing.id);

      if (updateError) throw updateError;
      return res.status(200).json({ success: true, action: 'updated', id: existing.id });
    }

    // Insert new consent
    const { data: consent, error: insertError } = await supabase
      .from('consents')
      .insert(consentData)
      .select()
      .single();

    if (insertError) throw insertError;

    console.log('Consent saved:', consent.id, patient ? `(linked to patient ${patient.id})` : '(no patient match)');

    return res.status(200).json({ 
      success: true, 
      action: 'created',
      id: consent.id,
      patient_linked: !!patient
    });

  } catch (error) {
    console.error('Consent webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
