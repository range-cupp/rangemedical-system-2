// =====================================================
// GHL WEBHOOK HANDLER - RANGE IV APPOINTMENTS
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
    
    console.log('GHL HRT Appointment Webhook received:', JSON.stringify(payload, null, 2));

    // Extract appointment data from GHL webhook
    const {
      id: appointmentId,
      contactId,
      title,
      appointmentStatus,
      startTime,
      contact
    } = payload;

    // Check if this is a Range IV appointment
    const isRangeIV = isRangeIVAppointment(title, payload);
    
    if (!isRangeIV) {
      console.log(`Not a Range IV appointment: "${title}"`);
      return res.status(200).json({ 
        success: true, 
        message: 'Not a Range IV appointment, skipping' 
      });
    }

    // Log the appointment
    await logAppointment({
      appointmentId,
      contactId,
      title,
      appointmentStatus,
      startTime,
      payload
    });

    // Only process if status is 'showed' or 'completed'
    const completedStatuses = ['showed', 'completed', 'confirmed'];
    
    if (!completedStatuses.includes(appointmentStatus?.toLowerCase())) {
      console.log(`Range IV appointment status: ${appointmentStatus} - not marking as used yet`);
      return res.status(200).json({ 
        success: true, 
        message: `Appointment logged, status is ${appointmentStatus}` 
      });
    }

    // Mark the IV as used
    const result = await markIvUsed(
      contactId,
      appointmentId,
      new Date(startTime)
    );

    if (!result.success) {
      console.error('Failed to mark IV as used:', result.error);
      // Still return 200 to prevent webhook retries
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
    // Return 200 to prevent retries, but log the error
    return res.status(200).json({ 
      success: false, 
      error: error.message 
    });
  }
}

// =====================================================
// HELPER: Check if appointment is a Range IV
// =====================================================
function isRangeIVAppointment(title, payload) {
  const titleLower = (title || '').toLowerCase();
  
  // Check appointment title for "Range IV"
  if (titleLower.includes('range iv')) {
    return true;
  }
  
  // Check for variations
  const ivKeywords = ['range iv', 'rangeiv', 'hrt iv'];
  for (const keyword of ivKeywords) {
    if (titleLower.includes(keyword)) {
      return true;
    }
  }
  
  // Check calendar name if available
  const calendarName = payload.calendar?.name?.toLowerCase() || '';
  if (calendarName.includes('range iv')) {
    return true;
  }
  
  return false;
}

// =====================================================
// HELPER: Log appointment to database
// =====================================================
async function logAppointment({ appointmentId, contactId, title, appointmentStatus, startTime, payload }) {
  try {
    // Check if we already logged this appointment
    const { data: existing } = await supabase
      .from('hrt_iv_appointment_log')
      .select('id')
      .eq('ghl_appointment_id', appointmentId)
      .single();

    if (existing) {
      // Update existing log
      await supabase
        .from('hrt_iv_appointment_log')
        .update({
          appointment_status: appointmentStatus,
          webhook_payload: payload
        })
        .eq('ghl_appointment_id', appointmentId);
    } else {
      // Insert new log
      await supabase
        .from('hrt_iv_appointment_log')
        .insert({
          ghl_appointment_id: appointmentId,
          ghl_contact_id: contactId,
          appointment_title: title,
          appointment_date: startTime,
          appointment_status: appointmentStatus,
          webhook_payload: payload
        });
    }
  } catch (error) {
    console.error('Error logging appointment:', error);
    // Don't throw - logging failure shouldn't stop processing
  }
}

// =====================================================
// HELPER: Mark IV as used
// =====================================================
async function markIvUsed(contactId, appointmentId, appointmentDate) {
  try {
    // Call the database function
    const { data, error } = await supabase.rpc('mark_iv_used', {
      p_contact_id: contactId,
      p_appointment_id: appointmentId,
      p_appointment_date: appointmentDate.toISOString()
    });

    if (error) throw error;

    // Update the log entry
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
