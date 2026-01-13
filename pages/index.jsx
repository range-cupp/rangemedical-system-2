import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';

export default function HomePage() {
  return (
    <Layout 
      title="Range Medical | Health Optimization & Longevity | Newport Beach"
      description="Newport Beach health optimization clinic. Labs-first approach to hormones, weight loss, and longevity. Essential Panel $350, Elite Panel $750. (949) 997-3988."
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalBusiness",
              "name": "Range Medical",
              "description": "Newport Beach health optimization clinic. Labs-first approach to hormones, weight loss, and longevity.",
              "url": "https://www.range-medical.com",
              "telephone": "+1-949-997-3988",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "1901 Westcliff Dr. Suite 10",
                "addressLocality": "Newport Beach",
                "addressRegion": "CA",
                "postalCode": "92660",
                "addressCountry": "US"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 33.6189,
                "longitude": -117.9298
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "09:00",
                "closes": "17:00"
              },
              "priceRange": "$$",
              "areaServed": ["Newport Beach", "Costa Mesa", "Irvine", "Laguna Beach", "Huntington Beach", "Orange County"],
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Services",
                "itemListElement": [
                  {"@type": "Offer", "itemOffered": {"@type": "MedicalProcedure", "name": "Hormone Optimization"}},
                  {"@type": "Offer", "itemOffered": {"@type": "MedicalProcedure", "name": "Medical Weight Loss"}},
                  {"@type": "Offer", "itemOffered": {"@type": "MedicalProcedure", "name": "Peptide Therapy"}},
                  {"@type": "Offer", "itemOffered": {"@type": "MedicalProcedure", "name": "IV Therapy"}},
                  {"@type": "Offer", "itemOffered": {"@type": "MedicalProcedure", "name": "Hyperbaric Oxygen Therapy"}},
                  {"@type": "Offer", "itemOffered": {"@type": "MedicalProcedure", "name": "Red Light Therapy"}},
                  {"@type": "Offer", "itemOffered": {"@type": "MedicalProcedure", "name": "Injury Recovery"}}
                ]
              }
            })
          }}
        />
      </Head>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-badge">Newport Beach Health Optimization</span>
          <h1>Feel Like Yourself Again</h1>
          <p className="hero-sub">We use labs, not guesswork. Whether you're recovering from an injury or optimizing your health, everything starts with understanding what's actually going on inside.</p>
          
          <div className="hero-buttons">
            <Link href="/range-assessment" className="btn-primary">
              Start with a Range Assessment
            </Link>
          </div>
          <p className="hero-secondary">
            Not sure where to start? <Link href="/quiz" className="quiz-link">Take the 2-min quiz →</Link>
          </p>
          <p className="hero-phone">
            Already a patient? <a href="tel:+19499973988">Call or text (949) 997-3988</a>
          </p>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">✓ Licensed Providers</span>
          <span className="trust-item">✓ Labs Before Treatment</span>
          <span className="trust-item">✓ Personalized Protocols</span>
          <span className="trust-item">✓ Ongoing Monitoring</span>
          <span className="trust-item">✓ HSA & FSA Welcome</span>
        </div>
      </div>

      {/* Two Doors */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">Two Ways We Help</div>
          <h2 className="section-title">What Brings You In?</h2>
          <p className="section-subtitle">Whether you're dealing with an injury or want to optimize how you feel, we'll start with the right assessment for your situation.</p>
          
          <div className="doors-grid">
            <div className="door-card">
              <div className="door-icon">🏃</div>
              <h3>Injury & Recovery</h3>
              <p>Dealing with pain, injury, or slow recovery? We'll assess what's going on and build a plan using hyperbaric oxygen, red light, peptides, and more.</p>
              <ul>
                <li>Post-surgery recovery</li>
                <li>Sports injuries</li>
                <li>Chronic pain</li>
                <li>Slow-healing wounds</li>
              </ul>
              <Link href="/injury-recovery" className="btn-outline">
                Learn About Recovery
              </Link>
            </div>
            
            <div className="door-card featured">
              <div className="door-badge">Most Popular</div>
              <div className="door-icon">⚡</div>
              <h3>Optimize Your Health</h3>
              <p>Tired, gaining weight, low drive? We run comprehensive labs to find what's off, then build a protocol to get you back to your best.</p>
              <ul>
                <li>Hormone optimization</li>
                <li>Medical weight loss</li>
                <li>Energy & performance</li>
                <li>Longevity protocols</li>
              </ul>
              <Link href="/range-assessment" className="btn-primary">
                Book Your Assessment
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quiz CTA Section */}
      <section className="section section-gray">
        <div className="container">
          <div className="quiz-cta-box">
            <div className="quiz-cta-content">
              <div className="quiz-cta-badge">2-Minute Assessment</div>
              <h2>Not Sure Where to Start?</h2>
              <p>Answer 10 quick questions about how you feel. We'll show you which biomarkers explain your symptoms—and what we can do about it.</p>
              <Link href="/quiz" className="btn-primary">Take the Quiz →</Link>
            </div>
            <div className="quiz-cta-preview">
              <div className="preview-card">
                <div className="preview-icon">🧬</div>
                <div className="preview-text">See which biomarkers to test</div>
              </div>
              <div className="preview-card">
                <div className="preview-icon">💡</div>
                <div className="preview-text">Get personalized insights</div>
              </div>
              <div className="preview-card">
                <div className="preview-icon">🎯</div>
                <div className="preview-text">Unlock $50 off your labs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How We Treat */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-kicker">Our Toolkit</div>
          <h2 className="section-title">How We Treat</h2>
          <p className="section-subtitle">We don't pick a treatment and hope it works. We look at your labs, understand your goals, and use the right tools for your situation.</p>
          
          <div className="tools-grid">
            <Link href="/hormone-optimization" className="tool-card">
              <h4>Hormone Optimization</h4>
              <p>Testosterone, estrogen, thyroid—balanced based on your labs, not symptoms alone.</p>
            </Link>
            <Link href="/weight-loss" className="tool-card">
              <h4>Medical Weight Loss</h4>
              <p>GLP-1 medications like tirzepatide, guided by metabolic labs and ongoing monitoring.</p>
            </Link>
            <Link href="/peptide-therapy" className="tool-card">
              <h4>Peptide Therapy</h4>
              <p>BPC-157, thymosin, and other peptides for recovery, healing, and performance.</p>
            </Link>
            <Link href="/hyperbaric-oxygen-therapy" className="tool-card">
              <h4>Hyperbaric Oxygen</h4>
              <p>Pressurized oxygen therapy for faster healing, reduced inflammation, and recovery.</p>
            </Link>
            <Link href="/red-light-therapy" className="tool-card">
              <h4>Red Light Therapy</h4>
              <p>Cellular regeneration, skin health, and recovery support.</p>
            </Link>
            <Link href="/iv-therapy" className="tool-card">
              <h4>IV & NAD+ Therapy</h4>
              <p>Direct nutrient delivery for energy, recovery, and cellular health.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="section">
        <div className="container">
          <div className="section-kicker">The Range Method</div>
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Simple process, personalized results.</p>
          
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <h4>Get Your Labs</h4>
              <p>We draw blood at our Newport Beach office. Results in 3-4 days.</p>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <h4>Meet Your Provider</h4>
              <p>1:1 review of your results. We explain what's off and why it matters.</p>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <h4>Start Your Protocol</h4>
              <p>Personalized plan based on your labs, goals, and lifestyle.</p>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <h4>Ongoing Support</h4>
              <p>Regular check-ins, lab monitoring, and protocol adjustments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Ready to Feel Like Yourself Again?</h2>
          <p>It starts with understanding what's going on inside. Book your Range Assessment and get a clear picture of your health.</p>
          <Link href="/range-assessment" className="btn-white">
            Book Your Assessment
          </Link>
          <p className="cta-location">📍 1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
        </div>
      </section>
    </Layout>
  );
}
