// GET /api/receipt/[id] — Returns PDF receipt for a purchase
import { createClient } from '@supabase/supabase-js';
import stripe from '../../../lib/stripe';
import { generateReceiptPdf } from '../../../lib/receipt-pdf';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Missing purchase id' });
  }

  try {
    // Fetch purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', id)
      .single();

    if (purchaseError || !purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    // Fetch patient info
    const { data: patient } = await supabase
      .from('patients')
      .select('name, phone, address, city, state, zip_code')
      .eq('id', purchase.patient_id)
      .single();

    const firstName = ((patient?.name) || '').split(' ')[0] || 'Patient';
    const patientAddress = patient ? [patient.address, [patient.city, patient.state, patient.zip_code].filter(Boolean).join(', ')].filter(Boolean).join(', ') : null;

    // Get card details from Stripe if available
    let cardBrand = null;
    let cardLast4 = null;
    if (purchase.stripe_payment_intent_id) {
      try {
        const pi = await stripe.paymentIntents.retrieve(purchase.stripe_payment_intent_id, {
          expand: ['payment_method'],
        });
        if (pi.payment_method?.card) {
          cardBrand = pi.payment_method.card.brand;
          cardLast4 = pi.payment_method.card.last4;
        }
      } catch (err) {
        console.error('Failed to retrieve PaymentIntent for receipt PDF:', err.message);
      }
    }

    // Build discount label
    let discountLabel = null;
    if (purchase.discount_type === 'percent') {
      discountLabel = `${purchase.discount_amount}% off`;
    } else if (purchase.discount_type === 'dollar') {
      discountLabel = `$${purchase.discount_amount} off`;
    }

    const amountPaidCents = Math.round(purchase.amount * 100);
    const originalAmountCents = purchase.original_amount
      ? Math.round(purchase.original_amount * 100)
      : amountPaidCents;

    const pdfBytes = await generateReceiptPdf({
      firstName,
      patientName: patient?.name || null,
      patientPhone: patient?.phone || null,
      patientAddress,
      invoiceId: purchase.id,
      date: new Date(purchase.purchase_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      description: purchase.description,
      originalAmountCents,
      discountLabel,
      amountPaidCents,
      cardBrand,
      cardLast4,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="Range-Medical-Receipt.pdf"');
    return res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Receipt PDF error:', error);
    return res.status(500).json({ error: 'Failed to generate receipt' });
  }
}
