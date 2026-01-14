import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';

export default function LabPrepPage() {
  return (
    <Layout 
      title="How to Prepare for Your Lab Appointment | Range Medical Newport Beach"
      description="Simple instructions to prepare for your lab work at Range Medical in Newport Beach. Fasting guidelines, cycle timing, and what to bring."
    >
      <Head>
        <meta name="keywords" content="lab work preparation, fasting for labs, hormone labs, Newport Beach, Orange County, Costa Mesa, Irvine" />
        <link rel="canonical" href="https://www.range-medical.com/lab-prep" />
        <meta property="og:title" content="How to Prepare for Your Lab Appointment | Range Medical" />
        <meta property="og:description" content="Simple instructions to prepare for your lab work at Range Medical in Newport Beach. Fasting guidelines, cycle timing, and what to bring." />
        <meta property="og:url" content="https://www.range-medical.com/lab-prep" />
      </Head>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="section-kicker">Patient Guide</div>
          <h1>How to Prepare for Your Lab Appointment</h1>
          <p className="hero-subtitle">Getting accurate lab results starts with a little preparation. These are general guidelines—your provider may give you specific instructions based on your situation.</p>
        </div>
      </section>

      {/* General Prep Section */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">All Patients</div>
          <h2 className="section-title">General Preparation</h2>
          <p className="section-subtitle">Follow these steps to ensure accurate results.</p>
          
          <div className="info-grid">
            <div className="info-card">
              <h3><span className="icon">🍽️</span> Fasting</h3>
              <ul>
                <li><strong>No food for 10–12 hours</strong> before your draw</li>
                <li>Water is fine (and encouraged)</li>
                <li>Black coffee or tea is okay (no creamer or sugar)</li>
              </ul>
            </div>
            <div className="info-card">
              <h3><span className="icon">💧</span> Hydration</h3>
              <ul>
                <li><strong>Drink plenty of water</strong> 1–2 hours before your draw</li>
                <li>Makes your veins easier to find</li>
                <li>Avoid alcohol the night before</li>
              </ul>
            </div>
            <div className="info-card">
              <h3><span className="icon">🚫</span> Avoid</h3>
              <ul>
                <li>Heavy or fatty meals the night before</li>
                <li><strong>NSAIDs (Advil, ibuprofen)</strong> for 48 hours before</li>
                <li>Alcohol the night before</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* For Men Section */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Men's Guidelines</div>
          <h2 className="section-title">For Men</h2>
          <p className="section-subtitle">Additional considerations for accurate hormone testing.</p>
          
          <div className="two-col-grid">
            <div className="info-card">
              <h3><span className="icon">💉</span> Testosterone Injections</h3>
              <ul>
                <li><strong>Hold injections for 3 days</strong> before your labs</li>
                <li>Schedule your draw for the morning of your injection day, before dosing</li>
                <li>Resume after your lab</li>
              </ul>
            </div>
            <div className="info-card">
              <h3><span className="icon">🔬</span> PSA Testing</h3>
              <ul>
                <li>Avoid heavy workouts for <strong>24 hours</strong> before</li>
                <li>Avoid sexual activity for <strong>24 hours</strong> before</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* For Women Section */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Women's Guidelines</div>
          <h2 className="section-title">For Women</h2>
          <p className="section-subtitle">Timing matters for accurate hormone results.</p>
          
          <div className="two-col-grid">
            <div className="info-card">
              <h3><span className="icon">💊</span> Hormone Medications</h3>
              <ul>
                <li><strong>Estrogen & progesterone:</strong> Continue as normal</li>
                <li><strong>Testosterone injections:</strong> Hold for 3 days before labs</li>
              </ul>
            </div>
            <div className="info-card">
              <h3><span className="icon">📅</span> Timing</h3>
              <ul>
                <li><strong>Cortisol, testosterone, or prolactin:</strong> Schedule between 7:30–9:30 AM</li>
                <li><strong>If cycling:</strong> Schedule on Day 3 of your period</li>
                <li><strong>Not cycling/postmenopausal:</strong> Follow fasting and hydration steps</li>
              </ul>
            </div>
          </div>
          
          <div className="warning-box">
            <p><strong>If your cycle doesn't line up with your appointment:</strong> Don't cancel online. Text or call us at <strong>(949) 997-3988</strong> and we'll help you figure out what to do.</p>
          </div>
        </div>
      </section>

      {/* Medications Quick Reference */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Quick Reference</div>
          <h2 className="section-title">Medications Guide</h2>
          <p className="section-subtitle">What to continue, skip, or stop before your labs.</p>
          
          <div className="meds-grid">
            <div className="med-card stop">
              <div className="med-name">NSAIDs (Advil, ibuprofen)</div>
              <div className="med-action">⛔ Stop 48 hours before</div>
            </div>
            <div className="med-card skip">
              <div className="med-name">Thyroid Meds</div>
              <div className="med-action">⏸️ Skip morning of draw, take after</div>
            </div>
            <div className="med-card stop">
              <div className="med-name">Testosterone Injections</div>
              <div className="med-action">⛔ Hold 3 days before</div>
            </div>
            <div className="med-card continue">
              <div className="med-name">Estrogen & Progesterone</div>
              <div className="med-action">✅ Continue as normal</div>
            </div>
          </div>
          
          <div className="highlight-box">
            <p><strong>When in doubt, ask us.</strong> Text or call before your appointment if you're unsure about any medication.</p>
          </div>
        </div>
      </section>

      {/* Day-Of Checklist */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Day Of</div>
          <h2 className="section-title">Before You Leave</h2>
          <p className="section-subtitle">Run through this checklist the morning of your appointment.</p>
          
          <div className="checklist">
            <h3>✓ Day-Of Checklist</h3>
            <div className="checklist-grid">
              <div className="checklist-item">
                <span className="check">☐</span>
                <span>Arrive 5–10 minutes early to check in</span>
              </div>
              <div className="checklist-item">
                <span className="check">☐</span>
                <span>Bring a valid ID (driver's license, passport)</span>
              </div>
              <div className="checklist-item">
                <span className="check">☐</span>
                <span>Fasted 10–12 hours (water/black coffee okay)</span>
              </div>
              <div className="checklist-item">
                <span className="check">☐</span>
                <span>Hydrated in the 1–2 hours before</span>
              </div>
              <div className="checklist-item">
                <span className="check">☐</span>
                <span>Skipped thyroid meds this morning</span>
              </div>
              <div className="checklist-item">
                <span className="check">☐</span>
                <span>Wearing a shirt with sleeves that roll up</span>
              </div>
              <div className="checklist-item">
                <span className="check">☐</span>
                <span>Packed a snack for after your draw</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section section-gray">
        <div className="container">
          <div className="contact-box">
            <h3>Questions?</h3>
            <p>If anything is unclear or you're unsure how to prepare, just ask. We're happy to help.</p>
            <a href="tel:+19499973988" className="contact-phone">(949) 997-3988</a>
            <p className="contact-sub">Text or call anytime</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Ready to Book?</h2>
          <p>If you found this page but haven't scheduled yet, start with a Range Assessment. Labs, symptoms review, and a written plan in under a week.</p>
          <div className="hero-buttons">
            <Link href="/range-assessment" className="btn-primary">Start with a Range Assessment</Link>
          </div>
          <p className="hero-secondary">Already a patient? <a href="tel:+19499973988">Call or text (949) 997-3988</a> to schedule.</p>
          <div className="location-info">
            <p>1901 Westcliff Dr Suite 10, Newport Beach, CA</p>
            <p>Upstairs from Range Sports Therapy</p>
          </div>
        </div>
      </section>

      <style jsx>{`
        /* Hero */
        .hero {
          padding: 4rem 1.5rem 3rem;
          text-align: center;
          background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
        }

        .hero h1 {
          font-size: 2.75rem;
          font-weight: 700;
          color: #171717;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-subtitle {
          font-size: 1.0625rem;
          color: #525252;
          line-height: 1.6;
          max-width: 700px;
          margin: 0 auto;
        }

        /* Section Kicker */
        .section-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1rem;
          text-align: center;
        }

        /* Sections */
        .section {
          padding: 4rem 1.5rem;
        }

        .section-gray {
          background: #fafafa;
        }

        .section-title {
          font-size: 2rem;
          font-weight: 700;
          color: #171717;
          letter-spacing: -0.02em;
          margin-bottom: 0.75rem;
          text-align: center;
        }

        .section-subtitle {
          font-size: 1.0625rem;
          color: #525252;
          line-height: 1.6;
          max-width: 700px;
          margin: 0 auto 2.5rem;
          text-align: center;
        }

        /* Container */
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Info Cards Grid */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .two-col-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .info-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.75rem;
          transition: all 0.2s;
        }

        .info-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .info-card h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .info-card .icon {
          font-size: 1.5rem;
        }

        .info-card ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .info-card li {
          padding: 0.5rem 0;
          border-bottom: 1px solid #f5f5f5;
          color: #525252;
          font-size: 0.9375rem;
          line-height: 1.6;
        }

        .info-card li:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .info-card li strong {
          color: #171717;
        }

        /* Warning Box */
        .warning-box {
          background: #fffbeb;
          border-left: 4px solid #f59e0b;
          border-radius: 0 12px 12px 0;
          padding: 1.25rem 1.5rem;
          margin: 2rem auto 0;
          max-width: 900px;
        }

        .warning-box p {
          margin: 0;
          color: #92400e;
          font-size: 0.9375rem;
        }

        .warning-box strong {
          color: #78350f;
        }

        /* Highlight Box */
        .highlight-box {
          background: #f0fdf4;
          border-left: 4px solid #22c55e;
          border-radius: 0 12px 12px 0;
          padding: 1.25rem 1.5rem;
          margin: 2rem auto 0;
          max-width: 1000px;
        }

        .highlight-box p {
          margin: 0;
          color: #166534;
          font-size: 0.9375rem;
        }

        .highlight-box strong {
          color: #14532d;
        }

        /* Medications Grid */
        .meds-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .med-card {
          background: #ffffff;
          border: 2px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.25rem;
        }

        .med-card .med-name {
          font-weight: 700;
          color: #171717;
          font-size: 0.9375rem;
          margin-bottom: 0.5rem;
        }

        .med-card .med-action {
          font-size: 0.875rem;
          color: #525252;
        }

        .med-card.continue {
          border-color: #22c55e;
          background: #f0fdf4;
        }

        .med-card.continue .med-action {
          color: #166534;
        }

        .med-card.stop {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .med-card.stop .med-action {
          color: #991b1b;
        }

        .med-card.skip {
          border-color: #f59e0b;
          background: #fffbeb;
        }

        .med-card.skip .med-action {
          color: #92400e;
        }

        /* Checklist */
        .checklist {
          background: #000000;
          color: #ffffff;
          border-radius: 12px;
          padding: 2rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .checklist h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .checklist-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        .checklist-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          font-size: 0.9375rem;
        }

        .checklist-item .check {
          font-size: 1rem;
          flex-shrink: 0;
        }

        /* Contact Box */
        .contact-box {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          max-width: 700px;
          margin: 0 auto;
        }

        .contact-box h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }

        .contact-box p {
          color: #737373;
          margin-bottom: 1.5rem;
        }

        .contact-phone {
          font-size: 1.25rem;
          font-weight: 700;
          text-decoration: none;
          display: inline-block;
          padding: 0.875rem 2rem;
          background: #000000;
          color: #ffffff;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .contact-phone:hover {
          background: #262626;
          transform: translateY(-1px);
        }

        .contact-sub {
          margin-top: 0.75rem !important;
          margin-bottom: 0 !important;
          font-size: 0.875rem;
          color: #737373;
        }

        /* Final CTA */
        .final-cta {
          background: #fafafa;
          padding: 4rem 1.5rem;
          text-align: center;
          border-top: 1px solid #e5e5e5;
        }

        .final-cta h2 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #171717;
        }

        .final-cta p {
          font-size: 1.0625rem;
          color: #525252;
          margin-bottom: 2rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-buttons {
          margin-bottom: 1rem;
        }

        .btn-primary {
          display: inline-block;
          background: #000;
          color: #fff;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #262626;
          transform: translateY(-1px);
        }

        .hero-secondary {
          font-size: 0.9375rem;
          color: #737373;
          margin-bottom: 2rem;
        }

        .hero-secondary a {
          color: #171717;
          font-weight: 600;
          text-decoration: none;
        }

        .hero-secondary a:hover {
          text-decoration: underline;
        }

        .location-info {
          padding-top: 1.5rem;
          border-top: 1px solid #e5e5e5;
          max-width: 400px;
          margin: 0 auto;
        }

        .location-info p {
          font-size: 0.875rem;
          color: #737373;
          margin-bottom: 0.25rem;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .hero h1 {
            font-size: 2rem;
          }

          .section {
            padding: 3rem 1.5rem;
          }

          .info-grid,
          .meds-grid {
            grid-template-columns: 1fr;
          }

          .two-col-grid {
            grid-template-columns: 1fr;
          }

          .checklist-grid {
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

          .section-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </Layout>
  );
}
