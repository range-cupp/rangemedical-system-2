// /pages/invoice/[id].js
// Public-facing invoice payment page — Range Medical
// No auth required. Mobile-first design.

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1a1a1a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '::placeholder': { color: '#a0a0a0' },
    },
    invalid: { color: '#dc2626' },
  },
};

function PaymentForm({ invoice }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const total = (invoice.total_cents / 100).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const piRes = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: invoice.patient_id,
          amount: invoice.total_cents,
          description: `Invoice — ${invoice.items.map(i => i.name).join(', ')}`,
        }),
      });

      const piData = await piRes.json();
      if (!piRes.ok) throw new Error(piData.error || 'Could not create payment');

      // Confirm card payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        piData.client_secret,
        { payment_method: { card: elements.getElement(CardElement) } }
      );

      if (stripeError) throw new Error(stripeError.message);

      if (paymentIntent.status === 'succeeded') {
        // Complete the invoice
        await fetch(`/api/invoices/${invoice.id}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stripe_payment_intent_id: paymentIntent.id,
          }),
        });
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div style={styles.successContainer}>
        <div style={styles.successIcon}>✓</div>
        <h2 style={styles.successTitle}>Payment Received</h2>
        <p style={styles.successText}>Thank you! A receipt will be sent to your email.</p>
        <p style={styles.successAmount}>${total}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Patient & Items */}
      <div style={styles.section}>
        <p style={styles.patientName}>{invoice.patient_name}</p>
        <table style={styles.itemsTable}>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i}>
                <td style={styles.itemName}>{item.name}{item.quantity > 1 ? ` x${item.quantity}` : ''}</td>
                <td style={styles.itemPrice}>${(item.price_cents / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {invoice.discount_cents > 0 && (
          <div style={styles.discountRow}>
            <span>Discount{invoice.discount_description ? ` (${invoice.discount_description})` : ''}</span>
            <span style={{ color: '#16A34A' }}>-${(invoice.discount_cents / 100).toFixed(2)}</span>
          </div>
        )}

        <div style={styles.totalRow}>
          <span>Total</span>
          <span>${total}</span>
        </div>
      </div>

      {invoice.notes && (
        <div style={styles.notesSection}>
          <p style={styles.notesLabel}>Notes</p>
          <p style={styles.notesText}>{invoice.notes}</p>
        </div>
      )}

      {/* Card Input */}
      <div style={styles.cardSection}>
        <label style={styles.cardLabel}>Card Details</label>
        <div style={styles.cardInput}>
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          ...styles.payButton,
          opacity: processing ? 0.7 : 1,
        }}
      >
        {processing ? 'Processing...' : `Pay $${total}`}
      </button>
    </form>
  );
}

export default function InvoicePaymentPage() {
  const router = useRouter();
  const { id } = router.query;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/invoices/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.invoice) setInvoice(data.invoice);
        else setError('Invoice not found');
      })
      .catch(() => setError('Could not load invoice'))
      .finally(() => setLoading(false));
  }, [id]);

  const pageTitle = 'Invoice — Range Medical';

  if (loading) {
    return (
      <div style={styles.page}>
        <Head><title>{pageTitle}</title></Head>
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.logo}>RANGE MEDICAL</h1>
          </div>
          <div style={styles.body}>
            <p style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div style={styles.page}>
        <Head><title>{pageTitle}</title></Head>
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.logo}>RANGE MEDICAL</h1>
          </div>
          <div style={styles.body}>
            <p style={{ textAlign: 'center', color: '#dc2626', padding: '40px 0' }}>
              {error || 'Invoice not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check statuses
  if (invoice.status === 'paid') {
    return (
      <div style={styles.page}>
        <Head><title>{pageTitle}</title></Head>
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.logo}>RANGE MEDICAL</h1>
          </div>
          <div style={styles.body}>
            <div style={styles.successContainer}>
              <div style={styles.successIcon}>✓</div>
              <h2 style={styles.successTitle}>Invoice Paid</h2>
              <p style={styles.successText}>
                This invoice was paid on {new Date(invoice.paid_at).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}.
              </p>
              <p style={styles.successAmount}>${(invoice.total_cents / 100).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (invoice.status === 'expired' || invoice.status === 'cancelled') {
    return (
      <div style={styles.page}>
        <Head><title>{pageTitle}</title></Head>
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.logo}>RANGE MEDICAL</h1>
          </div>
          <div style={styles.body}>
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</p>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Invoice No Longer Valid</h2>
              <p style={{ color: '#666', fontSize: '14px' }}>
                This invoice has {invoice.status === 'expired' ? 'expired' : 'been cancelled'}. Please contact us at (949) 997-3988.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active invoice — show payment form
  return (
    <div style={styles.page}>
      <Head><title>{pageTitle}</title></Head>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.logo}>RANGE MEDICAL</h1>
          <p style={styles.headerSub}>Invoice</p>
        </div>
        <div style={styles.body}>
          {stripePromise ? (
            <Elements stripe={stripePromise}>
              <PaymentForm invoice={invoice} />
            </Elements>
          ) : (
            <p style={{ textAlign: 'center', color: '#dc2626', padding: '20px' }}>
              Payment system unavailable. Please call (949) 997-3988.
            </p>
          )}
        </div>
        <div style={styles.footer}>
          <p>Questions? Call <strong>(949) 997-3988</strong></p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
  },
  container: {
    width: '100%',
    maxWidth: '480px',
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    alignSelf: 'flex-start',
  },
  header: {
    background: '#000',
    padding: '28px 24px',
    textAlign: 'center',
  },
  logo: {
    margin: 0,
    color: '#fff',
    fontSize: '22px',
    fontWeight: '700',
    letterSpacing: '0.1em',
  },
  headerSub: {
    margin: '8px 0 0',
    color: '#a3a3a3',
    fontSize: '14px',
  },
  body: {
    padding: '24px',
  },
  section: {
    marginBottom: '24px',
  },
  patientName: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#1a1a1a',
  },
  itemsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '12px',
  },
  itemName: {
    padding: '8px 0',
    fontSize: '14px',
    color: '#333',
    borderBottom: '1px solid #f0f0f0',
  },
  itemPrice: {
    padding: '8px 0',
    fontSize: '14px',
    color: '#333',
    textAlign: 'right',
    borderBottom: '1px solid #f0f0f0',
  },
  discountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
    color: '#666',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0 0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a1a1a',
    borderTop: '2px solid #eee',
  },
  notesSection: {
    background: '#fafafa',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  notesLabel: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '4px',
    fontWeight: '600',
  },
  notesText: {
    fontSize: '14px',
    color: '#333',
    margin: 0,
  },
  cardSection: {
    marginBottom: '20px',
  },
  cardLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
  },
  cardInput: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '14px',
    background: '#fff',
  },
  error: {
    color: '#dc2626',
    fontSize: '13px',
    marginBottom: '12px',
    padding: '8px 12px',
    background: '#fef2f2',
    borderRadius: '6px',
  },
  payButton: {
    width: '100%',
    padding: '16px',
    background: '#16A34A',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #eee',
    textAlign: 'center',
    fontSize: '13px',
    color: '#888',
  },
  successContainer: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  successIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: '#16A34A',
    color: '#fff',
    fontSize: '32px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  successTitle: {
    fontSize: '22px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#1a1a1a',
  },
  successText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '16px',
  },
  successAmount: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#16A34A',
  },
};
