// /pages/api/admin/consent-diagnostic.js
// Diagnostic endpoint to debug consent form issues
// Shows all consents, their patient matching status, and potential fixes
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const password = req.headers['x-admin-password'];
  if (password !== 'range2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const results = {
      tableExists: false,
      columns: [],
      totalConsents: 0,
      linked: 0,
      orphaned: 0,
      consents: [],
      matchAttempts: [],
      errors: []
    };

    // 1. Check if consents table exists and get its columns
    try {
      const { data: testQuery, error: testError } = await supabase
        .from('consents')
        .select('*')
        .limit(1);

      if (testError) {
        results.errors.push(`Table query error: ${testError.message}`);
        if (testError.message.includes('does not exist') || testError.message.includes('relation')) {
          results.tableExists = false;
          return res.status(200).json(results);
        }
      } else {
        results.tableExists = true;
        if (testQuery && testQuery.length > 0) {
          results.columns = Object.keys(testQuery[0]);
        }
      }
    } catch (e) {
      results.errors.push(`Table check failed: ${e.message}`);
    }

    // 2. Get all consents
    const { data: allConsents, error: consentsError } = await supabase
      .from('consents')
      .select('id, patient_id, consent_type, first_name, last_name, email, phone, ghl_contact_id, consent_date, consent_given, signature_url, pdf_url, submitted_at, created_at')
      .order('submitted_at', { ascending: false })
      .limit(100);

    if (consentsError) {
      results.errors.push(`Consents query error: ${consentsError.message}`);
      return res.status(200).json(results);
    }

    results.totalConsents = allConsents?.length || 0;
    results.linked = (allConsents || []).filter(c => c.patient_id).length;
    results.orphaned = results.totalConsents - results.linked;

    // 3. For orphaned consents, try to find matching patients
    const orphanedConsents = (allConsents || []).filter(c => !c.patient_id);

    for (const consent of orphanedConsents) {
      const matchAttempt = {
        consentId: consent.id,
        consentType: consent.consent_type,
        name: `${consent.first_name || ''} ${consent.last_name || ''}`.trim(),
        email: consent.email,
        phone: consent.phone,
        ghlContactId: consent.ghl_contact_id,
        submittedAt: consent.submitted_at,
        hasPdf: !!consent.pdf_url,
        hasSignature: !!consent.signature_url,
        matchResults: {}
      };

      // Try GHL contact ID
      if (consent.ghl_contact_id) {
        const { data } = await supabase.from('patients').select('id, name, email')
          .eq('ghl_contact_id', consent.ghl_contact_id).limit(5);
        matchAttempt.matchResults.ghlContactId = data?.length > 0 ? data.map(p => ({ id: p.id, name: p.name, email: p.email })) : 'no match';
      } else {
        matchAttempt.matchResults.ghlContactId = 'not provided';
      }

      // Try email
      if (consent.email) {
        const { data } = await supabase.from('patients').select('id, name, email')
          .ilike('email', consent.email).limit(5);
        matchAttempt.matchResults.email = data?.length > 0 ? data.map(p => ({ id: p.id, name: p.name, email: p.email })) : 'no match';
      } else {
        matchAttempt.matchResults.email = 'not provided';
      }

      // Try phone
      if (consent.phone) {
        const normalized = consent.phone.replace(/\D/g, '').slice(-10);
        if (normalized.length === 10) {
          const { data } = await supabase.from('patients').select('id, name, phone')
            .or(`phone.ilike.%${normalized}%`).limit(5);
          matchAttempt.matchResults.phone = data?.length > 0 ? data.map(p => ({ id: p.id, name: p.name, phone: p.phone })) : 'no match';
        } else {
          matchAttempt.matchResults.phone = `invalid normalized: "${normalized}"`;
        }
      } else {
        matchAttempt.matchResults.phone = 'not provided';
      }

      // Try name match
      if (consent.first_name && consent.last_name) {
        const { data } = await supabase.from('patients').select('id, name, first_name, last_name, email')
          .ilike('first_name', consent.first_name)
          .ilike('last_name', consent.last_name)
          .limit(5);
        matchAttempt.matchResults.name = data?.length > 0 ? data.map(p => ({ id: p.id, name: p.name, email: p.email })) : 'no match';
      } else {
        matchAttempt.matchResults.name = 'not provided';
      }

      results.matchAttempts.push(matchAttempt);
    }

    // 4. Summary of all consents (linked + orphaned)
    results.consents = (allConsents || []).map(c => ({
      id: c.id,
      type: c.consent_type,
      name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
      email: c.email,
      phone: c.phone,
      patientId: c.patient_id || 'ORPHANED',
      consentGiven: c.consent_given,
      hasPdf: !!c.pdf_url,
      hasSignature: !!c.signature_url,
      submittedAt: c.submitted_at,
      ghlContactId: c.ghl_contact_id || null
    }));

    // 5. Also check medical_documents table (legacy peptide consents saved there)
    try {
      const { data: medDocs, error: medError } = await supabase
        .from('medical_documents')
        .select('id, patient_id, document_type, document_url, uploaded_at, notes')
        .ilike('document_type', '%consent%')
        .order('uploaded_at', { ascending: false })
        .limit(50);

      if (!medError) {
        results.medicalDocumentsConsents = (medDocs || []).map(d => ({
          id: d.id,
          patientId: d.patient_id || 'ORPHANED',
          documentType: d.document_type,
          hasUrl: !!d.document_url,
          uploadedAt: d.uploaded_at,
          notes: d.notes
        }));
      }
    } catch (e) {
      results.errors.push(`medical_documents check: ${e.message}`);
    }

    return res.status(200).json(results);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
