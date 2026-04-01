// Energy & Recovery Pack — get/update campaign config (visibility, cap)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // GET — current config + sold count
  if (req.method === 'GET') {
    try {
      const { data: config, error } = await supabase
        .from('energy_recovery_config')
        .select('*')
        .single();

      if (error) throw error;

      const { count, error: countError } = await supabase
        .from('energy_recovery_packs')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'void');

      if (countError) throw countError;

      return res.status(200).json({
        ...config,
        packs_sold: count || 0,
        packs_remaining: Math.max(0, (config.max_packs || 40) - (count || 0)),
      });
    } catch (error) {
      console.error('Error fetching energy pack config:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // PUT — update config
  if (req.method === 'PUT') {
    try {
      const { enabled, max_packs } = req.body;

      const updates = {};
      if (typeof enabled === 'boolean') updates.enabled = enabled;
      if (typeof max_packs === 'number') updates.max_packs = max_packs;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const { data, error } = await supabase
        .from('energy_recovery_config')
        .update(updates)
        .eq('id', 1)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error updating energy pack config:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
