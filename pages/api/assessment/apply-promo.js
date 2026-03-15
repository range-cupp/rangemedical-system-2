// /pages/api/assessment/apply-promo.js
// Validates a promo code and marks payment as complete (for testing / comped visits)
// Range Medical — Energy & Optimization Assessment

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Valid promo codes — code → { discount: 'full' }
// Add codes here or move to env/DB later
const PROMO_CODES = {
  RANGETEST: { discount: 'full', label: 'Staff Testing' },
  RANGEVIP: { discount: 'full', label: 'VIP Comp' },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId, promoCode } = req.body;

    if (!leadId || !promoCode) {
      return res.status(400).json({ error: 'leadId and promoCode are required' });
    }

    const code = promoCode.toUpperCase().trim();
    const promo = PROMO_CODES[code];

    if (!promo) {
      return res.status(400).json({ error: 'Invalid promo code' });
    }

    // Verify lead exists
    const { data: lead, error: leadError } = await supabase
      .from('assessment_leads')
      .select('id, payment_status')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ error: 'Assessment lead not found' });
    }

    if (lead.payment_status === 'paid') {
      return res.status(200).json({ success: true, message: 'Already paid' });
    }

    // Mark payment as complete (comped via promo code)
    const { error: updateError } = await supabase
      .from('assessment_leads')
      .update({
        payment_status: 'paid',
        payment_amount_cents: 0,
        stripe_payment_intent_id: `promo_${code}_${Date.now()}`,
      })
      .eq('id', leadId);

    if (updateError) {
      console.error('Promo code DB update error:', updateError);
      return res.status(500).json({ error: 'Failed to apply promo code' });
    }

    console.log(`Promo code ${code} applied for lead ${leadId} (${promo.label})`);

    return res.status(200).json({
      success: true,
      promoLabel: promo.label,
    });
  } catch (error) {
    console.error('Promo code error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
