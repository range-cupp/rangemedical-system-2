// Recovery Session Logging API
// POST: { enrollment_id, date?, administered_by?, notes? }
// Logs a Recovery Session — creates service_log entries based on modality,
// decrements sessions_used on enrollment, updates protocol sessions_completed

import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../lib/date-utils';
import { getServiceTypesForModality } from '../../../lib/recovery-offers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      enrollment_id,
      date,
      administered_by,
      notes,
    } = req.body;

    if (!enrollment_id) {
      return res.status(400).json({ error: 'enrollment_id is required' });
    }

    // ── Fetch enrollment ───────────────────────────────────────────────────
    const { data: enrollment, error: fetchError } = await supabase
      .from('recovery_enrollments')
      .select('*, recovery_offers(name, offer_type)')
      .eq('id', enrollment_id)
      .single();

    if (fetchError || !enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    if (enrollment.status !== 'active') {
      return res.status(400).json({ error: `Enrollment is ${enrollment.status}, not active` });
    }

    if (enrollment.sessions_used >= enrollment.sessions_allowed) {
      return res.status(400).json({
        error: 'No sessions remaining in this cycle',
        sessions_used: enrollment.sessions_used,
        sessions_allowed: enrollment.sessions_allowed,
      });
    }

    const entryDate = date || todayPacific();
    const serviceTypes = getServiceTypesForModality(enrollment.modality_preference);

    // ── Create service_log entries ─────────────────────────────────────────
    const logEntries = serviceTypes.map(type => ({
      patient_id: enrollment.patient_id,
      protocol_id: enrollment.protocol_id,
      category: type,
      entry_type: 'session',
      entry_date: entryDate,
      medication: type === 'hbot' ? 'Hyperbaric Oxygen' : 'Red Light Therapy',
      duration: type === 'hbot' ? 60 : 20,
      administered_by: administered_by || null,
      notes: notes ? `[${enrollment.recovery_offers?.name}] ${notes}` : `[${enrollment.recovery_offers?.name}]`,
    }));

    const { data: logs, error: logError } = await supabase
      .from('service_logs')
      .insert(logEntries)
      .select();

    if (logError) {
      console.error('Service log insert error:', logError);
      return res.status(500).json({ error: logError.message });
    }

    // ── Update enrollment session count ────────────────────────────────────
    const newUsed = enrollment.sessions_used + 1; // 1 Recovery Session (even if COMBINED = 2 service entries)
    const updateData = {
      sessions_used: newUsed,
      updated_at: new Date().toISOString(),
    };

    // Auto-complete if all sessions used
    const isComplete = newUsed >= enrollment.sessions_allowed;
    const offerType = enrollment.recovery_offers?.offer_type;
    if (isComplete && offerType !== 'MEMBERSHIP') {
      updateData.status = 'completed';
    }

    const { error: updateError } = await supabase
      .from('recovery_enrollments')
      .update(updateData)
      .eq('id', enrollment_id);

    if (updateError) {
      console.error('Enrollment update error:', updateError);
    }

    // ── Update protocol sessions_completed ─────────────────────────────────
    if (enrollment.protocol_id) {
      const sessionsLogged = serviceTypes.length; // 1 or 2 depending on modality
      const { data: protocol } = await supabase
        .from('protocols')
        .select('sessions_completed')
        .eq('id', enrollment.protocol_id)
        .single();

      if (protocol) {
        await supabase
          .from('protocols')
          .update({
            sessions_completed: (protocol.sessions_completed || 0) + sessionsLogged,
            last_session: entryDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', enrollment.protocol_id);
      }
    }

    return res.status(200).json({
      success: true,
      sessions_used: newUsed,
      sessions_allowed: enrollment.sessions_allowed,
      sessions_remaining: enrollment.sessions_allowed - newUsed,
      status: updateData.status || 'active',
      service_logs_created: logs?.length || 0,
    });

  } catch (error) {
    console.error('Recovery log-session error:', error);
    return res.status(500).json({ error: error.message });
  }
}
