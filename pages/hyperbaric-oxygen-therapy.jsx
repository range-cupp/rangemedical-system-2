// pages/hyperbaric-oxygen-therapy.jsx
// Hyperbaric Oxygen Therapy - Full service page with site nav/footer

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { getStudiesByService } from '../data/researchStudies';
import CheckoutModal from '../components/CheckoutModal';

export default function HyperbaricOxygenTherapy() {
  const [openFaq, setOpenFaq] = useState(null);
  const studies = getStudiesByService('hyperbaric-oxygen-therapy');

  // Checkout modal state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState(null);

  const hbotProducts = {
    cer: { name: '6-Week Cellular Energy Reset', amountCents: 399900, amountLabel: '$3,999', serviceCategory: 'hbot', serviceName: 'Six-Week Cellular Energy Reset' },
    mem1x: { name: 'HBOT Membership — 1x/Week', amountCents: 54900, amountLabel: '$549/mo', serviceCategory: 'hbot', serviceName: 'HBOT Membership — 1x/Week' },
    mem2x: { name: 'HBOT Membership — 2x/Week', amountCents: 99900, amountLabel: '$999/mo', serviceCategory: 'hbot', serviceName: 'HBOT Membership — 2x/Week' },
    mem3x: { name: 'HBOT Membership — 3x/Week', amountCents: 139900, amountLabel: '$1,399/mo', serviceCategory: 'hbot', serviceName: 'HBOT Membership — 3x/Week' },
    single: { name: 'HBOT Single Session', amountCents: 18500, amountLabel: '$185', serviceCategory: 'hbot', serviceName: 'HBOT — Single Session' },
    pack5: { name: 'HBOT 5-Session Pack', amountCents: 85000, amountLabel: '$850', serviceCategory: 'hbot', serviceName: 'HBOT — 5-Session Pack' },
    pack10: { name: 'HBOT 10-Session Pack', amountCents: 160000, amountLabel: '$1,600', serviceCategory: 'hbot', serviceName: 'HBOT — 10-Session Pack' },
  };

  const openCheckout = (key) => {
    setCheckoutProduct(hbotProducts[key]);
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

    const elements = document.querySelectorAll('.hbot-page .hbot-animate');
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
    { icon: "\u{1F3C0}", name: "LeBron James", sport: "NBA \u00b7 Los Angeles Lakers" },
    { icon: "\u{1F3CA}", name: "Michael Phelps", sport: "Olympic Swimming \u00b7 23 Gold Medals" },
    { icon: "\u26F3", name: "Tiger Woods", sport: "PGA Golf" },
    { icon: "\u26BD", name: "Cristiano Ronaldo", sport: "Professional Soccer" },
    { icon: "\u{1F3C8}", name: "NFL Teams", sport: "Multiple franchises use HBOT" },
    { icon: "\u{1F396}\uFE0F", name: "U.S. Military", sport: "Navy SEALs & Special Operations" }
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
    { step: "01", title: "Arrive & get comfortable", desc: "You'll sit down in our pressurized chamber. Wear comfortable clothes — that's it. No special prep needed." },
    { step: "02", title: "The chamber pressurizes", desc: "The air pressure slowly increases to 2.0 atmospheres. You might feel a slight pop in your ears — like being on an airplane. This is normal." },
    { step: "03", title: "Breathe & relax", desc: "Once the pressure is set, you just sit back and breathe normally. Many people read, listen to music, or even take a nap. Sessions are usually 60–90 minutes." },
    { step: "04", title: "You're done", desc: "The pressure slowly comes back to normal. You can go about your day right after — no recovery time needed. Many people say they feel more energized." }
  ];


  return (
    <>
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
            <span className="trust-rating">5.0</span> on Google
          </span>
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">Board-Certified Providers</span>
        </div>
      </div>

      <div className="hbot-page">
        {/* Hero */}
        <section className="hbot-hero">
          <div className="v2-label"><span className="v2-dot" /> HYPERBARIC OXYGEN THERAPY</div>
          <h1>STILL NOT HEALING? YOUR TISSUES AREN&apos;T GETTING ENOUGH OXYGEN.</h1>
          <div className="hbot-hero-rule"></div>
          <p className="hbot-body-text">Hyperbaric oxygen therapy saturates your body with pure oxygen under pressure &mdash; accelerating recovery, cutting inflammation, and unlocking repair mechanisms nothing else can reach. Newport Beach.</p>
          <div className="hbot-hero-scroll">
            Scroll to explore
            <span>&darr;</span>
          </div>
        </section>

        {/* What Is It */}
        <section className="hbot-section hbot-section-alt">
          <div className="hbot-container">
            <div className="hbot-animate">
              <div className="v2-label"><span className="v2-dot" /> WHAT IS IT</div>
              <h2>A SIMPLE IDEA WITH POWERFUL RESULTS.</h2>
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
                <div className="hbot-stat-number">2–3&times;</div>
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
              <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)' }}><span className="v2-dot" /> WHO IT'S FOR</div>
              <h2>YOU DON'T HAVE TO BE A PRO ATHLETE.</h2>
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
              <div className="v2-label"><span className="v2-dot" /> HOW IT MAY HELP</div>
              <h2>MORE OXYGEN. BETTER HEALING.</h2>
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
              <div className="v2-label"><span className="v2-dot" /> BACKED BY SCIENCE</div>
              <h2>EVIDENCE-BASED RESULTS</h2>
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
                  onClick={() => window.location.href = '/research/' + study.id}
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
              <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)' }}><span className="v2-dot" /> WHO USES IT</div>
              <h2>TRUSTED BY THE BEST IN THE WORLD.</h2>
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
              <div className="v2-label"><span className="v2-dot" /> WHAT TO EXPECT</div>
              <h2>YOUR FIRST SESSION, STEP BY STEP.</h2>
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

        {/* ===== PRICING SECTION ===== */}
        <section className="hbot-section" id="hbot-pricing">
          <div className="hbot-container">
            <div className="hbot-animate" style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div className="v2-label" style={{ justifyContent: 'center' }}><span className="v2-dot" /> PRICING</div>
              <h2>CHOOSE THE PATH THAT FITS YOUR GOALS.</h2>
              <div className="hbot-divider" style={{ margin: '1.25rem auto' }}></div>
              <p className="hbot-body-text" style={{ textAlign: 'center', margin: '0 auto' }}>
                Whether you want a full protocol, a regular weekly schedule, or just a few sessions — we have an option for you.
              </p>
            </div>

            {/* Tier 1: Full Protocol */}
            <div className="hbot-animate">
              <div className="hbot-pricing-tier-label">I'm Ready for a Full Protocol</div>
              <div className="hbot-pricing-featured">
                <div className="hbot-pricing-guarantee-badge">Money-Back Guarantee</div>
                <h3 className="hbot-pricing-featured-title">Six-Week Cellular Energy Reset</h3>
                <div className="hbot-pricing-featured-price">$3,999</div>
                <ul className="hbot-pricing-featured-list">
                  <li><span className="hbot-li-dash">&ndash;</span> 18 HBOT + 18 Red Light sessions over 6 weeks</li>
                  <li><span className="hbot-li-dash">&ndash;</span> 3 sessions per week of each therapy</li>
                  <li><span className="hbot-li-dash">&ndash;</span> Weekly provider check-ins</li>
                  <li><span className="hbot-li-dash">&ndash;</span> Full money-back guarantee if no improvement</li>
                </ul>
                <div className="hbot-pricing-featured-note">Includes Red Light Therapy &middot; Structured protocol with weekly check-ins</div>
                <button onClick={() => openCheckout('cer')} className="hbot-pricing-btn-dark">Get Started</button>
              </div>
            </div>

            {/* Tier 2: Memberships */}
            <div className="hbot-animate" style={{ marginTop: '3rem' }}>
              <div className="hbot-pricing-tier-label">I Want a Regular Weekly Schedule</div>
              <div className="hbot-pricing-membership-grid">
                <div className="hbot-pricing-membership-card">
                  <h3>HBOT Membership — 1x/Week</h3>
                  <div className="hbot-pricing-membership-price">$549 <span>/mo</span></div>
                  <ul>
                    <li><span className="hbot-li-dash">&ndash;</span> 4 HBOT sessions per month</li>
                    <li><span className="hbot-li-dash">&ndash;</span> Additional sessions $150 each</li>
                    <li><span className="hbot-li-dash">&ndash;</span> 3-month minimum commitment</li>
                  </ul>
                  <div className="hbot-pricing-per-session">$137/session &middot; Save 26% vs singles</div>
                  <button onClick={() => openCheckout('mem1x')} className="hbot-pricing-btn-outline">Choose Plan</button>
                </div>
                <div className="hbot-pricing-membership-card hbot-pricing-popular">
                  <div className="hbot-pricing-popular-badge">Most Popular</div>
                  <h3>HBOT Membership — 2x/Week</h3>
                  <div className="hbot-pricing-membership-price">$999 <span>/mo</span></div>
                  <ul>
                    <li><span className="hbot-li-dash">&ndash;</span> 8 HBOT sessions per month</li>
                    <li><span className="hbot-li-dash">&ndash;</span> Additional sessions $150 each</li>
                    <li><span className="hbot-li-dash">&ndash;</span> 3-month minimum commitment</li>
                  </ul>
                  <div className="hbot-pricing-per-session">$125/session &middot; Save 32% vs singles</div>
                  <button onClick={() => openCheckout('mem2x')} className="hbot-pricing-btn-dark">Choose Plan</button>
                </div>
                <div className="hbot-pricing-membership-card">
                  <h3>HBOT Membership — 3x/Week</h3>
                  <div className="hbot-pricing-membership-price">$1,399 <span>/mo</span></div>
                  <ul>
                    <li><span className="hbot-li-dash">&ndash;</span> 12 HBOT sessions per month</li>
                    <li><span className="hbot-li-dash">&ndash;</span> Additional sessions $150 each</li>
                    <li><span className="hbot-li-dash">&ndash;</span> 3-month minimum commitment</li>
                  </ul>
                  <div className="hbot-pricing-per-session">$117/session &middot; Save 37% vs singles</div>
                  <button onClick={() => openCheckout('mem3x')} className="hbot-pricing-btn-outline">Choose Plan</button>
                </div>
              </div>
            </div>

            {/* Tier 3: Session Packs */}
            <div className="hbot-animate" style={{ marginTop: '3rem' }}>
              <div className="hbot-pricing-tier-label">I Want to Buy Sessions as Needed — No Commitment</div>
              <div className="hbot-pricing-packs-grid">
                <div className="hbot-pricing-pack-card">
                  <div className="hbot-pricing-pack-name">Single Session</div>
                  <div className="hbot-pricing-pack-price">$185</div>
                  <div className="hbot-pricing-pack-detail">Drop in anytime</div>
                  <button onClick={() => openCheckout('single')} className="hbot-pricing-btn-outline-sm">Book Now</button>
                </div>
                <div className="hbot-pricing-pack-card">
                  <div className="hbot-pricing-pack-name">5-Session Pack</div>
                  <div className="hbot-pricing-pack-price">$850</div>
                  <div className="hbot-pricing-pack-detail">$170/session &middot; Save $75</div>
                  <button onClick={() => openCheckout('pack5')} className="hbot-pricing-btn-outline-sm">Buy Pack</button>
                </div>
                <div className="hbot-pricing-pack-card">
                  <div className="hbot-pricing-pack-name">10-Session Pack</div>
                  <div className="hbot-pricing-pack-price">$1,600</div>
                  <div className="hbot-pricing-pack-detail">$160/session &middot; Save $250</div>
                  <button onClick={() => openCheckout('pack10')} className="hbot-pricing-btn-outline-sm">Buy Pack</button>
                </div>
              </div>
            </div>

            {/* Per-Session Cost Comparison */}
            <div className="hbot-animate" style={{ marginTop: '2.5rem' }}>
              <div className="hbot-pricing-comparison">
                <div className="hbot-pricing-comparison-title">Per-Session Cost</div>
                <div className="hbot-pricing-comparison-row">
                  <div className="hbot-pricing-comparison-item">
                    <div className="hbot-pricing-comparison-label">Single</div>
                    <div className="hbot-pricing-comparison-value">$185</div>
                  </div>
                  <div className="hbot-pricing-comparison-item">
                    <div className="hbot-pricing-comparison-label">5-Pack</div>
                    <div className="hbot-pricing-comparison-value">$170</div>
                    <div className="hbot-pricing-comparison-save">Save 8%</div>
                  </div>
                  <div className="hbot-pricing-comparison-item">
                    <div className="hbot-pricing-comparison-label">10-Pack</div>
                    <div className="hbot-pricing-comparison-value">$160</div>
                    <div className="hbot-pricing-comparison-save">Save 14%</div>
                  </div>
                  <div className="hbot-pricing-comparison-item">
                    <div className="hbot-pricing-comparison-label">1x/Week</div>
                    <div className="hbot-pricing-comparison-value">$137</div>
                    <div className="hbot-pricing-comparison-save">Save 26%</div>
                  </div>
                  <div className="hbot-pricing-comparison-item">
                    <div className="hbot-pricing-comparison-label">2x/Week</div>
                    <div className="hbot-pricing-comparison-value">$125</div>
                    <div className="hbot-pricing-comparison-save">Save 32%</div>
                  </div>
                  <div className="hbot-pricing-comparison-item">
                    <div className="hbot-pricing-comparison-label">3x/Week</div>
                    <div className="hbot-pricing-comparison-value">$117</div>
                    <div className="hbot-pricing-comparison-save">Save 37%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Safety & Transparency */}
        <section className="hbot-section">
          <div className="hbot-container">
            <div className="hbot-animate">
              <div className="v2-label"><span className="v2-dot" /> SAFETY & TRANSPARENCY</div>
              <h2>WHAT WE WANT YOU TO KNOW UPFRONT.</h2>
              <div className="hbot-divider"></div>
              <p className="hbot-body-text">
                HBOT is safe and well-studied. Your technician monitors you throughout every session. Here is what you might experience.
              </p>
            </div>

            <div className="hbot-safety-grid hbot-animate">
              <div className="hbot-safety-card">
                <div className="hbot-safety-label">What You Might Notice</div>
                <div className="hbot-safety-items">
                  <div className="hbot-safety-item">
                    <span className="hbot-safety-icon">1</span>
                    <div>
                      <strong>Ear Pressure</strong>
                      <p>Nearly everyone feels this during pressurization. Like descending in an airplane. Your ears learn to equalize quickly.</p>
                    </div>
                  </div>
                  <div className="hbot-safety-item">
                    <span className="hbot-safety-icon">2</span>
                    <div>
                      <strong>Sinus Pressure</strong>
                      <p>Especially if you have any congestion. A pre-session decongestant prevents this for most people.</p>
                    </div>
                  </div>
                  <div className="hbot-safety-item">
                    <span className="hbot-safety-icon">3</span>
                    <div>
                      <strong>Temporary Vision Changes</strong>
                      <p>After 10+ sessions, near vision may improve slightly and distance blur. 100% reversible after completing your protocol.</p>
                    </div>
                  </div>
                  <div className="hbot-safety-item">
                    <span className="hbot-safety-icon">4</span>
                    <div>
                      <strong>Post-Session Fatigue</strong>
                      <p>Feeling tired after — your body is using the extra oxygen for repair. Most people feel energized by the next day.</p>
                    </div>
                  </div>
                </div>
                <div className="hbot-safety-guides">
                  <Link href="/hbot-side-effects-guide" className="hbot-safety-guide-link">Full HBOT Side Effects Guide <span>&rarr;</span></Link>
                </div>
              </div>

              <div className="hbot-safety-card hbot-safety-card-dark">
                <div className="hbot-safety-label">Who Should Not Do HBOT</div>
                <div className="hbot-safety-items">
                  <div className="hbot-safety-item">
                    <span className="hbot-safety-warn">!</span>
                    <p>Untreated pneumothorax (collapsed lung)</p>
                  </div>
                  <div className="hbot-safety-item">
                    <span className="hbot-safety-warn">!</span>
                    <p>Active ear or sinus infection (reschedule until resolved)</p>
                  </div>
                  <div className="hbot-safety-item">
                    <span className="hbot-safety-warn">!</span>
                    <p>Certain chemotherapy drugs (timing conflicts — discuss with provider)</p>
                  </div>
                  <div className="hbot-safety-item">
                    <span className="hbot-safety-warn">!</span>
                    <p>Severe claustrophobia that does not respond to accommodation</p>
                  </div>
                  <div className="hbot-safety-item">
                    <span className="hbot-safety-warn">!</span>
                    <p>Uncontrolled high fever</p>
                  </div>
                </div>
                <p className="hbot-safety-note">We screen every patient before their first session. If you are congested or have an active infection, we will reschedule — not push through.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Real Results */}
        <section className="hbot-section hbot-section-inverted">
          <div className="hbot-container">
            <div className="hbot-animate">
              <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)' }}><span className="v2-dot" /> REAL RESULTS</div>
              <h2>WHAT 20 SESSIONS CAN CHANGE.</h2>
              <div className="hbot-divider"></div>
              <p className="hbot-body-text">
                These are real patient outcomes from our Newport Beach clinic. Names withheld for privacy. Every case started with a Range Assessment.
              </p>
            </div>

            <div className="hbot-results-grid hbot-animate">
              <div className="hbot-result-card">
                <div className="hbot-result-profile">Male, 55</div>
                <div className="hbot-result-before">
                  <span className="hbot-result-label">Before</span>
                  Post-surgical knee recovery stalled at 6 weeks, still limping, inflammation markers elevated.
                </div>
                <div className="hbot-result-after">
                  <span className="hbot-result-label">After 20 HBOT Sessions</span>
                  Full range of motion restored, inflammation markers normalized, physical therapist said recovery accelerated by months.
                </div>
              </div>
              <div className="hbot-result-card">
                <div className="hbot-result-profile">Male, 41</div>
                <div className="hbot-result-before">
                  <span className="hbot-result-label">Before</span>
                  Post-concussion syndrome for 8 months, brain fog, light sensitivity, couldn't work full days.
                </div>
                <div className="hbot-result-after">
                  <span className="hbot-result-label">After 30 HBOT Sessions</span>
                  Cognitive clarity returned, back to full work schedule, headaches resolved.
                </div>
              </div>
              <div className="hbot-result-card">
                <div className="hbot-result-profile">Female, 48</div>
                <div className="hbot-result-before">
                  <span className="hbot-result-label">Before</span>
                  Chronic fatigue, autoimmune flare-ups every few months, poor wound healing.
                </div>
                <div className="hbot-result-after">
                  <span className="hbot-result-label">After 20 HBOT Sessions</span>
                  Energy noticeably improved, went 6+ months without a flare, small cuts healing in days instead of weeks.
                </div>
              </div>
            </div>

            <div className="hbot-inaction hbot-animate">
              <div className="hbot-inaction-label">THE COST OF WAITING</div>
              <p>Chronic inflammation doesn't resolve on its own — it compounds. Injuries that don't heal properly create compensatory patterns that cause new problems. The brain doesn't recover from concussion on a fixed timeline. HBOT accelerates what your body is already trying to do. The sooner you start, the less damage accumulates.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="hbot-section hbot-section-alt">
          <div className="hbot-container">
            <div className="v2-label"><span className="v2-dot" /> QUESTIONS</div>
            <h2>COMMON QUESTIONS</h2>

            <div className="hbot-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`hbot-faq-item ${openFaq === index ? 'hbot-faq-open' : ''}`}>
                  <button className="hbot-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <span className="hbot-faq-toggle">{openFaq === index ? '\u2212' : '+'}</span>
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
              <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}><span className="v2-dot" /> NEXT STEPS</div>
              <h2 className="hbot-cta-title">YOUR BODY IS CAPABLE OF MORE THAN YOU THINK.</h2>
              <p className="hbot-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                Patients tell us HBOT is the treatment they wish they'd started sooner. Faster healing, clearer thinking, deeper sleep. Come see what pressurized oxygen can do. $197 assessment, credited toward treatment.
              </p>
              <div className="hbot-cta-buttons">
                <Link href="/range-assessment" className="hbot-btn-primary">Book Your $197 Range Assessment</Link>
                <div className="hbot-cta-or">or</div>
                <a href="tel:9499973988" className="hbot-cta-phone">(949) 997-3988</a>
              </div>
            </div>
          </div>
        </section>

      </div>

      <style jsx>{`
        /* ===== HBOT PAGE V2 SCOPED STYLES ===== */
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
          padding: 6rem 2rem;
        }

        .hbot-section-alt {
          background: #fafafa;
          padding: 6rem 2rem;
        }

        .hbot-section-inverted {
          background: #1a1a1a;
          color: #ffffff;
        }

        /* Headlines — V2: uppercase, 900 weight, tight leading */
        .hbot-page h1 {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.03em;
          color: #171717;
          text-transform: uppercase;
        }

        .hbot-page h2 {
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 0.95;
          color: #171717;
          margin-bottom: 1rem;
          text-transform: uppercase;
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

        /* Body Text — V2: #737373 */
        .hbot-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #737373;
          max-width: 600px;
        }

        .hbot-section-inverted .hbot-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider — V2: #e0e0e0 */
        .hbot-divider {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin: 1.25rem 0;
        }

        .hbot-section-inverted .hbot-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Buttons — V2: no border-radius, 11px, 700 weight, uppercase */
        .hbot-btn-primary {
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

        .hbot-btn-primary:hover {
          background: #e0e0e0;
        }

        /* Hero — V2: left-aligned with hairline rule */
        .hbot-hero {
          padding: 6rem 2rem 5rem;
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hbot-hero h1 {
          max-width: 680px;
          margin-bottom: 1.5rem;
        }

        .hbot-hero-rule {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin-bottom: 1.5rem;
        }

        .hbot-hero .hbot-body-text {
          text-align: left;
          margin: 0 0 2.5rem;
        }

        .hbot-hero-scroll {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
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
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #808080;
        }

        .hbot-stat-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #737373;
          line-height: 1.5;
        }

        /* Tags — V2: no rounded corners */
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
          border-radius: 0;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.2s ease;
        }

        .hbot-tag-pill:hover {
          border-color: rgba(255, 255, 255, 0.25);
        }

        /* Chamber Photos — V2: no border-radius, no shadow */
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
          border-radius: 0;
        }

        .hbot-photo-wrapper img {
          width: 100%;
          height: auto;
          border-radius: 0;
          transition: transform 0.2s ease;
        }

        .hbot-photo-wrapper:hover img {
          transform: scale(1.01);
        }

        /* Benefit Cards — V2: no radius, no shadow, hairline borders */
        .hbot-benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-top: 2.5rem;
          border: 1px solid #e0e0e0;
        }

        .hbot-benefit-card {
          padding: 2rem;
          border-radius: 0;
          border: none;
          border-right: 1px solid #e0e0e0;
          border-bottom: 1px solid #e0e0e0;
          background: #ffffff;
          transition: background 0.2s ease;
        }

        .hbot-benefit-card:nth-child(2n) {
          border-right: none;
        }

        .hbot-benefit-card:nth-last-child(-n+2) {
          border-bottom: none;
        }

        .hbot-benefit-card:hover {
          background: #fafafa;
        }

        .hbot-benefit-number {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #808080;
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
          color: #737373;
        }

        /* Research Cards — V2: no radius, no shadow, hairline borders */
        .hbot-research-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-top: 2.5rem;
          border: 1px solid #e0e0e0;
        }

        .hbot-research-card {
          padding: 2rem;
          border-radius: 0;
          border: none;
          border-right: 1px solid #e0e0e0;
          border-bottom: 1px solid #e0e0e0;
          background: #ffffff;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .hbot-research-card:nth-child(2n) {
          border-right: none;
        }

        .hbot-research-card:last-child,
        .hbot-research-card:nth-last-child(2):nth-child(odd) {
          border-bottom: none;
        }

        .hbot-research-card:hover {
          background: #fafafa;
        }

        .hbot-research-category {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #808080;
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
          color: #737373;
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

        /* Athlete Cards — V2: no radius */
        .hbot-athletes-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-top: 2.5rem;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .hbot-athlete-card {
          padding: 2rem 1.75rem;
          border-radius: 0;
          text-align: center;
          background: rgba(255, 255, 255, 0.03);
          border: none;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          transition: background 0.2s ease;
        }

        .hbot-athlete-card:nth-child(3n) {
          border-right: none;
        }

        .hbot-athlete-card:nth-last-child(-n+3) {
          border-bottom: none;
        }

        .hbot-athlete-card:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .hbot-athlete-icon {
          width: 48px;
          height: 48px;
          border-radius: 0;
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

        /* Expect List — V2: gold step numbers, #e0e0e0 borders */
        .hbot-expect-list {
          margin-top: 2.5rem;
        }

        .hbot-expect-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #e0e0e0;
          align-items: flex-start;
        }

        .hbot-expect-item:last-child {
          border-bottom: none;
        }

        .hbot-expect-step {
          font-size: 1.25rem;
          font-weight: 900;
          color: #808080;
          min-width: 56px;
          letter-spacing: -0.02em;
        }

        .hbot-expect-content h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .hbot-expect-content p {
          font-size: 0.875rem;
          color: #737373;
          line-height: 1.7;
        }

        /* FAQ — V2: +/- toggle, #e0e0e0 borders */
        .hbot-faq-list {
          max-width: 700px;
          margin: 1.5rem auto 0;
        }

        .hbot-faq-item {
          border-bottom: 1px solid #e0e0e0;
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

        .hbot-faq-question span:first-child {
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
          padding-right: 1rem;
        }

        .hbot-faq-toggle {
          flex-shrink: 0;
          font-size: 1.25rem;
          font-weight: 300;
          color: #737373;
          width: 24px;
          text-align: center;
          transition: color 0.2s;
        }

        .hbot-faq-open .hbot-faq-toggle {
          color: #808080;
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
          color: #737373;
          line-height: 1.7;
          margin: 0;
        }

        /* CTA Section */
        .hbot-cta-section {
          padding: 6rem 2rem;
          text-align: center;
        }

        .hbot-cta-title {
          font-size: 2.75rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 0.95;
          color: #ffffff;
          margin-bottom: 1.25rem;
          text-transform: uppercase;
        }

        .hbot-cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .hbot-cta-or {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
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

        /* ===== PRICING STYLES — V2 ===== */
        .hbot-pricing-tier-label {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1rem;
        }

        /* Featured card — V2: no radius, no shadow */
        .hbot-pricing-featured {
          border: 1px solid #e0e0e0;
          border-radius: 0;
          padding: 2.5rem;
          position: relative;
          background: #fff;
        }

        .hbot-pricing-guarantee-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          padding: 0.375rem 0.75rem;
          background: #1a1a1a;
          color: #fff;
          border-radius: 0;
          margin-bottom: 1.25rem;
        }

        .hbot-pricing-featured-title {
          font-size: 1.5rem;
          font-weight: 900;
          color: #171717;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: -0.02em;
        }

        .hbot-pricing-featured-price {
          font-size: 2.75rem;
          font-weight: 900;
          color: #808080;
          letter-spacing: -0.03em;
          margin-bottom: 1.5rem;
        }

        .hbot-pricing-featured-list {
          list-style: none;
          padding: 0;
          margin: 0 0 1.5rem;
        }

        .hbot-pricing-featured-list li {
          font-size: 0.9375rem;
          color: #737373;
          padding: 0.375rem 0;
          padding-left: 0;
          position: relative;
        }

        .hbot-li-dash {
          color: #808080;
          font-weight: 700;
          margin-right: 0.5rem;
        }

        .hbot-pricing-featured-note {
          font-size: 0.8125rem;
          color: #737373;
          border-top: 1px solid #e0e0e0;
          padding-top: 1rem;
          margin-bottom: 1.5rem;
        }

        /* Membership grid — V2 */
        .hbot-pricing-membership-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border: 1px solid #e0e0e0;
        }

        .hbot-pricing-membership-card {
          border: none;
          border-right: 1px solid #e0e0e0;
          border-radius: 0;
          padding: 2rem;
          background: #fff;
          position: relative;
          transition: background 0.2s ease;
        }

        .hbot-pricing-membership-card:last-child {
          border-right: none;
        }

        .hbot-pricing-membership-card:hover {
          background: #fafafa;
        }

        .hbot-pricing-popular {
          border-right: 1px solid #e0e0e0;
        }

        .hbot-pricing-popular-badge {
          position: absolute;
          top: -11px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          padding: 0.25rem 0.75rem;
          background: #1a1a1a;
          color: #fff;
          border-radius: 0;
          white-space: nowrap;
        }

        .hbot-pricing-membership-card h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
        }

        .hbot-pricing-membership-price {
          font-size: 2.25rem;
          font-weight: 900;
          color: #808080;
          letter-spacing: -0.03em;
          margin-bottom: 1.25rem;
        }

        .hbot-pricing-membership-price span {
          font-size: 1rem;
          font-weight: 500;
          color: #737373;
        }

        .hbot-pricing-membership-card ul {
          list-style: none;
          padding: 0;
          margin: 0 0 1.25rem;
        }

        .hbot-pricing-membership-card ul li {
          font-size: 0.875rem;
          color: #737373;
          padding: 0.3rem 0;
          padding-left: 0;
          position: relative;
        }

        .hbot-pricing-per-session {
          font-size: 0.8125rem;
          color: #737373;
          border-top: 1px solid #e0e0e0;
          padding-top: 1rem;
          margin-bottom: 1.25rem;
        }

        /* Session packs grid — V2 */
        .hbot-pricing-packs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border: 1px solid #e0e0e0;
          border-radius: 0;
          padding: 0;
          background: #fff;
        }

        .hbot-pricing-pack-card {
          text-align: center;
          padding: 2rem 1rem;
          border: none;
          border-right: 1px solid #e0e0e0;
          border-radius: 0;
        }

        .hbot-pricing-pack-card:last-child {
          border-right: none;
        }

        .hbot-pricing-pack-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }

        .hbot-pricing-pack-price {
          font-size: 2rem;
          font-weight: 900;
          color: #808080;
          letter-spacing: -0.03em;
          margin-bottom: 0.25rem;
        }

        .hbot-pricing-pack-detail {
          font-size: 0.8125rem;
          color: #737373;
          margin-bottom: 1rem;
        }

        /* Comparison table — V2 */
        .hbot-pricing-comparison {
          border: 1px solid #e0e0e0;
          border-radius: 0;
          padding: 1.5rem 2rem;
          background: #fff;
        }

        .hbot-pricing-comparison-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 1rem;
        }

        .hbot-pricing-comparison-row {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1rem;
          text-align: center;
        }

        .hbot-pricing-comparison-label {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #737373;
          margin-bottom: 0.25rem;
        }

        .hbot-pricing-comparison-value {
          font-size: 1.25rem;
          font-weight: 900;
          color: #171717;
        }

        .hbot-pricing-comparison-save {
          font-size: 0.6875rem;
          color: #808080;
          font-weight: 600;
          margin-top: 0.125rem;
        }

        /* Pricing buttons — V2 */
        .hbot-pricing-btn-dark {
          display: inline-block;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 0.75rem 2rem;
          background: #1a1a1a;
          color: #ffffff;
          border: none;
          border-radius: 0;
          text-decoration: none;
          transition: background 0.2s ease;
          cursor: pointer;
        }

        .hbot-pricing-btn-dark:hover {
          background: #333;
        }

        .hbot-pricing-btn-outline {
          display: inline-block;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 0.75rem 2rem;
          background: #fff;
          color: #1a1a1a;
          border: 1px solid #e0e0e0;
          border-radius: 0;
          text-decoration: none;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .hbot-pricing-btn-outline:hover {
          border-color: #1a1a1a;
        }

        .hbot-pricing-btn-outline-sm {
          display: inline-block;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 0.5rem 1.5rem;
          background: #fff;
          color: #1a1a1a;
          border: 1px solid #e0e0e0;
          border-radius: 0;
          text-decoration: none;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .hbot-pricing-btn-outline-sm:hover {
          border-color: #1a1a1a;
        }

        /* Safety & Transparency */
        .hbot-safety-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 2.5rem;
        }
        .hbot-safety-card {
          border: 1px solid #e0e0e0;
          padding: 2rem;
          background: #ffffff;
        }
        .hbot-safety-card-dark {
          background: #0a0a0a;
          border-color: #0a0a0a;
          color: #ffffff;
        }
        .hbot-safety-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #737373;
          margin-bottom: 1.5rem;
        }
        .hbot-safety-card-dark .hbot-safety-label {
          color: rgba(255,255,255,0.5);
        }
        .hbot-safety-items {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .hbot-safety-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 0.875rem 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .hbot-safety-card-dark .hbot-safety-item {
          border-bottom-color: rgba(255,255,255,0.1);
        }
        .hbot-safety-item:last-child {
          border-bottom: none;
        }
        .hbot-safety-icon {
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
        .hbot-safety-warn {
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
        .hbot-safety-item strong {
          display: block;
          font-size: 0.9rem;
          color: #171717;
          margin-bottom: 0.125rem;
        }
        .hbot-safety-item p {
          font-size: 0.8125rem;
          line-height: 1.6;
          color: #737373;
          margin: 0;
        }
        .hbot-safety-card-dark .hbot-safety-item p {
          color: rgba(255,255,255,0.7);
        }
        .hbot-safety-guides {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e0e0e0;
        }
        .hbot-safety-guide-link {
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
        .hbot-safety-guide-link:hover {
          border-color: #171717;
        }
        .hbot-safety-guide-link span {
          transition: transform 0.2s;
        }
        .hbot-safety-guide-link:hover span {
          transform: translateX(3px);
        }
        .hbot-safety-note {
          font-size: 0.8125rem;
          color: rgba(255,255,255,0.5);
          margin-top: 1.25rem;
          line-height: 1.6;
        }

        /* Real Results */
        .hbot-results-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-top: 2.5rem;
        }
        .hbot-result-card {
          padding: 2rem;
          border-right: 1px solid rgba(255,255,255,0.1);
        }
        .hbot-result-card:last-child {
          border-right: none;
        }
        .hbot-result-profile {
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 1.25rem;
          font-weight: 600;
        }
        .hbot-result-before,
        .hbot-result-after {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.7);
          margin-bottom: 1rem;
        }
        .hbot-result-after {
          color: rgba(255,255,255,0.95);
        }
        .hbot-result-label {
          display: block;
          font-size: 0.6875rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.3);
        }
        .hbot-result-after .hbot-result-label {
          color: #4ade80;
        }
        .hbot-inaction {
          margin-top: 3rem;
          padding: 2rem 2.5rem;
          border-left: 3px solid rgba(255,255,255,0.15);
        }
        .hbot-inaction-label {
          font-size: 0.6875rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 700;
          color: rgba(255,255,255,0.35);
          margin-bottom: 0.75rem;
        }
        .hbot-inaction p {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.7);
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hbot-section {
            padding: 4rem 1.5rem;
          }

          .hbot-section-alt {
            padding: 4rem 1.5rem;
          }

          .hbot-page h1 {
            font-size: 2rem;
          }

          .hbot-page h2 {
            font-size: 1.5rem;
          }

          .hbot-hero {
            padding: 4rem 1.5rem;
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

          .hbot-benefit-card {
            border-right: none;
            border-bottom: 1px solid #e0e0e0;
          }

          .hbot-benefit-card:last-child {
            border-bottom: none;
          }

          .hbot-research-grid {
            grid-template-columns: 1fr;
          }

          .hbot-research-card {
            border-right: none;
            border-bottom: 1px solid #e0e0e0;
          }

          .hbot-research-card:last-child {
            border-bottom: none;
          }

          .hbot-athletes-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .hbot-athlete-card {
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          }

          .hbot-athlete-card:last-child {
            border-bottom: none;
          }

          .hbot-expect-item {
            flex-direction: column;
            gap: 0.5rem;
          }

          .hbot-safety-grid {
            grid-template-columns: 1fr;
          }

          .hbot-results-grid {
            grid-template-columns: 1fr;
          }
          .hbot-result-card {
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding: 1.5rem 0;
          }
          .hbot-result-card:last-child {
            border-bottom: none;
          }
          .hbot-inaction {
            padding: 1.5rem;
          }

          .hbot-cta-title {
            font-size: 2rem;
          }

          .hbot-cta-buttons {
            flex-direction: column;
          }

          .hbot-pricing-membership-grid {
            grid-template-columns: 1fr;
          }

          .hbot-pricing-membership-card {
            border-right: none;
            border-bottom: 1px solid #e0e0e0;
          }

          .hbot-pricing-membership-card:last-child {
            border-bottom: none;
          }

          .hbot-pricing-packs-grid {
            grid-template-columns: 1fr;
          }

          .hbot-pricing-pack-card {
            border-right: none;
            border-bottom: 1px solid #e0e0e0;
          }

          .hbot-pricing-pack-card:last-child {
            border-bottom: none;
          }

          .hbot-pricing-comparison-row {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.75rem;
          }

          .hbot-pricing-featured {
            padding: 1.5rem;
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
