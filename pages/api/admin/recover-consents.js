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
    // 1. Get all consent PDFs from storage (root + ALL subfolders)
    const consentFolders = [
      { prefix: 'consents', type: null },
      { prefix: 'consents/hbot-consent', type: 'hbot' },
      { prefix: 'consents/weight-loss-consent', type: 'weight-loss' },
      { prefix: 'consents/red-light-consent', type: 'red-light' },
      { prefix: 'consents/peptide-consent', type: 'peptide' },
      { prefix: 'consents/iv-injection-consent', type: 'iv-injection' },
      { prefix: 'consents/hrt-consent', type: 'hrt' },
      { prefix: 'consents/exosome-iv-consent', type: 'exosome-iv' },
    ];

    let allStoragePdfs = [];
    for (const folder of consentFolders) {
      const { data, error } = await supabase.storage
        .from('medical-documents')
        .list(folder.prefix, { limit: 500, sortBy: { column: 'created_at', order: 'desc' } });
      if (error) continue;
      for (const f of (data || [])) {
        if (f.name && f.name.includes('.pdf')) {
          allStoragePdfs.push({ ...f, _folder: folder.prefix, _typeOverride: folder.type });
        }
      }
    }

    // 2. Get all existing consent pdf_urls from DB
    const { data: dbConsents } = await supabase
      .from('consents')
      .select('pdf_url')
      .limit(2000);

    // Match by filename regardless of folder path
    const dbFilenames = new Set((dbConsents || [])
      .filter(c => c.pdf_url)
      .map(c => c.pdf_url.split('/').pop()));

    // 3. Find PDFs missing from DB
    const missingPdfs = allStoragePdfs.filter(f => !dbFilenames.has(f.name));

    // 4. Get all signatures from storage (root + subfolders)
    const sigFolders = [
      'signatures', 'signatures/hbot-consent', 'signatures/weight-loss-consent',
      'signatures/red-light-consent', 'signatures/peptide-consent',
      'signatures/iv-injection-consent', 'signatures/hrt-consent', 'signatures/exosome-iv-consent'
    ];
    let allSignatures = [];
    for (const sf of sigFolders) {
      const { data } = await supabase.storage
        .from('medical-documents')
        .list(sf, { limit: 500, sortBy: { column: 'created_at', order: 'desc' } });
      for (const s of (data || [])) {
        if (s.name && (s.name.endsWith('.jpg') || s.name.endsWith('.png'))) {
          allSignatures.push({ ...s, _folder: sf });
        }
      }
    }
    const signatures = allSignatures;

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

      let dbConsentType, firstName, lastName, timestamp, nameParts;

      // Try Format 1: root folder — {type}-consent-{First}-{Last}-{ts}.pdf
      const match1 = filename.match(/^(.+?)-consent-(.+)-(\d{10,})\.pdf$/);
      // Try Format 2: subfolder — {safename}-{ts}.pdf (type from folder)
      const match2 = filename.match(/^(.+)-(\d{10,})\.pdf$/);

      if (match1) {
        dbConsentType = match1[1];
        const namePart = match1[2];
        timestamp = parseInt(match1[3]);
        nameParts = namePart.split('-').filter(p => p);
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      } else if (match2 && pdf._typeOverride) {
        // Subfolder format: type comes from folder, name from safeName
        dbConsentType = pdf._typeOverride;
        const safeName = match2[1]; // e.g. "rickson-galvez" or "julie-ann-nguyen"
        timestamp = parseInt(match2[2]);
        // safeName is lowercased with hyphens — split and capitalize
        const parts = safeName.split('-').filter(p => p);
        if (parts.length < 2) {
          results.skipped.push({ filename, folder: pdf._folder, reason: 'cannot parse name from safeName' });
          continue;
        }
        nameParts = parts;
        firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        lastName = parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      } else {
        results.skipped.push({ filename, folder: pdf._folder, reason: 'unparseable filename' });
        continue;
      }

      // Find matching patient
      const nameKey = `${firstName}-${nameParts.slice(1).join('-')}`.toLowerCase();
      const nameKeySpace = `${firstName.toLowerCase()} ${lastName.toLowerCase()}`;
      let patient = patientsByName[nameKey] || patientsByName[nameKeySpace];

      // Try first-last with dash only on last name part
      if (!patient) {
        const fnLower = firstName.toLowerCase();
        const lnLower = nameParts[nameParts.length - 1].toLowerCase();
        patient = patientsByName[`${fnLower}-${lnLower}`];
      }

      // Fuzzy match: try each patient (in-memory)
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

      // DB fallback 1: direct ILIKE on first_name + last_name
      if (!patient) {
        const { data } = await supabase.from('patients').select('id, name, first_name, last_name, email, phone, ghl_contact_id')
          .ilike('first_name', firstName)
          .ilike('last_name', lastName.replace(/ /g, '%'))
          .limit(1);
        if (data?.length > 0) patient = data[0];
      }

      // DB fallback 2: partial first name match (Ken → Kenneth, etc.)
      if (!patient) {
        const lastNamePart = nameParts[nameParts.length - 1];
        const { data } = await supabase.from('patients').select('id, name, first_name, last_name, email, phone, ghl_contact_id')
          .ilike('first_name', `${firstName}%`)
          .ilike('last_name', lastNamePart)
          .limit(3);
        if (data?.length === 1) patient = data[0]; // Only use if exactly 1 match
      }

      // DB fallback 3: search the full 'name' field
      if (!patient) {
        const { data } = await supabase.from('patients').select('id, name, first_name, last_name, email, phone, ghl_contact_id')
          .ilike('name', `%${firstName}%${nameParts[nameParts.length - 1]}%`)
          .limit(3);
        if (data?.length === 1) patient = data[0]; // Only use if exactly 1 match
      }

      if (!patient) {
        results.failed.push({ filename, firstName, lastName, reason: 'no patient match' });
        continue;
      }

      // Find matching signature (closest timestamp)
      let bestSig = null;
      let bestSigFolder = null;
      let bestTimeDiff = Infinity;
      for (const sig of (signatures || [])) {
        if (!sig.name) continue;
        const sigLower = sig.name.toLowerCase();
        if (sigLower.includes(firstName.toLowerCase()) && sigLower.includes(nameParts[nameParts.length - 1].toLowerCase())) {
          const sigMatch = sig.name.match(/(\d{10,})/);
          if (sigMatch) {
            const sigTs = parseInt(sigMatch[1]);
            const diff = Math.abs(sigTs - timestamp);
            if (diff < bestTimeDiff && diff < 60000) { // Within 1 minute
              bestTimeDiff = diff;
              bestSig = sig.name;
              bestSigFolder = sig._folder || 'signatures';
            }
          }
        }
      }

      const pdfUrl = `${STORAGE_BASE}/${pdf._folder}/${filename}`;
      const signatureUrl = bestSig ? `${STORAGE_BASE}/${bestSigFolder}/${bestSig}` : null;
      const consentDate = new Date(timestamp).toISOString().split('T')[0];

      const record = {
        patient_id: patient.id,
        consent_type: dbConsentType,
        first_name: firstName,
        last_name: lastName,
        email: patient.email || '',
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
      totalStoragePdfs: allStoragePdfs.length,
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
