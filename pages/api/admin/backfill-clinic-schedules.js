// /pages/api/admin/backfill-clinic-schedules.js
// Populate visit_frequency and scheduled_days for existing in-clinic protocols

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse frequency string to visit_frequency enum
function parseFrequency(frequency) {
  if (!frequency) return null;
  const f = frequency.toLowerCase();

  if (f.includes('2x') || f.includes('twice') || f.includes('2 times')) {
    return '2x_week';
  }
  if (f.includes('weekly') || f.includes('1x') || f.includes('once')) {
    return 'weekly';
  }
  if (f.includes('biweekly') || f.includes('every 2') || f.includes('every other')) {
    return 'biweekly';
  }
  if (f.includes('monthly') || f.includes('month')) {
    return 'monthly';
  }
  return null;
}

// Default scheduled days based on frequency
function getDefaultDays(visitFrequency) {
  switch (visitFrequency) {
    case '2x_week':
      return ['monday', 'thursday'];
    case 'weekly':
      return ['monday'];
    case 'biweekly':
      return ['monday'];
    case 'monthly':
      return ['monday'];
    default:
      return [];
  }
}

// Calculate next expected date
function calculateNextExpectedDate(visitFrequency, scheduledDays) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const scheduledDayNums = (scheduledDays || [])
    .map(d => DAYS_OF_WEEK.indexOf(d.toLowerCase()))
    .filter(n => n !== -1)
    .sort((a, b) => a - b);

  if (scheduledDayNums.length === 0) {
    // Default to 7 days from now
    const next = new Date(today);
    next.setDate(next.getDate() + 7);
    return next.toISOString().split('T')[0];
  }

  // Find next scheduled day
  const currentDayNum = today.getDay();
  let nextDate = new Date(today);

  // Look for next scheduled day within 14 days
  for (let i = 1; i <= 14; i++) {
    nextDate.setDate(today.getDate() + i);
    if (scheduledDayNums.includes(nextDate.getDay())) {
      return nextDate.toISOString().split('T')[0];
    }
  }

  // Fallback
  nextDate = new Date(today);
  nextDate.setDate(nextDate.getDate() + 7);
  return nextDate.toISOString().split('T')[0];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dryRun = true } = req.body;

  try {
    // Get all in-clinic protocols that don't have scheduling set
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select('id, patient_id, frequency, visit_frequency, scheduled_days, program_type, program_name, patients(first_name, last_name, name)')
      .eq('delivery_method', 'in_clinic')
      .eq('status', 'active');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch protocols', details: error.message });
    }

    const updates = [];
    const skipped = [];

    for (const protocol of protocols || []) {
      // Skip if already has scheduling
      if (protocol.visit_frequency && protocol.scheduled_days?.length > 0) {
        skipped.push({
          id: protocol.id,
          patient: protocol.patients?.name || `${protocol.patients?.first_name} ${protocol.patients?.last_name}`,
          reason: 'Already has scheduling'
        });
        continue;
      }

      // Parse frequency to get visit_frequency
      const visitFrequency = protocol.visit_frequency || parseFrequency(protocol.frequency);

      if (!visitFrequency) {
        skipped.push({
          id: protocol.id,
          patient: protocol.patients?.name || `${protocol.patients?.first_name} ${protocol.patients?.last_name}`,
          frequency: protocol.frequency,
          reason: 'Could not parse frequency'
        });
        continue;
      }

      // Get scheduled days
      const scheduledDays = protocol.scheduled_days?.length > 0
        ? protocol.scheduled_days
        : getDefaultDays(visitFrequency);

      // Calculate next expected date
      const nextExpectedDate = calculateNextExpectedDate(visitFrequency, scheduledDays);

      updates.push({
        id: protocol.id,
        patient: protocol.patients?.name || `${protocol.patients?.first_name} ${protocol.patients?.last_name}`,
        program: protocol.program_name || protocol.program_type,
        original_frequency: protocol.frequency,
        visit_frequency: visitFrequency,
        scheduled_days: scheduledDays,
        next_expected_date: nextExpectedDate
      });
    }

    // Apply updates if not dry run
    if (!dryRun && updates.length > 0) {
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('protocols')
          .update({
            visit_frequency: update.visit_frequency,
            scheduled_days: update.scheduled_days,
            next_expected_date: update.next_expected_date
          })
          .eq('id', update.id);

        if (updateError) {
          console.error(`Failed to update protocol ${update.id}:`, updateError);
          update.error = updateError.message;
        } else {
          update.updated = true;
        }
      }
    }

    return res.status(200).json({
      success: true,
      dryRun,
      message: dryRun ? 'Dry run - no changes made' : `Updated ${updates.filter(u => u.updated).length} protocols`,
      totalInClinic: protocols?.length || 0,
      toUpdate: updates.length,
      skipped: skipped.length,
      updates,
      skipped
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
