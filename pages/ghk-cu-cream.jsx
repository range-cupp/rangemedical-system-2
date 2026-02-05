import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';

export default function GHKCuCream() {
  return (
    <Layout
      title="GHK-Cu Face Cream | Range Medical | Newport Beach"
      description="GHK-Cu copper peptide cream for skin repair, collagen production, and anti-aging. Prescription-only at Range Medical Newport Beach. Call (949) 997-3988."
    >
      <Head>
        <meta name="keywords" content="GHK-Cu cream, copper peptide cream, anti-aging cream, collagen cream, skin repair peptide, Newport Beach skincare, Orange County anti-aging" />
        <link rel="canonical" href="https://www.range-medical.com/ghk-cu-cream" />
        <meta property="og:title" content="GHK-Cu Face Cream | Range Medical" />
        <meta property="og:description" content="GHK-Cu copper peptide cream for skin repair, collagen production, and anti-aging. Prescription-only." />
        <meta property="og:url" content="https://www.range-medical.com/ghk-cu-cream" />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">🧬 Peptide Therapy</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <p className="hero-kicker">Skin · Repair · Peptides</p>
        <h1>GHK-Cu Face Cream: Your Skin's Natural Repair Signal</h1>
        <p className="hero-sub">
          A copper peptide that tells your skin to rebuild collagen, smooth fine lines, and restore that healthy glow you thought was gone forever.
        </p>
        <div className="hero-scroll">
          Scroll to explore
          <span>↓</span>
        </div>
      </section>

      {/* What is GHK-Cu */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div className="intro-grid">
            <div className="intro-text">
              <p className="section-kicker-left">What Is GHK-Cu?</p>
              <h2>A Peptide Your Body Already Knows</h2>
              <p>
                GHK-Cu is a small protein (called a peptide) that your body makes naturally. It's made of three amino acids—glycine, histidine, and lysine—attached to a copper molecule.
              </p>
              <p>
                When you're young, you have plenty of it. It helps wounds heal fast and keeps skin firm. But as you age, your GHK-Cu levels drop. By 60, you have about 60% less than you did at 20.
              </p>
              <p>
                This cream puts that repair signal back where it belongs—right on your skin.
              </p>
              <ul className="check-list">
                <li>Naturally found in your blood and skin</li>
                <li>Signals cells to repair and rebuild</li>
                <li>Levels decline significantly with age</li>
                <li>Well-studied since the 1970s</li>
              </ul>
            </div>
            <div className="intro-visual">
              <span className="visual-icon">🧬</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Science */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">The Science</p>
          <h2 className="section-title">What GHK-Cu Does For Your Skin</h2>
          <p className="section-subtitle">
            This peptide works on multiple pathways to help your skin repair itself the way it did when you were younger.
          </p>
          <div className="tools-grid">
            <div className="tool-card">
              <div className="tool-icon">🔧</div>
              <h3>Boosts Collagen Production</h3>
              <p>GHK-Cu signals your skin cells (fibroblasts) to make more collagen and elastin—the proteins that keep skin firm and bouncy.</p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">🩹</div>
              <h3>Speeds Up Repair</h3>
              <p>It activates wound healing pathways, helping your skin recover faster from damage, whether from sun exposure, acne, or just daily wear.</p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">🛡️</div>
              <h3>Fights Inflammation</h3>
              <p>GHK-Cu has natural anti-inflammatory effects, calming redness and irritation while protecting against oxidative stress.</p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">🌱</div>
              <h3>Supports Blood Flow</h3>
              <p>It encourages new blood vessel formation (angiogenesis), bringing more nutrients and oxygen to skin cells for better overall health.</p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">💧</div>
              <h3>Improves Hydration</h3>
              <p>By supporting your skin's structure, GHK-Cu helps it hold onto moisture better, reducing that dry, crepe-paper look.</p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">✨</div>
              <h3>Refines Texture</h3>
              <p>Over time, the combination of these effects smooths fine lines, reduces rough patches, and creates a more even skin tone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">Benefits</p>
          <h2 className="section-title">What You Can Expect</h2>
          <p className="section-subtitle">
            GHK-Cu isn't a miracle overnight cream—it works with your skin's biology over time for real, lasting results.
          </p>
          <div className="tools-grid">
            <div className="tool-card">
              <div className="tool-icon">⚖️</div>
              <h3>Firmer, More Elastic Skin</h3>
              <p>As collagen production increases, skin becomes more resilient and supple. That "bounce back" you miss starts to return.</p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">📉</div>
              <h3>Reduced Fine Lines</h3>
              <p>Shallow wrinkles and creases soften as your skin rebuilds its structural support from underneath.</p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">🌟</div>
              <h3>Healthier Glow</h3>
              <p>Better circulation and hydration give your skin that alive, healthy look that makeup can't fake.</p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">🧘</div>
              <h3>Calmer Skin</h3>
              <p>Anti-inflammatory properties help reduce redness, sensitivity, and irritation—even for reactive skin types.</p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">🔄</div>
              <h3>Faster Recovery</h3>
              <p>Skin heals more quickly from minor injuries, procedures, or breakouts thanks to activated repair pathways.</p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">🎯</div>
              <h3>Better Texture</h3>
              <p>Over weeks of use, rough patches smooth out and skin develops a more refined, even quality.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">How to Use</p>
          <h2 className="section-title">Simple Daily Application</h2>
          <p className="section-subtitle">
            Getting results from GHK-Cu is straightforward. Just add it to your morning and evening routine.
          </p>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Cleanse</h3>
              <p>Wash your face with a gentle cleanser and pat completely dry.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Apply</h3>
              <p>Put a small amount on your fingertips and massage onto face and neck in upward motions.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Moisturize</h3>
              <p>Follow with your regular moisturizer to lock everything in.</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Protect</h3>
              <p>In the morning, always finish with broad-spectrum sunscreen (SPF 30+).</p>
            </div>
          </div>
          <p className="pro-tip">
            <strong>Pro tip:</strong> Use morning and night for best results. The cream is blue but absorbs without staining.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">Results Timeline</p>
          <h2 className="section-title">When You'll See Changes</h2>
          <p className="section-subtitle">
            Collagen remodeling takes time. Here's a realistic timeline of what to expect with consistent use.
          </p>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-period">Week 1-2</div>
              <div className="timeline-content">
                <h3>Immediate Comfort</h3>
                <p>Most people notice their skin feels softer and more hydrated. If you have any irritation or redness, it may start to calm down.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-period">Week 3-4</div>
              <div className="timeline-content">
                <h3>Texture Improvements</h3>
                <p>Skin starts to feel smoother to the touch. Rough patches may begin to soften. Your morning "glow" becomes more consistent.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-period">Week 6-8</div>
              <div className="timeline-content">
                <h3>Visible Firming</h3>
                <p>This is when collagen changes become visible. Fine lines around eyes and mouth may look softer. Skin appears plumper overall.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-period">Week 12+</div>
              <div className="timeline-content">
                <h3>Full Results</h3>
                <p>Maximum benefits typically show by 3 months. Continued use maintains results. Many patients report people asking what they're doing differently.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Should / Shouldn't */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">Is This Right For You?</p>
          <h2 className="section-title">Good Candidates & Considerations</h2>
          <p className="section-subtitle">
            GHK-Cu works well for most people, but here's what to know before starting.
          </p>
          <div className="consideration-grid">
            <div className="consideration-card positive">
              <h3>✓ Great Fit If You...</h3>
              <ul>
                <li>Want to address fine lines and loss of firmness</li>
                <li>Are looking for a science-backed anti-aging option</li>
                <li>Prefer building collagen naturally over fillers</li>
                <li>Have sun damage or uneven texture</li>
                <li>Want to support skin recovery after procedures</li>
                <li>Are patient enough for gradual, lasting results</li>
              </ul>
            </div>
            <div className="consideration-card caution">
              <h3>! Talk to Us First If...</h3>
              <ul>
                <li>You're pregnant or breastfeeding</li>
                <li>You have very sensitive or reactive skin (we'll suggest a slower start)</li>
                <li>You have a known allergy to copper peptides</li>
                <li>You're on other prescription skincare (we'll check for interactions)</li>
                <li>You have active skin infections or open wounds</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">Questions</p>
          <h2 className="section-title">Common Questions About GHK-Cu</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3>Will the cream stain my skin blue?</h3>
              <p>No. While the cream has a blue color from the copper, it absorbs completely without staining. If you see any color on application, it fades within seconds.</p>
            </div>
            <div className="faq-item">
              <h3>Can I use it with retinol or other actives?</h3>
              <p>Generally yes, but it depends on what you're using. GHK-Cu actually pairs well with most ingredients since it has anti-inflammatory properties. We'll review your current routine during your consultation.</p>
            </div>
            <div className="faq-item">
              <h3>Is this the same as the GHK-Cu injections?</h3>
              <p>Same peptide, different delivery. The cream targets skin specifically and is applied topically. Injectable GHK-Cu has broader systemic effects. Many patients use both for different purposes.</p>
            </div>
            <div className="faq-item">
              <h3>How long does one bottle last?</h3>
              <p>With twice-daily use on face and neck, most patients get 4-6 weeks from each bottle. Usage varies based on how much area you're covering.</p>
            </div>
            <div className="faq-item">
              <h3>How much does it cost?</h3>
              <p>GHK-Cu cream is $299/month, which includes the prescription medication from our pharmacy. You'll start with a free Range Assessment to determine if it's right for your skin goals.</p>
            </div>
            <div className="faq-item">
              <h3>Do I need a prescription?</h3>
              <p>Yes, GHK-Cu cream is a prescription medication dispensed from our pharmacy. Start with a free Range Assessment where we'll review your skin goals and determine if GHK-Cu is right for you.</p>
            </div>
            <div className="faq-item">
              <h3>What if I have sensitive skin?</h3>
              <p>GHK-Cu is actually calming for most sensitive skin types because of its anti-inflammatory effects. We typically recommend starting every other night and working up to twice daily.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Ready to Start?</h2>
          <p>GHK-Cu cream is $299/month, prescribed through our pharmacy after your Range Assessment (free).</p>
          <div className="cta-buttons">
            <a href="/range-assessment" className="btn-white">Take Assessment</a>
          </div>
          <p className="cta-location">📍 Range Medical • 1901 Westcliff Dr, Newport Beach</p>
        </div>
      </section>

      <style jsx>{`
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
        .trust-rating {
          color: #fbbf24;
        }

        /* Hero */
        .hero {
          padding: 4rem 1.5rem 5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .hero-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1.25rem;
        }
        .hero h1 {
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #171717;
          max-width: 680px;
          margin: 0 0 1.5rem;
        }
        .hero-sub {
          font-size: 1.125rem;
          color: #525252;
          max-width: 620px;
          margin: 0 auto 2.5rem;
          line-height: 1.7;
          text-align: center;
        }
        .hero-scroll {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .hero-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: bounce 2s ease-in-out infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* Buttons */
        .btn-primary {
          display: inline-block;
          background: #000000;
          color: #ffffff;
          padding: 0.875rem 2rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }
        .btn-primary:hover {
          background: #262626;
          transform: translateY(-1px);
        }
        .btn-outline {
          display: inline-block;
          background: transparent;
          color: #000000;
          padding: 0.875rem 2rem;
          border-radius: 8px;
          border: 2px solid #000000;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }
        .btn-outline:hover {
          background: #000000;
          color: #ffffff;
        }
        .btn-white {
          display: inline-block;
          background: #ffffff;
          color: #000000;
          padding: 0.875rem 2rem;
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
          padding: 0.875rem 2rem;
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

        /* Sections */
        .section {
          padding: 4rem 1.5rem;
        }
        .section-gray {
          background: #fafafa;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
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
        .section-kicker-left {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.75rem;
        }
        .section-title {
          font-size: 2rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
          color: #171717;
        }
        .section-subtitle {
          font-size: 1.0625rem;
          color: #525252;
          text-align: center;
          max-width: 700px;
          margin: 0 auto 2.5rem;
          line-height: 1.7;
        }

        /* Intro Grid */
        .intro-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }
        .intro-text h2 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #171717;
          margin-bottom: 1.5rem;
        }
        .intro-text p {
          font-size: 1rem;
          line-height: 1.7;
          color: #525252;
          margin-bottom: 1rem;
        }
        .intro-visual {
          background: linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%);
          border-radius: 12px;
          padding: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }
        .visual-icon {
          font-size: 8rem;
          opacity: 0.8;
        }

        /* Check List */
        .check-list {
          list-style: none;
          margin-top: 1.5rem;
          padding: 0;
        }
        .check-list li {
          padding: 0.5rem 0 0.5rem 1.75rem;
          position: relative;
          font-size: 0.9375rem;
          color: #525252;
        }
        .check-list li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #000000;
          font-weight: 600;
        }

        /* Tools Grid */
        .tools-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .tool-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
          transition: all 0.2s;
        }
        .tool-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .tool-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        .tool-card h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
        }
        .tool-card p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.6;
        }

        /* Steps Grid */
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          counter-reset: step;
        }
        .step-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem 1.5rem;
          position: relative;
          text-align: center;
        }
        .step-number {
          position: absolute;
          top: -16px;
          left: 50%;
          transform: translateX(-50%);
          width: 32px;
          height: 32px;
          background: #000000;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
        }
        .step-card h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
          margin-top: 0.5rem;
        }
        .step-card p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.6;
        }
        .pro-tip {
          text-align: center;
          margin-top: 2rem;
          color: #737373;
          font-size: 0.9375rem;
        }
        .pro-tip strong {
          color: #171717;
        }

        /* Timeline */
        .timeline {
          max-width: 700px;
          margin: 0 auto;
        }
        .timeline-item {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 2rem;
          padding: 2rem 0;
          border-bottom: 1px solid #e5e5e5;
        }
        .timeline-item:last-child {
          border-bottom: none;
        }
        .timeline-period {
          font-size: 0.875rem;
          font-weight: 700;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .timeline-content h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }
        .timeline-content p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.6;
        }

        /* Consideration Grid */
        .consideration-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        .consideration-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
        }
        .consideration-card.positive {
          border-color: #22c55e;
        }
        .consideration-card.caution {
          border-color: #f59e0b;
        }
        .consideration-card h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 1rem;
        }
        .consideration-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .consideration-card ul li {
          padding: 0.5rem 0 0.5rem 1.5rem;
          position: relative;
          font-size: 0.9375rem;
          color: #525252;
        }
        .consideration-card.positive ul li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #22c55e;
          font-weight: 600;
        }
        .consideration-card.caution ul li::before {
          content: "!";
          position: absolute;
          left: 0;
          color: #f59e0b;
          font-weight: 700;
        }

        /* FAQ */
        .faq-list {
          max-width: 800px;
          margin: 0 auto;
        }
        .faq-item {
          border-bottom: 1px solid #e5e5e5;
          padding: 1.5rem 0;
        }
        .faq-item:last-child {
          border-bottom: none;
        }
        .faq-item h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
        }
        .faq-item p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
        }

        /* Final CTA */
        .final-cta {
          background: #000000;
          color: #ffffff;
          padding: 5rem 1.5rem;
          text-align: center;
        }
        .final-cta h2 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        .final-cta p {
          font-size: 1.0625rem;
          color: rgba(255,255,255,0.8);
          max-width: 500px;
          margin: 0 auto 2rem;
        }
        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }
        .cta-location {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.6);
        }

        /* Responsive */
        @media (max-width: 900px) {
          .hero h1 {
            font-size: 2rem;
          }
          .intro-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .intro-visual {
            order: -1;
            min-height: 250px;
          }
          .tools-grid {
            grid-template-columns: 1fr;
          }
          .steps-grid {
            grid-template-columns: 1fr 1fr;
          }
          .consideration-grid {
            grid-template-columns: 1fr;
          }
          .section {
            padding: 3rem 1.5rem;
          }
          .timeline-item {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }
        }

        @media (max-width: 640px) {
          .hero h1 {
            font-size: 1.75rem;
          }
          .section-title {
            font-size: 1.5rem;
          }
          .steps-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
}
