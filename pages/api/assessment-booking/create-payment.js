import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { patientInfo } = req.body;

    if (!patientInfo?.email || !patientInfo?.firstName || !patientInfo?.lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 19700,
      currency: 'usd',
      metadata: {
        type: 'range_assessment',
        patient_name: `${patientInfo.firstName} ${patientInfo.lastName}`,
        patient_email: patientInfo.email,
        patient_phone: patientInfo.phone || '',
        patient_dob: patientInfo.dob || '',
      },
      receipt_email: patientInfo.email,
      description: 'Range Assessment',
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Assessment payment error:', error);
    return res.status(500).json({ error: 'Failed to create payment', details: error.message });
  }
}
