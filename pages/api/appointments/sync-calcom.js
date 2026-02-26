// GET /api/appointments/sync-calcom
// One-time sync: reads all calcom_bookings and inserts into appointments table
// Idempotent — skips if cal_com_booking_id already exists

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map Cal.com event slug to service category
const SLUG_TO_CATEGORY = {
  'new-patient-blood-draw': 'labs',
  'follow-up-blood-draw': 'labs',
  'initial-lab-review': 'labs',
  'follow-up-lab-review': 'labs',
  'range-injections': 'injection',
  'nad-injection': 'injection',
  'injection-testosterone': 'hrt',
  'injection-weight-loss': 'weight_loss',
  'injection-peptide': 'peptide',
  'hbot': 'hbot',
  'red-light-therapy': 'rlt',
  'range-iv': 'iv',
  'nad-iv-250': 'iv',
  'nad-iv-500': 'iv',
  'specialty-iv': 'iv',
  'initial-consultation': 'other',
  'follow-up-consultation': 'other',
};

function mapCalcomStatus(calcomStatus) {
  switch (calcomStatus) {
    case 'ACCEPTED': return 'confirmed';
    case 'CANCELLED': return 'cancelled';
    case 'REJECTED': return 'cancelled';
    case 'PENDING': return 'scheduled';
    default: return 'scheduled';
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all Cal.com bookings
    const { data: bookings, error: fetchError } = await supabase
      .from('calcom_bookings')
      .select('*')
      .order('start_time', { ascending: true });

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const booking of bookings) {
      // Check if already synced
      const { data: existing } = await supabase
        .from('appointments')
        .select('id')
        .eq('cal_com_booking_id', String(booking.booking_id))
        .single();

      if (existing) {
        skipped++;
        continue;
      }

      // Try to find the patient
      let patientId = null;
      if (booking.attendee_email) {
        const { data: patient } = await supabase
          .from('patients')
          .select('id')
          .eq('email', booking.attendee_email)
          .single();
        if (patient) patientId = patient.id;
      }

      const slug = booking.event_type_slug || '';
      const category = SLUG_TO_CATEGORY[slug] || 'other';
      const duration = booking.start_time && booking.end_time
        ? Math.round((new Date(booking.end_time) - new Date(booking.start_time)) / 60000)
        : 30;

      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          patient_id: patientId,
          patient_name: booking.attendee_name || 'Unknown',
          patient_phone: booking.attendee_phone || null,
          service_name: booking.event_title || booking.event_type_slug || 'Cal.com Booking',
          service_category: category,
          start_time: booking.start_time,
          end_time: booking.end_time,
          duration_minutes: duration,
          status: mapCalcomStatus(booking.status),
          source: 'cal_com',
          cal_com_booking_id: String(booking.booking_id),
          notes: booking.notes || null,
        });

      if (insertError) {
        console.error(`Sync error for booking ${booking.booking_id}:`, insertError);
        errors++;
      } else {
        synced++;
      }
    }

    return res.status(200).json({
      total: bookings.length,
      synced,
      skipped,
      errors,
    });
  } catch (error) {
    console.error('Cal.com sync error:', error);
    return res.status(500).json({ error: error.message });
  }
}
