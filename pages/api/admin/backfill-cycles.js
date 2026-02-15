// /pages/api/admin/backfill-cycles.js
// One-time endpoint to backfill cycle_start_date on existing recovery peptide protocols
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Recovery peptide detection (matches lib/protocol-config.js isRecoveryPeptide)
function isRecoveryPeptide(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  if (lower.includes('glow') || lower.includes('klow')) return false;
  return lower.includes('bpc-157') || lower.includes('bpc 157') ||
    lower.includes('wolverine') ||
    lower.includes('tb-500') || lower.includes('tb500') || lower.includes('tb4') ||
    lower.includes('thymosin beta');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all peptide protocols (active + completed, exclude merged/cancelled)
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select('id, patient_id, medication, start_date, end_date, status, cycle_start_date, program_type')
      .eq('program_type', 'peptide')
      .in('status', ['active', 'completed'])
      .order('start_date', { ascending: true });

    if (error) throw error;

    // Filter to recovery peptides only
    const recoveryProtocols = protocols.filter(p => isRecoveryPeptide(p.medication));

    // Group by patient_id
    const byPatient = {};
    for (const p of recoveryProtocols) {
      if (!byPatient[p.patient_id]) byPatient[p.patient_id] = [];
      byPatient[p.patient_id].push(p);
    }

    const updates = [];

    for (const [patientId, patientProtocols] of Object.entries(byPatient)) {
      // Sort by start_date
      patientProtocols.sort((a, b) => a.start_date.localeCompare(b.start_date));

      // Group into cycles: gap <= 5 days between end of one and start of next
      let cycleStart = patientProtocols[0].start_date;

      for (let i = 0; i < patientProtocols.length; i++) {
        const p = patientProtocols[i];

        if (i > 0) {
          const prevEnd = patientProtocols[i - 1].end_date;
          if (prevEnd && p.start_date) {
            const gapDays = Math.round(
              (new Date(p.start_date + 'T12:00:00') - new Date(prevEnd + 'T12:00:00')) / (1000 * 60 * 60 * 24)
            );
            if (gapDays > 5) {
              // New cycle
              cycleStart = p.start_date;
            }
          }
        }

        // Only update if cycle_start_date is missing or wrong
        if (p.cycle_start_date !== cycleStart) {
          updates.push({ id: p.id, cycle_start_date: cycleStart });
        }
      }
    }

    // Apply updates
    let updated = 0;
    for (const u of updates) {
      const { error: updateError } = await supabase
        .from('protocols')
        .update({ cycle_start_date: u.cycle_start_date })
        .eq('id', u.id);

      if (updateError) {
        console.error(`Failed to update protocol ${u.id}:`, updateError);
      } else {
        updated++;
      }
    }

    return res.status(200).json({
      success: true,
      totalRecoveryProtocols: recoveryProtocols.length,
      patientsProcessed: Object.keys(byPatient).length,
      protocolsUpdated: updated,
      updates,
    });
  } catch (err) {
    console.error('Backfill error:', err);
    return res.status(500).json({ error: err.message });
  }
}
