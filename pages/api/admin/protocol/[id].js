// /pages/api/admin/protocol/[id].js
// Protocol API - Range Medical
import { createClient } from '@supabase/supabase-js';
import { guardDoseChange } from '../../../../lib/dose-change-guard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  // GET - Fetch single protocol
  if (req.method === 'GET') {
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

  // PUT - Update protocol
  if (req.method === 'PUT') {
    console.log('=== PROTOCOL UPDATE ===');
    console.log('Protocol ID:', id);
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    
    const updateData = {
      updated_at: new Date().toISOString()
    };
    
    // Map field names to actual DB columns
    // Ghost names (primary_peptide, dose_amount, dose_frequency, injection_location)
    // don't exist as columns — map them to real ones
    if (req.body.injection_location !== undefined || req.body.delivery_method !== undefined) {
      updateData.delivery_method = req.body.delivery_method ?? req.body.injection_location;
      console.log('Setting delivery_method:', updateData.delivery_method);
    }
    if (req.body.status !== undefined) {
      updateData.status = req.body.status;
      console.log('Setting status:', req.body.status);
    }
    if (req.body.primary_peptide !== undefined || req.body.medication !== undefined) {
      updateData.medication = req.body.medication ?? req.body.primary_peptide;
      console.log('Setting medication:', updateData.medication);
    }
    if (req.body.dose_amount !== undefined || req.body.selected_dose !== undefined) {
      updateData.selected_dose = req.body.selected_dose ?? req.body.dose_amount;
      console.log('Setting selected_dose:', updateData.selected_dose);
    }
    if (req.body.dose_frequency !== undefined || req.body.frequency !== undefined) {
      updateData.frequency = req.body.frequency ?? req.body.dose_frequency;
      console.log('Setting frequency:', updateData.frequency);
    }
    if (req.body.start_date !== undefined) {
      updateData.start_date = req.body.start_date || null;
      console.log('Setting start_date:', req.body.start_date);
    }
    if (req.body.end_date !== undefined) {
      updateData.end_date = req.body.end_date || null;
      console.log('Setting end_date:', req.body.end_date);
    }
    if (req.body.special_instructions !== undefined) {
      updateData.special_instructions = req.body.special_instructions;
      console.log('Setting special_instructions:', req.body.special_instructions);
    }
    if (req.body.reminders_enabled !== undefined) {
      updateData.reminders_enabled = req.body.reminders_enabled;
      console.log('Setting reminders_enabled:', req.body.reminders_enabled);
    }
    if (req.body.notes !== undefined) {
      updateData.notes = req.body.notes;
      console.log('Setting notes:', req.body.notes);
    }

    console.log('Final updateData:', JSON.stringify(updateData, null, 2));

    // Gate WL/HRT dose changes — must go through Dose Change modal → Burgess SMS approval.
    if (updateData.selected_dose !== undefined) {
      const { data: current } = await supabase
        .from('protocols')
        .select('id, program_type, selected_dose, dose, dose_per_injection, injections_per_week')
        .eq('id', id)
        .single();
      if (current) {
        const guard = await guardDoseChange(
          supabase,
          current,
          updateData,
          {
            mode: 'reject',
            approvedRequestId: req.body.approved_dose_change_request_id,
          }
        );
        if (!guard.allowed) {
          return res.status(400).json({
            error: guard.reason,
            requires_approval: true,
            category: guard.category,
          });
        }
      }
    }

    const { data, error } = await supabase
      .from('protocols')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Protocol update error:', error);
      return res.status(500).json({ error: 'Failed to update protocol', details: error.message });
    }

    console.log('Update successful, returned data end_date:', data.end_date);
    return res.status(200).json(data);
  }

  // DELETE - Delete protocol
  if (req.method === 'DELETE') {
    // First unlink any purchases
    await supabase
      .from('purchases')
      .update({ protocol_id: null })
      .eq('protocol_id', id);

    const { error } = await supabase
      .from('protocols')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete protocol' });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
