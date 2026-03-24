// /pages/api/hrt-portal/[token].js
// HRT Patient Portal API — returns protocol data, lab schedule, bookings, IV status
// Supports GET (fetch portal data) and POST (cancel booking)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { getHRTLabSchedule, matchDrawsToLogs } from '../../../lib/hrt-lab-schedule';
import { cancelBooking } from '../../../lib/calcom';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  // Look up protocol by access_token
  const { data: protocol, error: protocolError } = await supabase
    .from('protocols')
    .select('*, patients(id, name, first_name, last_name, email, phone, ghl_contact_id)')
    .eq('access_token', token)
    .maybeSingle();

  if (protocolError || !protocol) {
    return res.status(404).json({ error: 'Protocol not found' });
  }

  const patient = protocol.patients;
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  // ========================================
  // GET — Return all portal data
  // ========================================
  if (req.method === 'GET') {
    try {
      // 1. Calculate lab schedule
      const firstFollowupWeeks = protocol.first_followup_weeks || 8;
      const startDate = protocol.start_date || protocol.onboarding_start_date;
      const labSchedule = getHRTLabSchedule(startDate, firstFollowupWeeks);

      // 2. Match lab completion status
      const { data: bloodDrawLogs } = await supabase
        .from('protocol_logs')
        .select('id, log_date, notes')
        .eq('protocol_id', protocol.id)
        .eq('log_type', 'blood_draw')
        .order('log_date', { ascending: true });

      const { data: labs } = await supabase
        .from('labs')
        .select('id, lab_date, collection_date, completed_date')
        .eq('patient_id', patient.id)
        .order('lab_date', { ascending: false })
        .limit(10);

      const { data: labProtocols } = await supabase
        .from('protocols')
        .select('id, start_date, status')
        .eq('patient_id', patient.id)
        .eq('program_type', 'labs');

      const labScheduleWithStatus = matchDrawsToLogs(
        labSchedule,
        bloodDrawLogs || [],
        labs || [],
        labProtocols || []
      );

      // 3. Fetch upcoming bookings from calcom_bookings
      const today = todayPacific();
      const { data: bookings } = await supabase
        .from('calcom_bookings')
        .select('*')
        .eq('patient_id', patient.id)
        .eq('status', 'accepted')
        .gte('start_time', today)
        .order('start_time', { ascending: true });

      // 4. Check IV usage this month (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      const { data: ivLogs } = await supabase
        .from('service_logs')
        .select('id, service_date')
        .eq('patient_id', patient.id)
        .eq('category', 'iv')
        .gte('service_date', thirtyDaysAgoStr)
        .order('service_date', { ascending: false })
        .limit(1);

      const ivUsedThisMonth = ivLogs && ivLogs.length > 0;
      const ivLastDate = ivUsedThisMonth ? ivLogs[0].service_date : null;

      // 5. Get onboarding progress
      const { data: onboardingLogs } = await supabase
        .from('protocol_logs')
        .select('id, notes, log_date')
        .eq('protocol_id', protocol.id)
        .eq('log_type', 'hrt_onboarding')
        .order('log_date', { ascending: true });

      return res.status(200).json({
        patient: {
          firstName: patient.first_name || (patient.name ? patient.name.split(' ')[0] : 'there'),
          name: patient.name,
          email: patient.email,
          phone: patient.phone
        },
        protocol: {
          id: protocol.id,
          medication: protocol.medication || protocol.program_name,
          dose: protocol.dose || protocol.selected_dose || protocol.dose_per_injection,
          frequency: protocol.frequency,
          scheduledDays: protocol.scheduled_days,
          deliveryMethod: protocol.delivery_method,
          injectionMethod: protocol.injection_method,
          supplyType: protocol.supply_type,
          startDate: protocol.start_date,
          onboardingStartDate: protocol.onboarding_start_date,
          status: protocol.status
        },
        labSchedule: labScheduleWithStatus,
        bookings: (bookings || []).map(b => ({
          id: b.id,
          uid: b.booking_uid,
          title: b.title || b.event_type_name,
          startTime: b.start_time,
          endTime: b.end_time,
          provider: b.provider_name,
          status: b.status
        })),
        ivStatus: {
          usedThisMonth: ivUsedThisMonth,
          lastDate: ivLastDate,
          nextEligible: ivUsedThisMonth
            ? new Date(new Date(ivLastDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : null
        },
        onboardingSteps: (onboardingLogs || []).map(l => ({
          notes: l.notes,
          date: l.log_date
        }))
      });

    } catch (error) {
      console.error('HRT portal GET error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // ========================================
  // POST — Cancel booking
  // ========================================
  if (req.method === 'POST') {
    const { action, bookingUid } = req.body;

    if (action === 'cancel_booking') {
      if (!bookingUid) {
        return res.status(400).json({ error: 'Booking UID required' });
      }

      try {
        // Verify this booking belongs to this patient
        const { data: booking } = await supabase
          .from('calcom_bookings')
          .select('id, patient_id')
          .eq('booking_uid', bookingUid)
          .maybeSingle();

        if (!booking || booking.patient_id !== patient.id) {
          return res.status(403).json({ error: 'Booking not found or access denied' });
        }

        // Cancel via Cal.com API
        const result = await cancelBooking(bookingUid);

        if (result.error) {
          return res.status(500).json({ error: 'Failed to cancel booking' });
        }

        // Update local record
        await supabase
          .from('calcom_bookings')
          .update({ status: 'cancelled' })
          .eq('booking_uid', bookingUid);

        return res.status(200).json({ success: true, message: 'Booking cancelled' });

      } catch (error) {
        console.error('HRT portal cancel booking error:', error);
        return res.status(500).json({ error: 'Server error' });
      }
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
