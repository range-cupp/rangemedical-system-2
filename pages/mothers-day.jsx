import Head from 'next/head';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function PaymentForm({ onSuccess, totalPaid, totalCredit }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || processing) return;
    setProcessing(true);
    setError(null);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/mothers-day?payment_complete=true`,
        },
        redirect: 'if_required',
      });

      if (stripeError) throw new Error(stripeError.message);
      if (paymentIntent?.status === 'succeeded') {
        await onSuccess(paymentIntent.id);
      } else {
        throw new Error('Payment was not completed. Please try again.');
      }
    } catch (err) {
      setError(err.message);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="md-stripe-wrap">
        <PaymentElement />
      </div>
      {error && <div className="md-error">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="md-submit-btn"
      >
        {processing ? 'Processing...' : `PAY $${totalPaid} — GET $${totalCredit} IN CREDIT`}
      </button>
    </form>
  );
}

export default function MothersDay() {
  const [formData, setFormData] = useState({
    purchaserName: '',
    purchaserEmail: '',
    purchaserPhone: '',
    isGift: false,
    recipientName: '',
    recipientEmail: '',
    sendType: 'now',
    quantity: 1
  });
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [step, setStep] = useState('info');
  const [clientSecret, setClientSecret] = useState(null);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const totalPaid = promoApplied ? 0 : formData.quantity * 300;
  const totalCredit = formData.quantity * 400;

  const updateField = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    if (!formData.purchaserName.trim() || !formData.purchaserEmail.trim()) {
      setError('Please fill in your name and email.');
      return;
    }
    if (formData.isGift && (!formData.recipientName.trim() || !formData.recipientEmail.trim())) {
      setError('Recipient name and email are required for gifts.');
      return;
    }
    setError('');
    setCreating(true);

    try {
      // If promo covers 100%, skip Stripe and go straight to purchase
      if (promoApplied) {
        const resp = await fetch('/api/mothers-day/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promo_code: promoCode,
            purchaser_name: formData.purchaserName,
            purchaser_email: formData.purchaserEmail,
            purchaser_phone: formData.purchaserPhone,
            is_gift: formData.isGift,
            recipient_name: formData.recipientName,
            recipient_email: formData.recipientEmail,
            send_type: formData.sendType,
            quantity: formData.quantity
          })
        });
        const data = await resp.json();
        if (!resp.ok) {
          setError(data.error || 'Something went wrong.');
          return;
        }
        setResult(data);
        setStep('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const nameParts = formData.purchaserName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || firstName;

      const res = await fetch('/api/stripe/service-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email: formData.purchaserEmail.trim(),
          phone: formData.purchaserPhone.trim(),
          amountCents: totalPaid * 100,
          productName: "Mother's Day Wellness Credit",
          description: `Mother's Day Wellness Credit — $${totalPaid} for $${totalCredit}`,
          serviceCategory: 'gift_card',
          serviceName: "Mother's Day Wellness Credit",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize payment');
      setClientSecret(data.clientSecret);
      setStep('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId) => {
    try {
      const resp = await fetch('/api/mothers-day/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_intent_id: paymentIntentId,
          purchaser_name: formData.purchaserName,
          purchaser_email: formData.purchaserEmail,
          purchaser_phone: formData.purchaserPhone,
          is_gift: formData.isGift,
          recipient_name: formData.recipientName,
          recipient_email: formData.recipientEmail,
          send_type: formData.sendType,
          quantity: formData.quantity
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || 'Payment succeeded but there was an issue creating your credit. Please call (949) 997-3988.');
        return;
      }
      setResult(data);
    } catch (err) {
      setError('Payment succeeded but there was a connection issue. Your credit will be created shortly. Call (949) 997-3988 if you need help.');
    }
    setStep('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Head>
        <title>Mother's Day Wellness Credit | Range Medical | Newport Beach</title>
        <meta name="description" content="Give Mom the gift of wellness. Pay $300, get $400 in credit toward any Range Medical service. Valid 12 months. Newport Beach, CA." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="mothers day gift, wellness gift, health gift card, Newport Beach, hormone therapy gift, IV therapy gift, Orange County" />
        <link rel="canonical" href="https://www.range-medical.com/mothers-day" />
        <meta property="og:title" content="Mother's Day Wellness Credit | Range Medical" />
        <meta property="og:description" content="Pay $300, get $400 in wellness credit. Good for any service. Valid 12 months." />
        <meta property="og:url" content="https://www.range-medical.com/mothers-day" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "Mother's Day Wellness Credit",
              "description": "Pay $300, get $400 in wellness credit toward any Range Medical service. Valid 12 months.",
              "brand": { "@type": "Organization", "name": "Range Medical" },
              "offers": {
                "@type": "Offer",
                "price": "300.00",
                "priceCurrency": "USD",
                "availability": "https://schema.org/LimitedAvailability",
                "validThrough": "2026-05-11"
              }
            })
          }}
        />
      </Head>

      <div className="md-page">
        <header className="md-header">
          <span className="md-logo">RANGE MEDICAL</span>
          <span className="md-badge">Mother's Day Special</span>
        </header>

        {result ? (
          <>
            <section className="md-hero">
              <h1>THANK YOU{result.is_gift ? '' : ', YOUR CREDIT IS READY'}</h1>
              <p className="md-subtitle">
                {result.is_gift
                  ? result.send_type === 'scheduled'
                    ? `Your gift will be delivered to ${result.recipient_name} on Mother's Day morning.`
                    : `Your gift has been sent to ${result.recipient_name}.`
                  : 'Present your code at your next Range Medical visit to use your wellness credit.'
                }
              </p>
            </section>

            <section className="md-main">
              <div className="md-confirm-card">
                <div className="md-confirm-header">
                  <p className="md-confirm-label">ORDER SUMMARY</p>
                </div>
                <div className="md-confirm-body">
                  <div className="md-confirm-row">
                    <span>Wellness Credit</span>
                    <span>{result.quantity} &times; $400</span>
                  </div>
                  <div className="md-confirm-row">
                    <span>Amount Paid</span>
                    <span>${result.total_paid}</span>
                  </div>
                  <div className="md-confirm-row">
                    <span>You Saved</span>
                    <span>${result.total_credit - result.total_paid}</span>
                  </div>
                  {result.is_gift && (
                    <div className="md-confirm-row">
                      <span>Gift To</span>
                      <span>{result.recipient_name}</span>
                    </div>
                  )}
                </div>

                {result.codes.map((code) => (
                  <div key={code} className="md-gift-card-visual">
                    <p className="md-gcv-label">MOTHER'S DAY</p>
                    <h2 className="md-gcv-title">WELLNESS CREDIT</h2>
                    <p className="md-gcv-amount">$400</p>
                    {result.is_gift && (
                      <p className="md-gcv-to">For {result.recipient_name}</p>
                    )}
                    <div className="md-gcv-code-box">
                      <p className="md-gcv-code-label">YOUR CODE</p>
                      <p className="md-gcv-code">{code}</p>
                    </div>
                    <p className="md-gcv-expires">Valid 12 months from purchase</p>
                  </div>
                ))}

                <div className="md-confirm-footer">
                  <p>A confirmation email has been sent to your inbox.</p>
                  <p style={{ marginTop: '16px' }}>
                    <strong>Ready to schedule?</strong> Call or text{' '}
                    <a href="tel:+19499973988" style={{ color: '#111', fontWeight: 600 }}>(949) 997-3988</a>
                  </p>
                </div>
              </div>
            </section>
          </>
        ) : step === 'payment' && clientSecret ? (
          <>
            <section className="md-hero">
              <h1>PAY $300, GET $400 IN WELLNESS CREDIT</h1>
              <p className="md-subtitle">
                Good for any Range Medical service. Gift it to Mom, or keep it for yourself. Ends Sunday night.
              </p>
            </section>

            <section className="md-main">
              <div className="md-form-card">
                <div className="md-form">
                  <div className="md-payment-header">
                    <span>{formData.purchaserName} — {formData.purchaserEmail}</span>
                    <button type="button" onClick={() => { setStep('info'); setClientSecret(null); }} className="md-back-link">Edit</button>
                  </div>

                  <div className="md-order-summary">
                    <div className="md-summary-row">
                      <span>You pay</span>
                      <span className="md-summary-value">${totalPaid}</span>
                    </div>
                    <div className="md-summary-row md-summary-highlight">
                      <span>{formData.isGift ? 'They get' : 'You get'}</span>
                      <span className="md-summary-value">${totalCredit} in wellness credit</span>
                    </div>
                    <div className="md-summary-row md-summary-savings">
                      <span>You save</span>
                      <span className="md-summary-value">${totalCredit - totalPaid}</span>
                    </div>
                  </div>

                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          borderRadius: '0px',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        },
                      },
                    }}
                  >
                    <PaymentForm onSuccess={handlePaymentSuccess} totalPaid={totalPaid} totalCredit={totalCredit} />
                  </Elements>

                  {error && <div className="md-error" style={{ marginTop: '16px' }}>{error}</div>}

                  <p className="md-form-note">
                    Non-refundable. Credit valid 12 months. Any service.
                  </p>
                </div>
              </div>

              <p className="md-contact">
                Questions? Call or text <a href="tel:+19499973988">(949) 997-3988</a>
              </p>
            </section>
          </>
        ) : (
          <>
            <section className="md-hero">
              <h1>PAY $300, GET $400 IN WELLNESS CREDIT</h1>
              <p className="md-subtitle">
                Good for any Range Medical service. Gift it to Mom, or keep it for yourself. Ends Sunday night.
              </p>
            </section>

            <section className="md-main">
              <div className="md-form-card">
                <form onSubmit={handleContinue} className="md-form">
                  <p className="md-form-section-label">YOUR INFORMATION</p>
                  <div className="md-form-row">
                    <div className="md-form-field">
                      <label className="md-label">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.purchaserName}
                        onChange={updateField('purchaserName')}
                        className="md-input"
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div className="md-form-field">
                      <label className="md-label">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.purchaserEmail}
                        onChange={updateField('purchaserEmail')}
                        className="md-input"
                        placeholder="jane@email.com"
                      />
                    </div>
                  </div>
                  <div className="md-form-row">
                    <div className="md-form-field">
                      <label className="md-label">Phone (optional)</label>
                      <input
                        type="tel"
                        value={formData.purchaserPhone}
                        onChange={updateField('purchaserPhone')}
                        className="md-input"
                        placeholder="(555) 555-5555"
                      />
                    </div>
                    <div className="md-form-field" />
                  </div>

                  <p className="md-form-section-label">WHO IS THIS FOR?</p>
                  <div className="md-radio-group">
                    <label className={`md-radio-option${!formData.isGift ? ' md-radio-selected' : ''}`}>
                      <input
                        type="radio"
                        name="isGift"
                        checked={!formData.isGift}
                        onChange={() => setFormData(prev => ({ ...prev, isGift: false }))}
                      />
                      <span className="md-radio-dot" />
                      <span>For me</span>
                    </label>
                    <label className={`md-radio-option${formData.isGift ? ' md-radio-selected' : ''}`}>
                      <input
                        type="radio"
                        name="isGift"
                        checked={formData.isGift}
                        onChange={() => setFormData(prev => ({ ...prev, isGift: true }))}
                      />
                      <span className="md-radio-dot" />
                      <span>Gift for someone</span>
                    </label>
                  </div>

                  {formData.isGift && (
                    <>
                      <p className="md-form-section-label">RECIPIENT INFORMATION</p>
                      <div className="md-form-row">
                        <div className="md-form-field">
                          <label className="md-label">Recipient Name *</label>
                          <input
                            type="text"
                            required={formData.isGift}
                            value={formData.recipientName}
                            onChange={updateField('recipientName')}
                            className="md-input"
                            placeholder="Mom's name"
                          />
                        </div>
                        <div className="md-form-field">
                          <label className="md-label">Recipient Email *</label>
                          <input
                            type="email"
                            required={formData.isGift}
                            value={formData.recipientEmail}
                            onChange={updateField('recipientEmail')}
                            className="md-input"
                            placeholder="mom@email.com"
                          />
                        </div>
                      </div>

                      <p className="md-form-section-label">WHEN SHOULD WE SEND THE GIFT?</p>
                      <div className="md-radio-group">
                        <label className={`md-radio-option${formData.sendType === 'now' ? ' md-radio-selected' : ''}`}>
                          <input
                            type="radio"
                            name="sendType"
                            checked={formData.sendType === 'now'}
                            onChange={() => setFormData(prev => ({ ...prev, sendType: 'now' }))}
                          />
                          <span className="md-radio-dot" />
                          <span>Send right away</span>
                        </label>
                        <label className={`md-radio-option${formData.sendType === 'scheduled' ? ' md-radio-selected' : ''}`}>
                          <input
                            type="radio"
                            name="sendType"
                            checked={formData.sendType === 'scheduled'}
                            onChange={() => setFormData(prev => ({ ...prev, sendType: 'scheduled' }))}
                          />
                          <span className="md-radio-dot" />
                          <span>Deliver on Mother's Day morning (7 AM)</span>
                        </label>
                      </div>
                    </>
                  )}

                  <p className="md-form-section-label">QUANTITY</p>
                  <div className="md-form-row">
                    <div className="md-form-field" style={{ maxWidth: '200px' }}>
                      <select
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                        className="md-input"
                      >
                        <option value={1}>1 Wellness Credit</option>
                        <option value={2}>2 Wellness Credits</option>
                      </select>
                    </div>
                  </div>

                  {/* Promo Code */}
                  <div className="md-promo-row">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoApplied(false); }}
                      className="md-input md-promo-input"
                      placeholder="Promo code"
                    />
                    <button
                      type="button"
                      className="md-promo-btn"
                      onClick={async () => {
                        if (!promoCode.trim()) return;
                        try {
                          const r = await fetch('/api/mothers-day/check-promo?code=' + encodeURIComponent(promoCode.trim()));
                          const d = await r.json();
                          if (d.valid) {
                            setPromoApplied(true);
                            setError('');
                          } else {
                            setPromoApplied(false);
                            setError(d.error || 'Invalid promo code.');
                          }
                        } catch {
                          setError('Could not verify promo code.');
                        }
                      }}
                    >
                      Apply
                    </button>
                    {promoApplied && <span className="md-promo-ok">Applied</span>}
                  </div>

                  <div className="md-order-summary">
                    <div className="md-summary-row">
                      <span>You pay</span>
                      <span className="md-summary-value">{promoApplied ? <><s style={{ color: '#999', fontWeight: 400 }}>${formData.quantity * 300}</s> $0</> : `$${totalPaid}`}</span>
                    </div>
                    <div className="md-summary-row md-summary-highlight">
                      <span>{formData.isGift ? 'They get' : 'You get'}</span>
                      <span className="md-summary-value">${totalCredit} in wellness credit</span>
                    </div>
                    {!promoApplied && (
                      <div className="md-summary-row md-summary-savings">
                        <span>You save</span>
                        <span className="md-summary-value">${totalCredit - totalPaid}</span>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="md-error">{error}</div>
                  )}

                  <button
                    type="submit"
                    disabled={creating}
                    className="md-submit-btn"
                  >
                    {creating ? 'Loading...' : promoApplied ? 'COMPLETE ORDER — FREE' : `CONTINUE TO PAYMENT — $${totalPaid}`}
                  </button>

                  <p className="md-form-note">
                    Non-refundable. Credit valid 12 months. Any service.
                  </p>
                </form>
              </div>

              <p className="md-contact">
                Questions? Call or text <a href="tel:+19499973988">(949) 997-3988</a>
              </p>
            </section>
          </>
        )}
      </div>

      <style jsx>{`
        .md-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          min-height: 100vh;
        }

        .md-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 32px;
          border-bottom: 1px solid #f0f0f0;
        }

        .md-logo {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 3px;
          color: #111;
        }

        .md-badge {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #999;
        }

        .md-hero {
          text-align: center;
          padding: 4rem 2rem 2rem;
          max-width: 640px;
          margin: 0 auto;
        }

        .md-hero h1 {
          font-size: clamp(1.75rem, 5vw, 2.5rem);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: #111;
          margin: 0 0 1rem;
        }

        .md-subtitle {
          font-size: 1.0625rem;
          color: #666;
          line-height: 1.6;
          margin: 0;
        }

        .md-main {
          max-width: 640px;
          margin: 0 auto;
          padding: 2rem 1.5rem 4rem;
        }

        .md-form-card {
          border: 1px solid #e0e0e0;
          background: #fff;
        }

        .md-form {
          padding: 2rem;
        }

        .md-form-section-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #999;
          text-transform: uppercase;
          margin: 28px 0 12px;
        }

        .md-form-section-label:first-child {
          margin-top: 0;
        }

        .md-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 12px;
        }

        .md-form-field {
          display: flex;
          flex-direction: column;
        }

        .md-label {
          font-size: 13px;
          font-weight: 600;
          color: #333;
          margin-bottom: 6px;
        }

        .md-input {
          padding: 12px 14px;
          border: 1px solid #e0e0e0;
          font-size: 15px;
          font-family: inherit;
          color: #111;
          background: #fff;
          outline: none;
          transition: border-color 0.2s;
          -webkit-appearance: none;
          border-radius: 0;
        }

        .md-input:focus {
          border-color: #1a1a1a;
        }

        .md-input::placeholder {
          color: #bbb;
        }

        select.md-input {
          cursor: pointer;
        }

        .md-radio-group {
          display: flex;
          gap: 0;
          border: 1px solid #e0e0e0;
        }

        .md-radio-option {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          cursor: pointer;
          font-size: 14px;
          color: #444;
          border-right: 1px solid #e0e0e0;
          transition: background 0.15s;
        }

        .md-radio-option:last-child {
          border-right: none;
        }

        .md-radio-option:hover {
          background: #fafafa;
        }

        .md-radio-selected {
          background: #f5f5f5;
          color: #111;
          font-weight: 600;
        }

        .md-radio-option input {
          display: none;
        }

        .md-radio-dot {
          width: 18px;
          height: 18px;
          border: 2px solid #ccc;
          border-radius: 50%;
          flex-shrink: 0;
          position: relative;
        }

        .md-radio-selected .md-radio-dot {
          border-color: #1a1a1a;
        }

        .md-radio-selected .md-radio-dot::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 8px;
          height: 8px;
          background: #1a1a1a;
          border-radius: 50%;
        }

        .md-promo-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 24px 0 0;
        }

        .md-promo-input {
          flex: 1;
          max-width: 200px;
          font-size: 13px !important;
          padding: 10px 12px !important;
          letter-spacing: 1px;
        }

        .md-promo-btn {
          padding: 10px 16px;
          background: #f5f5f5;
          border: 1px solid #e0e0e0;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          color: #333;
        }

        .md-promo-btn:hover {
          background: #eee;
        }

        .md-promo-ok {
          font-size: 13px;
          font-weight: 600;
          color: #2E6B35;
        }

        .md-order-summary {
          background: #fafafa;
          border: 1px solid #e0e0e0;
          padding: 0;
          margin: 28px 0 20px;
        }

        .md-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          font-size: 14px;
          color: #666;
          border-bottom: 1px solid #eee;
        }

        .md-summary-row:last-child { border-bottom: none; }

        .md-summary-value {
          font-weight: 600;
          color: #111;
        }

        .md-summary-highlight {
          background: #fff;
          font-weight: 600;
          color: #111;
          font-size: 16px;
        }

        .md-summary-highlight .md-summary-value {
          font-size: 16px;
          font-weight: 800;
        }

        .md-summary-savings .md-summary-value {
          color: #2E6B35;
          font-weight: 700;
        }

        .md-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 12px 16px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .md-submit-btn {
          display: block;
          width: 100%;
          padding: 18px 24px;
          background: #1a1a1a;
          color: #fff;
          border: none;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 1px;
          cursor: pointer;
          font-family: inherit;
          text-transform: uppercase;
          transition: background 0.2s;
        }

        .md-submit-btn:hover:not(:disabled) {
          background: #333;
        }

        .md-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .md-form-note {
          font-size: 12px;
          color: #999;
          text-align: center;
          margin: 16px 0 0;
          line-height: 1.5;
        }

        .md-contact {
          text-align: center;
          font-size: 14px;
          color: #999;
          margin: 2rem 0 0;
        }

        .md-contact a {
          color: #111;
          font-weight: 600;
          text-decoration: none;
        }

        .md-contact a:hover {
          text-decoration: underline;
        }

        /* Payment step */
        .md-payment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #fafafa;
          border: 1px solid #e0e0e0;
          margin-bottom: 20px;
          font-size: 14px;
          color: #444;
        }

        .md-back-link {
          background: none;
          border: none;
          color: #111;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          font-family: inherit;
          padding: 0;
        }

        /* ── Success / Confirmation ── */
        .md-confirm-card {
          border: 1px solid #e0e0e0;
          background: #fff;
        }

        .md-confirm-header {
          padding: 16px 24px;
          border-bottom: 1px solid #e0e0e0;
          background: #fafafa;
        }

        .md-confirm-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #999;
          margin: 0;
        }

        .md-confirm-body { padding: 0; }

        .md-confirm-row {
          display: flex;
          justify-content: space-between;
          padding: 14px 24px;
          font-size: 14px;
          color: #444;
          border-bottom: 1px solid #f0f0f0;
        }

        .md-confirm-row span:last-child {
          font-weight: 600;
          color: #111;
        }

        .md-confirm-footer {
          padding: 24px;
          text-align: center;
          font-size: 14px;
          color: #666;
          line-height: 1.6;
          border-top: 1px solid #e0e0e0;
        }

        .md-gift-card-visual {
          background: #1a1a1a;
          padding: 36px 32px;
          text-align: center;
        }

        .md-gcv-label {
          font-size: 11px;
          color: #808080;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin: 0 0 4px;
        }

        .md-gcv-title {
          font-size: 22px;
          color: #fff !important;
          font-weight: 900;
          letter-spacing: 1px;
          margin: 0 0 14px;
          text-transform: uppercase;
        }

        .md-gcv-amount {
          font-size: 42px;
          color: #fff;
          font-weight: 900;
          margin: 0 0 16px;
        }

        .md-gcv-to {
          font-size: 14px;
          color: #aaa;
          margin: 0 0 20px;
        }

        .md-gcv-code-box {
          display: inline-block;
          padding: 14px 24px;
          background: rgba(255,255,255,0.08);
          border-radius: 4px;
          margin: 0 0 12px;
        }

        .md-gcv-code-label {
          font-size: 10px;
          color: #808080;
          letter-spacing: 1px;
          margin: 0 0 4px;
          text-transform: uppercase;
        }

        .md-gcv-code {
          font-size: 24px;
          color: #fff;
          font-weight: 700;
          letter-spacing: 3px;
          font-family: monospace;
          margin: 0;
        }

        .md-gcv-expires {
          font-size: 12px;
          color: #606060;
          margin: 0;
        }

        @media (max-width: 640px) {
          .md-header { padding: 16px 20px; }
          .md-hero { padding: 3rem 1.5rem 1.5rem; }
          .md-hero h1 { font-size: 1.5rem; }
          .md-main { padding: 1.5rem 1rem 3rem; }
          .md-form { padding: 1.5rem; }
          .md-form-row { grid-template-columns: 1fr; }
          .md-radio-group { flex-direction: column; }
          .md-radio-option { border-right: none; border-bottom: 1px solid #e0e0e0; }
          .md-radio-option:last-child { border-bottom: none; }
          .md-gcv-amount { font-size: 32px; }
          .md-gcv-code { font-size: 18px; }
        }
      `}</style>

      <style jsx global>{`
        .md-stripe-wrap {
          margin-bottom: 20px;
        }
      `}</style>
    </>
  );
}
