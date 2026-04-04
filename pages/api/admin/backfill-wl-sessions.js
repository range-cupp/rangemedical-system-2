// /pages/api/admin/backfill-wl-sessions.js
// Reconcile weight loss protocol sessions_used to match actual encounter-note injection logs.
// Checkout-created service logs (checkout_type='medication_checkout' or notes containing 'Dispensed on')
// are excluded — only encounter-note injections count for in-clinic patients.
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
    // 1. Get all active/in_progress weight loss protocols (or a specific one)
    let query = supabase
      .from('protocols')
      .select('id, patient_id, program_type, program_name, sessions_used, total_sessions, status')
      .in('status', ['active', 'in_progress'])
      .or('program_type.ilike.%weight_loss%,program_name.ilike.%semaglutide%,program_name.ilike.%tirzepatide%,program_name.ilike.%retatrutide%');

    if (protocol_id) {
      query = supabase
        .from('protocols')
        .select('id, patient_id, program_type, program_name, sessions_used, total_sessions, status')
        .eq('id', protocol_id);
    }

    const { data: protocols, error: protErr } = await query;
    if (protErr) throw protErr;

    const results = [];

    for (const protocol of protocols) {
      // 2. Count actual injection service logs for this protocol
      // Exclude: pickups, checkout-created entries, and pre-scheduled "Dispensed on" entries
      const { data: allLogs, error: logsErr } = await supabase
        .from('service_logs')
        .select('id, entry_type, entry_date, notes, checkout_type')
        .eq('protocol_id', protocol.id)
        .eq('category', 'weight_loss')
        .eq('entry_type', 'injection')
        .order('entry_date', { ascending: true });

      if (logsErr) {
        results.push({ protocol_id: protocol.id, error: logsErr.message });
        continue;
      }

      // Filter out checkout-created injection entries:
      // - checkout_type = 'medication_checkout'
      // - notes containing 'Dispensed on' (pre-scheduled future injections from multi-pickup)
      const encounterInjections = (allLogs || []).filter(log => {
        if (log.checkout_type === 'medication_checkout') return false;
        if (log.notes && log.notes.includes('Dispensed on')) return false;
        return true;
      });

      const actualCount = encounterInjections.length;
      const dbCount = protocol.sessions_used || 0;

      const entry = {
        protocol_id: protocol.id,
        patient_id: protocol.patient_id,
        program: protocol.program_name || protocol.program_type,
        total_sessions: protocol.total_sessions,
        db_sessions_used: dbCount,
        actual_encounter_injections: actualCount,
        needs_fix: dbCount !== actualCount,
      };

      if (dbCount !== actualCount && !dry_run) {
        const { error: updateErr } = await supabase
          .from('protocols')
          .update({ sessions_used: actualCount, updated_at: new Date().toISOString() })
          .eq('id', protocol.id);

        entry.fixed = !updateErr;
        if (updateErr) entry.fix_error = updateErr.message;
      }

      results.push(entry);
    }

    const needsFix = results.filter(r => r.needs_fix);

    return res.status(200).json({
      dry_run,
      total_protocols: protocols.length,
      needing_fix: needsFix.length,
      results: needsFix.length > 0 ? needsFix : results.slice(0, 10),
    });
  } catch (err) {
    console.error('[backfill-wl-sessions] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
