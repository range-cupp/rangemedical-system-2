// /pages/api/pipelines/peptide.js
// Peptide Pipeline API - Kanban-style stage grouping for peptide protocol tracking
// Stages are calculated from protocol data (start_date, end_date, days remaining)
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Pipeline stages (calculated, not stored in DB)
const PEPTIDE_STAGES = ['just_started', 'active', 'check_in_due', 'expiring_soon', 'expired', 'paused'];

function getPacificDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getPeptidePipeline(req, res);
  } else if (req.method === 'PATCH') {
    return updatePeptideProtocol(req, res);
  } else if (req.method === 'DELETE') {
    return removePeptideProtocol(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function getPeptidePipeline(req, res) {
  try {
    // Fetch all active/paused peptide protocols (includes peptide, gh_peptide, peptide_vial)
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select(`
        id, patient_id, program_type, program_name, medication, selected_dose,
        frequency, delivery_method, start_date, end_date, status, notes,
        created_at, updated_at, peptide_reminders_enabled,
        patients (id, name, first_name, last_name, phone, email)
      `)
      .in('program_type', ['peptide', 'gh_peptide', 'peptide_vial'])
      .in('status', ['active', 'paused'])
      .order('end_date', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Peptide pipeline query error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Fetch last check-in logs for these protocols
    const protocolIds = (protocols || []).map(p => p.id);
    let lastCheckinMap = {};

    if (protocolIds.length > 0) {
      const { data: logs } = await supabase
        .from('protocol_logs')
        .select('protocol_id, log_date, log_type')
        .in('protocol_id', protocolIds)
        .like('log_type', 'peptide_weekly_checkin_%')
        .order('log_date', { ascending: false });

      if (logs) {
        for (const log of logs) {
          if (!lastCheckinMap[log.protocol_id]) {
            lastCheckinMap[log.protocol_id] = log.log_date;
          }
        }
      }
    }

    const now = getPacificDate();
    now.setHours(0, 0, 0, 0);

    // Calculate stage for each protocol and enrich data
    const enriched = (protocols || []).map(p => {
      const startDate = p.start_date ? new Date(p.start_date + 'T12:00:00') : null;
      const endDate = p.end_date ? new Date(p.end_date + 'T12:00:00') : null;

      let daysRemaining = null;
      let daysSinceStart = null;
      let totalDays = null;

      if (startDate) {
        daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
      }
      if (endDate) {
        daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      }
      if (startDate && endDate) {
        totalDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
      }

      // Calculate pipeline stage
      let stage;
      if (p.status === 'paused') {
        stage = 'paused';
      } else if (daysRemaining !== null && daysRemaining < 0) {
        stage = 'expired';
      } else if (daysRemaining !== null && daysRemaining <= 5) {
        stage = 'expiring_soon';
      } else if (daysSinceStart !== null && daysSinceStart <= 3) {
        stage = 'just_started';
      } else {
        // Check if a 7-day check-in is due (every 7 days from start)
        const lastCheckin = lastCheckinMap[p.id];
        let checkinDue = false;
        if (daysSinceStart !== null && daysSinceStart >= 7) {
          if (!lastCheckin) {
            checkinDue = true;
          } else {
            const lastCheckinDate = new Date(lastCheckin + 'T12:00:00');
            const daysSinceCheckin = Math.floor((now - lastCheckinDate) / (1000 * 60 * 60 * 24));
            if (daysSinceCheckin >= 6) checkinDue = true;
          }
        }
        stage = checkinDue ? 'check_in_due' : 'active';
      }

      const patient = p.patients;
      const patientName = patient?.name || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim();

      return {
        id: p.id,
        patient_id: p.patient_id,
        patient_name: patientName,
        first_name: patient?.first_name || (patientName ? patientName.split(' ')[0] : ''),
        last_name: patient?.last_name || (patientName ? patientName.split(' ').slice(1).join(' ') : ''),
        phone: patient?.phone || null,
        email: patient?.email || null,
        medication: p.medication,
        program_name: p.program_name,
        program_type: p.program_type,
        frequency: p.frequency,
        delivery_method: p.delivery_method,
        start_date: p.start_date,
        end_date: p.end_date,
        days_remaining: daysRemaining,
        days_since_start: daysSinceStart,
        total_days: totalDays,
        status: p.status,
        stage,
        notes: p.notes,
        last_checkin: lastCheckinMap[p.id] || null,
        peptide_reminders_enabled: p.peptide_reminders_enabled || false,
        created_at: p.created_at,
        updated_at: p.updated_at,
      };
    });

    // Group by stage
    const stages = {};
    for (const s of PEPTIDE_STAGES) {
      stages[s] = enriched.filter(p => p.stage === s);
    }

    const counts = {};
    for (const s of PEPTIDE_STAGES) {
      counts[s] = stages[s].length;
    }

    const total = enriched.length;

    return res.status(200).json({
      success: true,
      stages,
      counts,
      total,
      expiringSoon: counts.expiring_soon + counts.expired,
      checkInDue: counts.check_in_due,
    });

  } catch (err) {
    console.error('Peptide Pipeline Error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// PATCH: Update protocol notes or status
async function updatePeptideProtocol(req, res) {
  try {
    const { id, notes, status } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });

    const updates = { updated_at: new Date().toISOString() };
    if (notes !== undefined) updates.notes = notes;
    if (status) updates.status = status;

    const { data, error } = await supabase
      .from('protocols')
      .update(updates)
      .eq('id', id)
      .in('program_type', ['peptide', 'gh_peptide', 'peptide_vial'])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Update peptide protocol error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// DELETE: Cancel a peptide protocol (soft delete)
async function removePeptideProtocol(req, res) {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });

    const { error } = await supabase
      .from('protocols')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .in('program_type', ['peptide', 'gh_peptide', 'peptide_vial']);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Remove peptide protocol error:', err);
    return res.status(500).json({ error: err.message });
  }
}
