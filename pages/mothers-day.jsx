import Layout from '../components/Layout';
import Head from 'next/head';
import { useState } from 'react';

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
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const totalPaid = formData.quantity * 300;
  const totalCredit = formData.quantity * 400;

  const updateField = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const resp = await fetch('/api/mothers-day/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError('Connection error. Please try again or call us at (949) 997-3988.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout
      title="Mother's Day Wellness Credit | Range Medical | Newport Beach"
      description="Give Mom the gift of wellness. Pay $300, get $400 in credit toward any Range Medical service. Valid 12 months. Newport Beach, CA."
    >
      <Head>
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

      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item"><span className="trust-rating">5.0</span> on Google</span>
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">Board-Certified Providers</span>
        </div>
      </div>

      <div className="md-page">
        {result ? (
          <>
            {/* ── Success View ── */}
            <section className="md-hero">
              <div className="v2-label"><span className="v2-dot" /> Order Confirmed</div>
              <h1>THANK YOU{result.is_gift ? '' : ', YOUR CREDIT IS READY'}</h1>
              <div className="md-hero-rule" />
              <p className="md-body-text">
                {result.is_gift
                  ? result.send_type === 'scheduled'
                    ? `Your gift will be delivered to ${result.recipient_name} on Mother's Day morning.`
                    : `Your gift has been sent to ${result.recipient_name}.`
                  : 'Present your code at your next Range Medical visit to use your wellness credit.'
                }
              </p>
            </section>

            <section className="md-section">
              <div className="md-container">
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

                  {result.codes.map((code, i) => (
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
              </div>
            </section>
          </>
        ) : (
          <>
            {/* ── Hero ── */}
            <section className="md-hero">
              <div className="v2-label"><span className="v2-dot" /> Mother's Day Special</div>
              <h1>GIVE HER THE GIFT OF FEELING AMAZING</h1>
              <div className="md-hero-rule" />
              <p className="md-body-text">Pay $300. She gets $400 in wellness credit toward any Range Medical service.</p>
              <a
                href="#purchase-form"
                className="md-hero-cta"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('purchase-form').scrollIntoView({ behavior: 'smooth' });
                }}
              >
                GET YOUR WELLNESS CREDIT
              </a>
            </section>

            {/* ── Features ── */}
            <section className="md-section md-section-alt">
              <div className="md-container">
                <div className="md-features-row">
                  <span className="md-feature">$400 IN CREDIT</span>
                  <span className="md-feature">ANY SERVICE</span>
                  <span className="md-feature">VALID 12 MONTHS</span>
                  <span className="md-feature">MAX 2 PER PERSON</span>
                </div>
              </div>
            </section>

            {/* ── Purchase Form ── */}
            <section className="md-section" id="purchase-form">
              <div className="md-container">
                <div className="md-form-card">
                  <div className="md-form-header">
                    <h2>PURCHASE WELLNESS CREDIT</h2>
                    <div className="md-divider" />
                    <p className="md-body-text" style={{ margin: '0 auto', textAlign: 'center' }}>
                      Pay $300 per credit, get $400 in value. Limit 2.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="md-form">
                    {/* Purchaser Info */}
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

                    {/* Gift Toggle */}
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
                        <span>Gift for a mom / mother figure</span>
                      </label>
                    </div>

                    {/* Recipient Info (conditional) */}
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

                    {/* Quantity */}
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

                    {/* Order Summary */}
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

                    {error && (
                      <div className="md-error">{error}</div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="md-submit-btn"
                    >
                      {submitting ? 'Processing...' : `Complete Purchase — $${totalPaid}`}
                    </button>

                    <p className="md-form-note">
                      Non-refundable. Credit valid 12 months. Cannot be used for other gift cards.
                    </p>
                  </form>
                </div>
              </div>
            </section>

            {/* ── What It Covers ── */}
            <section className="md-section md-section-alt">
              <div className="md-container">
                <div className="v2-label"><span className="v2-dot" /> Use It For</div>
                <h2>GOOD FOR ANY RANGE MEDICAL SERVICE</h2>
                <div className="md-divider" />
                <div className="md-services-grid">
                  <div className="md-service-item">IV Therapy &amp; NAD+</div>
                  <div className="md-service-item">Red Light Therapy</div>
                  <div className="md-service-item">Hyperbaric Oxygen (HBOT)</div>
                  <div className="md-service-item">Lab Panels</div>
                  <div className="md-service-item">Hormone Therapy (HRT)</div>
                  <div className="md-service-item">Medical Weight Loss</div>
                  <div className="md-service-item">Peptide Therapy</div>
                  <div className="md-service-item">PRP &amp; Exosome Treatments</div>
                  <div className="md-service-item">Injections (B12, Glutathione, etc.)</div>
                  <div className="md-service-item">And more</div>
                </div>
              </div>
            </section>

            {/* ── How It Works ── */}
            <section className="md-section">
              <div className="md-container">
                <div className="v2-label"><span className="v2-dot" /> How It Works</div>
                <h2>THREE SIMPLE STEPS</h2>
                <div className="md-divider" />
                <div className="md-steps">
                  <div className="md-step-row">
                    <div className="md-step-number">1</div>
                    <div className="md-step-content">
                      <h3>Purchase Your Credit</h3>
                      <p>Pay $300 and receive $400 in wellness credit. Buy up to 2.</p>
                    </div>
                  </div>
                  <div className="md-step-row">
                    <div className="md-step-number">2</div>
                    <div className="md-step-content">
                      <h3>Receive Your Code</h3>
                      <p>A unique gift code is emailed instantly. If it's a gift, you can send it right away or schedule it for Mother's Day morning.</p>
                    </div>
                  </div>
                  <div className="md-step-row">
                    <div className="md-step-number">3</div>
                    <div className="md-step-content">
                      <h3>Use It at Any Visit</h3>
                      <p>Mention the code at check-in. Credit applies to any service and carries over until the balance reaches $0.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── FAQ ── */}
            <section className="md-section md-section-alt">
              <div className="md-container">
                <div className="v2-label"><span className="v2-dot" /> Questions</div>
                <h2>COMMON QUESTIONS</h2>
                <div className="md-divider" />
                <div className="md-faq">
                  <details className="md-faq-item">
                    <summary>How long is the credit valid?</summary>
                    <p>Your wellness credit is valid for 12 months from the date of purchase.</p>
                  </details>
                  <details className="md-faq-item">
                    <summary>Can I use it across multiple visits?</summary>
                    <p>Yes. Your credit carries over from visit to visit until the balance reaches $0.</p>
                  </details>
                  <details className="md-faq-item">
                    <summary>What if my visit costs more than my credit?</summary>
                    <p>No problem. Your credit is applied first, and you pay the remaining balance with another payment method.</p>
                  </details>
                  <details className="md-faq-item">
                    <summary>Can I buy this for myself?</summary>
                    <p>Absolutely. Select "For me" during checkout and the credit goes straight to your account.</p>
                  </details>
                  <details className="md-faq-item">
                    <summary>Is this refundable?</summary>
                    <p>Wellness credits are non-refundable but are valid for a full 12 months on any service.</p>
                  </details>
                  <details className="md-faq-item">
                    <summary>How many can I buy?</summary>
                    <p>Up to 2 per person.</p>
                  </details>
                </div>
              </div>
            </section>

            {/* ── CTA Footer ── */}
            <section className="md-section md-section-dark" style={{ textAlign: 'center' }}>
              <div className="md-container">
                <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <span className="v2-dot" /> Questions?
                </div>
                <h2 style={{ color: '#fff' }}>WE'RE HERE TO HELP</h2>
                <div className="md-divider" style={{ background: 'rgba(255,255,255,0.12)', margin: '1.25rem auto' }} />
                <p className="md-body-text" style={{ color: 'rgba(255,255,255,0.55)', margin: '0 auto 2rem' }}>
                  Call or text us anytime. We're happy to answer questions about the promo or help you choose the right services.
                </p>
                <p className="md-cta-phone"><a href="tel:+19499973988">(949) 997-3988</a></p>
                <p className="md-cta-location">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
              </div>
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
          overflow-x: clip;
        }

        .md-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Sections */
        .md-section { padding: 6rem 2rem; }
        .md-section-alt { background: #fafafa; }
        .md-section-dark { background: #1a1a1a; color: #fff; }

        /* Typography */
        .md-page h1 {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.02em;
          color: #171717;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }

        .md-page h2 {
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 0.95;
          color: #171717;
          margin-bottom: 1rem;
          text-transform: uppercase;
        }

        .md-page h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        .md-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #737373;
          max-width: 600px;
        }

        .md-divider {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin: 1.25rem 0;
        }

        /* Hero */
        .md-hero {
          padding: 6rem 2rem 5rem;
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 1200px;
          margin: 0 auto;
        }

        .md-hero h1 { max-width: 680px; }

        .md-hero-rule {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin-bottom: 1.5rem;
        }

        .md-hero .md-body-text { margin: 0 0 2rem; }

        .md-hero-cta {
          display: inline-block;
          background: #1a1a1a;
          color: #fff;
          padding: 16px 36px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 2px;
          text-decoration: none;
          text-transform: uppercase;
          transition: background 0.2s;
        }

        .md-hero-cta:hover { background: #333; }

        /* Features Row */
        .md-features-row {
          display: flex;
          justify-content: center;
          gap: 2.5rem;
          flex-wrap: wrap;
        }

        .md-feature {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #737373;
        }

        /* Form Card */
        .md-form-card {
          max-width: 640px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #e0e0e0;
        }

        .md-form-header {
          text-align: center;
          padding: 2.5rem 2rem 0;
        }

        .md-form-header h2 {
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .md-form-header .md-divider {
          margin: 0.75rem auto;
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

        /* Radio Group */
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

        /* Order Summary */
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

        /* Error */
        .md-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 12px 16px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        /* Submit Button */
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

        /* Services Grid */
        .md-services-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem 2rem;
          max-width: 700px;
          margin: 2rem auto 0;
        }

        .md-service-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9375rem;
          color: #737373;
          padding: 0.5rem 0;
        }

        .md-service-item::before {
          content: "✓";
          color: #808080;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* Steps */
        .md-steps {
          max-width: 700px;
          margin: 2rem auto 0;
        }

        .md-step-row {
          display: grid;
          grid-template-columns: 60px 1fr;
          gap: 1.5rem;
          padding: 1.5rem 0;
          border-bottom: 1px solid #e0e0e0;
          align-items: start;
        }

        .md-step-row:last-child { border-bottom: none; }

        .md-step-number {
          width: 50px;
          height: 50px;
          background: #1a1a1a;
          color: #808080;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 900;
        }

        .md-step-content h3 {
          margin-bottom: 0.375rem;
        }

        .md-step-content p {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.6;
        }

        /* FAQ */
        .md-faq {
          max-width: 700px;
          margin: 1rem auto 0;
        }

        .md-faq-item {
          border-bottom: 1px solid #e0e0e0;
        }

        .md-faq-item:first-child {
          border-top: 1px solid #e0e0e0;
        }

        .md-faq-item summary {
          padding: 1.25rem 0;
          font-size: 1.0625rem;
          font-weight: 600;
          cursor: pointer;
          list-style: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .md-faq-item summary::-webkit-details-marker { display: none; }

        .md-faq-item summary::after {
          content: "+";
          font-size: 1.5rem;
          font-weight: 400;
          color: #737373;
        }

        .md-faq-item[open] summary::after {
          content: "−";
        }

        .md-faq-item p {
          padding: 0 0 1.25rem;
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.7;
        }

        /* CTA Footer */
        .md-cta-phone {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .md-cta-phone a {
          color: #fff;
          text-decoration: none;
        }

        .md-cta-phone a:hover { text-decoration: underline; }

        .md-cta-location {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.5);
        }

        /* ── Success / Confirmation Styles ── */
        .md-confirm-card {
          max-width: 560px;
          margin: 0 auto;
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

        /* Gift Card Visual */
        .md-gift-card-visual {
          background: #1a1a1a;
          padding: 36px 32px;
          text-align: center;
          margin: 0;
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

        /* Print styles */
        @media print {
          .md-hero, .md-section, .md-confirm-footer { display: none; }
          .md-confirm-card { border: none; max-width: 100%; }
          .md-gift-card-visual { break-inside: avoid; }
        }

        /* Responsive */
        @media (max-width: 900px) {
          .md-page h1 { font-size: 2rem; }
          .md-services-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 640px) {
          .md-hero { padding: 4rem 1.5rem 3rem; }
          .md-page h1 { font-size: 1.75rem; }
          .md-section { padding: 4rem 1.5rem; }
          .md-page h2 { font-size: 1.5rem; }
          .md-features-row { gap: 1rem; }
          .md-feature { font-size: 10px; }
          .md-form { padding: 1.5rem; }
          .md-form-row { grid-template-columns: 1fr; }
          .md-radio-group { flex-direction: column; }
          .md-radio-option { border-right: none; border-bottom: 1px solid #e0e0e0; }
          .md-radio-option:last-child { border-bottom: none; }
          .md-step-row { grid-template-columns: 1fr; gap: 1rem; }
          .md-gcv-amount { font-size: 32px; }
          .md-gcv-code { font-size: 18px; }
        }
      `}</style>
    </Layout>
  );
}
