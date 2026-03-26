import Layout from '../../components/Layout';
import Head from 'next/head';

export default function GiftEssentialPanel() {

  // Exact biomarker data from lab-panels.jsx — women's Essential Panel
  const womenEssential = [
    { name: "Estradiol", desc: "The primary estrogen hormone. Key for reproductive health, bone density, mood, and energy. Out-of-range levels are one of the most common reasons women feel off." },
    { name: "Progesterone", desc: "Balances estrogen and supports mood, sleep, and reproductive health. Low progesterone often shows up as anxiety, poor sleep, and PMS symptoms." },
    { name: "Testosterone, Total", desc: "Your overall testosterone production. Women need it too — low levels cause fatigue, low libido, muscle loss, and mood changes." },
    { name: "Testosterone, Free", desc: "The testosterone actually available for your body to use. More clinically relevant than total testosterone alone." },
    { name: "FSH", desc: "Follicle-stimulating hormone. Helps assess fertility, menopause status, and pituitary function." },
    { name: "LH", desc: "Luteinizing hormone. Works with FSH to regulate reproductive function and hormone production." },
    { name: "SHBG", desc: "Sex hormone binding globulin — affects how much of your hormones are actually available to your body. High SHBG can make your hormones functionally low even when numbers look normal." },
    { name: "TSH", desc: "Thyroid-stimulating hormone. The first-line thyroid test — but it doesn't tell the whole story on its own, which is why we run it alongside T3 and T4." },
    { name: "T3, Free", desc: "The active thyroid hormone your cells actually use. Low T3 causes fatigue, weight gain, and brain fog even when TSH looks normal on a standard checkup." },
    { name: "T4, Total", desc: "The main hormone your thyroid produces. Your body converts T4 into active T3. Helps assess overall thyroid output." },
    { name: "TPO Antibodies", desc: "Detects autoimmune thyroid disease (Hashimoto's). Often elevated years before thyroid numbers go abnormal — catching it early matters." },
    { name: "Complete Metabolic Panel (CMP)", desc: "14 markers covering blood sugar, kidney function, liver health, and electrolytes. The foundation — tells us how your body is processing everything you put into it." },
    { name: "Lipid Panel", desc: "Measures cholesterol and triglycerides. Essential for cardiovascular risk — and cholesterol is also the raw building block for all your hormones." },
    { name: "HbA1c", desc: "Your 3-month blood sugar average. A single glucose reading is a snapshot. HbA1c shows the trend — whether blood sugar has been spiking in ways that explain fatigue and mental fog." },
    { name: "Insulin, Fasting", desc: "Reveals how well your body manages blood sugar. High fasting insulin is an early warning sign of metabolic dysfunction, often years before HbA1c changes." },
    { name: "CBC with Differential", desc: "A complete count of red cells, white cells, and platelets. Detects anemia, immune issues, and blood disorders. Anemia alone explains a massive amount of chronic fatigue in women." },
    { name: "Vitamin D, 25-OH", desc: "Critical for immune function, mood, bone health, and hormone production. Deficiency is extremely common — even in Southern California, most people don't absorb enough from sunlight alone." },
  ];

  const groups = [
    {
      label: 'Hormones',
      icon: '⚡',
      markers: ["Estradiol", "Progesterone", "Testosterone, Total", "Testosterone, Free", "FSH", "LH", "SHBG"],
    },
    {
      label: 'Thyroid',
      icon: '🦋',
      markers: ["TSH", "T3, Free", "T4, Total", "TPO Antibodies"],
    },
    {
      label: 'Metabolic',
      icon: '🔥',
      markers: ["Complete Metabolic Panel (CMP)", "Lipid Panel", "HbA1c", "Insulin, Fasting"],
    },
    {
      label: 'General Health',
      icon: '🩺',
      markers: ["CBC with Differential", "Vitamin D, 25-OH"],
    },
  ];

  const markerMap = Object.fromEntries(womenEssential.map(m => [m.name, m.desc]));

  return (
    <Layout
      title="A Gift for Michele Douglas | Range Medical"
      description="You've been gifted an Essential Lab Panel at Range Medical, Newport Beach."
    >
      <Head>
        <meta name="robots" content="noindex" />
      </Head>

      {/* ── GIFT HERO ── */}
      <section className="gift-hero">
        <div className="container">
          <div className="gift-hero-inner">
            <div className="hero-badge">🎁 A Gift For You</div>
            <h1>Michele,</h1>
            <p className="hero-sub">
              JP Perarie has gifted you a Range Medical <strong>Essential Lab Panel</strong> — a comprehensive look at the hormones, thyroid, metabolic markers, and health indicators that shape how you feel every single day.
            </p>
          </div>
        </div>
      </section>

      {/* ── GIFT CARD ── */}
      <section className="section">
        <div className="container">
          <div className="gift-card-wrap">
            <div className="offer-card featured gift-card-display">
              <div className="offer-badge">Gifted — Ready to Redeem</div>
              <div className="gift-card-row">
                <div>
                  <div className="gift-card-label">From</div>
                  <div className="gift-card-name">JP Perarie</div>
                </div>
                <div className="gift-card-divider" />
                <div>
                  <div className="gift-card-label">Gift</div>
                  <div className="gift-card-value">Essential Lab Panel</div>
                </div>
                <div className="gift-card-divider" />
                <div>
                  <div className="gift-card-label">Value</div>
                  <div className="gift-card-value">$350</div>
                </div>
                <div className="gift-card-divider" />
                <div>
                  <div className="gift-card-label">Location</div>
                  <div className="gift-card-value">Newport Beach, CA</div>
                </div>
              </div>
            </div>

            <div className="gift-redeem-note">
              <p>
                To schedule your blood draw, call or text us at{' '}
                <a href="tel:+19499973988"><strong>(949) 997-3988</strong></a>.
                Your panel is covered in full — just mention JP's gift when you call.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">How It Works</p>
          <h2 className="section-title">Four Steps to Your Results</h2>
          <p className="section-subtitle">
            From scheduling to sitting down with a provider to go through your numbers — here's what to expect.
          </p>

          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <h4>Book Your Draw</h4>
              <p>Call or text (949) 997-3988. We'll get you scheduled at our Newport Beach office. Let us know JP sent you.</p>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <h4>Quick Blood Draw</h4>
              <p>About 15 minutes on-site. We recommend fasting 10–12 hours beforehand for the most accurate results. Water is fine.</p>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <h4>Results in 3–5 Days</h4>
              <p>Your provider reviews every marker before your consultation. Nothing gets glossed over or left unexplained.</p>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <h4>Provider Review</h4>
              <p>We explain what's off, why it matters, and what your options are. Plain language — no confusing lab printouts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BIOMARKERS ── */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">The Panel</p>
          <h2 className="section-title">What We're Testing — and Why It Matters</h2>
          <p className="section-subtitle">
            Your Essential Panel includes {womenEssential.length} biomarkers across four categories. Here's what each one is measuring and what it can tell us about how you're feeling.
          </p>

          <div className="biomarker-categories">
            {groups.map((group) => (
              <div key={group.label} className="biomarker-group">
                <div className="biomarker-group-header">
                  <span className="biomarker-group-icon">{group.icon}</span>
                  <h3 className="biomarker-group-title">{group.label}</h3>
                  <span className="biomarker-group-count">{group.markers.length} markers</span>
                </div>
                <div className="biomarker-list">
                  {group.markers.map((name) => (
                    <div key={name} className="biomarker-item">
                      <div className="biomarker-name">{name}</div>
                      <p className="biomarker-desc">{markerMap[name]}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT RANGE ── */}
      <section className="section section-gray">
        <div className="container">
          <div className="about-gift-grid">
            <div>
              <p className="section-kicker" style={{ textAlign: 'left' }}>About Range Medical</p>
              <h2 style={{ letterSpacing: '-0.02em', marginBottom: '1rem', fontSize: '1.75rem' }}>
                Medicine That Goes Beyond the Checkup
              </h2>
              <p>
                Range Medical is a regenerative medicine clinic in Newport Beach focused on helping people optimize how they feel — not just avoid disease. We specialize in hormone optimization, lab-guided care, IV therapy, peptide protocols, and more.
              </p>
              <p style={{ marginTop: '1rem' }}>
                When you come in for your lab draw, you'll work with licensed providers who actually take the time to explain your results and build a plan around them. No 7-minute appointments. No "your labs are normal" when you clearly don't feel normal.
              </p>
            </div>
            <div className="about-detail-cards">
              {[
                { icon: '📍', label: 'Location', value: '1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660' },
                { icon: '📞', label: 'Call or Text', value: '(949) 997-3988' },
                { icon: '⏱️', label: 'Blood Draw Time', value: '~15 minutes on-site' },
                { icon: '📋', label: 'Results', value: '3–5 business days' },
              ].map((d) => (
                <div key={d.label} className="detail-card">
                  <span className="detail-card-icon">{d.icon}</span>
                  <div>
                    <div className="detail-card-label">{d.label}</div>
                    <div className="detail-card-value">{d.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="final-cta">
        <div className="container">
          <span className="cta-step">Your gift is ready</span>
          <h2>Ready to Get Started, Michele?</h2>
          <p>Your Essential Panel is fully covered as a gift from JP. Just give us a call to schedule your blood draw at our Newport Beach location.</p>
          <a href="tel:+19499973988" className="btn-white">
            Call (949) 997-3988
          </a>
          <p className="cta-secondary">
            Prefer to text? Same number. We typically respond within a few hours during business hours.
          </p>
        </div>
      </section>

      <style jsx>{`
        /* ── Gift Hero ── */
        .gift-hero {
          background: linear-gradient(135deg, #0a0a0a 0%, #1c1c2e 60%, #0a0a0a 100%);
          padding: 5rem 1.5rem 4rem;
          text-align: center;
        }

        .gift-hero-inner {
          max-width: 680px;
          margin: 0 auto;
        }

        .gift-hero h1 {
          color: #ffffff;
          font-size: clamp(2.5rem, 6vw, 4rem);
          margin: 1rem 0 1.25rem;
        }

        .gift-hero .hero-badge {
          display: inline-block;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          color: #ffffff;
          padding: 0.5rem 1.25rem;
          border-radius: 0;
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .gift-hero .hero-sub {
          color: rgba(255,255,255,0.75);
          font-size: 1.125rem;
          max-width: 580px;
          margin: 0 auto;
          line-height: 1.75;
        }

        .gift-hero .hero-sub strong {
          color: #ffffff;
        }

        /* ── Gift Card Display ── */
        .gift-card-wrap {
          max-width: 760px;
          margin: 0 auto;
        }

        .gift-card-display {
          padding: 2.5rem;
          margin-top: 0.75rem;
        }

        .gift-card-row {
          display: flex;
          gap: 2rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .gift-card-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #a3a3a3;
          margin-bottom: 0.3rem;
        }

        .gift-card-name {
          font-size: 1.375rem;
          font-weight: 700;
          color: #171717;
        }

        .gift-card-value {
          font-size: 1.125rem;
          font-weight: 600;
          color: #171717;
        }

        .gift-card-divider {
          width: 1px;
          height: 48px;
          background: #e5e5e5;
          flex-shrink: 0;
        }

        .gift-redeem-note {
          margin-top: 1.25rem;
          text-align: center;
        }

        .gift-redeem-note p {
          font-size: 1rem;
          color: #525252;
        }

        .gift-redeem-note a {
          color: #171717;
        }

        /* ── Biomarkers ── */
        .biomarker-categories {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .biomarker-group {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 0;
          padding: 1.75rem;
        }

        .biomarker-group-header {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #f5f5f5;
        }

        .biomarker-group-icon {
          font-size: 1.25rem;
        }

        .biomarker-group-title {
          font-size: 0.875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #171717;
          margin: 0;
          flex: 1;
        }

        .biomarker-group-count {
          font-size: 0.75rem;
          font-weight: 600;
          color: #a3a3a3;
          background: #f5f5f5;
          padding: 0.2rem 0.6rem;
          border-radius: 0;
        }

        .biomarker-list {
          display: flex;
          flex-direction: column;
          gap: 1.125rem;
        }

        .biomarker-item {
          padding-bottom: 1.125rem;
          border-bottom: 1px solid #f5f5f5;
        }

        .biomarker-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .biomarker-name {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.3rem;
        }

        .biomarker-desc {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.6;
          margin: 0;
        }

        /* ── About Grid ── */
        .about-gift-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: start;
        }

        .about-gift-grid p {
          font-size: 1rem;
          color: #525252;
          line-height: 1.75;
        }

        .about-detail-cards {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .detail-card {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 0;
          padding: 1rem 1.25rem;
        }

        .detail-card-icon {
          font-size: 1.375rem;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .detail-card-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #a3a3a3;
          margin-bottom: 0.25rem;
        }

        .detail-card-value {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #171717;
          line-height: 1.4;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .gift-hero {
            padding: 3.5rem 1.5rem 3rem;
          }

          .gift-card-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.25rem;
          }

          .gift-card-divider {
            width: 100%;
            height: 1px;
          }

          .biomarker-categories {
            grid-template-columns: 1fr;
          }

          .about-gift-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
        }
      `}</style>
    </Layout>
  );
}
