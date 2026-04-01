import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const { data: partner } = await supabase
      .from('referral_partners')
      .select('slug, name, active')
      .eq('email', email)
      .eq('active', true)
      .maybeSingle();

    if (!partner) {
      return res.status(200).json({ found: false });
    }

    // Count their referrals
    const { count } = await supabase
      .from('referral_leads')
      .select('id', { count: 'exact', head: true })
      .eq('partner_slug', partner.slug);

    return res.status(200).json({
      found: true,
      slug: partner.slug,
      name: partner.name,
      link: `https://range-medical.com/refer/${partner.slug}`,
      lead_count: count || 0,
    });
  } catch (err) {
    console.error('Referral lookup error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
