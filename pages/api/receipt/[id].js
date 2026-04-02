// GET /api/receipt/[id] — Returns PDF receipt for a purchase
// If the purchase is part of a consolidated transaction (same stripe_payment_intent_id),
// the PDF will show all items from that transaction.
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
    // Fetch the requested purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', id)
      .single();

    if (purchaseError || !purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    // Check if this purchase is part of a consolidated transaction
    let allPurchases = [purchase];
    if (purchase.stripe_payment_intent_id) {
      const { data: siblings } = await supabase
        .from('purchases')
        .select('*')
        .eq('stripe_payment_intent_id', purchase.stripe_payment_intent_id)
        .order('created_at', { ascending: true });

      if (siblings && siblings.length > 1) {
        allPurchases = siblings;
      }
    }

    const isMultiItem = allPurchases.length > 1;

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

    let pdfParams;

    if (isMultiItem) {
      // Build line items for consolidated receipt
      const items = allPurchases.map(p => {
        const qty = p.quantity || 1;
        const lineTotalCents = Math.round(p.amount * 100);
        // Don't show original price for comped items — just show $0
        const isItemComp = lineTotalCents === 0;
        const unitPriceCents = isItemComp
          ? 0
          : p.original_amount
            ? Math.round(p.original_amount * 100 / qty)
            : Math.round(p.amount * 100 / qty);

        let discountLabel = null;
        if (!isItemComp) {
          if (p.discount_type === 'percent') {
            discountLabel = `${p.discount_amount}% off`;
          } else if (p.discount_type === 'dollar') {
            discountLabel = `$${p.discount_amount} off`;
          }
        }

        // Use description if available, otherwise item_name
        const name = p.description || p.item_name || 'Service';

        return { name, quantity: qty, unitPriceCents, discountLabel, lineTotalCents };
      });

      const totalAmountCents = allPurchases.reduce((sum, p) => sum + Math.round(p.amount * 100), 0);

      pdfParams = {
        firstName,
        patientName: patient?.name || null,
        patientPhone: patient?.phone || null,
        patientAddress,
        invoiceId: allPurchases[0].id,
        date: new Date(purchase.purchase_date).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        }),
        items,
        amountPaidCents: totalAmountCents,
        cardBrand,
        cardLast4,
      };
    } else {
      // Single-item receipt
      const rawAmt = parseFloat(purchase.amount) || 0;
      const rawPaid = parseFloat(purchase.amount_paid);
      const resolvedPaid = (!isNaN(rawPaid) && rawPaid > 0 && rawPaid < rawAmt) ? rawPaid : rawAmt;
      const amountPaidCents = Math.round(resolvedPaid * 100);
      const originalAmountCents = purchase.original_amount
        ? Math.round(parseFloat(purchase.original_amount) * 100)
        : (resolvedPaid < rawAmt ? Math.round(rawAmt * 100) : amountPaidCents);

      let discountLabel = null;
      if (purchase.discount_type === 'percent') {
        discountLabel = `${purchase.discount_amount}% off`;
      } else if (purchase.discount_type === 'dollar') {
        discountLabel = `$${purchase.discount_amount} off`;
      }

      pdfParams = {
        firstName,
        patientName: patient?.name || null,
        patientPhone: patient?.phone || null,
        patientAddress,
        invoiceId: purchase.id,
        date: new Date(purchase.purchase_date).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        }),
        description: purchase.description || purchase.item_name,
        originalAmountCents,
        discountLabel,
        amountPaidCents,
        cardBrand,
        cardLast4,
      };
    }

    const pdfBytes = await generateReceiptPdf(pdfParams);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="Range-Medical-Receipt.pdf"');
    return res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Receipt PDF error:', error);
    return res.status(500).json({ error: 'Failed to generate receipt' });
  }
}
