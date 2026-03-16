// One-time backfill: insert Warren Windham's missing peptide pickup service log entry
// DELETE THIS FILE after running it once
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // Find Warren's patient record
  const { data: patient } = await supabase
    .from('patients')
    .select('id, patient_name')
    .or('patient_name.ilike.%wyndam%,patient_name.ilike.%windham%')
    .limit(1)
    .single();

  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  // Find his active peptide protocol
  const { data: protocol } = await supabase
    .from('protocols')
    .select('id, medication, selected_dose, total_sessions, start_date')
    .eq('patient_id', patient.id)
    .eq('program_type', 'peptide')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!protocol) return res.status(404).json({ error: 'No active peptide protocol found' });

  // Check if entry already exists (idempotent)
  const { data: existing } = await supabase
    .from('service_logs')
    .select('id')
    .eq('patient_id', patient.id)
    .eq('protocol_id', protocol.id)
    .eq('category', 'peptide')
    .eq('entry_type', 'pickup')
    .limit(1);

  if (existing && existing.length > 0) {
    return res.status(200).json({ message: 'Already exists', existing });
  }

  const { data: entry, error } = await supabase.from('service_logs').insert({
    patient_id: patient.id,
    protocol_id: protocol.id,
    category: 'peptide',
    entry_type: 'pickup',
    entry_date: protocol.start_date || new Date().toISOString().split('T')[0],
    medication: protocol.medication || null,
    dosage: protocol.selected_dose || null,
    quantity: protocol.total_sessions || 30,
    notes: `Backfill: take-home medication dispensed — BPC-157/TB4 30-day protocol`,
  }).select().single();

  if (error) return res.status(500).json({ error });

  return res.status(200).json({ success: true, patient: patient.patient_name, entry });
}
