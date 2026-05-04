// /pages/api/schedule-blocks.js
// Schedule Blocks API — manage provider schedule blocks with Cal.com sync
// Range Medical System

import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../../lib/auth';

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

      // Cal.com sync removed — the native slot engine reads from
      // provider_schedules directly. (Future: surface schedule_blocks to
      // the engine via provider_schedule_overrides so blocked days actually
      // suppress availability — see the Cal.com cutover memory.)

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
      const { block_id } = req.body;
      if (!block_id) {
        return res.status(400).json({ error: 'block_id is required' });
      }

      const { error: deleteErr } = await supabase
        .from('schedule_blocks')
        .delete()
        .eq('id', block_id);

      if (deleteErr) throw deleteErr;

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('DELETE schedule-blocks error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
