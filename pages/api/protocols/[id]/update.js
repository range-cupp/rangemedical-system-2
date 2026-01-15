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

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      medication,
      selected_dose,
      starting_dose,
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
      last_refill_date,
      labs_completed,
      labs_completed_date,
      baseline_labs_date,
      eight_week_labs_date,
      last_labs_date
    } = req.body;

    console.log('Update request for protocol:', id);
    console.log('Request body:', req.body);

    // Build update object with only provided fields
    const updateData = {
      updated_at: new Date().toISOString()
    };
    
    if (medication !== undefined) updateData.medication = medication;
    if (selected_dose !== undefined) updateData.selected_dose = selected_dose;
    if (starting_dose !== undefined) updateData.starting_dose = starting_dose;
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
    if (last_refill_date !== undefined) updateData.last_refill_date = last_refill_date;
    if (labs_completed !== undefined) updateData.labs_completed = labs_completed;
    if (labs_completed_date !== undefined) updateData.labs_completed_date = labs_completed_date;
    if (baseline_labs_date !== undefined) updateData.baseline_labs_date = baseline_labs_date;
    if (eight_week_labs_date !== undefined) updateData.eight_week_labs_date = eight_week_labs_date;
    if (last_labs_date !== undefined) updateData.last_labs_date = last_labs_date;

    console.log('Update data:', updateData);

    const { data, error } = await supabase
      .from('protocols')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Update error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Update successful:', data);

    return res.status(200).json({ success: true, data: data[0] });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
