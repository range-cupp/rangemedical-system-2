// pages/red-light-therapy.jsx
// Red Light Therapy - Full service page with site nav/footer

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import ResearchModal from '../components/ResearchModal';
import { getStudiesByService } from '../data/researchStudies';
import CheckoutModal from '../components/CheckoutModal';

export default function RedLightTherapy() {
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const studies = getStudiesByService('red-light-therapy');

  // Checkout modal state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState(null);

  const rltProducts = {
    membership: { name: 'RLT Reset Membership', amountCents: 39900, amountLabel: '$399/mo', serviceCategory: 'rlt', serviceName: 'Red Light Reset Membership' },
    single: { name: 'RLT Single Session', amountCents: 8500, amountLabel: '$85', serviceCategory: 'rlt', serviceName: 'Red Light Therapy — Single Session' },
    pack5: { name: 'RLT 5-Session Pack', amountCents: 37500, amountLabel: '$375', serviceCategory: 'rlt', serviceName: 'Red Light Therapy — 5-Session Pack' },
    pack10: { name: 'RLT 10-Session Pack', amountCents: 60000, amountLabel: '$600', serviceCategory: 'rlt', serviceName: 'Red Light Therapy — 10-Session Pack' },
  };

  const openCheckout = (key) => {
    setCheckoutProduct(rltProducts[key]);
    setCheckoutOpen(true);
  };

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

  const handleResearchClick = (studyId) => {
    const study = studies.find(s => s.id === studyId);
    if (study) {
      setSelectedStudy(study);
      setIsModalOpen(true);
    }
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
    { step: "01", title: "Arrive & get comfortable", desc: "You'll be shown to a private room with our full-body LED bed. Wear comfortable clothes or undress to your comfort level — the more skin exposed, the more benefit." },
    { step: "02", title: "Lie down in the LED bed", desc: "Our INNER Light LED Bed features 14,400 LEDs delivering both red (660nm) and near-infrared (850nm) wavelengths. Just lie down and relax." },
    { step: "03", title: "Relax for 20 minutes", desc: "The session runs for about 20 minutes. Many people close their eyes, meditate, or even fall asleep. The warmth is gentle and soothing." },
    { step: "04", title: "You're done", desc: "There's no recovery time needed. You can go about your day immediately. Many people feel relaxed, refreshed, or more energized right after." }
  ];

  return (
    <>
    <Layout
      title="Red Light Therapy | Newport Beach | Range Medical"
      description="Discover how red light therapy may support skin health, muscle recovery, energy, and more. Full-body LED bed with 14,400 LEDs. Available at Range Medical in Newport Beach."
    >
      <Head>
        {/* Basic Meta Tags */}
        <meta name="keywords" content="red light therapy Newport Beach, photobiomodulation Orange County, LED light bed therapy, skin health, muscle recovery, inflammation, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/red-light-therapy" />

        {/* Open Graph */}
        <meta property="og:title" content="Red Light Therapy | Newport Beach | Range Medical" />
        <meta property="og:description" content="Full-body INNER Light LED Bed with 14,400 medical-grade LEDs. Recovery, energy, and skin support in Newport Beach." />
        <meta property="og:url" content="https://www.range-medical.com/red-light-therapy" />
        <meta property="og:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/69160cda039bdc6a28e019cd.jpeg" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Red Light Therapy | Newport Beach | Range Medical" />
        <meta name="twitter:description" content="Full-body INNER Light LED Bed with 14,400 medical-grade LEDs. Recovery, energy, and skin support. Newport Beach." />
        <meta name="twitter:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/69160cda039bdc6a28e019cd.jpeg" />

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
                  "reviewCount": "10",
                  "bestRating": "5"
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
                ]
              },
              {
                "@context": "https://schema.org",
                "@type": "MedicalTherapy",
                "name": "Red Light Therapy",
                "alternateName": "Photobiomodulation",
                "description": "Full-body red light therapy using the INNER Light LED Bed with 14,400 medical-grade LEDs delivering 660nm red and 850nm near-infrared wavelengths.",
                "url": "https://www.range-medical.com/red-light-therapy",
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

      {/* Dark Trust Bar Override */}
      <style jsx global>{`
        .rlt-page ~ .trust-bar,
        .trust-bar:has(+ .rlt-page),
        body:has(.rlt-page) .trust-bar {
          background: #1a1a1a !important;
        }
      `}</style>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">5.0 on Google</span>
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">Board-Certified Providers</span>
        </div>
      </div>

      <div className="rlt-page">
        {/* Hero */}
        <section className="rlt-hero">
          <div className="v2-label"><span className="v2-dot" /> RECOVERY &middot; ENERGY &middot; SKIN HEALTH</div>
          <h1>YOUR GUIDE TO RED LIGHT THERAPY</h1>
          <div className="rlt-hero-rule"></div>
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
              <div className="v2-label"><span className="v2-dot" /> WHAT IS IT</div>
              <h2>LIGHT THAT WORKS AT THE CELLULAR LEVEL.</h2>
              <div className="rlt-divider"></div>
              <p className="rlt-body-text">
                Red light therapy (also called photobiomodulation) uses specific wavelengths of red and near-infrared light to penetrate your skin and reach your cells. These wavelengths are absorbed by your mitochondria — the "power plants" inside your cells — which may help them produce more energy.
              </p>
              <p className="rlt-body-text" style={{ marginTop: '1rem' }}>
                Think of it like charging your cells' batteries. More cellular energy means your body may heal faster, recover better, and function more efficiently. At Range Medical in Newport Beach, we use the INNER Light LED Bed — one of the most advanced photobiomodulation systems available in Orange County.
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
              <div className="v2-label"><span className="v2-dot" /> WHO IT'S FOR</div>
              <h2>FOR ANYONE LOOKING TO FEEL AND FUNCTION BETTER.</h2>
              <div className="rlt-divider"></div>
              <p className="rlt-body-text">
                Red light therapy isn't just for athletes or biohackers. If any of these sound like you, it could be worth exploring at our Newport Beach clinic.
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
              <div className="v2-label"><span className="v2-dot" /> HOW IT MAY HELP</div>
              <h2>LIGHT THAT SUPPORTS YOUR WHOLE BODY.</h2>
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
              <div className="v2-label"><span className="v2-dot" /> BACKED BY SCIENCE</div>
              <h2>EVIDENCE-BASED RESULTS</h2>
              <div className="rlt-divider"></div>
              <p className="rlt-body-text">
                We've summarized the peer-reviewed research. Click any study to get the full breakdown — free.
              </p>
            </div>

            <div className="rlt-research-grid">
              {studies.map((study) => (
                <div
                  key={study.id}
                  className="rlt-research-card rlt-animate"
                  onClick={() => handleResearchClick(study.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="rlt-research-category">{study.category}</div>
                  <h3 className="rlt-research-headline">{study.headline}</h3>
                  <p className="rlt-research-summary">{study.summary}</p>
                  <p className="rlt-research-source">{study.sourceJournal}, {study.sourceYear}</p>
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
              <div className="v2-label"><span className="v2-dot" /> WHO USES IT</div>
              <h2>TRUSTED BY ELITE PERFORMERS.</h2>
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
              <div className="v2-label"><span className="v2-dot" /> WHAT TO EXPECT</div>
              <h2>YOUR FIRST SESSION, STEP BY STEP.</h2>
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

        {/* Trial Offer */}
        <section className="rlt-section rlt-trial-section" id="rlt-trial">
          <div className="rlt-container">
            <div className="rlt-animate">
              <div className="v2-label"><span className="v2-dot" /> START HERE</div>
              <h2>TRY IT FOR A WEEK. $49.</h2>
              <div className="rlt-divider"></div>
              <p className="rlt-body-text" style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
                Not sure if Red Light Therapy is for you? Get 3 sessions over 7 days for just $49. No commitment, no pressure — just come in and see how you feel.
              </p>
            </div>

            <div className="rlt-trial-card rlt-animate">
              <div className="rlt-trial-badge">Limited Intro Offer</div>
              <div className="rlt-trial-price">$49</div>
              <div className="rlt-trial-period">3 sessions &middot; 7 days</div>
              <ul className="rlt-trial-features">
                <li>3 Red Light sessions over a 7-day period</li>
                <li>Full-body INNER Light LED Bed — same as members</li>
                <li>Quick pre-trial survey so we can track your results</li>
                <li>Before &amp; after comparison at the end</li>
                <li>No commitment — just show up and see</li>
              </ul>
              <a href="/rlt-trial" style={{ display: 'inline-block', background: '#c53030', color: '#ffffff', fontSize: '0.9375rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none', padding: '1rem 2.5rem', borderRadius: 8, transition: 'background 0.2s ease' }}>Start Your Trial</a>
              <div className="rlt-trial-note">Pay online, walk in any time during business hours.</div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="rlt-section" id="rlt-pricing">
          <div className="rlt-container">
            <div className="rlt-animate">
              <div className="v2-label"><span className="v2-dot" /> PRICING</div>
              <h2>SIMPLE, TRANSPARENT PRICING.</h2>
              <div className="rlt-divider"></div>
              <p className="rlt-body-text">
                Whether you want to try a single session or commit to a membership for the best value — we keep it straightforward.
              </p>
            </div>

            <div className="rlt-pricing-layout rlt-animate">
              {/* Left: Membership (Featured) */}
              <div className="rlt-pricing-membership">
                <div className="rlt-pricing-best-badge">Best Value</div>
                <h3 className="rlt-pricing-membership-title">Red Light Reset Membership</h3>
                <div className="rlt-pricing-membership-price">$399</div>
                <div className="rlt-pricing-membership-period">per month · auto-billing</div>
                <ul className="rlt-pricing-membership-features">
                  <li>Up to <strong>12 Red Light sessions</strong> per month</li>
                  <li>Additional sessions just <strong>$50 each</strong> in the same month</li>
                  <li><strong>3-month minimum</strong>, then month-to-month</li>
                </ul>
                <div className="rlt-pricing-membership-note">
                  Best value if you plan to use Red Light regularly and want ongoing support instead of a one-time program.
                </div>
                <button onClick={() => openCheckout('membership')} className="rlt-pricing-btn-dark">Get Started</button>
              </div>

              {/* Right: Session Packs */}
              <div className="rlt-pricing-packs">
                <div className="rlt-pricing-packs-header">Sessions &amp; Packs</div>

                <div className="rlt-pricing-pack-item">
                  <div className="rlt-pricing-pack-info">
                    <div className="rlt-pricing-pack-name">Single Session</div>
                    <div className="rlt-pricing-pack-desc">20-minute full-body treatment</div>
                  </div>
                  <div className="rlt-pricing-pack-right">
                    <div className="rlt-pricing-pack-price">$85</div>
                    <button onClick={() => openCheckout('single')} className="rlt-pricing-btn-outline-sm">Book Now</button>
                  </div>
                </div>

                <div className="rlt-pricing-pack-divider"></div>

                <div className="rlt-pricing-pack-item">
                  <div className="rlt-pricing-pack-info">
                    <div className="rlt-pricing-pack-name">5-Session Pack</div>
                    <div className="rlt-pricing-pack-desc">Save $50 — great way to get started</div>
                  </div>
                  <div className="rlt-pricing-pack-right">
                    <div className="rlt-pricing-pack-price">$375</div>
                    <div className="rlt-pricing-pack-per">$75 / session</div>
                    <button onClick={() => openCheckout('pack5')} className="rlt-pricing-btn-outline-sm">Buy Pack</button>
                  </div>
                </div>

                <div className="rlt-pricing-pack-divider"></div>

                <div className="rlt-pricing-pack-item">
                  <div className="rlt-pricing-pack-info">
                    <div className="rlt-pricing-pack-name">10-Session Pack</div>
                    <div className="rlt-pricing-pack-desc">Save $250 — best pack value</div>
                  </div>
                  <div className="rlt-pricing-pack-right">
                    <div className="rlt-pricing-pack-price">$600</div>
                    <div className="rlt-pricing-pack-per">$60 / session</div>
                    <button onClick={() => openCheckout('pack10')} className="rlt-pricing-btn-outline-sm">Buy Pack</button>
                  </div>
                </div>

                <div className="rlt-pricing-packs-quote">
                  Great if you want to try Red Light or focus on one area like recovery, skin, or joint health.
                </div>
              </div>
            </div>

            {/* Per-Session Comparison */}
            <div className="rlt-pricing-compare rlt-animate">
              <div className="rlt-pricing-compare-title">Per-Session Cost Comparison</div>
              <div className="rlt-pricing-compare-grid">
                <div className="rlt-pricing-compare-item">
                  <div className="rlt-pricing-compare-label">Single</div>
                  <div className="rlt-pricing-compare-value">$85</div>
                </div>
                <div className="rlt-pricing-compare-item">
                  <div className="rlt-pricing-compare-label">5-Pack</div>
                  <div className="rlt-pricing-compare-value">$75</div>
                  <div className="rlt-pricing-compare-save">Save 12%</div>
                </div>
                <div className="rlt-pricing-compare-item">
                  <div className="rlt-pricing-compare-label">10-Pack</div>
                  <div className="rlt-pricing-compare-value">$60</div>
                  <div className="rlt-pricing-compare-save">Save 29%</div>
                </div>
                <div className="rlt-pricing-compare-item rlt-pricing-compare-best">
                  <div className="rlt-pricing-compare-label">Membership</div>
                  <div className="rlt-pricing-compare-value">$33</div>
                  <div className="rlt-pricing-compare-save">Save 61%</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Safety & Transparency */}
        <section className="rlt-section">
          <div className="rlt-container">
            <div className="rlt-animate">
              <div className="v2-label"><span className="v2-dot" /> SAFETY & TRANSPARENCY</div>
              <h2>WHAT WE WANT YOU TO KNOW UPFRONT.</h2>
              <div className="rlt-divider"></div>
              <p className="rlt-body-text">
                Red light therapy is one of the safest therapies available — no UV, no radiation, no downtime. Here is what you might notice.
              </p>
            </div>

            <div className="rlt-safety-grid rlt-animate">
              <div className="rlt-safety-card">
                <div className="rlt-safety-label">What You Might Notice</div>
                <div className="rlt-safety-items">
                  <div className="rlt-safety-item">
                    <span className="rlt-safety-icon">1</span>
                    <div>
                      <strong>Mild Skin Redness</strong>
                      <p>Temporary pink flush at the treated area. Actually means blood flow is increasing — the intended mechanism.</p>
                    </div>
                  </div>
                  <div className="rlt-safety-item">
                    <span className="rlt-safety-icon">2</span>
                    <div>
                      <strong>Warmth & Tingling</strong>
                      <p>Gentle warmth during treatment from light energy absorption. Should feel pleasant, like sunlight.</p>
                    </div>
                  </div>
                  <div className="rlt-safety-item">
                    <span className="rlt-safety-icon">3</span>
                    <div>
                      <strong>Eye Sensitivity</strong>
                      <p>Protective eyewear is provided and required. With goggles on, eye strain is completely eliminated.</p>
                    </div>
                  </div>
                  <div className="rlt-safety-item">
                    <span className="rlt-safety-icon">4</span>
                    <div>
                      <strong>Relaxation or Fatigue</strong>
                      <p>Some people feel deeply relaxed after a session. Others feel energized. Both are normal responses.</p>
                    </div>
                  </div>
                </div>
                <div className="rlt-safety-guides">
                  <Link href="/rlt-side-effects-guide" className="rlt-safety-guide-link">Full Red Light Side Effects Guide <span>&rarr;</span></Link>
                </div>
              </div>

              <div className="rlt-safety-card rlt-safety-card-dark">
                <div className="rlt-safety-label">Tell Us Before Your Session If</div>
                <div className="rlt-safety-items">
                  <div className="rlt-safety-item">
                    <span className="rlt-safety-warn">!</span>
                    <p>You are taking photosensitizing medications (certain antibiotics, retinoids, or acne medications)</p>
                  </div>
                  <div className="rlt-safety-item">
                    <span className="rlt-safety-warn">!</span>
                    <p>You have a history of photosensitivity disorders (lupus, porphyria)</p>
                  </div>
                  <div className="rlt-safety-item">
                    <span className="rlt-safety-warn">!</span>
                    <p>You have active skin cancer or suspicious lesions in the treatment area</p>
                  </div>
                  <div className="rlt-safety-item">
                    <span className="rlt-safety-warn">!</span>
                    <p>You are pregnant (limited data — we take a conservative approach)</p>
                  </div>
                </div>
                <p className="rlt-safety-note">Red light therapy has very few contraindications. Most people can start immediately. When in doubt, ask — we're happy to review your situation.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="rlt-section-alt">
          <div className="rlt-container">
            <div className="v2-label"><span className="v2-dot" /> QUESTIONS</div>
            <h2>COMMON QUESTIONS</h2>

            <div className="rlt-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`rlt-faq-item ${openFaq === index ? 'rlt-faq-open' : ''}`}>
                  <button className="rlt-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <span className="rlt-faq-toggle">{openFaq === index ? '\u2212' : '+'}</span>
                  </button>
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
              <div className="v2-label" style={{ marginBottom: '1.5rem' }}><span className="v2-dot" /> NEXT STEPS</div>
              <h2 className="rlt-cta-title">READY TO TRY RED LIGHT THERAPY?</h2>
              <p className="rlt-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                Whether you're looking to improve your skin, recover faster, or just feel more energized — our Newport Beach team is here to help. Book a session or give us a call.
              </p>
              <div className="rlt-cta-buttons">
                <Link href="/start" className="rlt-btn-primary">Start Now</Link>
                <div className="rlt-cta-or">or</div>
                <a href="tel:9499973988" className="rlt-cta-phone">(949) 997-3988</a>
              </div>
            </div>
          </div>
        </section>

        <ResearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          study={selectedStudy}
          servicePage="red-light-therapy"
        />
      </div>

      <style jsx>{`
        /* ===== RLT PAGE V2 SCOPED STYLES ===== */
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
          padding: 6rem 2rem;
        }

        .rlt-section-alt {
          background: #fafafa;
          padding: 6rem 2rem;
        }

        .rlt-section-inverted {
          background: #1a1a1a;
          color: #ffffff;
        }

        /* Headlines — V2: uppercase, 900 weight, tight leading */
        .rlt-page h1 {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          color: #171717;
        }

        .rlt-page h2 {
          font-size: 2rem;
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.03em;
          text-transform: uppercase;
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

        /* Body Text — V2: #737373 */
        .rlt-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #737373;
          max-width: 600px;
        }

        .rlt-section-inverted .rlt-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider — V2: #e0e0e0 */
        .rlt-divider {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin: 1.25rem 0;
        }

        .rlt-section-inverted .rlt-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Buttons — V2: no border-radius, 11px, 700, 0.12em spacing, uppercase */
        .rlt-btn-primary {
          display: inline-block;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 0.875rem 2rem;
          background: #ffffff;
          color: #1a1a1a;
          border: none;
          border-radius: 0;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s ease;
        }

        .rlt-btn-primary:hover {
          background: #e0e0e0;
        }

        /* Hero — V2: left-aligned */
        .rlt-hero {
          padding: 6rem 2rem 5rem;
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 1200px;
          margin: 0 auto;
        }

        .rlt-hero h1 {
          max-width: 680px;
          margin-bottom: 1.5rem;
        }

        .rlt-hero-rule {
          width: 100%;
          max-width: 680px;
          height: 1px;
          background: #e0e0e0;
          margin-bottom: 1.5rem;
        }

        .rlt-hero .rlt-body-text {
          text-align: left;
          margin: 0 0 2.5rem;
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

        /* Stat Row — V2: gold accent numbers */
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
          color: #808080;
        }

        .rlt-stat-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #737373;
          line-height: 1.5;
        }

        /* Tags — V2: no border-radius */
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
          border-radius: 0;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.2s ease;
        }

        .rlt-tag-pill:hover {
          border-color: rgba(255, 255, 255, 0.25);
        }

        /* Device Photos — V2: no border-radius, no box-shadow */
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
          border-radius: 0;
        }

        .rlt-photo-wrapper img {
          width: 100%;
          height: auto;
          border-radius: 0;
          transition: opacity 0.2s ease;
        }

        .rlt-photo-wrapper:hover img {
          opacity: 0.92;
        }

        /* Benefit Cards — V2: no border-radius, no box-shadow, hairline borders, gold numbers */
        .rlt-benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-top: 2.5rem;
          border: 1px solid #e0e0e0;
        }

        .rlt-benefit-card {
          padding: 2rem;
          border-radius: 0;
          border: none;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          background: #ffffff;
          transition: background 0.2s ease;
        }

        .rlt-benefit-card:nth-child(2n) {
          border-right: none;
        }

        .rlt-benefit-card:nth-last-child(-n+2) {
          border-bottom: none;
        }

        .rlt-benefit-card:hover {
          background: #fafafa;
        }

        .rlt-benefit-number {
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #808080;
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
          color: #737373;
        }

        /* Research Cards — V2: no border-radius, no box-shadow, hairline border, gold category */
        .rlt-research-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-top: 2.5rem;
          border: 1px solid #e0e0e0;
        }

        .rlt-research-card {
          padding: 2rem;
          border-radius: 0;
          border: none;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          background: #ffffff;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .rlt-research-card:nth-child(2n) {
          border-right: none;
        }

        .rlt-research-card:nth-last-child(-n+2) {
          border-bottom: none;
        }

        .rlt-research-card:hover {
          background: #fafafa;
        }

        .rlt-research-category {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #808080;
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
          color: #737373;
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

        /* Athlete Cards — V2: no border-radius, no emoji circles */
        .rlt-athletes-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0;
          margin-top: 2.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .rlt-athlete-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          border-radius: 0;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          transition: background 0.2s ease;
        }

        .rlt-athlete-card:nth-child(2n) {
          border-right: none;
        }

        .rlt-athlete-card:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .rlt-athlete-icon {
          width: 44px;
          height: 44px;
          border-radius: 0;
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

        /* Expect List — V2: gold step numbers, #e0e0e0 borders */
        .rlt-expect-list {
          margin-top: 2.5rem;
        }

        .rlt-expect-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #e0e0e0;
          align-items: flex-start;
        }

        .rlt-expect-item:last-child {
          border-bottom: none;
        }

        .rlt-expect-step {
          font-size: 1.25rem;
          font-weight: 800;
          color: #808080;
          min-width: 56px;
          letter-spacing: -0.02em;
        }

        .rlt-expect-content h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .rlt-expect-content p {
          font-size: 0.875rem;
          color: #737373;
          line-height: 1.7;
        }

        /* FAQ — V2: +/- toggle, #e0e0e0 borders */
        .rlt-faq-list {
          max-width: 700px;
          margin: 0 auto;
        }

        .rlt-faq-item {
          border-bottom: 1px solid #e0e0e0;
        }

        .rlt-faq-item:last-child {
          border-bottom: none;
        }

        .rlt-faq-question {
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

        .rlt-faq-question span {
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
          padding-right: 1rem;
        }

        .rlt-faq-toggle {
          flex-shrink: 0;
          font-size: 1.25rem;
          font-weight: 300;
          color: #737373;
          width: 24px;
          text-align: center;
          padding-right: 0 !important;
        }

        .rlt-faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }

        .rlt-faq-open .rlt-faq-answer {
          max-height: 300px;
          padding-bottom: 1.25rem;
        }

        .rlt-faq-answer p {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.7;
          margin: 0;
        }

        /* ===== PRICING SECTION — V2 ===== */
        .rlt-pricing-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 2.5rem;
          align-items: start;
        }

        /* Membership Card — V2: no border-radius, no box-shadow */
        .rlt-pricing-membership {
          background: #ffffff;
          border: 2px solid #171717;
          border-radius: 0;
          padding: 2.5rem 2rem;
          position: relative;
        }

        .rlt-pricing-best-badge {
          position: absolute;
          top: -12px;
          left: 2rem;
          background: #1a1a1a;
          color: #ffffff;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.375rem 1rem;
          border-radius: 0;
        }

        .rlt-pricing-membership-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
          margin-top: 0.5rem;
        }

        .rlt-pricing-membership-price {
          font-size: 2.75rem;
          font-weight: 800;
          color: #808080;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .rlt-pricing-membership-period {
          font-size: 0.875rem;
          color: #737373;
          margin-top: 0.375rem;
          margin-bottom: 1.5rem;
        }

        .rlt-pricing-membership-features {
          list-style: none;
          padding: 0;
          margin: 0 0 1.5rem;
        }

        .rlt-pricing-membership-features li {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.6;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e0e0e0;
          padding-left: 1.25rem;
          position: relative;
        }

        .rlt-pricing-membership-features li::before {
          content: "–";
          position: absolute;
          left: 0;
          color: #808080;
          font-weight: 600;
        }

        .rlt-pricing-membership-features li:last-child {
          border-bottom: none;
        }

        .rlt-pricing-membership-note {
          font-size: 0.8125rem;
          color: #737373;
          line-height: 1.6;
          font-style: italic;
          padding: 1rem 0;
          border-top: 1px solid #e0e0e0;
          margin-bottom: 1.5rem;
        }

        .rlt-pricing-btn-dark {
          display: inline-block;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 0.875rem 2rem;
          background: #1a1a1a;
          color: #ffffff;
          border: none;
          border-radius: 0;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s ease;
        }

        .rlt-pricing-btn-dark:hover {
          background: #333333;
        }

        .rlt-pricing-btn-outline-sm {
          display: inline-block;
          margin-top: 8px;
          padding: 6px 16px;
          background: transparent;
          color: #1a1a1a;
          border: 1px solid #e0e0e0;
          border-radius: 0;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .rlt-pricing-btn-outline-sm:hover {
          background: #f5f5f5;
          border-color: #999999;
        }

        /* Session Packs — V2: no border-radius */
        .rlt-pricing-packs {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 0;
          padding: 2rem;
        }

        .rlt-pricing-packs-header {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1.5rem;
        }

        .rlt-pricing-pack-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
        }

        .rlt-pricing-pack-info {
          flex: 1;
        }

        .rlt-pricing-pack-name {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
        }

        .rlt-pricing-pack-desc {
          font-size: 0.8125rem;
          color: #737373;
          margin-top: 0.125rem;
        }

        .rlt-pricing-pack-right {
          text-align: right;
        }

        .rlt-pricing-pack-price {
          font-size: 1.5rem;
          font-weight: 800;
          color: #808080;
          letter-spacing: -0.02em;
        }

        .rlt-pricing-pack-per {
          font-size: 0.75rem;
          color: #737373;
          margin-top: 0.125rem;
        }

        .rlt-pricing-pack-divider {
          height: 1px;
          background: #e0e0e0;
        }

        .rlt-pricing-packs-quote {
          font-size: 0.8125rem;
          color: #737373;
          line-height: 1.6;
          font-style: italic;
          padding-top: 1.25rem;
          margin-top: 0.5rem;
          border-top: 1px solid #e0e0e0;
        }

        /* Per-Session Comparison — V2: no border-radius */
        .rlt-pricing-compare {
          margin-top: 2.5rem;
          padding: 1.5rem 2rem;
          background: #fafafa;
          border-radius: 0;
          border: 1px solid #e0e0e0;
        }

        .rlt-pricing-compare-title {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1.25rem;
          text-align: center;
        }

        .rlt-pricing-compare-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .rlt-pricing-compare-item {
          text-align: center;
          padding: 1rem;
          border-radius: 0;
          background: #ffffff;
          border: 1px solid #e0e0e0;
        }

        .rlt-pricing-compare-best {
          border: 2px solid #171717;
        }

        .rlt-pricing-compare-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #737373;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .rlt-pricing-compare-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #808080;
          letter-spacing: -0.02em;
        }

        .rlt-pricing-compare-save {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #16a34a;
          margin-top: 0.25rem;
        }

        /* Pricing Responsive */
        @media (max-width: 768px) {
          .rlt-pricing-layout {
            grid-template-columns: 1fr;
          }

          .rlt-pricing-compare-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* CTA Section — V2 */
        /* Trial Offer */
        .rlt-trial-section {
          background: #0a0a0a;
          padding: 6rem 2rem;
          text-align: center;
        }

        .rlt-trial-section .v2-label {
          color: rgba(255,255,255,0.5);
        }

        .rlt-trial-section .v2-dot {
          background: #c53030;
        }

        .rlt-trial-section h2 {
          color: #ffffff;
        }

        .rlt-trial-section .rlt-divider {
          background: rgba(255,255,255,0.15);
        }

        .rlt-trial-section .rlt-body-text {
          color: rgba(255,255,255,0.65);
        }

        .rlt-trial-card {
          max-width: 440px;
          margin: 2.5rem auto 0;
          background: #141414;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 2.5rem 2rem;
        }

        .rlt-trial-badge {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #ffffff;
          background: #c53030;
          padding: 0.375rem 1rem;
          border-radius: 100px;
          margin-bottom: 1.25rem;
        }

        .rlt-trial-price {
          font-size: 3.5rem;
          font-weight: 900;
          color: #ffffff;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .rlt-trial-period {
          font-size: 0.9375rem;
          color: rgba(255,255,255,0.45);
          margin-bottom: 1.75rem;
        }

        .rlt-trial-features {
          list-style: none;
          padding: 0;
          margin: 0 0 2rem;
          text-align: left;
        }

        .rlt-trial-features li {
          font-size: 0.9375rem;
          color: rgba(255,255,255,0.75);
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
          line-height: 1.5;
        }

        .rlt-trial-features li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #c53030;
          font-weight: 700;
        }

        .rlt-trial-btn {
          display: inline-block;
          background: #c53030;
          color: #ffffff;
          font-size: 0.9375rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 1rem 2.5rem;
          border-radius: 8px;
          transition: background 0.2s ease, transform 0.15s ease;
        }

        .rlt-trial-btn:hover {
          background: #a82828;
          transform: translateY(-1px);
        }

        .rlt-trial-note {
          font-size: 0.8125rem;
          color: rgba(255,255,255,0.35);
          margin-top: 1rem;
        }

        .rlt-cta-section {
          padding: 6rem 2rem;
          text-align: center;
        }

        .rlt-cta-title {
          font-size: 2.75rem;
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.03em;
          text-transform: uppercase;
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

        /* Safety & Transparency */
        .rlt-safety-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 2.5rem;
        }
        .rlt-safety-card {
          border: 1px solid #e0e0e0;
          padding: 2rem;
          background: #ffffff;
        }
        .rlt-safety-card-dark {
          background: #0a0a0a;
          border-color: #0a0a0a;
          color: #ffffff;
        }
        .rlt-safety-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #737373;
          margin-bottom: 1.5rem;
        }
        .rlt-safety-card-dark .rlt-safety-label {
          color: rgba(255,255,255,0.5);
        }
        .rlt-safety-items {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .rlt-safety-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 0.875rem 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .rlt-safety-card-dark .rlt-safety-item {
          border-bottom-color: rgba(255,255,255,0.1);
        }
        .rlt-safety-item:last-child {
          border-bottom: none;
        }
        .rlt-safety-icon {
          width: 1.5rem;
          height: 1.5rem;
          background: #171717;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.6875rem;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
        .rlt-safety-warn {
          width: 1.5rem;
          height: 1.5rem;
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.75rem;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
        .rlt-safety-item strong {
          display: block;
          font-size: 0.9rem;
          color: #171717;
          margin-bottom: 0.125rem;
        }
        .rlt-safety-item p {
          font-size: 0.8125rem;
          line-height: 1.6;
          color: #737373;
          margin: 0;
        }
        .rlt-safety-card-dark .rlt-safety-item p {
          color: rgba(255,255,255,0.7);
        }
        .rlt-safety-guides {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e0e0e0;
        }
        .rlt-safety-guide-link {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #171717;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border: 1px solid #e0e0e0;
          transition: all 0.2s;
        }
        .rlt-safety-guide-link:hover {
          border-color: #171717;
        }
        .rlt-safety-guide-link span {
          transition: transform 0.2s;
        }
        .rlt-safety-guide-link:hover span {
          transform: translateX(3px);
        }
        .rlt-safety-note {
          font-size: 0.8125rem;
          color: rgba(255,255,255,0.5);
          margin-top: 1.25rem;
          line-height: 1.6;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .rlt-section {
            padding: 3rem 1.5rem;
          }

          .rlt-section-alt {
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

          .rlt-benefit-card {
            border-right: none;
          }

          .rlt-benefit-card:nth-last-child(-n+2) {
            border-bottom: 1px solid #e0e0e0;
          }

          .rlt-benefit-card:last-child {
            border-bottom: none;
          }

          .rlt-research-grid {
            grid-template-columns: 1fr;
          }

          .rlt-research-card {
            border-right: none;
          }

          .rlt-research-card:nth-last-child(-n+2) {
            border-bottom: 1px solid #e0e0e0;
          }

          .rlt-research-card:last-child {
            border-bottom: none;
          }

          .rlt-athletes-grid {
            grid-template-columns: 1fr;
          }

          .rlt-athlete-card {
            border-right: none;
          }

          .rlt-expect-item {
            flex-direction: column;
            gap: 0.5rem;
          }

          .rlt-safety-grid {
            grid-template-columns: 1fr;
          }

          .rlt-safety-guides {
            flex-direction: column;
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

    {checkoutProduct && (
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        productName={checkoutProduct.name}
        amountCents={checkoutProduct.amountCents}
        amountLabel={checkoutProduct.amountLabel}
        description={checkoutProduct.serviceName}
        serviceCategory={checkoutProduct.serviceCategory}
        serviceName={checkoutProduct.serviceName}
      />
    )}
    </>
  );
}
