import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isVisible, setIsVisible] = useState({});
  const [openFaq, setOpenFaq] = useState(null);

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
      question: "What is the Range Assessment?",
      answer: "It's a one-on-one visit with a provider where we review your symptoms, health history, and goals. We figure out what's going on and build a plan around you. If you move forward with treatment, your full assessment cost is credited toward it."
    },
    {
      question: "Do I need labs before my first visit?",
      answer: "Not necessarily. At your assessment, your provider will recommend the right lab panel based on your symptoms. Some patients do labs the same day, others schedule them after."
    },
    {
      question: "How is this different from my regular doctor?",
      answer: "Most primary care visits are 10 minutes and end with a prescription. We spend more time, run deeper labs, and look at the full picture — hormones, nutrients, inflammation, metabolic health — to find the root cause, not just treat symptoms."
    },
    {
      question: "What does treatment look like?",
      answer: "It depends on what we find. Your plan might include hormone optimization, peptides, IVs, red light therapy, or other tools. Everything is explained clearly before you commit to anything."
    },
    {
      question: "Do you take insurance?",
      answer: "We're a cash-pay clinic. That means longer visits, transparent pricing, and access to treatments insurance typically doesn't cover. We do accept HSA and FSA cards."
    },
    {
      question: "How soon will I feel a difference?",
      answer: "Many patients notice changes within the first few weeks. Timelines vary by person and protocol. Your provider will set realistic expectations at your assessment."
    },
  ];

  return (
    <>
      <Head>
        <title>Range Medical | Feel Like Yourself Again | Newport Beach</title>
        <meta name="description" content="Tired, foggy, or just not yourself? Range Medical in Newport Beach finds out why. Start with a Range Assessment — deeper labs, real answers, and a clear plan." />
        <meta name="keywords" content="wellness clinic Newport Beach, low energy treatment, brain fog help, hormone optimization, medical weight loss, peptide therapy, IV therapy, fatigue treatment" />
        <link rel="canonical" href="https://www.range-medical.com/" />

        <meta property="og:title" content="Range Medical | Feel Like Yourself Again" />
        <meta property="og:description" content="Tired, foggy, or just not yourself? Start with a Range Assessment — deeper labs, real answers, and a clear plan built around you." />
        <meta property="og:url" content="https://www.range-medical.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.range-medical.com/og-home.jpg" />
        <meta property="og:site_name" content="Range Medical" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Range Medical | Feel Like Yourself Again" />
        <meta name="twitter:description" content="Tired, foggy, or just not yourself? Start with a Range Assessment — deeper labs, real answers, and a clear plan." />
        <meta name="twitter:image" content="https://www.range-medical.com/og-home.jpg" />

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
              "description": "Medical wellness clinic specializing in energy optimization, hormone balancing, and regenerative therapies in Newport Beach, California.",
              "url": "https://www.range-medical.com",
              "telephone": "+1-949-997-3988",
              "email": "info@range-medical.com",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "1901 Westcliff Dr, Suite 10",
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
              "openingHoursSpecification": [
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  "opens": "07:00",
                  "closes": "18:00"
                },
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": ["Saturday"],
                  "opens": "09:00",
                  "closes": "14:00"
                }
              ],
              "priceRange": "$$",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "reviewCount": "10",
                "bestRating": "5"
              },
              "sameAs": [
                "https://www.instagram.com/rangemedical",
                "https://www.facebook.com/rangemedical"
              ]
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

        {/* Hero — Single Energy & Optimization Focus */}
        <section id="home-hero" className="hero">
          <div className="v2-label"><span className="v2-dot" /> Energy &middot; Hormones &middot; Optimization</div>
          <h1>You shouldn&apos;t have to <em>push through</em> every day.</h1>
          <div className="hero-rule" />
          <p className="hero-sub">
            If you&apos;re tired, foggy, gaining weight, or just don&apos;t feel like yourself &mdash; there&apos;s a reason. We find it. Start with a Range Assessment: deeper labs, a real conversation, and a clear plan built around you.
          </p>
          <div style={{ marginTop: '2rem' }}>
            <Link href="/assessment" className="btn-primary">
              Start Your Range Assessment
            </Link>
          </div>
        </section>

        {/* Problem / Empathy */}
        <section id="home-empathy" className={`home-section-alt home-animate ${isVisible['home-empathy'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <div className="v2-label"><span className="v2-dot" /> Sound Familiar?</div>
            <h2>Something feels <em>off</em> &mdash; and no one can tell you why.</h2>
            <p className="home-section-intro">
              You&apos;ve tried sleeping more. Eating better. Working out. But something still isn&apos;t right.
            </p>

            <div className="symptoms-grid" style={{ maxWidth: '1000px' }}>
              {[
                { title: 'Low Energy', items: ['Tired by mid-afternoon', 'Need caffeine to function', 'Exhausted even after sleep'] },
                { title: 'Brain Fog', items: ['Hard to focus at work', 'Forgetting things more often', 'Feeling mentally sluggish'] },
                { title: 'Weight Changes', items: ['Gaining weight without reason', 'Can\'t lose it no matter what', 'Appetite feels unpredictable'] },
                { title: 'Poor Recovery', items: ['Sore longer than you should be', 'Sleep doesn\'t feel restorative', 'Getting sick more often'] },
              ].map((card, i) => (
                <div key={i} className="symptom-card">
                  <h4>{card.title}</h4>
                  <ul>
                    {card.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p style={{ marginTop: '2.5rem', fontSize: '17px', color: '#737373', maxWidth: '520px' }}>
              These aren&apos;t things you should just live with. They&apos;re signals. And once we understand what&apos;s driving them, we can fix them.
            </p>
          </div>
        </section>

        {/* How It Works — Range Assessment */}
        <section id="home-process" className={`home-section home-animate ${isVisible['home-process'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <div className="v2-label"><span className="v2-dot" /> How It Works</div>
            <h2>Your Range Assessment. <em>Four steps.</em></h2>
            <p className="home-section-intro">
              Everything starts here. No guessing, no generic advice. Just a clear path to feeling like yourself again.
            </p>

            <div className="process-steps">
              <div className="process-step">
                <span className="step-number">01</span>
                <h4>Tell Us What&apos;s Going On</h4>
                <p>Answer a few questions about your symptoms, history, and goals. Takes about 5 minutes online.</p>
              </div>
              <div className="process-step">
                <span className="step-number">02</span>
                <h4>Meet Your Provider</h4>
                <p>A one-on-one conversation about what you&apos;re experiencing. We listen, ask questions, and dig deeper than a typical visit.</p>
              </div>
              <div className="process-step">
                <span className="step-number">03</span>
                <h4>Get the Right Labs</h4>
                <p>Your provider recommends the lab panel that fits your situation. We check hormones, nutrients, metabolic markers, and more.</p>
              </div>
              <div className="process-step">
                <span className="step-number">04</span>
                <h4>Your Plan, Explained</h4>
                <p>We review your results together and build a clear plan. You understand every step before you commit to anything.</p>
              </div>
            </div>

            <div style={{ marginTop: '3rem' }}>
              <Link href="/assessment" className="btn-primary">
                Start Your Range Assessment
              </Link>
            </div>
          </div>
        </section>

        {/* Outcomes / Benefits */}
        <section id="home-outcomes" className={`home-section-alt home-animate ${isVisible['home-outcomes'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <div className="v2-label"><span className="v2-dot" /> What Patients Report</div>
            <h2>Real improvements. <em>Not promises.</em></h2>
            <p className="home-section-intro">
              When we find the root cause and address it properly, patients tell us things start to shift.
            </p>

            <div className="cashpay-grid">
              {[
                { num: '01', title: 'Steady Energy', desc: 'No more afternoon crashes. Patients report feeling more consistent energy throughout the day — not wired, just awake.' },
                { num: '02', title: 'Mental Clarity', desc: 'The fog lifts. Focus comes back. Patients say they feel sharper at work and more present at home.' },
                { num: '03', title: 'Better Sleep & Mood', desc: 'Falling asleep easier, staying asleep longer, and waking up feeling like sleep actually worked.' },
                { num: '04', title: 'Faster Recovery', desc: 'Workouts feel better. Soreness fades faster. The body starts bouncing back the way it used to.' },
              ].map((item, i) => (
                <div key={i} className="cashpay-item">
                  <span className="cashpay-num">{item.num}</span>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tools We Use */}
        <section id="home-services" className={`home-section home-animate ${isVisible['home-services'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <div className="v2-label"><span className="v2-dot" /> What We Offer</div>
            <h2>Tools we use to <em>help you feel better.</em></h2>
            <p className="home-section-intro">
              You don&apos;t need to choose your therapies upfront. Your provider picks the right tools for your situation after the Assessment.
            </p>

            <div className="tools-grid">
              {[
                { name: 'Hormone Optimization', desc: 'Balanced hormones for energy, mood, and how you feel day to day.', href: '/hormone-optimization' },
                { name: 'Medical Weight Loss', desc: 'Medical support for weight, appetite, and metabolism.', href: '/weight-loss' },
                { name: 'IV Therapy', desc: 'Vitamins and nutrients delivered directly to your bloodstream.', href: '/iv-therapy' },
                { name: 'Peptide Therapy', desc: 'Targeted peptides for recovery, performance, and longevity.', href: '/peptide-therapy' },
                { name: 'Hyperbaric Oxygen', desc: 'More oxygen to your cells to support healing and energy.', href: '/hyperbaric-oxygen-therapy' },
                { name: 'Red Light Therapy', desc: 'Light wavelengths that help cells recover and function better.', href: '/red-light-therapy' },
              ].map((svc, i) => (
                <Link key={i} href={svc.href} className="tool-card">
                  <span className="tool-num">{String(i + 1).padStart(2, '0')}</span>
                  <h4>{svc.name}</h4>
                  <p>{svc.desc}</p>
                  <span className="tool-arrow">&rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="home-testimonials" className={`home-section-alt home-animate ${isVisible['home-testimonials'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <div className="v2-label"><span className="v2-dot" /> Patient Stories</div>
            <h2>What our <em>patients</em> say.</h2>

            <div className="testimonials-grid" style={{ marginTop: '2.5rem' }}>
              <div className="testimonial">
                <div className="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p>
                  &ldquo;I was skeptical, but after the Assessment I finally understood why I&apos;d been so tired.
                  Six weeks later I feel like myself again.&rdquo;
                </p>
                <div className="testimonial-info">
                  <strong>Sarah M.</strong>
                  <span>Newport Beach</span>
                </div>
              </div>

              <div className="testimonial">
                <div className="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p>
                  &ldquo;I kept telling my doctor I was tired and foggy. They said everything was normal.
                  Range ran deeper labs and found the problem in two weeks.&rdquo;
                </p>
                <div className="testimonial-info">
                  <strong>David L.</strong>
                  <span>Costa Mesa</span>
                </div>
              </div>

              <div className="testimonial">
                <div className="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p>
                  &ldquo;Clear communication, no pressure, and a plan that actually made sense.
                  This is what healthcare should be.&rdquo;
                </p>
                <div className="testimonial-info">
                  <strong>Jennifer K.</strong>
                  <span>Irvine</span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <Link href="/reviews" className="btn-outline">Read More Reviews</Link>
            </div>
          </div>
        </section>

        {/* Mid-Page Injury Module */}
        <section id="home-injury" className={`home-section home-animate ${isVisible['home-injury'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <div className="home-injury-module">
              <div className="home-injury-content">
                <div className="v2-label"><span className="v2-dot" /> Injury Recovery</div>
                <h2 style={{ fontSize: '36px' }}>Already working with a PT or chiropractor?</h2>
                <p style={{ fontSize: '17px', color: '#737373', lineHeight: '1.7', margin: '1.25rem 0 0' }}>
                  If your injury is healing slower than expected, we can help. Range Medical offers peptide therapy, PRP, red light, and hyperbaric oxygen to support the recovery work you&apos;re already doing &mdash; in coordination with your current provider.
                </p>
                <p style={{ fontSize: '15px', color: '#a0a0a0', lineHeight: '1.6', margin: '1rem 0 2rem' }}>
                  We work with several physical therapy and chiropractic clinics in the area, including one in the same building.
                </p>
                <Link href="/injury-recovery" className="btn-outline">
                  See Injury Recovery Options
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Cash-Pay Model */}
        <section id="home-cashpay" className={`home-section-alt home-animate ${isVisible['home-cashpay'] ? 'home-visible' : ''}`}>
          <div className="home-container">
            <div className="v2-label"><span className="v2-dot" /> How We Work</div>
            <h2>No insurance. <em>On purpose.</em></h2>
            <p className="home-section-intro">
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

        {/* FAQ */}
        <section id="home-faq" className={`home-section home-animate ${isVisible['home-faq'] ? 'home-visible' : ''}`}>
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
            <h2>Ready to <em>feel like yourself</em> again?</h2>
            <div className="cta-rule" />
            <p>Start with the Range Assessment. We&apos;ll find out what&apos;s going on and build a plan around you.</p>
            <div className="cta-buttons">
              <Link href="/assessment" className="btn-white">
                Start Your Range Assessment
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
