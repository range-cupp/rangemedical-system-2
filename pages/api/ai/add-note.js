// /pages/api/ai/add-note.js
// Creates a patient note from the AI assistant
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { patient_id, body, created_by, note_category } = req.body;

  if (!patient_id || !body) {
    return res.status(400).json({ error: 'patient_id and body are required' });
  }

  try {
    const { data, error } = await supabase
      .from('patient_notes')
      .insert({
        patient_id,
        body,
        raw_input: body,
        created_by: created_by || 'AI Assistant',
        source: 'ai-assistant',
        note_category: note_category || 'internal',
        note_date: new Date().toISOString(),
        status: 'draft',
      })
      .select('id')
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, note_id: data.id });
  } catch (err) {
    console.error('Add note error:', err);
    return res.status(500).json({ error: 'Failed to add note' });
  }
}
