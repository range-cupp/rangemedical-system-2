// /pages/api/admin/labs-pipeline.js
// API for Labs Pipeline - New Patient Journeys & Protocol Follow-ups
// Range Medical
// CREATED: 2026-01-26
// UPDATED: 2026-02-10 - New 6-stage pipeline: draw_scheduled, draw_complete, provider_reviewed, consult_scheduled, need_follow_up, treatment_started

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getLabsPipeline(req, res);
  } else if (req.method === 'PATCH') {
    return updateLabJourney(req, res);
  } else if (req.method === 'POST') {
    return createLabJourney(req, res);
  } else if (req.method === 'DELETE') {
    return deleteLabJourney(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// GET: Fetch all labs pipeline data
async function getLabsPipeline(req, res) {
  try {
    // =========================
    // NEW PATIENT JOURNEYS (6 stages)
    // =========================

    // 1. Blood Draw Scheduled
    const { data: drawScheduled } = await supabase
      .from('lab_journeys')
      .select('*')
      .eq('stage', 'draw_scheduled')
      .eq('journey_type', 'new_patient')
      .order('blood_draw_scheduled_date', { ascending: true });

    // 2. Blood Draw Complete
    const { data: drawComplete } = await supabase
      .from('lab_journeys')
      .select('*')
      .eq('stage', 'draw_complete')
      .eq('journey_type', 'new_patient')
      .order('blood_draw_completed_date', { ascending: true });

    // 3. Provider Reviewed
    const { data: providerReviewed } = await supabase
      .from('lab_journeys')
      .select('*')
      .eq('stage', 'provider_reviewed')
      .eq('journey_type', 'new_patient')
      .order('provider_reviewed_date', { ascending: true });

    // 4. Consultation Scheduled
    const { data: consultScheduled } = await supabase
      .from('lab_journeys')
      .select('*')
      .eq('stage', 'consult_scheduled')
      .eq('journey_type', 'new_patient')
      .order('consultation_scheduled_date', { ascending: true });

    // 5. Need to Follow Up
    const { data: needFollowUp } = await supabase
      .from('lab_journeys')
      .select('*')
      .eq('stage', 'need_follow_up')
      .eq('journey_type', 'new_patient')
      .order('follow_up_flagged_date', { ascending: true });

    // 6. Treatment Started
    const { data: treatmentStarted } = await supabase
      .from('lab_journeys')
      .select('*')
      .eq('stage', 'treatment_started')
      .eq('journey_type', 'new_patient')
      .order('treatment_started_date', { ascending: true });

    // =========================
    // LINK PROTOCOLS TO TREATMENT STARTED
    // =========================

    let treatmentStartedWithProtocols = treatmentStarted || [];

    try {
      treatmentStartedWithProtocols = await Promise.all(
        (treatmentStarted || []).map(async (journey) => {
          try {
            let protocol = null;

            if (journey.patient_id) {
              const { data: protocolData } = await supabase
                .from('protocols')
                .select('id, program_type, program_name, medication, status, start_date, created_at')
                .eq('patient_id', journey.patient_id)
                .order('created_at', { ascending: false })
                .limit(1);

              protocol = protocolData?.[0] || null;
            }

            if (!protocol && journey.ghl_contact_id) {
              const { data: protocolByGhl } = await supabase
                .from('protocols')
                .select('id, program_type, program_name, medication, status, start_date, created_at')
                .eq('ghl_contact_id', journey.ghl_contact_id)
                .order('created_at', { ascending: false })
                .limit(1);

              protocol = protocolByGhl?.[0] || null;
            }

            if (!protocol && journey.patient_name) {
              const nameParts = journey.patient_name.trim().toLowerCase().split(/\s+/);
              if (nameParts.length >= 2) {
                const firstName = nameParts[0];
                const lastName = nameParts[nameParts.length - 1];

                const { data: protocolsByName } = await supabase
                  .from('protocols')
                  .select('id, program_type, program_name, medication, status, start_date, created_at, patient_name')
                  .order('created_at', { ascending: false })
                  .limit(50);

                if (protocolsByName) {
                  protocol = protocolsByName.find(p => {
                    const pName = (p.patient_name || '').toLowerCase();
                    return pName.includes(firstName) && pName.includes(lastName);
                  }) || null;
                }
              }
            }

            return {
              ...journey,
              linked_protocol: protocol
            };
          } catch (err) {
            console.error('Error linking protocol for journey:', journey.id, err);
            return {
              ...journey,
              linked_protocol: null
            };
          }
        })
      );
    } catch (err) {
      console.error('Error in protocol linking:', err);
      treatmentStartedWithProtocols = (treatmentStarted || []).map(j => ({ ...j, linked_protocol: null }));
    }

    // =========================
    // PROTOCOL FOLLOW-UP LABS
    // =========================

    const { data: followUpDue } = await supabase
      .from('protocol_follow_up_labs')
      .select('*, protocols(program_type, medication)')
      .eq('status', 'due')
      .order('due_date', { ascending: true });

    const { data: followUpScheduled } = await supabase
      .from('protocol_follow_up_labs')
      .select('*, protocols(program_type, medication)')
      .eq('status', 'scheduled')
      .order('scheduled_date', { ascending: true });

    const { data: followUpPending } = await supabase
      .from('protocol_follow_up_labs')
      .select('*, protocols(program_type, medication)')
      .eq('status', 'results_pending')
      .order('drawn_date', { ascending: true });

    // =========================
    // COUNTS & SUMMARY
    // =========================

    const newPatientCounts = {
      draw_scheduled: drawScheduled?.length || 0,
      draw_complete: drawComplete?.length || 0,
      provider_reviewed: providerReviewed?.length || 0,
      consult_scheduled: consultScheduled?.length || 0,
      need_follow_up: needFollowUp?.length || 0,
      treatment_started: treatmentStartedWithProtocols?.length || 0
    };

    const followUpCounts = {
      due: followUpDue?.length || 0,
      scheduled: followUpScheduled?.length || 0,
      results_pending: followUpPending?.length || 0
    };

    const overdueFollowUps = (followUpDue || []).filter(f => f.due_date <= new Date().toISOString().split('T')[0]);

    return res.status(200).json({
      success: true,
      newPatient: {
        drawScheduled: drawScheduled || [],
        drawComplete: drawComplete || [],
        providerReviewed: providerReviewed || [],
        consultScheduled: consultScheduled || [],
        needFollowUp: needFollowUp || [],
        treatmentStarted: treatmentStartedWithProtocols || [],
        counts: newPatientCounts
      },
      followUp: {
        due: followUpDue || [],
        scheduled: followUpScheduled || [],
        resultsPending: followUpPending || [],
        counts: followUpCounts
      },
      alerts: {
        overdueFollowUps: overdueFollowUps.length
      }
    });

  } catch (error) {
    console.error('Labs Pipeline Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// PATCH: Update a lab journey stage or record outcome
async function updateLabJourney(req, res) {
  try {
    const { id, type, updates } = req.body;

    if (!id || !type) {
      return res.status(400).json({ error: 'id and type required' });
    }

    const table = type === 'journey' ? 'lab_journeys' : 'protocol_follow_up_labs';

    const { data, error } = await supabase
      .from(table)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('Update Lab Journey Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// DELETE: Remove a lab journey from the pipeline
async function deleteLabJourney(req, res) {
  try {
    const { id, type } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'id required' });
    }

    const table = type === 'follow_up' ? 'protocol_follow_up_labs' : 'lab_journeys';

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, message: 'Journey deleted' });

  } catch (error) {
    console.error('Delete Lab Journey Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// POST: Manually create a lab journey
async function createLabJourney(req, res) {
  try {
    const { patientId, patientName, journeyType, bloodDrawDate } = req.body;

    if (!patientName) {
      return res.status(400).json({ error: 'patientName required' });
    }

    const insertData = {
      patient_id: patientId,
      patient_name: patientName,
      journey_type: journeyType || 'new_patient',
      stage: bloodDrawDate ? 'draw_complete' : 'draw_scheduled',
      blood_draw_scheduled_date: new Date().toISOString()
    };

    if (bloodDrawDate) {
      insertData.blood_draw_completed_date = new Date(bloodDrawDate).toISOString();
    }

    const { data, error } = await supabase
      .from('lab_journeys')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('Create Lab Journey Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
