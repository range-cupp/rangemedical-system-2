// /pages/api/cron/injection-reminders.js
// Daily 9am reminder for patients to complete their injection
// Triggered by Vercel Cron or external scheduler

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-3077d6b0-6f08-4cb6-b74e-be7dd765e91d';
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://rangemedical-system-2.vercel.app';

export default async function handler(req, res) {
  // Verify cron secret (optional security)
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    // Allow without secret for testing, but log warning
    console.warn('Cron secret not provided or invalid');
  }

  console.log('Starting injection reminder job...');

  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Get active protocols where today is within the protocol dates AND reminders enabled
    const { data: activeProtocols, error: protocolError } = await supabase
      .from('protocols')
      .select('*')
      .eq('status', 'active')
      .eq('reminders_enabled', true)
      .lte('start_date', today)
      .gte('end_date', today);

    if (protocolError) {
      console.error('Error fetching protocols:', protocolError);
      return res.status(500).json({ error: 'Database error' });
    }

    console.log(`Found ${activeProtocols?.length || 0} active protocols for today`);

    if (!activeProtocols || activeProtocols.length === 0) {
      return res.status(200).json({ 
        message: 'No active protocols today',
        sent: 0 
      });
    }

    // 2. For each protocol, check if they've logged today's injection
    const remindersToSend = [];

    for (const protocol of activeProtocols) {
      // Calculate which day number today is
      const startDate = new Date(protocol.start_date);
      const todayDate = new Date(today);
      const dayNumber = Math.floor((todayDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      // Skip if day number is out of range
      if (dayNumber < 1 || dayNumber > protocol.duration_days) {
        continue;
      }

      // Check if already logged today
      const { data: todayLog } = await supabase
        .from('injection_logs')
        .select('id')
        .eq('protocol_id', protocol.id)
        .eq('day_number', dayNumber)
        .single();

      if (todayLog) {
        // Already logged, skip
        console.log(`${protocol.patient_name} already logged Day ${dayNumber}`);
        continue;
      }

      // Need to send reminder
      remindersToSend.push({
        protocol,
        dayNumber
      });
    }

    console.log(`${remindersToSend.length} patients need reminders`);

    // 3. Send reminders via GHL
    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
      details: []
    };

    for (const { protocol, dayNumber } of remindersToSend) {
      // Skip if no GHL contact ID or phone
      if (!protocol.ghl_contact_id) {
        console.log(`Skipping ${protocol.patient_name} - no GHL contact ID`);
        results.skipped++;
        continue;
      }

      // Build tracker link
      const trackerLink = `${BASE_URL}/track/${protocol.access_token}`;

      // Build personalized message
      const firstName = protocol.patient_name?.split(' ')[0] || 'there';
      const message = buildReminderMessage(firstName, dayNumber, protocol.duration_days, trackerLink);

      // Send via GHL
      const sent = await sendGHLMessage(protocol.ghl_contact_id, message);

      if (sent) {
        results.sent++;
        results.details.push({
          name: protocol.patient_name,
          day: dayNumber,
          status: 'sent'
        });
        console.log(`✓ Sent reminder to ${protocol.patient_name} (Day ${dayNumber})`);
      } else {
        results.failed++;
        results.details.push({
          name: protocol.patient_name,
          day: dayNumber,
          status: 'failed'
        });
        console.log(`✗ Failed to send to ${protocol.patient_name}`);
      }

      // Small delay to avoid rate limiting
      await sleep(200);
    }

    console.log(`Reminder job complete: ${results.sent} sent, ${results.failed} failed, ${results.skipped} skipped`);

    return res.status(200).json({
      message: 'Reminder job complete',
      ...results
    });

  } catch (error) {
    console.error('Reminder job error:', error);
    return res.status(500).json({ error: error.message });
  }
}


// Build the reminder message
function buildReminderMessage(firstName, dayNumber, totalDays, trackerLink) {
  // Vary the message slightly based on progress
  const progress = dayNumber / totalDays;

  if (dayNumber === 1) {
    return `Hey ${firstName}! Quick reminder — did you do your Day 1 injection today? Tap to log it:\n${trackerLink}`;
  }
  
  if (dayNumber === totalDays) {
    return `Hey ${firstName}! It's your LAST DAY! Did you do your final injection? Finish strong:\n${trackerLink}`;
  }
  
  if (progress >= 0.75) {
    return `Hey ${firstName}! Day ${dayNumber} of ${totalDays} — almost done! Did you get your injection in today?\n${trackerLink}`;
  }
  
  if (progress >= 0.5) {
    return `Hey ${firstName}! Day ${dayNumber} of ${totalDays} — over halfway! Don't forget to log today's injection:\n${trackerLink}`;
  }

  // Default message
  return `Hey ${firstName}! Quick reminder — Day ${dayNumber} injection done? Tap to log it:\n${trackerLink}`;
}


// Send SMS via GHL API
async function sendGHLMessage(contactId, message) {
  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/conversations/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify({
          type: 'SMS',
          contactId: contactId,
          message: message
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL API error:', errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('GHL send error:', error);
    return false;
  }
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
