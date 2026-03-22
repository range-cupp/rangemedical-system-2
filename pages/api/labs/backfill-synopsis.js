// pages/api/labs/backfill-synopsis.js
// Batch-generate AI synopses for recent labs that don't have one yet.
// POST { days: 7 } — generates synopses for all labs from the last N days

import { createClient } from '@supabase/supabase-js';
import { generateLabSynopsis } from '../../../lib/generate-lab-synopsis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { days = 7 } = req.body;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoff = cutoffDate.toISOString().split('T')[0];

  // Find all labs from the last N days without a synopsis
  const { data: labs, error } = await supabase
    .from('labs')
    .select('id, patient_id, test_date')
    .gte('test_date', cutoff)
    .is('ai_synopsis', null)
    .order('test_date', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!labs || labs.length === 0) {
    return res.status(200).json({ success: true, message: 'No labs need synopses', processed: 0 });
  }

  // Process sequentially to avoid rate limits
  const results = [];
  for (const lab of labs) {
    try {
      const synopsis = await generateLabSynopsis(supabase, lab.id, lab.patient_id);
      results.push({
        lab_id: lab.id,
        test_date: lab.test_date,
        success: !!synopsis
      });
    } catch (e) {
      results.push({
        lab_id: lab.id,
        test_date: lab.test_date,
        success: false,
        error: e.message
      });
    }
  }

  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return res.status(200).json({
    success: true,
    processed: results.length,
    succeeded,
    failed,
    results
  });
}
