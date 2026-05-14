import stripe from '../../../lib/stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 9700,
      currency: 'usd',
      metadata: {
        type: 'lab_clarity_visit',
        patient_name: fullName,
        patient_email: email,
      },
      receipt_email: email,
      description: 'Lab Clarity Visit — Range Medical',
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error('Lab clarity create-payment error:', err);
    return res.status(500).json({ error: 'Failed to initialize payment.' });
  }
}
