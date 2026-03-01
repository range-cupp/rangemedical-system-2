// /pages/api/admin/journeys/seed.js
// Seed default journey templates for all protocol types
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEFAULT_TEMPLATES = [
  {
    protocol_type: 'hrt',
    name: 'HRT Journey',
    is_default: true,
    stages: [
      { key: 'intake_submitted', label: 'Intake Submitted', description: 'Patient has submitted intake forms', order: 0 },
      { key: 'consult_scheduled', label: 'Consult Scheduled', description: 'Initial consultation booked', order: 1 },
      { key: 'consult_complete', label: 'Consult Complete', description: 'Provider consultation done', order: 2 },
      { key: 'baseline_labs', label: 'Baseline Labs', description: 'Initial bloodwork ordered/drawn', order: 3 },
      { key: 'labs_reviewed', label: 'Labs Reviewed', description: 'Provider has reviewed lab results', order: 4 },
      { key: 'protocol_started', label: 'Protocol Started', description: 'Patient has started HRT medication', order: 5 },
      { key: 'week4_checkin', label: '4-Week Check-in', description: 'First month follow-up', order: 6 },
      { key: 'week8_labs', label: '8-Week Labs', description: 'Follow-up bloodwork at 8 weeks', order: 7 },
      { key: 'dose_adjusted', label: 'Dose Adjusted', description: 'Dosage optimization based on labs', order: 8 },
      { key: 'month3_labs', label: '3-Month Labs', description: 'Quarterly lab check', order: 9 },
      { key: 'maintenance', label: 'Maintenance', description: 'Stable on protocol, regular monitoring', order: 10 },
      { key: 'renewal', label: 'Renewal Due', description: 'Protocol renewal or reassessment needed', order: 11 }
    ]
  },
  {
    protocol_type: 'weight_loss',
    name: 'Weight Loss Journey',
    is_default: true,
    stages: [
      { key: 'intake_submitted', label: 'Intake Submitted', description: 'Patient intake forms received', order: 0 },
      { key: 'consult_complete', label: 'Consult Complete', description: 'Provider consultation done', order: 1 },
      { key: 'started', label: 'Started', description: 'Medication dispensed, protocol active', order: 2 },
      { key: 'titrating', label: 'Titrating', description: 'Dosage being adjusted upward', order: 3 },
      { key: 'midpoint', label: 'Midpoint Check', description: 'Mid-protocol progress review', order: 4 },
      { key: 'target_dose', label: 'At Target Dose', description: 'Reached therapeutic dose', order: 5 },
      { key: 'monitoring', label: 'Monitoring', description: 'Tracking progress and side effects', order: 6 },
      { key: 'completion', label: 'Completion/Renewal', description: 'Protocol end or renewal decision', order: 7 }
    ]
  },
  {
    protocol_type: 'peptide',
    name: 'Peptide Therapy Journey',
    is_default: true,
    stages: [
      {
        key: 'consult_complete',
        label: 'Consult Complete',
        description: 'Provider consultation done, protocol created',
        order: 0,
        auto_conditions: { days_elapsed: 0 }
      },
      {
        key: 'forms_pending',
        label: 'Forms Pending',
        description: 'Intake, HIPAA, and consent forms sent — awaiting completion',
        order: 1,
        auto_conditions: { forms_complete: true }
      },
      {
        key: 'dispensed',
        label: 'Dispensed',
        description: 'First injection given, take-home supply dispensed',
        order: 2,
        auto_conditions: { days_elapsed: 1 }
      },
      {
        key: 'opt_in_sent',
        label: 'Opt-in Sent',
        description: 'Weekly check-in opt-in SMS sent, awaiting patient response',
        order: 3,
        auto_conditions: { optin_complete: true }
      },
      {
        key: 'active',
        label: 'Active Treatment',
        description: 'Patient actively on peptide protocol with weekly check-ins',
        order: 4,
        auto_conditions: { days_at_midpoint: true }
      },
      {
        key: 'midpoint_review',
        label: 'Midpoint Review',
        description: 'Mid-cycle progress review and check-in',
        order: 5,
        auto_conditions: { protocol_ending_soon: 5 }
      },
      {
        key: 'nearing_completion',
        label: 'Nearing Completion',
        description: 'Final days of current cycle',
        order: 6,
        auto_conditions: { protocol_ended: true }
      },
      {
        key: 'cycle_complete',
        label: 'Cycle Complete / Renewal',
        description: 'Cycle finished — eligible for renewal up to 90 continuous days',
        order: 7
      }
    ]
  },
  {
    protocol_type: 'iv',
    name: 'IV Therapy Journey',
    is_default: true,
    stages: [
      { key: 'booked', label: 'Booked', description: 'Appointment scheduled', order: 0 },
      { key: 'checked_in', label: 'Checked In', description: 'Patient arrived at clinic', order: 1 },
      { key: 'in_progress', label: 'In Progress', description: 'IV infusion underway', order: 2 },
      { key: 'complete', label: 'Complete', description: 'Session finished, patient discharged', order: 3 }
    ]
  },
  {
    protocol_type: 'hbot',
    name: 'HBOT Journey',
    is_default: true,
    stages: [
      { key: 'enrolled', label: 'Enrolled', description: 'Signed up for HBOT sessions', order: 0 },
      { key: 'in_progress', label: 'In Progress', description: 'Actively completing sessions', order: 1 },
      { key: 'midpoint', label: 'Midpoint Check', description: 'Halfway through session pack', order: 2 },
      { key: 'completing', label: 'Completing', description: 'Final sessions remaining', order: 3 }
    ]
  },
  {
    protocol_type: 'rlt',
    name: 'Red Light Therapy Journey',
    is_default: true,
    stages: [
      { key: 'enrolled', label: 'Enrolled', description: 'Signed up for RLT sessions', order: 0 },
      { key: 'in_progress', label: 'In Progress', description: 'Actively completing sessions', order: 1 },
      { key: 'midpoint', label: 'Midpoint Check', description: 'Halfway through session pack', order: 2 },
      { key: 'completing', label: 'Completing', description: 'Final sessions remaining', order: 3 }
    ]
  },
  {
    protocol_type: 'injection',
    name: 'Injection Protocol Journey',
    is_default: true,
    stages: [
      { key: 'prescribed', label: 'Prescribed', description: 'Injection protocol ordered', order: 0 },
      { key: 'active', label: 'Active', description: 'Currently receiving injections', order: 1 },
      { key: 'monitoring', label: 'Monitoring', description: 'Tracking response', order: 2 },
      { key: 'renewal', label: 'Renewal Due', description: 'Protocol renewal needed', order: 3 }
    ]
  },
  {
    protocol_type: 'combo_membership',
    name: 'Combo Membership Journey',
    is_default: true,
    stages: [
      { key: 'enrolled', label: 'Enrolled', description: 'Membership activated', order: 0 },
      { key: 'onboarding', label: 'Onboarding', description: 'Initial appointments and setup', order: 1 },
      { key: 'active', label: 'Active Member', description: 'Using membership benefits', order: 2 },
      { key: 'renewal', label: 'Renewal Due', description: 'Membership renewal needed', order: 3 }
    ]
  }
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { update, types } = req.body || {};
    const filterTypes = types ? types.split(',').map(t => t.trim()) : null;
    const results = [];

    for (const template of DEFAULT_TEMPLATES) {
      // Filter to specific types if requested
      if (filterTypes && !filterTypes.includes(template.protocol_type)) continue;

      // Check if a default template already exists for this type
      const { data: existing } = await supabase
        .from('journey_templates')
        .select('id')
        .eq('protocol_type', template.protocol_type)
        .eq('is_default', true)
        .maybeSingle();

      if (existing) {
        if (update) {
          // Update existing template with new stages
          const { data, error } = await supabase
            .from('journey_templates')
            .update({ stages: template.stages, name: template.name })
            .eq('id', existing.id)
            .select()
            .single();

          if (error) {
            results.push({ type: template.protocol_type, action: 'update_error', error: error.message });
          } else {
            results.push({ type: template.protocol_type, action: 'updated', id: data.id });
          }
        } else {
          results.push({ type: template.protocol_type, action: 'skipped', reason: 'default already exists (pass update=true to overwrite)' });
        }
        continue;
      }

      const { data, error } = await supabase
        .from('journey_templates')
        .insert(template)
        .select()
        .single();

      if (error) {
        results.push({ type: template.protocol_type, action: 'error', error: error.message });
      } else {
        results.push({ type: template.protocol_type, action: 'created', id: data.id });
      }
    }

    return res.status(200).json({
      success: true,
      results,
      created: results.filter(r => r.action === 'created').length,
      updated: results.filter(r => r.action === 'updated').length,
      skipped: results.filter(r => r.action === 'skipped').length
    });

  } catch (error) {
    console.error('Seed templates error:', error);
    return res.status(500).json({ error: error.message });
  }
}
