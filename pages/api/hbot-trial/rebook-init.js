// POST /api/hbot-trial/rebook-init
// Initializes the rebook flow for an HBOT trial no-show.
// Looks up trial pass, creates a Stripe SetupIntent if needed, returns
// the data needed to mount the scheduler + card form.

import { createClient } from '@supabase/supabase-js';
import stripe from '../../../lib/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const HBOT_EVENT_TYPE_ID = 4858876;
const SESSION_DURATION = 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { trialId } = req.body;
  if (!trialId) {
    return res.status(400).json({ error: 'trialId is required' });
  }

  try {
    const { data: trial, error } = await supabase
      .from('trial_passes')
      .select('id, first_name, last_name, email, phone, status, trial_type, stripe_customer_id, no_show_payment_method_id, patient_id')
      .eq('id', trialId)
      .single();

    if (error || !trial) {
      return res.status(404).json({ error: 'Trial pass not found' });
    }

    if (trial.trial_type !== 'hbot') {
      return res.status(400).json({ error: 'This rebook flow is only for HBOT trials' });
    }

    let stripeCustomerId = trial.stripe_customer_id;
    if (!stripeCustomerId) {
      const existing = await stripe.customers.list({ email: trial.email, limit: 1 });
      if (existing.data.length > 0) {
        stripeCustomerId = existing.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: trial.email,
          name: `${trial.first_name} ${trial.last_name}`.trim(),
          phone: trial.phone,
          metadata: { source: 'hbot_rebook', trial_id: trialId },
        });
        stripeCustomerId = customer.id;
      }
      await supabase
        .from('trial_passes')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', trialId);
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      usage: 'off_session',
      metadata: {
        purpose: 'hbot_rebook_no_show_hold',
        trial_id: trialId,
        free_session_type: 'hbot',
      },
    });

    await supabase
      .from('trial_passes')
      .update({ stripe_setup_intent_id: setupIntent.id })
      .eq('id', trialId);

    return res.status(200).json({
      trialId: trial.id,
      firstName: trial.first_name,
      lastName: trial.last_name,
      email: trial.email,
      eventTypeId: HBOT_EVENT_TYPE_ID,
      setupClientSecret: setupIntent.client_secret,
      sessionDurationMinutes: SESSION_DURATION,
      hasCardOnFile: !!trial.no_show_payment_method_id,
    });
  } catch (err) {
    console.error('rebook-init error:', err);
    return res.status(500).json({ error: 'Failed to initialize rebook' });
  }
}
