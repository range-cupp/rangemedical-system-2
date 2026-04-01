// Energy & Recovery Pack — redeem balance at checkout
// Bonus is consumed first, then base. Partial redemption supported.
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    pack_id,
    patient_id,
    service_type,
    service_name,
    amount_cents,
    service_log_id,
    purchase_id,
  } = req.body;

  if (!pack_id || !patient_id || !service_type || !amount_cents || amount_cents <= 0) {
    return res.status(400).json({ error: 'pack_id, patient_id, service_type, and amount_cents are required' });
  }

  if (!['red_light', 'hyperbaric'].includes(service_type)) {
    return res.status(400).json({ error: 'service_type must be red_light or hyperbaric' });
  }

  try {
    // Fetch the pack with optimistic locking values
    const { data: pack, error: packError } = await supabase
      .from('energy_recovery_packs')
      .select('*')
      .eq('id', pack_id)
      .eq('status', 'active')
      .single();

    if (packError || !pack) {
      return res.status(404).json({ error: 'Active pack not found' });
    }

    // Check patient owns this pack (or is a family member)
    if (pack.patient_id !== patient_id) {
      return res.status(403).json({ error: 'Pack does not belong to this patient' });
    }

    // Check if bonus has expired
    const now = new Date();
    let availableBonus = pack.remaining_bonus_cents;
    if (new Date(pack.bonus_expires_at) < now) {
      availableBonus = 0;
    }

    const availableTotal = availableBonus + pack.remaining_base_cents;
    if (availableTotal <= 0) {
      return res.status(400).json({ error: 'No remaining balance on this pack' });
    }

    // Calculate how much to deduct (allow partial if balance < amount)
    const deductAmount = Math.min(amount_cents, availableTotal);

    // Bonus-first logic
    let bonusUsed = Math.min(deductAmount, availableBonus);
    let baseUsed = deductAmount - bonusUsed;

    const newBonus = availableBonus - bonusUsed;
    const newBase = pack.remaining_base_cents - baseUsed;
    const remainingAfter = newBonus + newBase;

    // If bonus expired, also zero it out
    const finalBonus = new Date(pack.bonus_expires_at) < now ? 0 : newBonus;

    const newStatus = remainingAfter <= 0 ? 'exhausted' : 'active';

    // Update pack balance (optimistic lock on current values)
    const { error: updateError, count } = await supabase
      .from('energy_recovery_packs')
      .update({
        remaining_bonus_cents: finalBonus,
        remaining_base_cents: newBase,
        status: newStatus,
      })
      .eq('id', pack.id)
      .eq('remaining_bonus_cents', pack.remaining_bonus_cents)
      .eq('remaining_base_cents', pack.remaining_base_cents);

    if (updateError) throw updateError;

    // Record redemption
    const { data: redemption, error: redemptionError } = await supabase
      .from('energy_recovery_redemptions')
      .insert({
        pack_id: pack.id,
        patient_id,
        service_log_id: service_log_id || null,
        purchase_id: purchase_id || null,
        service_type,
        service_name: service_name || null,
        amount_cents: deductAmount,
        bonus_used_cents: bonusUsed,
        base_used_cents: baseUsed,
        remaining_after_cents: remainingAfter,
      })
      .select()
      .single();

    if (redemptionError) throw redemptionError;

    return res.status(200).json({
      success: true,
      redemption,
      applied_cents: deductAmount,
      remaining_cents: remainingAfter,
      remaining_base_cents: newBase,
      remaining_bonus_cents: finalBonus,
      pack_status: newStatus,
      // If amount was more than balance, tell caller how much is left to charge
      unpaid_cents: amount_cents - deductAmount,
    });
  } catch (error) {
    console.error('Error redeeming energy pack:', error);
    return res.status(500).json({ error: error.message });
  }
}
