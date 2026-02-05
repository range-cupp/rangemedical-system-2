// =====================================================
// HRT DAILY REMINDER CRON JOB
// /pages/api/cron/hrt-reminders.js
// Sends IV and lab reminders via GHL
// Range Medical
// =====================================================

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GHL Config
const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-3077d6b0-6f08-4cb6-b74e-be7dd765e91d';
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';

export default async function handler(req, res) {
  // Verify cron secret (optional security)
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('Starting HRT daily reminders...');
  
  try {
    const results = {
      ivReminders: await sendIvReminders(),
      labReminders: await sendLabReminders(),
      timestamp: new Date().toISOString()
    };
    
    console.log('Daily reminders completed:', results);
    return res.status(200).json(results);
  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// =====================================================
// IV REMINDERS - Patients with ≤7 days left
// =====================================================
async function sendIvReminders() {
  try {
    // Get patients needing reminders
    const { data: patients, error } = await supabase.rpc('get_iv_reminder_list', {
      p_days_remaining: 7
    });

    if (error) throw error;

    console.log(`Found ${patients?.length || 0} patients needing IV reminders`);

    const results = {
      total: patients?.length || 0,
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const patient of patients || []) {
      try {
        const isUrgent = patient.days_remaining <= 3;
        
        // Send reminder via GHL
        await sendGHLReminder(patient.ghl_contact_id, {
          type: 'iv_reminder',
          urgent: isUrgent,
          daysRemaining: patient.days_remaining,
          periodLabel: patient.period_label,
          patientName: patient.patient_name
        });

        // Mark reminder as sent
        await supabase
          .from('hrt_monthly_periods')
          .update({
            iv_reminder_sent: true,
            iv_reminder_sent_at: new Date().toISOString()
          })
          .eq('membership_id', patient.membership_id)
          .eq('period_label', patient.period_label);

        results.sent++;
        console.log(`✓ IV reminder sent to ${patient.patient_name}`);
      } catch (err) {
        results.failed++;
        results.errors.push({
          contactId: patient.ghl_contact_id,
          name: patient.patient_name,
          error: err.message
        });
        console.error(`✗ Failed for ${patient.patient_name}:`, err.message);
      }
    }

    return results;
  } catch (error) {
    console.error('Error in sendIvReminders:', error);
    return { error: error.message };
  }
}

// =====================================================
// LAB REMINDERS - Overdue or due within 14 days
// =====================================================
async function sendLabReminders() {
  try {
    const { data: patients, error } = await supabase.rpc('get_lab_due_list');

    if (error) throw error;

    console.log(`Found ${patients?.length || 0} patients needing lab reminders`);

    const results = {
      total: patients?.length || 0,
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const patient of patients || []) {
      try {
        const isOverdue = patient.status === 'OVERDUE';
        
        await sendGHLReminder(patient.ghl_contact_id, {
          type: 'lab_reminder',
          overdue: isOverdue,
          labType: patient.next_lab_type,
          dueDate: patient.next_lab_due,
          daysUntilDue: patient.days_until_due,
          patientName: patient.patient_name
        });

        results.sent++;
        console.log(`✓ Lab reminder sent to ${patient.patient_name} (${isOverdue ? 'OVERDUE' : 'due soon'})`);
      } catch (err) {
        results.failed++;
        results.errors.push({
          contactId: patient.ghl_contact_id,
          name: patient.patient_name,
          error: err.message
        });
        console.error(`✗ Failed for ${patient.patient_name}:`, err.message);
      }
    }

    return results;
  } catch (error) {
    console.error('Error in sendLabReminders:', error);
    return { error: error.message };
  }
}

// =====================================================
// SEND REMINDER VIA GHL
// Option 1: Trigger workflow (recommended)
// Option 2: Send SMS directly
// =====================================================
async function sendGHLReminder(contactId, data) {
  const { type, urgent, overdue } = data;

  // Try to trigger a workflow first
  const workflowId = getWorkflowId(type, { urgent, overdue });
  
  if (workflowId) {
    return await triggerGHLWorkflow(contactId, workflowId, data);
  }

  // Fallback: Send SMS directly
  const message = buildSMSMessage(type, data);
  return await sendGHLSMS(contactId, message);
}

// =====================================================
// TRIGGER GHL WORKFLOW
// =====================================================
async function triggerGHLWorkflow(contactId, workflowId, customData = {}) {
  const response = await fetch(
    `https://services.leadconnectorhq.com/contacts/${contactId}/workflow/${workflowId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventStartTime: new Date().toISOString()
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GHL workflow trigger failed: ${error}`);
  }

  return response.json();
}

// =====================================================
// SEND SMS DIRECTLY VIA GHL
// =====================================================
async function sendGHLSMS(contactId, message) {
  const response = await fetch(
    `https://services.leadconnectorhq.com/conversations/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'SMS',
        contactId,
        message
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GHL SMS failed: ${error}`);
  }

  return response.json();
}

// =====================================================
// GET WORKFLOW ID
// =====================================================
function getWorkflowId(type, { urgent, overdue }) {
  const workflows = {
    iv_reminder: urgent 
      ? process.env.GHL_WORKFLOW_IV_URGENT
      : process.env.GHL_WORKFLOW_IV_REMINDER,
    lab_reminder: overdue
      ? process.env.GHL_WORKFLOW_LAB_OVERDUE
      : process.env.GHL_WORKFLOW_LAB_REMINDER
  };

  return workflows[type];
}

// =====================================================
// BUILD SMS MESSAGE (fallback if no workflow)
// =====================================================
function buildSMSMessage(type, data) {
  const bookingLink = 'https://range-medical.com/range-assessment';

  switch (type) {
    case 'iv_reminder':
      if (data.urgent) {
        return `⚠️ Hi ${data.patientName?.split(' ')[0] || 'there'}! Your Range IV for ${data.periodLabel} expires in ${data.daysRemaining} days. Don't miss this benefit! Book now: ${bookingLink}`;
      }
      return `Hi ${data.patientName?.split(' ')[0] || 'there'}! Reminder: Your Range IV for ${data.periodLabel} is available. ${data.daysRemaining} days left to use it. Book: ${bookingLink}`;

    case 'lab_reminder':
      if (data.overdue) {
        return `🔬 Hi ${data.patientName?.split(' ')[0] || 'there'}! Your HRT labs are overdue. Please schedule your ${data.labType} labs ASAP to keep your hormones optimized. Book: ${bookingLink}`;
      }
      return `Hi ${data.patientName?.split(' ')[0] || 'there'}! Your ${data.labType} HRT labs are coming up${data.daysUntilDue > 0 ? ` in ${data.daysUntilDue} days` : ' soon'}. Schedule: ${bookingLink}`;

    default:
      return '';
  }
}
