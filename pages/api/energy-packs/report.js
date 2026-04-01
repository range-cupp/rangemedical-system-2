// Energy & Recovery Pack — admin reporting
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
    const { from_date, to_date, patient_id } = req.query;

    // Fetch all non-void packs
    let packsQuery = supabase
      .from('energy_recovery_packs')
      .select('*, patients(first_name, last_name, email, phone)')
      .neq('status', 'void')
      .order('purchased_at', { ascending: false });

    if (from_date) packsQuery = packsQuery.gte('purchased_at', from_date);
    if (to_date) packsQuery = packsQuery.lte('purchased_at', to_date + 'T23:59:59Z');
    if (patient_id) packsQuery = packsQuery.eq('patient_id', patient_id);

    const { data: packs, error: packsError } = await packsQuery;
    if (packsError) throw packsError;

    // Fetch redemptions for these packs
    const packIds = (packs || []).map(p => p.id);
    let redemptions = [];
    if (packIds.length > 0) {
      const { data, error: redError } = await supabase
        .from('energy_recovery_redemptions')
        .select('*')
        .in('pack_id', packIds)
        .order('created_at', { ascending: false });

      if (redError) throw redError;
      redemptions = data || [];
    }

    // Fetch campaign config
    const { data: config } = await supabase
      .from('energy_recovery_config')
      .select('*')
      .single();

    // Aggregate totals
    const now = new Date();
    const totals = (packs || []).reduce((acc, p) => {
      const bonusExpired = new Date(p.bonus_expires_at) < now;
      const effectiveBonus = bonusExpired ? 0 : p.remaining_bonus_cents;
      acc.count += 1;
      acc.cash_collected += p.amount_paid_cents;
      acc.remaining_base += p.remaining_base_cents;
      acc.remaining_bonus += effectiveBonus;
      acc.total_redeemed += (p.total_value_cents - p.remaining_base_cents - p.remaining_bonus_cents);
      return acc;
    }, { count: 0, cash_collected: 0, remaining_base: 0, remaining_bonus: 0, total_redeemed: 0 });

    totals.remaining_liability = totals.remaining_base + totals.remaining_bonus;

    return res.status(200).json({
      packs: packs || [],
      redemptions,
      totals,
      config,
    });
  } catch (error) {
    console.error('Error fetching energy pack report:', error);
    return res.status(500).json({ error: error.message });
  }
}
