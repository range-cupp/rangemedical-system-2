// Stripe Subscription Management
// GET: ?patient_id=xxx — list subscriptions with details from Stripe
// POST: { patient_id, price_amount, interval, description } — create subscription
// PUT: { subscription_id, action, payment_method_id } — update/manage subscription
// DELETE: { subscription_id } — cancel subscription

import { createClient } from '@supabase/supabase-js';
import stripe from '../../../lib/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {

  // ===== GET: List subscriptions for a patient directly from Stripe =====
  if (req.method === 'GET') {
    try {
      const { patient_id } = req.query;
      if (!patient_id) {
        return res.status(400).json({ error: 'patient_id is required' });
      }

      const { data: patient, error } = await supabase
        .from('patients')
        .select('stripe_customer_id')
        .eq('id', patient_id)
        .single();

      if (error || !patient?.stripe_customer_id) {
        return res.status(200).json({ subscriptions: [] });
      }

      // Fetch all subscriptions from Stripe (including past_due, canceled, etc.)
      const stripeSubs = await stripe.subscriptions.list({
        customer: patient.stripe_customer_id,
        limit: 100,
        expand: ['data.default_payment_method', 'data.latest_invoice'],
      });

      const subscriptions = stripeSubs.data.map(sub => {
        const pm = sub.default_payment_method;
        const invoice = sub.latest_invoice;
        const item = sub.items.data[0];
        const price = item?.price;
        // Use latest invoice amount_paid to reflect discounts/coupons; fall back to base price
        const actualAmount = (invoice && typeof invoice === 'object' && invoice.amount_paid != null)
          ? invoice.amount_paid
          : (price?.unit_amount || 0);

        return {
          id: sub.id,
          status: sub.status,
          amount_cents: actualAmount,
          currency: price?.currency || 'usd',
          interval: price?.recurring?.interval || 'month',
          interval_count: price?.recurring?.interval_count || 1,
          description: price?.product?.name || sub.metadata?.description || item?.price?.nickname || 'Subscription',
          service_category: sub.metadata?.service_category || null,
          current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
          current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          cancel_at_period_end: sub.cancel_at_period_end,
          canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
          started_at: sub.start_date ? new Date(sub.start_date * 1000).toISOString() : null,
          created: new Date(sub.created * 1000).toISOString(),
          payment_method: pm && typeof pm === 'object' ? {
            id: pm.id,
            brand: pm.card?.brand || 'unknown',
            last4: pm.card?.last4 || '????',
            exp_month: pm.card?.exp_month,
            exp_year: pm.card?.exp_year,
          } : null,
          latest_invoice: invoice && typeof invoice === 'object' ? {
            id: invoice.id,
            status: invoice.status,
            amount_due: invoice.amount_due,
            amount_paid: invoice.amount_paid,
            attempt_count: invoice.attempt_count,
            next_payment_attempt: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000).toISOString() : null,
            hosted_invoice_url: invoice.hosted_invoice_url,
          } : null,
          pause_collection: sub.pause_collection,
        };
      });

      return res.status(200).json({ subscriptions });

    } catch (error) {
      console.error('List subscriptions error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ===== POST: Create a new subscription =====
  if (req.method === 'POST') {
    try {
      const { patient_id, price_amount, interval, description, service_category } = req.body;

      if (!patient_id || !price_amount) {
        return res.status(400).json({ error: 'patient_id and price_amount are required' });
      }

      // Get patient's Stripe customer
      const { data: patient, error: fetchError } = await supabase
        .from('patients')
        .select('stripe_customer_id')
        .eq('id', patient_id)
        .single();

      if (fetchError || !patient?.stripe_customer_id) {
        return res.status(400).json({ error: 'Patient must have a Stripe customer with a saved payment method' });
      }

      // Get default payment method
      const paymentMethods = await stripe.paymentMethods.list({
        customer: patient.stripe_customer_id,
        type: 'card',
        limit: 1,
      });

      if (!paymentMethods.data.length) {
        return res.status(400).json({ error: 'No saved payment method found. Save a card first.' });
      }

      // Create a price object
      const price = await stripe.prices.create({
        unit_amount: Math.round(price_amount),
        currency: 'usd',
        recurring: { interval: interval || 'month' },
        product_data: {
          name: description || 'Range Medical subscription',
        },
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: patient.stripe_customer_id,
        items: [{ price: price.id }],
        default_payment_method: paymentMethods.data[0].id,
        metadata: { patient_id, ...(service_category ? { service_category } : {}) },
      });

      return res.status(200).json({
        subscription_id: subscription.id,
        status: subscription.status,
      });

    } catch (error) {
      console.error('Subscription create error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ===== PUT: Update/manage subscription =====
  if (req.method === 'PUT') {
    try {
      const { subscription_id, action, payment_method_id } = req.body;

      if (!subscription_id) {
        return res.status(400).json({ error: 'subscription_id is required' });
      }

      // Update payment method on subscription
      if (action === 'update_payment_method') {
        if (!payment_method_id) {
          return res.status(400).json({ error: 'payment_method_id is required' });
        }

        const updated = await stripe.subscriptions.update(subscription_id, {
          default_payment_method: payment_method_id,
        });

        // Also update the customer's default payment method
        if (updated.customer) {
          await stripe.customers.update(updated.customer, {
            invoice_settings: { default_payment_method: payment_method_id },
          });
        }

        return res.status(200).json({
          subscription_id: updated.id,
          status: updated.status,
          message: 'Payment method updated',
        });
      }

      // Retry failed payment — pay the latest open invoice
      if (action === 'retry_payment') {
        const sub = await stripe.subscriptions.retrieve(subscription_id, {
          expand: ['latest_invoice'],
        });

        const invoice = sub.latest_invoice;
        if (!invoice || typeof invoice !== 'object') {
          return res.status(400).json({ error: 'No invoice found to retry' });
        }

        if (invoice.status === 'paid') {
          return res.status(200).json({ message: 'Invoice already paid', status: sub.status });
        }

        // If a new payment method was provided, update the subscription first
        if (payment_method_id) {
          await stripe.subscriptions.update(subscription_id, {
            default_payment_method: payment_method_id,
          });
          if (sub.customer) {
            await stripe.customers.update(sub.customer, {
              invoice_settings: { default_payment_method: payment_method_id },
            });
          }
        }

        // Pay the invoice
        const paid = await stripe.invoices.pay(invoice.id, {
          ...(payment_method_id ? { payment_method: payment_method_id } : {}),
        });

        return res.status(200).json({
          subscription_id: sub.id,
          invoice_status: paid.status,
          message: paid.status === 'paid' ? 'Payment successful' : `Invoice status: ${paid.status}`,
        });
      }

      // Pause subscription (skip collection)
      if (action === 'pause') {
        const updated = await stripe.subscriptions.update(subscription_id, {
          pause_collection: { behavior: 'mark_uncollectible' },
        });

        return res.status(200).json({
          subscription_id: updated.id,
          status: updated.status,
          message: 'Subscription paused',
        });
      }

      // Resume paused subscription
      if (action === 'resume') {
        const updated = await stripe.subscriptions.update(subscription_id, {
          pause_collection: '',
        });

        return res.status(200).json({
          subscription_id: updated.id,
          status: updated.status,
          message: 'Subscription resumed',
        });
      }

      // Cancel at period end (soft cancel)
      if (action === 'cancel_at_period_end') {
        const updated = await stripe.subscriptions.update(subscription_id, {
          cancel_at_period_end: true,
        });

        return res.status(200).json({
          subscription_id: updated.id,
          status: updated.status,
          cancel_at_period_end: true,
          message: 'Subscription will cancel at period end',
        });
      }

      // Undo cancel at period end
      if (action === 'undo_cancel') {
        const updated = await stripe.subscriptions.update(subscription_id, {
          cancel_at_period_end: false,
        });

        return res.status(200).json({
          subscription_id: updated.id,
          status: updated.status,
          cancel_at_period_end: false,
          message: 'Cancellation undone',
        });
      }

      return res.status(400).json({ error: `Unknown action: ${action}` });

    } catch (error) {
      console.error('Subscription update error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ===== DELETE: Cancel immediately =====
  if (req.method === 'DELETE') {
    try {
      const { subscription_id } = req.body;

      if (!subscription_id) {
        return res.status(400).json({ error: 'subscription_id is required' });
      }

      const cancelled = await stripe.subscriptions.cancel(subscription_id);

      return res.status(200).json({
        subscription_id: cancelled.id,
        status: cancelled.status,
      });

    } catch (error) {
      console.error('Subscription cancel error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
