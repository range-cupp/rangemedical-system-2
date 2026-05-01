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

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="medication-list.pdf"');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Medication list PDF error:', err);
    return res.status(500).json({ error: 'Failed to generate medication list', details: err.message });
  }
}
