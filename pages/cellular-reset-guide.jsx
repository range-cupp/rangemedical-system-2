import Layout from '../components/Layout';
import Head from 'next/head';

export default function CellularResetGuide() {
  return (
    <Layout
      title="6-Week Cellular Energy Reset Guide | Range Medical"
      description="Your guide to the 6-Week Cellular Energy Reset. 18 HBOT + 18 Red Light sessions over 6 weeks with money-back guarantee. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "6-Week Cellular Energy Reset Guide",
              "description": "Patient guide for the 6-Week Cellular Energy Reset program including schedule, expectations, and safety information.",
              "url": "https://www.range-medical.com/cellular-reset-guide",
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
          <span className="hero-badge">Your Cellular Energy Reset Guide</span>
          <h1>6-Week Cellular Energy Reset</h1>
          <p className="hero-sub">Everything you need to know about your reset program — the schedule, what to expect, and how to get the most from your 6 weeks.</p>
          <div className="hero-dose">
            <div><span>Program:</span> $3,999</div>
            <div><span>Duration:</span> 6 weeks</div>
            <div><span>Guarantee:</span> Money-back</div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Your Program</div>
          <h2 className="section-title">What's Included</h2>
          <p className="section-subtitle">A structured 6-week protocol designed to recharge your cellular energy from the inside out.</p>

          <div className="info-grid">
            <div className="info-card">
              <h3>🫁 18 HBOT Sessions</h3>
              <p>60 minutes each at 2.0 ATA. Pressurized oxygen floods your tissues, supporting healing, reducing inflammation, and boosting cellular energy production.</p>
            </div>
            <div className="info-card">
              <h3>💡 18 Red Light Sessions</h3>
              <p>660-850nm full-body treatment. Red and near-infrared light penetrates your cells and stimulates mitochondria — the powerhouses that create ATP (energy).</p>
            </div>
            <div className="info-card">
              <h3>📅 Structured Schedule</h3>
              <p>3 combo sessions per week for 6 weeks. We build your calendar at your first visit so you know exactly when to come in.</p>
            </div>
            <div className="info-card">
              <h3>📊 Weekly Check-ins</h3>
              <p>Automated weekly check-ins track your energy, sleep, and recovery throughout the program. We monitor your progress every step of the way.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">How It Works</div>
          <h2 className="section-title">Two Therapies, Compounding Results</h2>
          <p className="section-subtitle">One drives oxygen deep into tissue, the other stimulates the machinery that uses it.</p>

          <div className="info-grid">
            <div className="info-card">
              <h3>Hyperbaric Oxygen</h3>
              <p>Pressurized oxygen floods your tissues, supporting healing, reducing inflammation, and boosting cellular energy production. Your body gets the raw material it needs.</p>
            </div>
            <div className="info-card">
              <h3>Red Light Therapy</h3>
              <p>Red and near-infrared light stimulates your mitochondria — the energy factories inside every cell. More efficient mitochondria = more ATP = more energy.</p>
            </div>
          </div>

          <div className="combo-box">
            <h3>Why 6 Weeks?</h3>
            <p>Consistent combo sessions over 6 weeks create compounding cellular improvement. Each session builds on the last. By week 6, your cells are producing energy more efficiently than they have in years.</p>
          </div>
        </div>
      </section>

      {/* The Schedule */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Your Schedule</div>
          <h2 className="section-title">Each Session</h2>
          <p className="section-subtitle">3 sessions per week for 6 weeks. We build your calendar at your first visit.</p>

          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Red Light Therapy (20 min)</h4>
                <p>Full-body red and near-infrared light treatment. Stimulates mitochondrial function and primes your cells for the oxygen therapy that follows.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Hyperbaric Oxygen (60 min)</h4>
                <p>Relax in the pressurized chamber at 2.0 ATA. Your lungs absorb significantly more oxygen, which reaches every tissue in your body.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Weekly Check-in</h4>
                <p>Automated check-ins track your energy, sleep, and recovery. We monitor your progress and adjust as needed.</p>
              </div>
            </div>
          </div>

          <div className="tip-box">
            <strong>💡 Consistency Is Everything</strong>
            <p>Don't skip sessions. The compounding effect depends on regular, consistent treatment. Wear comfortable clothing. No metal jewelry in the chamber. Stay hydrated before and after.</p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section section-dark">
        <div className="container">
          <div className="section-kicker">Timeline</div>
          <h2 className="section-title">What to Expect</h2>
          <p className="section-subtitle">Benefits build each week as your cells become more efficient.</p>

          <div className="timeline-grid">
            <div className="timeline-card">
              <h4>Week 1–2</h4>
              <p>Body adjusts to consistent oxygen and light therapy. Some notice improved sleep and reduced soreness.</p>
            </div>
            <div className="timeline-card">
              <h4>Week 3–4</h4>
              <p>Energy improvements become noticeable. Recovery between workouts speeds up. Brain fog begins to lift.</p>
            </div>
            <div className="timeline-card">
              <h4>Week 5–6</h4>
              <p>Compounding benefits. Sustained energy, better sleep quality, improved mental clarity, and faster recovery.</p>
            </div>
            <div className="timeline-card">
              <h4>After 6 Weeks</h4>
              <p>Review results with your provider. Many patients transition to a combo membership to maintain results.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Money-Back Guarantee */}
      <section className="section">
        <div className="container">
          <div className="combo-box">
            <h3>💰 Money-Back Guarantee</h3>
            <p>Complete the full 6-week protocol as prescribed. If you don't experience measurable improvement, we'll refund your investment. We're that confident in this program.</p>
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Safety</div>
          <h2 className="section-title">Important Safety Information</h2>

          <div className="safety-grid">
            <div className="safety-card warning">
              <h4>HBOT Contraindications:</h4>
              <ul>
                <li>Untreated pneumothorax</li>
                <li>Certain ear or sinus conditions</li>
                <li>Certain lung conditions</li>
                <li>Pregnancy</li>
              </ul>
            </div>
            <div className="safety-card effects">
              <h4>Possible Side Effects:</h4>
              <ul>
                <li>Mild ear pressure during HBOT (like an airplane)</li>
                <li>Temporary lightheadedness after HBOT</li>
                <li>Mild warmth during Red Light</li>
                <li>Slight fatigue (typically resolves within hours)</li>
              </ul>
              <p className="safety-note">Both therapies are non-invasive. Red light has no significant contraindications. We screen for all contraindications before starting the program.</p>
            </div>
          </div>

          <div className="disclaimer">
            <p><strong>Important:</strong> Individual results vary. These treatments are not FDA-approved to diagnose, treat, cure, or prevent any disease.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Questions? We're Here.</h2>
          <p>Whether you need to adjust your schedule or have questions about the program, our team can help.</p>
          <div className="cta-buttons">
            <a href="tel:+19499973988" className="btn-white">Call (949) 997-3988</a>
            <a href="sms:+19499973988" className="btn-outline-white">Text Us</a>
          </div>
          <p className="cta-location">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
        </div>
      </section>

      <style jsx>{`
        .peptide-hero { background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%); padding: 3.5rem 1.5rem 3rem; text-align: center; }
        .peptide-hero h1 { font-size: 2.25rem; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; margin-bottom: 1rem; }
        .hero-badge { display: inline-block; background: #000000; color: #ffffff; padding: 0.5rem 1rem; border-radius: 100px; font-size: 0.8125rem; font-weight: 600; margin-bottom: 1.25rem; }
        .hero-sub { font-size: 1.0625rem; color: #525252; max-width: 600px; margin: 0 auto; line-height: 1.7; }
        .hero-dose { display: inline-flex; gap: 1.5rem; margin-top: 1.5rem; padding: 1rem 1.5rem; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; font-size: 0.9rem; color: #525252; }
        .hero-dose span { font-weight: 600; color: #171717; }
        .section { padding: 3.5rem 1.5rem; }
        .section-gray { background: #fafafa; }
        .section-dark { background: #000000; color: #ffffff; }
        .section-kicker { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #737373; margin-bottom: 0.5rem; }
        .section-dark .section-kicker { color: rgba(255,255,255,0.6); }
        .section-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.75rem; }
        .section-subtitle { font-size: 1rem; color: #525252; max-width: 600px; line-height: 1.7; margin-bottom: 2rem; }
        .section-dark .section-subtitle { color: rgba(255,255,255,0.8); }
        .section-dark .section-title { color: #ffffff; }
        .body-text { font-size: 0.95rem; color: #525252; line-height: 1.7; }
        .container { max-width: 800px; margin: 0 auto; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }
        .info-card { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 1.75rem; }
        .info-card h3 { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.75rem; }
        .info-card p { font-size: 0.9rem; color: #525252; line-height: 1.7; }
        .combo-box { background: #000000; color: #ffffff; border-radius: 12px; padding: 1.75rem; margin-top: 1.5rem; text-align: center; }
        .combo-box h3 { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem; color: #ffffff; }
        .combo-box p { font-size: 0.9rem; color: rgba(255,255,255,0.85); line-height: 1.7; }
        .steps-list { margin-top: 1.5rem; }
        .step-item { display: flex; gap: 1rem; padding: 1.25rem 0; border-bottom: 1px solid #e5e5e5; }
        .step-item:last-child { border-bottom: none; }
        .step-number { width: 2rem; height: 2rem; background: #000000; color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; flex-shrink: 0; }
        .step-content h4 { font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem; }
        .step-content p { font-size: 0.9rem; color: #525252; line-height: 1.6; }
        .tip-box { background: #ffffff; border-left: 4px solid #000000; padding: 1.25rem 1.5rem; margin-top: 1.5rem; border-radius: 0 8px 8px 0; }
        .tip-box strong { display: block; margin-bottom: 0.25rem; }
        .tip-box p { font-size: 0.9rem; color: #525252; line-height: 1.6; margin: 0; }
        .timeline-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; }
        .timeline-card { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 1.5rem; }
        .timeline-card h4 { font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; }
        .timeline-card p { font-size: 0.875rem; color: rgba(255,255,255,0.8); line-height: 1.6; }
        .safety-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .safety-card { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 1.5rem; }
        .safety-card h4 { font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; color: #171717; }
        .safety-card ul { list-style: none; padding: 0; margin: 0; }
        .safety-card li { font-size: 0.875rem; color: #525252; padding: 0.375rem 0; padding-left: 1.25rem; position: relative; line-height: 1.5; }
        .safety-card.warning li::before { content: "✕"; position: absolute; left: 0; color: #171717; font-weight: 600; }
        .safety-card.effects li::before { content: "•"; position: absolute; left: 0; color: #737373; font-weight: 700; }
        .safety-note { font-size: 0.8125rem; color: #737373; margin-top: 0.75rem; padding-left: 0; }
        .disclaimer { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; padding: 1.25rem; margin-top: 1.5rem; }
        .disclaimer p { font-size: 0.8125rem; color: #737373; line-height: 1.6; margin: 0; }
        .final-cta { background: #000000; color: #ffffff; padding: 3.5rem 1.5rem; text-align: center; }
        .final-cta h2 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.75rem; letter-spacing: -0.02em; }
        .final-cta p { font-size: 1rem; color: rgba(255,255,255,0.8); margin-bottom: 1.5rem; }
        .cta-buttons { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .btn-white { display: inline-block; background: #ffffff; color: #000000; padding: 0.875rem 1.75rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9375rem; transition: all 0.2s; }
        .btn-white:hover { background: #f5f5f5; transform: translateY(-1px); }
        .btn-outline-white { display: inline-block; background: transparent; color: #ffffff; padding: 0.875rem 1.75rem; border-radius: 8px; border: 2px solid #ffffff; text-decoration: none; font-weight: 600; font-size: 0.9375rem; transition: all 0.2s; }
        .btn-outline-white:hover { background: #ffffff; color: #000000; }
        .cta-location { font-size: 0.9rem; color: rgba(255,255,255,0.7); }
        @media (max-width: 768px) {
          .peptide-hero h1 { font-size: 1.875rem; }
          .hero-dose { flex-direction: column; gap: 0.5rem; }
          .info-grid, .safety-grid, .timeline-grid { grid-template-columns: 1fr; }
          .section-title { font-size: 1.5rem; }
          .cta-buttons { flex-direction: column; align-items: center; }
        }
      `}</style>
    </Layout>
  );
}
