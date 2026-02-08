// /pages/api/admin/backfill-wl-protocols.js
// Backfill weight loss protocols - consolidate multiple protocols per patient
// Range Medical - 2026-02-08
// GET = preview, POST = execute

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const dryRun = req.method === 'GET';

  try {
    // First, try to add the starting_dose column if it doesn't exist
    if (!dryRun) {
      try {
        await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE protocols ADD COLUMN IF NOT EXISTS starting_dose TEXT;`
        });
      } catch (alterError) {
        // Column might already exist or RPC might not exist - that's OK
        console.log('Note: Could not add starting_dose column via RPC, may already exist');
      }
    }

    // Get all weight loss protocols grouped by patient
    const { data: protocols, error: fetchError } = await supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        medication,
        selected_dose,
        starting_dose,
        program_name,
        program_type,
        status,
        start_date,
        end_date,
        pickup_frequency,
        injection_day,
        checkin_reminder_enabled,
        delivery_method,
        notes,
        created_at,
        patients (
          id,
          name,
          ghl_contact_id
        )
      `)
      .eq('program_type', 'weight_loss')
      .order('patient_id')
      .order('created_at', { ascending: true });

    if (fetchError) throw fetchError;

    // Group by patient and medication
    const patientGroups = {};
    for (const protocol of protocols || []) {
      const key = `${protocol.patient_id}_${protocol.medication || 'unknown'}`;
      if (!patientGroups[key]) {
        patientGroups[key] = [];
      }
      patientGroups[key].push(protocol);
    }

    const results = {
      total_protocols: protocols?.length || 0,
      patients_with_multiple: 0,
      consolidated: [],
      skipped: [],
      errors: []
    };

    // Process each group
    for (const [key, patientProtocols] of Object.entries(patientGroups)) {
      if (patientProtocols.length <= 1) {
        // Single protocol - just ensure starting_dose is set
        const protocol = patientProtocols[0];
        if (!protocol.starting_dose && protocol.selected_dose) {
          if (!dryRun) {
            await supabase
              .from('protocols')
              .update({ starting_dose: protocol.selected_dose })
              .eq('id', protocol.id);
          }
          results.skipped.push({
            patient: protocol.patients?.name || 'Unknown',
            protocol_id: protocol.id,
            medication: protocol.medication,
            action: 'Set starting_dose',
            starting_dose: protocol.selected_dose
          });
        }
        continue;
      }

      results.patients_with_multiple++;
      const patientName = patientProtocols[0].patients?.name || 'Unknown';
      const medication = patientProtocols[0].medication || 'Unknown';

      // Sort by start_date ascending
      patientProtocols.sort((a, b) =>
        new Date(a.start_date || a.created_at) - new Date(b.start_date || b.created_at)
      );

      // The first protocol becomes the "master"
      const masterProtocol = patientProtocols[0];
      const protocolsToMerge = patientProtocols.slice(1);

      // Find the latest end_date and dose from all protocols
      let latestEndDate = masterProtocol.end_date;
      let latestDose = masterProtocol.selected_dose;
      let combinedNotes = masterProtocol.notes || '';

      for (const p of protocolsToMerge) {
        if (p.end_date) {
          if (!latestEndDate || new Date(p.end_date) > new Date(latestEndDate)) {
            latestEndDate = p.end_date;
          }
        }
        if (p.selected_dose) {
          latestDose = p.selected_dose; // Take the most recent dose
        }
        if (p.notes) {
          combinedNotes += `\n[Merged from ${p.id}] ${p.notes}`;
        }
      }

      // Determine starting dose (from first protocol)
      const startingDose = masterProtocol.selected_dose || latestDose;

      // Determine final status
      let finalStatus = 'active';
      if (latestEndDate) {
        const endDate = new Date(latestEndDate + 'T12:00:00');
        const now = new Date();
        if (endDate < now) {
          finalStatus = 'completed';
        }
      }

      const consolidation = {
        patient: patientName,
        medication,
        master_protocol_id: masterProtocol.id,
        merged_protocols: protocolsToMerge.map(p => p.id),
        original_start: masterProtocol.start_date,
        new_end: latestEndDate,
        starting_dose: startingDose,
        current_dose: latestDose,
        final_status: finalStatus
      };

      if (!dryRun) {
        try {
          // Update the master protocol
          const { error: updateError } = await supabase
            .from('protocols')
            .update({
              end_date: latestEndDate,
              selected_dose: latestDose,
              starting_dose: startingDose,
              status: finalStatus,
              notes: combinedNotes.trim() || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', masterProtocol.id);

          if (updateError) throw updateError;

          // Mark merged protocols as 'merged' status
          const { error: mergeError } = await supabase
            .from('protocols')
            .update({
              status: 'merged',
              notes: `Merged into protocol ${masterProtocol.id}`,
              updated_at: new Date().toISOString()
            })
            .in('id', protocolsToMerge.map(p => p.id));

          if (mergeError) throw mergeError;

          // Update purchases to point to master protocol
          const { error: purchaseError } = await supabase
            .from('purchases')
            .update({ protocol_id: masterProtocol.id })
            .in('protocol_id', protocolsToMerge.map(p => p.id));

          if (purchaseError) {
            console.error('Purchase update error (non-fatal):', purchaseError);
          }

          consolidation.success = true;
        } catch (err) {
          consolidation.success = false;
          consolidation.error = err.message;
          results.errors.push(consolidation);
          continue;
        }
      }

      results.consolidated.push(consolidation);
    }

    return res.status(200).json({
      success: true,
      dryRun,
      message: dryRun ? 'Preview - no changes made' : 'Backfill completed',
      results
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return res.status(500).json({ error: error.message });
  }
}
