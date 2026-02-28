// /pages/api/webhooks/consent.js
// Webhook handler for consent form submissions
// Range Medical System V2
//
// Receives consent submissions and:
// 1. Stores them in the consents table
// 2. Auto-links to patient record via shared matching (ghl_contact_id > email > phone > name)

import { createClient } from '@supabase/supabase-js';
import { findPatientByIdentifiers } from '../../../lib/find-patient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    // Find matching patient using shared utility (handles case-insensitive email, normalized phone, name matching)
    const patient = await findPatientByIdentifiers(supabase, {
      ghlContactId: consentData.ghl_contact_id,
      email: consentData.email,
      phone: consentData.phone,
      firstName: consentData.first_name,
      lastName: consentData.last_name
    });

    if (patient) {
      consentData.patient_id = patient.id;
      consentData.ghl_contact_id = patient.ghl_contact_id || consentData.ghl_contact_id;
    }

    // Check for existing consent of same type from same person (avoid duplicates)
    let existing = null;
    if (consentData.email) {
      const { data: dup } = await supabase
        .from('consents')
        .select('id')
        .eq('consent_type', consentData.consent_type)
        .ilike('email', consentData.email)
        .gte('submitted_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .maybeSingle();
      existing = dup;
    }

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
