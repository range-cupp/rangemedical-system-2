import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function HowItWorks() {
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
      { threshold: 0.12 }
    );

    const sections = document.querySelectorAll('.hiw-animate');
    sections.forEach((section) => observer.observe(section));

    return () => sections.forEach((section) => observer.unobserve(section));
  }, []);

  const faqs = [
    {
      question: "What’s included in the $197 Assessment?",
      answer: "A 60-minute visit with your provider where we review your full history, symptoms, and goals. You’ll leave with a clear plan — and the $197 is credited toward treatment if you move forward."
    },
    {
      question: "How long is the Assessment?",
      answer: "About 60 minutes. We take the time to understand what’s going on before recommending anything."
    },
    {
      question: "What if I don’t need treatment after the Assessment?",
      answer: "That’s completely fine. If we don’t think treatment is the right call, we’ll tell you. You’ll still leave with a clear picture of where things stand and what to watch for."
    },
    {
      question: "Do I need labs before the Assessment?",
      answer: "No. We’ll discuss whether labs make sense during your Assessment. If they do, we’ll order them afterward and review the results with you at a follow-up."
    },
    {
      question: "Can I use HSA/FSA?",
      answer: "Yes. You can use your Health Savings Account or Flexible Spending Account for any of our services, including the Assessment. Just swipe it like a credit card."
    },
    {
      question: "What if I’m not sure which path is right for me?",
      answer: "That’s what the Assessment is for. You don’t need to decide beforehand. Your provider will help you figure out the right starting point. You can also take the Clarity Finder quiz to get a recommendation before booking."
    },
  ];

  return (
    <>
      <Head>
        <title>How It Works | Range Medical</title>
        <meta name="description" content="Start with a $197 Range Assessment. We review your history, symptoms, and goals, then build a personalized plan. Your full $197 is credited toward treatment." />
        <link rel="canonical" href="https://www.range-medical.com/how-it-works" />

        <meta property="og:title" content="How It Works | Range Medical" />
        <meta property="og:description" content="Start with a $197 Range Assessment. We review your history, symptoms, and goals, then build a personalized plan." />
        <meta property="og:url" content="https://www.range-medical.com/how-it-works" />
        <meta property="og:type" content="website" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer
                }
              }))
            })
          }}
        />
      </Head>

      <Layout>
        {/* Trust Bar */}
        <div className="trust-bar">
          <div className="trust-inner">
            <span className="trust-item">
              <span className="trust-rating">&#9733;&#9733;&#9733;&#9733;&#9733;</span> 5.0 on Google
            </span>
            <span className="trust-item">Newport Beach, CA</span>
            <span className="trust-item">Board-Certified Providers</span>
          </div>
        </div>

        {/* Hero */}
        <section className="hiw-hero">
          <div className="v2-label"><span className="v2-dot" /> How It Works</div>
          <h1>Start with One Assessment.<br />Get a Plan Built<br />Around You.</h1>
          <div className="hiw-rule" />
          <p className="hiw-hero-sub">
            Every patient starts the same way &mdash; a 60-minute Assessment where we listen, review your history, and build a plan that makes sense for your body and your goals.
          </p>
          <div style={{ marginTop: '2rem' }}>
            <Link href="/assessment" className="btn-primary">
              Book Your Range Assessment
            </Link>
          </div>
        </section>

        {/* Section 1: The Range Assessment */}
        <section id="hiw-assessment" className={`hiw-section-alt hiw-animate ${isVisible['hiw-assessment'] ? 'hiw-visible' : ''}`}>
          <div className="hiw-container">
            <div className="v2-label"><span className="v2-dot" /> The Assessment</div>
            <h2>What Happens in<br />Your Assessment</h2>
            <p className="hiw-section-intro">
              This is where everything starts. No guesswork, no menu of services to pick from &mdash; just a clear conversation about what&apos;s going on and what to do about it.
            </p>

            <div className="hiw-steps-grid">
              <div className="hiw-step">
                <span className="hiw-step-num">01</span>
                <h4>We review your history, symptoms, and goals</h4>
                <p>Your provider takes the time to understand the full picture &mdash; not just what hurts or what&apos;s off, but why.</p>
              </div>
              <div className="hiw-step">
                <span className="hiw-step-num">02</span>
                <h4>We discuss the right diagnostic path</h4>
                <p>Labs, imaging, or symptom-based intake &mdash; we figure out what information we need to build your plan.</p>
              </div>
              <div className="hiw-step">
                <span className="hiw-step-num">03</span>
                <h4>Your provider designs a personalized plan</h4>
                <p>Based on what we find, you get a clear protocol recommendation with transparent pricing and timeline.</p>
              </div>
              <div className="hiw-step">
                <span className="hiw-step-num">04</span>
                <h4>The full $197 is credited toward treatment</h4>
                <p>If you move forward with treatment, your Assessment cost goes directly toward your plan. Nothing wasted.</p>
              </div>
            </div>

            <div className="hiw-callout">
              <span className="hiw-callout-text">$197 &middot; 60 minutes &middot; Credited toward your plan</span>
            </div>
          </div>
        </section>

        {/* Section 2: Two Paths */}
        <section id="hiw-paths" className={`hiw-section hiw-animate ${isVisible['hiw-paths'] ? 'hiw-visible' : ''}`}>
          <div className="hiw-container">
            <div className="v2-label"><span className="v2-dot" /> Two Paths</div>
            <h2>Two Paths.<br />One Assessment.</h2>
            <p className="hiw-section-intro">
              You don&apos;t need to know which path is right before you book. Your provider will help you figure that out during the Assessment.
            </p>

            <div className="doors-grid">
              <div className="door-card">
                <span className="door-number">01</span>
                <h3>Injury &<br />Recovery</h3>
                <p>You&apos;re rehabbing an injury and healing feels slow. You want to speed things up.</p>
                <ul>
                  <li>Review your injury and rehab history</li>
                  <li>Discuss recovery timeline and goals</li>
                  <li>Get a clear protocol recommendation</li>
                  <li>$197 credited toward your treatment</li>
                </ul>
                <p className="hiw-path-experience">
                  Patients on this path typically work with tools like hyperbaric oxygen, red light therapy, PRP, and targeted peptides. Most see meaningful progress within 4&ndash;8 weeks.
                </p>
                <Link href="/assessment?path=injury" className="v2-link-cta">
                  Book Assessment <span>&rarr;</span>
                </Link>
              </div>

              <div className="door-card featured">
                <span className="door-badge">Most Popular</span>
                <span className="door-number">02</span>
                <h3>Energy,<br />Hormones &<br />Weight</h3>
                <p>You&apos;re tired, foggy, or just don&apos;t feel like yourself. You want answers and a plan.</p>
                <ul>
                  <li>Review symptoms, goals, and history</li>
                  <li>Discuss the right lab panel for you</li>
                  <li>Get a clear path forward</li>
                  <li>$197 credited toward your program</li>
                </ul>
                <p className="hiw-path-experience">
                  Patients on this path typically start with comprehensive labs, then move into hormone optimization, weight management, or peptide therapy. Most feel a noticeable difference within 6&ndash;10 weeks.
                </p>
                <Link href="/assessment?path=energy" className="v2-link-cta">
                  Book Assessment <span>&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: After the Assessment */}
        <section id="hiw-after" className={`hiw-section-alt hiw-animate ${isVisible['hiw-after'] ? 'hiw-visible' : ''}`}>
          <div className="hiw-container">
            <div className="v2-label"><span className="v2-dot" /> After the Assessment</div>
            <h2>What Happens Next</h2>
            <p className="hiw-section-intro">
              The Assessment is just the starting point. Here&apos;s what the experience looks like once you move forward.
            </p>

            <div className="hiw-next-grid">
              <div className="hiw-next-card">
                <span className="hiw-next-num">01</span>
                <h4>Your Plan</h4>
                <p>Built around what you actually need, not a menu of services to pick from. Your provider selects the right tools based on your Assessment, your labs, and your goals &mdash; then explains exactly why.</p>
              </div>
              <div className="hiw-next-card">
                <span className="hiw-next-num">02</span>
                <h4>Your Provider</h4>
                <p>Board-certified and available. Your provider takes the time to explain everything, answer your questions, and adjust your plan as you progress. No assembly line.</p>
              </div>
              <div className="hiw-next-card">
                <span className="hiw-next-num">03</span>
                <h4>Your Progress</h4>
                <p>Regular check-ins, plan adjustments based on how you&apos;re responding, and transparent pricing at every step. You always know where you stand and what comes next.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Why Cash-Pay */}
        <section id="hiw-cashpay" className={`hiw-section hiw-animate ${isVisible['hiw-cashpay'] ? 'hiw-visible' : ''}`}>
          <div className="hiw-container">
            <div className="v2-label"><span className="v2-dot" /> How We Work</div>
            <h2>No Insurance.<br />On Purpose.</h2>
            <p className="hiw-section-intro">
              We&apos;re a cash-pay clinic &mdash; and that&apos;s by design. It means more time with your provider,
              transparent pricing, and zero insurance red tape.
            </p>

            <div className="cashpay-grid">
              <div className="cashpay-item">
                <span className="cashpay-num">01</span>
                <h4>More Time With You</h4>
                <p>Insurance-based clinics move fast because they have to. We don&apos;t. Your visits are longer, your provider actually listens, and your plan is built around you &mdash; not a billing code.</p>
              </div>
              <div className="cashpay-item">
                <span className="cashpay-num">02</span>
                <h4>Transparent Pricing</h4>
                <p>You know what everything costs before you commit. No surprise bills, no co-pay confusion, no &ldquo;we&apos;ll see what insurance covers.&rdquo; The price we quote is the price you pay.</p>
              </div>
              <div className="cashpay-item">
                <span className="cashpay-num">03</span>
                <h4>Better Treatment Options</h4>
                <p>Many of the therapies we offer &mdash; peptides, hyperbaric oxygen, advanced labs &mdash; aren&apos;t covered by insurance anyway. Going cash-pay means we can offer what actually works, not just what gets approved.</p>
              </div>
              <div className="cashpay-item">
                <span className="cashpay-num">04</span>
                <h4>HSA & FSA Accepted</h4>
                <p>You can use your Health Savings Account or Flexible Spending Account for any of our services. Same card, same process &mdash; just swipe it like a credit card.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: FAQ */}
        <section id="hiw-faq" className={`hiw-section-alt hiw-animate ${isVisible['hiw-faq'] ? 'hiw-visible' : ''}`}>
          <div className="hiw-container">
            <div className="v2-label"><span className="v2-dot" /> Questions</div>
            <h2>Frequently Asked</h2>

            <div className="hiw-faq-list">
              {faqs.map((faq, i) => (
                <div key={i} className={`hiw-faq-item ${openFaq === i ? 'open' : ''}`}>
                  <button
                    className="hiw-faq-q"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span>{faq.question}</span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                        style={{ opacity: openFaq === i ? 0 : 1, transition: 'opacity 0.2s' }} />
                      <path d="M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <div className="hiw-faq-a">
                      <p>{faq.answer}{' '}
                        {i === faqs.length - 1 && (
                          <Link href="/clarity-finder" style={{ color: '#0A0A0A', fontWeight: 600 }}>
                            Take the Clarity Finder &rarr;
                          </Link>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: Final CTA */}
        <section className="final-cta">
          <div className="container">
            <h2>Ready to Start?</h2>
            <div className="cta-rule" />
            <p>Start with the $197 Range Assessment. Your full visit cost is credited toward treatment if you move forward.</p>
            <div className="cta-buttons">
              <Link href="/assessment" className="btn-white">
                Book Your Range Assessment
              </Link>
            </div>
            <p className="cta-location">
              Range Medical &bull; 1901 Westcliff Dr, Newport Beach
            </p>
          </div>
        </section>
      </Layout>

      <style jsx>{`
        .hiw-hero {
          padding: 6rem 2rem 5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hiw-hero h1 {
          margin-bottom: 2rem;
          max-width: 800px;
        }

        .hiw-hero-sub {
          font-size: 1.0625rem;
          color: #737373;
          max-width: 520px;
          line-height: 1.75;
        }

        .hiw-rule {
          width: 100%;
          max-width: 700px;
          height: 1px;
          background: #e0e0e0;
          margin: 2rem 0;
        }

        .hiw-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .hiw-section {
          padding: 5rem 0;
        }

        .hiw-section-alt {
          padding: 5rem 0;
          background: #fafafa;
        }

        .hiw-section-intro {
          font-size: 1.0625rem;
          color: #737373;
          max-width: 560px;
          line-height: 1.75;
          margin-top: 1rem;
        }

        .hiw-animate {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease-out, transform 0.5s ease-out;
        }

        .hiw-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Steps Grid */
        .hiw-steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .hiw-step {
          padding: 1.5rem;
          background: #ffffff;
          border: 1px solid #ebebeb;
        }

        .hiw-step-num {
          display: block;
          font-size: 28px;
          font-weight: 800;
          color: #e0e0e0;
          margin-bottom: 1rem;
          line-height: 1;
        }

        .hiw-step h4 {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 0.5rem;
          line-height: 1.4;
        }

        .hiw-step p {
          font-size: 0.875rem;
          color: #737373;
          line-height: 1.6;
          margin: 0;
        }

        .hiw-callout {
          margin-top: 2.5rem;
          text-align: center;
        }

        .hiw-callout-text {
          display: inline-block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #404040;
          padding: 0.75rem 2rem;
          border: 1px solid #e0e0e0;
          letter-spacing: 0.02em;
        }

        /* Path experience text */
        :global(.hiw-path-experience) {
          font-size: 0.8125rem !important;
          color: #737373 !important;
          font-style: italic;
          line-height: 1.6 !important;
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #e8e8e8;
        }

        /* After Assessment Grid */
        .hiw-next-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .hiw-next-card {
          padding: 2rem;
          background: #ffffff;
          border: 1px solid #ebebeb;
        }

        .hiw-next-num {
          display: block;
          font-size: 28px;
          font-weight: 800;
          color: #e0e0e0;
          margin-bottom: 1rem;
          line-height: 1;
        }

        .hiw-next-card h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 0.75rem;
        }

        .hiw-next-card p {
          font-size: 0.875rem;
          color: #737373;
          line-height: 1.7;
          margin: 0;
        }

        /* FAQ */
        .hiw-faq-list {
          margin-top: 2.5rem;
          max-width: 720px;
        }

        .hiw-faq-item {
          border-bottom: 1px solid #e8e8e8;
        }

        .hiw-faq-q {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 1.25rem 0;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1a1a1a;
          text-align: left;
          gap: 1rem;
        }

        .hiw-faq-q:hover {
          color: #404040;
        }

        .hiw-faq-a {
          padding: 0 0 1.25rem;
        }

        .hiw-faq-a p {
          font-size: 0.875rem;
          color: #737373;
          line-height: 1.7;
          margin: 0;
        }

        @media (max-width: 768px) {
          .hiw-hero {
            padding: 4rem 1.5rem 3rem;
          }

          .hiw-steps-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .hiw-next-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
      `}</style>
    </>
  );
}
