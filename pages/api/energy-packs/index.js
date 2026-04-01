// Energy & Recovery Pack — create pack + list packs per patient
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // GET — list packs for a patient (or all active packs)
  if (req.method === 'GET') {
    try {
      const { patient_id, status } = req.query;

      let query = supabase
        .from('energy_recovery_packs')
        .select('*')
        .order('purchased_at', { ascending: false });

      if (patient_id) query = query.eq('patient_id', patient_id);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) throw error;

      // Expire any bonus that's past due (in-flight correction)
      const now = new Date();
      const packs = (data || []).map(pack => {
        if (pack.status === 'active' && pack.remaining_bonus_cents > 0 && new Date(pack.bonus_expires_at) < now) {
          // Bonus has expired — reflect it in response (async update below)
          expireBonusIfNeeded(pack);
          return {
            ...pack,
            remaining_bonus_cents: 0,
            status: pack.remaining_base_cents > 0 ? 'active' : 'exhausted',
          };
        }
        return pack;
      });

      return res.status(200).json({ packs });
    } catch (error) {
      console.error('Error fetching energy packs:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // POST — create a new pack after $500 payment
  if (req.method === 'POST') {
    try {
      const { patient_id, purchase_id, family_member_name, notes } = req.body;

      if (!patient_id) {
        return res.status(400).json({ error: 'patient_id is required' });
      }

      // Check campaign is enabled and not sold out
      const { data: config, error: configError } = await supabase
        .from('energy_recovery_config')
        .select('*')
        .single();

      if (configError) throw configError;

      if (!config.enabled) {
        return res.status(400).json({ error: 'Energy & Recovery Pack is not currently available.' });
      }

      // Count packs sold
      const { count, error: countError } = await supabase
        .from('energy_recovery_packs')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'void');

      if (countError) throw countError;

      if (count >= config.max_packs) {
        return res.status(400).json({ error: 'Energy & Recovery Pack is sold out.' });
      }

      // Calculate bonus expiry (90 days from now)
      const bonusExpiresAt = new Date();
      bonusExpiresAt.setDate(bonusExpiresAt.getDate() + config.bonus_days);

      const { data: pack, error: insertError } = await supabase
        .from('energy_recovery_packs')
        .insert({
          patient_id,
          family_member_name: family_member_name || null,
          amount_paid_cents: config.price_cents,
          total_value_cents: config.value_cents,
          base_value_cents: config.price_cents,
          bonus_value_cents: config.value_cents - config.price_cents,
          remaining_base_cents: config.price_cents,
          remaining_bonus_cents: config.value_cents - config.price_cents,
          bonus_expires_at: bonusExpiresAt.toISOString(),
          status: 'active',
          purchase_id: purchase_id || null,
          notes: notes || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return res.status(201).json({ pack });
    } catch (error) {
      console.error('Error creating energy pack:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Fire-and-forget bonus expiry update
async function expireBonusIfNeeded(pack) {
  try {
    const newStatus = pack.remaining_base_cents > 0 ? 'active' : 'exhausted';
    await supabase
      .from('energy_recovery_packs')
      .update({
        remaining_bonus_cents: 0,
        status: newStatus,
      })
      .eq('id', pack.id)
      .gt('remaining_bonus_cents', 0);
  } catch (err) {
    console.error('Error expiring bonus for pack:', pack.id, err);
  }
}
