// /pages/api/admin/patient-automations.js
// GET: Fetch active automations for a patient
// POST: Toggle automations on/off
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // GET — list active automations for a patient
  if (req.method === 'GET') {
    const { patientId } = req.query;
    if (!patientId) return res.status(400).json({ error: 'patientId required' });

    try {
      // Get active protocols for this patient
      const { data: protocols, error } = await supabase
        .from('protocols')
        .select('id, program_type, medication, status, start_date, onboarding_start_date, peptide_reminders_enabled, checkin_reminder_enabled, injection_day, journey_template_id, current_journey_stage')
        .eq('patient_id', patientId)
        .eq('status', 'active');

      if (error) throw error;

      // Build automations list from active protocols
      const automations = [];

      for (const p of (protocols || [])) {
        const label = p.medication || p.program_type || 'Protocol';

        // HRT Onboarding emails
        if (p.program_type === 'hrt' && p.onboarding_start_date) {
          automations.push({
            id: `hrt_onboarding_${p.id}`,
            protocolId: p.id,
            type: 'hrt_onboarding',
            name: 'HRT Onboarding Emails',
            description: `Started ${p.onboarding_start_date}`,
            protocol: label,
            active: true,
          });
        }

        // Peptide weekly check-in reminders
        if (p.program_type === 'peptide' && p.peptide_reminders_enabled) {
          automations.push({
            id: `peptide_checkin_${p.id}`,
            protocolId: p.id,
            type: 'peptide_checkin',
            name: 'Peptide Weekly Check-in',
            description: 'Weekly SMS check-in reminder',
            protocol: label,
            active: true,
          });
        }

        // Weight loss weekly check-in reminders
        if (p.program_type?.startsWith('weight_loss') && p.checkin_reminder_enabled) {
          automations.push({
            id: `wl_checkin_${p.id}`,
            protocolId: p.id,
            type: 'wl_checkin',
            name: 'WL Weekly Check-in',
            description: `Every ${p.injection_day || 'week'}`,
            protocol: label,
            active: true,
          });
        }

        // Journey notifications
        if (p.journey_template_id) {
          automations.push({
            id: `journey_${p.id}`,
            protocolId: p.id,
            type: 'journey',
            name: 'Journey Notifications',
            description: `Stage: ${p.current_journey_stage || 'active'}`,
            protocol: label,
            active: true,
          });
        }
      }

      return res.status(200).json({ automations });
    } catch (err) {
      console.error('Fetch automations error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // POST — toggle an automation off/on
  if (req.method === 'POST') {
    const { protocolId, type, active } = req.body;
    if (!protocolId || !type) {
      return res.status(400).json({ error: 'protocolId and type required' });
    }

    try {
      let updateFields = {};

      switch (type) {
        case 'hrt_onboarding':
          // Clear onboarding_start_date to stop the sequence
          updateFields = active
            ? { onboarding_start_date: todayPacific() }
            : { onboarding_start_date: null };
          break;
        case 'peptide_checkin':
          updateFields = { peptide_reminders_enabled: !!active };
          break;
        case 'wl_checkin':
          updateFields = { checkin_reminder_enabled: !!active };
          break;
        case 'journey':
          updateFields = active
            ? {} // Can't re-enable without knowing template — skip
            : { journey_template_id: null, current_journey_stage: null };
          break;
        default:
          return res.status(400).json({ error: 'Unknown automation type' });
      }

      if (Object.keys(updateFields).length > 0) {
        const { error } = await supabase
          .from('protocols')
          .update(updateFields)
          .eq('id', protocolId);

        if (error) throw error;
      }

      return res.status(200).json({ success: true, active: !!active });
    } catch (err) {
      console.error('Toggle automation error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
