// /pages/api/admin/backfill-wl-injections.js
// Backfill service_log injection entries for weight loss protocols
// Makes service_logs the single source of truth
// GET = dry-run preview, POST = execute
// Range Medical - 2026-03-20

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const dryRun = req.method === 'GET';

  try {
    // 1. Fetch all active WL protocols
    const { data: protocols, error: protErr } = await supabase
      .from('protocols')
      .select('id, patient_id, medication, selected_dose, sessions_used, total_sessions, start_date, delivery_method, frequency')
      .eq('program_type', 'weight_loss')
      .eq('status', 'active')
      .not('start_date', 'is', null)
      .order('created_at', { ascending: false });

    if (protErr) throw new Error('Failed to fetch protocols: ' + protErr.message);

    // 2. Fetch all existing service_logs for these protocols
    const protocolIds = protocols.map(p => p.id);
    const { data: allLogs } = await supabase
      .from('service_logs')
      .select('id, protocol_id, entry_type, entry_date, medication, dosage, weight')
      .in('protocol_id', protocolIds)
      .eq('category', 'weight_loss')
      .order('entry_date', { ascending: true });

    // Index logs by protocol_id
    const logsByProtocol = {};
    (allLogs || []).forEach(log => {
      if (!logsByProtocol[log.protocol_id]) logsByProtocol[log.protocol_id] = [];
      logsByProtocol[log.protocol_id].push(log);
    });

    // 3. Fetch patient names for reporting
    const patientIds = [...new Set(protocols.map(p => p.patient_id))];
    const { data: patients } = await supabase
      .from('patients')
      .select('id, name')
      .in('id', patientIds);
    const patientMap = {};
    (patients || []).forEach(p => { patientMap[p.id] = p.name; });

    // 4. Process each protocol
    const results = [];
    let totalCreated = 0;
    let totalConverted = 0;
    let totalSkipped = 0;

    for (const protocol of protocols) {
      const sessionsUsed = protocol.sessions_used || 0;
      if (sessionsUsed === 0) continue; // Nothing to backfill

      const startDate = new Date(protocol.start_date + 'T00:00:00');
      const existingLogs = logsByProtocol[protocol.id] || [];

      // Determine interval (default weekly = 7 days)
      const freq = (protocol.frequency || '').toLowerCase();
      let intervalDays = 7;
      if (freq.includes('10')) intervalDays = 10;
      if (freq === 'monthly') intervalDays = 28;

      // Generate expected injection dates
      const expectedDates = [];
      for (let i = 0; i < sessionsUsed; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + (i * intervalDays));
        expectedDates.push(d.toISOString().split('T')[0]);
      }

      // Match each expected date against existing logs
      const toCreate = [];
      const toConvert = [];
      let alreadyCovered = 0;

      for (const expectedDate of expectedDates) {
        const expDate = new Date(expectedDate + 'T00:00:00');

        // Find existing log within ±3 days
        const match = existingLogs.find(log => {
          const logDate = new Date(log.entry_date + 'T00:00:00');
          const diffDays = Math.abs((expDate - logDate) / (1000 * 60 * 60 * 24));
          return diffDays <= 3;
        });

        if (match) {
          if (match.entry_type === 'checkin') {
            // Convert checkin → injection
            toConvert.push({ id: match.id, entry_date: match.entry_date });
            // Remove from existingLogs so it can't match again
            const idx = existingLogs.indexOf(match);
            if (idx > -1) existingLogs.splice(idx, 1);
          } else {
            // Already an injection or pickup — skip
            alreadyCovered++;
            const idx = existingLogs.indexOf(match);
            if (idx > -1) existingLogs.splice(idx, 1);
          }
        } else {
          // No match — need to create
          toCreate.push(expectedDate);
        }
      }

      const patientName = patientMap[protocol.patient_id] || 'Unknown';

      if (toCreate.length > 0 || toConvert.length > 0) {
        if (!dryRun) {
          // Convert checkin entries → injection
          for (const entry of toConvert) {
            await supabase
              .from('service_logs')
              .update({
                entry_type: 'injection',
                dosage: protocol.selected_dose || null,
                notes: 'Converted from checkin — backfill',
                updated_at: new Date().toISOString(),
              })
              .eq('id', entry.id);
          }

          // Create missing injection entries
          if (toCreate.length > 0) {
            const inserts = toCreate.map(date => ({
              patient_id: protocol.patient_id,
              protocol_id: protocol.id,
              category: 'weight_loss',
              entry_type: 'injection',
              entry_date: date,
              medication: protocol.medication || 'Retatrutide',
              dosage: protocol.selected_dose || null,
              notes: 'Backfilled from protocol history',
              created_at: new Date().toISOString(),
            }));

            const { error: insertErr } = await supabase
              .from('service_logs')
              .insert(inserts);

            if (insertErr) {
              console.error(`Error inserting logs for ${patientName}:`, insertErr);
            }
          }
        }

        totalCreated += toCreate.length;
        totalConverted += toConvert.length;

        results.push({
          patient_name: patientName,
          protocol_id: protocol.id,
          medication: protocol.medication,
          sessions_used: sessionsUsed,
          existing_injection_logs: alreadyCovered,
          checkins_converted: toConvert.length,
          entries_created: toCreate.length,
          final_count: alreadyCovered + toConvert.length + toCreate.length,
          match: (alreadyCovered + toConvert.length + toCreate.length) === sessionsUsed ? '✓' : '✗',
        });
      } else {
        totalSkipped++;
      }
    }

    return res.status(200).json({
      success: true,
      dry_run: dryRun,
      summary: {
        protocols_processed: protocols.length,
        protocols_needing_backfill: results.length,
        protocols_already_synced: totalSkipped,
        entries_created: totalCreated,
        checkins_converted: totalConverted,
      },
      details: results,
    });

  } catch (err) {
    console.error('Backfill WL injections error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
