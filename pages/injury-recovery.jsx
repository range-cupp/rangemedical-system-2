import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function InjuryRecovery() {
  const [openFaq, setOpenFaq] = useState(null);
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('.home-animate');
    sections.forEach((section) => observer.observe(section));

    return () => sections.forEach((section) => observer.unobserve(section));
  }, []);

  const faqs = [
    {
      question: "Do I need a referral to get started?",
      answer: "No. Anyone can book an injury recovery consult directly. Many patients are referred by physical therapists and chiropractors, but you can also come to us on your own."
    },
    {
      question: "Does this replace my physical therapy or rehab?",
      answer: "No. Our recovery protocols are designed to support the work you're already doing with your PT, chiropractor, or trainer. We work alongside your existing care team."
    },
    {
      question: "Will I need labs or blood work?",
      answer: "Usually not for injury recovery. Most protocols don't require lab work to get started. Your provider will let you know if any testing would be helpful."
    },
    {
      question: "What kinds of injuries does this help with?",
      answer: "Most orthopedic injuries — sprains, strains, tendon issues, ligament tears, post-surgical recovery, and chronic pain that's slow to heal."
    },
    {
      question: "How quickly will I see results?",
      answer: "Recovery timelines vary by individual and injury type. Your provider will give you realistic expectations at your first visit."
    },
    {
      question: "What if I also want help with energy or hormones?",
      answer: "We can discuss that at your first visit. Many injury patients also benefit from optimization support. We can address both."
    },
    {
      question: "Do you accept insurance?",
      answer: "We're a cash-pay clinic. This gives us access to advanced recovery tools that insurance typically doesn't cover. We accept HSA and FSA cards."
    },
  ];

  return (
    <>
      <Head>
        <title>Injury Recovery Support | Range Medical | Newport Beach</title>
        <meta name="description" content="Healing slower than expected? Range Medical supports your recovery with peptide therapy, PRP, red light, and hyperbaric oxygen — working alongside your PT or chiropractor." />
        <meta name="keywords" content="injury recovery Newport Beach, sports injury treatment, HBOT recovery, red light therapy healing, peptide therapy injury, PRP treatment, post-surgical recovery" />
        <link rel="canonical" href="https://www.range-medical.com/injury-recovery" />

        <meta property="og:title" content="Injury Recovery Support | Range Medical" />
        <meta property="og:description" content="Healing slower than expected? Range Medical supports your recovery with advanced protocols — working alongside your PT or chiropractor." />
        <meta property="og:url" content="https://www.range-medical.com/injury-recovery" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.range-medical.com/og-injury-recovery.jpg" />
        <meta property="og:site_name" content="Range Medical" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Injury Recovery Support | Range Medical" />
        <meta name="twitter:description" content="Healing slower than expected? Range Medical supports your recovery with advanced protocols." />
        <meta name="twitter:image" content="https://www.range-medical.com/og-injury-recovery.jpg" />

        <meta name="geo.region" content="US-CA" />
        <meta name="geo.placename" content="Newport Beach" />
        <meta name="geo.position" content="33.6189;-117.9298" />
        <meta name="ICBM" content="33.6189, -117.9298" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalBusiness",
              "name": "Range Medical",
              "description": "Injury recovery support including peptide therapy, PRP, hyperbaric oxygen, and red light therapy in Newport Beach.",
              "url": "https://www.range-medical.com/injury-recovery",
              "telephone": "+1-949-997-3988",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "1901 Westcliff Dr, Suite 10",
                "addressLocality": "Newport Beach",
                "addressRegion": "CA",
                "postalCode": "92660",
                "addressCountry": "US"
              }
            })
          }}
        />
      </Head>

      <Layout>
        {/* Hero */}
        <section className="hero">
          <div className="v2-label"><span className="v2-dot" /> Injury Recovery</div>
          <h1>Your injury should be <em>getting better.</em></h1>
          <div className="hero-rule" />
          <p className="hero-sub">
            If you&apos;re in physical therapy or chiropractic care but recovery feels stuck &mdash; slower than expected, more painful than it should be &mdash; we can help. Range Medical adds targeted recovery support alongside the rehab work you&apos;re already doing.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/assessment?path=injury" className="btn-primary">
              Request Injury Recovery Consult
            </Link>
          </div>
          <p className="hero-bonus">
            Many of our injury patients are referred by physical therapists and chiropractors in the area, including one in the same building.
          </p>
        </section>

        {/* Who This Is For */}
        <section id="inj-who" className={`home-section-alt home-animate ${isVisible['inj-who'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <div className="v2-label"><span className="v2-dot" /> Is This You?</div>
            <h2>You&apos;re doing the work. <em>But it&apos;s not enough.</em></h2>
            <p className="home-section-intro">
              You&apos;re showing up to PT. Doing the exercises. Resting when they say to rest. But something still isn&apos;t healing the way it should.
            </p>

            <div className="symptoms-grid" style={{ maxWidth: '900px' }}>
              <div className="symptom-card">
                <h4>Slow Progress</h4>
                <ul>
                  <li>Weeks or months in, still in pain</li>
                  <li>Improvement has plateaued</li>
                  <li>Your provider says &ldquo;give it time&rdquo;</li>
                </ul>
              </div>
              <div className="symptom-card">
                <h4>Lingering Pain</h4>
                <ul>
                  <li>Inflammation that won&apos;t calm down</li>
                  <li>Pain at rest, not just during activity</li>
                  <li>Swelling or stiffness that persists</li>
                </ul>
              </div>
              <div className="symptom-card">
                <h4>Post-Surgery</h4>
                <ul>
                  <li>Recovery taking longer than expected</li>
                  <li>Tissue repair feels incomplete</li>
                  <li>Want to support healing from the inside</li>
                </ul>
              </div>
              <div className="symptom-card">
                <h4>Getting Back Out There</h4>
                <ul>
                  <li>Afraid to push it and re-injure</li>
                  <li>Lost confidence in your body</li>
                  <li>Want to feel safe returning to activity</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="inj-process" className={`home-section home-animate ${isVisible['inj-process'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <div className="v2-label"><span className="v2-dot" /> How It Works</div>
            <h2>Three steps to <em>supported recovery.</em></h2>
            <p className="home-section-intro">
              We don&apos;t replace your PT or chiropractor. We add tools they don&apos;t have access to.
            </p>

            <div className="process-steps" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="process-step">
                <span className="step-number">01</span>
                <h4>Recovery Consult</h4>
                <p>A brief visit to understand your injury, where you are in rehab, and what&apos;s not progressing. We review imaging, history, and your current care plan.</p>
              </div>
              <div className="process-step">
                <span className="step-number">02</span>
                <h4>Recovery Plan</h4>
                <p>Your provider builds a targeted support protocol &mdash; this may include peptides, PRP, red light therapy, or hyperbaric oxygen &mdash; designed to work with your existing rehab.</p>
              </div>
              <div className="process-step">
                <span className="step-number">03</span>
                <h4>Start &amp; Follow Up</h4>
                <p>Begin your protocol and check in regularly. We communicate with your PT or chiropractor to keep everyone aligned on your progress.</p>
              </div>
            </div>

            <div style={{ marginTop: '3rem' }}>
              <Link href="/assessment?path=injury" className="btn-primary">
                Request Injury Recovery Consult
              </Link>
            </div>
          </div>
        </section>

        {/* Recovery Tools */}
        <section id="inj-tools" className={`home-section-alt home-animate ${isVisible['inj-tools'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <div className="v2-label"><span className="v2-dot" /> Recovery Tools</div>
            <h2>What we add to <em>your recovery.</em></h2>
            <p className="home-section-intro">
              Your provider recommends the right combination based on your injury and where you are in the healing process.
            </p>

            <div className="cashpay-grid">
              <div className="cashpay-item">
                <span className="cashpay-num">01</span>
                <h4>Peptide Therapy</h4>
                <p>Targeted peptides like BPC-157 support tissue repair and help calm inflammation at the injury site. Often used alongside PT for tendons, ligaments, and muscle injuries.</p>
              </div>
              <div className="cashpay-item">
                <span className="cashpay-num">02</span>
                <h4>PRP Injections</h4>
                <p>Platelet-rich plasma from your own blood, concentrated and delivered to the injury. Supports the body&apos;s natural repair process where healing has stalled.</p>
              </div>
              <div className="cashpay-item">
                <span className="cashpay-num">03</span>
                <h4>Hyperbaric Oxygen</h4>
                <p>More oxygen to damaged tissue. Helps reduce swelling, supports circulation, and creates a better environment for healing — especially for stubborn injuries.</p>
              </div>
              <div className="cashpay-item">
                <span className="cashpay-num">04</span>
                <h4>Red Light Therapy</h4>
                <p>Specific light wavelengths that penetrate tissue and support cellular repair. Helps with pain, inflammation, and tissue recovery at the cellular level.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section id="inj-benefits" className={`home-section home-animate ${isVisible['inj-benefits'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <div className="v2-label"><span className="v2-dot" /> What Patients Report</div>
            <h2>Getting back to <em>what you love.</em></h2>

            <div className="tools-grid" style={{ maxWidth: '800px' }}>
              {[
                { name: 'Calmer Inflammation', desc: 'Swelling and irritation start to settle, giving your body a better chance to repair.' },
                { name: 'Supported Tissue Repair', desc: 'Tendons, ligaments, and muscles get targeted help at the cellular level.' },
                { name: 'Less Pain at Rest', desc: 'Patients report that resting pain decreases as healing picks up.' },
                { name: 'Confidence Coming Back', desc: 'You start to trust your body again — and feel safer getting back to activity.' },
              ].map((item, i) => (
                <div key={i} className="tool-card" style={{ cursor: 'default' }}>
                  <span className="tool-num">{String(i + 1).padStart(2, '0')}</span>
                  <h4>{item.name}</h4>
                  <p>{item.desc}</p>
                  <span />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section id="inj-stories" className={`home-section-alt home-animate ${isVisible['inj-stories'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <div className="v2-label"><span className="v2-dot" /> Patient Stories</div>
            <h2>Recovery stories.</h2>

            <div className="testimonials-grid" style={{ marginTop: '2.5rem' }}>
              <div className="testimonial">
                <div className="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p>
                  &ldquo;My shoulder was taking forever to heal. The recovery protocol got me back to training
                  weeks faster than I expected.&rdquo;
                </p>
                <div className="testimonial-info">
                  <strong>Michael R.</strong>
                  <span>Costa Mesa</span>
                </div>
              </div>

              <div className="testimonial">
                <div className="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p>
                  &ldquo;My PT recommended I add hyperbaric and peptides. Three weeks in and the difference is night and day. Wish I&apos;d done this sooner.&rdquo;
                </p>
                <div className="testimonial-info">
                  <strong>Ryan T.</strong>
                  <span>Newport Beach</span>
                </div>
              </div>

              <div className="testimonial">
                <div className="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p>
                  &ldquo;After knee surgery I felt stuck. Range added a recovery protocol on top of my PT and things finally started moving again.&rdquo;
                </p>
                <div className="testimonial-info">
                  <strong>Amanda S.</strong>
                  <span>Laguna Beach</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Referral Note */}
        <section id="inj-referral" className={`home-section home-animate ${isVisible['inj-referral'] ? 'home-visible' : ''}`}>
          <div className="home-container" style={{ maxWidth: '720px' }}>
            <div className="home-injury-module" style={{ borderLeft: '3px solid var(--color-accent)', paddingLeft: '2rem' }}>
              <h3 style={{ marginBottom: '0.75rem' }}>Were you referred by a PT or chiropractor?</h3>
              <p style={{ fontSize: '15px', color: '#737373', lineHeight: '1.7', margin: '0 0 1.5rem' }}>
                Let us know when you book your consult. We&apos;ll coordinate with your referring provider to make sure your recovery plan works together with your current care.
              </p>
              <Link href="/assessment?path=injury" className="btn-primary">
                Request Injury Recovery Consult
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="inj-faq" className={`home-section-alt home-animate ${isVisible['inj-faq'] ? 'home-visible' : ''}`}>
          <div className="home-container" style={{ maxWidth: '720px' }}>
            <div className="v2-label"><span className="v2-dot" /> Common Questions</div>
            <h2>Frequently asked <em>questions.</em></h2>

            <div style={{ marginTop: '2.5rem' }}>
              {faqs.map((faq, i) => (
                <div key={i} className="faq-item" onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ cursor: 'pointer' }}>
                  <div className="faq-question">
                    <span>{faq.question}</span>
                    <svg
                      width="14" height="8" viewBox="0 0 14 8" fill="none"
                      style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
                    >
                      <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {openFaq === i && (
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="final-cta">
          <div className="container">
            <h2>Ready to get your <em>recovery</em> moving?</h2>
            <div className="cta-rule" />
            <p>Request an injury recovery consult. We&apos;ll review your situation and see how we can help.</p>
            <div className="cta-buttons">
              <Link href="/assessment?path=injury" className="btn-white">
                Request Injury Recovery Consult
              </Link>
            </div>
            <p className="cta-location">
              Range Medical &bull; 1901 Westcliff Dr, Newport Beach
            </p>
          </div>
        </section>
      </Layout>
    </>
  );
}
