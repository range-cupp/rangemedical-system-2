// /pages/api/provider-schedules/[userId].js
// GET: Fetch one provider's schedules from local tables (delegates shape to
//      the index endpoint via direct query).
// PATCH: Update a single (employee, location) schedule. Accepts the same
//        Cal.com-shaped payload the existing admin UI sends:
//          { scheduleId, availability?, overrides?, timeZone? }
//        scheduleId is the synthetic `local::<employee_uuid>::<location_id>`
//        produced by the index endpoint. We translate availability into
//        provider_schedules rows and overrides into provider_schedule_overrides
//        rows, replacing the relevant subset atomically per location.

import { createClient } from '@supabase/supabase-js';
import { requireAuth, hasPermission, logAction } from '../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DAY_NUM_BY_NAME = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

function parseScheduleId(scheduleId) {
  if (typeof scheduleId !== 'string' || !scheduleId.startsWith('local::')) {
    return null;
  }
  const [, empId, locId] = scheduleId.split('::');
  if (!empId || !locId) return null;
  return { employeeId: empId, locationId: locId };
}

// Look up an employee by either calcom_user_id (numeric, legacy) or
// employee.id (UUID, post-cutover).
async function resolveEmployee(userId) {
  if (!userId) return null;
  const asInt = parseInt(userId, 10);
  if (!Number.isNaN(asInt) && String(asInt) === String(userId)) {
    const { data } = await supabase
      .from('employees').select('id, name, calcom_user_id')
      .eq('calcom_user_id', asInt).maybeSingle();
    if (data) return data;
  }
  // Fall through to UUID lookup.
  const { data } = await supabase
    .from('employees').select('id, name, calcom_user_id')
    .eq('id', userId).maybeSingle();
  return data || null;
}

function normalizeTime(t) {
  if (!t) return null;
  return /^\d{2}:\d{2}$/.test(t) ? `${t}:00` : t;
}

export default async function handler(req, res) {
  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'PATCH') return handlePatch(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
}

// GET — return the schedules for this provider in the same shape the index
// endpoint uses. Lightweight wrapper that re-runs the same logic for one
// employee. userId may be either a numeric calcom_user_id (legacy) or a
// UUID employee.id (new employees added post-Cal.com cutover).
async function handleGet(req, res) {
  const employee = await requireAuth(req, res);
  if (!employee) return;
  const { userId } = req.query;

  try {
    const emp = await resolveEmployee(userId);
    if (!emp) return res.status(404).json({ error: 'Provider not found' });

    const { data: scheds } = await supabase
      .from('provider_schedules')
      .select('location_id, day_of_week, start_time, end_time')
      .eq('employee_id', emp.id)
      .eq('is_active', true);

    const today = new Date().toISOString().slice(0, 10);
    const { data: overrides } = await supabase
      .from('provider_schedule_overrides')
      .select('location_id, override_date, type, start_time, end_time, reason')
      .eq('employee_id', emp.id)
      .gte('override_date', today);

    const locations = [...new Set((scheds || []).map(s => s.location_id))].filter(id => id !== 'placentia');
    const result = locations.map(locId => {
      const rows = (scheds || []).filter(s => s.location_id === locId);
      const ovs = (overrides || []).filter(o => !o.location_id || o.location_id === locId);
      // Group availability by start/end time.
      const groups = {};
      for (const r of rows) {
        const k = `${r.start_time}-${r.end_time}`;
        if (!groups[k]) groups[k] = { days: [], startTime: String(r.start_time).slice(0,5), endTime: String(r.end_time).slice(0,5) };
        const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][r.day_of_week];
        if (dayName) groups[k].days.push(dayName);
      }
      return {
        id: `local::${emp.id}::${locId}`,
        name: locId === 'newport' ? 'Newport Beach' : locId,
        timeZone: 'America/Los_Angeles',
        availability: Object.values(groups),
        overrides: ovs.map(o => ({
          date: o.override_date,
          startTime: o.type === 'custom_hours' ? String(o.start_time||'').slice(0,5) : null,
          endTime: o.type === 'custom_hours' ? String(o.end_time||'').slice(0,5) : null,
          reason: o.reason || null,
        })),
      };
    });

    return res.status(200).json({ success: true, schedules: result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function handlePatch(req, res) {
  const employee = await requireAuth(req, res);
  if (!employee) return;

  const { userId } = req.query;

  // Resolve the URL userId to an employee row. Accepts either a numeric
  // calcom_user_id (legacy) or a UUID employee.id (post-cutover).
  const targetEmp = await resolveEmployee(userId);
  if (!targetEmp) return res.status(404).json({ error: 'Provider not found' });

  // Permission check: admin/can_manage_schedules can edit anyone, others
  // can only edit their own row.
  const canManageAll = hasPermission(employee, 'can_manage_schedules');
  const isOwnSchedule = employee.id === targetEmp.id;
  if (!canManageAll && !isOwnSchedule) {
    return res.status(403).json({ error: 'You can only edit your own schedule' });
  }

  const { scheduleId, availability, overrides } = req.body;
  if (!scheduleId) {
    return res.status(400).json({ error: 'scheduleId is required' });
  }

  const parsed = parseScheduleId(scheduleId);
  if (!parsed) {
    return res.status(400).json({
      error: 'Invalid scheduleId. Expected format: local::<employee_id>::<location_id>',
    });
  }
  const { employeeId, locationId } = parsed;

  // Sanity check: the URL userId must resolve to the same employee row
  // the scheduleId points at.
  if (employeeId !== targetEmp.id) {
    return res.status(400).json({ error: 'scheduleId does not match the provider in the URL' });
  }
  const emp = targetEmp;

  try {
    // ── Update weekly availability ─────────────────────────────────────
    if (availability !== undefined) {
      // Replace this provider's schedule for this location entirely.
      const { error: delErr } = await supabase
        .from('provider_schedules')
        .delete()
        .eq('employee_id', employeeId)
        .eq('location_id', locationId);
      if (delErr) throw delErr;

      const rows = [];
      for (const block of (availability || [])) {
        const start = normalizeTime(block.startTime);
        const end = normalizeTime(block.endTime);
        if (!start || !end || end <= start) continue;
        for (const dayName of (block.days || [])) {
          const dow = DAY_NUM_BY_NAME[String(dayName).toLowerCase()];
          if (dow === undefined) continue;
          rows.push({
            employee_id: employeeId,
            location_id: locationId,
            day_of_week: dow,
            start_time: start,
            end_time: end,
            is_active: true,
          });
        }
      }

      // Dedupe by logical key in case the UI sent duplicate (day, time) rows.
      const seen = new Set();
      const deduped = rows.filter(r => {
        const k = `${r.day_of_week}|${r.start_time}|${r.end_time}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      if (deduped.length > 0) {
        const { error: insErr } = await supabase
          .from('provider_schedules')
          .insert(deduped);
        if (insErr) throw insErr;
      }
    }

    // ── Update overrides for this location ────────────────────────────
    if (overrides !== undefined) {
      // Replace all overrides scoped to this employee + location.
      // (Overrides with location_id=null are global blocks; we don't touch those.)
      const { error: delOvErr } = await supabase
        .from('provider_schedule_overrides')
        .delete()
        .eq('employee_id', employeeId)
        .eq('location_id', locationId);
      if (delOvErr) throw delOvErr;

      const ovRows = (overrides || []).map(o => {
        const start = normalizeTime(o.startTime);
        const end = normalizeTime(o.endTime);
        const isCustom = !!(start && end && end > start);
        return {
          employee_id: employeeId,
          location_id: locationId,
          override_date: o.date,
          type: isCustom ? 'custom_hours' : 'blocked',
          start_time: isCustom ? start : null,
          end_time: isCustom ? end : null,
          reason: o.reason || null,
          created_by: employee.name,
        };
      }).filter(r => r.override_date);

      if (ovRows.length > 0) {
        const { error: insOvErr } = await supabase
          .from('provider_schedule_overrides')
          .insert(ovRows);
        if (insOvErr) throw insOvErr;
      }
    }

    await logAction({
      employeeId: employee.id,
      employeeName: employee.name,
      action: 'update_schedule',
      resourceType: 'provider_schedule',
      resourceId: `${employeeId}/${locationId}`,
      details: {
        target_employee: emp.name,
        location: locationId,
        wrote_availability: availability !== undefined,
        wrote_overrides: overrides !== undefined,
      },
      req,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Update provider schedule error:', error);
    return res.status(500).json({ error: error.message });
  }
}
