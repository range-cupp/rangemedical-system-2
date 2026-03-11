// pages/cjc-ipamorelin-guide.jsx
// CJC-1295/Ipamorelin Peptide Therapy - Service page
// Range Medical

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState } from 'react';

export default function CJCIpamorelin() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "How quickly will I notice results?",
      answer: "Most patients notice sleep improvements within 1 to 2 weeks — deeper sleep, more vivid dreams, and waking up feeling more rested. Body composition changes like increased lean muscle and fat loss typically become visible around 4 to 8 weeks with consistent use. Full benefits build over the course of a complete 8- to 12-week cycle."
    },
    {
      question: "Why is the injection given before bed?",
      answer: "Your body naturally releases the largest pulse of growth hormone during deep sleep. By injecting CJC-1295/Ipamorelin before bed, you amplify that natural rhythm rather than fighting against it. This timing produces the strongest GH response and supports the recovery processes that happen overnight."
    },
    {
      question: "What does '5 days on, 2 days off' mean?",
      answer: "This cycling pattern helps prevent receptor desensitization. If you stimulate growth hormone release every single day without a break, your receptors can become less responsive over time. Taking two days off each week keeps your GH receptors fresh and responsive, so you get consistent results throughout the cycle."
    },
    {
      question: "Is CJC-1295/Ipamorelin the same as taking HGH?",
      answer: "No — and this is an important distinction. CJC-1295/Ipamorelin stimulates your body to produce and release its own growth hormone in a natural pulsatile pattern. Exogenous HGH bypasses your body's feedback loops entirely, which can cause side effects like insulin resistance and joint swelling. With CJC/Ipa, your pituitary gland stays in control of production. The result is a more physiologic, safer increase in GH levels."
    },
    {
      question: "Does CJC-1295/Ipamorelin require a prescription?",
      answer: "At Range Medical, all peptide therapies are prescribed by our physician after reviewing your health history and labs. CJC-1295/Ipamorelin is sourced from licensed US compounding pharmacies and administered under medical supervision. We don't sell peptides without a proper evaluation first."
    },
    {
      question: "Will it raise my cortisol or prolactin levels?",
      answer: "No. This is one of Ipamorelin's key advantages over other GH-releasing peptides. Older peptides like GHRP-6 and GHRP-2 are known to increase cortisol, prolactin, and appetite. Ipamorelin is selective — it triggers GH release without affecting these other hormones. That's why it's considered one of the cleanest GH secretagogues available."
    },
    {
      question: "Can I stack this with other peptides?",
      answer: "Yes — CJC-1295/Ipamorelin stacks well with several other peptides. Common combinations include AOD-9604 for enhanced fat loss, BPC-157 for tissue repair and recovery, and NAD+ for cellular energy. Your provider will determine which combinations make sense based on your labs and goals."
    },
    {
      question: "Do I need lab work before starting?",
      answer: "We recommend baseline labs so we can make sure your protocol is appropriate and track your progress. Our Essential Panel or Elite Panel gives us a clear picture of your hormones, metabolic health, and inflammation markers — including IGF-1 levels, which help us gauge your growth hormone status and monitor your response to treatment."
    }
  ];

  return (
    <Layout
      title="CJC-1295 / Ipamorelin Peptide Therapy | Range Medical – Newport Beach"
      description="Learn about CJC-1295/Ipamorelin peptide therapy at Range Medical. A growth hormone secretagogue combination that stimulates your body's natural GH production for deeper sleep, recovery, and anti-aging. Newport Beach, CA."
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "CJC-1295 / Ipamorelin Peptide Therapy",
              "description": "Learn about CJC-1295/Ipamorelin peptide therapy at Range Medical. A growth hormone secretagogue combination that stimulates your body's natural GH production for deeper sleep, recovery, and anti-aging.",
              "url": "https://www.range-medical.com/cjc-ipamorelin-guide",
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

      <div className="cjc-page">

        {/* Hero */}
        <section className="hero">
          <div className="container">
            <span className="hero-badge">Peptide Therapy</span>
            <h1>CJC-1295 / Ipamorelin</h1>
            <p className="hero-sub">A powerful growth hormone secretagogue combination that stimulates your body&rsquo;s natural growth hormone production. CJC-1295 extends the release window while Ipamorelin triggers clean GH pulses — together they deliver deeper sleep, faster recovery, lean muscle gains, and anti-aging benefits without raising cortisol or prolactin.</p>
            <div className="hero-cta">
              <Link href="/range-assessment?path=energy" className="btn-primary">Take Your Assessment</Link>
              <p className="cjc-hero-phone">Or call us at <a href="tel:9499973988">(949) 997-3988</a></p>
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
            <div className="cjc-quick-facts">
              <div className="cjc-fact-card">
                <div className="cjc-fact-icon">💉</div>
                <div className="cjc-fact-label">Administration</div>
                <div className="cjc-fact-value">Subcutaneous Injection</div>
              </div>
              <div className="cjc-fact-card">
                <div className="cjc-fact-icon">📊</div>
                <div className="cjc-fact-label">Dose</div>
                <div className="cjc-fact-value">Provider-Determined</div>
              </div>
              <div className="cjc-fact-card">
                <div className="cjc-fact-icon">🌙</div>
                <div className="cjc-fact-label">Timing</div>
                <div className="cjc-fact-value">Before Bed</div>
              </div>
              <div className="cjc-fact-card">
                <div className="cjc-fact-icon">📅</div>
                <div className="cjc-fact-label">Typical Cycle</div>
                <div className="cjc-fact-value">8 – 12 Weeks</div>
              </div>
            </div>
          </div>
        </section>

        {/* What Is CJC-1295/Ipamorelin */}
        <section className="section">
          <div className="container">
            <div className="section-kicker">Understanding the Combination</div>
            <h2 className="section-title">What Is CJC-1295 / Ipamorelin?</h2>
            <div className="cjc-what-is-grid">
              <div className="cjc-what-is-text">
                <h3>CJC-1295 (with DAC)</h3>
                <p>CJC-1295 is a modified growth hormone releasing hormone (GHRH) analog. Your hypothalamus naturally produces GHRH to signal your pituitary gland to release growth hormone. CJC-1295 mimics that signal — but with a much longer half-life of 6 to 8 days, thanks to its Drug Affinity Complex (DAC).</p>
                <p>Think of CJC-1295 as the amplifier. It extends the window during which your body can release growth hormone, keeping your GH levels elevated in a sustained, steady way rather than a single brief spike.</p>
                <div className="cjc-callout-box">
                  <p><strong>Simple version:</strong> CJC-1295 tells your pituitary gland &ldquo;keep releasing growth hormone&rdquo; for a much longer period than your body normally would on its own. It sets the stage — Ipamorelin pulls the trigger.</p>
                </div>
              </div>
              <div className="cjc-what-is-text">
                <h3>Ipamorelin</h3>
                <p>Ipamorelin is a selective growth hormone releasing peptide (GHRP). It binds to ghrelin receptors in your pituitary gland and triggers the actual pulses of growth hormone release. Unlike older GH-releasing peptides, Ipamorelin is highly selective — it stimulates GH without raising cortisol, prolactin, or appetite.</p>
                <p>This selectivity is what makes Ipamorelin special. Earlier peptides like GHRP-6 caused hunger spikes and cortisol increases. Ipamorelin gives you the growth hormone pulse without those unwanted side effects.</p>
                <div className="cjc-callout-box">
                  <p><strong>How they work together:</strong> CJC-1295 extends the release window and amplifies the signal. Ipamorelin triggers the actual GH pulses within that window. The result is synergistic — higher, more sustained growth hormone output than either peptide alone.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="section section-gray">
          <div className="container">
            <div className="section-kicker">Mechanism of Action</div>
            <h2 className="section-title">How CJC-1295 / Ipamorelin Works</h2>
            <p className="section-subtitle">This combination works through three complementary mechanisms to optimize your body&rsquo;s natural growth hormone production — amplifying the signal, patterning the release, and keeping the response clean.</p>
            <div className="cjc-mechanism-grid">
              <div className="cjc-mechanism-card">
                <div className="cjc-card-icon">📡</div>
                <h3>Growth Hormone Amplification</h3>
                <p>CJC-1295 binds to GHRH receptors on your pituitary gland and amplifies the natural signal to produce growth hormone. Its extended half-life (6–8 days) means your pituitary receives a sustained &ldquo;produce more GH&rdquo; message rather than a brief blip. This raises your baseline GH and IGF-1 levels over time.</p>
              </div>
              <div className="cjc-mechanism-card">
                <div className="cjc-card-icon">📈</div>
                <h3>Pulsatile Release Pattern</h3>
                <p>Ipamorelin triggers GH release in pulses — mimicking your body&rsquo;s natural rhythm. This pulsatile pattern is critical because your body responds better to GH waves than constant levels. By injecting before bed, you amplify the largest natural GH pulse that occurs during deep sleep, maximizing recovery and repair.</p>
              </div>
              <div className="cjc-mechanism-card">
                <div className="cjc-card-icon">🎯</div>
                <h3>Selective Signaling</h3>
                <p>Ipamorelin is uniquely selective among GH-releasing peptides. It stimulates growth hormone release through ghrelin receptors without activating pathways that increase cortisol (your stress hormone), prolactin, or appetite. This clean signaling means you get the GH benefits without the hormonal side effects that older peptides caused.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="section">
          <div className="container">
            <div className="section-kicker">Why Patients Choose It</div>
            <h2 className="section-title">Benefits of CJC-1295 / Ipamorelin</h2>
            <p className="section-subtitle">CJC-1295/Ipamorelin is one of the most versatile peptide combinations available — supporting sleep, body composition, recovery, skin quality, and overall vitality.</p>
            <div className="cjc-benefits-grid">
              <div className="cjc-benefit-item">
                <div className="cjc-benefit-icon">😴</div>
                <div className="cjc-benefit-content">
                  <h3>Deeper Sleep</h3>
                  <p>One of the first things patients notice. Growth hormone is intimately linked to sleep quality — by amplifying your natural nighttime GH pulse, CJC/Ipa promotes deeper, more restorative sleep. Many patients report improvement within the first 1 to 2 weeks.</p>
                </div>
              </div>
              <div className="cjc-benefit-item">
                <div className="cjc-benefit-icon">💪</div>
                <div className="cjc-benefit-content">
                  <h3>Lean Muscle &amp; Recovery</h3>
                  <p>Growth hormone drives protein synthesis, muscle repair, and recovery from training. Patients often notice faster recovery between workouts, less soreness, and gradual increases in lean muscle mass over 8 to 12 weeks — especially when combined with consistent exercise.</p>
                </div>
              </div>
              <div className="cjc-benefit-item">
                <div className="cjc-benefit-icon">🔥</div>
                <div className="cjc-benefit-content">
                  <h3>Fat Loss</h3>
                  <p>Elevated growth hormone increases lipolysis — your body&rsquo;s ability to break down stored fat for energy. Patients typically see improvements in body composition, especially in stubborn areas, as GH shifts your metabolism toward burning fat while preserving lean tissue.</p>
                </div>
              </div>
              <div className="cjc-benefit-item">
                <div className="cjc-benefit-icon">✨</div>
                <div className="cjc-benefit-content">
                  <h3>Skin &amp; Anti-Aging</h3>
                  <p>Growth hormone stimulates collagen production and skin cell turnover. Over a full cycle, many patients notice improved skin elasticity, reduced fine lines, and a healthier overall appearance. These effects contribute to the &ldquo;anti-aging&rdquo; reputation of GH-based therapies.</p>
                </div>
              </div>
              <div className="cjc-benefit-item">
                <div className="cjc-benefit-icon">⚖️</div>
                <div className="cjc-benefit-content">
                  <h3>No Cortisol Spike</h3>
                  <p>Unlike older GH-releasing peptides (GHRP-6, GHRP-2), Ipamorelin does not increase cortisol or prolactin. This means you get the growth hormone benefits without triggering stress responses, appetite spikes, or hormonal imbalances that can undermine your results.</p>
                </div>
              </div>
              <div className="cjc-benefit-item">
                <div className="cjc-benefit-icon">🧬</div>
                <div className="cjc-benefit-content">
                  <h3>Well-Tolerated</h3>
                  <p>CJC-1295/Ipamorelin has a strong safety profile and is well-tolerated by most patients. The most common side effects — mild water retention, transient injection site redness, or temporary tingling — are generally mild and resolve quickly. Serious adverse effects are rare.</p>
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
            <p className="section-subtitle">Your provider will determine the exact dose based on your labs, health history, and goals. Here&rsquo;s what a typical CJC-1295/Ipamorelin protocol looks like.</p>
            <div className="cjc-protocol-card">
              <div className="cjc-protocol-row">
                <span className="cjc-protocol-label">Dose</span>
                <span className="cjc-protocol-value">Provider-determined based on your labs and goals</span>
              </div>
              <div className="cjc-protocol-row">
                <span className="cjc-protocol-label">Injection Site</span>
                <span className="cjc-protocol-value">Subcutaneous — abdominal area (rotate injection sites)</span>
              </div>
              <div className="cjc-protocol-row">
                <span className="cjc-protocol-label">Timing</span>
                <span className="cjc-protocol-value">Before bed — aligns with your natural nighttime GH pulse</span>
              </div>
              <div className="cjc-protocol-row">
                <span className="cjc-protocol-label">Frequency</span>
                <span className="cjc-protocol-value">Daily — 5 days on, 2 days off</span>
              </div>
              <div className="cjc-protocol-row">
                <span className="cjc-protocol-label">Cycle Length</span>
                <span className="cjc-protocol-value">8 – 12 weeks, then reassess with your provider</span>
              </div>
              <div className="cjc-protocol-row">
                <span className="cjc-protocol-label">Storage</span>
                <span className="cjc-protocol-value">Refrigerate after reconstitution. Keep away from light.</span>
              </div>
              <div className="cjc-protocol-row">
                <span className="cjc-protocol-label">Results Timeline</span>
                <span className="cjc-protocol-value">Sleep improvement in 1 – 2 weeks; body composition changes in 4 – 8 weeks</span>
              </div>
              <div className="cjc-protocol-highlight">
                <strong>Why 5 on / 2 off?</strong> Cycling prevents receptor desensitization. By giving your GH receptors two days off each week, you maintain strong responsiveness throughout the cycle. Consistency on the &ldquo;on&rdquo; days matters more than never missing a day.
              </div>
              <div className="cjc-protocol-note">
                <strong>Note:</strong> Dosing is always personalized at Range Medical. We use your lab results — including IGF-1 levels — to determine the right protocol and monitor your response over time. <Link href="/range-assessment?path=energy" style={{ color: '#000000', fontWeight: 600 }}>Take your assessment</Link> to get started.
              </div>
            </div>
          </div>
        </section>

        {/* Who Is This For */}
        <section className="section">
          <div className="container">
            <div className="section-kicker">Is It Right for You?</div>
            <h2 className="section-title">Who CJC-1295 / Ipamorelin Is For</h2>
            <div className="cjc-who-grid">
              <div className="cjc-who-card">
                <h3>&#10003; Good Candidates</h3>
                <ul className="cjc-who-list">
                  <li>People wanting better sleep quality — falling asleep faster, sleeping deeper, waking refreshed</li>
                  <li>Active individuals looking for faster recovery between workouts and less soreness</li>
                  <li>Anyone interested in body recomposition — building lean muscle while losing fat</li>
                  <li>Patients seeking anti-aging benefits like improved skin, energy, and vitality</li>
                  <li>Those who want growth hormone support without taking exogenous HGH</li>
                  <li>People looking to optimize overall health, performance, and quality of life</li>
                </ul>
              </div>
              <div className="cjc-who-card">
                <h3>&#9888;&#65039; Considerations</h3>
                <ul className="cjc-who-list">
                  <li>Not a substitute for consistent sleep habits, nutrition, and exercise — works best alongside a healthy lifestyle</li>
                  <li>Results are gradual and build over the course of a full cycle — not an overnight transformation</li>
                  <li>Pregnant or nursing women should not use CJC-1295/Ipamorelin</li>
                  <li>Not appropriate for competitive athletes subject to anti-doping regulations</li>
                  <li>Requires daily subcutaneous injections — commitment to the protocol matters</li>
                  <li>Patients with active cancer should consult their oncologist before any GH-related therapy</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Stacking */}
        <section className="section cjc-section-dark">
          <div className="container">
            <div className="section-kicker" style={{ color: 'rgba(255,255,255,0.5)' }}>Peptide Combinations</div>
            <h2 className="section-title" style={{ color: '#ffffff' }}>How CJC/Ipa Stacks</h2>
            <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.7)' }}>CJC-1295/Ipamorelin works well on its own, but it can be combined with other peptides for enhanced results depending on your goals.</p>
            <div className="cjc-stack-grid">
              <div className="cjc-stack-card">
                <div className="cjc-stack-label">GH Release + Fat Loss</div>
                <h3>CJC/Ipa + AOD-9604</h3>
                <p>The most popular combo. CJC/Ipa boosts natural growth hormone for sleep, recovery, and lean muscle — while AOD-9604 directly targets fat cells through a separate pathway. You get GH-driven body composition improvements plus a direct fat-burning mechanism.</p>
              </div>
              <div className="cjc-stack-card">
                <div className="cjc-stack-label">GH Release + Recovery</div>
                <h3>CJC/Ipa + BPC-157</h3>
                <p>BPC-157 accelerates tissue repair, reduces inflammation, and supports gut health. Combined with CJC/Ipa&rsquo;s growth hormone benefits, this stack is ideal for active patients dealing with injuries, joint issues, or anyone wanting both recovery and optimization.</p>
              </div>
              <div className="cjc-stack-card">
                <div className="cjc-stack-label">GH Release + Cellular Energy</div>
                <h3>CJC/Ipa + NAD+</h3>
                <p>NAD+ supports mitochondrial function, DNA repair, and cellular energy production. Paired with the growth hormone boost from CJC/Ipa, this combination targets optimization at both the hormonal and cellular level — ideal for anti-aging and peak performance.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Safety */}
        <section className="section section-gray">
          <div className="container">
            <div className="section-kicker">Safety Profile</div>
            <h2 className="section-title">Side Effects &amp; Safety</h2>
            <p className="section-subtitle">CJC-1295/Ipamorelin has a well-established safety profile and is one of the most widely used peptide combinations in regenerative medicine.</p>
            <div className="cjc-safety-grid">
              <div className="cjc-safety-card">
                <div className="cjc-card-icon">&#10003;</div>
                <h3>Well-Tolerated</h3>
                <p>CJC-1295/Ipamorelin is widely used in clinical practice with a strong track record of safety. Most patients tolerate it well with few or no side effects. Serious adverse events are rare when used under medical supervision.</p>
              </div>
              <div className="cjc-safety-card">
                <div className="cjc-card-icon">🩺</div>
                <h3>Common Side Effects</h3>
                <p>Mild, temporary water retention (especially in the first 1 – 2 weeks), injection site redness, transient tingling or numbness in extremities, and occasional headache. These typically resolve on their own and diminish with continued use.</p>
              </div>
              <div className="cjc-safety-card">
                <div className="cjc-card-icon">🔬</div>
                <h3>Clean Hormonal Profile</h3>
                <p>Ipamorelin&rsquo;s selective mechanism means it does not raise cortisol, prolactin, or appetite — a significant advantage over older GH-releasing peptides. This clean profile is one of the key reasons CJC/Ipa has become the gold standard for growth hormone optimization.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section section-gray">
          <div className="container">
            <div className="section-kicker">Common Questions</div>
            <h2 className="section-title">FAQ</h2>
            <div className="cjc-faq-list">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`cjc-faq-item ${openFaq === index ? 'open' : ''}`}
                  onClick={() => toggleFaq(index)}
                >
                  <div className="cjc-faq-question">
                    {faq.question}
                    <span className="cjc-faq-toggle">+</span>
                  </div>
                  <div className="cjc-faq-answer">
                    {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="cjc-final-cta">
          <div className="container">
            <div className="section-kicker">Ready to Get Started?</div>
            <h2 className="section-title">See If CJC-1295 / Ipamorelin Is Right for You</h2>
            <p className="section-subtitle">Start with a free Range Assessment. We&rsquo;ll review your goals, discuss your options, and build a protocol that makes sense for you — no pressure, no sales pitch.</p>
            <div className="cjc-cta-buttons">
              <Link href="/range-assessment?path=energy" className="btn-primary">Take Assessment</Link>
              <a href="tel:9499973988" className="btn-outline">Call (949) 997-3988</a>
            </div>
            <p className="cjc-cta-location">Range Medical &middot; 1901 Westcliff Dr, Newport Beach, CA</p>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="cjc-disclaimer">
          <div className="container">
            <p>This content is for educational purposes only and does not constitute medical advice. CJC-1295/Ipamorelin is not FDA-approved for anti-aging or performance enhancement. All peptide therapies at Range Medical are prescribed and supervised by a licensed physician. Individual results may vary. Please consult with a healthcare provider before starting any new treatment.</p>
          </div>
        </section>

      </div>

      <style jsx>{`
        .cjc-page {
          color: #171717;
        }

        /* Hero overrides */
        .cjc-page :global(.hero h1) {
          max-width: 800px;
        }

        .cjc-hero-phone {
          font-size: 0.9375rem;
          color: #525252;
        }

        .cjc-hero-phone a {
          color: #000000;
          font-weight: 600;
          text-decoration: none;
        }

        .cjc-hero-phone a:hover {
          text-decoration: underline;
        }

        /* Quick Facts */
        .cjc-quick-facts {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-top: 2.5rem;
        }

        .cjc-fact-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.75rem;
          text-align: center;
          transition: all 0.2s;
        }

        .cjc-fact-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .cjc-fact-icon {
          font-size: 1.75rem;
          margin-bottom: 0.75rem;
        }

        .cjc-fact-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.375rem;
        }

        .cjc-fact-value {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
        }

        /* What Is Grid */
        .cjc-what-is-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: start;
        }

        .cjc-what-is-text h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1rem;
          letter-spacing: -0.01em;
        }

        .cjc-what-is-text p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin-bottom: 1rem;
        }

        .cjc-callout-box {
          background: #fafafa;
          border-left: 3px solid #000000;
          padding: 1.25rem 1.5rem;
          border-radius: 0 8px 8px 0;
          margin: 1.5rem 0;
        }

        .cjc-callout-box p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin: 0;
        }

        .cjc-callout-box strong {
          color: #171717;
        }

        /* Mechanism Cards */
        .cjc-mechanism-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .cjc-mechanism-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
          transition: all 0.2s;
        }

        .cjc-mechanism-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .cjc-card-icon {
          font-size: 1.75rem;
          margin-bottom: 1rem;
        }

        .cjc-mechanism-card h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .cjc-mechanism-card p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.7;
        }

        /* Benefits */
        .cjc-benefits-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .cjc-benefit-item {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          transition: all 0.2s;
        }

        .cjc-benefit-item:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .cjc-benefit-icon {
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

        .cjc-benefit-content h3 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.375rem;
        }

        .cjc-benefit-content p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.6;
        }

        /* Protocol Card */
        .cjc-protocol-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2.5rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .cjc-protocol-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid #f5f5f5;
        }

        .cjc-protocol-row:last-child {
          border-bottom: none;
        }

        .cjc-protocol-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #171717;
        }

        .cjc-protocol-value {
          font-size: 0.875rem;
          color: #525252;
          text-align: right;
          max-width: 55%;
          line-height: 1.6;
        }

        .cjc-protocol-highlight {
          margin-top: 1.5rem;
          padding: 1.25rem 1.5rem;
          background: #f0f0f0;
          border-left: 3px solid #000000;
          border-radius: 0 8px 8px 0;
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.6;
        }

        .cjc-protocol-highlight strong {
          color: #171717;
        }

        .cjc-protocol-note {
          margin-top: 1rem;
          padding: 1rem 1.25rem;
          background: #fafafa;
          border-radius: 8px;
          font-size: 0.8125rem;
          color: #737373;
          line-height: 1.6;
        }

        /* Who Grid */
        .cjc-who-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .cjc-who-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
        }

        .cjc-who-card h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .cjc-who-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .cjc-who-list li {
          font-size: 0.9375rem;
          color: #525252;
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
          line-height: 1.6;
        }

        .cjc-who-list li::before {
          content: "→";
          position: absolute;
          left: 0;
          color: #737373;
        }

        /* Dark Section (Stacking) */
        .cjc-section-dark {
          background: #000000;
          color: #ffffff;
        }

        .cjc-stack-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .cjc-stack-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          padding: 2rem;
        }

        .cjc-stack-card h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #ffffff;
        }

        .cjc-stack-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.45);
          margin-bottom: 0.75rem;
        }

        .cjc-stack-card p {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.7);
          line-height: 1.7;
        }

        /* Safety */
        .cjc-safety-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .cjc-safety-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.75rem;
          text-align: center;
        }

        .cjc-safety-card .cjc-card-icon {
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .cjc-safety-card h3 {
          font-size: 0.9375rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .cjc-safety-card p {
          font-size: 0.8125rem;
          color: #525252;
          line-height: 1.6;
        }

        /* FAQ */
        .cjc-faq-list {
          max-width: 800px;
          margin: 0 auto;
        }

        .cjc-faq-item {
          border-bottom: 1px solid #e5e5e5;
          padding: 1.5rem 0;
          cursor: pointer;
        }

        .cjc-faq-item:first-child {
          border-top: 1px solid #e5e5e5;
        }

        .cjc-faq-question {
          font-size: 1.0625rem;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .cjc-faq-toggle {
          font-size: 1.25rem;
          color: #737373;
          transition: transform 0.2s;
          flex-shrink: 0;
        }

        .cjc-faq-item.open .cjc-faq-toggle {
          transform: rotate(45deg);
        }

        .cjc-faq-answer {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }

        .cjc-faq-item.open .cjc-faq-answer {
          max-height: 500px;
          padding-top: 1rem;
        }

        /* Final CTA */
        .cjc-final-cta {
          background: #fafafa;
          padding: 4rem 1.5rem;
          text-align: center;
          border-top: 1px solid #e5e5e5;
        }

        .cjc-cta-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .cjc-cta-location {
          font-size: 0.9rem;
          color: #525252;
        }

        /* Disclaimer */
        .cjc-disclaimer {
          padding: 1.5rem;
          border-top: 1px solid #f5f5f5;
        }

        .cjc-disclaimer p {
          font-size: 0.75rem;
          color: #737373;
          line-height: 1.6;
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }

        /* ─── Responsive ─── */
        @media (max-width: 768px) {
          .cjc-quick-facts {
            grid-template-columns: repeat(2, 1fr);
          }

          .cjc-what-is-grid,
          .cjc-who-grid,
          .cjc-benefits-grid {
            grid-template-columns: 1fr;
          }

          .cjc-mechanism-grid,
          .cjc-stack-grid,
          .cjc-safety-grid {
            grid-template-columns: 1fr;
          }

          .cjc-protocol-card {
            padding: 1.5rem;
          }

          .cjc-protocol-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }

          .cjc-protocol-value {
            text-align: left;
            max-width: 100%;
          }
        }
      `}</style>
    </Layout>
  );
}