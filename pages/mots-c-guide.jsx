// pages/mots-c-guide.jsx
// MOTS-c Peptide Therapy - Service page
// Range Medical

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState } from 'react';

export default function MOTSc() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "How long does it take to see results with MOTS-c?",
      answer: "Most patients start noticing improvements in energy levels and exercise endurance within 2 to 4 weeks of consistent use. Metabolic changes like improved body composition and fat utilization tend to become more noticeable around 4 to 6 weeks. Like all peptide therapies, consistency and lifestyle factors play a big role in your results."
    },
    {
      question: "What exactly is a mitochondrial-derived peptide?",
      answer: "MOTS-c is a peptide encoded in your mitochondrial DNA — not your nuclear DNA like most proteins. Your mitochondria are the energy factories inside every cell, and MOTS-c is one of the signaling molecules they produce to regulate metabolism throughout your body. Think of it as a message your mitochondria send to keep your metabolism running efficiently. As we age, MOTS-c levels decline, which is part of why metabolic function slows down."
    },
    {
      question: "Can I use MOTS-c with other peptides?",
      answer: "Yes — MOTS-c stacks well with several other peptides. NAD+ is a natural pairing for cellular energy, AOD-9604 complements it for fat metabolism, and CJC-1295/Ipamorelin adds growth hormone support. Your provider will help design a combination that aligns with your specific goals and lab results."
    },
    {
      question: "Does MOTS-c require a prescription?",
      answer: "At Range Medical, all peptide therapies are prescribed by our physician after reviewing your health history and labs. MOTS-c is sourced from licensed US compounding pharmacies and administered under medical supervision. We don't sell peptides without a proper evaluation first."
    },
    {
      question: "Is MOTS-c safe?",
      answer: "MOTS-c is generally well-tolerated with minimal side effects. The most common are mild injection site redness and occasional fatigue during the first few days as your body adjusts. Because MOTS-c is a naturally occurring peptide in your body, it works with your existing biology rather than overriding it. We monitor your labs throughout treatment to make sure everything is on track."
    },
    {
      question: "How is MOTS-c different from NAD+?",
      answer: "Both support cellular energy, but through different mechanisms. NAD+ is a coenzyme that directly fuels mitochondrial energy production and DNA repair. MOTS-c is a signaling peptide that activates the AMPK pathway to regulate glucose metabolism, fat burning, and overall metabolic efficiency. They work through complementary pathways, which is why they stack well together."
    },
    {
      question: "Do I need to exercise while on MOTS-c?",
      answer: "You don't need to exercise for MOTS-c to work, but exercise significantly amplifies its benefits. MOTS-c mimics some of the metabolic effects of exercise at the cellular level — activating AMPK and improving glucose uptake. When combined with actual physical activity, the effects compound. Many patients report that their workouts feel more productive and recovery times improve."
    },
    {
      question: "Do I need lab work before starting?",
      answer: "We recommend baseline labs so we can make sure your protocol is appropriate and track your progress. Our Essential Panel or Elite Panel gives us a clear picture of your metabolic health, hormones, and inflammation markers — all of which help us optimize your treatment and monitor improvements over time."
    }
  ];

  return (
    <Layout
      title="MOTS-c Peptide Therapy | Range Medical – Newport Beach"
      description="Learn about MOTS-c peptide therapy at Range Medical. A mitochondrial-derived peptide that supports metabolic function, exercise performance, and cellular health. Newport Beach, CA."
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "MOTS-c Peptide Therapy",
              "description": "Learn about MOTS-c peptide therapy at Range Medical. A mitochondrial-derived peptide that supports metabolic function, exercise performance, and cellular health.",
              "url": "https://www.range-medical.com/mots-c-guide",
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

      <div className="mots-page">

        {/* Hero */}
        <section className="hero">
          <div className="container">
            <span className="hero-badge">Peptide Therapy</span>
            <h1>MOTS-c</h1>
            <p className="hero-sub">A mitochondrial-derived peptide that activates your body&rsquo;s metabolic master switch. MOTS-c supports fat metabolism, exercise performance, glucose regulation, and cellular energy — working at the deepest level of your biology to optimize how your cells produce and use energy.</p>
            <div className="hero-cta">
              <Link href="/range-assessment?path=energy" className="btn-primary">Take Your Assessment</Link>
              <p className="mots-hero-phone">Or call us at <a href="tel:9499973988">(949) 997-3988</a></p>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="trust-bar">
          <div className="trust-inner">
            <div className="trust-item">&#10003; Licensed Newport Beach Clinic</div>
            <div className="trust-item">&#10003; US-Sourced Compounding Pharmacies</div>
            <div className="trust-item">&#10003; Lab-Based Protocols</div>
            <div className="trust-item">&#10003; Physician-Supervised</div>
          </div>
        </section>

        {/* Quick Facts */}
        <section className="section section-gray">
          <div className="container">
            <div className="section-kicker">At a Glance</div>
            <h2 className="section-title">Quick Facts</h2>
            <div className="mots-quick-facts">
              <div className="mots-fact-card">
                <div className="mots-fact-icon">💉</div>
                <div className="mots-fact-label">Administration</div>
                <div className="mots-fact-value">Subcutaneous Injection</div>
              </div>
              <div className="mots-fact-card">
                <div className="mots-fact-icon">📊</div>
                <div className="mots-fact-label">Typical Dose</div>
                <div className="mots-fact-value">5 mg, 1 – 3x per week</div>
              </div>
              <div className="mots-fact-card">
                <div className="mots-fact-icon">⏱</div>
                <div className="mots-fact-label">Timing</div>
                <div className="mots-fact-value">Morning</div>
              </div>
              <div className="mots-fact-card">
                <div className="mots-fact-icon">📅</div>
                <div className="mots-fact-label">Typical Cycle</div>
                <div className="mots-fact-value">4 – 8 weeks</div>
              </div>
            </div>
          </div>
        </section>

        {/* What Is MOTS-c */}
        <section className="section">
          <div className="container">
            <div className="section-kicker">Understanding the Peptide</div>
            <h2 className="section-title">What Is MOTS-c?</h2>
            <div className="mots-what-is-grid">
              <div className="mots-what-is-text">
                <h3>The Mitochondrial Peptide</h3>
                <p>MOTS-c stands for &ldquo;Mitochondrial Open Reading Frame of the 12S rRNA Type-c.&rdquo; It&rsquo;s a 16-amino-acid peptide encoded in your mitochondrial DNA — the DNA inside your cells&rsquo; energy-producing organelles, separate from the DNA in your cell nucleus.</p>
                <p>Your mitochondria produce MOTS-c naturally to regulate metabolism throughout your body. It acts as a signaling molecule, telling your cells how to handle glucose, burn fat, and produce energy. As you age, your natural MOTS-c levels decline — which is part of why metabolic function tends to slow down over time.</p>
                <div className="mots-callout-box">
                  <p><strong>Simple version:</strong> Your mitochondria are your cells&rsquo; power plants. MOTS-c is one of the signals they send to keep your metabolism running efficiently. Supplementing MOTS-c helps restore that signal to more youthful levels.</p>
                </div>
              </div>
              <div className="mots-what-is-text">
                <h3>What Makes It Unique</h3>
                <p>MOTS-c is one of only a handful of known mitochondrial-derived peptides. Unlike most peptides used in medicine, which are based on hormones or growth factors, MOTS-c works at the fundamental level of cellular energy regulation.</p>
                <p>Its primary target is the AMPK pathway — often called the body&rsquo;s &ldquo;metabolic master switch.&rdquo; AMPK controls how your cells use glucose, burn fat, and respond to exercise. When AMPK is activated, your cells shift toward energy production and metabolic efficiency.</p>
                <p>This makes MOTS-c different from fat-burning peptides or growth hormone releasers. It doesn&rsquo;t target one specific outcome — it optimizes the underlying metabolic machinery that affects energy, body composition, exercise performance, and aging at the cellular level.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="section section-gray">
          <div className="container">
            <div className="section-kicker">Mechanism of Action</div>
            <h2 className="section-title">How MOTS-c Works</h2>
            <p className="section-subtitle">MOTS-c targets cellular metabolism through three interconnected pathways — activating your metabolic master switch, optimizing glucose handling, and improving mitochondrial function.</p>
            <div className="mots-mechanism-grid">
              <div className="mots-mechanism-card">
                <div className="mots-card-icon">⚡</div>
                <h3>AMPK Activation</h3>
                <p>MOTS-c activates AMP-activated protein kinase (AMPK), the central energy sensor in every cell. When AMPK is switched on, your cells prioritize energy production over energy storage — shifting toward fat burning, improving insulin signaling, and increasing metabolic efficiency. Think of it as flipping your metabolism into a more active state.</p>
              </div>
              <div className="mots-mechanism-card">
                <div className="mots-card-icon">🩸</div>
                <h3>Glucose Metabolism</h3>
                <p>MOTS-c improves how your body handles glucose by enhancing insulin sensitivity and promoting glucose uptake into muscle cells. This means your body uses blood sugar more efficiently for energy rather than storing it as fat. Research shows MOTS-c can help maintain healthy blood sugar levels even under metabolic stress.</p>
              </div>
              <div className="mots-mechanism-card">
                <div className="mots-card-icon">🔬</div>
                <h3>Mitochondrial Function</h3>
                <p>As a peptide produced by your mitochondria, MOTS-c supports mitochondrial health and efficiency. It helps maintain the energy output of your cells, supports mitochondrial biogenesis (the creation of new mitochondria), and protects against age-related mitochondrial decline — a key driver of metabolic aging.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="section">
          <div className="container">
            <div className="section-kicker">Why Patients Choose It</div>
            <h2 className="section-title">Benefits of MOTS-c</h2>
            <p className="section-subtitle">MOTS-c works at the cellular level to improve metabolic function across multiple systems. Here are the primary benefits patients experience.</p>
            <div className="mots-benefits-grid">
              <div className="mots-benefit-item">
                <div className="mots-benefit-icon">🔥</div>
                <div className="mots-benefit-content">
                  <h3>Metabolic Optimization</h3>
                  <p>MOTS-c activates the AMPK pathway, shifting your metabolism toward energy production and fat utilization. Patients often notice improved metabolic efficiency — better energy from food, more efficient calorie use, and reduced metabolic sluggishness.</p>
                </div>
              </div>
              <div className="mots-benefit-item">
                <div className="mots-benefit-icon">💪</div>
                <div className="mots-benefit-content">
                  <h3>Exercise Performance</h3>
                  <p>Research shows MOTS-c mimics some of the metabolic benefits of exercise and enhances actual exercise performance. Patients report improved endurance, faster recovery between sessions, and workouts that feel more productive — especially during high-intensity or endurance training.</p>
                </div>
              </div>
              <div className="mots-benefit-item">
                <div className="mots-benefit-icon">⚖️</div>
                <div className="mots-benefit-content">
                  <h3>Fat Metabolism</h3>
                  <p>By activating AMPK and improving how your cells use glucose and fatty acids, MOTS-c supports your body&rsquo;s ability to burn fat for fuel. This is especially useful for people who exercise regularly but struggle with stubborn fat or slow metabolic adaptation.</p>
                </div>
              </div>
              <div className="mots-benefit-item">
                <div className="mots-benefit-icon">🩸</div>
                <div className="mots-benefit-content">
                  <h3>Insulin Sensitivity</h3>
                  <p>MOTS-c enhances insulin signaling and glucose uptake into muscle cells. This means your body handles blood sugar more efficiently — reducing the metabolic stress that contributes to fat storage, energy crashes, and long-term metabolic decline.</p>
                </div>
              </div>
              <div className="mots-benefit-item">
                <div className="mots-benefit-icon">🧬</div>
                <div className="mots-benefit-content">
                  <h3>Anti-Aging &amp; Cellular Health</h3>
                  <p>As a mitochondrial peptide that declines with age, supplementing MOTS-c helps restore youthful metabolic signaling. It supports mitochondrial biogenesis, protects against cellular stress, and addresses one of the core mechanisms of biological aging — declining mitochondrial function.</p>
                </div>
              </div>
              <div className="mots-benefit-item">
                <div className="mots-benefit-icon">✅</div>
                <div className="mots-benefit-content">
                  <h3>Minimal Side Effects</h3>
                  <p>MOTS-c is a naturally occurring peptide in your body, and supplementation is generally well-tolerated. The most common side effects are mild injection site redness and occasional fatigue during the first few days as your body adjusts to enhanced metabolic signaling.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dosing Protocol */}
        <section className="section section-gray">
          <div className="container">
            <div className="section-kicker">Administration Guide</div>
            <h2 className="section-title">Dosing Protocol</h2>
            <p className="section-subtitle">Your provider will determine the exact dose based on your labs and goals. Here&rsquo;s what a typical MOTS-c protocol looks like.</p>
            <div className="mots-protocol-card">
              <div className="mots-protocol-row">
                <span className="mots-protocol-label">Standard Dose</span>
                <span className="mots-protocol-value">5 mg per injection (subcutaneous)</span>
              </div>
              <div className="mots-protocol-row">
                <span className="mots-protocol-label">Injection Site</span>
                <span className="mots-protocol-value">Subcutaneous — abdomen or thigh (rotate injection sites)</span>
              </div>
              <div className="mots-protocol-row">
                <span className="mots-protocol-label">Timing</span>
                <span className="mots-protocol-value">Morning — ideally on training days before exercise</span>
              </div>
              <div className="mots-protocol-row">
                <span className="mots-protocol-label">Frequency</span>
                <span className="mots-protocol-value">1 – 3 times per week</span>
              </div>
              <div className="mots-protocol-row">
                <span className="mots-protocol-label">Cycle Length</span>
                <span className="mots-protocol-value">4 – 8 weeks</span>
              </div>
              <div className="mots-protocol-row">
                <span className="mots-protocol-label">Storage</span>
                <span className="mots-protocol-value">Refrigerate after reconstitution. Keep away from light.</span>
              </div>
              <div className="mots-protocol-row">
                <span className="mots-protocol-label">Results Timeline</span>
                <span className="mots-protocol-value">Energy and endurance improvements typically within 2 – 4 weeks</span>
              </div>
              <div className="mots-protocol-note">
                <strong>Note:</strong> Dosing is always personalized at Range Medical. We use your lab results and health history to determine the right protocol. MOTS-c is typically administered 1 to 3 times per week rather than daily — your provider will adjust frequency based on your response and goals. <Link href="/range-assessment?path=energy" style={{ color: '#000000', fontWeight: 600 }}>Take your assessment</Link> to get started.
              </div>
            </div>
          </div>
        </section>

        {/* Who Is This For */}
        <section className="section">
          <div className="container">
            <div className="section-kicker">Is It Right for You?</div>
            <h2 className="section-title">Who MOTS-c Is For</h2>
            <div className="mots-who-grid">
              <div className="mots-who-card">
                <h3>&#10003; Good Candidates</h3>
                <ul className="mots-who-list">
                  <li>People looking to optimize their metabolic function and cellular energy production</li>
                  <li>Active individuals who want to improve exercise performance and endurance</li>
                  <li>Anyone interested in anti-aging protocols that work at the mitochondrial level</li>
                  <li>Patients dealing with metabolic slowdown, fatigue, or declining energy with age</li>
                  <li>Those who want to improve insulin sensitivity and glucose metabolism</li>
                  <li>People seeking fat metabolism support through a cellular mechanism rather than appetite suppression</li>
                </ul>
              </div>
              <div className="mots-who-card">
                <h3>&#9888;&#65039; Considerations</h3>
                <ul className="mots-who-list">
                  <li>Not a replacement for healthy eating and regular exercise — amplifies those efforts at the cellular level</li>
                  <li>Results are metabolic and cellular — think energy, endurance, and body composition, not rapid weight loss</li>
                  <li>Pregnant or nursing women should not use MOTS-c</li>
                  <li>Not appropriate for competitive athletes subject to anti-doping regulations</li>
                  <li>Requires subcutaneous injections 1 to 3 times per week — commitment to the protocol matters</li>
                  <li>Individual results vary — labs and follow-up help us optimize your protocol over time</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Stacking */}
        <section className="section mots-section-dark">
          <div className="container">
            <div className="section-kicker" style={{ color: 'rgba(255,255,255,0.5)' }}>Peptide Combinations</div>
            <h2 className="section-title" style={{ color: '#ffffff' }}>How MOTS-c Stacks</h2>
            <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.7)' }}>MOTS-c works well on its own, but it can be combined with other peptides for enhanced results depending on your goals.</p>
            <div className="mots-stack-grid">
              <div className="mots-stack-card">
                <div className="mots-stack-label">Cellular Energy Synergy</div>
                <h3>MOTS-c + NAD+</h3>
                <p>The ultimate cellular energy stack. NAD+ directly fuels mitochondrial energy production and DNA repair, while MOTS-c activates the AMPK pathway to optimize how that energy is used. Together they address both energy production and metabolic signaling — ideal for anti-aging and performance optimization.</p>
              </div>
              <div className="mots-stack-card">
                <div className="mots-stack-label">Metabolism + Fat Loss</div>
                <h3>MOTS-c + AOD-9604</h3>
                <p>MOTS-c optimizes metabolic function at the cellular level while AOD-9604 directly targets fat cells for lipolysis. Different mechanisms, complementary results. This combination is ideal for patients focused on body composition who want both metabolic optimization and targeted fat reduction.</p>
              </div>
              <div className="mots-stack-card">
                <div className="mots-stack-label">Metabolism + GH Release</div>
                <h3>MOTS-c + CJC-1295/Ipamorelin</h3>
                <p>CJC/Ipa boosts natural growth hormone release for sleep, recovery, and lean muscle — while MOTS-c handles metabolic efficiency and cellular energy. This stack covers broad optimization: better sleep, faster recovery, improved body composition, and enhanced metabolic function.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Safety */}
        <section className="section section-gray">
          <div className="container">
            <div className="section-kicker">Safety Profile</div>
            <h2 className="section-title">Side Effects &amp; Safety</h2>
            <p className="section-subtitle">MOTS-c is a naturally occurring peptide in your body, and supplementation is generally well-tolerated. Here&rsquo;s what to expect.</p>
            <div className="mots-safety-grid">
              <div className="mots-safety-card">
                <div className="mots-card-icon">&#10003;</div>
                <h3>Well-Tolerated</h3>
                <p>MOTS-c is a naturally occurring mitochondrial peptide. Supplementation works with your body&rsquo;s existing biology rather than introducing a foreign mechanism. Most patients tolerate it well with minimal side effects.</p>
              </div>
              <div className="mots-safety-card">
                <div className="mots-card-icon">🩺</div>
                <h3>Common Side Effects</h3>
                <p>Mild injection site redness and occasional mild fatigue during the first few days are the most commonly reported side effects. These typically resolve quickly as your body adjusts to the enhanced metabolic signaling.</p>
              </div>
              <div className="mots-safety-card">
                <div className="mots-card-icon">🔬</div>
                <h3>Physician-Supervised</h3>
                <p>At Range Medical, all MOTS-c protocols include baseline labs, ongoing monitoring, and regular follow-up. We track your metabolic markers to ensure the peptide is working as expected and adjust your protocol as needed.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section section-gray">
          <div className="container">
            <div className="section-kicker">Common Questions</div>
            <h2 className="section-title">FAQ</h2>
            <div className="mots-faq-list">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`mots-faq-item ${openFaq === index ? 'open' : ''}`}
                  onClick={() => toggleFaq(index)}
                >
                  <div className="mots-faq-question">
                    {faq.question}
                    <span className="mots-faq-toggle">+</span>
                  </div>
                  <div className="mots-faq-answer">
                    {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mots-final-cta">
          <div className="container">
            <div className="section-kicker">Ready to Get Started?</div>
            <h2 className="section-title">See If MOTS-c Is Right for You</h2>
            <p className="section-subtitle">Start with a free Range Assessment. We&rsquo;ll review your goals, discuss your options, and build a protocol that makes sense for you — no pressure, no sales pitch.</p>
            <div className="mots-cta-buttons">
              <Link href="/range-assessment?path=energy" className="btn-primary">Take Assessment</Link>
              <a href="tel:9499973988" className="btn-outline">Call (949) 997-3988</a>
            </div>
            <p className="mots-cta-location">Range Medical &middot; 1901 Westcliff Dr, Newport Beach, CA</p>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mots-disclaimer">
          <div className="container">
            <p>This content is for educational purposes only and does not constitute medical advice. MOTS-c is not FDA-approved for any specific medical condition. All peptide therapies at Range Medical are prescribed and supervised by a licensed physician. Individual results may vary. Please consult with a healthcare provider before starting any new treatment.</p>
          </div>
        </section>

      </div>

      <style jsx>{`
        .mots-page {
          color: #171717;
        }

        /* Hero overrides */
        .mots-page :global(.hero h1) {
          max-width: 800px;
        }

        .mots-hero-phone {
          font-size: 0.9375rem;
          color: #525252;
        }

        .mots-hero-phone a {
          color: #000000;
          font-weight: 600;
          text-decoration: none;
        }

        .mots-hero-phone a:hover {
          text-decoration: underline;
        }

        /* Quick Facts */
        .mots-quick-facts {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-top: 2.5rem;
        }

        .mots-fact-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.75rem;
          text-align: center;
          transition: all 0.2s;
        }

        .mots-fact-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .mots-fact-icon {
          font-size: 1.75rem;
          margin-bottom: 0.75rem;
        }

        .mots-fact-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.375rem;
        }

        .mots-fact-value {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
        }

        /* What Is Grid */
        .mots-what-is-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: start;
        }

        .mots-what-is-text h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1rem;
          letter-spacing: -0.01em;
        }

        .mots-what-is-text p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin-bottom: 1rem;
        }

        .mots-callout-box {
          background: #fafafa;
          border-left: 3px solid #000000;
          padding: 1.25rem 1.5rem;
          border-radius: 0 8px 8px 0;
          margin: 1.5rem 0;
        }

        .mots-callout-box p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin: 0;
        }

        .mots-callout-box strong {
          color: #171717;
        }

        /* Mechanism Cards */
        .mots-mechanism-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .mots-mechanism-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
          transition: all 0.2s;
        }

        .mots-mechanism-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .mots-card-icon {
          font-size: 1.75rem;
          margin-bottom: 1rem;
        }

        .mots-mechanism-card h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .mots-mechanism-card p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.7;
        }

        /* Benefits */
        .mots-benefits-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .mots-benefit-item {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          transition: all 0.2s;
        }

        .mots-benefit-item:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .mots-benefit-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
          width: 2.5rem;
          height: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fafafa;
          border-radius: 8px;
        }

        .mots-benefit-content h3 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.375rem;
        }

        .mots-benefit-content p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.6;
        }

        /* Protocol Card */
        .mots-protocol-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2.5rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .mots-protocol-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid #f5f5f5;
        }

        .mots-protocol-row:last-child {
          border-bottom: none;
        }

        .mots-protocol-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #171717;
        }

        .mots-protocol-value {
          font-size: 0.875rem;
          color: #525252;
          text-align: right;
          max-width: 55%;
          line-height: 1.6;
        }

        .mots-protocol-note {
          margin-top: 1.5rem;
          padding: 1rem 1.25rem;
          background: #fafafa;
          border-radius: 8px;
          font-size: 0.8125rem;
          color: #737373;
          line-height: 1.6;
        }

        /* Who Grid */
        .mots-who-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .mots-who-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
        }

        .mots-who-card h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .mots-who-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .mots-who-list li {
          font-size: 0.9375rem;
          color: #525252;
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
          line-height: 1.6;
        }

        .mots-who-list li::before {
          content: "→";
          position: absolute;
          left: 0;
          color: #737373;
        }

        /* Dark Section (Stacking) */
        .mots-section-dark {
          background: #000000;
          color: #ffffff;
        }

        .mots-stack-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .mots-stack-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          padding: 2rem;
        }

        .mots-stack-card h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #ffffff;
        }

        .mots-stack-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.45);
          margin-bottom: 0.75rem;
        }

        .mots-stack-card p {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.7);
          line-height: 1.7;
        }

        /* Safety */
        .mots-safety-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .mots-safety-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.75rem;
          text-align: center;
        }

        .mots-safety-card .mots-card-icon {
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .mots-safety-card h3 {
          font-size: 0.9375rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .mots-safety-card p {
          font-size: 0.8125rem;
          color: #525252;
          line-height: 1.6;
        }

        /* FAQ */
        .mots-faq-list {
          max-width: 800px;
          margin: 0 auto;
        }

        .mots-faq-item {
          border-bottom: 1px solid #e5e5e5;
          padding: 1.5rem 0;
          cursor: pointer;
        }

        .mots-faq-item:first-child {
          border-top: 1px solid #e5e5e5;
        }

        .mots-faq-question {
          font-size: 1.0625rem;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .mots-faq-toggle {
          font-size: 1.25rem;
          color: #737373;
          transition: transform 0.2s;
          flex-shrink: 0;
        }

        .mots-faq-item.open .mots-faq-toggle {
          transform: rotate(45deg);
        }

        .mots-faq-answer {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }

        .mots-faq-item.open .mots-faq-answer {
          max-height: 500px;
          padding-top: 1rem;
        }

        /* Final CTA */
        .mots-final-cta {
          background: #fafafa;
          padding: 4rem 1.5rem;
          text-align: center;
          border-top: 1px solid #e5e5e5;
        }

        .mots-cta-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .mots-cta-location {
          font-size: 0.9rem;
          color: #525252;
        }

        /* Disclaimer */
        .mots-disclaimer {
          padding: 1.5rem;
          border-top: 1px solid #f5f5f5;
        }

        .mots-disclaimer p {
          font-size: 0.75rem;
          color: #737373;
          line-height: 1.6;
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }

        /* --- Responsive --- */
        @media (max-width: 768px) {
          .mots-quick-facts {
            grid-template-columns: repeat(2, 1fr);
          }

          .mots-what-is-grid,
          .mots-who-grid,
          .mots-benefits-grid {
            grid-template-columns: 1fr;
          }

          .mots-mechanism-grid,
          .mots-stack-grid,
          .mots-safety-grid {
            grid-template-columns: 1fr;
          }

          .mots-protocol-card {
            padding: 1.5rem;
          }

          .mots-protocol-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }

          .mots-protocol-value {
            text-align: left;
            max-width: 100%;
          }
        }
      `}</style>
    </Layout>
  );
}
