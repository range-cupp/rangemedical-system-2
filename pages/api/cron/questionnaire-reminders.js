// /pages/api/cron/questionnaire-reminders.js
// Daily cron to send questionnaire reminders via GHL SMS
// Range Medical
//
// Sends two types of reminders:
// 1. INTAKE reminder - Day 2 of protocol if intake not completed
// 2. COMPLETION reminder - Last 2 days of protocol if completion not done
//
// Only sends between 9am-6pm PST

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

// Check if current time is within allowed window (9am-6pm PST)
function isWithinAllowedHours() {
  const now = new Date();
  const pstHour = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })).getHours();
  return pstHour >= 9 && pstHour < 18; // 9am to 6pm PST
}

// Send SMS via GHL
async function sendSMS(contactId, message) {
  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    console.log('GHL credentials not configured');
    return false;
  }

  try {
    const response = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15'
      },
      body: JSON.stringify({
        type: 'SMS',
        contactId: contactId,
        message: message
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('GHL SMS error:', err);
      return false;
    }

    return true;
  } catch (error) {
    console.error('SMS send error:', error);
    return false;
  }
}

// Get first name from full name
function getFirstName(fullName) {
  if (!fullName) return 'there';
  return fullName.split(' ')[0];
}

export default async function handler(req, res) {
  // Verify cron secret or allow manual trigger
  const cronSecret = req.headers['x-cron-secret'];
  const isAuthorized = cronSecret === process.env.CRON_SECRET || req.method === 'GET';
  
  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check time window
  if (!isWithinAllowedHours()) {
    return res.status(200).json({ 
      success: true, 
      message: 'Outside allowed hours (9am-6pm PST). No reminders sent.',
      skipped: true
    });
  }

  const results = {
    intakeReminders: [],
    completionReminders: [],
    errors: []
  };

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ============================================
    // 1. INTAKE REMINDERS
    // Find protocols started 1-2 days ago without intake questionnaire
    // ============================================
    
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const oneDayAgo = new Date(today);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Get active TAKE-HOME peptide protocols started 1-2 days ago
    // In-clinic protocols don't get patient reminders - staff handles assessments
    // Only send if reminders are enabled
    const { data: recentProtocols, error: recentError } = await supabase
      .from('protocols')
      .select('id, ghl_contact_id, patient_name, patient_phone, program_name, access_token, start_date, program_type')
      .eq('status', 'active')
      .eq('injection_location', 'take_home')
      .eq('reminders_enabled', true)
      .gte('start_date', twoDaysAgo.toISOString().split('T')[0])
      .lte('start_date', oneDayAgo.toISOString().split('T')[0])
      .in('program_type', ['recovery_jumpstart_10day', 'month_program_30day', 'maintenance_4week', 'jumpstart_10day', 'recovery_10day', 'month_30day', 'weight_loss_program', 'weight_loss_injection'])
      .not('ghl_contact_id', 'is', null);

    if (recentError) {
      results.errors.push(`Recent protocols query error: ${recentError.message}`);
    }

    // Check which ones don't have intake questionnaire
    for (const protocol of (recentProtocols || [])) {
      const { data: intake } = await supabase
        .from('questionnaire_responses')
        .select('id')
        .eq('protocol_id', protocol.id)
        .eq('questionnaire_type', 'intake')
        .single();

      if (!intake && protocol.ghl_contact_id) {
        // No intake - send reminder
        const firstName = getFirstName(protocol.patient_name);
        const trackerUrl = `https://app.range-medical.com/track/${protocol.access_token}`;
        
        const message = `Hi ${firstName}! Quick request from Range Medical - please complete your starting assessment so we can track your recovery progress. Takes 2 min: ${trackerUrl}`;

        const sent = await sendSMS(protocol.ghl_contact_id, message);
        
        results.intakeReminders.push({
          patient: protocol.patient_name,
          protocol: protocol.program_name,
          sent
        });
      }
    }

    // ============================================
    // 2. COMPLETION REMINDERS  
    // Find protocols ending in 0-2 days without completion questionnaire
    // ============================================

    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    // Get active TAKE-HOME peptide protocols ending soon
    // Only send if reminders are enabled
    const { data: endingProtocols, error: endingError } = await supabase
      .from('protocols')
      .select('id, ghl_contact_id, patient_name, patient_phone, program_name, access_token, end_date, program_type')
      .eq('status', 'active')
      .eq('injection_location', 'take_home')
      .eq('reminders_enabled', true)
      .gte('end_date', today.toISOString().split('T')[0])
      .lte('end_date', twoDaysFromNow.toISOString().split('T')[0])
      .in('program_type', ['recovery_jumpstart_10day', 'month_program_30day', 'maintenance_4week', 'jumpstart_10day', 'recovery_10day', 'month_30day', 'weight_loss_program', 'weight_loss_injection'])
      .not('ghl_contact_id', 'is', null);

    if (endingError) {
      results.errors.push(`Ending protocols query error: ${endingError.message}`);
    }

    // Check which ones have intake but not completion
    for (const protocol of (endingProtocols || [])) {
      // Must have intake first
      const { data: intake } = await supabase
        .from('questionnaire_responses')
        .select('id')
        .eq('protocol_id', protocol.id)
        .eq('questionnaire_type', 'intake')
        .single();

      if (!intake) continue; // Skip if no intake

      // Check for completion
      const { data: completion } = await supabase
        .from('questionnaire_responses')
        .select('id')
        .eq('protocol_id', protocol.id)
        .eq('questionnaire_type', 'completion')
        .single();

      if (!completion && protocol.ghl_contact_id) {
        // Has intake but no completion - send reminder
        const firstName = getFirstName(protocol.patient_name);
        const trackerUrl = `https://app.range-medical.com/track/${protocol.access_token}`;
        
        const endDate = new Date(protocol.end_date);
        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        
        let message;
        if (daysLeft <= 0) {
          message = `Hi ${firstName}! Your ${protocol.program_name} is complete. Please take 2 min to share how you're feeling - we'd love to see your progress: ${trackerUrl}`;
        } else {
          message = `Hi ${firstName}! Your protocol ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Please complete your final assessment so we can see your improvement: ${trackerUrl}`;
        }

        const sent = await sendSMS(protocol.ghl_contact_id, message);
        
        results.completionReminders.push({
          patient: protocol.patient_name,
          protocol: protocol.program_name,
          daysLeft,
          sent
        });
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        intakeRemindersSent: results.intakeReminders.filter(r => r.sent).length,
        completionRemindersSent: results.completionReminders.filter(r => r.sent).length
      },
      details: results
    });

  } catch (error) {
    console.error('Questionnaire reminders error:', error);
    return res.status(500).json({ error: error.message, results });
  }
}
