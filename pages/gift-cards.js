import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect } from 'react';

export default function GiftCards() {
  useEffect(() => {
    // Create the embed div
    const container = document.getElementById('ghl-gift-card-container');
    if (container && !container.hasChildNodes()) {
      // Add the data-gc-id div
      const gcDiv = document.createElement('div');
      gcDiv.setAttribute('data-gc-id', '693c37bfbb0ac97ef238ff6a');
      container.appendChild(gcDiv);

      // Create and append the script
      const script = document.createElement('script');
      script.src = 'https://storage.googleapis.com/leadgen-payment-products-preview-nuxt-assets/js/iframe-resizer/gc-embed.parent.js';
      script.async = false;
      container.appendChild(script);
    }
  }, []);

  return (
    <Layout
      title="Gift Cards | Range Medical | Newport Beach"
      description="Give the gift of health and wellness. Range Medical gift cards for hormone therapy, weight loss, IV therapy, and more. Newport Beach. (949) 997-3988"
    >
      <Head>
        <meta name="keywords" content="gift card, health gift, wellness gift, hormone therapy gift, Newport Beach, Costa Mesa, Orange County" />
        <link rel="canonical" href="https://www.range-medical.com/gift-cards" />
        <meta property="og:title" content="Gift Cards | Range Medical" />
        <meta property="og:description" content="Give the gift of health and wellness. Range Medical gift cards for hormone therapy, weight loss, IV therapy, and more." />
        <meta property="og:url" content="https://www.range-medical.com/gift-cards" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "Range Medical Gift Card",
              "description": "Gift card for Range Medical services including hormone therapy, weight loss, IV therapy, and more.",
              "brand": {
                "@type": "Organization",
                "name": "Range Medical"
              },
              "offers": {
                "@type": "Offer",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              }
            })
          }}
        />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">5.0</span> on Google
          </span>
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">Board-Certified Providers</span>
        </div>
      </div>

      <div className="gc-page">
        {/* Hero */}
        <section className="gc-hero">
          <div className="v2-label"><span className="v2-dot" /> Gift Cards</div>
          <h1>GIVE THE GIFT OF FEELING AMAZING</h1>
          <div className="gc-hero-rule" />
          <p className="gc-body-text">Range Medical gift cards let someone you care about invest in their energy, vitality, and long-term health.</p>
        </section>

        {/* Gift Card Features */}
        <section className="gc-section gc-section-alt">
          <div className="gc-container">
            <div className="gc-features-row">
              <span className="gc-feature">Instant Email Delivery</span>
              <span className="gc-feature">Never Expires</span>
              <span className="gc-feature">Use for Any Service</span>
              <span className="gc-feature">Add a Personal Message</span>
            </div>
          </div>
        </section>

        {/* Gift Card Purchase Section */}
        <section className="gc-section">
          <div className="gc-container">
            <div className="gc-card-container">
              <div className="gc-card-header">
                <h2>PURCHASE A GIFT CARD</h2>
                <div className="gc-divider" />
                <p className="gc-body-text">Select an amount and send it instantly via email.</p>
              </div>
              <div className="gc-card-embed" id="ghl-gift-card-container">
                {/* GHL embed loads here via useEffect */}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="gc-section gc-section-alt">
          <div className="gc-container">
            <div className="v2-label"><span className="v2-dot" /> Why Gift Cards</div>
            <h2>A GIFT THAT ACTUALLY MATTERS</h2>
            <div className="gc-divider" />
            <p className="gc-body-text" style={{ marginBottom: '2.5rem' }}>Skip the stuff that collects dust. Give something that helps them feel their best.</p>

            <div className="gc-benefits-grid">
              <div className="gc-benefit-card">
                <div className="gc-benefit-number">01</div>
                <h3>Instant Delivery</h3>
                <p>Delivered immediately via email — perfect for last-minute gifts or special occasions.</p>
              </div>
              <div className="gc-benefit-card">
                <div className="gc-benefit-number">02</div>
                <h3>Flexible Use</h3>
                <p>Can be applied to any Range Medical service — labs, treatments, therapies, and more.</p>
              </div>
              <div className="gc-benefit-card">
                <div className="gc-benefit-number">03</div>
                <h3>Real Impact</h3>
                <p>Help someone you love take the first step toward feeling like themselves again.</p>
              </div>
            </div>

            <div className="gc-services-box">
              <h3>Gift Cards Can Be Used For:</h3>
              <div className="gc-services-grid">
                <div className="gc-service-item">Lab Panels (Essential & Elite)</div>
                <div className="gc-service-item">Hormone Therapy (HRT)</div>
                <div className="gc-service-item">Medical Weight Loss</div>
                <div className="gc-service-item">Peptide Therapy</div>
                <div className="gc-service-item">IV & Injection Therapy</div>
                <div className="gc-service-item">NAD+ Therapy</div>
                <div className="gc-service-item">Hyperbaric Oxygen (HBOT)</div>
                <div className="gc-service-item">Red Light Therapy</div>
                <div className="gc-service-item">Exosome Therapy</div>
                <div className="gc-service-item">PRP Treatments</div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="gc-section">
          <div className="gc-container">
            <div className="v2-label"><span className="v2-dot" /> How It Works</div>
            <h2>SIMPLE TO GIVE, EASY TO REDEEM</h2>
            <div className="gc-divider" />
            <p className="gc-body-text" style={{ marginBottom: '2.5rem' }}>Four easy steps from purchase to use.</p>

            <div className="gc-steps-container">
              <div className="gc-step-row">
                <div className="gc-step-number">1</div>
                <div className="gc-step-content">
                  <h3>Choose Your Amount</h3>
                  <p>Select the gift card value that fits your budget — any amount works.</p>
                </div>
              </div>
              <div className="gc-step-row">
                <div className="gc-step-number">2</div>
                <div className="gc-step-content">
                  <h3>Add Recipient Details</h3>
                  <p>Enter their email address and include a personal message to make it special.</p>
                </div>
              </div>
              <div className="gc-step-row">
                <div className="gc-step-number">3</div>
                <div className="gc-step-content">
                  <h3>They Get It Instantly</h3>
                  <p>The gift card is delivered directly to their inbox — ready to use right away.</p>
                </div>
              </div>
              <div className="gc-step-row">
                <div className="gc-step-number">4</div>
                <div className="gc-step-content">
                  <h3>They Book & Redeem</h3>
                  <p>They schedule their appointment and apply the gift card balance at checkout.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="gc-section gc-section-alt">
          <div className="gc-container">
            <div className="v2-label"><span className="v2-dot" /> Questions</div>
            <h2>GIFT CARD FAQS</h2>
            <div className="gc-divider" />

            <div className="gc-faq-container">
              <details className="gc-faq-item">
                <summary>Do gift cards expire?</summary>
                <p>No. Range Medical gift cards never expire. The recipient can use them whenever they're ready to start.</p>
              </details>
              <details className="gc-faq-item">
                <summary>Can gift cards be used for any service?</summary>
                <p>Yes! Gift cards can be applied to any service — lab panels, hormone therapy, weight loss programs, IV therapy, HBOT, and everything else we offer.</p>
              </details>
              <details className="gc-faq-item">
                <summary>How will the recipient receive the gift card?</summary>
                <p>Gift cards are delivered instantly via email to the recipient's email address. You can include a personalized message to make it special.</p>
              </details>
              <details className="gc-faq-item">
                <summary>Can I purchase a gift card for myself?</summary>
                <p>Absolutely. You can use your own email address and apply the gift card to future appointments.</p>
              </details>
              <details className="gc-faq-item">
                <summary>What if the service costs more than the gift card?</summary>
                <p>No problem — the recipient pays the remaining balance with another payment method at checkout.</p>
              </details>
              <details className="gc-faq-item">
                <summary>Are gift cards refundable?</summary>
                <p>Gift cards are non-refundable but never expire, so the recipient can use them any time.</p>
              </details>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="gc-section gc-section-inverted" style={{ textAlign: 'center' }}>
          <div className="gc-container">
            <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)', justifyContent: 'center', marginBottom: '1.5rem' }}><span className="v2-dot" /> Next Steps</div>
            <h2 style={{ color: '#fff' }}>QUESTIONS ABOUT GIFT CARDS?</h2>
            <div className="gc-divider" style={{ background: 'rgba(255,255,255,0.12)', margin: '1.25rem auto' }} />
            <p className="gc-body-text" style={{ color: 'rgba(255,255,255,0.55)', margin: '0 auto 2rem' }}>Our team is happy to help. Give us a call or stop by the clinic.</p>
            <p className="gc-cta-phone"><a href="tel:+19499973988">(949) 997-3988</a></p>
            <p className="gc-cta-location">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* ===== GIFT CARDS PAGE V2 SCOPED STYLES ===== */
        .gc-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          overflow-x: hidden;
        }

        /* Container */
        .gc-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Sections — V2: 6rem padding */
        .gc-section {
          padding: 6rem 2rem;
        }

        .gc-section-alt {
          background: #fafafa;
        }

        .gc-section-inverted {
          background: #1a1a1a;
          color: #ffffff;
        }

        /* Headlines — V2: uppercase, 900 weight, tight leading */
        .gc-page h1 {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.02em;
          color: #171717;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }

        .gc-page h2 {
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 0.95;
          color: #171717;
          margin-bottom: 1rem;
          text-transform: uppercase;
        }

        .gc-page h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        /* Body Text — V2: #737373 */
        .gc-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #737373;
          max-width: 600px;
        }

        /* Divider — V2: #e0e0e0 */
        .gc-divider {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin: 1.25rem 0;
        }

        /* Hero — V2: left-aligned, hairline rule */
        .gc-hero {
          padding: 6rem 2rem 5rem;
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 1200px;
          margin: 0 auto;
        }

        .gc-hero h1 {
          max-width: 680px;
        }

        .gc-hero-rule {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin-bottom: 1.5rem;
        }

        .gc-hero .gc-body-text {
          text-align: left;
          margin: 0;
        }

        /* Features Row (replaces old trust bar checkmarks) */
        .gc-features-row {
          display: flex;
          justify-content: center;
          gap: 2.5rem;
          flex-wrap: wrap;
        }

        .gc-feature {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #737373;
        }

        /* Gift Card Purchase */
        .gc-card-container {
          max-width: 700px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          padding: 2.5rem 2rem;
        }

        .gc-card-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .gc-card-header h2 {
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .gc-card-header .gc-divider {
          margin: 0.75rem auto;
        }

        .gc-card-header .gc-body-text {
          margin: 0 auto;
          text-align: center;
        }

        .gc-card-embed {
          min-height: 450px;
          width: 100%;
        }

        /* Benefits Grid — V2: no radius, hairline borders, no shadow */
        .gc-benefits-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          max-width: 900px;
          margin: 0 auto;
          border: 1px solid #e0e0e0;
        }

        .gc-benefit-card {
          background: #ffffff;
          border-right: 1px solid #e0e0e0;
          padding: 2rem;
          text-align: center;
        }

        .gc-benefit-card:last-child {
          border-right: none;
        }

        .gc-benefit-number {
          font-size: 2rem;
          font-weight: 900;
          color: #808080;
          margin-bottom: 1rem;
          letter-spacing: -0.03em;
        }

        .gc-benefit-card h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .gc-benefit-card p {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.6;
        }

        /* Services List — V2: no radius, hairline border */
        .gc-services-box {
          max-width: 800px;
          margin: 3rem auto 0;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          padding: 2rem;
        }

        .gc-services-box h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
          text-align: center;
        }

        .gc-services-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem 2rem;
        }

        .gc-service-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9375rem;
          color: #737373;
          padding: 0.5rem 0;
        }

        .gc-service-item::before {
          content: "\\2713";
          color: #808080;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* Steps — V2 style */
        .gc-steps-container {
          max-width: 700px;
          margin: 0 auto;
        }

        .gc-step-row {
          display: grid;
          grid-template-columns: 60px 1fr;
          gap: 1.5rem;
          padding: 1.5rem 0;
          border-bottom: 1px solid #e0e0e0;
          align-items: start;
        }

        .gc-step-row:last-child {
          border-bottom: none;
        }

        .gc-step-number {
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

        .gc-step-content h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.375rem;
        }

        .gc-step-content p {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.6;
        }

        /* FAQ — V2 style */
        .gc-faq-container {
          max-width: 700px;
          margin: 1rem auto 0;
        }

        .gc-faq-item {
          border-bottom: 1px solid #e0e0e0;
        }

        .gc-faq-item:first-child {
          border-top: 1px solid #e0e0e0;
        }

        .gc-faq-item summary {
          padding: 1.25rem 0;
          font-size: 1.0625rem;
          font-weight: 600;
          cursor: pointer;
          list-style: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .gc-faq-item summary::-webkit-details-marker {
          display: none;
        }

        .gc-faq-item summary::after {
          content: "+";
          font-size: 1.5rem;
          font-weight: 400;
          color: #737373;
        }

        .gc-faq-item[open] summary::after {
          content: "\\2212";
        }

        .gc-faq-item p {
          padding: 0 0 1.25rem 0;
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.7;
        }

        /* Final CTA */
        .gc-cta-phone {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .gc-cta-phone a {
          color: #ffffff;
          text-decoration: none;
        }

        .gc-cta-phone a:hover {
          text-decoration: underline;
        }

        .gc-cta-location {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.5);
        }

        /* Responsive */
        @media (max-width: 900px) {
          .gc-page h1 {
            font-size: 2rem;
          }

          .gc-benefits-grid {
            grid-template-columns: 1fr;
          }

          .gc-benefit-card {
            border-right: none;
            border-bottom: 1px solid #e0e0e0;
          }

          .gc-benefit-card:last-child {
            border-bottom: none;
          }

          .gc-services-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .gc-hero {
            padding: 4rem 1.5rem 3rem;
          }

          .gc-page h1 {
            font-size: 1.75rem;
          }

          .gc-section {
            padding: 4rem 1.5rem;
          }

          .gc-page h2 {
            font-size: 1.5rem;
          }

          .gc-features-row {
            gap: 1rem;
          }

          .gc-feature {
            font-size: 10px;
          }

          .gc-card-container {
            padding: 1.5rem 1rem;
          }

          .gc-step-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
      `}</style>
    </Layout>
  );
}
