// /pages/api/admin/protocols.js
// API route for protocol dashboard data

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-3077d6b0-6f08-4cb6-b74e-be7dd765e91d';
const GHL_API_BASE = 'https://services.leadconnectorhq.com';

// Update GHL contact custom fields
async function updateGHLContact(contactId, fields) {
  try {
    const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        customFields: Object.entries(fields)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => ({ key, value: value?.toString() || '' }))
      })
    });
    return response.ok;
  } catch (error) {
    console.error('GHL update error:', error);
    return false;
  }
}

// Handle PUT request to update protocol
async function handleUpdate(req, res) {
  const {
    id,
    ghl_contact_id,
    goal,
    primary_peptide,
    secondary_peptide,
    dose_amount,
    dose_frequency,
    peptide_route,
    special_instructions,
    status,
    duration_days,
    start_date
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  try {
    // First get the existing protocol
    const { data: existing } = await supabase
      .from('protocols')
      .select('start_date, duration_days')
      .eq('id', id)
      .single();

    // Use new start_date if provided, otherwise existing
    const effectiveStartDate = start_date || existing?.start_date;
    const effectiveDuration = duration_days || existing?.duration_days;

    // Calculate new end_date
    let end_date = null;
    if (effectiveStartDate && effectiveDuration) {
      const start = new Date(effectiveStartDate);
      const end = new Date(start);
      end.setDate(end.getDate() + effectiveDuration - 1);
      end_date = end.toISOString().split('T')[0];
    }

    // Build update object
    const updateData = {
      goal,
      primary_peptide,
      secondary_peptide,
      dose_amount,
      dose_frequency,
      peptide_route,
      special_instructions,
      status,
      updated_at: new Date().toISOString()
    };

    // Add start_date if provided
    if (start_date) {
      updateData.start_date = start_date;
    }

    // Add duration and end_date if provided
    if (duration_days) {
      updateData.duration_days = duration_days;
    }
    if (end_date) {
      updateData.end_date = end_date;
    }

    // Update in Supabase
    const { data, error } = await supabase
      .from('protocols')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Sync to GHL contact
    if (ghl_contact_id) {
      const goalDisplay = goal ? goal.charAt(0).toUpperCase() + goal.slice(1) : '';
      
      await updateGHLContact(ghl_contact_id, {
        protocol_goal: goalDisplay,
        primary_peptide: primary_peptide || '',
        secondary_peptide: secondary_peptide || '',
        protocol_status: status === 'active' ? 'Active' : 
                        status === 'completed' ? 'Completed' :
                        status === 'ready_refill' ? 'Ready for Refill' :
                        status === 'pending' ? 'Pending' : 'Cancelled'
      });
    }

    return res.status(200).json({ success: true, protocol: data });

  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({ error: 'Failed to update protocol' });
  }
}

// Handle DELETE request to remove protocol
async function handleDelete(req, res) {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  try {
    // First delete any injection logs for this protocol
    const { error: logsError } = await supabase
      .from('injection_logs')
      .delete()
      .eq('protocol_id', id);

    if (logsError) {
      console.error('Error deleting injection logs:', logsError);
      // Continue anyway - protocol may not have logs
    }

    // Then delete the protocol
    const { data, error } = await supabase
      .from('protocols')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, deleted: data });

  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete protocol' });
  }
}

// Handle POST request to get/create dashboard token
async function handleDashboardToken(req, res) {
  const { ghl_contact_id, patient_name, patient_email, patient_phone } = req.body;

  if (!ghl_contact_id) {
    return res.status(400).json({ error: 'Contact ID required' });
  }

  try {
    // Check if token already exists
    const { data: existing } = await supabase
      .from('patient_access_tokens')
      .select('token')
      .eq('ghl_contact_id', ghl_contact_id)
      .single();

    if (existing) {
      return res.status(200).json({ token: existing.token });
    }

    // Create new token
    const token = Math.random().toString(36).substring(2, 10) + 
                  Math.random().toString(36).substring(2, 10);

    const { data: newToken, error } = await supabase
      .from('patient_access_tokens')
      .insert({
        token,
        ghl_contact_id,
        patient_name,
        patient_email,
        patient_phone
      })
      .select('token')
      .single();

    if (error) {
      console.error('Token creation error:', error);
      return res.status(500).json({ error: 'Failed to create token' });
    }

    return res.status(200).json({ token: newToken.token });

  } catch (error) {
    console.error('Dashboard token error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

export default async function handler(req, res) {
  // Simple auth check
  const authHeader = req.headers.authorization;
  const adminPassword = process.env.ADMIN_PASSWORD || 'range2024';
  
  if (authHeader !== `Bearer ${adminPassword}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Handle PUT for updates
  if (req.method === 'PUT') {
    return handleUpdate(req, res);
  }

  // Handle DELETE for removing protocols
  if (req.method === 'DELETE') {
    return handleDelete(req, res);
  }

  // Handle POST for dashboard token
  if (req.method === 'POST') {
    const { view } = req.query;
    if (view === 'dashboard_token') {
      return handleDashboardToken(req, res);
    }
    return res.status(400).json({ error: 'Invalid POST request' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { view, search, contactId } = req.query;

  try {
    let data, error;

    switch (view) {
      case 'peptides':
        // Get peptide list for dropdowns
        ({ data, error } = await supabase
          .from('peptide_tools')
          .select('id, name, category, default_dose, default_frequency, suggested_primary_goal')
          .eq('is_active', true)
          .order('category')
          .order('name'));
        
        if (error) {
          return res.status(500).json({ error: error.message });
        }
        return res.status(200).json(data);

      case 'contact':
        // Protocols for a specific contact
        if (!contactId) {
          return res.status(400).json({ error: 'Contact ID required' });
        }
        ({ data, error } = await supabase
          .from('protocols')
          .select('*')
          .eq('ghl_contact_id', contactId)
          .order('start_date', { ascending: false }));
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
          .order('start_date', { ascending: false })
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
          .order('start_date', { ascending: false })
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
          .order('start_date', { ascending: false })
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
