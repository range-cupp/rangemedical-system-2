// Recovery Offer Enrollment API
// POST: { patient_id, offer_type, modality_preference, start_date?, symptom_scores?, notes? }
// Creates enrollment + protocol + purchase record
// For MEMBERSHIP: also creates Stripe subscription

import { createClient } from '@supabase/supabase-js';
import { createProtocol } from '../../../lib/create-protocol';
import { todayPacific } from '../../../lib/date-utils';
import {
  RECOVERY_OFFERS,
  OFFER_TYPES,
  calculateCycleDates,
  calculateSprintEndDate,
  calculateTestDriveEndDate,
} from '../../../lib/recovery-offers';
import stripe from '../../../lib/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      patient_id,
      offer_type,
      modality_preference = 'COMBINED',
      start_date,
      symptom_scores,
      notes,
      include_sprint_bonus = false,
    } = req.body;

    if (!patient_id || !offer_type) {
      return res.status(400).json({ error: 'patient_id and offer_type are required' });
    }

    const offer = RECOVERY_OFFERS[offer_type];
    if (!offer) {
      return res.status(400).json({ error: `Invalid offer_type: ${offer_type}` });
    }

    if (!['COMBINED', 'RLT_ONLY', 'HBOT_ONLY'].includes(modality_preference)) {
      return res.status(400).json({ error: 'Invalid modality_preference' });
    }

    const today = start_date || todayPacific();

    // ── Eligibility checks ─────────────────────────────────────────────────
    if (offer_type === OFFER_TYPES.TEST_DRIVE) {
      const { data: existing } = await supabase
        .from('recovery_enrollments')
        .select('id')
        .eq('patient_id', patient_id)
        .eq('offer_id', await getOfferId(OFFER_TYPES.TEST_DRIVE));

      if (existing && existing.length > 0) {
        return res.status(400).json({ error: 'Patient has already used their Test Drive (limit 1 per person)' });
      }
    }

    if (offer_type === OFFER_TYPES.ADD_ON) {
      const { data: activeMembership } = await supabase
        .from('recovery_enrollments')
        .select('id')
        .eq('patient_id', patient_id)
        .eq('status', 'active')
        .eq('offer_id', await getOfferId(OFFER_TYPES.MEMBERSHIP))
        .limit(1);

      if (!activeMembership || activeMembership.length === 0) {
        return res.status(400).json({ error: 'Power Pack requires an active Recovery Membership' });
      }
    }

    // ── Get offer record from DB ───────────────────────────────────────────
    const offerId = await getOfferId(offer_type);
    if (!offerId) {
      return res.status(500).json({ error: 'Offer not found in database. Run the migration first.' });
    }

    // ── Calculate dates ────────────────────────────────────────────────────
    let endDate = null;
    let cycleStart = null;
    let cycleEnd = null;
    let sessionsAllowed = offer.sessions;

    if (offer_type === OFFER_TYPES.TEST_DRIVE) {
      endDate = calculateTestDriveEndDate(today);
    } else if (offer_type === OFFER_TYPES.SPRINT) {
      endDate = calculateSprintEndDate(today);
    } else if (offer_type === OFFER_TYPES.MEMBERSHIP) {
      const cycle = calculateCycleDates(today);
      cycleStart = cycle.cycleStart;
      cycleEnd = cycle.cycleEnd;
      // If Sprint bonus included, first cycle gets Sprint sessions (8) on top of membership.
      // Sprint runs during first 14 days; membership cycle is 28 days.
      // We give 8 sessions for the Sprint period, then 8/cycle ongoing.
      if (include_sprint_bonus) {
        sessionsAllowed = 8; // Sprint sessions during first 14 days
      }
    } else if (offer_type === OFFER_TYPES.ADD_ON) {
      // Power Pack: add sessions to existing membership enrollment
      return await handlePowerPack(req, res, patient_id);
    }

    // ── Create protocol ────────────────────────────────────────────────────
    const programType = modality_preference === 'RLT_ONLY' ? 'rlt'
      : modality_preference === 'HBOT_ONLY' ? 'hbot'
      : 'hbot'; // COMBINED uses hbot as primary protocol

    const totalSessions = modality_preference === 'COMBINED'
      ? offer.sessions * 2  // HBOT + RLT per Recovery Session
      : offer.sessions;

    const protocolResult = await createProtocol({
      patient_id,
      program_type: programType,
      program_name: offer.name,
      total_sessions: totalSessions,
      start_date: today,
      end_date: endDate,
      status: 'active',
      notes: `Modality: ${modality_preference}. ${notes || ''}`.trim(),
    }, {
      source: 'recovery-enrollment',
      force: true,
    });

    const protocolId = protocolResult.success ? protocolResult.protocol?.id : null;

    // ── Create enrollment ──────────────────────────────────────────────────
    const enrollmentData = {
      patient_id,
      offer_id: offerId,
      protocol_id: protocolId,
      modality_preference,
      status: 'active',
      start_date: today,
      end_date: endDate,
      cycle_start: cycleStart,
      cycle_end: cycleEnd,
      sessions_allowed: sessionsAllowed,
      sessions_used: 0,
      symptom_score_baseline: symptom_scores || null,
      notes: notes || null,
    };

    const { data: enrollment, error: enrollError } = await supabase
      .from('recovery_enrollments')
      .insert(enrollmentData)
      .select()
      .single();

    if (enrollError) {
      console.error('Enrollment insert error:', enrollError);
      return res.status(500).json({ error: enrollError.message });
    }

    // ── Record purchase ────────────────────────────────────────────────────
    if (offer.priceCents > 0) {
      const { data: patient } = await supabase
        .from('patients')
        .select('name, email, phone')
        .eq('id', patient_id)
        .single();

      await supabase.from('purchases').insert({
        patient_id,
        patient_name: patient?.name || '',
        patient_email: patient?.email || '',
        patient_phone: patient?.phone || '',
        item_name: offer.name,
        category: 'recovery',
        amount: offer.priceCents / 100,
        amount_paid: offer.priceCents / 100,
        protocol_id: protocolId,
        protocol_created: !!protocolId,
        purchase_date: today,
        payment_method: 'manual',
        source: 'recovery_enrollment',
      });
    }

    // ── Create Stripe subscription for membership ──────────────────────────
    if (offer_type === OFFER_TYPES.MEMBERSHIP) {
      try {
        const { data: patient } = await supabase
          .from('patients')
          .select('stripe_customer_id')
          .eq('id', patient_id)
          .single();

        if (patient?.stripe_customer_id) {
          const paymentMethods = await stripe.paymentMethods.list({
            customer: patient.stripe_customer_id,
            type: 'card',
            limit: 1,
          });

          if (paymentMethods.data.length > 0) {
            const price = await stripe.prices.create({
              unit_amount: offer.priceCents,
              currency: 'usd',
              recurring: { interval: 'month', interval_count: 1 },
              product_data: { name: 'Recovery Membership' },
            });

            const subscription = await stripe.subscriptions.create({
              customer: patient.stripe_customer_id,
              items: [{ price: price.id }],
              default_payment_method: paymentMethods.data[0].id,
              metadata: { patient_id, enrollment_id: enrollment.id, service_category: 'recovery' },
              billing_cycle_anchor: Math.floor(new Date(today + 'T12:00:00').getTime() / 1000),
            });

            await supabase
              .from('recovery_enrollments')
              .update({ stripe_subscription_id: subscription.id })
              .eq('id', enrollment.id);

            enrollment.stripe_subscription_id = subscription.id;
          }
        }
      } catch (stripeErr) {
        console.error('Stripe subscription creation error (non-fatal):', stripeErr.message);
        // Enrollment still created — staff can set up subscription manually
      }
    }

    return res.status(200).json({
      success: true,
      enrollment,
      protocol_id: protocolId,
    });

  } catch (error) {
    console.error('Recovery enroll error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getOfferId(offerType) {
  const { data } = await supabase
    .from('recovery_offers')
    .select('id')
    .eq('offer_type', offerType)
    .eq('active', true)
    .single();
  return data?.id || null;
}

async function handlePowerPack(req, res, patient_id) {
  // Find active membership enrollment
  const membershipOfferId = await getOfferId(OFFER_TYPES.MEMBERSHIP);
  const { data: membership } = await supabase
    .from('recovery_enrollments')
    .select('*')
    .eq('patient_id', patient_id)
    .eq('status', 'active')
    .eq('offer_id', membershipOfferId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!membership) {
    return res.status(400).json({ error: 'No active membership found' });
  }

  // Add 8 sessions to current cycle
  const newAllowed = membership.sessions_allowed + 8;
  const { error: updateError } = await supabase
    .from('recovery_enrollments')
    .update({ sessions_allowed: newAllowed, updated_at: new Date().toISOString() })
    .eq('id', membership.id);

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  // Record purchase
  const powerPack = RECOVERY_OFFERS.ADD_ON;
  const { data: patient } = await supabase
    .from('patients')
    .select('name, email, phone')
    .eq('id', patient_id)
    .single();

  await supabase.from('purchases').insert({
    patient_id,
    patient_name: patient?.name || '',
    patient_email: patient?.email || '',
    patient_phone: patient?.phone || '',
    item_name: powerPack.name,
    category: 'recovery',
    amount: powerPack.priceCents / 100,
    amount_paid: powerPack.priceCents / 100,
    purchase_date: todayPacific(),
    payment_method: 'manual',
    source: 'recovery_power_pack',
  });

  return res.status(200).json({
    success: true,
    enrollment_id: membership.id,
    sessions_allowed: newAllowed,
    sessions_used: membership.sessions_used,
  });
}
