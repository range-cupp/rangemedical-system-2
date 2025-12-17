// /pages/api/admin/protocol/[id].js
// Update a protocol
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  if (req.method === 'GET') {
    // Get protocol details
    const { data, error } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    return res.status(200).json(data);
  }

  if (req.method === 'PUT') {
    // Update protocol
    const {
      injection_location,
      status,
      peptide_name,
      dose_amount,
      dose_frequency,
      start_date,
      end_date,
      special_instructions,
      reminders_enabled
    } = req.body;

    const updateData = {};
    
    if (injection_location !== undefined) updateData.injection_location = injection_location;
    if (status !== undefined) updateData.status = status;
    if (peptide_name !== undefined) updateData.peptide_name = peptide_name;
    if (dose_amount !== undefined) updateData.dose_amount = dose_amount;
    if (dose_frequency !== undefined) updateData.dose_frequency = dose_frequency;
    if (start_date !== undefined) updateData.start_date = start_date || null;
    if (end_date !== undefined) updateData.end_date = end_date || null;
    if (special_instructions !== undefined) updateData.special_instructions = special_instructions;
    if (reminders_enabled !== undefined) updateData.reminders_enabled = reminders_enabled;
    
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('protocols')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Protocol update error:', error);
      return res.status(500).json({ error: 'Failed to update protocol' });
    }

    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
