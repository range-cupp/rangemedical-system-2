// /pages/api/admin/protocols/[id]/verify-medication.js
// Mark a protocol's medication as verified by the provider, clearing the
// "Needs Provider Review" flag set by auto-protocol creation.
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { requireAuth, logAction } from '../../../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const employee = await requireAuth(req, res);
  if (!employee) return;

  const { id: protocolId } = req.query;
  if (!protocolId) return res.status(400).json({ error: 'Protocol id required' });

  const { data, error } = await supabase
    .from('protocols')
    .update({
      needs_medication_review: false,
      medication_verified_at: new Date().toISOString(),
      medication_verified_by: employee.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', protocolId)
    .select()
    .single();

  if (error) {
    console.error('Verify medication error:', error);
    return res.status(500).json({ error: error.message });
  }

  // Auto-complete the matching "Verify medication" tasks for this patient.
  // Match by patient_id + pending status + title prefix to be safe.
  if (data?.patient_id) {
    await supabase
      .from('tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('patient_id', data.patient_id)
      .eq('status', 'pending')
      .ilike('title', 'Verify % medication:%');
  }

  await logAction({
    employeeId: employee.id,
    employeeName: employee.name,
    action: 'verify_protocol_medication',
    resourceType: 'protocol',
    resourceId: protocolId,
    details: { medication: data?.medication, dose: data?.selected_dose, sig: data?.sig },
    req,
  });

  return res.status(200).json({ success: true, protocol: data });
}
