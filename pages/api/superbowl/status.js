// /pages/api/superbowl/status.js
// Super Bowl LX Giveaway - Public Status Check
// Range Medical - 2026-02-08

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('superbowl_settings')
      .select('contest_open')
      .single();

    if (error) {
      // If no settings found, default to open
      return res.status(200).json({ contest_open: true });
    }

    return res.status(200).json({ contest_open: data.contest_open });
  } catch (err) {
    // Default to open if there's an error
    return res.status(200).json({ contest_open: true });
  }
}
