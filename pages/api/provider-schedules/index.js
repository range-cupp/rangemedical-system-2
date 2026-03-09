// /pages/api/provider-schedules/index.js
// GET: List all providers with their Cal.com schedules
// Cross-references with employees table for accurate names
// Range Medical System

import { createClient } from '@supabase/supabase-js';
import { getTeamMemberships, getUserSchedules } from '../../../lib/calcom';
import { requireAuth } from '../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const employee = await requireAuth(req, res);
  if (!employee) return;

  try {
    // Get all team members from Cal.com
    const memberships = await getTeamMemberships();
    if (!memberships) {
      return res.status(500).json({ error: 'Failed to fetch team members from Cal.com' });
    }

    // Get employee records to cross-reference names by calcom_user_id
    const { data: employees } = await supabase
      .from('employees')
      .select('name, email, title, calcom_user_id')
      .eq('is_active', true)
      .not('calcom_user_id', 'is', null);

    // Build a lookup map: calcom_user_id → employee record
    const employeeByCalcomId = {};
    if (employees) {
      for (const emp of employees) {
        if (emp.calcom_user_id) {
          employeeByCalcomId[emp.calcom_user_id] = emp;
        }
      }
    }

    // Fetch schedules for each member in parallel
    const providers = await Promise.all(
      memberships.map(async (member) => {
        const schedules = await getUserSchedules(member.userId);
        // Sort schedules: default first, then by name
        const sorted = (schedules || []).sort((a, b) => {
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;
          return (a.name || '').localeCompare(b.name || '');
        });

        // Use employee table name if Cal.com name is missing
        const emp = employeeByCalcomId[member.userId];
        const name = member.user?.name || emp?.name || 'Unknown';
        const email = member.user?.email || emp?.email || '';

        return {
          userId: member.userId,
          name,
          username: member.user?.username || '',
          email,
          role: member.role,
          title: emp?.title || '',
          schedules: sorted,
        };
      })
    );

    return res.status(200).json({ success: true, providers });

  } catch (error) {
    console.error('Provider schedules list error:', error);
    return res.status(500).json({ error: error.message });
  }
}
