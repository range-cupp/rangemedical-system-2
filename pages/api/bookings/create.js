// /pages/api/bookings/create.js
// Backwards-compatible booking endpoint. The legacy callers (BookingTab,
// older patient flows) still POST here with the Cal.com-shaped payload
// (eventTypeId, start, etc.) — we translate to the native scheduling
// engine and use the shared createAppointment helper. Cal.com itself is
// no longer in the loop.

import { createClient } from '@supabase/supabase-js';
import { createAppointment, CreateAppointmentError } from '../../../lib/create-appointment';
import { pickProviderForSlot, getServiceProviders } from '../../../lib/scheduling';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    eventTypeId,
    serviceSlug: rawSlug,
    start,
    patientId,
    patientName,
    patientEmail,
    patientPhone,
    serviceName,
    durationMinutes,
    notes,
    hostUserId,
    hostName,
  } = req.body;

  if (!start || !patientId || !patientName) {
    return res.status(400).json({ error: 'start, patientId, and patientName are required' });
  }
  if (!eventTypeId && !rawSlug) {
    return res.status(400).json({ error: 'eventTypeId or serviceSlug is required' });
  }

  try {
    // Resolve service from slug (preferred) or legacy event type id.
    let serviceSlug = rawSlug;
    let svc = null;
    if (serviceSlug) {
      const { data } = await supabase
        .from('services')
        .select('slug, name, category, duration_minutes')
        .eq('slug', serviceSlug)
        .maybeSingle();
      svc = data;
    } else {
      const { data } = await supabase
        .from('services')
        .select('slug, name, category, duration_minutes')
        .eq('legacy_calcom_event_type_id', parseInt(eventTypeId, 10))
        .maybeSingle();
      svc = data;
      if (svc) serviceSlug = svc.slug;
    }
    if (!svc) {
      return res.status(404).json({
        error: `Service not found for ${serviceSlug ? `slug=${serviceSlug}` : `eventTypeId=${eventTypeId}`}`,
      });
    }

    // Provider: if a specific host was requested, find the matching one;
    // otherwise round-robin via the engine.
    let providerName = hostName || null;
    if (hostUserId && !providerName) {
      const providers = await getServiceProviders(serviceSlug);
      // Bridge hostUserId (cal.com numeric id) → friendly name via employees
      const { data: emp } = await supabase
        .from('employees')
        .select('id, name')
        .eq('calcom_user_id', parseInt(hostUserId, 10))
        .maybeSingle();
      if (emp) {
        const match = providers.find(p => p.employeeId === emp.id);
        providerName = match?.displayLabel || emp.name;
      }
    }
    if (!providerName) {
      const picked = await pickProviderForSlot({ serviceSlug, startISO: start });
      if (!picked) {
        return res.status(409).json({
          error: 'This time slot is no longer available — all providers are booked. Please select a different time.',
          slotUnavailable: true,
        });
      }
      providerName = picked.displayLabel || picked.name;
    }

    const duration = durationMinutes || svc.duration_minutes || 30;
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + duration * 60000);

    const result = await createAppointment({
      patient_id: patientId,
      patient_name: patientName,
      patient_phone: patientPhone || null,
      service_name: serviceName || svc.name,
      service_category: svc.category,
      service_slug: serviceSlug,
      provider: providerName,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      duration_minutes: duration,
      notes: notes || null,
      visit_reason: notes?.trim() || serviceName || svc.name,
      source: 'staff',
      created_by: 'BookingTab',
      send_notification: true,
    });

    return res.status(200).json({
      success: true,
      booking: { id: result.appointment.id, uid: result.appointment.id },
      // Back-compat shape — old callers read calBookingData.calcom?.id.
      calcom: { id: result.appointment.id, uid: result.appointment.id },
    });
  } catch (e) {
    if (e instanceof CreateAppointmentError) {
      return res.status(e.statusCode).json({ error: e.message });
    }
    console.error('Bookings/create error:', e);
    return res.status(500).json({ error: 'Server error', details: e.message });
  }
}
