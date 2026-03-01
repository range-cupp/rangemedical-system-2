// /pages/api/admin/recover-consents.js
// One-time recovery: re-creates missing consent DB records from storage PDFs
// For consents where the PDF was uploaded but the DB insert failed
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STORAGE_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/medical-documents';

export default async function handler(req, res) {
  const password = req.headers['x-admin-password'];
  if (password !== 'range2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const dryRun = req.query.execute !== 'true';

  try {
    // 1. Get all consent PDFs from storage
    const { data: storagePdfs, error: storageError } = await supabase.storage
      .from('medical-documents')
      .list('consents', { limit: 500, sortBy: { column: 'created_at', order: 'desc' } });

    if (storageError) throw new Error('Storage error: ' + storageError.message);

    // 2. Get all existing consent pdf_urls from DB
    const { data: dbConsents } = await supabase
      .from('consents')
      .select('pdf_url')
      .limit(1000);

    const dbFilenames = new Set((dbConsents || [])
      .filter(c => c.pdf_url)
      .map(c => c.pdf_url.split('/').pop()));

    // 3. Find PDFs missing from DB
    const missingPdfs = (storagePdfs || []).filter(f => {
      if (!f.name || !f.created_at) return false;
      // Skip directory entries
      if (!f.name.includes('.pdf')) return false;
      return !dbFilenames.has(f.name);
    });

    // 4. Get all signatures from storage for matching
    const { data: signatures } = await supabase.storage
      .from('medical-documents')
      .list('signatures', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });

    // 5. Get all patients for matching
    const { data: patients } = await supabase
      .from('patients')
      .select('id, name, first_name, last_name, email, phone, ghl_contact_id');

    // Build patient lookup indexes
    const patientsByName = {};
    for (const p of (patients || [])) {
      const fn = (p.first_name || '').toLowerCase();
      const ln = (p.last_name || '').toLowerCase();
      if (fn && ln) {
        patientsByName[`${fn}-${ln}`] = p;
        patientsByName[`${fn} ${ln}`] = p;
      }
      if (p.name) {
        const parts = p.name.toLowerCase().split(' ');
        if (parts.length >= 2) {
          patientsByName[`${parts[0]}-${parts[parts.length - 1]}`] = p;
        }
      }
    }

    const results = { recovered: [], failed: [], skipped: [] };

    for (const pdf of missingPdfs) {
      const filename = pdf.name;
      const createdAt = pdf.created_at;

      // Parse filename: {type}-consent-{First}-{Last}-{timestamp}.pdf
      const match = filename.match(/^(.+?)-consent-(.+)-(\d{10,})\.pdf$/);
      if (!match) {
        results.skipped.push({ filename, reason: 'unparseable filename' });
        continue;
      }

      const consentType = match[1]; // e.g. "blood-draw", "peptide", "iv-injection"
      const namePart = match[2]; // e.g. "Michelle-Kim"
      const timestamp = parseInt(match[3]);

      // Normalize consent type for DB (some use underscore)
      const dbConsentType = consentType; // keep as-is, matches DB format

      // Parse name
      const nameParts = namePart.split('-');
      if (nameParts.length < 2) {
        results.skipped.push({ filename, reason: 'cannot parse name' });
        continue;
      }
      const firstName = nameParts[0];
      // Last name might have multiple parts (e.g., "Van-Engelen")
      const lastName = nameParts.slice(1).join(' ');

      // Find matching patient
      const nameKey = namePart.toLowerCase();
      const nameKeySpace = `${firstName.toLowerCase()} ${lastName.toLowerCase()}`;
      let patient = patientsByName[nameKey] || patientsByName[nameKeySpace];

      // Try first-last with dash only on last name part
      if (!patient) {
        const fnLower = firstName.toLowerCase();
        const lnLower = nameParts[nameParts.length - 1].toLowerCase();
        patient = patientsByName[`${fnLower}-${lnLower}`];
      }

      // Fuzzy match: try each patient
      if (!patient) {
        for (const p of (patients || [])) {
          const pfn = (p.first_name || '').toLowerCase();
          const pln = (p.last_name || '').toLowerCase();
          if (pfn && pln && firstName.toLowerCase() === pfn && lastName.toLowerCase().includes(pln)) {
            patient = p;
            break;
          }
        }
      }

      if (!patient) {
        results.failed.push({ filename, firstName, lastName, reason: 'no patient match' });
        continue;
      }

      // Find matching signature (closest timestamp)
      const sigNameLower = `${firstName}-${nameParts[nameParts.length - 1]}`.toLowerCase();
      let bestSig = null;
      let bestTimeDiff = Infinity;
      for (const sig of (signatures || [])) {
        if (!sig.name) continue;
        const sigLower = sig.name.toLowerCase();
        if (sigLower.includes(firstName.toLowerCase()) && sigLower.includes(nameParts[nameParts.length - 1].toLowerCase())) {
          // Extract timestamp from signature filename
          const sigMatch = sig.name.match(/(\d{10,})/);
          if (sigMatch) {
            const sigTs = parseInt(sigMatch[1]);
            const diff = Math.abs(sigTs - timestamp);
            if (diff < bestTimeDiff && diff < 60000) { // Within 1 minute
              bestTimeDiff = diff;
              bestSig = sig.name;
            }
          }
        }
      }

      const pdfUrl = `${STORAGE_BASE}/consents/${filename}`;
      const signatureUrl = bestSig ? `${STORAGE_BASE}/signatures/${bestSig}` : null;
      const consentDate = new Date(timestamp).toISOString().split('T')[0];

      const record = {
        patient_id: patient.id,
        consent_type: dbConsentType,
        first_name: firstName,
        last_name: lastName,
        email: patient.email || null,
        phone: patient.phone || null,
        ghl_contact_id: patient.ghl_contact_id || null,
        consent_date: consentDate,
        consent_given: true,
        signature_url: signatureUrl,
        pdf_url: pdfUrl,
        submitted_at: createdAt
      };

      if (dryRun) {
        results.recovered.push({ filename, patient: patient.name, consentType: dbConsentType, hasSig: !!bestSig });
      } else {
        const { error: insertError } = await supabase.from('consents').insert(record);
        if (insertError) {
          results.failed.push({ filename, patient: patient.name, error: insertError.message });
        } else {
          results.recovered.push({ filename, patient: patient.name, consentType: dbConsentType, hasSig: !!bestSig });
        }
      }
    }

    return res.status(200).json({
      dryRun,
      message: dryRun ? 'DRY RUN - no records created. Add ?execute=true to actually recover.' : 'Recovery complete.',
      totalStoragePdfs: storagePdfs?.length || 0,
      totalDbConsents: dbConsents?.length || 0,
      missingPdfs: missingPdfs.length,
      summary: {
        recovered: results.recovered.length,
        failed: results.failed.length,
        skipped: results.skipped.length
      },
      details: results
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
