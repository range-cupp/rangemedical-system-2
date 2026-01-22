import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import Script from 'next/script';

export default function GiftCards() {
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

      {/* Holiday Banner */}
      <div className="holiday-banner">
        <p>🎁 <strong>The Perfect Holiday Gift</strong> — Give the gift of health this season</p>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="hero-icon">🎁</div>
        <h1>Give the Gift of Feeling Amazing</h1>
        <p className="hero-sub">Range Medical gift cards let someone you care about invest in their energy, vitality, and long-term health.</p>
      </section>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">✓ Instant Email Delivery</span>
          <span className="trust-item">✓ Never Expires</span>
          <span className="trust-item">✓ Use for Any Service</span>
          <span className="trust-item">✓ Add a Personal Message</span>
        </div>
      </div>

      {/* Gift Card Purchase Section */}
      <section className="gift-card-section">
        <div className="container">
          <div className="gift-card-container">
            <div className="gift-card-header">
              <h2>Purchase a Gift Card</h2>
              <p>Select an amount and send it instantly via email.</p>
            </div>
            <div className="gift-card-embed">
              {/* Embedded Gift Card Live Mode Checkout */}
              <div data-gc-id="693c37bfbb0ac97ef238ff6a"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Why Gift Cards</div>
          <h2 className="section-title">A Gift That Actually Matters</h2>
          <p className="section-subtitle">Skip the stuff that collects dust. Give something that helps them feel their best.</p>
          
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">⚡</div>
              <h3>Instant Delivery</h3>
              <p>Delivered immediately via email—perfect for last-minute gifts or special occasions.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🎯</div>
              <h3>Flexible Use</h3>
              <p>Can be applied to any Range Medical service—labs, treatments, therapies, and more.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">❤️</div>
              <h3>Real Impact</h3>
              <p>Help someone you love take the first step toward feeling like themselves again.</p>
            </div>
          </div>
          
          <div className="services-box">
            <h3>Gift Cards Can Be Used For:</h3>
            <div className="services-grid">
              <div className="service-item">Lab Panels (Essential & Elite)</div>
              <div className="service-item">Hormone Therapy (HRT)</div>
              <div className="service-item">Medical Weight Loss</div>
              <div className="service-item">Peptide Therapy</div>
              <div className="service-item">IV & Injection Therapy</div>
              <div className="service-item">NAD+ Therapy</div>
              <div className="service-item">Hyperbaric Oxygen (HBOT)</div>
              <div className="service-item">Red Light Therapy</div>
              <div className="service-item">Exosome Therapy</div>
              <div className="service-item">PRP Treatments</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">How It Works</div>
          <h2 className="section-title">Simple to Give, Easy to Redeem</h2>
          <p className="section-subtitle">Four easy steps from purchase to use.</p>
          
          <div className="steps-container">
            <div className="step-row">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Choose Your Amount</h3>
                <p>Select the gift card value that fits your budget—any amount works.</p>
              </div>
            </div>
            <div className="step-row">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Add Recipient Details</h3>
                <p>Enter their email address and include a personal message to make it special.</p>
              </div>
            </div>
            <div className="step-row">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>They Get It Instantly</h3>
                <p>The gift card is delivered directly to their inbox—ready to use right away.</p>
              </div>
            </div>
            <div className="step-row">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>They Book & Redeem</h3>
                <p>They schedule their appointment and apply the gift card balance at checkout.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Questions</div>
          <h2 className="section-title">Gift Card FAQs</h2>
          
          <div className="faq-container">
            <details className="faq-item">
              <summary>Do gift cards expire?</summary>
              <p>No. Range Medical gift cards never expire. The recipient can use them whenever they're ready to start.</p>
            </details>
            <details className="faq-item">
              <summary>Can gift cards be used for any service?</summary>
              <p>Yes! Gift cards can be applied to any service—lab panels, hormone therapy, weight loss programs, IV therapy, HBOT, and everything else we offer.</p>
            </details>
            <details className="faq-item">
              <summary>How will the recipient receive the gift card?</summary>
              <p>Gift cards are delivered instantly via email to the recipient's email address. You can include a personalized message to make it special.</p>
            </details>
            <details className="faq-item">
              <summary>Can I purchase a gift card for myself?</summary>
              <p>Absolutely. You can use your own email address and apply the gift card to future appointments.</p>
            </details>
            <details className="faq-item">
              <summary>What if the service costs more than the gift card?</summary>
              <p>No problem—the recipient pays the remaining balance with another payment method at checkout.</p>
            </details>
            <details className="faq-item">
              <summary>Are gift cards refundable?</summary>
              <p>Gift cards are non-refundable but never expire, so the recipient can use them any time.</p>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <h2 className="section-title">Questions About Gift Cards?</h2>
        <p className="section-subtitle">Our team is happy to help. Give us a call or stop by the clinic.</p>
        <p className="cta-phone"><a href="tel:+19499973988">(949) 997-3988</a></p>
        <p className="cta-location">📍 1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
      </section>

      {/* GHL Gift Card Script */}
      <Script 
        src="https://storage.googleapis.com/leadgen-payment-products-preview-nuxt-assets/js/iframe-resizer/gc-embed.parent.js"
        strategy="afterInteractive"
      />

      <style jsx>{`
        /* Holiday Banner */
        .holiday-banner {
          background: linear-gradient(90deg, #1a472a 0%, #2d5a3d 100%);
          color: #ffffff;
          padding: 1rem 1.5rem;
          text-align: center;
        }
        
        .holiday-banner p {
          font-size: 1rem;
          font-weight: 500;
          margin: 0;
        }
        
        .holiday-banner strong {
          font-weight: 700;
        }

        /* Hero Section */
        .hero {
          padding: 4rem 1.5rem 3rem;
          text-align: center;
          background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
        }
        
        .hero-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
        }
        
        .hero h1 {
          font-size: 2.75rem;
          font-weight: 700;
          line-height: 1.15;
          margin-bottom: 1rem;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
          letter-spacing: -0.02em;
        }
        
        .hero-sub {
          font-size: 1.125rem;
          color: #525252;
          max-width: 550px;
          margin: 0 auto;
          line-height: 1.7;
        }

        /* Trust Bar */
        .trust-bar {
          background: #000000;
          color: #ffffff;
          padding: 1rem 1.5rem;
        }
        
        .trust-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: center;
          gap: 2.5rem;
          flex-wrap: wrap;
        }
        
        .trust-item {
          font-size: 0.8125rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Container */
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Section Styling */
        .section {
          padding: 4rem 1.5rem;
        }
        
        .section-gray {
          background: #fafafa;
        }
        
        .section-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.75rem;
          text-align: center;
        }
        
        .section-title {
          font-size: 2rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
        }
        
        .section-subtitle {
          font-size: 1.0625rem;
          color: #525252;
          text-align: center;
          max-width: 600px;
          margin: 0 auto 2.5rem;
          line-height: 1.7;
        }

        /* Gift Card Purchase Section */
        .gift-card-section {
          padding: 3rem 1.5rem 4rem;
        }
        
        .gift-card-container {
          max-width: 700px;
          margin: 0 auto;
          background: #ffffff;
          border: 2px solid #000000;
          border-radius: 12px;
          padding: 2.5rem 2rem;
        }
        
        .gift-card-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        
        .gift-card-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        
        .gift-card-header p {
          color: #525252;
          font-size: 0.9375rem;
        }
        
        .gift-card-embed {
          min-height: 450px;
          width: 100%;
        }

        /* Benefits Grid */
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .benefit-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          transition: all 0.2s;
        }
        
        .benefit-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        
        .benefit-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }
        
        .benefit-card h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        
        .benefit-card p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.6;
        }

        /* Services List */
        .services-box {
          max-width: 800px;
          margin: 3rem auto 0;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
        }
        
        .services-box h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
          text-align: center;
        }
        
        .services-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem 2rem;
        }
        
        .service-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9375rem;
          color: #404040;
          padding: 0.5rem 0;
        }
        
        .service-item::before {
          content: "✓";
          color: #000000;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* How It Works */
        .steps-container {
          max-width: 700px;
          margin: 0 auto;
        }
        
        .step-row {
          display: grid;
          grid-template-columns: 60px 1fr;
          gap: 1.5rem;
          padding: 1.5rem 0;
          border-bottom: 1px solid #e5e5e5;
          align-items: start;
        }
        
        .step-row:last-child {
          border-bottom: none;
        }
        
        .step-number {
          width: 50px;
          height: 50px;
          background: #000000;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 700;
        }
        
        .step-content h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.375rem;
        }
        
        .step-content p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.6;
        }

        /* FAQ */
        .faq-container {
          max-width: 700px;
          margin: 0 auto;
        }
        
        .faq-item {
          border-bottom: 1px solid #e5e5e5;
        }
        
        .faq-item:first-child {
          border-top: 1px solid #e5e5e5;
        }
        
        .faq-item summary {
          padding: 1.25rem 0;
          font-size: 1.0625rem;
          font-weight: 600;
          cursor: pointer;
          list-style: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .faq-item summary::-webkit-details-marker {
          display: none;
        }
        
        .faq-item summary::after {
          content: "+";
          font-size: 1.5rem;
          font-weight: 400;
          color: #737373;
        }
        
        .faq-item[open] summary::after {
          content: "−";
        }
        
        .faq-item p {
          padding: 0 0 1.25rem 0;
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
        }

        /* Final CTA */
        .final-cta {
          background: #000000;
          color: #ffffff;
          padding: 4rem 1.5rem;
          text-align: center;
        }
        
        .final-cta .section-title {
          color: #ffffff;
        }
        
        .final-cta .section-subtitle {
          color: rgba(255,255,255,0.8);
        }
        
        .cta-phone {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        
        .cta-phone a {
          color: #ffffff;
          text-decoration: none;
        }
        
        .cta-phone a:hover {
          text-decoration: underline;
        }
        
        .cta-location {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.7);
        }

        /* Responsive */
        @media (max-width: 900px) {
          .hero h1 {
            font-size: 2rem;
          }
          
          .benefits-grid {
            grid-template-columns: 1fr;
          }
          
          .services-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 640px) {
          .hero {
            padding: 3rem 1.5rem 2rem;
          }
          
          .hero h1 {
            font-size: 1.75rem;
          }
          
          .hero-icon {
            font-size: 3rem;
          }
          
          .section {
            padding: 3rem 1.5rem;
          }
          
          .section-title {
            font-size: 1.5rem;
          }
          
          .trust-inner {
            gap: 1rem;
          }
          
          .trust-item {
            font-size: 0.75rem;
          }
          
          .gift-card-container {
            padding: 1.5rem 1rem;
          }
          
          .step-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
      `}</style>
    </Layout>
  );
}
