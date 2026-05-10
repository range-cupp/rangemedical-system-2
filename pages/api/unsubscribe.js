// pages/api/unsubscribe.js
// Marketing email unsubscribe endpoint
// GET /api/unsubscribe?email=xxx — marks patient as marketing_opt_out

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const email = (req.query.email || '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    return res.redirect(302, '/unsubscribe?status=invalid');
  }

  try {
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (patient) {
      await supabase
        .from('patients')
        .update({ marketing_opt_out: true, comms_updated_at: new Date().toISOString() })
        .eq('id', patient.id);
    }

    return res.redirect(302, '/unsubscribe?status=ok');
  } catch (err) {
    console.error('[unsubscribe] error:', err);
    return res.redirect(302, '/unsubscribe?status=error');
  }
}
