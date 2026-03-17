// pages/api/iv-booking/create-payment.js
// Creates a Stripe PaymentIntent for IV booking checkout
// Accepts selected IV, add-ons, and patient info

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { selectedIV, addOns, bloodWork, patientInfo } = req.body;

    if (!selectedIV || !patientInfo?.email || !patientInfo?.firstName || !patientInfo?.lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate total
    let totalCents = selectedIV.priceCents;
    const lineItems = [{ name: selectedIV.name, priceCents: selectedIV.priceCents }];

    if (addOns && addOns.length > 0) {
      const addOnTotal = addOns.length * 3500; // $35 each
      totalCents += addOnTotal;
      lineItems.push({ name: `Add-ons: ${addOns.join(', ')}`, priceCents: addOnTotal });
    }

    if (bloodWork) {
      totalCents += 12500; // $125
      lineItems.push({ name: 'MB Pre-Screening Panel (G6PD, CMP, CBC)', priceCents: 12500 });
    }

    if (totalCents < 50) {
      return res.status(400).json({ error: 'Amount too low' });
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      metadata: {
        type: 'iv_booking',
        iv_name: selectedIV.name,
        iv_slug: selectedIV.slug || '',
        add_ons: addOns ? addOns.join(', ') : '',
        blood_work: bloodWork ? 'yes' : 'no',
        patient_name: `${patientInfo.firstName} ${patientInfo.lastName}`,
        patient_email: patientInfo.email,
        patient_phone: patientInfo.phone || '',
        patient_dob: patientInfo.dob || '',
      },
      receipt_email: patientInfo.email,
      description: `IV Booking: ${selectedIV.name}${addOns?.length ? ` + ${addOns.length} add-ons` : ''}`,
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      totalCents,
      lineItems,
    });
  } catch (error) {
    console.error('IV booking payment error:', error);
    return res.status(500).json({ error: 'Failed to create payment', details: error.message });
  }
}
