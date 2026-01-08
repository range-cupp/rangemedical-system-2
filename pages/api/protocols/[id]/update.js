// /pages/api/protocols/[id]/update.js
// Update a protocol
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  try {
    const {
      medication,
      selected_dose,
      starting_weight,
      total_sessions,
      sessions_used,
      delivery_method,
      notes,
      frequency,
      start_date,
      end_date,
      status,
      supply_type,
      labs_completed,
      labs_completed_date
    } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    
    if (medication !== undefined) updateData.medication = medication;
    if (selected_dose !== undefined) updateData.selected_dose = selected_dose;
    if (starting_weight !== undefined) updateData.starting_weight = starting_weight;
    if (total_sessions !== undefined) updateData.total_sessions = total_sessions;
    if (sessions_used !== undefined) updateData.sessions_used = sessions_used;
    if (delivery_method !== undefined) updateData.delivery_method = delivery_method;
    if (notes !== undefined) updateData.notes = notes;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (status !== undefined) updateData.status = status;
    if (supply_type !== undefined) updateData.supply_type = supply_type;
    if (labs_completed !== undefined) updateData.labs_completed = labs_completed;
    if (labs_completed_date !== undefined) updateData.labs_completed_date = labs_completed_date;
    
    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length <= 1) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Update protocol
    const { data: updated, error: updateError } = await supabase
      .from('protocols')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Failed to update protocol' });
    }

    console.log(`✓ Protocol ${id} updated`);

    return res.status(200).json({
      success: true,
      message: 'Protocol updated',
      protocol: updated
    });

  } catch (err) {
    console.error('Update error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
