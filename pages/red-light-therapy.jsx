// pages/red-light-therapy.jsx
// Red Light Therapy - Full service page with site nav/footer

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function RedLightTherapy() {
  const [openFaq, setOpenFaq] = useState(null);

  // Scroll-based animations with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    const elements = document.querySelectorAll('.rlt-page .rlt-animate');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "Is red light therapy safe?",
      answer: "Yes. Red light therapy uses non-ionizing light, meaning it doesn't damage your skin or cells the way UV light can. It's been studied for decades and is considered very safe. Most people feel nothing during a session — just warmth and relaxation."
    },
    {
      question: "Does it hurt?",
      answer: "Not at all. You'll feel a gentle warmth from the LEDs, but there's no pain, no burning, and no downtime. Most people find it relaxing and even fall asleep during sessions."
    },
    {
      question: "How many sessions do I need?",
      answer: "It depends on your goals. Some people notice improvements in energy or skin after just a few sessions. For deeper benefits like recovery or inflammation, most people see results with consistent use over 2–4 weeks. Our team can help you figure out what's right for you."
    },
    {
      question: "How long is a session?",
      answer: "A typical session is about 20 minutes. You simply lie down in the LED bed, relax, and let the light do its work."
    },
    {
      question: "What should I wear?",
      answer: "You can wear whatever is comfortable. Most people wear minimal clothing to expose more skin to the light, but it's entirely up to you. We provide a private room for your session."
    },
    {
      question: "Can I combine it with other treatments?",
      answer: "Absolutely. Red light therapy pairs well with other recovery modalities like hyperbaric oxygen therapy, IV therapy, and peptide protocols. Many of our patients use it as part of a broader wellness plan."
    }
  ];

  const benefits = [
    { number: "01", title: "Skin Health", desc: "Red and near-infrared light may stimulate collagen production and improve skin texture, tone, and elasticity — helping reduce the appearance of fine lines and blemishes." },
    { number: "02", title: "Muscle Recovery", desc: "Athletes use red light therapy to reduce muscle soreness and speed up recovery after workouts. The light may help reduce inflammation and support tissue repair." },
    { number: "03", title: "Joint & Pain Support", desc: "Studies suggest red light therapy may help reduce joint stiffness and discomfort by decreasing inflammation and improving circulation to affected areas." },
    { number: "04", title: "Energy & Mood", desc: "By supporting mitochondrial function — your cells' energy factories — red light therapy may help improve energy levels, focus, and overall mood." },
    { number: "05", title: "Sleep Quality", desc: "Exposure to red light may help regulate your circadian rhythm and support melatonin production, leading to better, more restful sleep." },
    { number: "06", title: "Circulation", desc: "Red light therapy may help improve blood flow and microcirculation, delivering more oxygen and nutrients to your tissues while clearing out waste products." }
  ];

  const athletes = [
    { icon: "🏈", name: "Patrick Mahomes", sport: "NFL · Kansas City Chiefs" },
    { icon: "🏀", name: "LeBron James", sport: "NBA · Los Angeles Lakers" },
    { icon: "⚽", name: "Cristiano Ronaldo", sport: "Professional Soccer" },
    { icon: "🎾", name: "Serena Williams", sport: "Professional Tennis" },
    { icon: "🏊", name: "Katie Ledecky", sport: "Olympic Swimming" },
    { icon: "🥊", name: "Conor McGregor", sport: "UFC Fighter" },
    { icon: "⛳", name: "Rory McIlroy", sport: "PGA Golf" },
    { icon: "🏃", name: "Usain Bolt", sport: "Olympic Track & Field" }
  ];

  const tags = [
    "Tired or Low Energy",
    "Skin Concerns",
    "Muscle Soreness",
    "Joint Stiffness",
    "Slow Recovery",
    "Sleep Issues",
    "Inflammation",
    "Looking for Natural Solutions"
  ];

  const steps = [
    { step: "Step 1", title: "Arrive & get comfortable", desc: "You'll be shown to a private room with our full-body LED bed. Wear comfortable clothes or undress to your comfort level — the more skin exposed, the more benefit." },
    { step: "Step 2", title: "Lie down in the LED bed", desc: "Our INNER Light LED Bed features 14,400 LEDs delivering both red (660nm) and near-infrared (850nm) wavelengths. Just lie down and relax." },
    { step: "Step 3", title: "Relax for 20 minutes", desc: "The session runs for about 20 minutes. Many people close their eyes, meditate, or even fall asleep. The warmth is gentle and soothing." },
    { step: "Step 4", title: "You're done", desc: "There's no recovery time needed. You can go about your day immediately. Many people feel relaxed, refreshed, or more energized right after." }
  ];

  const researchStudies = [
    {
      category: "SKIN HEALTH",
      headline: "Improved Skin Complexion and Collagen Density",
      summary: "A randomized controlled trial found that participants who received red light therapy showed significant improvements in skin complexion, collagen density, and reduction in fine lines compared to the control group. Effects were visible after 30 sessions.",
      source: "Photomedicine and Laser Surgery, 2014"
    },
    {
      category: "MUSCLE RECOVERY",
      headline: "Reduced Muscle Fatigue and Damage",
      summary: "A systematic review of 46 studies found that photobiomodulation therapy (red and near-infrared light) applied before exercise significantly reduced muscle fatigue, muscle damage markers, and delayed-onset muscle soreness (DOMS).",
      source: "Lasers in Medical Science, 2018"
    },
    {
      category: "PAIN & INFLAMMATION",
      headline: "Reduced Pain in Chronic Joint Disorders",
      summary: "A meta-analysis of 22 trials showed that low-level laser therapy (including red light wavelengths) significantly reduced pain and improved function in patients with chronic joint disorders, including osteoarthritis.",
      source: "Clinical Journal of Pain, 2019"
    },
    {
      category: "CELLULAR ENERGY",
      headline: "Enhanced Mitochondrial Function",
      summary: "Research shows that red and near-infrared light is absorbed by cytochrome c oxidase in mitochondria, leading to increased ATP production, reduced oxidative stress, and improved cellular energy metabolism.",
      source: "Photochemistry and Photobiology, 2017"
    },
    {
      category: "SLEEP",
      headline: "Improved Sleep Quality and Melatonin Levels",
      summary: "A study on female basketball players found that 14 days of red light therapy improved sleep quality scores and increased serum melatonin levels, suggesting a role in circadian rhythm regulation.",
      source: "Journal of Athletic Training, 2012"
    },
    {
      category: "WOUND HEALING",
      headline: "Accelerated Tissue Repair",
      summary: "A review of clinical evidence found that red light therapy accelerates wound healing by stimulating fibroblast proliferation, collagen synthesis, and angiogenesis (new blood vessel formation).",
      source: "Anais Brasileiros de Dermatologia, 2014"
    }
  ];

  return (
    <Layout
      title="Red Light Therapy | Newport Beach | Range Medical"
      description="Discover how red light therapy may support skin health, muscle recovery, energy, and more. Full-body LED bed with 14,400 LEDs. Available at Range Medical in Newport Beach."
    >
      <Head>
        <meta name="keywords" content="red light therapy, photobiomodulation, LED therapy, Newport Beach, skin health, muscle recovery, inflammation, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/red-light-therapy" />
        <meta property="og:title" content="Red Light Therapy | Newport Beach | Range Medical" />
        <meta property="og:description" content="Discover how red light therapy may support skin health, muscle recovery, energy, and more. Full-body LED bed available at Range Medical." />
        <meta property="og:url" content="https://www.range-medical.com/red-light-therapy" />
      </Head>

      {/* Dark Trust Bar Override */}
      <style jsx global>{`
        .rlt-page ~ .trust-bar,
        .trust-bar:has(+ .rlt-page),
        body:has(.rlt-page) .trust-bar {
          background: #000 !important;
        }
      `}</style>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">★★★★★</span> 5.0 on Google
          </span>
          <span className="trust-item">📍 Newport Beach, CA</span>
          <span className="trust-item">✓ Licensed Providers</span>
        </div>
      </div>

      <div className="rlt-page">
        {/* Hero */}
        <section className="rlt-hero">
          <div className="rlt-kicker">Recovery · Energy · Skin Health</div>
          <h1>Your Guide to Red Light Therapy</h1>
          <p className="rlt-body-text">Everything you need to know about the science-backed recovery tool used by pro athletes, biohackers, and wellness seekers — explained simply.</p>
          <div className="rlt-hero-scroll">
            Scroll to explore
            <span>↓</span>
          </div>
        </section>

        {/* What Is It */}
        <section className="rlt-section rlt-section-alt">
          <div className="rlt-container">
            <div className="rlt-animate">
              <div className="rlt-kicker">What Is It</div>
              <h2>Light that works at the cellular level.</h2>
              <div className="rlt-divider"></div>
              <p className="rlt-body-text">
                Red light therapy (also called photobiomodulation) uses specific wavelengths of red and near-infrared light to penetrate your skin and reach your cells. These wavelengths are absorbed by your mitochondria — the "power plants" inside your cells — which may help them produce more energy.
              </p>
              <p className="rlt-body-text" style={{ marginTop: '1rem' }}>
                Think of it like charging your cells' batteries. More cellular energy means your body may heal faster, recover better, and function more efficiently.
              </p>
            </div>

            <div className="rlt-stat-row">
              <div className="rlt-stat-item rlt-animate">
                <div className="rlt-stat-number">14,400</div>
                <div className="rlt-stat-label">Medical-grade LEDs<br />in our full-body bed</div>
              </div>
              <div className="rlt-stat-item rlt-animate">
                <div className="rlt-stat-number">660nm</div>
                <div className="rlt-stat-label">Red light wavelength<br />for skin & surface tissue</div>
              </div>
              <div className="rlt-stat-item rlt-animate">
                <div className="rlt-stat-number">850nm</div>
                <div className="rlt-stat-label">Near-infrared wavelength<br />for deep tissue penetration</div>
              </div>
            </div>
          </div>
        </section>

        {/* Device Photos */}
        <section className="rlt-section rlt-photos-section">
          <div className="rlt-container">
            <div className="rlt-photos-grid">
              <div className="rlt-photo-wrapper rlt-animate">
                <img
                  src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/6915ef9ab8272573cd5176df.jpeg"
                  alt="INNER Light LED Bed at Range Medical"
                />
              </div>
              <div className="rlt-photo-wrapper rlt-animate">
                <img
                  src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/69160cda039bdc6a28e019cd.jpeg"
                  alt="Red Light Therapy session at Range Medical"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Who Is It For */}
        <section className="rlt-section rlt-section-inverted">
          <div className="rlt-container">
            <div className="rlt-animate">
              <div className="rlt-kicker">Who It's For</div>
              <h2>For anyone looking to feel and function better.</h2>
              <div className="rlt-divider"></div>
              <p className="rlt-body-text">
                Red light therapy isn't just for athletes or biohackers. If any of these sound like you, it could be worth exploring.
              </p>
            </div>

            <div className="rlt-tags-grid rlt-animate">
              {tags.map((tag, i) => (
                <div key={i} className="rlt-tag-pill">{tag}</div>
              ))}
            </div>
          </div>
        </section>

        {/* How It May Help */}
        <section className="rlt-section">
          <div className="rlt-container">
            <div className="rlt-animate">
              <div className="rlt-kicker">How It May Help</div>
              <h2>Light that supports your whole body.</h2>
              <div className="rlt-divider"></div>
              <p className="rlt-body-text">
                Red and near-infrared light can reach different depths of tissue, which is why the benefits may be felt throughout your body. Here are the main ways it could help.
              </p>
            </div>

            <div className="rlt-benefits-grid">
              {benefits.map((benefit, i) => (
                <div key={i} className="rlt-benefit-card rlt-animate">
                  <div className="rlt-benefit-number">{benefit.number}</div>
                  <div className="rlt-benefit-title">{benefit.title}</div>
                  <div className="rlt-benefit-desc">{benefit.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Research Section */}
        <section className="rlt-section rlt-section-alt" id="rlt-research">
          <div className="rlt-container">
            <div className="rlt-animate">
              <div className="rlt-kicker">Backed by Science</div>
              <h2>What the Research Says</h2>
              <div className="rlt-divider"></div>
              <p className="rlt-body-text">
                Red light therapy has been studied extensively over the past few decades. Here's what the science shows.
              </p>
            </div>

            <div className="rlt-research-grid">
              {researchStudies.map((study, i) => (
                <div key={i} className="rlt-research-card rlt-animate">
                  <div className="rlt-research-category">{study.category}</div>
                  <h3 className="rlt-research-headline">{study.headline}</h3>
                  <p className="rlt-research-summary">{study.summary}</p>
                  <p className="rlt-research-source">{study.source}</p>
                </div>
              ))}
            </div>

            <p className="rlt-research-disclaimer rlt-animate">
              These studies reflect clinical research findings. Individual results may vary. Red light therapy at Range Medical is provided as a wellness service and is not intended to diagnose, treat, cure, or prevent any disease.
            </p>
          </div>
        </section>

        {/* Athletes */}
        <section className="rlt-section rlt-section-inverted">
          <div className="rlt-container">
            <div className="rlt-animate">
              <div className="rlt-kicker">Who Uses It</div>
              <h2>Trusted by elite performers.</h2>
              <div className="rlt-divider"></div>
              <p className="rlt-body-text">
                From NFL quarterbacks to Olympic swimmers, red light therapy has become a staple in elite recovery protocols. Here are some who've made it part of their routine.
              </p>
            </div>

            <div className="rlt-athletes-grid">
              {athletes.map((athlete, i) => (
                <div key={i} className="rlt-athlete-card rlt-animate">
                  <div className="rlt-athlete-icon">{athlete.icon}</div>
                  <div className="rlt-athlete-info">
                    <div className="rlt-athlete-name">{athlete.name}</div>
                    <div className="rlt-athlete-sport">{athlete.sport}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What to Expect */}
        <section className="rlt-section rlt-section-alt">
          <div className="rlt-container">
            <div className="rlt-animate">
              <div className="rlt-kicker">What to Expect</div>
              <h2>Your first session, step by step.</h2>
              <div className="rlt-divider"></div>
              <p className="rlt-body-text">
                It's simple, relaxing, and takes just 20 minutes. Here's exactly what happens.
              </p>
            </div>

            <div className="rlt-expect-list">
              {steps.map((item, i) => (
                <div key={i} className="rlt-expect-item rlt-animate">
                  <div className="rlt-expect-step">{item.step}</div>
                  <div className="rlt-expect-content">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="rlt-section rlt-section-inverted">
          <div className="rlt-container">
            <div className="rlt-animate">
              <div className="rlt-kicker">Common Questions</div>
              <h2>Everything you might be wondering.</h2>
              <div className="rlt-divider"></div>
            </div>

            <div className="rlt-faq-list">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className={`rlt-faq-item ${openFaq === i ? 'open' : ''}`}
                  onClick={() => toggleFaq(i)}
                >
                  <div className="rlt-faq-question">
                    {faq.question}
                    <span className="rlt-faq-toggle">+</span>
                  </div>
                  <div className="rlt-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="rlt-section rlt-section-inverted rlt-cta-section">
          <div className="rlt-container">
            <div className="rlt-animate">
              <div className="rlt-kicker" style={{ marginBottom: '1.5rem' }}>Next Steps</div>
              <h2 className="rlt-cta-title">Ready to try red light therapy?</h2>
              <p className="rlt-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                Whether you're looking to improve your skin, recover faster, or just feel more energized — we're here to help. Book a session or talk to our team.
              </p>
              <div className="rlt-cta-buttons">
                <Link href="/book" className="rlt-btn-primary">Book Your Assessment</Link>
                <div className="rlt-cta-or">or</div>
                <a href="tel:9499973988" className="rlt-cta-phone">(949) 997-3988</a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        /* ===== RLT PAGE SCOPED STYLES ===== */
        .rlt-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          overflow-x: hidden;
        }

        /* Animations */
        .rlt-animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        :global(.rlt-animate.visible) {
          opacity: 1;
          transform: translateY(0);
        }

        /* Container */
        .rlt-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Sections */
        .rlt-section {
          padding: 4rem 1.5rem;
        }

        .rlt-section-alt {
          background: #fafafa;
        }

        .rlt-section-inverted {
          background: #000000;
          color: #ffffff;
        }

        /* Kicker */
        .rlt-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1rem;
        }

        .rlt-section-inverted .rlt-kicker {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Headlines */
        .rlt-page h1 {
          font-size: 2.75rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #171717;
        }

        .rlt-page h2 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #171717;
          margin-bottom: 1rem;
        }

        .rlt-page h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        .rlt-section-inverted h1,
        .rlt-section-inverted h2,
        .rlt-section-inverted h3 {
          color: #ffffff;
        }

        /* Body Text */
        .rlt-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #525252;
          max-width: 600px;
        }

        .rlt-section-inverted .rlt-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider */
        .rlt-divider {
          width: 48px;
          height: 2px;
          background: #e5e5e5;
          margin: 1.25rem 0;
        }

        .rlt-section-inverted .rlt-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Buttons */
        .rlt-btn-primary {
          display: inline-block;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.875rem 2rem;
          background: #ffffff;
          color: #000000;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .rlt-btn-primary:hover {
          background: #e5e5e5;
          transform: translateY(-1px);
        }

        /* Hero */
        .rlt-hero {
          padding: 4rem 1.5rem 5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .rlt-hero h1 {
          max-width: 680px;
          margin-bottom: 1.5rem;
        }

        .rlt-hero .rlt-body-text {
          text-align: center;
          margin: 0 auto 2.5rem;
        }

        .rlt-hero-scroll {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-top: 2rem;
        }

        .rlt-hero-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: rlt-bounce 2s ease-in-out infinite;
        }

        @keyframes rlt-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* Stat Row */
        .rlt-stat-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .rlt-stat-item {
          text-align: center;
        }

        .rlt-stat-number {
          font-size: 2.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #171717;
        }

        .rlt-stat-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #737373;
          line-height: 1.5;
        }

        /* Tags */
        .rlt-tags-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
          margin-top: 2rem;
        }

        .rlt-tag-pill {
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.2s ease;
        }

        .rlt-tag-pill:hover {
          border-color: rgba(255, 255, 255, 0.25);
        }

        /* Device Photos */
        .rlt-photos-section {
          background: #ffffff;
        }

        .rlt-photos-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .rlt-photo-wrapper {
          overflow: hidden;
          border-radius: 12px;
        }

        .rlt-photo-wrapper img {
          width: 100%;
          height: auto;
          border-radius: 12px;
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        .rlt-photo-wrapper:hover img {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        /* Benefit Cards */
        .rlt-benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .rlt-benefit-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .rlt-benefit-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .rlt-benefit-number {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-bottom: 1rem;
        }

        .rlt-benefit-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
        }

        .rlt-benefit-desc {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
        }

        /* Research Cards */
        .rlt-research-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .rlt-research-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .rlt-research-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .rlt-research-category {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #dc2626;
          margin-bottom: 0.875rem;
        }

        .rlt-research-headline {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .rlt-research-summary {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
          margin-bottom: 1rem;
        }

        .rlt-research-source {
          font-size: 0.8125rem;
          font-style: italic;
          color: #737373;
        }

        .rlt-research-disclaimer {
          font-size: 0.8125rem;
          color: #737373;
          text-align: center;
          max-width: 700px;
          margin: 3rem auto 0;
          line-height: 1.7;
        }

        /* Athlete Cards - Left Aligned */
        .rlt-athletes-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-top: 2.5rem;
        }

        .rlt-athlete-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: border-color 0.2s ease;
        }

        .rlt-athlete-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }

        .rlt-athlete-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .rlt-athlete-info {
          text-align: left;
        }

        .rlt-athlete-name {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.125rem;
        }

        .rlt-athlete-sport {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.02em;
        }

        /* Expect List */
        .rlt-expect-list {
          margin-top: 2.5rem;
        }

        .rlt-expect-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #e5e5e5;
          align-items: flex-start;
        }

        .rlt-expect-item:last-child {
          border-bottom: none;
        }

        .rlt-expect-step {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #737373;
          min-width: 56px;
          letter-spacing: 0.02em;
        }

        .rlt-expect-content h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .rlt-expect-content p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.7;
        }

        /* FAQ */
        .rlt-faq-list {
          margin-top: 2.5rem;
        }

        .rlt-faq-item {
          padding: 1.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          cursor: pointer;
        }

        .rlt-faq-item:last-child {
          border-bottom: none;
        }

        .rlt-faq-question {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .rlt-faq-toggle {
          font-size: 1.25rem;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.3);
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }

        .rlt-faq-item.open .rlt-faq-toggle {
          transform: rotate(45deg);
        }

        .rlt-faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease, padding 0.4s ease;
        }

        .rlt-faq-item.open .rlt-faq-answer {
          max-height: 300px;
          padding-top: 1rem;
          opacity: 1;
        }

        .rlt-faq-answer p {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.8;
        }

        .rlt-faq-item.open .rlt-faq-question {
          color: #ffffff;
        }

        /* CTA Section */
        .rlt-cta-section {
          padding: 6rem 1.5rem;
          text-align: center;
        }

        .rlt-cta-title {
          font-size: 2.75rem;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }

        .rlt-cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .rlt-cta-or {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.25);
        }

        .rlt-cta-phone {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 2px;
          transition: border-color 0.2s ease;
        }

        .rlt-cta-phone:hover {
          border-color: rgba(255, 255, 255, 0.6);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .rlt-section {
            padding: 3rem 1.5rem;
          }

          .rlt-page h1 {
            font-size: 2rem;
          }

          .rlt-page h2 {
            font-size: 1.5rem;
          }

          .rlt-hero {
            padding: 3rem 1.5rem;
          }

          .rlt-stat-row {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .rlt-photos-grid {
            grid-template-columns: 1fr;
          }

          .rlt-benefits-grid {
            grid-template-columns: 1fr;
          }

          .rlt-research-grid {
            grid-template-columns: 1fr;
          }

          .rlt-athletes-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .rlt-expect-item {
            flex-direction: column;
            gap: 0.5rem;
          }

          .rlt-cta-title {
            font-size: 2rem;
          }

          .rlt-cta-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </Layout>
  );
}
