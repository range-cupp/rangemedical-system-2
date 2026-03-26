// /api/webhooks/manychat
// Receives lead data from ManyChat when someone DMs "LIGHT" on Instagram
// Creates sales_pipeline lead + trial_pass, returns payment link URL
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify ManyChat webhook secret
  const secret = req.headers['x-manychat-secret'] || req.query.secret;
  if (process.env.MANYCHAT_WEBHOOK_SECRET && secret !== process.env.MANYCHAT_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const {
      first_name,
      last_name,
      phone,
      email,
      instagram_handle,
      main_problem,
      importance_1_10,
      subscriber_id,
    } = req.body;

    if (!first_name) {
      return res.status(400).json({ error: 'first_name is required' });
    }

    const fullName = `${first_name} ${last_name || ''}`.trim();
    const importance = parseInt(importance_1_10) || null;

    // Check for duplicate by phone or email
    let existingTrialId = null;
    if (phone) {
      const digits = phone.replace(/\D/g, '').slice(-10);
      if (digits.length === 10) {
        const { data } = await supabase
          .from('trial_passes')
          .select('id')
          .ilike('phone', `%${digits}`)
          .eq('status', 'pending')
          .limit(1)
          .maybeSingle();
        if (data) existingTrialId = data.id;
      }
    }
    if (!existingTrialId && email) {
      const { data } = await supabase
        .from('trial_passes')
        .select('id')
        .ilike('email', email.trim())
        .eq('status', 'pending')
        .limit(1)
        .maybeSingle();
      if (data) existingTrialId = data.id;
    }

    if (existingTrialId) {
      // Return existing trial payment link
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://range-medical.com';
      return res.status(200).json({
        success: true,
        trial_id: existingTrialId,
        payment_url: `${baseUrl}/rlt-trial?trial_id=${existingTrialId}`,
        message: 'Existing trial pass found',
      });
    }

    // Create sales pipeline lead
    const { data: lead, error: leadErr } = await supabase
      .from('sales_pipeline')
      .insert({
        lead_type: 'rlt_trial',
        first_name,
        last_name: last_name || null,
        email: email || null,
        phone: phone || null,
        source: 'manychat',
        stage: 'new_lead',
        urgency: importance || null,
        notes: main_problem ? `Main problem: ${main_problem}` : null,
      })
      .select('id')
      .single();

    if (leadErr) {
      console.error('ManyChat webhook — pipeline insert error:', leadErr.message);
      throw leadErr;
    }

    // Create trial pass
    const { data: trial, error: trialErr } = await supabase
      .from('trial_passes')
      .insert({
        sales_pipeline_id: lead.id,
        first_name,
        last_name: last_name || null,
        email: email || null,
        phone: phone || null,
        instagram_handle: instagram_handle || null,
        main_problem: main_problem || null,
        importance_1_10: importance,
        source: 'manychat',
        manychat_subscriber_id: subscriber_id || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (trialErr) {
      console.error('ManyChat webhook — trial pass insert error:', trialErr.message);
      throw trialErr;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://range-medical.com';
    const paymentUrl = `${baseUrl}/rlt-trial?trial_id=${trial.id}`;

    console.log(`ManyChat lead created: ${fullName} → trial ${trial.id}, pipeline ${lead.id}`);

    return res.status(200).json({
      success: true,
      trial_id: trial.id,
      pipeline_id: lead.id,
      payment_url: paymentUrl,
      low_urgency: importance !== null && importance < 8,
    });
  } catch (error) {
    console.error('ManyChat webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
