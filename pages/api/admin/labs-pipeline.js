// /pages/api/admin/labs-pipeline.js
// API for Labs Pipeline - New Patient Journeys & Protocol Follow-ups
// Range Medical
// CREATED: 2026-01-26

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
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

// GET: Fetch all labs pipeline data
async function getLabsPipeline(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // =========================
    // NEW PATIENT JOURNEYS
    // =========================
    
    // Scheduled (blood draw booked but not completed)
    const { data: scheduled, error: scheduledError } = await supabase
      .from('lab_journeys')
      .select('*')
      .eq('stage', 'scheduled')
      .eq('journey_type', 'new_patient')
      .order('blood_draw_scheduled_date', { ascending: true });

    // Outreach Due (blood drawn, need to call within 2 business days)
    const { data: outreachDue, error: outreachError } = await supabase
      .from('lab_journeys')
      .select('*')
      .eq('stage', 'outreach_due')
      .eq('journey_type', 'new_patient')
      .order('outreach_due_date', { ascending: true });

    // Outreach Complete (called, waiting to schedule lab review)
    const { data: outreachComplete, error: outreachCompleteError } = await supabase
      .from('lab_journeys')
      .select('*')
      .eq('stage', 'outreach_complete')
      .eq('journey_type', 'new_patient')
      .order('outreach_completed_date', { ascending: true });

    // Review Scheduled (lab review appointment booked)
    const { data: reviewScheduled, error: reviewScheduledError } = await supabase
      .from('lab_journeys')
      .select('*')
      .eq('stage', 'review_scheduled')
      .eq('journey_type', 'new_patient')
      .order('lab_review_scheduled_date', { ascending: true });

    // Review Complete (need outcome recorded)
    const { data: reviewComplete, error: reviewCompleteError } = await supabase
      .from('lab_journeys')
      .select('*')
      .eq('stage', 'review_complete')
      .is('outcome', null)
      .eq('journey_type', 'new_patient')
      .order('lab_review_completed_date', { ascending: true });

    // Completed (outcome recorded)
    const { data: completed, error: completedError } = await supabase
      .from('lab_journeys')
      .select('*')
      .eq('stage', 'review_complete')
      .not('outcome', 'is', null)
      .eq('journey_type', 'new_patient')
      .order('updated_at', { ascending: false })
      .limit(50);

    // =========================
    // PROTOCOL FOLLOW-UP LABS
    // =========================

    // Due (need to schedule follow-up blood draw)
    const { data: followUpDue, error: followUpDueError } = await supabase
      .from('protocol_follow_up_labs')
      .select('*, protocols(program_type, medications)')
      .eq('status', 'due')
      .order('due_date', { ascending: true });

    // Scheduled (follow-up blood draw booked)
    const { data: followUpScheduled, error: followUpScheduledError } = await supabase
      .from('protocol_follow_up_labs')
      .select('*, protocols(program_type, medications)')
      .eq('status', 'scheduled')
      .order('scheduled_date', { ascending: true });

    // Results Pending (blood drawn, waiting for results)
    const { data: followUpPending, error: followUpPendingError } = await supabase
      .from('protocol_follow_up_labs')
      .select('*, protocols(program_type, medications)')
      .eq('status', 'results_pending')
      .order('drawn_date', { ascending: true });

    // =========================
    // COUNTS & SUMMARY
    // =========================
    
    const newPatientCounts = {
      scheduled: scheduled?.length || 0,
      outreach_due: outreachDue?.length || 0,
      outreach_complete: outreachComplete?.length || 0,
      review_scheduled: reviewScheduled?.length || 0,
      review_complete: reviewComplete?.length || 0
    };

    const followUpCounts = {
      due: followUpDue?.length || 0,
      scheduled: followUpScheduled?.length || 0,
      results_pending: followUpPending?.length || 0
    };

    // Find overdue items
    const overdueOutreach = (outreachDue || []).filter(j => j.outreach_due_date <= today);
    const overdueFollowUps = (followUpDue || []).filter(f => f.due_date <= today);

    return res.status(200).json({
      success: true,
      newPatient: {
        scheduled: scheduled || [],
        outreachDue: outreachDue || [],
        outreachComplete: outreachComplete || [],
        reviewScheduled: reviewScheduled || [],
        reviewComplete: reviewComplete || [],
        completed: completed || [],
        counts: newPatientCounts
      },
      followUp: {
        due: followUpDue || [],
        scheduled: followUpScheduled || [],
        resultsPending: followUpPending || [],
        counts: followUpCounts
      },
      alerts: {
        overdueOutreach: overdueOutreach.length,
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

// POST: Manually create a lab journey
async function createLabJourney(req, res) {
  try {
    const { patientId, patientName, journeyType, bloodDrawDate } = req.body;
    
    if (!patientName) {
      return res.status(400).json({ error: 'patientName required' });
    }

    // Calculate outreach due date (2 business days from blood draw)
    const drawDate = bloodDrawDate ? new Date(bloodDrawDate) : new Date();
    const outreachDue = addBusinessDays(drawDate, 2);

    const { data, error } = await supabase
      .from('lab_journeys')
      .insert({
        patient_id: patientId,
        patient_name: patientName,
        journey_type: journeyType || 'new_patient',
        stage: bloodDrawDate ? 'outreach_due' : 'scheduled',
        blood_draw_scheduled_date: drawDate.toISOString(),
        blood_draw_completed_date: bloodDrawDate ? drawDate.toISOString() : null,
        outreach_due_date: formatDate(outreachDue)
      })
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

// Helper: Add business days
function addBusinessDays(date, days) {
  let result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  return result;
}

// Helper: Format date
function formatDate(date) {
  return date.toISOString().split('T')[0];
}
