// /pages/api/admin/journeys/advance.js
// Advance a patient's protocol to a new journey stage
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { protocol_id, new_stage, triggered_by, trigger_type, notes } = req.body;

  if (!protocol_id || !new_stage) {
    return res.status(400).json({ error: 'protocol_id and new_stage are required' });
  }

  try {
    // 1. Get current protocol state
    const { data: protocol, error: fetchError } = await supabase
      .from('protocols')
      .select('id, patient_id, current_journey_stage, journey_template_id, program_type, program_name')
      .eq('id', protocol_id)
      .single();

    if (fetchError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const previousStage = protocol.current_journey_stage;

    // 2. Validate new_stage exists in the template (if template assigned)
    if (protocol.journey_template_id) {
      const { data: template } = await supabase
        .from('journey_templates')
        .select('stages')
        .eq('id', protocol.journey_template_id)
        .single();

      if (template) {
        const validStages = (template.stages || []).map(s => s.key);
        if (!validStages.includes(new_stage)) {
          return res.status(400).json({ error: `Invalid stage: ${new_stage}. Valid stages: ${validStages.join(', ')}` });
        }
      }
    }

    // 3. Update protocol's current stage
    const { error: updateError } = await supabase
      .from('protocols')
      .update({
        current_journey_stage: new_stage,
        updated_at: new Date().toISOString()
      })
      .eq('id', protocol_id);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    // 4. Log the journey event
    const { data: event, error: eventError } = await supabase
      .from('journey_events')
      .insert({
        patient_id: protocol.patient_id,
        protocol_id: protocol_id,
        current_stage: new_stage,
        previous_stage: previousStage,
        trigger_type: trigger_type || 'manual',
        triggered_by: triggered_by || 'staff',
        notes: notes || null
      })
      .select()
      .single();

    if (eventError) {
      console.error('Error logging journey event:', eventError);
      // Don't fail the request — the stage was already updated
    }

    return res.status(200).json({
      success: true,
      protocol_id,
      previous_stage: previousStage,
      current_stage: new_stage,
      event: event || null
    });

  } catch (error) {
    console.error('Journey advance error:', error);
    return res.status(500).json({ error: error.message });
  }
}
