// /pages/api/webhooks/ghl-appointment.js
// Webhook to receive and store GHL appointments
// Range Medical
// This handles appointment create/update/delete from GHL

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📅 GHL Appointment webhook received:', new Date().toISOString());
  console.log('📦 Payload:', JSON.stringify(req.body, null, 2));

  try {
    const payload = req.body;

    // Extract appointment data - GHL sends various formats
    const appointment = payload.appointment || payload;

    const appointmentId = appointment.id || payload.appointmentId || payload.id;
    const contactId = appointment.contactId || appointment.contact_id || payload.contactId;
    const calendarId = appointment.calendarId || appointment.calendar_id || payload.calendarId;
    const calendarName = appointment.calendarName || appointment.calendar?.name || payload.calendarName || 'Appointment';
    const title = appointment.title || appointment.name || calendarName;
    const status = (appointment.status || appointment.appointmentStatus || payload.status || 'scheduled').toLowerCase();
    const startTime = appointment.startTime || appointment.start_time || appointment.selectedTimezone?.startTime;
    const endTime = appointment.endTime || appointment.end_time || appointment.selectedTimezone?.endTime;
    const notes = appointment.notes || '';

    // Get appointment date from startTime
    const appointmentDate = startTime ? startTime.split('T')[0] : new Date().toISOString().split('T')[0];

    // Contact name
    const contactName = appointment.contact?.name ||
      appointment.contactName ||
      `${appointment.contact?.firstName || ''} ${appointment.contact?.lastName || ''}`.trim() ||
      payload.full_name ||
      'Unknown';

    console.log('📋 Extracted:', {
      appointmentId,
      contactId,
      calendarId,
      calendarName,
      title,
      status,
      appointmentDate,
      contactName
    });

    if (!appointmentId) {
      console.log('⚠️ No appointment ID in payload');
      return res.status(200).json({ success: false, message: 'No appointment ID' });
    }

    // Find patient by GHL contact ID
    let patientId = null;
    if (contactId) {
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('ghl_contact_id', contactId)
        .single();

      if (patient) {
        patientId = patient.id;
      }
    }

    // Check if appointment already exists
    const { data: existing } = await supabase
      .from('clinic_appointments')
      .select('id')
      .eq('ghl_appointment_id', appointmentId)
      .single();

    const appointmentData = {
      ghl_appointment_id: appointmentId,
      ghl_contact_id: contactId,
      patient_id: patientId,
      calendar_id: calendarId,
      calendar_name: calendarName,
      appointment_title: title,
      appointment_date: appointmentDate,
      start_time: startTime,
      end_time: endTime,
      status: status,
      notes: notes,
      updated_at: new Date().toISOString()
    };

    let result;
    if (existing) {
      // Update existing appointment
      const { data, error } = await supabase
        .from('clinic_appointments')
        .update(appointmentData)
        .eq('ghl_appointment_id', appointmentId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating appointment:', error);
        return res.status(200).json({ success: false, error: error.message });
      }
      result = { action: 'updated', appointment: data };
      console.log('✅ Appointment updated:', appointmentId);
    } else {
      // Insert new appointment
      const { data, error } = await supabase
        .from('clinic_appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error inserting appointment:', error);
        return res.status(200).json({ success: false, error: error.message });
      }
      result = { action: 'created', appointment: data };
      console.log('✅ Appointment created:', appointmentId);
    }

    return res.status(200).json({
      success: true,
      ...result,
      patientLinked: !!patientId
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(200).json({ success: false, error: error.message });
  }
}
