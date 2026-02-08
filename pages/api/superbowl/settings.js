// /pages/api/superbowl/settings.js
// Super Bowl LX Giveaway - Settings API (open/close contest)
// Range Medical - 2026-02-08

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'range-superbowl-2026';

export default async function handler(req, res) {
  // Auth check
  const providedSecret = req.headers['x-admin-secret'];
  if (providedSecret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // Get current settings
    try {
      const { data, error } = await supabase
        .from('superbowl_settings')
        .select('*')
        .single();

      if (error && error.code === 'PGRST116') {
        // No settings row exists, create one
        const { data: newData, error: insertError } = await supabase
          .from('superbowl_settings')
          .insert({ contest_open: true })
          .select()
          .single();

        if (insertError) {
          return res.status(500).json({ error: 'Failed to create settings' });
        }
        return res.status(200).json({ contest_open: newData.contest_open });
      }

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch settings' });
      }

      return res.status(200).json({ contest_open: data.contest_open });
    } catch (err) {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'POST') {
    // Update settings
    const { contest_open } = req.body;

    if (typeof contest_open !== 'boolean') {
      return res.status(400).json({ error: 'contest_open must be boolean' });
    }

    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('superbowl_settings')
        .select('id')
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('superbowl_settings')
          .update({ contest_open, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) {
          return res.status(500).json({ error: 'Failed to update settings' });
        }
      } else {
        // Insert new
        const { error } = await supabase
          .from('superbowl_settings')
          .insert({ contest_open });

        if (error) {
          return res.status(500).json({ error: 'Failed to create settings' });
        }
      }

      return res.status(200).json({ success: true, contest_open });
    } catch (err) {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
