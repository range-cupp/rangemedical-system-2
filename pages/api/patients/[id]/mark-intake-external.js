// pages/api/patients/[id]/mark-intake-external.js
// Admin tool: mark a patient's medical intake as completed via an external/legacy
// form (paper, old EMR, verbally confirmed) so they don't have to re-fill the
// new-system intake. Creates a synthetic row in `intakes` so existing
// forms_complete logic treats the patient as done.
//
// POST   body: { source, notes?, markedBy? }   → create external intake row
// DELETE query: ?intakeId=<uuid>               → remove a specific external intake row

import { createClient } from '@supabase/supabase-js';
import { checkAndUpdateFormsComplete } from '../../../../lib/check-forms-complete';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED_SOURCES = new Set([
  'paper_form',
  'legacy_emr',
  'verbally_confirmed',
  'other',
]);

export default async function handler(req, res) {
  const { id: patientId } = req.query;
  if (!patientId) {
    return res.status(400).json({ error: 'patientId is required' });
  }

  if (req.method === 'POST') {
    const { source, notes, markedBy } = req.body || {};
    if (!source || !ALLOWED_SOURCES.has(source)) {
      return res.status(400).json({
        error: `source must be one of: ${[...ALLOWED_SOURCES].join(', ')}`,
      });
    }

    const { data: patient, error: patientErr } = await supabase
      .from('patients')
      .select('id, first_name, last_name, email, phone, date_of_birth, gender, ghl_contact_id')
      .eq('id', patientId)
      .maybeSingle();

    if (patientErr || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('intakes')
      .insert({
        patient_id: patient.id,
        ghl_contact_id: patient.ghl_contact_id || null,
        first_name: patient.first_name || '',
        last_name: patient.last_name || '',
        email: patient.email || null,
        phone: patient.phone || null,
        date_of_birth: patient.date_of_birth || null,
        gender: patient.gender || null,
        submitted_at: new Date().toISOString(),
        external_source: source,
        external_notes: notes ? String(notes).trim().slice(0, 2000) : null,
        marked_external_by: markedBy ? String(markedBy).trim().slice(0, 120) : null,
      })
      .select('id, external_source, external_notes, marked_external_by, submitted_at')
      .single();

    if (insertErr) {
      console.error('mark-intake-external insert error:', insertErr);
      return res.status(500).json({ error: 'Failed to mark intake', details: insertErr.message });
    }

    await checkAndUpdateFormsComplete(patient.id);

    return res.status(200).json({ success: true, intake: inserted });
  }

  if (req.method === 'DELETE') {
    const { intakeId } = req.query;
    if (!intakeId) {
      return res.status(400).json({ error: 'intakeId query param is required' });
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('intakes')
      .select('id, patient_id, external_source')
      .eq('id', intakeId)
      .eq('patient_id', patientId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return res.status(404).json({ error: 'Intake not found for this patient' });
    }

    if (!existing.external_source) {
      return res.status(400).json({
        error: 'Only externally-marked intakes can be removed via this endpoint',
      });
    }

    const { error: deleteErr } = await supabase
      .from('intakes')
      .delete()
      .eq('id', existing.id);

    if (deleteErr) {
      console.error('mark-intake-external delete error:', deleteErr);
      return res.status(500).json({ error: 'Failed to remove intake', details: deleteErr.message });
    }

    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', 'POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
