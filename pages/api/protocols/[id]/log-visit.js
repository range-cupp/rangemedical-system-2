// /pages/api/protocols/[id]/log-visit.js
// Log an in-clinic visit for a protocol

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Calculate next expected date based on frequency and scheduled days
function calculateNextExpectedDate(visitFrequency, scheduledDays, fromDate) {
  const from = new Date(fromDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!visitFrequency || scheduledDays?.length === 0) {
    // Default: add 7 days
    const next = new Date(from);
    next.setDate(next.getDate() + 7);
    return next.toISOString().split('T')[0];
  }

  // Convert scheduled days to day numbers (0-6)
  const scheduledDayNums = (scheduledDays || [])
    .map(d => DAYS_OF_WEEK.indexOf(d.toLowerCase()))
    .filter(n => n !== -1)
    .sort((a, b) => a - b);

  if (scheduledDayNums.length === 0) {
    // No valid days, default to weekly
    const next = new Date(from);
    next.setDate(next.getDate() + 7);
    return next.toISOString().split('T')[0];
  }

  const currentDayNum = from.getDay();
  let nextDate = new Date(from);

  switch (visitFrequency) {
    case '2x_week':
    case 'twice_weekly':
      // Find next scheduled day after today
      let found = false;
      for (let i = 0; i < 14 && !found; i++) {
        nextDate.setDate(nextDate.getDate() + 1);
        if (scheduledDayNums.includes(nextDate.getDay())) {
          found = true;
        }
      }
      break;

    case 'weekly':
      // Find next occurrence of the first scheduled day
      nextDate.setDate(nextDate.getDate() + 7);
      // Adjust to the scheduled day
      if (scheduledDayNums.length > 0) {
        const targetDay = scheduledDayNums[0];
        while (nextDate.getDay() !== targetDay) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
      }
      break;

    case 'every_10_days':
    case 'Every 10 days':
      nextDate.setDate(nextDate.getDate() + 10);
      break;

    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;

    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;

    default:
      nextDate.setDate(nextDate.getDate() + 7);
  }

  return nextDate.toISOString().split('T')[0];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: protocolId } = req.query;
  const { visitDate, notes } = req.body;

  if (!protocolId) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  try {
    // Get the protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', protocolId)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const today = visitDate || new Date().toISOString().split('T')[0];

    // Create a session record
    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        protocol_id: protocolId,
        patient_id: protocol.patient_id,
        session_date: today,
        session_number: (protocol.sessions_used || 0) + 1,
        notes: notes || `In-clinic visit logged`
      });

    if (sessionError) {
      console.error('Session insert error:', sessionError);
      // Continue anyway - session tracking is secondary
    }

    // Calculate next expected date
    const nextExpected = calculateNextExpectedDate(
      protocol.visit_frequency,
      protocol.scheduled_days,
      today
    );

    // Update the protocol
    const updates = {
      last_visit_date: today,
      next_expected_date: nextExpected,
      sessions_used: (protocol.sessions_used || 0) + 1
    };

    const { data: updatedProtocol, error: updateError } = await supabase
      .from('protocols')
      .update(updates)
      .eq('id', protocolId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update protocol', details: updateError.message });
    }

    return res.status(200).json({
      success: true,
      protocol: updatedProtocol,
      message: `Visit logged for ${today}. Next expected: ${nextExpected}`
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
