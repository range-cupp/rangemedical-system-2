import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function HowItWorks() {
  const [openFaq, setOpenFaq] = useState(null);
  const [visible, setVisible] = useState({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    const els = document.querySelectorAll('.hiw-fade');
    els.forEach((el) => observer.observe(el));
    return () => els.forEach((el) => observer.unobserve(el));
  }, []);

  const faqs = [
    {
      q: "What’s included in the $197 Assessment?",
      a: "A 30-minute visit with a board-certified provider where we review your full history, symptoms, and goals. You’ll leave with a clear plan, treatment recommendations, timeline, and transparent pricing. The full $197 is credited toward treatment if you move forward."
    },
    {
      q: "How long does the Assessment take?",
      a: "About 30 minutes. We take the time to understand what’s going on before recommending anything."
    },
    {
      q: "What if I don’t move forward with treatment after the Assessment?",
      a: "That’s completely fine. If we don’t think treatment is the right call, we’ll tell you. You’ll still leave with a clear picture of where things stand and what to watch for."
    },
    {
      q: "Do I need labs done before I come in?",
      a: "No. We’ll discuss whether labs make sense during your Assessment. If they do, we’ll order them afterward and review the results with you at a follow-up."
    },
    {
      q: "Can I use my HSA or FSA?",
      a: "Yes. You can use your Health Savings Account or Flexible Spending Account for any of our services, including the Assessment. Just swipe it like a credit card."
    },
    {
      q: "I’m not sure which path is right for me — what should I do?",
      a: "That’s what the Assessment is for. You don’t need to decide beforehand. Your provider will help you figure out the right starting point.",
      link: true
    },
  ];

  return (
    <>
      <Head>
        <title>How It Works | Range Medical Newport Beach</title>
        <meta name="description" content="Every patient at Range Medical starts with the $197 Assessment. Thirty minutes with a board-certified provider, a personalized plan, and full credit toward your treatment." />
        <link rel="canonical" href="https://www.range-medical.com/how-it-works" />

        <meta property="og:title" content="How It Works | Range Medical Newport Beach" />
        <meta property="og:description" content="Every patient at Range Medical starts with the $197 Assessment. Thirty minutes with a board-certified provider, a personalized plan, and full credit toward your treatment." />
        <meta property="og:url" content="https://www.range-medical.com/how-it-works" />
        <meta property="og:type" content="website" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqs.map(f => ({
                "@type": "Question",
                "name": f.q,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": f.a
                }
              }))
            })
          }}
        />
      </Head>

      <Layout>
        <div className="hiw">

          {/* ── Hero ── */}
          <section className="hiw-hero">
            <span className="hiw-eyebrow">HOW IT WORKS</span>
            <h1>It starts with <em>one Assessment.</em></h1>
            <p className="hiw-sub">
              We review your history, symptoms, and goals &mdash; then build the plan that fits your situation. No guessing. No menu shopping.
            </p>
          </section>

          {/* ── Section 1: The Assessment ── */}
          <section id="s-assess" className={`hiw-sect hiw-fade${visible['s-assess'] ? ' hiw-in' : ''}`}>
            <div className="hiw-wrap">
              <span className="hiw-eyebrow">THE ASSESSMENT</span>
              <h2>Thirty minutes that <em>change everything.</em></h2>
              <p className="hiw-body-lg">
                Every patient at Range Medical starts with the $197 Range Assessment. It&apos;s not a sales pitch. It&apos;s a real conversation with a board-certified provider &mdash; about what&apos;s actually going on, what we can help with, and what comes next.
              </p>

              <div className="hiw-deep">
                <div className="hiw-deep-block">
                  <h3>What we cover.</h3>
                  <p>Your full history, current symptoms, and what you actually want to feel like. We talk through diagnostics &mdash; labs, imaging, or symptom-based intake &mdash; and decide what makes sense for you.</p>
                </div>
                <div className="hiw-deep-block">
                  <h3>What you walk out with.</h3>
                  <p>A clear plan, written down. Treatment recommendations, timeline, and pricing &mdash; no surprises after the fact.</p>
                </div>
                <div className="hiw-deep-block">
                  <h3>What it costs.</h3>
                  <p>$197. The full amount is credited toward your treatment if you move forward. HSA and FSA accepted.</p>
                </div>
              </div>

              <p className="hiw-link-cta">
                <Link href="/assessment">Book your Assessment <span>&rarr;</span></Link>
              </p>
            </div>
          </section>

          {/* ── Section 2: What Happens Next ── */}
          <section id="s-next" className={`hiw-sect hiw-fade${visible['s-next'] ? ' hiw-in' : ''}`}>
            <div className="hiw-wrap">
              <span className="hiw-eyebrow">AFTER THE ASSESSMENT</span>
              <h2>Then we <em>get to work.</em></h2>

              <div className="hiw-trio">
                <div className="hiw-trio-item">
                  <span className="hiw-numeral">01</span>
                  <h3>Your plan.</h3>
                  <p>Built around what you actually need. Not a menu of services to pick from. Your provider chooses the right tools for your situation.</p>
                </div>
                <div className="hiw-trio-item">
                  <span className="hiw-numeral">02</span>
                  <h3>Your treatment.</h3>
                  <p>Delivered at our Newport Beach clinic. Self-administered protocols come with hands-on training. You&apos;re never figuring it out alone.</p>
                </div>
                <div className="hiw-trio-item">
                  <span className="hiw-numeral">03</span>
                  <h3>Your follow-up.</h3>
                  <p>Regular check-ins built into your plan. We adjust as your body responds. Direct access to your provider &mdash; no patient portal maze.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 3: Two Paths ── */}
          <section id="s-paths" className={`hiw-sect hiw-fade${visible['s-paths'] ? ' hiw-in' : ''}`}>
            <div className="hiw-wrap">
              <span className="hiw-eyebrow">TWO PATHS</span>
              <h2>Most people come for <em>one of two reasons.</em></h2>
              <p className="hiw-sub-text">Tell us which one is you, and we&apos;ll take it from there.</p>

              <div className="hiw-cards">
                <div className="hiw-card">
                  <span className="hiw-card-eyebrow">PATH 01</span>
                  <h3>You&apos;re rehabbing an injury and healing feels slow.</h3>
                  <p>You&apos;ve tried rest, PT, maybe a cortisone shot. But recovery has stalled and you want to know what else is available. We work with tools like hyperbaric oxygen, PRP, red light therapy, and targeted peptides to help your body heal faster.</p>
                  <p className="hiw-link-cta">
                    <Link href="/assessment?path=injury">Start with Recovery <span>&rarr;</span></Link>
                  </p>
                </div>
                <div className="hiw-card">
                  <span className="hiw-card-eyebrow">PATH 02</span>
                  <h3>You&apos;re tired, foggy, or just don&apos;t feel like yourself.</h3>
                  <p>Something shifted &mdash; your energy, your sleep, your weight, your focus. You know something&apos;s off but your labs keep coming back &ldquo;normal.&rdquo; We run deeper diagnostics and build a plan around hormone optimization, peptides, weight management, or cellular-level support.</p>
                  <p className="hiw-link-cta">
                    <Link href="/assessment?path=energy">Start with Optimization <span>&rarr;</span></Link>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 4: Why Cash-Pay ── */}
          <section id="s-cash" className={`hiw-sect hiw-fade${visible['s-cash'] ? ' hiw-in' : ''}`}>
            <div className="hiw-wrap">
              <span className="hiw-eyebrow">OUR MODEL</span>
              <h2>No insurance. <em>On purpose.</em></h2>

              <div className="hiw-grid-2x2">
                <div className="hiw-grid-item">
                  <h3>More Time With You</h3>
                  <p>Insurance-based clinics move fast because they have to. We don&apos;t. Your visits are longer, your provider actually listens, and your plan is built around you &mdash; not a billing code.</p>
                </div>
                <div className="hiw-grid-item">
                  <h3>Transparent Pricing</h3>
                  <p>You know what everything costs before you commit. No surprise bills, no co-pay confusion, no &ldquo;we&apos;ll see what insurance covers.&rdquo; The price we quote is the price you pay.</p>
                </div>
                <div className="hiw-grid-item">
                  <h3>Better Treatment Options</h3>
                  <p>Many of the therapies we offer &mdash; peptides, hyperbaric oxygen, advanced labs &mdash; aren&apos;t covered by insurance anyway. Going cash-pay means we can offer what actually works, not just what gets approved.</p>
                </div>
                <div className="hiw-grid-item">
                  <h3>HSA &amp; FSA Accepted</h3>
                  <p>You can use your Health Savings Account or Flexible Spending Account for any of our services. Same card, same process &mdash; just swipe it like a credit card.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 5: Pricing ── */}
          <section id="s-pricing" className={`hiw-sect hiw-sect-center hiw-fade${visible['s-pricing'] ? ' hiw-in' : ''}`}>
            <div className="hiw-wrap">
              <span className="hiw-eyebrow">PRICING</span>
              <h2>$197 <em>Assessment.</em> Credited toward your plan.</h2>

              <div className="hiw-pricing-card">
                <ul>
                  <li>30-minute Assessment with a board-certified provider</li>
                  <li>Personalized plan recommendation</li>
                  <li>Full $197 credited toward treatment</li>
                  <li>HSA/FSA accepted</li>
                </ul>
              </div>

              <Link href="/assessment" className="hiw-btn-primary">Book Your Assessment</Link>
            </div>
          </section>

          {/* ── Section 6: FAQ ── */}
          <section id="s-faq" className={`hiw-sect hiw-fade${visible['s-faq'] ? ' hiw-in' : ''}`}>
            <div className="hiw-wrap">
              <span className="hiw-eyebrow">QUESTIONS</span>
              <h2>Common <em>questions.</em></h2>

              <div className="hiw-faq-list">
                {faqs.map((faq, i) => (
                  <div key={i} className={`hiw-faq-item${openFaq === i ? ' open' : ''}`}>
                    <button
                      className="hiw-faq-q"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      aria-expanded={openFaq === i}
                    >
                      <span>{faq.q}</span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M7 1v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                          style={{ opacity: openFaq === i ? 0 : 1, transition: 'opacity 0.2s' }} />
                        <path d="M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                    {openFaq === i && (
                      <div className="hiw-faq-a">
                        <p>
                          {faq.a}
                          {faq.link && (
                            <>
                              {' '}You can also{' '}
                              <Link href="/clarity-finder" style={{ color: 'var(--color-accent)', fontWeight: 500 }}>
                                take the Clarity Finder
                              </Link>
                              {' '}to get a recommendation before booking.
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Section 7: Final CTA ── */}
          <section id="s-final" className={`hiw-sect hiw-sect-center hiw-fade${visible['s-final'] ? ' hiw-in' : ''}`}>
            <div className="hiw-wrap">
              <h2>Most people wait until they&apos;re <em>not feeling like themselves.</em></h2>
              <p className="hiw-sub-text" style={{ maxWidth: '400px', margin: '0 auto' }}>You don&apos;t have to.</p>

              <div className="hiw-final-btns">
                <Link href="/assessment" className="hiw-btn-primary">Book Your Range Assessment</Link>
                <Link href="/clarity-finder" className="hiw-btn-ghost">Take the Clarity Finder</Link>
              </div>
            </div>
          </section>

        </div>
      </Layout>

      <style jsx>{`
        .hiw {
          background: var(--color-bg);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* ── Typography overrides ── */
        .hiw h1, .hiw h2 {
          font-family: 'Fraunces', serif;
          font-weight: 400;
          text-transform: none;
          letter-spacing: -0.02em;
          color: var(--color-text);
        }

        .hiw h1 {
          font-size: 88px;
          line-height: 1.05;
        }

        .hiw h2 {
          font-size: 56px;
          line-height: 1.1;
        }

        .hiw h3 {
          font-family: 'Fraunces', serif;
          font-weight: 500;
          font-size: 32px;
          line-height: 1.2;
          text-transform: none;
          letter-spacing: -0.01em;
          color: var(--color-text);
        }

        .hiw h1 :global(em), .hiw h2 :global(em), .hiw h3 :global(em) {
          font-style: italic;
        }

        .hiw p {
          color: var(--color-text-muted);
        }

        /* ── Eyebrow ── */
        .hiw-eyebrow {
          display: block;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          line-height: 1.4;
          margin-bottom: 1.25rem;
        }

        /* ── Hero ── */
        .hiw-hero {
          padding: 120px 2rem 100px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hiw-sub {
          font-size: 20px;
          line-height: 1.6;
          color: var(--color-text-muted);
          max-width: 560px;
          margin-top: 1.5rem;
        }

        /* ── Section defaults ── */
        .hiw-sect {
          padding: 160px 2rem;
        }

        .hiw-sect-center {
          text-align: center;
        }

        .hiw-sect-center .hiw-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hiw-wrap {
          max-width: 1200px;
          margin: 0 auto;
        }

        /* ── Fade animation ── */
        .hiw-fade {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 600ms cubic-bezier(0.4, 0, 0.2, 1),
                      transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hiw-in {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Body large ── */
        .hiw-body-lg {
          font-size: 20px;
          line-height: 1.6;
          color: var(--color-text-muted);
          max-width: 640px;
          margin-top: 1.25rem;
        }

        .hiw-sub-text {
          font-size: 20px;
          line-height: 1.6;
          color: var(--color-text-muted);
          margin-top: 0.75rem;
        }

        /* ── Section 1: Deep blocks ── */
        .hiw-deep {
          margin-top: 3.5rem;
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .hiw-deep-block h3 {
          font-size: 24px;
          margin-bottom: 0.5rem;
        }

        .hiw-deep-block p {
          font-size: 17px;
          line-height: 1.6;
          max-width: 600px;
        }

        /* ── Inline link CTA ── */
        :global(.hiw-link-cta) {
          margin-top: 2rem;
        }

        :global(.hiw-link-cta a) {
          font-family: 'Inter', sans-serif;
          font-size: 17px;
          font-weight: 500;
          color: var(--color-accent);
          text-decoration: none;
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
        }

        :global(.hiw-link-cta a)::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--color-accent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform var(--transition);
        }

        :global(.hiw-link-cta a:hover)::after {
          transform: scaleX(1);
        }

        :global(.hiw-link-cta a span) {
          transition: transform var(--transition);
        }

        :global(.hiw-link-cta a:hover span) {
          transform: translateX(4px);
        }

        /* ── Section 2: Trio ── */
        .hiw-trio {
          margin-top: 3.5rem;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3rem;
        }

        .hiw-numeral {
          display: block;
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 32px;
          font-weight: 400;
          color: var(--color-accent);
          margin-bottom: 1rem;
          line-height: 1;
        }

        .hiw-trio-item h3 {
          font-size: 24px;
          margin-bottom: 0.75rem;
        }

        .hiw-trio-item p {
          font-size: 17px;
          line-height: 1.6;
        }

        /* ── Section 3: Two cards ── */
        .hiw-cards {
          margin-top: 3rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .hiw-card {
          background: #ffffff;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 2.5rem;
        }

        .hiw-card-eyebrow {
          display: block;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin-bottom: 1rem;
        }

        .hiw-card h3 {
          font-size: 24px;
          margin-bottom: 1rem;
        }

        .hiw-card > p {
          font-size: 17px;
          line-height: 1.6;
        }

        /* ── Section 4: 2x2 grid ── */
        .hiw-grid-2x2 {
          margin-top: 3rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .hiw-grid-item h3 {
          font-size: 24px;
          margin-bottom: 0.5rem;
        }

        .hiw-grid-item p {
          font-size: 17px;
          line-height: 1.6;
        }

        /* ── Section 5: Pricing card ── */
        .hiw-pricing-card {
          margin: 2.5rem 0;
          background: #ffffff;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 2.5rem 3rem;
          max-width: 480px;
          text-align: left;
        }

        .hiw-pricing-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .hiw-pricing-card li {
          font-size: 17px;
          color: var(--color-text);
          padding: 0.625rem 0 0.625rem 1.5rem;
          position: relative;
          line-height: 1.5;
          border-bottom: 1px solid #f0f0f0;
        }

        .hiw-pricing-card li:last-child {
          border-bottom: none;
        }

        .hiw-pricing-card li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: var(--color-accent);
          font-weight: 600;
        }

        /* ── Buttons ── */
        :global(.hiw-btn-primary) {
          display: inline-block;
          background: var(--color-accent);
          color: #ffffff;
          padding: 16px 32px;
          border-radius: 999px;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 500;
          line-height: 1;
          text-decoration: none;
          transition: background var(--transition);
        }

        :global(.hiw-btn-primary:hover) {
          background: var(--color-accent-hover);
        }

        :global(.hiw-btn-ghost) {
          display: inline-block;
          background: transparent;
          color: var(--color-accent);
          padding: 16px 32px;
          border: 1px solid var(--color-accent);
          border-radius: 999px;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 500;
          line-height: 1;
          text-decoration: none;
          transition: background var(--transition), color var(--transition);
        }

        :global(.hiw-btn-ghost:hover) {
          background: var(--color-accent);
          color: #ffffff;
        }

        .hiw-final-btns {
          margin-top: 2.5rem;
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* ── FAQ ── */
        .hiw-faq-list {
          margin-top: 2.5rem;
          max-width: 720px;
          width: 100%;
        }

        .hiw-faq-item {
          border-bottom: 1px solid var(--color-border);
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
          font-family: 'Inter', sans-serif;
          font-size: 17px;
          font-weight: 500;
          color: var(--color-text);
          text-align: left;
          gap: 1rem;
          transition: color var(--transition);
        }

        .hiw-faq-q:hover {
          color: var(--color-accent);
        }

        .hiw-faq-a {
          padding: 0 0 1.25rem;
        }

        .hiw-faq-a p {
          font-size: 17px;
          color: var(--color-text-muted);
          line-height: 1.6;
          margin: 0;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .hiw h1 {
            font-size: 48px;
          }

          .hiw h2 {
            font-size: 36px;
          }

          .hiw h3 {
            font-size: 24px;
          }

          .hiw-body-lg, .hiw-sub, .hiw-sub-text {
            font-size: 18px;
          }

          .hiw-hero {
            padding: 80px 1.5rem 64px;
          }

          .hiw-sect {
            padding: 96px 1.5rem;
          }

          .hiw-trio {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }

          .hiw-cards {
            grid-template-columns: 1fr;
          }

          .hiw-grid-2x2 {
            grid-template-columns: 1fr;
          }

          .hiw-pricing-card {
            padding: 2rem;
          }

          .hiw-final-btns {
            flex-direction: column;
            align-items: center;
          }

          .hiw-deep-block p,
          .hiw-trio-item p,
          .hiw-card > p,
          .hiw-grid-item p {
            font-size: 16px;
          }
        }
      `}</style>
    </>
  );
}
