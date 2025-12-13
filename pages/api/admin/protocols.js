// /pages/api/admin/protocols.js
// API route for protocol dashboard data

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Simple auth check
  const authHeader = req.headers.authorization;
  const adminPassword = process.env.ADMIN_PASSWORD || 'range2024';
  
  if (authHeader !== `Bearer ${adminPassword}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { view, search, contactId } = req.query;

  try {
    let data, error;

    switch (view) {
      case 'contact':
        // Protocols for a specific contact
        if (!contactId) {
          return res.status(400).json({ error: 'Contact ID required' });
        }
        ({ data, error } = await supabase
          .from('protocols')
          .select('*')
          .eq('ghl_contact_id', contactId)
          .order('created_at', { ascending: false }));
        break;

      case 'active':
        // Active protocols with days remaining
        ({ data, error } = await supabase
          .from('protocols')
          .select('*')
          .eq('status', 'active')
          .order('end_date', { ascending: true }));
        break;

      case 'ending-soon':
        // Protocols ending in next 7 days
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        ({ data, error } = await supabase
          .from('protocols')
          .select('*')
          .eq('status', 'active')
          .lte('end_date', nextWeek.toISOString().split('T')[0])
          .gte('end_date', new Date().toISOString().split('T')[0])
          .order('end_date', { ascending: true }));
        break;

      case 'refill':
        // Ready for refill
        ({ data, error } = await supabase
          .from('protocols')
          .select('*')
          .eq('status', 'ready_refill')
          .order('end_date', { ascending: false }));
        break;

      case 'completed':
        // Completed protocols
        ({ data, error } = await supabase
          .from('protocols')
          .select('*')
          .eq('status', 'completed')
          .order('end_date', { ascending: false })
          .limit(50));
        break;

      case 'search':
        // Search by patient name or email
        if (!search) {
          return res.status(400).json({ error: 'Search query required' });
        }
        ({ data, error } = await supabase
          .from('protocols')
          .select('*')
          .or(`patient_name.ilike.%${search}%,patient_email.ilike.%${search}%`)
          .order('created_at', { ascending: false })
          .limit(50));
        break;

      case 'stats':
        // Dashboard stats
        const [activeRes, completedRes, refillRes, revenueRes] = await Promise.all([
          supabase.from('protocols').select('id', { count: 'exact' }).eq('status', 'active'),
          supabase.from('protocols').select('id', { count: 'exact' }).eq('status', 'completed'),
          supabase.from('protocols').select('id', { count: 'exact' }).eq('status', 'ready_refill'),
          supabase.from('protocols').select('amount_paid').not('amount_paid', 'is', null)
        ]);
        
        const totalRevenue = (revenueRes.data || []).reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0);
        
        return res.status(200).json({
          active: activeRes.count || 0,
          completed: completedRes.count || 0,
          readyForRefill: refillRes.count || 0,
          totalRevenue
        });

      case 'milestones':
        // Today's milestones
        const today = new Date().toISOString().split('T')[0];
        ({ data, error } = await supabase
          .from('protocol_milestones')
          .select(`
            *,
            protocol:protocols(patient_name, patient_email, program_name, ghl_contact_id)
          `)
          .eq('scheduled_date', today)
          .eq('status', 'pending')
          .order('milestone_type'));
        break;

      default:
        // All protocols
        ({ data, error } = await supabase
          .from('protocols')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100));
    }

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Add computed fields
    const enrichedData = (data || []).map(protocol => ({
      ...protocol,
      days_remaining: protocol.end_date 
        ? Math.max(0, Math.ceil((new Date(protocol.end_date) - new Date()) / (1000 * 60 * 60 * 24)))
        : null,
      percent_complete: protocol.start_date && protocol.duration_days
        ? Math.min(100, Math.round(((new Date() - new Date(protocol.start_date)) / (1000 * 60 * 60 * 24)) / protocol.duration_days * 100))
        : null
    }));

    return res.status(200).json(enrichedData);

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
