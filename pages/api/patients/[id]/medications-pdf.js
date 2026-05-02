// pages/api/patients/[id]/medications-pdf.js
// Generates a patient-facing active medication list PDF (for travel, second-opinion visits).
// Accepts the already-derived medication list from the client to mirror what's shown on the
// patient page (protocol-derived rows + manually added meds).

import { createClient } from '@supabase/supabase-js';
import { generateMedicationListPdf } from '../../../../lib/medication-list-pdf';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Patient ID is required' });
  }

  try {
    const { medications, provider } = req.body || {};

    const { data: patient, error: patientErr } = await supabase
      .from('patients')
      .select('id, first_name, last_name, date_of_birth')
      .eq('id', id)
      .single();

    if (patientErr || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Patient';
    const issueDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

    const safeMeds = Array.isArray(medications) ? medications.map(m => ({
      medication_name: m?.medication_name || m?.trade_name || m?.generic_name || '',
      strength: m?.strength || '',
      form: m?.form || '',
      sig: m?.sig || '',
      dispense: m?.dispense || '',
      start_date: m?.start_date || '',
      source: m?.source || '',
      from_protocol: !!m?.from_protocol,
    })) : [];

    const pdfBytes = await generateMedicationListPdf({
      patientName,
      dateOfBirth: patient.date_of_birth || null,
      medications: safeMeds,
      provider: provider || 'Damien Burgess',
      issueDate,
    });

    // Save a copy to the patient's Documents tab. Wrapped so a storage hiccup
    // doesn't block the user from getting their PDF.
    try {
      const buffer = Buffer.from(pdfBytes);
      const timestamp = Date.now();
      const dateStamp = issueDate.replace(/-/g, '');
      const filePath = `${id}/${timestamp}-medication-list-${dateStamp}.pdf`;

      const { error: uploadErr } = await supabase.storage
        .from('patient-documents')
        .upload(filePath, buffer, { contentType: 'application/pdf', upsert: false });

      if (uploadErr) {
        console.error('Medication list upload error:', uploadErr.message);
      } else {
        const { data: urlData } = await supabase.storage
          .from('patient-documents')
          .createSignedUrl(filePath, 60 * 60 * 24 * 30);

        const issueObj = new Date(issueDate + 'T00:00:00');
        const dateStr = issueObj.toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles',
        });

        await supabase.from('medical_documents').insert({
          patient_id: id,
          document_name: `Medication List — ${dateStr}`,
          document_url: urlData?.signedUrl || null,
          document_type: 'Medication List',
          file_path: filePath,
          file_size: buffer.length,
          uploaded_by: provider || 'Damien Burgess',
        });
      }
    } catch (saveErr) {
      console.error('Medication list archive error:', saveErr.message);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="medication-list.pdf"');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Medication list PDF error:', err);
    return res.status(500).json({ error: 'Failed to generate medication list', details: err.message });
  }
}
