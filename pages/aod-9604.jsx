// pages/aod-9604.jsx
// AOD-9604 Peptide Therapy - Service page
// Range Medical

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState } from 'react';

export default function AOD9604() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "How long does it take to see results?",
      answer: "Most patients start noticing changes in body composition within 4 to 6 weeks of consistent daily use. This isn't a rapid weight-loss tool — it works gradually by shifting how your body handles fat storage and fat burning. Combining AOD-9604 with a solid nutrition and exercise plan speeds up visible results."
    },
    {
      question: "Can I use AOD-9604 with a GLP-1 medication?",
      answer: "Yes — they work through completely different mechanisms. GLP-1 medications like semaglutide reduce appetite, while AOD-9604 directly targets fat cells. Some patients use both for a multi-pronged approach to weight loss. Your provider will help determine if this combination makes sense for your situation."
    },
    {
      question: "Does AOD-9604 require a prescription?",
      answer: "At Range Medical, all peptide therapies are prescribed by our physician after reviewing your health history and labs. AOD-9604 is sourced from licensed US compounding pharmacies and administered under medical supervision. We don't sell peptides without a proper evaluation first."
    },
    {
      question: "Will I gain the fat back when I stop?",
      answer: "AOD-9604 helps shift your body's fat metabolism while you're on it, but lasting results depend on maintaining healthy habits. The fat loss you achieve is real — but if you return to the habits that caused the fat gain, it can come back over time. That's true for any treatment. We focus on building sustainable protocols."
    },
    {
      question: "Is AOD-9604 the same as HGH?",
      answer: "No. AOD-9604 is a small fragment of the growth hormone molecule — specifically the part responsible for fat metabolism. It doesn't raise IGF-1 levels, doesn't affect blood sugar, and doesn't stimulate growth the way full HGH does. You get the fat-burning benefit without the broader hormonal effects."
    },
    {
      question: "Are the injections painful?",
      answer: "Most patients describe the injection as a small pinch — it uses a very fine needle injected just under the skin (usually in the abdominal area). It takes about 10 seconds. After a few days, most people barely notice it. We'll walk you through the technique at your first visit."
    },
    {
      question: "Can AOD-9604 help with joint pain?",
      answer: "There is promising research showing AOD-9604 supports cartilage regeneration and proteoglycan production. A study using AOD-9604 combined with hyaluronic acid in an osteoarthritis model showed significantly better cartilage healing than either treatment alone. While fat loss is the primary use, joint support is an emerging secondary benefit."
    },
    {
      question: "Do I need lab work before starting?",
      answer: "We recommend baseline labs so we can make sure your protocol is appropriate and track your progress. Our Essential Panel or Elite Panel gives us a clear picture of your metabolic health, hormones, and inflammation markers — all of which help us optimize your treatment."
    }
  ];

  return (
    <Layout
      title="AOD-9604 Peptide Therapy | Range Medical – Newport Beach"
      description="Learn about AOD-9604 peptide therapy at Range Medical. A growth hormone fragment that targets fat metabolism without affecting blood sugar or IGF-1 levels. Newport Beach, CA."
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "AOD-9604 Peptide Therapy",
              "description": "Learn about AOD-9604 peptide therapy at Range Medical. A growth hormone fragment that targets fat metabolism without affecting blood sugar or IGF-1 levels.",
              "url": "https://www.range-medical.com/aod-9604",
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

      <div className="aod-page">

        {/* Hero */}
        <section className="hero">
          <div className="container">
            <span className="hero-badge">Peptide Therapy</span>
            <h1>AOD-9604</h1>
            <p className="hero-sub">A modified fragment of human growth hormone that targets fat metabolism — without affecting blood sugar, muscle, or IGF-1 levels. Originally developed as an anti-obesity drug, AOD-9604 helps your body break down stored fat and prevent new fat from forming.</p>
            <div className="hero-cta">
              <Link href="/range-assessment?path=energy" className="btn-primary">Take Your Assessment</Link>
              <p className="aod-hero-phone">Or call us at <a href="tel:9499973988">(949) 997-3988</a></p>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="trust-bar">
          <div className="trust-inner">
            <div className="trust-item">✓ Licensed Newport Beach Clinic</div>
            <div className="trust-item">✓ US-Sourced Compounding Pharmacies</div>
            <div className="trust-item">✓ Lab-Based Protocols</div>
            <div className="trust-item">✓ Physician-Supervised</div>
          </div>
        </section>

        {/* Quick Facts */}
        <section className="section section-gray">
          <div className="container">
            <div className="section-kicker">At a Glance</div>
            <h2 className="section-title">Quick Facts</h2>
            <div className="aod-quick-facts">
              <div className="aod-fact-card">
                <div className="aod-fact-icon">💉</div>
                <div className="aod-fact-label">Administration</div>
                <div className="aod-fact-value">Subcutaneous Injection</div>
              </div>
              <div className="aod-fact-card">
                <div className="aod-fact-icon">📊</div>
                <div className="aod-fact-label">Typical Dose</div>
                <div className="aod-fact-value">250 – 500 mcg / day</div>
              </div>
              <div className="aod-fact-card">
                <div className="aod-fact-icon">⏱</div>
                <div className="aod-fact-label">Timing</div>
                <div className="aod-fact-value">Morning, on an empty stomach</div>
              </div>
              <div className="aod-fact-card">
                <div className="aod-fact-icon">📅</div>
                <div className="aod-fact-label">Typical Cycle</div>
                <div className="aod-fact-value">8 – 12 weeks</div>
              </div>
            </div>
          </div>
        </section>

        {/* What Is AOD-9604 */}
        <section className="section">
          <div className="container">
            <div className="section-kicker">Understanding the Peptide</div>
            <h2 className="section-title">What Is AOD-9604?</h2>
            <div className="aod-what-is-grid">
              <div className="aod-what-is-text">
                <h3>The Fat-Burning Fragment</h3>
                <p>AOD-9604 stands for &ldquo;Anti-Obesity Drug 9604.&rdquo; It&rsquo;s a synthetic peptide made from a small piece of human growth hormone — specifically amino acids 177 through 191. That region of growth hormone is responsible for fat metabolism.</p>
                <p>Think of it this way: growth hormone does a lot of things in your body — it affects muscle, bone, blood sugar, and fat. AOD-9604 isolates just the fat-burning part, leaving everything else alone.</p>
                <div className="aod-callout-box">
                  <p><strong>Simple version:</strong> Your body already makes growth hormone that helps burn fat. AOD-9604 is a copy of just the fat-burning piece — without the side effects that come with full growth hormone therapy.</p>
                </div>
              </div>
              <div className="aod-what-is-text">
                <h3>What Makes It Different</h3>
                <p>Unlike full growth hormone therapy, AOD-9604 does not raise IGF-1 levels (which can cause unwanted growth effects), does not affect blood sugar or insulin sensitivity, and does not stimulate muscle or bone growth.</p>
                <p>This targeted approach makes AOD-9604 a good fit for people who want support with fat loss specifically — without the broader hormonal shifts that come with HGH therapy or the appetite changes that come with GLP-1 medications like semaglutide.</p>
                <p>Over 900 people have been studied across six randomized, controlled clinical trials, and AOD-9604 has consistently shown a strong safety profile with minimal side effects.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="section section-gray">
          <div className="container">
            <div className="section-kicker">Mechanism of Action</div>
            <h2 className="section-title">How AOD-9604 Works</h2>
            <p className="section-subtitle">AOD-9604 targets fat cells through three main pathways — breaking down existing fat, preventing new fat from forming, and boosting your metabolic rate.</p>
            <div className="aod-mechanism-grid">
              <div className="aod-mechanism-card">
                <div className="aod-card-icon">🔥</div>
                <h3>Stimulates Lipolysis</h3>
                <p>AOD-9604 activates beta-3 adrenergic receptors on fat cells. This triggers the release of stored fatty acids into your bloodstream so your body can use them for energy. In research, it&rsquo;s been shown to increase beta-3 receptor expression in obese subjects back to levels seen in lean individuals.</p>
              </div>
              <div className="aod-mechanism-card">
                <div className="aod-card-icon">🛑</div>
                <h3>Inhibits Lipogenesis</h3>
                <p>Beyond burning existing fat, AOD-9604 suppresses the enzymes responsible for turning excess calories into new fat deposits. This means it&rsquo;s working on both sides of the equation — breaking down stored fat while making it harder for your body to store new fat.</p>
              </div>
              <div className="aod-mechanism-card">
                <div className="aod-card-icon">⚡</div>
                <h3>Increases Fat Oxidation</h3>
                <p>Research shows AOD-9604 can increase energy expenditure and fat oxidation — your body&rsquo;s ability to burn fat as fuel. This metabolic boost helps you burn more calories even at rest, particularly effective for stubborn areas like the abdomen.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="section">
          <div className="container">
            <div className="section-kicker">Why Patients Choose It</div>
            <h2 className="section-title">Benefits of AOD-9604</h2>
            <p className="section-subtitle">AOD-9604 is primarily known for fat loss, but research also points to benefits for joint health, bone density, and overall metabolic function.</p>
            <div className="aod-benefits-grid">
              <div className="aod-benefit-item">
                <div className="aod-benefit-icon">🎯</div>
                <div className="aod-benefit-content">
                  <h3>Targeted Fat Reduction</h3>
                  <p>Particularly effective for stubborn abdominal fat. Works by directly signaling fat cells to release stored energy, especially in areas resistant to diet and exercise alone.</p>
                </div>
              </div>
              <div className="aod-benefit-item">
                <div className="aod-benefit-icon">💪</div>
                <div className="aod-benefit-content">
                  <h3>Preserves Lean Muscle</h3>
                  <p>Unlike calorie restriction alone, AOD-9604 targets fat tissue specifically. Your muscle mass stays intact, which keeps your metabolism running and prevents the &ldquo;skinny fat&rdquo; effect.</p>
                </div>
              </div>
              <div className="aod-benefit-item">
                <div className="aod-benefit-icon">🩸</div>
                <div className="aod-benefit-content">
                  <h3>No Blood Sugar Impact</h3>
                  <p>Full growth hormone therapy can mess with insulin and glucose levels. AOD-9604 doesn&rsquo;t affect blood sugar or IGF-1, making it safe for people concerned about metabolic disruption.</p>
                </div>
              </div>
              <div className="aod-benefit-item">
                <div className="aod-benefit-icon">🦴</div>
                <div className="aod-benefit-content">
                  <h3>Supports Joint & Cartilage Health</h3>
                  <p>Studies show AOD-9604 promotes proteoglycan and collagen production in cartilage cells. Research in osteoarthritis models showed enhanced cartilage regeneration, especially when combined with hyaluronic acid.</p>
                </div>
              </div>
              <div className="aod-benefit-item">
                <div className="aod-benefit-icon">🧬</div>
                <div className="aod-benefit-content">
                  <h3>Minimal Side Effects</h3>
                  <p>Across six clinical trials with over 900 participants, AOD-9604 consistently showed excellent tolerability. The most common side effects are mild and temporary — injection site redness or occasional headache.</p>
                </div>
              </div>
              <div className="aod-benefit-item">
                <div className="aod-benefit-icon">⚖️</div>
                <div className="aod-benefit-content">
                  <h3>No Appetite Suppression</h3>
                  <p>Unlike GLP-1 medications, AOD-9604 doesn&rsquo;t work by making you feel less hungry. It targets fat cells directly. This makes it a good option for people who don&rsquo;t want appetite-related side effects.</p>
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
            <p className="section-subtitle">Your provider will determine the exact dose based on your labs and goals. Here&rsquo;s what a typical AOD-9604 protocol looks like.</p>
            <div className="aod-protocol-card">
              <div className="aod-protocol-row">
                <span className="aod-protocol-label">Standard Dose</span>
                <span className="aod-protocol-value">250 – 500 mcg per day (subcutaneous injection)</span>
              </div>
              <div className="aod-protocol-row">
                <span className="aod-protocol-label">Injection Site</span>
                <span className="aod-protocol-value">Abdominal fat (rotate injection sites daily)</span>
              </div>
              <div className="aod-protocol-row">
                <span className="aod-protocol-label">Timing</span>
                <span className="aod-protocol-value">Morning, on an empty stomach — at least 30 minutes before eating</span>
              </div>
              <div className="aod-protocol-row">
                <span className="aod-protocol-label">Frequency</span>
                <span className="aod-protocol-value">Once daily</span>
              </div>
              <div className="aod-protocol-row">
                <span className="aod-protocol-label">Cycle Length</span>
                <span className="aod-protocol-value">8 – 12 weeks, followed by a 4-week break</span>
              </div>
              <div className="aod-protocol-row">
                <span className="aod-protocol-label">Storage</span>
                <span className="aod-protocol-value">Refrigerate after reconstitution. Keep away from light.</span>
              </div>
              <div className="aod-protocol-row">
                <span className="aod-protocol-label">Results Timeline</span>
                <span className="aod-protocol-value">Most patients begin noticing changes in body composition within 4 – 6 weeks</span>
              </div>
              <div className="aod-protocol-note">
                <strong>Note:</strong> Dosing is always personalized at Range Medical. We use your lab results and health history to determine the right protocol. Higher doses have not been shown to produce significantly better results — consistency matters more. <Link href="/range-assessment?path=energy" style={{ color: '#000000', fontWeight: 600 }}>Take your assessment</Link> to get started.
              </div>
            </div>
          </div>
        </section>

        {/* Who Is This For */}
        <section className="section">
          <div className="container">
            <div className="section-kicker">Is It Right for You?</div>
            <h2 className="section-title">Who AOD-9604 Is For</h2>
            <div className="aod-who-grid">
              <div className="aod-who-card">
                <h3>✅ Good Candidates</h3>
                <ul className="aod-who-list">
                  <li>Stubborn fat that won&rsquo;t budge with diet and exercise — especially belly fat</li>
                  <li>People who want fat loss support without appetite suppression or GI side effects</li>
                  <li>Those who can&rsquo;t use or don&rsquo;t want GLP-1 medications (semaglutide, tirzepatide)</li>
                  <li>Patients looking for body recomposition — lose fat while keeping muscle</li>
                  <li>Anyone with joint discomfort looking for cartilage support as a secondary benefit</li>
                  <li>People wanting to avoid the broader effects of full growth hormone therapy</li>
                </ul>
              </div>
              <div className="aod-who-card">
                <h3>⚠️ Considerations</h3>
                <ul className="aod-who-list">
                  <li>Not a replacement for healthy eating and exercise — works best as part of an overall plan</li>
                  <li>Results are more subtle than GLP-1 medications — think body composition, not rapid scale drops</li>
                  <li>Pregnant or nursing women should not use AOD-9604</li>
                  <li>Not appropriate for competitive athletes subject to anti-doping regulations</li>
                  <li>Requires daily subcutaneous injections — commitment to the protocol matters</li>
                  <li>Individual results vary — labs and follow-up help us optimize your protocol</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Stacking */}
        <section className="section aod-section-dark">
          <div className="container">
            <div className="section-kicker" style={{ color: 'rgba(255,255,255,0.5)' }}>Peptide Combinations</div>
            <h2 className="section-title" style={{ color: '#ffffff' }}>How AOD-9604 Stacks</h2>
            <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.7)' }}>AOD-9604 works well on its own, but it can be combined with other peptides for enhanced results depending on your goals.</p>
            <div className="aod-stack-grid">
              <div className="aod-stack-card">
                <div className="aod-stack-label">Fat Loss + GH Release</div>
                <h3>AOD-9604 + CJC-1295/Ipamorelin</h3>
                <p>The most popular combo. CJC/Ipa boosts natural growth hormone release for sleep, recovery, and lean muscle — while AOD-9604 adds a direct fat-burning mechanism through a different pathway. They complement without overlapping.</p>
              </div>
              <div className="aod-stack-card">
                <div className="aod-stack-label">Metabolism + Energy</div>
                <h3>AOD-9604 + NAD+</h3>
                <p>NAD+ supports mitochondrial function and cellular energy production. Combined with AOD-9604&rsquo;s fat metabolism effects, this stack is ideal for patients who want both fat loss and a noticeable energy boost.</p>
              </div>
              <div className="aod-stack-card">
                <div className="aod-stack-label">Fat Loss + Recovery</div>
                <h3>AOD-9604 + BPC-157</h3>
                <p>BPC-157 handles tissue repair and inflammation while AOD-9604 works on fat metabolism. Especially useful for active patients with nagging injuries who also want body composition changes. Emerging research also shows synergy for joint health.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Safety */}
        <section className="section section-gray">
          <div className="container">
            <div className="section-kicker">Safety Profile</div>
            <h2 className="section-title">Side Effects & Safety</h2>
            <p className="section-subtitle">AOD-9604 has one of the strongest safety profiles of any peptide studied. Here&rsquo;s what the research shows.</p>
            <div className="aod-safety-grid">
              <div className="aod-safety-card">
                <div className="aod-card-icon">✅</div>
                <h3>Well-Tolerated</h3>
                <p>Over 900 participants across six controlled clinical trials. No serious adverse events attributed to AOD-9604. Most side effects are mild and temporary.</p>
              </div>
              <div className="aod-safety-card">
                <div className="aod-card-icon">🩺</div>
                <h3>Common Side Effects</h3>
                <p>Mild injection site redness, occasional headache, temporary tingling sensation, or slight fatigue. These typically resolve within the first week of treatment.</p>
              </div>
              <div className="aod-safety-card">
                <div className="aod-card-icon">🔬</div>
                <h3>No Genotoxic Concerns</h3>
                <p>Non-clinical studies including Ames tests and chromosomal aberration assays found no evidence of genotoxic activity. Chronic toxicology studies in rats (6 months) and monkeys (9 months) showed general safety.</p>
              </div>
            </div>
          </div>
        </section>

        {/* AOD vs Others */}
        <section className="section">
          <div className="container">
            <div className="section-kicker">How It Compares</div>
            <h2 className="section-title">AOD-9604 vs. Other Options</h2>
            <p className="section-subtitle">Different tools work differently. Here&rsquo;s how AOD-9604 stacks up against other fat loss approaches we offer.</p>
            <div className="aod-table-wrapper">
              <table className="aod-comparison-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>AOD-9604</th>
                    <th>Semaglutide (GLP-1)</th>
                    <th>Tesamorelin</th>
                    <th>CJC/Ipa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="aod-row-label">Primary Mechanism</td>
                    <td>Direct fat cell targeting</td>
                    <td>Appetite suppression</td>
                    <td>Visceral fat reduction</td>
                    <td>GH release (broad)</td>
                  </tr>
                  <tr>
                    <td className="aod-row-label">Appetite Effects</td>
                    <td>None</td>
                    <td>Strong suppression</td>
                    <td>None</td>
                    <td>Minimal</td>
                  </tr>
                  <tr>
                    <td className="aod-row-label">Blood Sugar Impact</td>
                    <td>None</td>
                    <td>Improves</td>
                    <td>None</td>
                    <td>Minimal</td>
                  </tr>
                  <tr>
                    <td className="aod-row-label">GI Side Effects</td>
                    <td>None</td>
                    <td>Common (nausea)</td>
                    <td>Rare</td>
                    <td>Rare</td>
                  </tr>
                  <tr>
                    <td className="aod-row-label">Joint Benefits</td>
                    <td>Yes (emerging)</td>
                    <td>No</td>
                    <td>No</td>
                    <td>Indirect</td>
                  </tr>
                  <tr>
                    <td className="aod-row-label">Best For</td>
                    <td>Targeted fat loss, body recomp</td>
                    <td>Significant weight loss</td>
                    <td>Visceral / belly fat</td>
                    <td>Overall optimization</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section section-gray">
          <div className="container">
            <div className="section-kicker">Common Questions</div>
            <h2 className="section-title">FAQ</h2>
            <div className="aod-faq-list">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`aod-faq-item ${openFaq === index ? 'open' : ''}`}
                  onClick={() => toggleFaq(index)}
                >
                  <div className="aod-faq-question">
                    {faq.question}
                    <span className="aod-faq-toggle">+</span>
                  </div>
                  <div className="aod-faq-answer">
                    {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="aod-final-cta">
          <div className="container">
            <div className="section-kicker">Ready to Get Started?</div>
            <h2 className="section-title">See If AOD-9604 Is Right for You</h2>
            <p className="section-subtitle">Start with a free Range Assessment. We&rsquo;ll review your goals, discuss your options, and build a protocol that makes sense for you — no pressure, no sales pitch.</p>
            <div className="aod-cta-buttons">
              <Link href="/range-assessment?path=energy" className="btn-primary">Take Assessment</Link>
              <a href="tel:9499973988" className="btn-outline">Call (949) 997-3988</a>
            </div>
            <p className="aod-cta-location">Range Medical · 1901 Westcliff Dr, Newport Beach, CA</p>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="aod-disclaimer">
          <div className="container">
            <p>This content is for educational purposes only and does not constitute medical advice. AOD-9604 is not FDA-approved for weight loss. All peptide therapies at Range Medical are prescribed and supervised by a licensed physician. Individual results may vary. Please consult with a healthcare provider before starting any new treatment.</p>
          </div>
        </section>

      </div>

      <style jsx>{`
        .aod-page {
          color: #171717;
        }

        /* Hero overrides */
        .aod-page :global(.hero h1) {
          max-width: 800px;
        }

        .aod-hero-phone {
          font-size: 0.9375rem;
          color: #525252;
        }

        .aod-hero-phone a {
          color: #000000;
          font-weight: 600;
          text-decoration: none;
        }

        .aod-hero-phone a:hover {
          text-decoration: underline;
        }

        /* Quick Facts */
        .aod-quick-facts {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-top: 2.5rem;
        }

        .aod-fact-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.75rem;
          text-align: center;
          transition: all 0.2s;
        }

        .aod-fact-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .aod-fact-icon {
          font-size: 1.75rem;
          margin-bottom: 0.75rem;
        }

        .aod-fact-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.375rem;
        }

        .aod-fact-value {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
        }

        /* What Is Grid */
        .aod-what-is-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: start;
        }

        .aod-what-is-text h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1rem;
          letter-spacing: -0.01em;
        }

        .aod-what-is-text p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin-bottom: 1rem;
        }

        .aod-callout-box {
          background: #fafafa;
          border-left: 3px solid #000000;
          padding: 1.25rem 1.5rem;
          border-radius: 0 8px 8px 0;
          margin: 1.5rem 0;
        }

        .aod-callout-box p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin: 0;
        }

        .aod-callout-box strong {
          color: #171717;
        }

        /* Mechanism Cards */
        .aod-mechanism-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .aod-mechanism-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
          transition: all 0.2s;
        }

        .aod-mechanism-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .aod-card-icon {
          font-size: 1.75rem;
          margin-bottom: 1rem;
        }

        .aod-mechanism-card h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .aod-mechanism-card p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.7;
        }

        /* Benefits */
        .aod-benefits-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .aod-benefit-item {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          transition: all 0.2s;
        }

        .aod-benefit-item:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .aod-benefit-icon {
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

        .aod-benefit-content h3 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.375rem;
        }

        .aod-benefit-content p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.6;
        }

        /* Protocol Card */
        .aod-protocol-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2.5rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .aod-protocol-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid #f5f5f5;
        }

        .aod-protocol-row:last-child {
          border-bottom: none;
        }

        .aod-protocol-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #171717;
        }

        .aod-protocol-value {
          font-size: 0.875rem;
          color: #525252;
          text-align: right;
          max-width: 55%;
          line-height: 1.6;
        }

        .aod-protocol-note {
          margin-top: 1.5rem;
          padding: 1rem 1.25rem;
          background: #fafafa;
          border-radius: 8px;
          font-size: 0.8125rem;
          color: #737373;
          line-height: 1.6;
        }

        /* Who Grid */
        .aod-who-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .aod-who-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 2rem;
        }

        .aod-who-card h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .aod-who-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .aod-who-list li {
          font-size: 0.9375rem;
          color: #525252;
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
          line-height: 1.6;
        }

        .aod-who-list li::before {
          content: "→";
          position: absolute;
          left: 0;
          color: #737373;
        }

        /* Dark Section (Stacking) */
        .aod-section-dark {
          background: #000000;
          color: #ffffff;
        }

        .aod-stack-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .aod-stack-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          padding: 2rem;
        }

        .aod-stack-card h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #ffffff;
        }

        .aod-stack-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.45);
          margin-bottom: 0.75rem;
        }

        .aod-stack-card p {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.7);
          line-height: 1.7;
        }

        /* Safety */
        .aod-safety-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .aod-safety-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.75rem;
          text-align: center;
        }

        .aod-safety-card .aod-card-icon {
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .aod-safety-card h3 {
          font-size: 0.9375rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .aod-safety-card p {
          font-size: 0.8125rem;
          color: #525252;
          line-height: 1.6;
        }

        /* Comparison Table */
        .aod-table-wrapper {
          overflow-x: auto;
          margin-top: 2rem;
        }

        .aod-comparison-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
          min-width: 600px;
        }

        .aod-comparison-table thead tr {
          border-bottom: 2px solid #000000;
        }

        .aod-comparison-table th {
          text-align: center;
          padding: 1rem 0.75rem;
          font-weight: 700;
        }

        .aod-comparison-table th:first-child {
          text-align: left;
        }

        .aod-comparison-table td {
          padding: 0.875rem 0.75rem;
          text-align: center;
          color: #525252;
        }

        .aod-comparison-table .aod-row-label {
          font-weight: 600;
          color: #171717;
          text-align: left;
        }

        .aod-comparison-table tbody tr {
          border-bottom: 1px solid #e5e5e5;
        }

        .aod-comparison-table tbody tr:nth-child(even) {
          background: #fafafa;
        }

        .aod-comparison-table tbody tr:last-child {
          border-bottom: none;
        }

        /* FAQ */
        .aod-faq-list {
          max-width: 800px;
          margin: 0 auto;
        }

        .aod-faq-item {
          border-bottom: 1px solid #e5e5e5;
          padding: 1.5rem 0;
          cursor: pointer;
        }

        .aod-faq-item:first-child {
          border-top: 1px solid #e5e5e5;
        }

        .aod-faq-question {
          font-size: 1.0625rem;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .aod-faq-toggle {
          font-size: 1.25rem;
          color: #737373;
          transition: transform 0.2s;
          flex-shrink: 0;
        }

        .aod-faq-item.open .aod-faq-toggle {
          transform: rotate(45deg);
        }

        .aod-faq-answer {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }

        .aod-faq-item.open .aod-faq-answer {
          max-height: 500px;
          padding-top: 1rem;
        }

        /* Final CTA */
        .aod-final-cta {
          background: #fafafa;
          padding: 4rem 1.5rem;
          text-align: center;
          border-top: 1px solid #e5e5e5;
        }

        .aod-cta-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .aod-cta-location {
          font-size: 0.9rem;
          color: #525252;
        }

        /* Disclaimer */
        .aod-disclaimer {
          padding: 1.5rem;
          border-top: 1px solid #f5f5f5;
        }

        .aod-disclaimer p {
          font-size: 0.75rem;
          color: #737373;
          line-height: 1.6;
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }

        /* ─── Responsive ─── */
        @media (max-width: 768px) {
          .aod-quick-facts {
            grid-template-columns: repeat(2, 1fr);
          }

          .aod-what-is-grid,
          .aod-who-grid,
          .aod-benefits-grid {
            grid-template-columns: 1fr;
          }

          .aod-mechanism-grid,
          .aod-stack-grid,
          .aod-safety-grid {
            grid-template-columns: 1fr;
          }

          .aod-protocol-card {
            padding: 1.5rem;
          }

          .aod-protocol-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }

          .aod-protocol-value {
            text-align: left;
            max-width: 100%;
          }
        }
      `}</style>
    </Layout>
  );
}
