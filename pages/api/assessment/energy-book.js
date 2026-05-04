// /pages/api/assessment/energy-book.js
// Books the energy/optimization blood draw via the native scheduling engine.
// Cal.com is no longer in the loop.

import { createClient } from '@supabase/supabase-js';
import { createAppointment } from '../../../lib/create-appointment';
import { pickProviderForSlot } from '../../../lib/scheduling';
import { sendSMS } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId, eventTypeId, start, patientName, patientEmail, patientPhone, panelType } = req.body;

    if (!leadId || !start || !patientName || !patientEmail) {
      return res.status(400).json({ error: 'leadId, start, patientName, and patientEmail are required' });
    }

    const panelLabel = panelType === 'elite' ? 'Elite Lab Panel' : 'Essential Lab Panel';

    const { data: lead, error: leadError } = await supabase
      .from('assessment_leads')
      .select('payment_status')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ error: 'Assessment lead not found' });
    }
    if (lead.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment must be completed before booking' });
    }

    let serviceSlug = 'new-patient-blood-draw';
    if (eventTypeId) {
      const { data: svc } = await supabase
        .from('services')
        .select('slug')
        .eq('legacy_calcom_event_type_id', parseInt(eventTypeId, 10))
        .maybeSingle();
      if (svc?.slug) serviceSlug = svc.slug;
    }

    const provider = await pickProviderForSlot({ serviceSlug, startISO: start });
    if (!provider) {
      return res.status(409).json({
        error: 'No provider available at that time. Please pick another slot or call (949) 997-3988.',
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + 30 * 60000);
    const bookingTime = startDate.toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles',
    });

    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('email', patientEmail.toLowerCase().trim())
      .maybeSingle();
    const patientId = existingPatient?.id || null;

    const result = await createAppointment({
      patient_id: patientId,
      patient_name: patientName,
      patient_phone: patientPhone || null,
      service_name: `Blood Draw — ${panelLabel}`,
      service_category: 'labs',
      service_slug: serviceSlug,
      provider: provider.displayLabel || provider.name,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      duration_minutes: 30,
      notes: `Blood Draw — ${panelLabel}`,
      visit_reason: `Blood Draw — ${panelLabel} (energy assessment)`,
      source: 'patient',
      created_by: 'website-energy-assessment',
      send_notification: true,
    });

    console.log(`Energy assessment booking created: appointment=${result.appointment.id} for lead ${leadId}`);

    await supabase
      .from('assessment_leads')
      .update({
        calcom_booking_uid: result.appointment.id,
        booking_start_time: startDate.toISOString(),
      })
      .eq('id', leadId);

    // Tara task
    try {
      const { data: staffMembers } = await supabase
        .from('employees')
        .select('id, email')
        .eq('email', 'tara@range-medical.com')
        .eq('is_active', true);

      if (staffMembers && staffMembers.length > 0) {
        const taskTitle = `New Lab Booking: ${patientName} (${panelLabel})`;
        const taskDescription = `${patientName} booked a ${panelLabel} via the website.\nEmail: ${patientEmail}\nPhone: ${patientPhone || 'N/A'}\nAppointment: ${bookingTime} PT`;

        for (const staff of staffMembers) {
          await supabase.from('tasks').insert({
            title: taskTitle,
            description: taskDescription,
            assigned_to: staff.id,
            assigned_by: staff.id,
            patient_id: patientId,
            patient_name: patientName,
            priority: 'high',
            status: 'pending',
          });
        }
      }
    } catch (taskErr) {
      console.error('Task creation error for energy booking:', taskErr);
    }

    // Chris SMS
    try {
      const chrisMessage = `New online booking! ${patientName} just booked a ${panelLabel} via the website. Appointment: ${bookingTime} PT.`;
      const chrisResult = await sendSMS({ to: '+19496900339', message: chrisMessage });
      if (chrisResult.success) {
        await logComm({
          channel: 'sms',
          messageType: 'admin_booking_notification',
          message: chrisMessage,
          source: 'energy-book',
          recipient: '+19496900339',
          twilioMessageSid: chrisResult.messageSid,
          direction: 'outbound',
          provider: chrisResult.provider || null,
        });
      }
    } catch (notifyErr) {
      console.error('Admin notification error:', notifyErr);
    }

    return res.status(200).json({
      success: true,
      booking: { uid: result.appointment.id, start: startDate.toISOString() },
    });
  } catch (error) {
    console.error('Energy assessment booking error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
