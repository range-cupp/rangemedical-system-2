// /pages/api/admin/dashboard-stats.js
// Dashboard Statistics API
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
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
    // Get date ranges
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

    // Parallel queries for performance
    const [
      // Protocol stats
      protocolsResult,
      activeProtocolsResult,
      completedProtocolsResult,
      
      // Purchase stats (30 days)
      recentPurchasesResult,
      revenueResult,
      
      // Category-specific purchases (30 days)
      hrtPurchasesResult,
      weightLossPurchasesResult,
      ivPurchasesResult,
      injectionPurchasesResult,
      peptidePurchasesResult,
      
      // Lists for display - PEPTIDE protocols (ending soonest)
      activePeptideProtocolsResult,
      
      // Lists for display - WEIGHT LOSS protocols (ending soonest)
      activeWeightLossProtocolsResult,
      
      // Recent purchases list
      recentPurchasesListResult,
      
      // HRT members (unique patients with HRT purchases)
      hrtMembersResult,
      
      // Recent IV sessions
      recentIVResult,
      
      // Recent Injections
      recentInjectionsResult
      
    ] = await Promise.all([
      // Total protocols count
      supabase.from('protocols').select('id', { count: 'exact', head: true }),
      
      // Active protocols count
      supabase.from('protocols').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      
      // Completed protocols count
      supabase.from('protocols').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      
      // Recent purchases count (30 days)
      supabase.from('purchases').select('id', { count: 'exact', head: true }).gte('purchase_date', thirtyDaysAgoStr),
      
      // Revenue (30 days)
      supabase.from('purchases').select('amount').gte('purchase_date', thirtyDaysAgoStr),
      
      // HRT purchases (30 days)
      supabase.from('purchases').select('amount').eq('category', 'HRT').gte('purchase_date', thirtyDaysAgoStr),
      
      // Weight Loss purchases (30 days)
      supabase.from('purchases').select('amount').eq('category', 'Weight Loss').gte('purchase_date', thirtyDaysAgoStr),
      
      // IV Therapy purchases (30 days)
      supabase.from('purchases').select('amount').eq('category', 'IV Therapy').gte('purchase_date', thirtyDaysAgoStr),
      
      // Injection purchases (30 days)
      supabase.from('purchases').select('amount').eq('category', 'Injection').gte('purchase_date', thirtyDaysAgoStr),
      
      // Peptide purchases (30 days)
      supabase.from('purchases').select('amount').eq('category', 'Peptide').gte('purchase_date', thirtyDaysAgoStr),
      
      // PEPTIDE protocols - Active, ending soonest first
      supabase
        .from('protocols')
        .select('id, patient_name, program_name, program_type, start_date, end_date, duration_days, injections_completed, access_token')
        .eq('status', 'active')
        .in('program_type', ['recovery_jumpstart_10day', 'month_program_30day', 'maintenance_4week', 'injection_clinic', 'jumpstart_10day', 'recovery_10day', 'month_30day'])
        .order('end_date', { ascending: true, nullsFirst: false })
        .limit(15),
      
      // WEIGHT LOSS protocols - Active, ending soonest first
      supabase
        .from('protocols')
        .select('id, patient_name, program_name, program_type, start_date, end_date, duration_days, injections_completed, access_token')
        .eq('status', 'active')
        .in('program_type', ['weight_loss_program', 'weight_loss_injection'])
        .order('end_date', { ascending: true, nullsFirst: false })
        .limit(15),
      
      // Recent purchases list
      supabase
        .from('purchases')
        .select('id, patient_name, item_name, category, amount, purchase_date')
        .order('purchase_date', { ascending: false })
        .limit(15),
      
      // HRT unique members (all time)
      supabase
        .from('purchases')
        .select('ghl_contact_id, patient_name, patient_email, patient_phone')
        .eq('category', 'HRT')
        .not('ghl_contact_id', 'is', null),
      
      // Recent IV sessions
      supabase
        .from('purchases')
        .select('id, patient_name, item_name, purchase_date')
        .eq('category', 'IV Therapy')
        .order('purchase_date', { ascending: false })
        .limit(10),
      
      // Recent Injections
      supabase
        .from('purchases')
        .select('id, patient_name, item_name, purchase_date')
        .eq('category', 'Injection')
        .order('purchase_date', { ascending: false })
        .limit(10)
    ]);

    // Calculate revenues
    const totalRevenue = revenueResult.data?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
    const hrtRevenue = hrtPurchasesResult.data?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
    const weightLossRevenue = weightLossPurchasesResult.data?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
    const ivRevenue = ivPurchasesResult.data?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
    const injectionRevenue = injectionPurchasesResult.data?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
    const peptideRevenue = peptidePurchasesResult.data?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

    // Get unique HRT members
    const hrtMemberMap = new Map();
    (hrtMembersResult.data || []).forEach(p => {
      if (p.ghl_contact_id && !hrtMemberMap.has(p.ghl_contact_id)) {
        hrtMemberMap.set(p.ghl_contact_id, {
          ghl_contact_id: p.ghl_contact_id,
          patient_name: p.patient_name,
          patient_email: p.patient_email,
          patient_phone: p.patient_phone
        });
      }
    });
    const hrtMembers = Array.from(hrtMemberMap.values());

    // Get active protocol counts by category
    const activePeptideProtocolsRaw = activePeptideProtocolsResult.data || [];
    const activeWeightLossProtocolsRaw = activeWeightLossProtocolsResult.data || [];
    
    // Get injection counts for all active protocols
    const allProtocolIds = [
      ...activePeptideProtocolsRaw.map(p => p.id),
      ...activeWeightLossProtocolsRaw.map(p => p.id)
    ];
    
    let injectionCounts = {};
    if (allProtocolIds.length > 0) {
      const { data: logs } = await supabase
        .from('injection_logs')
        .select('protocol_id')
        .in('protocol_id', allProtocolIds);
      
      if (logs) {
        logs.forEach(log => {
          injectionCounts[log.protocol_id] = (injectionCounts[log.protocol_id] || 0) + 1;
        });
      }
    }

    // Enhance peptide protocols with injection data
    const activePeptideProtocols = activePeptideProtocolsRaw.map(protocol => {
      let expectedInjections = protocol.duration_days || 10;
      if (protocol.dose_frequency === 'Every other day') {
        expectedInjections = Math.ceil(expectedInjections / 2);
      } else if (protocol.dose_frequency?.includes('5 days on')) {
        expectedInjections = Math.round(expectedInjections * 5 / 7);
      }
      return {
        ...protocol,
        injections_completed: injectionCounts[protocol.id] || 0,
        expected_injections: expectedInjections
      };
    });

    // Enhance weight loss protocols with injection data
    const activeWeightLossProtocols = activeWeightLossProtocolsRaw.map(protocol => {
      const weeks = Math.ceil((protocol.duration_days || 30) / 7);
      const expectedInjections = protocol.dose_frequency === '2x weekly' ? weeks * 2 : weeks;
      return {
        ...protocol,
        injections_completed: injectionCounts[protocol.id] || 0,
        expected_injections: expectedInjections
      };
    });

    // Build response
    const response = {
      stats: {
        totalProtocols: protocolsResult.count || 0,
        activeProtocols: activeProtocolsResult.count || 0,
        completedProtocols: completedProtocolsResult.count || 0,
        recentPurchases: recentPurchasesResult.count || 0,
        totalRevenue: totalRevenue,
        
        // Category stats
        hrt: {
          members: hrtMembers.length,
          revenue: hrtRevenue,
          purchases: hrtPurchasesResult.data?.length || 0
        },
        weightLoss: {
          activeProtocols: activeWeightLossProtocols.length,
          revenue: weightLossRevenue,
          purchases: weightLossPurchasesResult.data?.length || 0
        },
        ivTherapy: {
          sessions: ivPurchasesResult.data?.length || 0,
          revenue: ivRevenue
        },
        injections: {
          count: injectionPurchasesResult.data?.length || 0,
          revenue: injectionRevenue
        },
        peptides: {
          activeProtocols: activePeptideProtocols.length,
          revenue: peptideRevenue
        }
      },
      
      // Lists - Separate Peptide and Weight Loss protocols
      activePeptideProtocols: activePeptideProtocols,
      activeWeightLossProtocols: activeWeightLossProtocols,
      recentPurchases: recentPurchasesListResult.data || [],
      hrtMembers: hrtMembers.slice(0, 10),
      recentIV: recentIVResult.data || [],
      recentInjections: recentInjectionsResult.data || []
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ error: error.message });
  }
}
