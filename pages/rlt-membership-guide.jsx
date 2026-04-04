import Layout from '../components/Layout';
import Head from 'next/head';

export default function RLTMembershipGuide() {
  return (
    <Layout
      title="Red Light Reset Membership Guide | Range Medical"
      description="Your guide to Red Light Therapy membership. What to expect, session tips, and safety information. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Red Light Reset Membership Guide",
              "description": "Patient guide for Red Light Therapy membership including session expectations, tips, and safety information.",
              "url": "https://www.range-medical.com/rlt-membership-guide",
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
          <h1>YOUR RED LIGHT RESET MEMBERSHIP GUIDE</h1>
          <div className="hero-rule" />
          <p className="hero-sub">Everything you need to know about your RLT membership — how it works, what to expect, and how to get the most out of every session.</p>
          <div className="hero-dose">
            <div><span>Sessions:</span> Up to 12 per month</div>
            <div><span>Period:</span> 30-day rolling</div>
          </div>
        </div>
      </section>

      {/* What Is RLT */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> THE BASICS</div>
          <h2 className="section-title">WHAT IS RED LIGHT THERAPY?</h2>
          <p className="section-subtitle">Red Light Therapy (RLT) uses specific wavelengths of light to support your body at the cellular level.</p>
          <p className="body-text">Our panels deliver 660nm red light and 850nm near-infrared light. Red light (660nm) is absorbed by cells near the surface — supporting collagen production and skin health. Near-infrared light (850nm) penetrates deeper into tissue — reaching muscles, joints, and bones to support recovery and reduce inflammation. Together, these wavelengths boost cellular energy production (ATP), helping your body repair and regenerate more efficiently.</p>
        </div>
      </section>

      {/* Your Membership */}
      <section className="section section-gray">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> YOUR PLAN</div>
          <h2 className="section-title">YOUR RLT MEMBERSHIP</h2>
          <p className="section-subtitle">Frequent, consistent sessions are the key to getting results with red light therapy.</p>

          <div className="info-grid">
            <div className="info-card">
              <h3>Up to 12 Sessions / Month</h3>
              <p>Your membership includes up to 12 in-clinic RLT sessions per 30-day rolling period. We recommend 2-3 sessions per week for optimal results.</p>
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
          <p className="section-subtitle">Each session is quick, relaxing, and requires zero downtime.</p>

          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Check In</h4>
                <p>Arrive at the clinic and check in with our team. We'll get you set up in the red light room.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Position at the Panels</h4>
                <p>Stand or sit in front of the red light panels. Expose the target area directly to the light for maximum absorption — clothing blocks the wavelengths.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>20-Minute Session</h4>
                <p>Relax while the panels deliver therapeutic wavelengths. The light feels warm but comfortable — no UV exposure, no burning.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>You're Done</h4>
                <p>Get dressed and go about your day. No recovery time needed — many people do RLT sessions during lunch breaks or before/after workouts.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="section section-gray">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> TIPS</div>
          <h2 className="section-title">GETTING THE MOST OUT OF RLT</h2>

          <div className="tip-box">
            <strong>Expose Skin Directly</strong>
            <p>Red and near-infrared light can't penetrate clothing. For the best results, expose the target area directly to the panels.</p>
          </div>
          <div className="tip-box">
            <strong>Aim for 2-3 Sessions Per Week</strong>
            <p>Consistency matters more than duration. Regular sessions throughout the week deliver better cumulative results than sporadic longer sessions.</p>
          </div>
          <div className="tip-box">
            <strong>Stay Hydrated</strong>
            <p>Proper hydration supports the cellular processes that red light therapy activates. Drink water before and after your session.</p>
          </div>
          <div className="tip-box">
            <strong>Combine with HBOT</strong>
            <p>Red light therapy pairs well with Hyperbaric Oxygen Therapy. Many members do both in the same visit for compounding benefits.</p>
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
                <li>Photosensitivity medications (tetracycline, doxycycline, etc.)</li>
                <li>Active skin cancer or lesions in the treatment area</li>
                <li>History of epilepsy or seizures triggered by light</li>
                <li>Pregnancy (as a precaution)</li>
              </ul>
            </div>
            <div className="safety-card effects">
              <h4>Possible Side Effects:</h4>
              <ul>
                <li>Mild warmth or tingling in the treated area</li>
                <li>Temporary skin redness (resolves within hours)</li>
                <li>Occasional mild headache</li>
              </ul>
              <p className="safety-note">Side effects are generally mild and short-lived. RLT uses no UV light and does not cause burns or skin damage. If you experience anything unusual, let our team know.</p>
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
          font-size: clamp(2.5rem, 6vw, 4rem);
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
          background: #808080;
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
          border-left: 4px solid #808080;
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
          content: "✕";
          position: absolute;
          left: 0;
          color: #171717;
          font-weight: 600;
        }
        .safety-card.effects li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: #808080;
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
