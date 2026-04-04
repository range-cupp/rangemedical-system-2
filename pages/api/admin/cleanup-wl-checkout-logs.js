// /pages/api/admin/cleanup-wl-checkout-logs.js
// Remove service_logs entries that were created by medication checkout for in-clinic WL patients.
// These are identified by checkout_type='medication_checkout' or notes containing 'Dispensed on'.
// Encounter-note-created logs are preserved — they are the source of truth.
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dry_run = true, protocol_id } = req.body;

  try {
    // Find checkout-created WL injection service logs
    let query = supabase
      .from('service_logs')
      .select('id, patient_id, protocol_id, entry_type, entry_date, notes, checkout_type, medication, dosage')
      .eq('category', 'weight_loss')
      .eq('entry_type', 'injection');

    if (protocol_id) {
      query = query.eq('protocol_id', protocol_id);
    }

    const { data: logs, error: logsErr } = await query.order('entry_date', { ascending: true });
    if (logsErr) throw logsErr;

    // Identify checkout-created entries
    const checkoutLogs = (logs || []).filter(log => {
      if (log.checkout_type === 'medication_checkout') return true;
      if (log.notes && log.notes.includes('Dispensed on')) return true;
      return false;
    });

    if (!dry_run && checkoutLogs.length > 0) {
      const ids = checkoutLogs.map(l => l.id);
      const { error: delErr } = await supabase
        .from('service_logs')
        .delete()
        .in('id', ids);

      if (delErr) throw delErr;
    }

    return res.status(200).json({
      dry_run,
      total_wl_injection_logs: (logs || []).length,
      checkout_created_logs: checkoutLogs.length,
      deleted: !dry_run ? checkoutLogs.length : 0,
      entries: checkoutLogs.map(l => ({
        id: l.id,
        patient_id: l.patient_id,
        protocol_id: l.protocol_id,
        entry_date: l.entry_date,
        notes: l.notes,
        checkout_type: l.checkout_type,
      })),
    });
  } catch (err) {
    console.error('[cleanup-wl-checkout-logs] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
