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
        name,
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

  // Fetch protocol logs (check-ins, renewals, notes)
  const { data: logs, error: logsError } = await supabase
    .from('protocol_logs')
    .select('*')
    .eq('protocol_id', id)
    .order('log_date', { ascending: false });

  if (logsError) {
    console.error('Error fetching protocol logs:', logsError);
  }

  // Separate weight check-ins from other logs
  const allLogs = logs || [];
  const weightCheckins = allLogs.filter(log => log.log_type === 'checkin' && log.weight);
  const activityLogs = allLogs.filter(log => log.log_type !== 'checkin' || !log.weight);

  // Calculate weight progress for weight loss protocols
  let weightProgress = null;
  if (data.program_type === 'weight_loss' && weightCheckins.length > 0) {
    const sortedCheckins = [...weightCheckins].sort((a, b) => new Date(a.log_date) - new Date(b.log_date));
    const startingWeight = data.starting_weight || sortedCheckins[0]?.weight;
    const currentWeight = sortedCheckins[sortedCheckins.length - 1]?.weight;

    if (startingWeight && currentWeight) {
      const change = currentWeight - startingWeight;
      weightProgress = {
        startingWeight,
        currentWeight,
        change: change.toFixed(1),
        changePercent: ((change / startingWeight) * 100).toFixed(1),
        isLoss: change < 0
      };
    }
  }

  return res.status(200).json({
    success: true,
    protocol: data,
    weightCheckins,
    activityLogs,
    weightProgress
  });
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
    'vial_size',
    // In-clinic visit scheduling fields
    'visit_frequency',
    'scheduled_days',
    'last_visit_date',
    'next_expected_date'
  ];

  // Date fields that need special handling (convert empty string to null)
  const dateFields = [
    'start_date',
    'end_date',
    'last_refill_date',
    'last_visit_date',
    'next_expected_date'
  ];

  // Filter to only allowed fields
  const updateData = {};
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      // Handle date fields - convert empty strings to null
      if (dateFields.includes(key)) {
        updateData[key] = value && value.trim() !== '' ? value : null;
      } else {
        updateData[key] = value;
      }
    }
  }

  // Sync dose and selected_dose (use selected_dose as source of truth)
  if (updateData.selected_dose !== undefined) {
    // Normalize dose format: ensure it has "mg" suffix if it's a number
    let dose = updateData.selected_dose;
    if (dose && !isNaN(parseFloat(dose)) && !dose.toString().toLowerCase().includes('mg') && !dose.toString().toLowerCase().includes('ml')) {
      dose = dose + 'mg';
    }
    updateData.selected_dose = dose;
    updateData.dose = dose; // Keep in sync
  }

  // Normalize delivery_method (at_home → take_home for consistency)
  if (updateData.delivery_method === 'at_home') {
    updateData.delivery_method = 'take_home';
  }

  // Normalize supply_type (prefill_ → prefilled_ for consistency)
  if (updateData.supply_type === 'prefill_2week') {
    updateData.supply_type = 'prefilled_2week';
  }
  if (updateData.supply_type === 'prefill_4week') {
    updateData.supply_type = 'prefilled_4week';
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
