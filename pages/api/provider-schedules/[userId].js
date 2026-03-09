// /pages/api/provider-schedules/[userId].js
// GET: Fetch schedules for a specific provider
// PATCH: Update a provider's schedule (availability + overrides)
// Range Medical System

import { getUserSchedules, updateSchedule } from '../../../lib/calcom';
import { requireAuth, hasPermission, logAction } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }
  if (req.method === 'PATCH') {
    return handlePatch(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req, res) {
  const employee = await requireAuth(req, res);
  if (!employee) return;

  const { userId } = req.query;

  try {
    const schedules = await getUserSchedules(parseInt(userId));
    if (!schedules) {
      return res.status(500).json({ error: 'Failed to fetch schedules from Cal.com' });
    }
    return res.status(200).json({ success: true, schedules });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function handlePatch(req, res) {
  const employee = await requireAuth(req, res);
  if (!employee) return;

  const { userId } = req.query;
  const userIdInt = parseInt(userId);

  // Permission check: admin/can_manage_schedules can edit anyone,
  // others can only edit their own schedule (matched via calcom_user_id)
  const canManageAll = hasPermission(employee, 'can_manage_schedules');
  const isOwnSchedule = employee.calcom_user_id === userIdInt;

  if (!canManageAll && !isOwnSchedule) {
    return res.status(403).json({ error: 'You can only edit your own schedule' });
  }

  const { scheduleId, availability, overrides, timeZone } = req.body;

  if (!scheduleId) {
    return res.status(400).json({ error: 'scheduleId is required' });
  }

  try {
    const updates = {};
    if (availability !== undefined) updates.availability = availability;
    if (overrides !== undefined) updates.overrides = overrides;
    if (timeZone !== undefined) updates.timeZone = timeZone;

    const result = await updateSchedule(userIdInt, scheduleId, updates);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    // Log the action
    await logAction({
      employeeId: employee.id,
      employeeName: employee.name,
      action: 'update_schedule',
      resourceType: 'provider_schedule',
      resourceId: `${userId}/${scheduleId}`,
      details: {
        calcom_user_id: userIdInt,
        changes: Object.keys(updates),
      },
      req,
    });

    return res.status(200).json({ success: true, schedule: result });

  } catch (error) {
    console.error('Update provider schedule error:', error);
    return res.status(500).json({ error: error.message });
  }
}
