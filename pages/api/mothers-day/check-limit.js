import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const email = (req.query.email || '').toLowerCase().trim();
  const qty = parseInt(req.query.qty) || 1;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const { data: existing } = await supabase
    .from('mothers_day_promos')
    .select('id')
    .eq('purchaser_email', email);

  const existingCount = (existing || []).length;
  const remaining = Math.max(0, 2 - existingCount);

  if (existingCount + qty > 2) {
    return res.status(200).json({
      limit_reached: true,
      existing: existingCount,
      remaining,
      error: remaining === 0
        ? "You've already purchased the maximum of 2 Wellness Credits."
        : `You can only purchase ${remaining} more (max 2 per person).`,
    });
  }

  return res.status(200).json({ limit_reached: false, existing: existingCount, remaining });
}
