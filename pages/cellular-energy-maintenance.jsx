import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';

export default function CellularEnergyMaintenance() {
  return (
    <Layout
      title="Cellular Energy Maintenance | Range Medical"
      description="Maintain your Reset results with ongoing HBOT and Red Light sessions. For 6-Week Reset graduates."
    >
      <Head>
        <meta name="robots" content="noindex" />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">🔄 For Reset Graduates</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <span className="hero-badge">After Your Reset</span>
        <h1>Maintain Your Results</h1>
        <p className="hero-sub">
          You worked hard to restore your cellular energy. Keep it optimized with ongoing sessions at a reduced frequency.
        </p>
        <div className="hero-cta">
          <p className="hero-secondary">
            This page is for 6-Week Reset graduates. <Link href="/range-assessment"><strong>Not a graduate?</strong></Link>
          </p>
        </div>
      </section>

      {/* Why Maintenance */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">The Science</p>
          <h2 className="section-title">Why Maintenance Matters</h2>

          <div style={{maxWidth: '700px', margin: '0 auto'}}>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '1.25rem'}}>
              The improvements you made during the Reset are real, but mitochondrial function gradually declines without ongoing support.
            </p>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '1.25rem'}}>
              Most patients see their gains start to fade after 2-3 months without maintenance. The good news: you don't need the same intensity. Once a week keeps you at your new baseline.
            </p>
          </div>
        </div>
      </section>

      {/* Two Tiers */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">Options</p>
          <h2 className="section-title">Maintenance Options</h2>

          <div className="offer-grid" style={{maxWidth: '800px', margin: '0 auto'}}>
            <div className="offer-card">
              <h3>Base Maintenance</h3>
              <div className="offer-price">$599<span style={{fontSize: '1rem', fontWeight: '400'}}>/4 weeks</span></div>
              <ul>
                <li>4 Hyperbaric Oxygen Sessions</li>
                <li>4 Red Light Therapy Sessions</li>
                <li>Quarterly check-in with provider</li>
                <li>Priority scheduling</li>
              </ul>
              <p className="offer-best">Best for: Maintaining your baseline energy</p>
            </div>

            <div className="offer-card featured">
              <span className="offer-badge">Most Popular</span>
              <h3>Maintenance + IV</h3>
              <div className="offer-price">$799<span style={{fontSize: '1rem', fontWeight: '400'}}>/4 weeks</span></div>
              <ul>
                <li>Everything in Base, plus:</li>
                <li>1 Energy IV per cycle</li>
                <li>Enhanced nutrient support</li>
                <li>Best for high performers</li>
              </ul>
              <p className="offer-best">Best for: Maximum ongoing support</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">Questions</p>
          <h2 className="section-title">Maintenance FAQ</h2>

          <div className="faq-container">
            <div className="faq-item">
              <h4>When do I start Maintenance?</h4>
              <p>Your provider discusses Maintenance at your Week 7 Results Review. Most patients start the following week.</p>
            </div>

            <div className="faq-item">
              <h4>Can I switch between tiers?</h4>
              <p>Yes. You can upgrade or downgrade at any cycle renewal.</p>
            </div>

            <div className="faq-item">
              <h4>What if I haven't done the Reset?</h4>
              <p>Maintenance is for Reset graduates. If you're starting fresh, begin with a <Link href="/range-assessment"><strong>Range Assessment</strong></Link>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Questions About Maintenance?</h2>
          <p>Talk to your provider at your Week 7 Results Review, or call us.</p>
          <p style={{marginTop: '1rem'}}>
            <a href="tel:+19499973988" style={{color: '#fff', fontWeight: '600', fontSize: '1.25rem'}}>(949) 997-3988</a>
          </p>
          <p className="cta-location">📍 Range Medical • Newport Beach</p>
        </div>
      </section>
    </Layout>
  );
}
