// /pages/api/admin/batch-sync-appointments.js
// Batch sync appointments for a date range
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { startDate, endDate, days } = req.body;

  // Calculate date range
  let dates = [];
  if (startDate && endDate) {
    // Use provided range
    let current = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
  } else if (days) {
    // Sync past N days and next N days from today
    const today = new Date();
    for (let i = -Math.abs(days); i <= Math.abs(days); i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
  } else {
    return res.status(400).json({
      error: 'Provide either startDate/endDate or days parameter',
      examples: {
        dateRange: { startDate: '2026-01-01', endDate: '2026-01-31' },
        daysAroundToday: { days: 7 }
      }
    });
  }

  // Limit to 60 days max
  if (dates.length > 60) {
    dates = dates.slice(0, 60);
  }

  const results = {
    datesProcessed: dates.length,
    totalSynced: 0,
    byDate: {}
  };

  // Process each date
  for (const date of dates) {
    try {
      // Call the sync endpoint internally
      const syncUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com'}/api/admin/sync-ghl-appointments`;
      const syncRes = await fetch(syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date })
      });

      if (syncRes.ok) {
        const data = await syncRes.json();
        results.byDate[date] = data.synced || 0;
        results.totalSynced += data.synced || 0;
      } else {
        results.byDate[date] = 'error';
      }
    } catch (e) {
      results.byDate[date] = 'error';
    }
  }

  return res.status(200).json({
    success: true,
    ...results
  });
}
