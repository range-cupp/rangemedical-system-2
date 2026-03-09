// /pages/api/provider-schedules/index.js
// GET: List all providers with their Cal.com schedules
// Range Medical System

import { getTeamMemberships, getUserSchedules } from '../../../lib/calcom';
import { requireAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const employee = await requireAuth(req, res);
  if (!employee) return;

  try {
    // Get all team members
    const memberships = await getTeamMemberships();
    if (!memberships) {
      return res.status(500).json({ error: 'Failed to fetch team members from Cal.com' });
    }

    // Fetch schedules for each member in parallel
    const providers = await Promise.all(
      memberships.map(async (member) => {
        const schedules = await getUserSchedules(member.userId);
        return {
          userId: member.userId,
          name: member.user?.name || 'Unknown',
          username: member.user?.username || '',
          email: member.user?.email || '',
          role: member.role,
          schedules: schedules || [],
        };
      })
    );

    return res.status(200).json({ success: true, providers });

  } catch (error) {
    console.error('Provider schedules list error:', error);
    return res.status(500).json({ error: error.message });
  }
}
