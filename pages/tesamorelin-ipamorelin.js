import Head from 'next/head';

export default function TesamorelinIpamorelin() {
  return (
    <>
      <Head>
        <title>Tesamorelin + Ipamorelin | Range Medical</title>
        <meta name="description" content="Two peptides that work together to optimize your growth hormone levels—helping you burn fat, build lean muscle, sleep better, and feel more like yourself again." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        :root {
          --color-primary: #000000;
          --color-bg: #ffffff;
          --color-bg-alt: #fafafa;
          --color-text: #171717;
          --color-text-body: #525252;
          --color-text-muted: #737373;
          --color-border: #e5e5e5;
          --color-border-light: #f5f5f5;
          --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          --radius-sm: 6px;
          --radius-md: 8px;
          --radius-lg: 12px;
          --radius-full: 100px;
          --shadow-sm: 0 4px 20px rgba(0,0,0,0.06);
          --transition: 0.2s ease;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: var(--font-family);
          font-size: 1rem;
          line-height: 1.6;
          color: var(--color-text-body);
          background: var(--color-bg);
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Header */
        .header {
          padding: 1.5rem 0;
          border-bottom: 1px solid var(--color-border);
        }

        .header .container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo img {
          height: 135px;
          width: auto;
        }

        .header-cta {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .header-phone {
          color: var(--color-text-muted);
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
        }

        .header-phone:hover {
          color: var(--color-text);
        }

        .cta-link {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--color-primary);
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: var(--transition);
        }

        .cta-link:hover {
          color: #404040;
        }

        /* Hero */
        .hero {
          padding: 5rem 1.5rem;
          text-align: center;
          background: linear-gradient(180deg, var(--color-bg-alt) 0%, var(--color-bg) 100%);
        }

        .hero-badge {
          display: inline-block;
          background: var(--color-primary);
          color: var(--color-bg);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }

        .hero h1 {
          font-size: 2.75rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: var(--color-text);
          margin-bottom: 1.25rem;
        }

        .hero-subtitle {
          font-size: 1.125rem;
          color: var(--color-text-body);
          max-width: 680px;
          margin: 0 auto 2rem;
          line-height: 1.7;
        }

        .cta-group {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          align-items: center;
        }

        .cta-separator {
          color: var(--color-text-muted);
          font-size: 0.875rem;
        }

        /* Sections */
        .section {
          padding: 4rem 1.5rem;
        }

        .section-gray {
          background: var(--color-bg-alt);
        }

        .section-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-text-muted);
          margin-bottom: 0.75rem;
        }

        .section-title {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--color-text);
          margin-bottom: 1rem;
        }

        .section-subtitle {
          font-size: 1.0625rem;
          color: var(--color-text-body);
          max-width: 700px;
          line-height: 1.7;
          margin-bottom: 2.5rem;
        }

        .section-centered {
          text-align: center;
        }

        .section-centered .section-subtitle {
          margin-left: auto;
          margin-right: auto;
        }

        /* Two Peptide Cards */
        .peptide-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .peptide-card {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 2rem;
          transition: var(--transition);
        }

        .peptide-card:hover {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-sm);
        }

        .peptide-card h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 0.5rem;
        }

        .peptide-card .aka {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          margin-bottom: 1rem;
        }

        .peptide-card p {
          font-size: 0.9375rem;
          line-height: 1.7;
          margin-bottom: 1.25rem;
        }

        .peptide-list {
          list-style: none;
        }

        .peptide-list li {
          position: relative;
          padding-left: 1.5rem;
          padding-top: 0.375rem;
          padding-bottom: 0.375rem;
          font-size: 0.9375rem;
        }

        .peptide-list li::before {
          content: "✓";
          position: absolute;
          left: 0;
          font-weight: 600;
          color: var(--color-primary);
        }

        /* Synergy Box */
        .synergy-box {
          background: var(--color-bg);
          border: 2px solid var(--color-primary);
          border-radius: var(--radius-lg);
          padding: 2.5rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .synergy-box h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 1rem;
          text-align: center;
        }

        .synergy-box > p {
          font-size: 1rem;
          line-height: 1.7;
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .synergy-points {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          text-align: center;
        }

        .synergy-point {
          font-size: 0.9375rem;
        }

        .synergy-point strong {
          display: block;
          color: var(--color-text);
          margin-bottom: 0.25rem;
        }

        /* Benefits */
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .benefit-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 1rem;
          padding: 0.5rem 0;
        }

        .benefit-item span {
          color: var(--color-primary);
          font-weight: 600;
          flex-shrink: 0;
        }

        /* Cards Grid */
        .card-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .card {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 1.75rem;
          transition: var(--transition);
        }

        .card:hover {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-sm);
        }

        .card-icon {
          font-size: 1.75rem;
          margin-bottom: 1rem;
        }

        .card h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 0.5rem;
        }

        .card p {
          font-size: 0.9375rem;
          line-height: 1.7;
        }

        /* Ideal For */
        .ideal-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          max-width: 700px;
          margin: 0 auto;
        }

        .ideal-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 0.9375rem;
        }

        .ideal-item span {
          font-size: 1.25rem;
        }

        /* How It Works */
        .how-it-works {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          text-align: center;
        }

        .how-step {
          padding: 0 1rem;
        }

        .step-number {
          width: 48px;
          height: 48px;
          background: var(--color-primary);
          color: var(--color-bg);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 auto 1.25rem;
        }

        .how-step h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 0.5rem;
        }

        .how-step p {
          font-size: 0.9375rem;
          line-height: 1.6;
        }

        /* Two Column */
        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .info-card {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 2rem;
        }

        .info-card h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 1rem;
        }

        .info-list {
          list-style: none;
        }

        .info-list li {
          position: relative;
          padding-left: 1.5rem;
          padding-top: 0.375rem;
          padding-bottom: 0.375rem;
          font-size: 0.9375rem;
        }

        .info-list li::before {
          content: "•";
          position: absolute;
          left: 0;
          font-weight: 600;
          color: var(--color-primary);
        }

        .info-list.checks li::before {
          content: "✓";
        }

        /* Dark Section */
        .section-dark {
          background: var(--color-primary);
          color: var(--color-bg);
        }

        .section-dark .section-kicker {
          color: rgba(255,255,255,0.6);
        }

        .section-dark .section-title {
          color: var(--color-bg);
        }

        .section-dark .section-subtitle {
          color: rgba(255,255,255,0.8);
        }

        /* FAQ */
        .faq-list {
          max-width: 700px;
          margin: 0 auto;
        }

        .faq-item {
          border-bottom: 1px solid var(--color-border);
          padding: 1.5rem 0;
        }

        .faq-item:first-child {
          border-top: 1px solid var(--color-border);
        }

        .faq-question {
          font-size: 1.0625rem;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 0.75rem;
        }

        .faq-answer {
          font-size: 0.9375rem;
          line-height: 1.7;
        }

        /* Final CTA */
        .final-cta {
          text-align: center;
          padding: 5rem 1.5rem;
          background: var(--color-bg-alt);
        }

        .final-cta h2 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--color-text);
          margin-bottom: 1rem;
        }

        .final-cta p {
          font-size: 1.0625rem;
          color: var(--color-text-body);
          max-width: 550px;
          margin: 0 auto 2rem;
          line-height: 1.7;
        }

        .location-info {
          margin-top: 2rem;
          font-size: 0.875rem;
          color: var(--color-text-muted);
        }

        .location-info strong {
          color: var(--color-text);
        }

        /* Footer */
        .footer {
          padding: 2rem 1.5rem;
          border-top: 1px solid var(--color-border);
          text-align: center;
        }

        .footer img {
          height: 40px;
          width: auto;
          margin-bottom: 1rem;
        }

        .footer p {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }

        /* Responsive */
        @media (max-width: 900px) {
          .peptide-grid,
          .card-grid,
          .how-it-works,
          .synergy-points,
          .benefits-grid,
          .two-col {
            grid-template-columns: 1fr;
          }

          .ideal-grid {
            grid-template-columns: 1fr;
          }

          .hero h1 {
            font-size: 2rem;
          }

          .section {
            padding: 3rem 1.5rem;
          }

          .logo img {
            height: 100px;
          }

          .header-phone {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .hero {
            padding: 3rem 1.5rem;
          }

          .hero h1 {
            font-size: 1.75rem;
          }

          .section-title {
            font-size: 1.5rem;
          }

          .cta-group {
            flex-direction: column;
            gap: 0.75rem;
          }

          .cta-separator {
            display: none;
          }
        }
      `}</style>

      {/* Header */}
      <header className="header">
        <div className="container">
          <a href="/home" className="logo">
            <img src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/6933ae9e1d466e9b7dfb6b69.png" alt="Range Medical" />
          </a>
          <div className="header-cta">
            <a href="tel:949-997-3988" className="header-phone">949-997-3988</a>
            <a href="sms:949-997-3988" className="cta-link">Text to Book</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">Peptide Therapy</span>
          <h1>Tesamorelin + Ipamorelin</h1>
          <p className="hero-subtitle">Two peptides that work together to optimize your growth hormone levels—helping you burn fat, build lean muscle, sleep better, and feel more like yourself again.</p>
          <div className="cta-group">
            <a href="sms:949-997-3988" className="cta-link">Text us to see if you're a candidate</a>
            <span className="cta-separator">or</span>
            <a href="tel:949-997-3988" className="cta-link">Call 949-997-3988</a>
          </div>
        </div>
      </section>

      {/* What Are They */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Peptides</div>
          <h2 className="section-title">Two ways to boost growth hormone</h2>
          <p className="section-subtitle">Both peptides stimulate your body to produce more growth hormone—but they do it through different pathways. That's why they work so well together.</p>
          
          <div className="peptide-grid">
            <div className="peptide-card">
              <h3>Tesamorelin</h3>
              <p className="aka">GHRH analog</p>
              <p>A synthetic version of the hormone your brain makes to trigger growth hormone release. It "tells" your pituitary gland to produce more GH, especially targeting visceral fat.</p>
              <ul className="peptide-list">
                <li>Directly stimulates growth hormone release</li>
                <li>Specifically reduces belly fat</li>
                <li>FDA-approved medication</li>
                <li>Improves metabolic markers</li>
              </ul>
            </div>
            
            <div className="peptide-card">
              <h3>Ipamorelin</h3>
              <p className="aka">Growth hormone secretagogue</p>
              <p>A selective peptide that triggers growth hormone release without spiking cortisol or prolactin. It mimics ghrelin (the hunger hormone) to signal the pituitary.</p>
              <ul className="peptide-list">
                <li>Clean GH release without side effects</li>
                <li>Supports muscle growth and recovery</li>
                <li>Improves sleep quality</li>
                <li>Gentle and well-tolerated</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Combine */}
      <section className="section section-gray section-centered">
        <div className="container">
          <div className="section-kicker">Better Together</div>
          <h2 className="section-title">Why we combine them</h2>
          <p className="section-subtitle">Using both peptides together creates a stronger, more sustained growth hormone response than either one alone.</p>
          
          <div className="synergy-box">
            <h3>The synergy effect</h3>
            <p>Tesamorelin and Ipamorelin work through different receptors. When you stimulate both pathways at once, you get a more robust and natural-feeling GH pulse—similar to what your body produced when you were younger.</p>
            <div className="synergy-points">
              <div className="synergy-point">
                <strong>Amplified Release</strong>
                Greater GH output than either peptide alone
              </div>
              <div className="synergy-point">
                <strong>Balanced Response</strong>
                Ipamorelin smooths out the GH pulse for steadier benefits
              </div>
              <div className="synergy-point">
                <strong>Broader Benefits</strong>
                Fat loss + muscle + sleep + recovery all in one protocol
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section section-centered">
        <div className="container">
          <div className="section-kicker">Benefits</div>
          <h2 className="section-title">What this combination can do</h2>
          <p className="section-subtitle">Patients on the Tesamorelin + Ipamorelin protocol commonly report improvements in:</p>
          
          <div className="benefits-grid">
            <div className="benefit-item">
              <span>✓</span>
              Reduced belly fat and visceral fat
            </div>
            <div className="benefit-item">
              <span>✓</span>
              Improved body composition
            </div>
            <div className="benefit-item">
              <span>✓</span>
              Increased lean muscle mass
            </div>
            <div className="benefit-item">
              <span>✓</span>
              Better sleep quality and depth
            </div>
            <div className="benefit-item">
              <span>✓</span>
              Faster recovery from workouts
            </div>
            <div className="benefit-item">
              <span>✓</span>
              More energy throughout the day
            </div>
            <div className="benefit-item">
              <span>✓</span>
              Improved skin elasticity and tone
            </div>
            <div className="benefit-item">
              <span>✓</span>
              Sharper mental clarity
            </div>
            <div className="benefit-item">
              <span>✓</span>
              Better cholesterol and triglycerides
            </div>
            <div className="benefit-item">
              <span>✓</span>
              Enhanced overall vitality
            </div>
          </div>
        </div>
      </section>

      {/* Who Is It For */}
      <section className="section section-gray section-centered">
        <div className="container">
          <div className="section-kicker">Is This Right For You?</div>
          <h2 className="section-title">This protocol may be a good fit if you</h2>
          <p className="section-subtitle">Here's who tends to see the best results from Tesamorelin + Ipamorelin.</p>
          
          <div className="ideal-grid">
            <div className="ideal-item">
              <span>⚖️</span>
              Have stubborn belly fat that won't budge
            </div>
            <div className="ideal-item">
              <span>😴</span>
              Don't sleep as well as you used to
            </div>
            <div className="ideal-item">
              <span>💪</span>
              Want to build or maintain muscle as you age
            </div>
            <div className="ideal-item">
              <span>🔋</span>
              Feel like your energy has declined
            </div>
            <div className="ideal-item">
              <span>🏃</span>
              Take longer to recover from workouts
            </div>
            <div className="ideal-item">
              <span>🧬</span>
              Want to optimize GH without direct HGH injections
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-centered">
        <div className="container">
          <div className="section-kicker">The Process</div>
          <h2 className="section-title">How it works at Range Medical</h2>
          <p className="section-subtitle">We make it straightforward to get started and stay on track.</p>
          
          <div className="how-it-works">
            <div className="how-step">
              <div className="step-number">1</div>
              <h3>Consultation + Labs</h3>
              <p>We review your health history, goals, and run bloodwork to make sure this protocol is right for you.</p>
            </div>
            <div className="how-step">
              <div className="step-number">2</div>
              <h3>Custom Protocol</h3>
              <p>Your provider creates a dosing plan tailored to your needs. Medication ships from a licensed US pharmacy.</p>
            </div>
            <div className="how-step">
              <div className="step-number">3</div>
              <h3>Ongoing Support</h3>
              <p>We monitor your progress with follow-up labs and adjust your protocol as needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">What to Expect</div>
          <h2 className="section-title">Timeline and results</h2>
          <p className="section-subtitle">This isn't a quick fix—it works gradually with your body. Most patients commit to at least 3-6 months for full benefits.</p>
          
          <div className="card-grid">
            <div className="card">
              <div className="card-icon">📅</div>
              <h3>Weeks 1-4</h3>
              <p>Improved sleep is often the first thing patients notice. You may feel more rested and have steadier energy throughout the day.</p>
            </div>
            <div className="card">
              <div className="card-icon">📈</div>
              <h3>Months 2-3</h3>
              <p>Body composition starts to shift. Clothes fit differently. Workouts feel more productive. Recovery improves noticeably.</p>
            </div>
            <div className="card">
              <div className="card-icon">✨</div>
              <h3>Months 4-6</h3>
              <p>Significant changes in body composition. Visible fat loss, especially around the midsection. Many patients report feeling years younger.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Administration */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Administration</div>
          <h2 className="section-title">How it's taken</h2>
          <p className="section-subtitle">This protocol involves a daily subcutaneous injection—a small needle just under the skin. Most patients inject at bedtime.</p>
          
          <div className="two-col">
            <div className="info-card">
              <h3>The basics</h3>
              <ul className="info-list checks">
                <li>Once daily injection (bedtime)</li>
                <li>Small insulin-type needle</li>
                <li>Injected into the abdomen</li>
                <li>Takes less than a minute</li>
                <li>Combined in one injection for convenience</li>
              </ul>
            </div>
            <div className="info-card">
              <h3>Why bedtime?</h3>
              <ul className="info-list checks">
                <li>Growth hormone naturally peaks during sleep</li>
                <li>Amplifies your body's natural rhythm</li>
                <li>May enhance deep sleep phases</li>
                <li>Easy to build into your routine</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="section section-dark section-centered">
        <div className="container">
          <div className="section-kicker">Safety & Quality</div>
          <h2 className="section-title">Your safety is our priority</h2>
          <p className="section-subtitle">Both peptides have strong safety profiles when used appropriately. We only work with licensed US compounding pharmacies, and every prescription is reviewed by our medical team. We monitor your labs throughout treatment to ensure safety and effectiveness.</p>
        </div>
      </section>

      {/* Side Effects */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Side Effects</div>
          <h2 className="section-title">What to know</h2>
          <p className="section-subtitle">Most people tolerate this combination well. Ipamorelin in particular is known for being gentle. Here's what's been reported.</p>
          
          <div className="two-col">
            <div className="info-card">
              <h3>Common (usually mild)</h3>
              <ul className="info-list checks">
                <li>Injection site reactions (redness, itching)</li>
                <li>Temporary water retention</li>
                <li>Tingling in hands or fingers</li>
                <li>Joint stiffness (usually early on)</li>
                <li>Increased hunger (from Ipamorelin)</li>
              </ul>
            </div>
            <div className="info-card">
              <h3>May not be right for you if</h3>
              <ul className="info-list">
                <li>You have active cancer or certain cancer history</li>
                <li>You're pregnant or planning to become pregnant</li>
                <li>You have uncontrolled diabetes</li>
                <li>You have a pituitary disorder</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker section-centered">FAQ</div>
          <h2 className="section-title section-centered" style={{ textAlign: 'center' }}>Common questions</h2>
          
          <div className="faq-list">
            <div className="faq-item">
              <div className="faq-question">Is this the same as taking HGH?</div>
              <div className="faq-answer">No. HGH directly adds growth hormone to your body. Tesamorelin + Ipamorelin stimulate your own pituitary gland to produce more—working with your body's natural feedback system. This means your body still regulates how much GH is released.</div>
            </div>
            <div className="faq-item">
              <div className="faq-question">How long do I need to take it?</div>
              <div className="faq-answer">Most patients see optimal results with 3-6 months of treatment. Some continue longer or do maintenance cycles. Your provider will help you decide what makes sense based on your goals and response.</div>
            </div>
            <div className="faq-item">
              <div className="faq-question">Will I gain the fat back if I stop?</div>
              <div className="faq-answer">Some fat may return over time, especially if lifestyle habits change. But many patients maintain significant improvements, particularly if they've also improved their diet and exercise. Maintenance protocols are an option.</div>
            </div>
            <div className="faq-item">
              <div className="faq-question">Can I combine this with other treatments?</div>
              <div className="faq-answer">Yes. This protocol is often part of a broader optimization plan that may include hormone therapy, other peptides, or metabolic support. Your provider will design a comprehensive approach based on your labs and goals.</div>
            </div>
            <div className="faq-item">
              <div className="faq-question">Will this affect my natural GH production long-term?</div>
              <div className="faq-answer">Studies haven't shown lasting suppression of natural GH production after stopping these peptides. Because they work through your body's own system (rather than replacing GH directly), your pituitary continues to function normally.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta" id="book">
        <div className="container">
          <h2>Ready to learn more?</h2>
          <p>Text us to see if Tesamorelin + Ipamorelin is right for you. We'll review your health history, answer your questions, and create a plan tailored to your goals.</p>
          <div className="cta-group">
            <a href="sms:949-997-3988" className="cta-link">Text Us to Get Started</a>
            <span className="cta-separator">or</span>
            <a href="tel:949-997-3988" className="cta-link">Call 949-997-3988</a>
          </div>
          <div className="location-info">
            <strong>Range Medical</strong><br />
            1901 Westcliff Dr, Suite 10 · Newport Beach, CA
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <img src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/6933ae9e1d466e9b7dfb6b69.png" alt="Range Medical" />
          <p>© 2025 Range Medical. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
