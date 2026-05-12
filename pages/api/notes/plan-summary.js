// pages/api/notes/plan-summary.js
// Generate (or regenerate) an AI plan summary for a consultation note.
// POST { note_id }  →  { summary }

import { generateAndEmailPlanSummary } from '../../../lib/plan-summary';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { note_id } = req.body;
  if (!note_id) {
    return res.status(400).json({ error: 'note_id is required' });
  }

  try {
    const summary = await generateAndEmailPlanSummary(note_id);
    if (!summary) {
      return res.status(422).json({ error: 'Could not generate summary — note may be empty or API key missing' });
    }
    return res.status(200).json({ success: true, summary });
  } catch (err) {
    console.error('[plan-summary] API error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate plan summary' });
  }
}
