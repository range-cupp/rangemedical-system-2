import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';

export default function ExosomesTherapy() {
  return (
    <Layout
      title="Exosome IV Therapy | Range Medical | Newport Beach"
      description="Exosome therapy delivers powerful cell-signaling molecules to support tissue repair, reduce inflammation, and promote regeneration throughout your body."
    >
      <Head>
        <meta name="keywords" content="exosome therapy Newport Beach, exosome IV, regenerative medicine, anti-aging treatment, cellular regeneration" />
        <link rel="canonical" href="https://www.range-medical.com/exosome-therapy" />
        <meta property="og:title" content="Exosome IV Therapy | Range Medical | Newport Beach" />
        <meta property="og:description" content="Exosome therapy delivers powerful cell-signaling molecules to support tissue repair and regeneration." />
        <meta property="og:url" content="https://www.range-medical.com/exosome-therapy" />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">🧬 Advanced Regenerative</span>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">Regenerative</span>
          <h1>Exosome IV Therapy</h1>
          <p className="hero-sub">
            Exosomes are tiny messengers that tell your cells to repair, regenerate, and reduce inflammation.
            Delivered by IV, they work throughout your entire body.
          </p>
          <div className="hero-cta">
            <Link href="/range-assessment" className="btn-primary">Book Assessment</Link>
            <p className="hero-secondary">
              Your provider will determine if exosome therapy fits your goals.
            </p>
          </div>
        </div>
      </section>

      {/* What Are Exosomes */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">The Science</p>
          <h2 className="section-title">What Are Exosomes?</h2>
          <p className="section-subtitle">
            Exosomes are nano-sized vesicles (tiny packages) released by cells. They carry proteins, 
            growth factors, and genetic material that communicate with other cells.
          </p>

          <div style={{maxWidth: '700px', margin: '0 auto'}}>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '1.25rem'}}>
              Think of exosomes as your body's text messages. They tell cells what to do: repair damage, 
              reduce inflammation, grow new tissue, or calm down an overactive immune response.
            </p>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '1.25rem'}}>
              The exosomes we use come from carefully screened donor tissue and contain billions of 
              these signaling particles. When delivered by IV, they circulate throughout your body 
              and support healing wherever it's needed.
            </p>
            <p style={{fontSize: '1rem', lineHeight: '1.8', color: '#525252', marginBottom: '0'}}>
              This is cutting-edge regenerative medicine — working at the cellular level to help 
              your body heal itself more effectively.
            </p>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">Is This You?</p>
          <h2 className="section-title">Who Exosome Therapy Helps</h2>

          <div className="tools-grid">
            <div className="tool-card">
              <h4><span>🔄</span> Systemic Inflammation</h4>
              <p>Chronic inflammation that affects your whole body, energy, and how you feel day to day.</p>
            </div>
            <div className="tool-card">
              <h4><span>⏳</span> Anti-Aging & Longevity</h4>
              <p>Support cellular health and slow the effects of aging at the deepest level.</p>
            </div>
            <div className="tool-card">
              <h4><span>🧠</span> Brain Health</h4>
              <p>Cognitive support, brain fog, and neurological recovery after injury or illness.</p>
            </div>
            <div className="tool-card">
              <h4><span>💪</span> Recovery & Performance</h4>
              <p>Athletes and active people looking for faster recovery and better tissue repair.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">What It Does</p>
          <h2 className="section-title">How Exosomes Support Your Body</h2>

          <div className="tools-grid">
            <div className="tool-card">
              <h4>Tissue Repair</h4>
              <p>Signals cells to regenerate and repair damaged tissue throughout the body.</p>
            </div>
            <div className="tool-card">
              <h4>Reduce Inflammation</h4>
              <p>Calms overactive immune responses and systemic inflammation.</p>
            </div>
            <div className="tool-card">
              <h4>Cellular Communication</h4>
              <p>Improves how your cells talk to each other, optimizing function.</p>
            </div>
            <div className="tool-card">
              <h4>Immune Modulation</h4>
              <p>Helps balance immune function — not too high, not too low.</p>
            </div>
            <div className="tool-card">
              <h4>Collagen Production</h4>
              <p>Supports skin, joint, and connective tissue health.</p>
            </div>
            <div className="tool-card">
              <h4>Neuroprotection</h4>
              <p>Supports brain health and may help with cognitive function.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Treatment */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">The Process</p>
          <h2 className="section-title">What to Expect</h2>

          <div className="doors-grid">
            <div className="door-card">
              <h4>The Treatment</h4>
              <p>Exosomes are delivered through a standard IV infusion. The session takes about 30-60 minutes. Most people feel fine during and after — some report a boost in energy within days.</p>
            </div>
            <div className="door-card">
              <h4>How Many Treatments?</h4>
              <p>Some patients see benefits from a single infusion. Others benefit from a series of 2-3 treatments spaced weeks apart, depending on their goals.</p>
            </div>
            <div className="door-card">
              <h4>Results Timeline</h4>
              <p>Effects can begin within days, but the full regenerative benefits often develop over 2-3 months as your cells respond to the signaling.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Combines Well With */}
      <section className="section section-gray">
        <div className="container">
          <p className="section-kicker">Enhanced Results</p>
          <h2 className="section-title">Exosomes Work Well With</h2>
          <p className="section-subtitle">
            Many patients combine exosome therapy with other treatments for enhanced results.
          </p>

          <div className="tools-grid" style={{maxWidth: '800px', margin: '0 auto'}}>
            <div className="tool-card">
              <h4>NAD+ Therapy</h4>
              <p>Supports cellular energy production alongside exosome regeneration.</p>
            </div>
            <div className="tool-card">
              <h4>Hyperbaric Oxygen</h4>
              <p>Increased oxygen enhances the healing environment for exosomes to work.</p>
            </div>
            <div className="tool-card">
              <h4>PRP Injections</h4>
              <p>For targeted joint or tissue issues, PRP and exosomes complement each other.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <p className="section-kicker">Questions</p>
          <h2 className="section-title">Common Questions</h2>

          <div className="doors-grid">
            <div className="door-card">
              <h4>Where do the exosomes come from?</h4>
              <p>The exosomes we use are derived from carefully screened, ethically sourced donor tissue. They go through rigorous testing for safety and potency.</p>
            </div>
            <div className="door-card">
              <h4>Is exosome therapy safe?</h4>
              <p>Exosomes have a strong safety profile. Because they're cell-free (no actual cells), there's minimal risk of rejection. Side effects are rare and typically mild.</p>
            </div>
            <div className="door-card">
              <h4>Is this the same as stem cell therapy?</h4>
              <p>No. Exosomes are not cells — they're the signaling molecules that cells release. They provide many benefits of regenerative medicine without the complexity of stem cells.</p>
            </div>
            <div className="door-card">
              <h4>Is exosome therapy covered by insurance?</h4>
              <p>No. This is considered an elective regenerative treatment. We can provide documentation for HSA/FSA if applicable.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <span className="cta-step">Get Started</span>
          <h2>Interested in Exosome Therapy?</h2>
          <p>Book a Range Assessment. Your provider will review your goals and determine if exosome therapy is a good fit.</p>
          <div className="cta-buttons">
            <Link href="/range-assessment" className="btn-white">
              Book Assessment
            </Link>
          </div>
          <p className="cta-location">📍 Range Medical • 1901 Westcliff Dr, Newport Beach</p>
        </div>
      </section>
    </Layout>
  );
}
