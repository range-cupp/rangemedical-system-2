// pages/api/labs/synopsis.js
// GET: Fetch existing synopsis for a lab
// POST: Generate or regenerate AI synopsis for a lab

import { createClient } from '@supabase/supabase-js';
import { generateLabSynopsis } from '../../../lib/generate-lab-synopsis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { lab_id } = req.query;
    if (!lab_id) return res.status(400).json({ error: 'lab_id required' });

    const { data: lab, error } = await supabase
      .from('labs')
      .select('id, patient_id, ai_synopsis, ai_synopsis_generated_at')
      .eq('id', lab_id)
      .single();

    if (error || !lab) return res.status(404).json({ error: 'Lab not found' });

    return res.status(200).json({
      success: true,
      synopsis: lab.ai_synopsis,
      generated_at: lab.ai_synopsis_generated_at
    });
  }

  if (req.method === 'POST') {
    const { lab_id, force } = req.body;
    if (!lab_id) return res.status(400).json({ error: 'lab_id required' });

    // Look up the lab
    const { data: lab, error } = await supabase
      .from('labs')
      .select('id, patient_id, ai_synopsis')
      .eq('id', lab_id)
      .single();

    if (error || !lab) return res.status(404).json({ error: 'Lab not found' });

    // Skip if already exists and not forcing
    if (lab.ai_synopsis && !force) {
      return res.status(200).json({
        success: true,
        synopsis: lab.ai_synopsis,
        cached: true
      });
    }

    const synopsis = await generateLabSynopsis(supabase, lab_id, lab.patient_id);

    if (!synopsis) {
      return res.status(500).json({ error: 'Synopsis generation failed' });
    }

    return res.status(200).json({
      success: true,
      synopsis,
      cached: false
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
