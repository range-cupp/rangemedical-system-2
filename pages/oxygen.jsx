// pages/oxygen.jsx
// Hyperbaric Oxygen Therapy Landing Page - Instagram Funnel
// Range Medical - Standalone page (not in main nav)

import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function OxygenLanding() {
  const [openFaq, setOpenFaq] = useState(null);
  const animatedElements = useRef([]);

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

    const elements = document.querySelectorAll('.animate');
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
      question: "Is it safe?",
      answer: "Yes. Hyperbaric oxygen therapy has been studied for decades and is recognized by the FDA. Side effects are rare and usually mild — like a temporary popping feeling in your ears. Our team monitors you throughout the entire session."
    },
    {
      question: "Does it hurt?",
      answer: "Not at all. Most people find it very relaxing. The only thing you might notice is some pressure in your ears as the chamber fills — similar to what you'd feel on a plane. It goes away quickly."
    },
    {
      question: "How many sessions do I need?",
      answer: "It depends on what you're looking for. Some people feel a difference after just one session. For ongoing benefits like injury recovery or reduced inflammation, most people do multiple sessions over a few weeks. Our team will help you figure out what's right for you."
    },
    {
      question: "How long is a session?",
      answer: "A typical session is about 60 to 90 minutes. You can relax, read, listen to music, or rest during that time."
    },
    {
      question: "Who should not use it?",
      answer: "HBOT isn't recommended for people who are pregnant or those with certain lung conditions. If you're unsure, our team can help determine if it's a good fit for you before your first session."
    },
    {
      question: "What should I wear?",
      answer: "Comfortable, loose-fitting clothes are ideal. Avoid wearing anything with metal or synthetic materials. Our team will give you guidance before your first visit."
    }
  ];

  const benefits = [
    { number: "01", title: "Injury Recovery", desc: "When you're hurt, your body needs extra oxygen to fix itself. HBOT floods your tissues with oxygen, which may help speed up the healing process." },
    { number: "02", title: "More Energy", desc: "Your cells need oxygen to make energy. More oxygen may mean your cells can work harder and produce more fuel — leaving you feeling more alert and less tired." },
    { number: "03", title: "Workout Recovery", desc: "After a tough workout, your muscles are tired and swollen. Extra oxygen may help calm that down and get you ready for your next session sooner." },
    { number: "04", title: "Less Inflammation", desc: "Research suggests HBOT may help reduce swelling and support your body's natural response to inflammation — helping you feel better, faster." },
    { number: "05", title: "Better Blood Flow", desc: "HBOT may help improve circulation, meaning fresh oxygen and nutrients get to your muscles faster and waste gets cleared out quicker." },
    { number: "06", title: "Tissue Repair", desc: "The extra oxygen may help your body grow new blood vessels and repair damaged tissue — important for anyone healing from surgery or an injury." }
  ];

  const athletes = [
    { icon: "🏀", name: "LeBron James", sport: "NBA · Los Angeles Lakers" },
    { icon: "🏊", name: "Michael Phelps", sport: "Olympic Swimming · 23 Gold Medals" },
    { icon: "⛳", name: "Tiger Woods", sport: "PGA Golf" },
    { icon: "⚽", name: "Cristiano Ronaldo", sport: "Professional Soccer" },
    { icon: "🏈", name: "NFL Teams", sport: "Multiple franchises use HBOT" },
    { icon: "🎖️", name: "U.S. Military", sport: "Navy SEALs & Special Operations" }
  ];

  const tags = [
    "Healing From an Injury",
    "Sore After Workouts",
    "Low on Energy",
    "Dealing With Pain",
    "Recovering From Surgery",
    "Swelling or Inflammation",
    "Wanting Better Sleep",
    "Looking for Faster Recovery"
  ];

  const steps = [
    { step: "Step 1", title: "Arrive & get comfortable", desc: "You'll sit down in our pressurized chamber. Wear comfortable clothes — that's it. No special prep needed." },
    { step: "Step 2", title: "The chamber pressurizes", desc: "The air pressure slowly increases to 2.0 atmospheres. You might feel a slight pop in your ears — like being on an airplane. This is normal." },
    { step: "Step 3", title: "Breathe & relax", desc: "Once the pressure is set, you just sit back and breathe normally. Many people read, listen to music, or even take a nap. Sessions are usually 60–90 minutes." },
    { step: "Step 4", title: "You're done", desc: "The pressure slowly comes back to normal. You can go about your day right after — no recovery time needed. Many people say they feel more energized." }
  ];

  const researchStudies = [
    {
      category: "PERFORMANCE",
      headline: "Improved VO2 Max and Endurance in Athletes",
      summary: "A double-blind, randomized controlled trial found that athletes who used hyperbaric oxygen therapy showed a significant increase in VO2 max — one of the most important markers of athletic fitness. Researchers also saw improvements in power output and anaerobic threshold compared to the placebo group.",
      source: "Sports Medicine – Open, 2022"
    },
    {
      category: "CELLULAR ENERGY",
      headline: "Increased Mitochondrial Mass and Respiration",
      summary: "The same clinical trial used muscle biopsies and found that repeated HBOT sessions led to a significant increase in mitochondrial mass — the \"power plants\" inside your cells. This suggests the body may be creating more energy-producing machinery at a cellular level.",
      source: "Sports Medicine – Open, 2022"
    },
    {
      category: "HEALING & RECOVERY",
      headline: "Faster Wound Healing in Clinical Patients",
      summary: "In a study of 40 patients with complex, non-healing wounds, 77.5% fully healed after a series of hyperbaric oxygen sessions. Researchers saw an average wound size reduction of nearly 30% after just five treatments.",
      source: "Journal of the American College of Clinical Wound Specialists, 2015"
    },
    {
      category: "INFLAMMATION",
      headline: "Reduced Inflammatory Markers",
      summary: "A systematic review of human studies found that hyperbaric oxygen therapy may reduce concentrations of pro-inflammatory proteins and cytokines while increasing growth factors that support tissue repair and new blood vessel formation.",
      source: "Biomolecules (MDPI), 2021"
    },
    {
      category: "CIRCULATION",
      headline: "8× Increase in Circulating Stem Cells",
      summary: "A study published in the American Journal of Physiology found that a single HBOT session doubled circulating stem cells, and over 20 sessions, levels increased eightfold. These cells play a key role in repairing damaged tissue and forming new blood vessels.",
      source: "American Journal of Physiology – Heart and Circulatory Physiology, 2006"
    },
    {
      category: "BRAIN HEALTH",
      headline: "Cognitive Improvements After Brain Injury",
      summary: "A randomized controlled trial showed that 40 sessions of HBOT produced significant improvements in memory, cognitive function, sleep quality, and quality of life in patients with persistent post-concussion symptoms — with benefits lasting at least two months after treatment ended.",
      source: "Medical Gas Research, 2020"
    }
  ];

  return (
    <>
      <Head>
        <title>Hyperbaric Oxygen Therapy Guide | Range Medical</title>
        <meta name="description" content="Learn how hyperbaric oxygen therapy may support injury recovery, energy, and healing. Used by pro athletes and top medical centers. Available at Range Medical." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph */}
        <meta property="og:title" content="Hyperbaric Oxygen Therapy Guide | Range Medical" />
        <meta property="og:description" content="Learn how hyperbaric oxygen therapy may support injury recovery, energy, and healing. Used by pro athletes and top medical centers." />
        <meta property="og:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" />
        <meta property="og:url" content="https://www.range-medical.com/oxygen" />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Hyperbaric Oxygen Therapy Guide | Range Medical" />
        <meta name="twitter:description" content="Learn how hyperbaric oxygen therapy may support injury recovery, energy, and healing." />
        <meta name="twitter:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" />
      </Head>

      <div className="oxygen-page">
        {/* Hero */}
        <section className="hero">
          <div className="hero-logo">
            <img src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" alt="Range Medical" />
          </div>
          <div className="kicker">Recovery · Energy · Healing</div>
          <h1>Your Guide to Hyperbaric Oxygen Therapy</h1>
          <p className="body-text">Everything you need to know about the recovery tool used by pro athletes, the military, and top medical centers — explained simply.</p>
          <div className="hero-scroll">
            Scroll to explore
            <span>↓</span>
          </div>
        </section>

        {/* What Is It */}
        <section className="section section-alt">
          <div className="container">
            <div className="animate">
              <div className="kicker">What Is It</div>
              <h2>A simple idea with powerful results.</h2>
              <div className="divider"></div>
              <p className="body-text">
                Hyperbaric oxygen therapy (HBOT) is when you sit inside a special chamber and breathe in pure oxygen. The air pressure inside is raised to about twice the normal level. This pushes more oxygen into your blood — so it can reach the parts of your body that need healing the most.
              </p>
              <p className="body-text" style={{ marginTop: '1rem' }}>
                Think of it this way: your body already uses oxygen to heal itself. HBOT just gives it a lot more to work with.
              </p>
            </div>

            <div className="stat-row">
              <div className="stat-item animate">
                <div className="stat-number">2.0</div>
                <div className="stat-label">Atmospheres of pressure<br />in our sit-down chamber</div>
              </div>
              <div className="stat-item animate">
                <div className="stat-number">2–3×</div>
                <div className="stat-label">More oxygen delivered<br />to your body's tissues</div>
              </div>
              <div className="stat-item animate">
                <div className="stat-number">100%</div>
                <div className="stat-label">Pure oxygen breathed<br />during each session</div>
              </div>
            </div>
          </div>
        </section>

        {/* Who Is It For */}
        <section className="section section-inverted">
          <div className="container">
            <div className="animate">
              <div className="kicker">Who It's For</div>
              <h2>You don't have to be a pro athlete.</h2>
              <div className="divider"></div>
              <p className="body-text">
                If any of these sound like you, hyperbaric oxygen therapy could be worth exploring. It's for everyday people who want to give their body a little extra help.
              </p>
            </div>

            <div className="tags-grid animate">
              {tags.map((tag, i) => (
                <div key={i} className="tag-pill">{tag}</div>
              ))}
            </div>
          </div>
        </section>

        {/* How It May Help */}
        <section className="section">
          <div className="container">
            <div className="animate">
              <div className="kicker">How It May Help</div>
              <h2>More oxygen. Better healing.</h2>
              <div className="divider"></div>
              <p className="body-text">
                When your body gets more oxygen than usual, a lot of good things may start to happen. Here are the main ways HBOT could support your body.
              </p>
            </div>

            <div className="benefits-grid">
              {benefits.map((benefit, i) => (
                <div key={i} className="benefit-card animate">
                  <div className="benefit-number">{benefit.number}</div>
                  <div className="benefit-title">{benefit.title}</div>
                  <div className="benefit-desc">{benefit.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Research Section */}
        <section className="section section-alt" id="research-section">
          <div className="container">
            <div className="animate">
              <div className="kicker">Backed by Science</div>
              <h2>What the Research Says</h2>
              <div className="divider"></div>
              <p className="body-text">
                Hyperbaric oxygen therapy isn't new — it's been studied for decades. Here's what researchers have found.
              </p>
            </div>

            <div className="research-grid">
              {researchStudies.map((study, i) => (
                <div key={i} className="research-card animate">
                  <div className="research-category">{study.category}</div>
                  <h3 className="research-headline">{study.headline}</h3>
                  <p className="research-summary">{study.summary}</p>
                  <p className="research-source">{study.source}</p>
                </div>
              ))}
            </div>

            <p className="research-disclaimer animate">
              These studies reflect clinical research findings. Individual results may vary. Hyperbaric oxygen therapy at Range Medical is provided under medical supervision and is not a substitute for professional medical advice.
            </p>
          </div>
        </section>

        {/* Athletes */}
        <section className="section section-inverted">
          <div className="container">
            <div className="animate">
              <div className="kicker">Who Uses It</div>
              <h2>Trusted by the best in the world.</h2>
              <div className="divider"></div>
              <p className="body-text">
                Some of the biggest names in sports and the military use hyperbaric oxygen therapy as part of their recovery. Here are a few you might know.
              </p>
            </div>

            <div className="athletes-grid">
              {athletes.map((athlete, i) => (
                <div key={i} className="athlete-card animate">
                  <div className="athlete-icon">{athlete.icon}</div>
                  <div className="athlete-name">{athlete.name}</div>
                  <div className="athlete-sport">{athlete.sport}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What to Expect */}
        <section className="section section-alt">
          <div className="container">
            <div className="animate">
              <div className="kicker">What to Expect</div>
              <h2>Your first session, step by step.</h2>
              <div className="divider"></div>
              <p className="body-text">
                It's easier than you think. There's nothing to be nervous about — most people say it's actually relaxing.
              </p>
            </div>

            <div className="expect-list">
              {steps.map((item, i) => (
                <div key={i} className="expect-item animate">
                  <div className="expect-step">{item.step}</div>
                  <div className="expect-content">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section-alt">
          <div className="container">
            <span className="section-label">Questions</span>
            <h2>Common Questions</h2>

            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`faq-item ${openFaq === index ? 'faq-open' : ''}`}>
                  <button className="faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={openFaq === index ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                    </svg>
                  </button>
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section section-inverted cta-section">
          <div className="container">
            <div className="animate">
              <div className="kicker" style={{ marginBottom: '1.5rem' }}>Next Steps</div>
              <h2 className="cta-title">Ready to learn more?</h2>
              <p className="body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                If you have questions or want to find out if hyperbaric oxygen therapy is right for you, we're here to help. No pressure — just the information you need.
              </p>
              <div className="cta-buttons">
                <Link href="/book" className="btn-primary">Book Your Assessment</Link>
                <div className="cta-or">or</div>
                <a href="tel:9499973988" className="cta-phone">(949) 997-3988</a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-logo">
            <img src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" alt="Range Medical" />
          </div>
          <p>© 2026 Range Medical. All information provided is for educational purposes only. Hyperbaric oxygen therapy results may vary. Always consult with a healthcare professional.</p>
        </footer>
      </div>

      <style jsx>{`
        .oxygen-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          overflow-x: hidden;
        }

        /* Animations */
        .animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        :global(.animate.visible) {
          opacity: 1;
          transform: translateY(0);
        }

        /* Container */
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Sections */
        .section {
          padding: 4rem 1.5rem;
        }

        .section-alt {
          background: #fafafa;
          padding: 5rem 1.5rem;
        }

        .section-label {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.75rem;
        }

        .section-inverted {
          background: #000000;
          color: #ffffff;
        }

        /* Kicker */
        .kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1rem;
        }

        .section-inverted .kicker {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Headlines */
        h1 {
          font-size: 2.75rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #171717;
        }

        h2 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #171717;
          margin-bottom: 1rem;
        }

        h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        .section-inverted h1,
        .section-inverted h2,
        .section-inverted h3 {
          color: #ffffff;
        }

        /* Body Text */
        .body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #525252;
          max-width: 600px;
        }

        .section-inverted .body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider */
        .divider {
          width: 48px;
          height: 2px;
          background: #e5e5e5;
          margin: 1.25rem 0;
        }

        .section-inverted .divider {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Buttons */
        .btn-primary {
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

        .btn-primary:hover {
          background: #e5e5e5;
          transform: translateY(-1px);
        }

        /* Hero */
        .hero {
          padding: 6rem 1.5rem 5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hero-logo {
          margin-bottom: 3rem;
        }

        .hero-logo img {
          height: 135px;
          width: auto;
        }

        .hero h1 {
          max-width: 680px;
          margin-bottom: 1.5rem;
        }

        .hero .body-text {
          text-align: center;
          margin: 0 auto 2.5rem;
        }

        .hero-scroll {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-top: 2rem;
        }

        .hero-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* Stat Row */
        .stat-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-size: 2.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #171717;
        }

        .stat-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #737373;
          line-height: 1.5;
        }

        /* Tags */
        .tags-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
          margin-top: 2rem;
        }

        .tag-pill {
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.2s ease;
        }

        .tag-pill:hover {
          border-color: rgba(255, 255, 255, 0.25);
        }

        /* Benefit Cards */
        .benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .benefit-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .benefit-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .benefit-number {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-bottom: 1rem;
        }

        .benefit-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
        }

        .benefit-desc {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
        }

        /* Research Cards */
        .research-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .research-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .research-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .research-category {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #0d9488;
          margin-bottom: 0.875rem;
        }

        .research-headline {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .research-summary {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
          margin-bottom: 1rem;
        }

        .research-source {
          font-size: 0.8125rem;
          font-style: italic;
          color: #737373;
        }

        .research-disclaimer {
          font-size: 0.8125rem;
          color: #737373;
          text-align: center;
          max-width: 700px;
          margin: 3rem auto 0;
          line-height: 1.7;
        }

        /* Athlete Cards */
        .athletes-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .athlete-card {
          padding: 2rem 1.75rem;
          border-radius: 12px;
          text-align: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: border-color 0.2s ease;
        }

        .athlete-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }

        .athlete-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          margin: 0 auto 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }

        .athlete-name {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.25rem;
        }

        .athlete-sport {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.02em;
        }

        /* Expect List */
        .expect-list {
          margin-top: 2.5rem;
        }

        .expect-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #e5e5e5;
          align-items: flex-start;
        }

        .expect-item:last-child {
          border-bottom: none;
        }

        .expect-step {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #737373;
          min-width: 56px;
          letter-spacing: 0.02em;
        }

        .expect-content h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .expect-content p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.7;
        }

        /* FAQ */
        .faq-list {
          max-width: 700px;
          margin: 0 auto;
        }

        .faq-item {
          border-bottom: 1px solid #e5e5e5;
        }

        .faq-item:last-child {
          border-bottom: none;
        }

        .faq-question {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 0;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
        }

        .faq-question span {
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
          padding-right: 1rem;
        }

        .faq-question svg {
          flex-shrink: 0;
          color: #737373;
          transition: transform 0.2s;
        }

        .faq-open .faq-question svg {
          transform: rotate(180deg);
        }

        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }

        .faq-open .faq-answer {
          max-height: 300px;
          padding-bottom: 1.25rem;
        }

        .faq-answer p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin: 0;
        }

        /* CTA Section */
        .cta-section {
          padding: 6rem 1.5rem;
          text-align: center;
        }

        .cta-title {
          font-size: 2.75rem;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .cta-or {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.25);
        }

        .cta-phone {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 2px;
          transition: border-color 0.2s ease;
        }

        .cta-phone:hover {
          border-color: rgba(255, 255, 255, 0.6);
        }

        /* Footer */
        .footer {
          padding: 2.5rem 1.5rem;
          text-align: center;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          background: #000000;
        }

        .footer-logo {
          margin-bottom: 1rem;
        }

        .footer-logo img {
          height: 40px;
          width: auto;
          filter: brightness(0) invert(1);
        }

        .footer p {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.3);
          line-height: 1.6;
          max-width: 500px;
          margin: 0 auto;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .section {
            padding: 3rem 1.5rem;
          }

          h1 {
            font-size: 2rem;
          }

          h2 {
            font-size: 1.5rem;
          }

          .hero {
            padding: 4rem 1.5rem 3rem;
          }

          .hero-logo img {
            height: 90px;
          }

          .stat-row {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .benefits-grid {
            grid-template-columns: 1fr;
          }

          .research-grid {
            grid-template-columns: 1fr;
          }

          .athletes-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .expect-item {
            flex-direction: column;
            gap: 0.5rem;
          }

          .cta-title {
            font-size: 2rem;
          }

          .cta-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
