import Layout from '../components/Layout';
import Head from 'next/head';

export default function ElitePanelMaleGuide() {
  return (
    <Layout
      title="Elite Blood Panel Guide — Male | Range Medical"
      description="Your guide to the Elite Blood Panel for men. The most comprehensive lab panel we offer. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "MedicalWebPage", "name": "Elite Blood Panel Guide — Male", "description": "Patient guide for the Elite Blood Panel for men including biomarkers tested and what to expect.", "url": "https://www.range-medical.com/elite-panel-male-guide", "provider": { "@type": "MedicalBusiness", "name": "Range Medical", "telephone": "+1-949-997-3988", "address": { "@type": "PostalAddress", "streetAddress": "1901 Westcliff Dr. Suite 10", "addressLocality": "Newport Beach", "addressRegion": "CA", "postalCode": "92660", "addressCountry": "US" } } }) }} />
      </Head>

      <section className="peptide-hero">
        <div className="container">
          <span className="hero-badge">Your Lab Results Guide</span>
          <h1>Elite Blood Panel — Male</h1>
          <p className="hero-sub">Everything you need to know about your lab panel — what we tested, why it matters, and what comes next.</p>
          <div className="hero-dose">
            <div><span>Price:</span> $750</div>
            <div><span>Includes:</span> Labs + Provider Review</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-kicker">Beyond the Essential</div>
          <h2 className="section-title">Why the Elite Panel?</h2>
          <p className="body-text">The Elite Panel includes everything in the Essential — plus advanced cardiac markers, inflammation markers, a deeper hormone profile, and a full vitamin and mineral panel. If you want the most complete picture of your health, this is it. We check markers most doctors never order — like Apolipoprotein B, Lipoprotein(a), homocysteine, and high-sensitivity CRP — because catching problems early is the whole point.</p>
        </div>
      </section>

      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">What We Test</div>
          <h2 className="section-title">Your Elite Panel</h2>
          <p className="section-subtitle">The most comprehensive lab panel we offer — covering hormones, thyroid, metabolism, heart health, inflammation, and key vitamins and minerals.</p>
          <div className="info-grid">
            <div className="info-card">
              <h3>🩸 Basic Health</h3>
              <ul><li>CMP (liver, kidneys, blood sugar)</li><li>Lipid Panel (cholesterol, triglycerides)</li><li>CBC (blood cells, anemia, infection)</li></ul>
            </div>
            <div className="info-card">
              <h3>🧬 Hormones</h3>
              <ul><li>Testosterone (Total & Free)</li><li>SHBG</li><li>Estradiol</li><li>FSH</li><li>DHEA-S</li><li>IGF-1</li><li>Cortisol</li><li>LH</li></ul>
            </div>
            <div className="info-card">
              <h3>🦋 Thyroid</h3>
              <ul><li>TSH</li><li>T3 Free</li><li>T4 Total</li><li>T4 Free</li><li>TPO Antibodies</li><li>Thyroglobulin Antibodies</li></ul>
            </div>
            <div className="info-card">
              <h3>📊 Metabolism</h3>
              <ul><li>Fasting Insulin</li><li>HgbA1c</li><li>Uric Acid</li><li>GGT</li></ul>
            </div>
            <div className="info-card">
              <h3>❤️ Heart Health</h3>
              <ul><li>Apolipoprotein A-1</li><li>Apolipoprotein B</li><li>Lipoprotein(a)</li><li>Homocysteine</li></ul>
            </div>
            <div className="info-card">
              <h3>🔥 Inflammation & Vitamins</h3>
              <ul><li>CRP-HS</li><li>Sed Rate</li><li>B12</li><li>Folate</li><li>Magnesium</li><li>Iron</li><li>TIBC</li><li>Ferritin</li><li>Vitamin D</li></ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-kicker">What's Included</div>
          <h2 className="section-title">More Than Just Lab Work</h2>
          <p className="section-subtitle">Your panel includes a one-on-one visit with your provider to review every result.</p>
          <div className="info-grid">
            <div className="info-card">
              <h3>🔬 Full Lab Panel</h3>
              <p>All biomarkers listed above drawn at our clinic. Results in 3-5 business days.</p>
            </div>
            <div className="info-card">
              <h3>👨‍⚕️ Provider Review</h3>
              <p>Your provider reviews every result with you, explains what it means in plain language, and discusses next steps based on your goals.</p>
            </div>
          </div>
          <div className="tip-box" style={{ marginTop: '1.5rem' }}>
            <strong>📋 Fasting Required</strong>
            <p>Fast for 8-12 hours before your blood draw for accurate insulin, glucose, and lipid results. Water is fine.</p>
          </div>
        </div>
      </section>

      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Why These Markers</div>
          <h2 className="section-title">What Makes This Panel Different</h2>
          <p className="body-text">Most doctors check total testosterone and call it a day. We test free testosterone — what your body actually uses. We run a full thyroid panel including antibodies, not just TSH. We check fasting insulin to catch metabolic issues before they become diabetes. We add advanced cardiac markers like ApoB and Lp(a) that most primary care doctors never order. And we use optimal ranges — not just "normal" — because normal includes sick people.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="disclaimer">
            <p><strong>Important:</strong> Individual results vary. Lab results are reviewed and interpreted by licensed providers. These tests are not intended to diagnose, treat, cure, or prevent any disease without clinical context.</p>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container">
          <h2>Questions? We're Here.</h2>
          <p>Whether you want to discuss your results or explore treatment options, our team can help.</p>
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
        .section-kicker { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #737373; margin-bottom: 0.5rem; }
        .section-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.75rem; }
        .section-subtitle { font-size: 1rem; color: #525252; max-width: 600px; line-height: 1.7; margin-bottom: 2rem; }
        .body-text { font-size: 0.95rem; color: #525252; line-height: 1.7; }
        .container { max-width: 800px; margin: 0 auto; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }
        .info-card { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 1.75rem; }
        .info-card h3 { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.75rem; }
        .info-card p { font-size: 0.9rem; color: #525252; line-height: 1.7; }
        .info-card ul { list-style: none; padding: 0; margin: 0; }
        .info-card li { font-size: 0.9rem; color: #525252; padding: 0.375rem 0; padding-left: 1.25rem; position: relative; }
        .info-card li::before { content: "✓"; position: absolute; left: 0; color: #000000; font-weight: 600; }
        .tip-box { background: #ffffff; border-left: 4px solid #000000; padding: 1.25rem 1.5rem; border-radius: 0 8px 8px 0; }
        .tip-box strong { display: block; margin-bottom: 0.25rem; }
        .tip-box p { font-size: 0.9rem; color: #525252; line-height: 1.6; margin: 0; }
        .disclaimer { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; padding: 1.25rem; }
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
          .info-grid { grid-template-columns: 1fr; }
          .section-title { font-size: 1.5rem; }
          .cta-buttons { flex-direction: column; align-items: center; }
        }
      `}</style>
    </Layout>
  );
}
