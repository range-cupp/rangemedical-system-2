import Layout from '../components/Layout';
import Head from 'next/head';

export default function HBOTMembershipGuide() {
  return (
    <Layout
      title="HBOT Membership Guide | Range Medical"
      description="Your guide to Hyperbaric Oxygen Therapy membership. What to expect, session tips, and safety information. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Hyperbaric Oxygen Therapy Membership Guide",
              "description": "Patient guide for Hyperbaric Oxygen Therapy membership including session expectations, tips, and safety information.",
              "url": "https://www.range-medical.com/hbot-membership-guide",
              "provider": {
                "@type": "MedicalBusiness",
                "name": "Range Medical",
                "telephone": "+1-949-997-3988",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "1901 Westcliff Dr. Suite 10",
                  "addressLocality": "Newport Beach",
                  "addressRegion": "CA",
                  "postalCode": "92660",
                  "addressCountry": "US"
                }
              }
            })
          }}
        />
      </Head>

      {/* Hero */}
      <section className="guide-hero">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> MEMBERSHIP GUIDE</div>
          <h1>YOUR HYPERBARIC RECOVERY MEMBERSHIP GUIDE</h1>
          <div className="hero-rule" />
          <p className="hero-sub">Everything you need to know about your HBOT membership — how it works, what to expect, and how to get the most out of every session.</p>
          <div className="hero-dose">
            <div><span>Sessions:</span> 4 per month</div>
            <div><span>Period:</span> 30-day rolling</div>
          </div>
        </div>
      </section>

      {/* What Is HBOT */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> THE BASICS</div>
          <h2 className="section-title">WHAT IS HYPERBARIC OXYGEN THERAPY?</h2>
          <p className="section-subtitle">Hyperbaric Oxygen Therapy (HBOT) delivers 100% oxygen at increased atmospheric pressure inside a pressurized chamber.</p>
          <p className="body-text">At 2.0 atmospheres of pressure, your lungs absorb significantly more oxygen than at normal air pressure. This oxygen-rich blood reaches tissues throughout your body — supporting recovery, reducing inflammation, and promoting cellular repair in ways that normal breathing simply can't achieve.</p>
        </div>
      </section>

      {/* Your Membership */}
      <section className="section section-gray">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> YOUR PLAN</div>
          <h2 className="section-title">YOUR HBOT MEMBERSHIP</h2>
          <p className="section-subtitle">Consistent sessions are key to getting the most out of hyperbaric therapy.</p>

          <div className="info-grid">
            <div className="info-card">
              <h3>4 Sessions / Month</h3>
              <p>Your membership includes 4 in-clinic HBOT sessions per 30-day rolling period. We recommend spacing them throughout the month for optimal benefit.</p>
            </div>
            <div className="info-card">
              <h3>30-Day Rolling Period</h3>
              <p>Your membership renews every 30 days from your start date. Sessions reset each period — unused sessions do not roll over.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> YOUR VISIT</div>
          <h2 className="section-title">WHAT TO EXPECT</h2>
          <p className="section-subtitle">Each session is straightforward and relaxing. Here's the flow.</p>

          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Check In</h4>
                <p>Arrive at the clinic and check in with our team. We'll confirm your session and get you set up.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Enter the Chamber</h4>
                <p>You'll be guided into the hyperbaric chamber. Get comfortable — you can relax, read, or rest during your session.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>60-Minute Session</h4>
                <p>The chamber pressurizes to 2.0 atm while you breathe concentrated oxygen. You may feel mild pressure in your ears as the chamber pressurizes — this is normal and resolves quickly.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Post-Session</h4>
                <p>The chamber depressurizes gradually. You're free to go about your day immediately — no downtime needed.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="section section-gray">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> TIPS</div>
          <h2 className="section-title">GETTING THE MOST OUT OF HBOT</h2>

          <div className="tip-box">
            <strong>Stay Hydrated</strong>
            <p>Drink plenty of water before and after each session. Hydration helps your body circulate and absorb the extra oxygen more effectively.</p>
          </div>
          <div className="tip-box">
            <strong>Be Consistent</strong>
            <p>The benefits of HBOT build over time. Aim for one session per week to maintain steady progress throughout your membership period.</p>
          </div>
          <div className="tip-box">
            <strong>Wear Comfortable Clothing</strong>
            <p>Loose, comfortable clothing works best. Avoid anything with metal zippers or buttons that could be uncomfortable during pressurization.</p>
          </div>
          <div className="tip-box">
            <strong>Skip Lotions and Perfumes</strong>
            <p>Avoid applying lotions, oils, or perfumes before your session. These products can interact with the concentrated oxygen environment.</p>
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> SAFETY</div>
          <h2 className="section-title">IMPORTANT SAFETY INFORMATION</h2>

          <div className="safety-grid">
            <div className="safety-card warning">
              <h4>Contraindications:</h4>
              <ul>
                <li>Untreated ear or sinus infections</li>
                <li>Severe claustrophobia</li>
                <li>Pregnancy</li>
                <li>Certain lung conditions (e.g., untreated pneumothorax)</li>
                <li>Recent ear surgery</li>
              </ul>
            </div>
            <div className="safety-card effects">
              <h4>Possible Side Effects:</h4>
              <ul>
                <li>Mild ear pressure or popping during pressurization</li>
                <li>Temporary lightheadedness after session</li>
                <li>Slight fatigue (typically resolves within hours)</li>
              </ul>
              <p className="safety-note">Side effects are generally mild and short-lived. If you experience anything unusual or persistent, let our team know.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>QUESTIONS? WE'RE HERE.</h2>
          <p>Whether you need to schedule a session or have questions about your membership, our team can help.</p>
          <div className="cta-buttons">
            <a href="tel:+19499973988" className="btn-white">CALL (949) 997-3988</a>
            <a href="sms:+19499973988" className="btn-outline-white">TEXT US</a>
          </div>
          <p className="cta-location">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
        </div>
      </section>

      <style jsx>{`
        .guide-hero {
          background: #ffffff;
          padding: 6rem 2rem 4rem;
          text-align: left;
        }
        .guide-hero h1 {
          font-size: 2.75rem;
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.02em;
          margin-bottom: 1.25rem;
          text-transform: uppercase;
        }
        .hero-rule {
          width: 60px;
          height: 1px;
          background: #e0e0e0;
          margin-bottom: 1.25rem;
        }
        .hero-sub {
          font-size: 1.0625rem;
          color: #737373;
          max-width: 600px;
          line-height: 1.7;
        }
        .hero-dose {
          display: inline-flex;
          gap: 1.5rem;
          margin-top: 1.5rem;
          padding: 1rem 1.5rem;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          font-size: 0.9rem;
          color: #737373;
        }
        .hero-dose span {
          font-weight: 600;
          color: #171717;
        }
        .section {
          padding: 6rem 2rem;
        }
        .section-gray {
          background: #fafafa;
        }
        .section-title {
          font-size: 1.75rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 0.95;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
        }
        .section-subtitle {
          font-size: 1rem;
          color: #737373;
          max-width: 600px;
          line-height: 1.7;
          margin-bottom: 2rem;
        }
        .body-text {
          font-size: 0.95rem;
          color: #737373;
          line-height: 1.7;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        .info-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          padding: 1.75rem;
        }
        .info-card h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }
        .info-card p {
          font-size: 0.9rem;
          color: #737373;
          line-height: 1.7;
        }
        .steps-list {
          margin-top: 1.5rem;
        }
        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.25rem 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .step-item:last-child {
          border-bottom: none;
        }
        .step-number {
          width: 2rem;
          min-width: 2rem;
          height: 2rem;
          background: #c4a882;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          flex-shrink: 0;
        }
        .step-content {
          flex: 1;
        }
        .step-content h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        .step-content p {
          font-size: 0.9rem;
          color: #737373;
          line-height: 1.6;
        }
        .tip-box {
          background: #ffffff;
          border-left: 4px solid #c4a882;
          padding: 1.25rem 1.5rem;
          margin-bottom: 1rem;
        }
        .tip-box strong {
          display: block;
          margin-bottom: 0.25rem;
        }
        .tip-box p {
          font-size: 0.9rem;
          color: #737373;
          line-height: 1.6;
          margin: 0;
        }
        .safety-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .safety-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          padding: 1.5rem;
        }
        .safety-card h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #171717;
        }
        .safety-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .safety-card li {
          font-size: 0.875rem;
          color: #737373;
          padding: 0.375rem 0;
          padding-left: 1.25rem;
          position: relative;
          line-height: 1.5;
        }
        .safety-card.warning li::before {
          content: "\\2715";
          position: absolute;
          left: 0;
          color: #171717;
          font-weight: 600;
        }
        .safety-card.effects li::before {
          content: "\\2022";
          position: absolute;
          left: 0;
          color: #c4a882;
          font-weight: 700;
        }
        .safety-note {
          font-size: 0.8125rem;
          color: #737373;
          margin-top: 0.75rem;
          padding-left: 0;
        }
        .final-cta {
          background: #1a1a1a;
          color: #ffffff;
          padding: 6rem 2rem;
          text-align: center;
        }
        .final-cta h2 {
          font-size: 1.75rem;
          font-weight: 900;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
          line-height: 0.95;
          text-transform: uppercase;
        }
        .final-cta p {
          font-size: 1rem;
          color: rgba(255,255,255,0.8);
          margin-bottom: 1.5rem;
        }
        .cta-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .btn-white {
          display: inline-block;
          background: #ffffff;
          color: #1a1a1a;
          padding: 0.875rem 1.75rem;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: all 0.2s;
        }
        .btn-white:hover {
          background: #f5f5f5;
        }
        .btn-outline-white {
          display: inline-block;
          background: transparent;
          color: #ffffff;
          padding: 0.875rem 1.75rem;
          border: 2px solid #ffffff;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: all 0.2s;
        }
        .btn-outline-white:hover {
          background: #ffffff;
          color: #1a1a1a;
        }
        .cta-location {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.7);
        }
        @media (max-width: 768px) {
          .guide-hero h1 {
            font-size: 2rem;
          }
          .guide-hero {
            padding: 4rem 1.5rem 3rem;
          }
          .hero-dose {
            flex-direction: column;
            gap: 0.5rem;
          }
          .info-grid,
          .safety-grid {
            grid-template-columns: 1fr;
          }
          .section-title {
            font-size: 1.5rem;
          }
          .section {
            padding: 4rem 1.5rem;
          }
          .final-cta {
            padding: 4rem 1.5rem;
          }
          .cta-buttons {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </Layout>
  );
}
