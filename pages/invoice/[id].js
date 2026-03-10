// /pages/invoice/[id].js
// Public-facing invoice payment page — Range Medical
// No auth required. Mobile-first design.
// Supports Apple Pay, Google Pay, Affirm, Klarna, and all Stripe payment methods.

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function PaymentForm({ invoice, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const total = (invoice.total_cents / 100).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      const baseUrl = window.location.origin;
      const returnUrl = `${baseUrl}/invoice/${invoice.id}`;

      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // If we reach here without redirect, payment succeeded inline (e.g., card, Apple Pay)
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        await fetch(`/api/invoices/${invoice.id}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stripe_payment_intent_id: paymentIntent.id,
          }),
        });
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

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

      {/* Payment Element — shows card, Apple Pay, Google Pay, Affirm, etc. */}
      <div style={styles.cardSection}>
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
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

function SuccessView({ invoice }) {
  const total = (invoice.total_cents / 100).toFixed(2);
  return (
    <div style={styles.successContainer}>
      <div style={styles.successIcon}>✓</div>
      <h2 style={styles.successTitle}>Payment Received</h2>
      <p style={styles.successText}>Thank you! A receipt will be sent to your email.</p>
      <p style={styles.successAmount}>${total}</p>
    </div>
  );
}

export default function InvoicePaymentPage() {
  const router = useRouter();
  const { id, payment_complete, payment_intent, redirect_status } = router.query;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [success, setSuccess] = useState(false);

  // Load invoice
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

  // Handle redirect return (from Affirm, Klarna, etc.)
  useEffect(() => {
    if (!payment_intent || !id) return;

    if (redirect_status === 'succeeded') {
      // Complete the invoice after redirect-based payment
      fetch(`/api/invoices/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stripe_payment_intent_id: payment_intent }),
      })
        .then(() => setSuccess(true))
        .catch(() => setSuccess(true)); // Still show success — payment went through on Stripe's side
    } else if (redirect_status === 'failed') {
      setError('Payment was not completed. Please try again.');
    }
  }, [payment_intent, redirect_status, id]);

  // Create payment intent once invoice is loaded
  useEffect(() => {
    // Allow payment for both 'pending' (just created) and 'sent' (delivered to patient) invoices
    const payableStatuses = ['pending', 'sent'];
    if (!invoice || !payableStatuses.includes(invoice.status) || clientSecret || success) return;

    const itemNames = Array.isArray(invoice.items)
      ? invoice.items.map(i => i.name).join(', ')
      : 'Medical services';

    fetch('/api/stripe/payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: invoice.patient_id,
        amount: invoice.total_cents,
        description: `Invoice — ${itemNames}`,
      }),
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => {
            throw new Error(data.error || `Server error (${res.status})`);
          });
        }
        return res.json();
      })
      .then(data => {
        if (data.client_secret) {
          setClientSecret(data.client_secret);
        } else {
          setError('Could not initialize payment. Please call (949) 997-3988.');
        }
      })
      .catch(err => {
        console.error('Payment init error:', err);
        setError('Could not initialize payment. Please call (949) 997-3988.');
      });
  }, [invoice, clientSecret, success]);

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

  if (error && !invoice) {
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

  // Paid
  if (invoice?.status === 'paid' || success) {
    return (
      <div style={styles.page}>
        <Head><title>{pageTitle}</title></Head>
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.logo}>RANGE MEDICAL</h1>
          </div>
          <div style={styles.body}>
            <SuccessView invoice={invoice} />
          </div>
        </div>
      </div>
    );
  }

  // Expired / Cancelled
  if (invoice?.status === 'expired' || invoice?.status === 'cancelled') {
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
          {stripePromise && clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#000000',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    borderRadius: '8px',
                  },
                },
              }}
            >
              <PaymentForm invoice={invoice} onSuccess={() => setSuccess(true)} />
            </Elements>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</p>
              <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '12px' }}>{error}</p>
              <p style={{ color: '#888', fontSize: '13px' }}>
                If this issue persists, please call <strong>(949) 997-3988</strong>.
              </p>
            </div>
          ) : !stripePromise ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</p>
              <p style={{ color: '#dc2626', fontSize: '14px' }}>
                Payment system unavailable. Please call (949) 997-3988.
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: '#888', fontSize: '14px' }}>Loading payment options...</p>
            </div>
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
