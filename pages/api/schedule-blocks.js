// /pages/api/schedule-blocks.js
// Schedule Blocks API — manage provider schedule blocks with Cal.com sync
// Range Medical System

import { createClient } from '@supabase/supabase-js';
import { getUserSchedules, updateSchedule } from '../../lib/calcom';
import { requireAuth } from '../../lib/auth';
import { todayPacific } from '../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // GET is read-only — no auth required (page is already admin-gated)
  // POST/DELETE require auth below
  if (req.method === 'GET') {
    try {
      const { provider_id, start_date, end_date } = req.query;

      let query = supabase
        .from('schedule_blocks')
        .select('*')
        .order('date', { ascending: true });

      if (provider_id) query = query.eq('provider_id', parseInt(provider_id));
      if (start_date) query = query.gte('date', start_date);
      if (end_date) query = query.lte('date', end_date);

      const { data: blocks, error } = await query;
      if (error) throw error;

      return res.status(200).json({ success: true, blocks: blocks || [] });
    } catch (err) {
      console.error('GET schedule-blocks error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Auth required for write operations
  const employee = await requireAuth(req, res);
  if (!employee) return;

  // ── POST: Create block(s) ──
  if (req.method === 'POST') {
    try {
      const {
        provider_id,
        provider_name,
        block_type = 'full_day',
        dates,          // array of date strings for bulk
        date,           // single date (if not bulk)
        start_time,
        end_time,
        reason,
        reason_note,
        schedule_id,    // Cal.com schedule ID for sync
      } = req.body;

      if (!provider_id || !provider_name) {
        return res.status(400).json({ error: 'provider_id and provider_name are required' });
      }

      const blockDates = dates || (date ? [date] : []);
      if (blockDates.length === 0) {
        return res.status(400).json({ error: 'At least one date is required' });
      }

      // Insert blocks into Supabase
      const rows = blockDates.map(d => ({
        provider_id: parseInt(provider_id),
        provider_name,
        block_type,
        date: d,
        start_time: block_type === 'time_range' ? start_time : null,
        end_time: block_type === 'time_range' ? end_time : null,
        reason: reason || null,
        reason_note: reason_note || null,
        created_by: employee.name,
      }));

      const { data: inserted, error: insertErr } = await supabase
        .from('schedule_blocks')
        .insert(rows)
        .select();

      if (insertErr) throw insertErr;

      // Sync to Cal.com if schedule_id is provided
      if (schedule_id) {
        try {
          await syncBlocksToCalcom(parseInt(provider_id), schedule_id);
        } catch (syncErr) {
          console.error('Cal.com sync warning (blocks saved to DB):', syncErr.message);
        }
      }

      return res.status(200).json({
        success: true,
        blocks: inserted,
        count: inserted.length,
      });
    } catch (err) {
      console.error('POST schedule-blocks error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── DELETE: Remove block ──
  if (req.method === 'DELETE') {
    try {
      const { block_id, schedule_id } = req.body;

      if (!block_id) {
        return res.status(400).json({ error: 'block_id is required' });
      }

      // Get block before deleting (for Cal.com sync)
      const { data: block } = await supabase
        .from('schedule_blocks')
        .select('*')
        .eq('id', block_id)
        .single();

      const { error: deleteErr } = await supabase
        .from('schedule_blocks')
        .delete()
        .eq('id', block_id);

      if (deleteErr) throw deleteErr;

      // Re-sync to Cal.com after removal
      if (schedule_id && block) {
        try {
          await syncBlocksToCalcom(block.provider_id, schedule_id);
        } catch (syncErr) {
          console.error('Cal.com sync warning (block removed from DB):', syncErr.message);
        }
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('DELETE schedule-blocks error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Sync all schedule_blocks for a provider to Cal.com overrides.
 * Fetches future blocks from DB and builds Cal.com override array.
 * Preserves any existing Cal.com overrides not managed by our blocks.
 */
async function syncBlocksToCalcom(providerId, scheduleId) {
  const today = todayPacific();

  // Get all future blocks for this provider
  const { data: blocks } = await supabase
    .from('schedule_blocks')
    .select('*')
    .eq('provider_id', providerId)
    .gte('date', today)
    .order('date');

  // Get current Cal.com schedule to preserve non-block overrides
  const schedules = await getUserSchedules(providerId);
  const schedule = schedules?.find(s => s.id === scheduleId);
  const existingOverrides = schedule?.overrides || [];

  // Dates managed by our blocks
  const blockDates = new Set((blocks || []).map(b => b.date));

  // Keep non-block overrides (dates NOT in our blocks)
  const preservedOverrides = existingOverrides.filter(o => !blockDates.has(o.date));

  // Convert blocks to Cal.com override format
  const blockOverrides = (blocks || []).map(b => {
    const override = { date: b.date };
    if (b.block_type === 'time_range' && b.start_time && b.end_time) {
      // Time-range block: set the override to block THAT time
      // Cal.com overrides define AVAILABLE hours, so we don't add times = unavailable for that date
      // For a partial block, we'd need to split availability, but Cal.com v2 only supports one override per date
      // So for time-range blocks, we just mark the day as unavailable (simplest approach)
      // Future enhancement: could create split availability windows
    }
    // No startTime/endTime = full day unavailable in Cal.com
    return override;
  });

  // Merge: preserved overrides + block overrides
  const mergedOverrides = [...preservedOverrides, ...blockOverrides];

  // Push to Cal.com
  const result = await updateSchedule(providerId, scheduleId, {
    overrides: mergedOverrides,
  });

  if (result?.error) {
    throw new Error(`Cal.com sync failed: ${result.error}`);
  }

  return result;
}
