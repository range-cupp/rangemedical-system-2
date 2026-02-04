// pages/hyperbaric-oxygen-therapy.jsx
// Hyperbaric Oxygen Therapy - Full service page with site nav/footer

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import ResearchModal from '../components/ResearchModal';
import { getStudiesByService } from '../data/researchStudies';

export default function HyperbaricOxygenTherapy() {
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const studies = getStudiesByService('hyperbaric-oxygen-therapy');

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

    const elements = document.querySelectorAll('.hbot-page .hbot-animate');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleResearchClick = (studyId) => {
    const study = studies.find(s => s.id === studyId);
    if (study) {
      setSelectedStudy(study);
      setIsModalOpen(true);
    }
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

  
  return (
    <Layout
      title="Hyperbaric Oxygen Therapy (HBOT) | Newport Beach | Range Medical"
      description="Learn how hyperbaric oxygen therapy may support injury recovery, energy, and healing. Used by pro athletes and top medical centers. Available at Range Medical in Newport Beach."
    >
      <Head>
        {/* Basic Meta Tags */}
        <meta name="keywords" content="hyperbaric oxygen therapy Newport Beach, HBOT Orange County, oxygen therapy, injury recovery, athletic recovery, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/hyperbaric-oxygen-therapy" />

        {/* Open Graph */}
        <meta property="og:title" content="Hyperbaric Oxygen Therapy (HBOT) | Newport Beach | Range Medical" />
        <meta property="og:description" content="Pressurized oxygen therapy for injury recovery, energy, and healing. Used by pro athletes. Available at Range Medical in Newport Beach." />
        <meta property="og:url" content="https://www.range-medical.com/hyperbaric-oxygen-therapy" />
        <meta property="og:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/697fbd4f1f68d10a92caef4d.jpeg" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Hyperbaric Oxygen Therapy (HBOT) | Newport Beach | Range Medical" />
        <meta name="twitter:description" content="Pressurized oxygen therapy for injury recovery, energy, and healing. Used by pro athletes. Newport Beach." />
        <meta name="twitter:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/697fbd4f1f68d10a92caef4d.jpeg" />

        {/* Geo Tags */}
        <meta name="geo.region" content="US-CA" />
        <meta name="geo.placename" content="Newport Beach" />
        <meta name="geo.position" content="33.6189;-117.9298" />
        <meta name="ICBM" content="33.6189, -117.9298" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "MedicalBusiness",
                "name": "Range Medical",
                "url": "https://www.range-medical.com",
                "telephone": "(949) 997-3988",
                "image": "https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png",
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
                "areaServed": [
                  { "@type": "City", "name": "Newport Beach" },
                  { "@type": "City", "name": "Costa Mesa" },
                  { "@type": "City", "name": "Irvine" },
                  { "@type": "City", "name": "Huntington Beach" },
                  { "@type": "City", "name": "Laguna Beach" },
                  { "@type": "City", "name": "Corona del Mar" },
                  { "@type": "AdministrativeArea", "name": "Orange County" }
                ],
                "priceRange": "$",
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "5.0",
                  "reviewCount": "90",
                  "bestRating": "5"
                },
                "openingHoursSpecification": {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  "opens": "09:00",
                  "closes": "17:00"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "MedicalTherapy",
                "name": "Hyperbaric Oxygen Therapy",
                "alternateName": "HBOT",
                "description": "Hyperbaric oxygen therapy using a pressurized chamber at 2.0 atmospheres, delivering 2-3x more oxygen to body tissues for injury recovery, energy, and healing.",
                "url": "https://www.range-medical.com/hyperbaric-oxygen-therapy",
                "provider": {
                  "@type": "MedicalBusiness",
                  "name": "Range Medical",
                  "url": "https://www.range-medical.com"
                },
                "areaServed": {
                  "@type": "City",
                  "name": "Newport Beach, CA"
                }
              },
              {
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
              }
            ])
          }}
        />
      </Head>

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

      <div className="hbot-page">
        {/* Hero */}
        <section className="hbot-hero">
          <div className="hbot-kicker">Recovery · Energy · Healing</div>
          <h1>Your Guide to Hyperbaric Oxygen Therapy</h1>
          <p className="hbot-body-text">Everything you need to know about the recovery tool used by pro athletes, the military, and top medical centers — explained simply.</p>
          <div className="hbot-hero-scroll">
            Scroll to explore
            <span>↓</span>
          </div>
        </section>

        {/* What Is It */}
        <section className="hbot-section hbot-section-alt">
          <div className="hbot-container">
            <div className="hbot-animate">
              <div className="hbot-kicker">What Is It</div>
              <h2>A simple idea with powerful results.</h2>
              <div className="hbot-divider"></div>
              <p className="hbot-body-text">
                Hyperbaric oxygen therapy (HBOT) is when you sit inside a special chamber and breathe in concentrated oxygen. The air pressure inside is raised to about twice the normal level. This pushes more oxygen into your blood — so it can reach the parts of your body that need healing the most.
              </p>
              <p className="hbot-body-text" style={{ marginTop: '1rem' }}>
                Think of it this way: your body already uses oxygen to heal itself. HBOT just gives it a lot more to work with. At Range Medical in Newport Beach, we offer one of Orange County's most advanced hyperbaric chambers.
              </p>
            </div>

            <div className="hbot-stat-row">
              <div className="hbot-stat-item hbot-animate">
                <div className="hbot-stat-number">2.0</div>
                <div className="hbot-stat-label">Atmospheres of pressure<br />in our sit-down chamber</div>
              </div>
              <div className="hbot-stat-item hbot-animate">
                <div className="hbot-stat-number">2–3×</div>
                <div className="hbot-stat-label">More oxygen delivered<br />to your body's tissues</div>
              </div>
              <div className="hbot-stat-item hbot-animate">
                <div className="hbot-stat-number">95%+</div>
                <div className="hbot-stat-label">Concentrated oxygen breathed<br />during each session</div>
              </div>
            </div>
          </div>
        </section>

        {/* Chamber Photos */}
        <section className="hbot-section hbot-photos-section">
          <div className="hbot-container">
            <div className="hbot-photos-grid">
              <div className="hbot-photo-wrapper hbot-animate">
                <img
                  src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/697fbd4f1f68d10a92caef4d.jpeg"
                  alt="Hyperbaric oxygen chamber at Range Medical"
                />
              </div>
              <div className="hbot-photo-wrapper hbot-animate">
                <img
                  src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/697fbd4f1f68d11e2acaef4e.jpeg"
                  alt="Hyperbaric oxygen chamber at Range Medical"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Who Is It For */}
        <section className="hbot-section hbot-section-inverted">
          <div className="hbot-container">
            <div className="hbot-animate">
              <div className="hbot-kicker">Who It's For</div>
              <h2>You don't have to be a pro athlete.</h2>
              <div className="hbot-divider"></div>
              <p className="hbot-body-text">
                If any of these sound like you, hyperbaric oxygen therapy could be worth exploring at our Newport Beach clinic. It's for everyday people who want to give their body a little extra help.
              </p>
            </div>

            <div className="hbot-tags-grid hbot-animate">
              {tags.map((tag, i) => (
                <div key={i} className="hbot-tag-pill">{tag}</div>
              ))}
            </div>
          </div>
        </section>

        {/* How It May Help */}
        <section className="hbot-section">
          <div className="hbot-container">
            <div className="hbot-animate">
              <div className="hbot-kicker">How It May Help</div>
              <h2>More oxygen. Better healing.</h2>
              <div className="hbot-divider"></div>
              <p className="hbot-body-text">
                When your body gets more oxygen than usual, a lot of good things may start to happen. Here are the main ways HBOT could support your body.
              </p>
            </div>

            <div className="hbot-benefits-grid">
              {benefits.map((benefit, i) => (
                <div key={i} className="hbot-benefit-card hbot-animate">
                  <div className="hbot-benefit-number">{benefit.number}</div>
                  <div className="hbot-benefit-title">{benefit.title}</div>
                  <div className="hbot-benefit-desc">{benefit.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Research Section */}
        <section className="hbot-section hbot-section-alt" id="hbot-research">
          <div className="hbot-container">
            <div className="hbot-animate">
              <div className="hbot-kicker">Backed by Science</div>
              <h2>Evidence-Based Results</h2>
              <div className="hbot-divider"></div>
              <p className="hbot-body-text">
                We've summarized the peer-reviewed research. Click any study to get the full breakdown — free.
              </p>
            </div>

            <div className="hbot-research-grid">
              {studies.map((study) => (
                <div
                  key={study.id}
                  className="hbot-research-card hbot-animate"
                  onClick={() => handleResearchClick(study.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="hbot-research-category">{study.category}</div>
                  <h3 className="hbot-research-headline">{study.headline}</h3>
                  <p className="hbot-research-summary">{study.summary}</p>
                  <p className="hbot-research-source">{study.sourceJournal}, {study.sourceYear}</p>
                </div>
              ))}
            </div>

            <p className="hbot-research-disclaimer hbot-animate">
              These studies reflect clinical research findings. Individual results may vary. Hyperbaric oxygen therapy at Range Medical is provided under medical supervision and is not a substitute for professional medical advice.
            </p>
          </div>
        </section>

        {/* Athletes */}
        <section className="hbot-section hbot-section-inverted">
          <div className="hbot-container">
            <div className="hbot-animate">
              <div className="hbot-kicker">Who Uses It</div>
              <h2>Trusted by the best in the world.</h2>
              <div className="hbot-divider"></div>
              <p className="hbot-body-text">
                Some of the biggest names in sports and the military use hyperbaric oxygen therapy as part of their recovery. Here are a few you might know.
              </p>
            </div>

            <div className="hbot-athletes-grid">
              {athletes.map((athlete, i) => (
                <div key={i} className="hbot-athlete-card hbot-animate">
                  <div className="hbot-athlete-icon">{athlete.icon}</div>
                  <div className="hbot-athlete-name">{athlete.name}</div>
                  <div className="hbot-athlete-sport">{athlete.sport}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What to Expect */}
        <section className="hbot-section hbot-section-alt">
          <div className="hbot-container">
            <div className="hbot-animate">
              <div className="hbot-kicker">What to Expect</div>
              <h2>Your first session, step by step.</h2>
              <div className="hbot-divider"></div>
              <p className="hbot-body-text">
                It's easier than you think. There's nothing to be nervous about — most people say it's actually relaxing.
              </p>
            </div>

            <div className="hbot-expect-list">
              {steps.map((item, i) => (
                <div key={i} className="hbot-expect-item hbot-animate">
                  <div className="hbot-expect-step">{item.step}</div>
                  <div className="hbot-expect-content">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="hbot-section-alt">
          <div className="hbot-container">
            <span className="hbot-section-label">Questions</span>
            <h2>Common Questions</h2>

            <div className="hbot-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`hbot-faq-item ${openFaq === index ? 'hbot-faq-open' : ''}`}>
                  <button className="hbot-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={openFaq === index ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                    </svg>
                  </button>
                  <div className="hbot-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="hbot-section hbot-section-inverted hbot-cta-section">
          <div className="hbot-container">
            <div className="hbot-animate">
              <div className="hbot-kicker" style={{ marginBottom: '1.5rem' }}>Next Steps</div>
              <h2 className="hbot-cta-title">Ready to learn more?</h2>
              <p className="hbot-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                If you have questions or want to find out if hyperbaric oxygen therapy is right for you, our Newport Beach team is here to help. No pressure — just the information you need.
              </p>
              <div className="hbot-cta-buttons">
                <Link href="/range-assessment" className="hbot-btn-primary">Book Your Assessment</Link>
                <div className="hbot-cta-or">or</div>
                <a href="tel:9499973988" className="hbot-cta-phone">(949) 997-3988</a>
              </div>
            </div>
          </div>
        </section>

        <ResearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          study={selectedStudy}
          servicePage="hyperbaric-oxygen-therapy"
        />
      </div>

      <style jsx>{`
        /* ===== HBOT PAGE SCOPED STYLES ===== */
        .hbot-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          overflow-x: hidden;
        }

        /* Animations */
        .hbot-animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        :global(.hbot-animate.visible) {
          opacity: 1;
          transform: translateY(0);
        }

        /* Container */
        .hbot-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Sections */
        .hbot-section {
          padding: 4rem 1.5rem;
        }

        .hbot-section-alt {
          background: #fafafa;
          padding: 5rem 1.5rem;
        }

        .hbot-section-label {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.75rem;
        }

        .hbot-section-inverted {
          background: #000000;
          color: #ffffff;
        }

        /* Kicker */
        .hbot-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1rem;
        }

        .hbot-section-inverted .hbot-kicker {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Headlines */
        .hbot-page h1 {
          font-size: 2.75rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #171717;
        }

        .hbot-page h2 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #171717;
          margin-bottom: 1rem;
        }

        .hbot-page h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        .hbot-section-inverted h1,
        .hbot-section-inverted h2,
        .hbot-section-inverted h3 {
          color: #ffffff;
        }

        /* Body Text */
        .hbot-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #525252;
          max-width: 600px;
        }

        .hbot-section-inverted .hbot-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider */
        .hbot-divider {
          width: 48px;
          height: 2px;
          background: #e5e5e5;
          margin: 1.25rem 0;
        }

        .hbot-section-inverted .hbot-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Buttons */
        .hbot-btn-primary {
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

        .hbot-btn-primary:hover {
          background: #e5e5e5;
          transform: translateY(-1px);
        }

        /* Hero */
        .hbot-hero {
          padding: 4rem 1.5rem 5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hbot-hero h1 {
          max-width: 680px;
          margin-bottom: 1.5rem;
        }

        .hbot-hero .hbot-body-text {
          text-align: center;
          margin: 0 auto 2.5rem;
        }

        .hbot-hero-scroll {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-top: 2rem;
        }

        .hbot-hero-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: hbot-bounce 2s ease-in-out infinite;
        }

        @keyframes hbot-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* Stat Row */
        .hbot-stat-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .hbot-stat-item {
          text-align: center;
        }

        .hbot-stat-number {
          font-size: 2.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #171717;
        }

        .hbot-stat-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #737373;
          line-height: 1.5;
        }

        /* Tags */
        .hbot-tags-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
          margin-top: 2rem;
        }

        .hbot-tag-pill {
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.2s ease;
        }

        .hbot-tag-pill:hover {
          border-color: rgba(255, 255, 255, 0.25);
        }

        /* Chamber Photos */
        .hbot-photos-section {
          background: #ffffff;
        }

        .hbot-photos-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .hbot-photo-wrapper {
          overflow: hidden;
          border-radius: 12px;
        }

        .hbot-photo-wrapper img {
          width: 100%;
          height: auto;
          border-radius: 12px;
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        .hbot-photo-wrapper:hover img {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        /* Benefit Cards */
        .hbot-benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .hbot-benefit-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .hbot-benefit-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .hbot-benefit-number {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-bottom: 1rem;
        }

        .hbot-benefit-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
        }

        .hbot-benefit-desc {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
        }

        /* Research Cards */
        .hbot-research-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .hbot-research-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .hbot-research-card:hover {
          border-color: #171717;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .hbot-research-category {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #0d9488;
          margin-bottom: 0.875rem;
        }

        .hbot-research-headline {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .hbot-research-summary {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
          margin-bottom: 1rem;
        }

        .hbot-research-source {
          font-size: 0.8125rem;
          font-style: italic;
          color: #737373;
        }

        .hbot-research-disclaimer {
          font-size: 0.8125rem;
          color: #737373;
          text-align: center;
          max-width: 700px;
          margin: 3rem auto 0;
          line-height: 1.7;
        }

        /* Athlete Cards */
        .hbot-athletes-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .hbot-athlete-card {
          padding: 2rem 1.75rem;
          border-radius: 12px;
          text-align: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: border-color 0.2s ease;
        }

        .hbot-athlete-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }

        .hbot-athlete-icon {
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

        .hbot-athlete-name {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.25rem;
        }

        .hbot-athlete-sport {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.02em;
        }

        /* Expect List */
        .hbot-expect-list {
          margin-top: 2.5rem;
        }

        .hbot-expect-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #e5e5e5;
          align-items: flex-start;
        }

        .hbot-expect-item:last-child {
          border-bottom: none;
        }

        .hbot-expect-step {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #737373;
          min-width: 56px;
          letter-spacing: 0.02em;
        }

        .hbot-expect-content h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .hbot-expect-content p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.7;
        }

        /* FAQ */
        .hbot-faq-list {
          max-width: 700px;
          margin: 0 auto;
        }

        .hbot-faq-item {
          border-bottom: 1px solid #e5e5e5;
        }

        .hbot-faq-item:last-child {
          border-bottom: none;
        }

        .hbot-faq-question {
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

        .hbot-faq-question span {
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
          padding-right: 1rem;
        }

        .hbot-faq-question svg {
          flex-shrink: 0;
          color: #737373;
          transition: transform 0.2s;
        }

        .hbot-faq-open .hbot-faq-question svg {
          transform: rotate(180deg);
        }

        .hbot-faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }

        .hbot-faq-open .hbot-faq-answer {
          max-height: 300px;
          padding-bottom: 1.25rem;
        }

        .hbot-faq-answer p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin: 0;
        }

        /* CTA Section */
        .hbot-cta-section {
          padding: 6rem 1.5rem;
          text-align: center;
        }

        .hbot-cta-title {
          font-size: 2.75rem;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }

        .hbot-cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .hbot-cta-or {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.25);
        }

        .hbot-cta-phone {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 2px;
          transition: border-color 0.2s ease;
        }

        .hbot-cta-phone:hover {
          border-color: rgba(255, 255, 255, 0.6);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hbot-section {
            padding: 3rem 1.5rem;
          }

          .hbot-page h1 {
            font-size: 2rem;
          }

          .hbot-page h2 {
            font-size: 1.5rem;
          }

          .hbot-hero {
            padding: 3rem 1.5rem;
          }

          .hbot-stat-row {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .hbot-photos-grid {
            grid-template-columns: 1fr;
          }

          .hbot-benefits-grid {
            grid-template-columns: 1fr;
          }

          .hbot-research-grid {
            grid-template-columns: 1fr;
          }

          .hbot-athletes-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .hbot-expect-item {
            flex-direction: column;
            gap: 0.5rem;
          }

          .hbot-cta-title {
            font-size: 2rem;
          }

          .hbot-cta-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </Layout>
  );
}
