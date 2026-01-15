// /pages/api/admin/dashboard.js
// Dashboard Stats API
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get active protocols count
    const { count: activeProtocols } = await supabase
      .from('protocols')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get total patients count
    const { count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    // Get unassigned purchases count
    const { count: unassignedPurchases } = await supabase
      .from('purchases')
      .select('*', { count: 'exact', head: true })
      .is('protocol_id', null);

    // Get completed this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { count: completedThisWeek } = await supabase
      .from('protocols')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('updated_at', weekAgo.toISOString());

    return res.status(200).json({
      active_protocols: activeProtocols || 0,
      total_patients: totalPatients || 0,
      unassigned_purchases: unassignedPurchases || 0,
      completed_this_week: completedThisWeek || 0
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
