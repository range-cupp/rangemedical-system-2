import Layout from '../components/Layout';
import Head from 'next/head';

export default function MedrolDosePakGuide() {
  return (
    <Layout
      title="Medrol DosePak Guide | Range Medical"
      description="Your guide to the Medrol DosePak (methylprednisolone) 6-day taper. Dosing schedule, instructions, and what to expect. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Medrol DosePak Guide",
              "description": "Patient guide for the Medrol DosePak (methylprednisolone) 6-day taper including dosing schedule, instructions, and safety information.",
              "url": "https://www.range-medical.com/medrol-dosepak-guide",
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
      <section className="peptide-hero">
        <div className="container">
          <span className="hero-badge">Your Medrol DosePak Guide</span>
          <h1>Medrol DosePak</h1>
          <p className="hero-sub">A 6-day tapering course of methylprednisolone to quickly reduce inflammation. Here's everything you need to know.</p>
          <div className="hero-dose">
            <div><span>Medication:</span> Methylprednisolone 4mg</div>
            <div><span>Duration:</span> 6 Days</div>
            <div><span>Tablets:</span> 21 Total</div>
          </div>
        </div>
      </section>

      {/* The Basics */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Basics</div>
          <h2 className="section-title">What Is a Medrol DosePak?</h2>
          <p className="section-subtitle">The Medrol DosePak is a pre-packaged 6-day course of methylprednisolone, a corticosteroid that rapidly reduces inflammation and suppresses overactive immune responses.</p>
          <p className="body-text">It's commonly prescribed for acute flare-ups of inflammation such as allergic reactions, joint pain, skin conditions, respiratory inflammation, and musculoskeletal injuries. The tapering schedule starts with a higher dose and gradually decreases, allowing your body to adjust naturally.</p>
        </div>
      </section>

      {/* Dosing Schedule */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Dosing Schedule</div>
          <h2 className="section-title">6-Day Taper Schedule</h2>
          <p className="section-subtitle">Take all tablets with food. Follow this exact schedule — do not skip doses or stop early.</p>

          <div className="schedule-table">
            <div className="schedule-header">
              <span className="schedule-col-day">Day</span>
              <span className="schedule-col-tabs">Tablets</span>
              <span className="schedule-col-dose">Total Dose</span>
              <span className="schedule-col-timing">When to Take</span>
            </div>
            <div className="schedule-row day-1">
              <span className="schedule-col-day"><strong>Day 1</strong></span>
              <span className="schedule-col-tabs">6 tablets</span>
              <span className="schedule-col-dose">24mg</span>
              <span className="schedule-col-timing">2 at breakfast, 1 at lunch, 1 at dinner, 2 at bedtime</span>
            </div>
            <div className="schedule-row">
              <span className="schedule-col-day"><strong>Day 2</strong></span>
              <span className="schedule-col-tabs">5 tablets</span>
              <span className="schedule-col-dose">20mg</span>
              <span className="schedule-col-timing">1 at breakfast, 1 at lunch, 1 at dinner, 2 at bedtime</span>
            </div>
            <div className="schedule-row">
              <span className="schedule-col-day"><strong>Day 3</strong></span>
              <span className="schedule-col-tabs">4 tablets</span>
              <span className="schedule-col-dose">16mg</span>
              <span className="schedule-col-timing">1 at breakfast, 1 at lunch, 1 at dinner, 1 at bedtime</span>
            </div>
            <div className="schedule-row">
              <span className="schedule-col-day"><strong>Day 4</strong></span>
              <span className="schedule-col-tabs">3 tablets</span>
              <span className="schedule-col-dose">12mg</span>
              <span className="schedule-col-timing">1 at breakfast, 1 at lunch, 1 at bedtime</span>
            </div>
            <div className="schedule-row">
              <span className="schedule-col-day"><strong>Day 5</strong></span>
              <span className="schedule-col-tabs">2 tablets</span>
              <span className="schedule-col-dose">8mg</span>
              <span className="schedule-col-timing">1 at breakfast, 1 at bedtime</span>
            </div>
            <div className="schedule-row last">
              <span className="schedule-col-day"><strong>Day 6</strong></span>
              <span className="schedule-col-tabs">1 tablet</span>
              <span className="schedule-col-dose">4mg</span>
              <span className="schedule-col-timing">1 at breakfast</span>
            </div>
          </div>

          <div className="tip-box" style={{ marginTop: '1.5rem' }}>
            <strong>Important</strong>
            <p>Always take with food or milk to reduce stomach irritation. Complete the entire 6-day course even if you feel better before it's finished.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">How It Works</div>
          <h2 className="section-title">What Methylprednisolone Does</h2>
          <p className="section-subtitle">Methylprednisolone is a powerful anti-inflammatory that works at the cellular level.</p>

          <div className="info-grid">
            <div className="info-card">
              <h3>Reduces Inflammation</h3>
              <p>Blocks the production of inflammatory chemicals (prostaglandins, leukotrienes) that cause swelling, redness, and pain.</p>
            </div>
            <div className="info-card">
              <h3>Calms Immune Response</h3>
              <p>Suppresses overactive immune reactions — helpful for allergic flare-ups, autoimmune responses, and acute inflammation.</p>
            </div>
            <div className="info-card">
              <h3>Rapid Relief</h3>
              <p>Most patients notice significant improvement within 24-48 hours. The high starting dose provides fast symptom control.</p>
            </div>
            <div className="info-card">
              <h3>Gradual Taper</h3>
              <p>The decreasing dose schedule allows your body's natural cortisol production to resume smoothly without rebound effects.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Instructions</div>
          <h2 className="section-title">How to Take Your Medrol DosePak</h2>

          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Take with Food</h4>
                <p>Always take tablets with a meal or a snack. This protects your stomach lining and improves absorption.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Follow the Schedule Exactly</h4>
                <p>The blister pack is labeled by day and time. Follow it precisely — the taper is designed to be completed in full.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Stay Hydrated</h4>
                <p>Drink plenty of water throughout the course. Corticosteroids can cause mild fluid retention and increased thirst.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Don't Stop Early</h4>
                <p>Even if your symptoms resolve before Day 6, complete the full taper. Stopping abruptly can cause rebound inflammation or adrenal issues.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section section-dark">
        <div className="container">
          <div className="section-kicker">Timeline</div>
          <h2 className="section-title">What to Expect</h2>
          <p className="section-subtitle">Here's what most patients experience during the 6-day course.</p>

          <div className="timeline-grid">
            <div className="timeline-card">
              <h4>Day 1-2</h4>
              <p>Highest dose days. Noticeable reduction in pain, swelling, and inflammation. You may feel increased energy or mild restlessness.</p>
            </div>
            <div className="timeline-card">
              <h4>Day 3-4</h4>
              <p>Continued improvement. Inflammation continues to decrease as the dose tapers. Most patients feel significantly better by now.</p>
            </div>
            <div className="timeline-card">
              <h4>Day 5-6</h4>
              <p>Final taper days. Low dose allows your body to resume its natural cortisol production. Symptoms should be well-controlled.</p>
            </div>
            <div className="timeline-card">
              <h4>After Completion</h4>
              <p>Effects continue for several days after finishing. If symptoms return, contact your provider — a follow-up plan may be needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Safety</div>
          <h2 className="section-title">Important Safety Information</h2>

          <div className="safety-grid">
            <div className="safety-card warning">
              <h4>Tell Your Provider If You:</h4>
              <ul>
                <li>Are pregnant or breastfeeding</li>
                <li>Have diabetes (steroids can raise blood sugar)</li>
                <li>Have a history of stomach ulcers or GI bleeding</li>
                <li>Have an active infection</li>
                <li>Are taking blood thinners or NSAIDs</li>
                <li>Have high blood pressure or heart conditions</li>
              </ul>
            </div>
            <div className="safety-card effects">
              <h4>Possible Side Effects:</h4>
              <ul>
                <li>Increased appetite</li>
                <li>Difficulty sleeping (insomnia)</li>
                <li>Mood changes or restlessness</li>
                <li>Mild stomach upset</li>
                <li>Elevated blood sugar</li>
                <li>Fluid retention or bloating</li>
                <li>Increased sweating</li>
              </ul>
              <p className="safety-note">Most side effects are mild and resolve as the dose tapers down. Contact your provider if you experience severe mood changes, vision problems, or signs of infection.</p>
            </div>
          </div>

          <div className="avoid-section">
            <h4>While Taking Medrol DosePak, Avoid:</h4>
            <div className="avoid-grid">
              <div className="avoid-item">
                <span className="avoid-icon">Alcohol</span>
                <p>Can increase stomach irritation and ulcer risk</p>
              </div>
              <div className="avoid-item">
                <span className="avoid-icon">NSAIDs</span>
                <p>Ibuprofen, aspirin, and naproxen increase GI bleeding risk</p>
              </div>
              <div className="avoid-item">
                <span className="avoid-icon">Live Vaccines</span>
                <p>Avoid vaccinations during treatment without consulting your provider</p>
              </div>
            </div>
          </div>

          <div className="disclaimer">
            <p><strong>Important:</strong> This guide is for informational purposes only and does not replace personalized medical advice. Follow your provider's specific instructions. Contact Range Medical if you have questions or concerns during your course.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Questions? We're Here.</h2>
          <p>If you experience any unexpected side effects or your symptoms don't improve, reach out to our team.</p>
          <div className="cta-buttons">
            <a href="tel:+19499973988" className="btn-white">Call (949) 997-3988</a>
            <a href="sms:+19499973988" className="btn-outline-white">Text Us</a>
          </div>
          <p className="cta-location">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
        </div>
      </section>

      <style jsx>{`
        .peptide-hero {
          background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
          padding: 3.5rem 1.5rem 3rem;
          text-align: center;
        }
        .peptide-hero h1 {
          font-size: 2.25rem;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
        }
        .hero-badge {
          display: inline-block;
          background: #000000;
          color: #ffffff;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          font-size: 0.8125rem;
          font-weight: 600;
          margin-bottom: 1.25rem;
        }
        .hero-sub {
          font-size: 1.0625rem;
          color: #525252;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.7;
        }
        .hero-dose {
          display: inline-flex;
          gap: 1.5rem;
          margin-top: 1.5rem;
          padding: 1rem 1.5rem;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          font-size: 0.9rem;
          color: #525252;
        }
        .hero-dose span {
          font-weight: 600;
          color: #171717;
        }
        .section {
          padding: 3.5rem 1.5rem;
        }
        .section-gray {
          background: #fafafa;
        }
        .section-dark {
          background: #000000;
          color: #ffffff;
        }
        .section-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.5rem;
        }
        .section-dark .section-kicker {
          color: rgba(255,255,255,0.6);
        }
        .section-title {
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 0.75rem;
        }
        .section-subtitle {
          font-size: 1rem;
          color: #525252;
          max-width: 600px;
          line-height: 1.7;
          margin-bottom: 2rem;
        }
        .section-dark .section-subtitle {
          color: rgba(255,255,255,0.8);
        }
        .section-dark .section-title {
          color: #ffffff;
        }
        .body-text {
          font-size: 0.95rem;
          color: #525252;
          line-height: 1.7;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .schedule-table {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          overflow: hidden;
        }
        .schedule-header {
          display: grid;
          grid-template-columns: 80px 100px 90px 1fr;
          padding: 0.875rem 1.5rem;
          background: #171717;
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .schedule-row {
          display: grid;
          grid-template-columns: 80px 100px 90px 1fr;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e5e5e5;
          font-size: 0.9rem;
          color: #525252;
          align-items: center;
        }
        .schedule-row.last {
          border-bottom: none;
        }
        .schedule-row.day-1 {
          background: #f9fafb;
        }
        .schedule-row strong {
          color: #171717;
        }
        .schedule-col-dose {
          font-weight: 600;
          color: #171717;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        .info-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.75rem;
        }
        .info-card h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }
        .info-card p {
          font-size: 0.9rem;
          color: #525252;
          line-height: 1.7;
        }
        .steps-list {
          margin-top: 1.5rem;
        }
        .step-item {
          display: flex;
          gap: 1rem;
          padding: 1.25rem 0;
          border-bottom: 1px solid #e5e5e5;
        }
        .step-item:last-child {
          border-bottom: none;
        }
        .step-number {
          width: 2rem;
          height: 2rem;
          background: #000000;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          flex-shrink: 0;
        }
        .step-content h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        .step-content p {
          font-size: 0.9rem;
          color: #525252;
          line-height: 1.6;
        }
        .tip-box {
          background: #ffffff;
          border-left: 4px solid #000000;
          padding: 1.25rem 1.5rem;
          border-radius: 0 8px 8px 0;
        }
        .tip-box strong {
          display: block;
          margin-bottom: 0.25rem;
        }
        .tip-box p {
          font-size: 0.9rem;
          color: #525252;
          line-height: 1.6;
          margin: 0;
        }
        .timeline-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .timeline-card {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          padding: 1.5rem;
        }
        .timeline-card h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .timeline-card p {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.8);
          line-height: 1.6;
        }
        .safety-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .safety-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
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
          color: #525252;
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
          color: #737373;
          font-weight: 700;
        }
        .safety-note {
          font-size: 0.8125rem;
          color: #737373;
          margin-top: 0.75rem;
          padding-left: 0;
        }
        .avoid-section {
          margin-top: 2rem;
        }
        .avoid-section h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #171717;
        }
        .avoid-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1rem;
        }
        .avoid-item {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 12px;
          padding: 1.25rem;
          text-align: center;
        }
        .avoid-icon {
          display: block;
          font-weight: 700;
          font-size: 1rem;
          color: #c2410c;
          margin-bottom: 0.5rem;
        }
        .avoid-item p {
          font-size: 0.8125rem;
          color: #525252;
          line-height: 1.5;
          margin: 0;
        }
        .disclaimer {
          background: #fafafa;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 1.25rem;
          margin-top: 1.5rem;
        }
        .disclaimer p {
          font-size: 0.8125rem;
          color: #737373;
          line-height: 1.6;
          margin: 0;
        }
        .final-cta {
          background: #000000;
          color: #ffffff;
          padding: 3.5rem 1.5rem;
          text-align: center;
        }
        .final-cta h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
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
          color: #000000;
          padding: 0.875rem 1.75rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }
        .btn-white:hover {
          background: #f5f5f5;
          transform: translateY(-1px);
        }
        .btn-outline-white {
          display: inline-block;
          background: transparent;
          color: #ffffff;
          padding: 0.875rem 1.75rem;
          border-radius: 8px;
          border: 2px solid #ffffff;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }
        .btn-outline-white:hover {
          background: #ffffff;
          color: #000000;
        }
        .cta-location {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.7);
        }
        @media (max-width: 768px) {
          .peptide-hero h1 {
            font-size: 1.875rem;
          }
          .hero-dose {
            flex-direction: column;
            gap: 0.5rem;
          }
          .info-grid,
          .safety-grid,
          .timeline-grid {
            grid-template-columns: 1fr;
          }
          .schedule-header,
          .schedule-row {
            grid-template-columns: 60px 80px 70px 1fr;
            font-size: 0.8rem;
            padding: 0.75rem 1rem;
          }
          .avoid-grid {
            grid-template-columns: 1fr;
          }
          .section-title {
            font-size: 1.5rem;
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
