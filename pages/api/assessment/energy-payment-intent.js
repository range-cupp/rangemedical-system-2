import { createClient } from '@supabase/supabase-js';
import stripe from '../../../lib/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PANEL_CONFIG = {
  essential: { amount: 35000, label: 'Essential' },
  elite:     { amount: 75000, label: 'Elite' },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId, email, firstName, lastName, phone, panelType, discount } = req.body;

    if (!email || !firstName || !lastName) {
      return res.status(400).json({ error: 'email, firstName, and lastName are required' });
    }

    if (!panelType || !PANEL_CONFIG[panelType]) {
      return res.status(400).json({ error: 'panelType must be "essential" or "elite"' });
    }

    const { amount: baseAmount, label } = PANEL_CONFIG[panelType];
    const discountCents = Math.min((discount || 0) * 100, baseAmount);
    const amount = baseAmount - discountCents;
    const normalizedEmail = email.toLowerCase().trim();

    let customerId = null;
    const { data: patient } = await supabase
      .from('patients')
      .select('id, stripe_customer_id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (patient?.stripe_customer_id) {
      customerId = patient.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: normalizedEmail,
        name: `${firstName} ${lastName}`,
        phone: phone || undefined,
        metadata: {
          source: 'assessment',
          patient_id: patient?.id || null,
        },
      });
      customerId = customer.id;

      if (patient?.id) {
        await supabase
          .from('patients')
          .update({ stripe_customer_id: customerId })
          .eq('id', patient.id);
      }
    }

    let paymentIntent;
    const displayAmount = `$${(amount / 100).toFixed(0)}`;
    const intentParams = {
      amount,
      currency: 'usd',
      customer: customerId,
      description: discountCents > 0
        ? `Lab Panel — ${label} (${displayAmount} after $${discount} start funnel discount)`
        : `Lab Panel — ${label}`,
      metadata: {
        lead_id: leadId || 'start_funnel',
        assessment_path: 'energy',
        panel_type: panelType,
        patient_email: normalizedEmail,
        discount_applied: discountCents > 0 ? `${discount}` : '0',
        source: discountCents > 0 ? 'start_funnel' : 'direct',
      },
    };

    try {
      intentParams.automatic_payment_methods = { enabled: true };
      paymentIntent = await stripe.paymentIntents.create(intentParams);
    } catch (autoErr) {
      console.warn('automatic_payment_methods failed, falling back to card:', autoErr.message);
      delete intentParams.automatic_payment_methods;
      intentParams.payment_method_types = ['card'];
      paymentIntent = await stripe.paymentIntents.create(intentParams);
    }

    if (leadId) {
      await supabase
        .from('assessment_leads')
        .update({
          stripe_payment_intent_id: paymentIntent.id,
          payment_status: 'pending',
          payment_amount_cents: amount,
        })
        .eq('id', leadId);
    }

    console.log(`Energy lab payment intent created: ${paymentIntent.id} for lead ${leadId} (${label} panel, $${amount / 100})`);

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Energy lab payment intent error:', error);
    return res.status(500).json({ error: error.message });
  }
}
