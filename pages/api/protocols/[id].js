// /pages/api/protocols/[id].js
// Protocol API - GET, PATCH, DELETE for individual protocols
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Protocol ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getProtocol(id, res);
      case 'PATCH':
        return await updateProtocol(id, req.body, res);
      case 'DELETE':
        return await deleteProtocol(id, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Protocol API error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function getProtocol(id, res) {
  const { data, error } = await supabase
    .from('protocols')
    .select(`
      *,
      patients (
        id,
        first_name,
        last_name,
        email,
        phone,
        ghl_contact_id
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    return res.status(404).json({ error: 'Protocol not found' });
  }
  
  return res.status(200).json({ success: true, protocol: data });
}

async function updateProtocol(id, updates, res) {
  // Allowed fields to update
  const allowedFields = [
    'status',
    'start_date',
    'end_date',
    'medication',
    'dose',
    'selected_dose',
    'frequency',
    'delivery_method',
    'sessions_used',
    'total_sessions',
    'last_refill_date',
    'supply_type',
    'notes',
    'program_name',
    'program_type',
    'starting_weight',
    // HRT vial-specific fields
    'dose_per_injection',
    'injections_per_week',
    'vial_size'
  ];
  
  // Filter to only allowed fields
  const updateData = {};
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      updateData[key] = value;
    }
  }
  
  // Always update the updated_at timestamp
  updateData.updated_at = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('protocols')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating protocol:', error);
    return res.status(500).json({ error: error.message });
  }
  
  return res.status(200).json({ success: true, protocol: data });
}

async function deleteProtocol(id, res) {
  const { error } = await supabase
    .from('protocols')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting protocol:', error);
    return res.status(500).json({ error: error.message });
  }
  
  return res.status(200).json({ success: true });
}
