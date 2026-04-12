// Energy & Recovery Pack — public purchase completion
// Called after Stripe payment succeeds on the landing page
// Creates patient (if new), records purchase, creates pack, sends notifications
import { createClient } from '@supabase/supabase-js';
import stripe from '../../../lib/stripe';
import { sendSMS } from '../../../lib/send-sms';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OWNER_PHONE = '+19496900339';

function formatPhoneE164(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return phone;
}

function capitalizeName(name) {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentIntentId, firstName, lastName, email, phone } = req.body;

    if (!paymentIntentId || !firstName || !lastName || !email) {
      return res.status(400).json({ error: 'paymentIntentId, firstName, lastName, and email are required' });
    }

    // Verify payment succeeded
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['payment_method'],
    });

    if (pi.status !== 'succeeded') {
      return res.status(400).json({ error: `Payment not succeeded (status: ${pi.status})` });
    }

    const customerName = `${capitalizeName(firstName)} ${capitalizeName(lastName)}`;
    const normalizedEmail = email.toLowerCase().trim();
    const formattedPhone = formatPhoneE164(phone);

    // Card details
    let cardBrand = null;
    let cardLast4 = null;
    if (pi.payment_method?.card) {
      cardBrand = pi.payment_method.card.brand;
      cardLast4 = pi.payment_method.card.last4;
    }

    // Find or create patient
    let patientId = null;

    const { data: byEmail } = await supabase
      .from('patients')
      .select('id, stripe_customer_id')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (byEmail) {
      patientId = byEmail.id;
      // Link Stripe customer if not already
      if (!byEmail.stripe_customer_id && pi.customer) {
        await supabase
          .from('patients')
          .update({ stripe_customer_id: pi.customer })
          .eq('id', patientId);
      }
    } else {
      // Create new patient
      const { data: newPatient } = await supabase
        .from('patients')
        .insert({
          first_name: capitalizeName(firstName),
          last_name: capitalizeName(lastName),
          email: normalizedEmail,
          phone: formattedPhone,
          stripe_customer_id: pi.customer || null,
          tags: ['energy_recovery_pack', 'website_purchase'],
        })
        .select('id')
        .single();

      if (newPatient) patientId = newPatient.id;
    }

    // Record purchase
    const { data: purchase } = await supabase
      .from('purchases')
      .insert({
        patient_id: patientId,
        patient_name: customerName,
        patient_email: normalizedEmail,
        patient_phone: formattedPhone,
        item_name: 'Energy & Recovery Pack',
        product_name: 'Energy & Recovery Pack',
        amount: 500,
        amount_paid: 500,
        category: 'packages',
        quantity: 1,
        stripe_payment_intent_id: paymentIntentId,
        stripe_amount_cents: 50000,
        stripe_status: 'succeeded',
        stripe_verified_at: new Date().toISOString(),
        payment_method: 'stripe',
        source: 'website_checkout',
        purchase_date: todayPacific(),
        card_brand: cardBrand,
        card_last4: cardLast4,
      })
      .select('id')
      .single();

    // Check campaign config
    const { data: config } = await supabase
      .from('energy_recovery_config')
      .select('*')
      .single();

    if (!config?.enabled) {
      return res.status(400).json({ error: 'Energy & Recovery Pack is not currently available.' });
    }

    // Count sold packs
    const { count } = await supabase
      .from('energy_recovery_packs')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'void');

    if (count >= config.max_packs) {
      return res.status(400).json({ error: 'Energy & Recovery Pack is sold out.' });
    }

    // Create the pack
    const bonusExpiresAt = new Date();
    bonusExpiresAt.setDate(bonusExpiresAt.getDate() + config.bonus_days);

    const { data: pack, error: packError } = await supabase
      .from('energy_recovery_packs')
      .insert({
        patient_id: patientId,
        amount_paid_cents: config.price_cents,
        total_value_cents: config.value_cents,
        base_value_cents: config.price_cents,
        bonus_value_cents: config.value_cents - config.price_cents,
        remaining_base_cents: config.price_cents,
        remaining_bonus_cents: config.value_cents - config.price_cents,
        bonus_expires_at: bonusExpiresAt.toISOString(),
        status: 'active',
        purchase_id: purchase?.id || null,
      })
      .select()
      .single();

    if (packError) {
      console.error('Energy pack creation error:', packError);
    }

    // SMS notification to owner
    await sendSMS({
      to: OWNER_PHONE,
      message: `Energy & Recovery Pack Sold!\n\n${customerName}\n${normalizedEmail}\n${phone || 'No phone'}\n\n$500 paid — $750 balance activated\nPacks sold: ${(count || 0) + 1} of ${config.max_packs}`,
    }).catch(err => console.error('SMS notification error:', err));

    // Confirmation text to patient
    if (formattedPhone) {
      await sendSMS({
        to: formattedPhone,
        message: `Hi ${capitalizeName(firstName)}, your Energy & Recovery Pack is activated! You have $750 to use on Red Light Therapy and Hyperbaric Oxygen sessions at Range Medical. Book your first session: range-medical.com\n\nQuestions? Call or text (949) 997-3988`,
        log: {
          messageType: 'energy_pack_confirmation',
          source: 'energy-packs-purchase',
          patientId,
        },
      }).catch(err => console.error('Patient SMS error:', err));
    }

    console.log(`Energy & Recovery Pack sold: ${customerName} (${normalizedEmail}) — pack ${pack?.id}`);

    return res.status(200).json({
      success: true,
      pack_id: pack?.id,
      patient_id: patientId,
      purchase_id: purchase?.id,
    });
  } catch (error) {
    console.error('Energy pack purchase error:', error);
    return res.status(500).json({ error: error.message });
  }
}
