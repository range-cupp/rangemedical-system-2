// /pages/api/admin/dashboard-stats.js
// Dashboard Statistics API
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'range2024admin';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check authorization
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Parallel queries for performance
    const [
      protocolsResult,
      activeProtocolsResult,
      completedProtocolsResult,
      purchasesResult,
      recentPurchasesResult,
      revenueResult,
      recentProtocolsListResult,
      recentPurchasesListResult,
      activeProtocolsListResult
    ] = await Promise.all([
      // Total protocols count
      supabase.from('protocols').select('id', { count: 'exact', head: true }),
      
      // Active protocols count
      supabase.from('protocols').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      
      // Completed protocols count
      supabase.from('protocols').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      
      // Total purchases count
      supabase.from('purchases').select('id', { count: 'exact', head: true }),
      
      // Recent purchases count (30 days)
      supabase.from('purchases').select('id', { count: 'exact', head: true }).gte('purchase_date', thirtyDaysAgoStr),
      
      // Revenue (30 days)
      supabase.from('purchases').select('amount').gte('purchase_date', thirtyDaysAgoStr),
      
      // Recent protocols list (for display)
      supabase
        .from('protocols')
        .select('id, patient_name, program_name, program_type, start_date, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Recent purchases list (for display)
      supabase
        .from('purchases')
        .select('id, patient_name, item_name, category, amount, purchase_date')
        .order('purchase_date', { ascending: false })
        .limit(15),
      
      // Active protocols list (for display) - sorted by end_date ascending (ending soonest first)
      supabase
        .from('protocols')
        .select('id, patient_name, program_name, program_type, start_date, end_date, duration_days, injections_completed, access_token')
        .eq('status', 'active')
        .order('end_date', { ascending: true, nullsFirst: false })
        .limit(20)
    ]);

    // Calculate total revenue
    const totalRevenue = revenueResult.data?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

    // Build response
    const response = {
      stats: {
        totalProtocols: protocolsResult.count || 0,
        activeProtocols: activeProtocolsResult.count || 0,
        completedProtocols: completedProtocolsResult.count || 0,
        totalPurchases: purchasesResult.count || 0,
        recentPurchases: recentPurchasesResult.count || 0,
        totalRevenue: totalRevenue
      },
      recentProtocols: recentProtocolsListResult.data || [],
      recentPurchases: recentPurchasesListResult.data || [],
      activeProtocols: activeProtocolsListResult.data || []
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ error: error.message });
  }
}
