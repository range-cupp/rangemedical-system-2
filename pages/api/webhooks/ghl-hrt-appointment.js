// =====================================================
// GHL WEBHOOK HANDLER - RANGE IV APPOINTMENTS (FIXED)
// /pages/api/webhooks/ghl-hrt-appointment.js
// Auto-marks IV as used when appointment shows "completed"
// Range Medical
// =====================================================

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Range Medical credentials
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    
    // Log the FULL payload so we can see what GHL sends
    console.log('=== GHL APPOINTMENT WEBHOOK ===');
    console.log('Full payload:', JSON.stringify(payload, null, 2));

    // GHL sends data in different structures - extract what we need
    // Try multiple possible field names
    const appointmentId = payload.id || payload.appointmentId || payload.appointment_id || payload.calendarEventId;
    const contactId = payload.contactId || payload.contact_id || payload.contact?.id;
    const appointmentStatus = payload.appointmentStatus || payload.status || payload.appointment_status || payload.selectedStatus;
    
    // Title can be in many places
    const title = payload.title 
      || payload.appointmentTitle 
      || payload.appointment_title 
      || payload.name 
      || payload.calendarName
      || payload.calendar?.name
      || payload.selectedCalendar
      || payload.calendarId
      || '';

    const startTime = payload.startTime 
      || payload.start_time 
      || payload.appointmentDate 
      || payload.selectedTimezone 
      || payload.selectedSlot
      || new Date().toISOString();

    console.log('Extracted fields:');
    console.log('- appointmentId:', appointmentId);
    console.log('- contactId:', contactId);
    console.log('- title:', title);
    console.log('- status:', appointmentStatus);
    console.log('- startTime:', startTime);

    // If we don't have a contact ID, we can't process
    if (!contactId) {
      console.log('No contact ID found in payload');
      return res.status(200).json({ 
        success: false, 
        message: 'No contact ID in payload',
        payloadKeys: Object.keys(payload)
      });
    }

    // Check if this is a Range IV appointment
    const isRangeIV = isRangeIVAppointment(title, payload);
    
    console.log('Is Range IV:', isRangeIV);

    if (!isRangeIV) {
      console.log(`Not a Range IV appointment. Title: "${title}"`);
      return res.status(200).json({ 
        success: true, 
        message: `Not a Range IV appointment: "${title}"`,
        extractedTitle: title,
        payloadKeys: Object.keys(payload)
      });
    }

    // Log the appointment to database
    await logAppointment({
      appointmentId: appointmentId || 'unknown',
      contactId,
      title,
      appointmentStatus,
      startTime,
      payload
    });

    // Only process if status indicates completion
    const completedStatuses = ['showed', 'completed', 'confirmed', 'show', 'complete'];
    const statusLower = (appointmentStatus || '').toLowerCase();
    
    if (!completedStatuses.some(s => statusLower.includes(s))) {
      console.log(`Status "${appointmentStatus}" is not a completion status`);
      return res.status(200).json({ 
        success: true, 
        message: `Appointment logged, status is "${appointmentStatus}"` 
      });
    }

    // Mark the IV as used
    const result = await markIvUsed(
      contactId,
      appointmentId || `ghl-${Date.now()}`,
      new Date(startTime)
    );

    if (!result.success) {
      console.error('Failed to mark IV as used:', result.error);
      return res.status(200).json({ 
        success: false, 
        error: result.error,
        logged: true 
      });
    }

    console.log(`✓ IV marked as used for contact ${contactId}`);
    
    return res.status(200).json({
      success: true,
      message: 'IV marked as used successfully',
      data: result.data
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(200).json({ 
      success: false, 
      error: error.message 
    });
  }
}

// =====================================================
// HELPER: Check if appointment is a Range IV
// Now checks the ENTIRE payload for "range iv" anywhere
// =====================================================
function isRangeIVAppointment(title, payload) {
  // Convert entire payload to string and search
  const payloadStr = JSON.stringify(payload).toLowerCase();
  
  // Check if "range iv" appears anywhere in the payload
  if (payloadStr.includes('range iv') || payloadStr.includes('rangeiv')) {
    return true;
  }
  
  // Also check title specifically
  const titleLower = (title || '').toLowerCase();
  if (titleLower.includes('range iv') || titleLower.includes('hrt iv')) {
    return true;
  }
  
  // Check common GHL fields that might contain the appointment type
  const fieldsToCheck = [
    payload.title,
    payload.name,
    payload.appointmentTitle,
    payload.calendarName,
    payload.calendar?.name,
    payload.selectedCalendar,
    payload.eventType,
    payload.type
  ];
  
  for (const field of fieldsToCheck) {
    if (field && field.toLowerCase().includes('range iv')) {
      return true;
    }
  }
  
  return false;
}

// =====================================================
// HELPER: Log appointment to database
// =====================================================
async function logAppointment({ appointmentId, contactId, title, appointmentStatus, startTime, payload }) {
  try {
    const { data: existing } = await supabase
      .from('hrt_iv_appointment_log')
      .select('id')
      .eq('ghl_appointment_id', appointmentId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('hrt_iv_appointment_log')
        .update({
          appointment_status: appointmentStatus,
          webhook_payload: payload
        })
        .eq('ghl_appointment_id', appointmentId);
    } else {
      await supabase
        .from('hrt_iv_appointment_log')
        .insert({
          ghl_appointment_id: appointmentId,
          ghl_contact_id: contactId,
          appointment_title: title || 'Unknown',
          appointment_date: startTime,
          appointment_status: appointmentStatus,
          webhook_payload: payload
        });
    }
    console.log('Appointment logged to database');
  } catch (error) {
    console.error('Error logging appointment:', error);
  }
}

// =====================================================
// HELPER: Mark IV as used
// =====================================================
async function markIvUsed(contactId, appointmentId, appointmentDate) {
  try {
    const { data, error } = await supabase.rpc('mark_iv_used', {
      p_contact_id: contactId,
      p_appointment_id: appointmentId,
      p_appointment_date: appointmentDate.toISOString()
    });

    if (error) throw error;

    if (data?.success === false) {
      return { success: false, error: data.error };
    }

    await supabase
      .from('hrt_iv_appointment_log')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        membership_id: data?.membership_id,
        period_id: data?.period_id
      })
      .eq('ghl_appointment_id', appointmentId);

    return { success: true, data };
  } catch (error) {
    console.error('Error in markIvUsed:', error);
    return { success: false, error: error.message };
  }
}
