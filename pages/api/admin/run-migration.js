// /pages/api/admin/run-migration.js
// One-time migration runner — adds ghl_contact_id to consents table
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const password = req.headers['x-admin-password'];
  if (password !== 'range2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = [];

  try {
    // Check if ghl_contact_id column already exists
    const { data: testRow, error: testError } = await supabase
      .from('consents')
      .select('ghl_contact_id')
      .limit(1);

    if (testError && testError.message.includes('ghl_contact_id')) {
      // Column doesn't exist — need to add it via a workaround
      // Since we can't run ALTER TABLE via PostgREST, we'll use the
      // Supabase management API or instruct the admin to run it manually

      results.push({
        action: 'add_ghl_contact_id',
        status: 'NEEDS_MANUAL_RUN',
        message: 'The ghl_contact_id column is missing from the consents table. Please run this SQL in the Supabase Dashboard SQL Editor:',
        sql: `ALTER TABLE consents ADD COLUMN IF NOT EXISTS ghl_contact_id TEXT;
CREATE INDEX IF NOT EXISTS idx_consents_ghl_contact_id ON consents(ghl_contact_id);
CREATE INDEX IF NOT EXISTS idx_consents_email ON consents(email);
CREATE INDEX IF NOT EXISTS idx_consents_patient_id ON consents(patient_id);`
      });
    } else {
      results.push({
        action: 'check_ghl_contact_id',
        status: 'EXISTS',
        message: 'ghl_contact_id column already exists on consents table'
      });
    }

    return res.status(200).json({ results });

  } catch (error) {
    return res.status(500).json({ error: error.message, results });
  }
}
