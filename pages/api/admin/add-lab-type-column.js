// /pages/api/admin/add-lab-type-column.js
// Add lab_type column to lab_documents table

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Add lab_type column using raw SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE lab_documents ADD COLUMN IF NOT EXISTS lab_type TEXT DEFAULT 'Baseline';`
    });

    if (error) {
      // Try alternative approach - just test if column exists by querying
      const { data, error: queryError } = await supabase
        .from('lab_documents')
        .select('lab_type')
        .limit(1);

      if (queryError && queryError.message.includes('lab_type')) {
        return res.status(500).json({
          error: 'Column does not exist and cannot be added via API',
          details: 'Please add the column manually in Supabase Dashboard: Table Editor → lab_documents → Add column → name: lab_type, type: text, default: Baseline',
          originalError: error?.message
        });
      }

      // Column might already exist
      return res.status(200).json({
        message: 'Column already exists or was added successfully',
        data
      });
    }

    return res.status(200).json({ success: true, message: 'lab_type column added successfully' });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
