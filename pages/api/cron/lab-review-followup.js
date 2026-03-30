// /pages/api/cron/lab-review-followup.js
// Daily cron: auto-move lab patients to follow_up if their initial lab review
// consultation has passed and they have no purchase on or after that date.
// Creates a follow-up task for Tara + Chris so nobody falls through the cracks.
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LAB_REVIEW_SLUGS = [
  'initial-lab-review',
  'follow-up-lab-review',
  'initial-lab-review-telemedicine',
  'follow-up-lab-review-telemedicine',
  'follow-up-lab-review-phone',
];

export default async function handler(req, res) {
  // Verify cron authorization
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const authHeader = req.headers['authorization'];
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  const isAuthorized = isVercelCron || (
    process.env.CRON_SECRET && (
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`
    )
  );

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date().toISOString();

    // 1. Get all lab protocols in consult_scheduled stage
    const { data: consultProtocols, error: protoErr } = await supabase
      .from('protocols')
      .select('id, patient_id, program_name, patients(id, name, first_name, last_name, phone)')
      .eq('program_type', 'labs')
      .eq('status', 'consult_scheduled');

    if (protoErr) {
      console.error('lab-review-followup: protocol fetch error', protoErr);
      return res.status(500).json({ error: protoErr.message });
    }

    if (!consultProtocols || consultProtocols.length === 0) {
      return res.status(200).json({ success: true, message: 'No consult_scheduled protocols found', moved: 0 });
    }

    const patientIds = consultProtocols.map(p => p.patient_id).filter(Boolean);

    // 2. Get lab review bookings that have already happened for these patients
    const { data: pastBookings } = await supabase
      .from('calcom_bookings')
      .select('patient_id, start_time, service_slug')
      .in('patient_id', patientIds)
      .in('service_slug', LAB_REVIEW_SLUGS)
      .lt('start_time', now)
      .in('status', ['completed', 'confirmed', 'accepted', 'scheduled'])
      .order('start_time', { ascending: false });

    if (!pastBookings || pastBookings.length === 0) {
      return res.status(200).json({ success: true, message: 'No past lab review bookings found', moved: 0 });
    }

    // Group by patient — get the most recent past booking per patient
    const latestBookingByPatient = {};
    for (const booking of pastBookings) {
      if (!latestBookingByPatient[booking.patient_id]) {
        latestBookingByPatient[booking.patient_id] = booking;
      }
    }

    // 3. Check purchases for each patient — did they buy anything on or after their lab review?
    const movedToFollowUp = [];

    for (const proto of consultProtocols) {
      const booking = latestBookingByPatient[proto.patient_id];
      if (!booking) continue; // No past booking yet — consult hasn't happened

      const bookingDate = booking.start_time.split('T')[0]; // YYYY-MM-DD

      // Check for any purchase on or after the booking date
      const { data: purchases } = await supabase
        .from('purchases')
        .select('id')
        .eq('patient_id', proto.patient_id)
        .gte('purchase_date', bookingDate)
        .eq('dismissed', false)
        .limit(1);

      if (purchases && purchases.length > 0) {
        // They purchased — skip (they should be moved to in_treatment manually or via another flow)
        continue;
      }

      // Also check if they have any active treatment protocols started on or after the booking
      const { data: treatmentProtocols } = await supabase
        .from('protocols')
        .select('id')
        .eq('patient_id', proto.patient_id)
        .neq('program_type', 'labs')
        .in('status', ['active'])
        .gte('start_date', bookingDate)
        .limit(1);

      if (treatmentProtocols && treatmentProtocols.length > 0) {
        // They started treatment — skip
        continue;
      }

      // No purchase, no new treatment → move to follow_up
      const { error: updateErr } = await supabase
        .from('protocols')
        .update({ status: 'follow_up', updated_at: new Date().toISOString() })
        .eq('id', proto.id);

      if (updateErr) {
        console.error(`lab-review-followup: failed to move protocol ${proto.id}`, updateErr);
        continue;
      }

      const patient = proto.patients;
      const patientName = patient?.name || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim();
      movedToFollowUp.push({ protocolId: proto.id, patientId: proto.patient_id, patientName });
    }

    // 4. Create follow-up tasks for Tara + Chris if anyone was moved
    if (movedToFollowUp.length > 0) {
      const { data: staff } = await supabase
        .from('employees')
        .select('id, email')
        .in('email', ['tara@range-medical.com', 'cupp@range-medical.com'])
        .eq('is_active', true);

      const tara = staff?.find(e => e.email === 'tara@range-medical.com');
      const chris = staff?.find(e => e.email === 'cupp@range-medical.com');

      const today = todayPacific();
      const tasks = [];

      for (const item of movedToFollowUp) {
        const baseTask = {
          title: `📋 Follow up — ${item.patientName} (no purchase after lab review)`,
          description: `${item.patientName} completed their lab review consultation but did not purchase any treatment. Follow up to see if they have questions or want to move forward.`,
          patient_id: item.patientId,
          patient_name: item.patientName,
          priority: 'medium',
          due_date: today,
          status: 'pending',
          category: 'labs',
        };

        if (tara) tasks.push({ ...baseTask, assigned_to: tara.id });
        if (chris) tasks.push({ ...baseTask, assigned_to: chris.id });
      }

      if (tasks.length > 0) {
        await supabase.from('tasks').insert(tasks);
      }
    }

    console.log(`lab-review-followup: moved ${movedToFollowUp.length} patients to follow_up`);
    return res.status(200).json({
      success: true,
      moved: movedToFollowUp.length,
      patients: movedToFollowUp.map(m => m.patientName),
    });

  } catch (err) {
    console.error('lab-review-followup error:', err);
    return res.status(500).json({ error: err.message });
  }
}
