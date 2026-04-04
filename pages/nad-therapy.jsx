// pages/nad-therapy.jsx
// NAD+ Therapy - Full service page with site nav/footer

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import ResearchModal from '../components/ResearchModal';
import { getStudiesByService } from '../data/researchStudies';

export default function NADTherapy() {
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const studies = getStudiesByService('nad-therapy');

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

    const elements = document.querySelectorAll('.nad-page .nad-animate');
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
      question: "What does NAD+ actually do?",
      answer: "NAD+ (nicotinamide adenine dinucleotide) is a coenzyme found in every cell of your body. It's essential for energy production, DNA repair, cellular signaling, and activating sirtuins \u2014 proteins that regulate aging. As we age, NAD+ levels decline significantly, which is linked to many age-related issues."
    },
    {
      question: "Why can't I just take oral NAD+ supplements?",
      answer: "Oral NAD+ has very poor bioavailability \u2014 most of it is broken down in the gut before reaching your bloodstream. IV and injection delivery bypass the digestive system entirely, delivering NAD+ directly to your bloodstream where it can reach your cells. This is why clinical protocols use IV or injection routes."
    },
    {
      question: "Which protocol is right for me \u2014 injections or IVs?",
      answer: "Both are effective. The injection protocol (3x/week for 12 weeks) offers convenience and gradual building of NAD+ levels. The IV protocol provides higher doses per session and a front-loaded approach. We'll recommend based on your goals, schedule, and how you respond to treatment."
    },
    {
      question: "What does an NAD+ IV feel like?",
      answer: "NAD+ IVs are infused slowly over 2-4 hours. Some people experience flushing, chest tightness, or nausea if infused too quickly \u2014 this is why we go slow. Most patients describe feeling energized and mentally clear after their infusion. The sensation is temporary and manageable."
    },
    {
      question: "How long do the effects last?",
      answer: "Individual results vary, but most patients report sustained benefits for 2-4 weeks after completing a protocol. This is why we recommend maintenance sessions (monthly IV or continued injections) to maintain elevated NAD+ levels long-term."
    },
    {
      question: "Is NAD+ therapy safe?",
      answer: "Yes, when administered by trained medical professionals. NAD+ is a naturally occurring molecule in your body \u2014 we're simply replenishing what declines with age. Side effects are typically mild and transient. We monitor you throughout IV infusions and adjust the rate as needed."
    }
  ];

  const protocols = [
    {
      name: "Injection Protocol",
      duration: "12 Weeks",
      frequency: "3x per week",
      desc: "Subcutaneous NAD+ injections you administer at home. Convenient, consistent, and effective for building and maintaining NAD+ levels over time.",
      details: [
        "Self-administered subcutaneous injections",
        "Gradual, sustained elevation of NAD+ levels",
        "Flexible scheduling \u2014 do it on your time",
        "Lower cost per dose than IV"
      ],
      best: "Best for: Maintenance, busy schedules, needle-comfortable patients"
    },
    {
      name: "IV Protocol",
      duration: "Quarterly",
      frequency: "5 IVs in 10 days + monthly maintenance",
      desc: "Front-loaded IV infusions for rapid NAD+ restoration. Five sessions over 10 days, then one maintenance IV per month. Repeat the front-load quarterly.",
      details: [
        "Higher dose per session (250-500mg)",
        "Rapid restoration of NAD+ levels",
        "In-clinic sessions with medical supervision",
        "Quarterly front-load for sustained results"
      ],
      best: "Best for: Rapid results, significant depletion, cognitive optimization"
    }
  ];

  const benefits = [
    { number: "01", title: "Cellular Energy Production", desc: "NAD+ is essential for converting food into ATP \u2014 the energy currency of your cells. Higher NAD+ levels mean more efficient energy production at the cellular level." },
    { number: "02", title: "DNA Repair & Protection", desc: "NAD+ activates PARP enzymes that repair damaged DNA. This is critical for preventing cellular dysfunction and maintaining healthy cell replication." },
    { number: "03", title: "Sirtuin Activation", desc: "NAD+ is required to activate sirtuins \u2014 proteins that regulate aging, inflammation, and metabolism. Sirtuins can't function without adequate NAD+." },
    { number: "04", title: "Cognitive Function", desc: "The brain is one of the most energy-demanding organs. NAD+ supports neuronal health, mitochondrial function, and may help with mental clarity and focus." },
    { number: "05", title: "Metabolic Health", desc: "NAD+ plays a key role in metabolic pathways. Adequate levels support healthy glucose metabolism, lipid balance, and overall metabolic function." },
    { number: "06", title: "Healthy Aging", desc: "NAD+ decline is considered a hallmark of aging. Restoring NAD+ levels may help slow certain aspects of cellular aging and support longevity." }
  ];

  const tags = [
    "Low Energy / Fatigue",
    "Brain Fog",
    "Slow Recovery",
    "Aging Concerns",
    "Athletic Performance",
    "Cognitive Optimization",
    "Metabolic Support",
    "Longevity Focus"
  ];


  return (
    <Layout
      title="NAD+ Therapy | IV & Injection Protocols | Newport Beach | Range Medical"
      description="NAD+ therapy in Newport Beach. IV infusions and injection protocols to restore cellular energy, support healthy aging, and optimize cognitive function."
    >
      <Head>
        {/* Basic Meta Tags */}
        <meta name="keywords" content="NAD+ therapy Newport Beach, NAD IV Orange County, NAD injections, cellular energy, anti-aging therapy, cognitive optimization, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/nad-therapy" />

        {/* Open Graph */}
        <meta property="og:title" content="NAD+ Therapy | IV & Injection Protocols | Newport Beach" />
        <meta property="og:description" content="NAD+ therapy to restore cellular energy and support healthy aging. IV and injection protocols in Newport Beach." />
        <meta property="og:url" content="https://www.range-medical.com/nad-therapy" />
        <meta property="og:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NAD+ Therapy | IV & Injections | Newport Beach" />
        <meta name="twitter:description" content="NAD+ therapy to restore cellular energy and support healthy aging. Expert protocols in Newport Beach." />
        <meta name="twitter:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" />

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
                "name": "NAD+ Therapy",
                "description": "NAD+ therapy via IV infusion and injection protocols to restore cellular energy, support DNA repair, and optimize healthy aging.",
                "url": "https://www.range-medical.com/nad-therapy",
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
            <span className="trust-rating">&#9733;&#9733;&#9733;&#9733;&#9733;</span> 5.0 on Google
          </span>
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">Board-Certified Providers</span>
        </div>
      </div>

      <div className="nad-page">
        {/* Hero */}
        <section className="nad-hero">
          <div className="v2-label"><span className="v2-dot" /> Cellular Energy &middot; Longevity &middot; Cognition</div>
          <h1>YOUR CELLS ARE RUNNING ON EMPTY.<br />NAD+ FILLS THE TANK.</h1>
          <div className="nad-hero-rule" />
          <p className="nad-body-text">NAD+ is the molecule your mitochondria need to produce energy, repair DNA, and slow aging at the cellular level. Replenish what time depletes. Newport Beach.</p>
          <div className="nad-hero-scroll">
            Scroll to explore
            <span>&darr;</span>
          </div>
        </section>

        {/* What Is It */}
        <section className="nad-section nad-section-alt">
          <div className="nad-container">
            <div className="nad-animate">
              <div className="v2-label"><span className="v2-dot" /> What Is NAD+</div>
              <h2>The Molecule Behind<br />Cellular Energy.</h2>
              <div className="nad-divider"></div>
              <p className="nad-body-text">
                NAD+ (nicotinamide adenine dinucleotide) is a coenzyme present in every cell of your body. It's essential for converting food into energy, repairing DNA, and activating sirtuins &mdash; the proteins that regulate aging and inflammation.
              </p>
              <p className="nad-body-text" style={{ marginTop: '1rem' }}>
                The problem: NAD+ levels decline significantly as we age. By age 50, most people have half the NAD+ they had at 20. This decline is linked to fatigue, cognitive changes, slower recovery, and accelerated aging. At Range Medical in Newport Beach, we offer clinical protocols to restore your NAD+ levels through IV infusions and injections.
              </p>
            </div>

            <div className="nad-stat-row">
              <div className="nad-stat-item nad-animate">
                <div className="nad-stat-number">50%</div>
                <div className="nad-stat-label">NAD+ decline<br />by age 50</div>
              </div>
              <div className="nad-stat-item nad-animate">
                <div className="nad-stat-number">2</div>
                <div className="nad-stat-label">Proven pathways<br />for cellular uptake</div>
              </div>
              <div className="nad-stat-item nad-animate">
                <div className="nad-stat-number">100%</div>
                <div className="nad-stat-label">Bioavailability<br />with IV delivery</div>
              </div>
            </div>
          </div>
        </section>

        {/* How NAD+ Gets Into Cells */}
        <section className="nad-section">
          <div className="nad-container">
            <div className="nad-animate">
              <div className="v2-label"><span className="v2-dot" /> The Science</div>
              <h2>How NAD+ Actually<br />Enters Your Cells.</h2>
              <div className="nad-divider"></div>
              <p className="nad-body-text">
                For years, scientists believed NAD+ couldn't cross cell membranes. We now know it enters cells through two distinct mechanisms &mdash; which is why IV and injection delivery works.
              </p>
            </div>

            <div className="nad-mechanism-grid">
              <div className="nad-mechanism-card nad-animate">
                <div className="nad-mechanism-number">01</div>
                <h3>Direct Uptake via Connexin 43</h3>
                <p>
                  Research has identified connexin 43 (Cx43) hemichannels as a direct pathway for NAD+ to enter cells. These protein channels in cell membranes allow intact NAD+ molecules to pass through directly, bypassing the need for conversion. This mechanism is particularly active in cardiac and muscle tissue.
                </p>
              </div>
              <div className="nad-mechanism-card nad-animate">
                <div className="nad-mechanism-number">02</div>
                <h3>CD73 Conversion Pathway</h3>
                <p>
                  The second pathway involves enzymes on cell surfaces (CD38 and CD73) that break down extracellular NAD+ into smaller precursors &mdash; nicotinamide riboside (NR) and nicotinamide mononucleotide (NMN). These precursors easily cross cell membranes and are reassembled into NAD+ inside the cell.
                </p>
              </div>
            </div>

            <p className="nad-science-note nad-animate">
              Both pathways work simultaneously, which is why IV and injection NAD+ therapy effectively raises intracellular NAD+ levels &mdash; something oral supplements struggle to achieve.
            </p>
          </div>
        </section>

        {/* Who Is It For */}
        <section className="nad-section nad-section-inverted">
          <div className="nad-container">
            <div className="nad-animate">
              <div className="v2-label"><span className="v2-dot" /> Who It&apos;s For</div>
              <h2>Signs Your NAD+ Levels<br />May Be Depleted.</h2>
              <div className="nad-divider"></div>
              <p className="nad-body-text">
                NAD+ depletion shows up in many ways. If any of these sound familiar, NAD+ therapy at our Orange County clinic may help.
              </p>
            </div>

            <div className="nad-tags-grid nad-animate">
              {tags.map((tag, i) => (
                <div key={i} className="nad-tag-pill">{tag}</div>
              ))}
            </div>
          </div>
        </section>

        {/* Protocols */}
        <section className="nad-section">
          <div className="nad-container">
            <div className="nad-animate">
              <div className="v2-label"><span className="v2-dot" /> Our Protocols</div>
              <h2>Two Proven Approaches<br />to Restore NAD+.</h2>
              <div className="nad-divider"></div>
              <p className="nad-body-text">
                We offer two clinical protocols for NAD+ restoration. Both are effective &mdash; the right choice depends on your goals and lifestyle.
              </p>
            </div>

            <div className="nad-protocols-grid">
              {protocols.map((protocol, i) => (
                <div key={i} className="nad-protocol-card nad-animate">
                  <div className="nad-protocol-header">
                    <div className="nad-protocol-name">{protocol.name}</div>
                    <div className="nad-protocol-meta">
                      <span>{protocol.duration}</span>
                      <span>{protocol.frequency}</span>
                    </div>
                  </div>
                  <p className="nad-protocol-desc">{protocol.desc}</p>
                  <ul className="nad-protocol-details">
                    {protocol.details.map((detail, j) => (
                      <li key={j}>{detail}</li>
                    ))}
                  </ul>
                  <div className="nad-protocol-best">{protocol.best}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="nad-section nad-section-alt">
          <div className="nad-container">
            <div className="nad-animate">
              <div className="v2-label"><span className="v2-dot" /> Why NAD+ Matters</div>
              <h2>What NAD+ Does<br />for Your Body.</h2>
              <div className="nad-divider"></div>
              <p className="nad-body-text">
                NAD+ isn't just another supplement &mdash; it's foundational to how your cells function.
              </p>
            </div>

            <div className="nad-benefits-grid">
              {benefits.map((benefit, i) => (
                <div key={i} className="nad-benefit-card nad-animate">
                  <div className="nad-benefit-number">{benefit.number}</div>
                  <div className="nad-benefit-title">{benefit.title}</div>
                  <div className="nad-benefit-desc">{benefit.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Research Section */}
        <section className="nad-section" id="nad-research">
          <div className="nad-container">
            <div className="nad-animate">
              <div className="v2-label"><span className="v2-dot" /> Backed by Science</div>
              <h2>Evidence-Based<br />Results</h2>
              <div className="nad-divider"></div>
              <p className="nad-body-text">
                We've summarized the peer-reviewed research. Click any study to get the full breakdown &mdash; free.
              </p>
            </div>

            <div className="nad-research-grid">
              {studies.map((study) => (
                <div
                  key={study.id}
                  className="nad-research-card nad-animate"
                  onClick={() => handleResearchClick(study.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="nad-research-category">{study.category}</div>
                  <h3 className="nad-research-headline">{study.headline}</h3>
                  <p className="nad-research-summary">{study.summary}</p>
                  <p className="nad-research-source">{study.sourceJournal}, {study.sourceYear}</p>
                </div>
              ))}
            </div>

            <p className="nad-research-disclaimer nad-animate">
              These studies reflect research findings. Individual results may vary. NAD+ therapy at Range Medical is provided under medical supervision with proper monitoring.
            </p>
          </div>
        </section>

        {/* Safety & Transparency */}
        <section className="nad-section">
          <div className="nad-container">
            <div className="nad-animate">
              <div className="v2-label"><span className="v2-dot" /> SAFETY & TRANSPARENCY</div>
              <h2>WHAT WE WANT YOU TO KNOW UPFRONT.</h2>
              <div className="nad-divider"></div>
              <p className="nad-body-text">
                NAD+ is one of the more intense IV infusions &mdash; you will likely feel something during the session. That is normal, expected, and manageable. Your nurse adjusts the drip rate to keep you comfortable.
              </p>
            </div>

            <div className="nad-safety-grid nad-animate">
              <div className="nad-safety-card">
                <div className="nad-safety-label">What You Will Likely Feel</div>
                <div className="nad-safety-items">
                  <div className="nad-safety-item">
                    <span className="nad-safety-icon">1</span>
                    <div>
                      <strong>Chest Tightness</strong>
                      <p>A heavy or constricting feeling in your chest during infusion. Not cardiac &mdash; it is the NAD+ itself. Goes away instantly when the drip slows.</p>
                    </div>
                  </div>
                  <div className="nad-safety-item">
                    <span className="nad-safety-icon">2</span>
                    <div>
                      <strong>Nausea</strong>
                      <p>Queasy stomach if the drip rate is too fast. Completely rate-dependent &mdash; slowing the drip fixes it every time.</p>
                    </div>
                  </div>
                  <div className="nad-safety-item">
                    <span className="nad-safety-icon">3</span>
                    <div>
                      <strong>Flushing & Warmth</strong>
                      <p>Warmth spreading through your body from NAD+-related vasodilation. Same mechanism as a niacin flush. Harmless.</p>
                    </div>
                  </div>
                  <div className="nad-safety-item">
                    <span className="nad-safety-icon">4</span>
                    <div>
                      <strong>Post-Session Fatigue</strong>
                      <p>Feeling tired after your session. Your body is using the NAD+ for cellular repair. The energy boost comes 24-48 hours later.</p>
                    </div>
                  </div>
                </div>
                <div className="nad-safety-guides">
                  <Link href="/nad-side-effects-guide" className="nad-safety-guide-link">Full NAD+ Side Effects Guide <span>&rarr;</span></Link>
                </div>
              </div>

              <div className="nad-safety-card nad-safety-card-dark">
                <div className="nad-safety-label">Who Should Discuss With Their Provider First</div>
                <div className="nad-safety-items">
                  <div className="nad-safety-item">
                    <span className="nad-safety-warn">!</span>
                    <p>Currently taking blood pressure medications (NAD+ can affect blood pressure)</p>
                  </div>
                  <div className="nad-safety-item">
                    <span className="nad-safety-warn">!</span>
                    <p>History of heart arrhythmias or cardiac conditions</p>
                  </div>
                  <div className="nad-safety-item">
                    <span className="nad-safety-warn">!</span>
                    <p>Pregnant or breastfeeding</p>
                  </div>
                  <div className="nad-safety-item">
                    <span className="nad-safety-warn">!</span>
                    <p>Active infections or fever</p>
                  </div>
                  <div className="nad-safety-item">
                    <span className="nad-safety-warn">!</span>
                    <p>Currently on chemotherapy or immunosuppressive medications</p>
                  </div>
                </div>
                <p className="nad-safety-note">NAD+ therapy is not FDA-approved for specific conditions. All infusions are administered and monitored by licensed medical professionals. We assess every patient before starting.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Real Results */}
        <section className="nad-section nad-section-inverted">
          <div className="nad-container">
            <div className="nad-animate">
              <div className="v2-label"><span className="v2-dot" /> Real Results</div>
              <h2>WHAT PATIENTS FEEL AFTER<br />THEIR FIRST PROTOCOL.</h2>
              <div className="nad-divider"></div>
              <p className="nad-body-text">
                These are real outcomes from real patients. Names withheld for privacy &mdash; results speak for themselves.
              </p>
            </div>

            <div className="nad-results-grid nad-animate">
              <div className="nad-result-card">
                <div className="nad-result-profile">Male, 48</div>
                <div className="nad-result-before">
                  <span className="nad-result-label">Before</span>
                  Brain fog every afternoon, couldn&apos;t focus past 2pm, relying on caffeine to get through the day.
                </div>
                <div className="nad-result-after">
                  <span className="nad-result-label">After 3 NAD+ Infusions</span>
                  Mental clarity sustained all day, caffeine intake cut in half, says he feels like his brain &ldquo;turned back on.&rdquo;
                </div>
              </div>
              <div className="nad-result-card">
                <div className="nad-result-profile">Female, 52</div>
                <div className="nad-result-before">
                  <span className="nad-result-label">Before</span>
                  Chronic fatigue despite 8 hours of sleep, aging faster than her peers, low motivation.
                </div>
                <div className="nad-result-after">
                  <span className="nad-result-label">After 4 NAD+ Sessions Over 2 Weeks</span>
                  Energy transformed, motivation returned, skin noticeably brighter, says she feels 10 years younger.
                </div>
              </div>
              <div className="nad-result-card">
                <div className="nad-result-profile">Male, 39</div>
                <div className="nad-result-before">
                  <span className="nad-result-label">Before</span>
                  Heavy drinker for 15 years, 6 months sober but still felt depleted, brain not bouncing back.
                </div>
                <div className="nad-result-after">
                  <span className="nad-result-label">After NAD+ Loading Protocol (4 Sessions)</span>
                  Cognitive recovery accelerated dramatically, sleep quality improved, says the infusions gave him back what alcohol took away.
                </div>
              </div>
            </div>

            <div className="nad-inaction nad-animate">
              <div className="nad-inaction-label">THE COST OF WAITING</div>
              <p>
                NAD+ levels drop by roughly 50% between ages 40 and 60. This decline directly impacts energy production, DNA repair, cognitive function, and cellular aging. Your body can&apos;t manufacture enough to keep up with demand. Every year you wait, the deficit grows. NAD+ therapy restores what your cells need to function at their best &mdash; but restoration is easier when you start before the tank hits empty.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="nad-section-alt">
          <div className="nad-container">
            <div className="v2-label"><span className="v2-dot" /> Questions</div>
            <h2>Common<br />Questions</h2>

            <div className="nad-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`nad-faq-item ${openFaq === index ? 'nad-faq-open' : ''}`}>
                  <button className="nad-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <span className="nad-faq-toggle">{openFaq === index ? '\u2212' : '+'}</span>
                  </button>
                  <div className="nad-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="nad-section nad-section-inverted nad-cta-section">
          <div className="nad-container">
            <div className="nad-animate">
              <div className="v2-label" style={{ marginBottom: '1.5rem', justifyContent: 'center' }}><span className="v2-dot" /> Next Steps</div>
              <h2 className="nad-cta-title">WHAT IF YOU COULD<br />THINK CLEARLY AGAIN?</h2>
              <p className="nad-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                Patients describe their first NAD+ infusion as a &ldquo;mental reset.&rdquo; The fog lifts. Energy returns. Focus sharpens. It&apos;s not magic &mdash; it&apos;s giving your brain the fuel it&apos;s been missing. Free assessment, no commitment required.
              </p>
              <div className="nad-cta-buttons">
                <Link href="/start" className="btn-white">Start Now</Link>
                <div className="nad-cta-or">or</div>
                <a href="tel:9499973988" className="nad-cta-phone">(949) 997-3988</a>
              </div>
            </div>
          </div>
        </section>

        <ResearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          study={selectedStudy}
          servicePage="nad-therapy"
        />
      </div>

      <style jsx>{`
        /* ===== NAD PAGE SCOPED STYLES — V2 ===== */
        .nad-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #1a1a1a;
          overflow-x: hidden;
        }

        /* Animations */
        .nad-animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        :global(.nad-animate.visible) {
          opacity: 1;
          transform: translateY(0);
        }

        /* Container */
        .nad-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        /* Sections */
        .nad-section {
          padding: 6rem 2rem;
        }

        .nad-section-alt {
          background: #fafafa;
          padding: 6rem 2rem;
        }

        .nad-section-inverted {
          background: #1a1a1a;
          color: #ffffff;
        }

        .nad-section-inverted h2 {
          color: #ffffff;
        }

        .nad-section-inverted h3 {
          color: #ffffff;
        }

        /* Body Text */
        .nad-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.75;
          color: #737373;
          max-width: 600px;
        }

        .nad-section-inverted .nad-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider */
        .nad-divider {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin: 1.25rem 0;
        }

        .nad-section-inverted .nad-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        .nad-section-inverted :global(.v2-label) {
          color: rgba(255, 255, 255, 0.45);
        }

        .nad-section-inverted :global(.v2-dot) {
          background: rgba(255, 255, 255, 0.45);
        }

        .nad-section-inverted p,
        .nad-section-inverted li {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Hero */
        .nad-hero {
          padding: 6rem 2rem 7rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .nad-hero h1 {
          max-width: 800px;
          margin-bottom: 2rem;
        }

        .nad-hero-rule {
          width: 100%;
          max-width: 700px;
          height: 1px;
          background: #e0e0e0;
          margin: 2rem 0;
        }

        .nad-hero .nad-body-text {
          max-width: 520px;
        }

        .nad-hero-scroll {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #737373;
          margin-top: 3rem;
        }

        .nad-hero-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: nad-bounce 2s ease-in-out infinite;
        }

        @keyframes nad-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* Stat Row */
        .nad-stat-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .nad-stat-item {
          text-align: center;
        }

        .nad-stat-number {
          font-size: 2.75rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #808080;
        }

        .nad-stat-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #737373;
          line-height: 1.5;
        }

        /* Mechanism Cards */
        .nad-mechanism-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-top: 2.5rem;
          border-top: 1px solid #e0e0e0;
        }

        .nad-mechanism-card {
          padding: 2rem;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          background: #ffffff;
          transition: background 0.2s ease;
        }

        .nad-mechanism-card:nth-child(2n) {
          border-right: none;
        }

        .nad-mechanism-card:hover {
          background: #fafafa;
        }

        .nad-mechanism-number {
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #808080;
          margin-bottom: 1rem;
        }

        .nad-mechanism-card h3 {
          font-size: 1.125rem;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 0.75rem;
        }

        .nad-mechanism-card p {
          font-size: 0.875rem;
          line-height: 1.75;
          color: #737373;
        }

        .nad-science-note {
          font-size: 0.9375rem;
          color: #737373;
          text-align: center;
          max-width: 700px;
          margin: 2.5rem auto 0;
          line-height: 1.75;
          padding: 1.5rem;
          background: #fafafa;
          border: 1px solid #e0e0e0;
        }

        /* Tags */
        .nad-tags-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
          margin-top: 2rem;
        }

        .nad-tag-pill {
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.2s ease;
        }

        .nad-tag-pill:hover {
          border-color: rgba(255, 255, 255, 0.25);
        }

        /* Protocol Cards */
        .nad-protocols-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-top: 2.5rem;
          border-top: 1px solid #e0e0e0;
        }

        .nad-protocol-card {
          padding: 2rem;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          background: #ffffff;
          transition: background 0.2s ease;
        }

        .nad-protocol-card:nth-child(2n) {
          border-right: none;
        }

        .nad-protocol-card:hover {
          background: #fafafa;
        }

        .nad-protocol-header {
          margin-bottom: 1rem;
        }

        .nad-protocol-name {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .nad-protocol-meta {
          display: flex;
          gap: 1rem;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #808080;
        }

        .nad-protocol-desc {
          font-size: 0.9375rem;
          line-height: 1.75;
          color: #737373;
          margin-bottom: 1.25rem;
        }

        .nad-protocol-details {
          list-style: none;
          padding: 0;
          margin: 0 0 1.5rem 0;
        }

        .nad-protocol-details li {
          font-size: 0.875rem;
          color: #737373;
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
          border-bottom: 1px solid #f5f5f5;
        }

        .nad-protocol-details li:last-child {
          border-bottom: none;
        }

        .nad-protocol-details li::before {
          content: "–";
          position: absolute;
          left: 0;
          color: #808080;
          font-weight: 700;
        }

        .nad-protocol-best {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #737373;
          font-style: italic;
        }

        /* Benefit Cards */
        .nad-benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-top: 2.5rem;
          border-top: 1px solid #e0e0e0;
        }

        .nad-benefit-card {
          padding: 2rem;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          background: #ffffff;
          transition: background 0.2s ease;
        }

        .nad-benefit-card:nth-child(2n) {
          border-right: none;
        }

        .nad-benefit-card:hover {
          background: #fafafa;
        }

        .nad-benefit-number {
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #808080;
          margin-bottom: 1rem;
        }

        .nad-benefit-title {
          font-size: 1.125rem;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 0.75rem;
        }

        .nad-benefit-desc {
          font-size: 0.875rem;
          line-height: 1.75;
          color: #737373;
        }

        /* Research Cards */
        .nad-research-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-top: 2.5rem;
          border-top: 1px solid #e0e0e0;
        }

        .nad-research-card {
          padding: 2rem;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          background: #ffffff;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .nad-research-card:nth-child(2n) {
          border-right: none;
        }

        .nad-research-card:hover {
          background: #fafafa;
        }

        .nad-research-category {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #808080;
          margin-bottom: 0.875rem;
        }

        .nad-research-headline {
          font-size: 1.0625rem;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .nad-research-summary {
          font-size: 0.875rem;
          line-height: 1.75;
          color: #737373;
          margin-bottom: 1rem;
        }

        .nad-research-source {
          font-size: 0.8125rem;
          font-style: italic;
          color: #737373;
        }

        .nad-research-disclaimer {
          font-size: 0.8125rem;
          color: #737373;
          text-align: center;
          max-width: 700px;
          margin: 3rem auto 0;
          line-height: 1.75;
        }

        /* FAQ */
        .nad-faq-list {
          max-width: 700px;
          margin: 2rem auto 0;
        }

        .nad-faq-item {
          border-bottom: 1px solid #e0e0e0;
        }

        .nad-faq-item:last-child {
          border-bottom: none;
        }

        .nad-faq-question {
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

        .nad-faq-question span {
          font-size: 1rem;
          font-weight: 600;
          color: #1a1a1a;
          padding-right: 1rem;
        }

        .nad-faq-toggle {
          flex-shrink: 0;
          font-size: 1.25rem;
          font-weight: 300;
          color: #737373;
          width: 24px;
          text-align: center;
        }

        .nad-faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }

        .nad-faq-open .nad-faq-answer {
          max-height: 300px;
          padding-bottom: 1.25rem;
        }

        .nad-faq-answer p {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.75;
          margin: 0;
        }

        /* CTA Section */
        .nad-cta-section {
          padding: 6rem 2rem;
          text-align: center;
        }

        .nad-cta-title {
          color: #ffffff;
          margin-bottom: 1.25rem;
        }

        .nad-cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .nad-cta-or {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.25);
        }

        .nad-cta-phone {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 2px;
          transition: border-color 0.2s ease;
        }

        .nad-cta-phone:hover {
          border-color: rgba(255, 255, 255, 0.6);
        }

        /* Safety & Transparency */
        .nad-safety-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 2.5rem;
        }
        .nad-safety-card {
          border: 1px solid #e0e0e0;
          padding: 2rem;
          background: #ffffff;
        }
        .nad-safety-card-dark {
          background: #0a0a0a;
          border-color: #0a0a0a;
          color: #ffffff;
        }
        .nad-safety-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #737373;
          margin-bottom: 1.5rem;
        }
        .nad-safety-card-dark .nad-safety-label {
          color: rgba(255,255,255,0.5);
        }
        .nad-safety-items {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .nad-safety-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 0.875rem 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .nad-safety-card-dark .nad-safety-item {
          border-bottom-color: rgba(255,255,255,0.1);
        }
        .nad-safety-item:last-child {
          border-bottom: none;
        }
        .nad-safety-icon {
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
        .nad-safety-warn {
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
        .nad-safety-item strong {
          display: block;
          font-size: 0.9rem;
          color: #171717;
          margin-bottom: 0.125rem;
        }
        .nad-safety-item p {
          font-size: 0.8125rem;
          line-height: 1.6;
          color: #737373;
          margin: 0;
        }
        .nad-safety-card-dark .nad-safety-item p {
          color: rgba(255,255,255,0.7);
        }
        .nad-safety-guides {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e0e0e0;
        }
        .nad-safety-guide-link {
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
        .nad-safety-guide-link:hover {
          border-color: #171717;
        }
        .nad-safety-guide-link span {
          transition: transform 0.2s;
        }
        .nad-safety-guide-link:hover span {
          transform: translateX(3px);
        }
        .nad-safety-note {
          font-size: 0.8125rem;
          color: rgba(255,255,255,0.5);
          margin-top: 1.25rem;
          line-height: 1.6;
        }

        /* Real Results */
        .nad-results-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-top: 2.5rem;
        }
        .nad-result-card {
          padding: 2rem;
          border-right: 1px solid rgba(255,255,255,0.1);
        }
        .nad-result-card:last-child {
          border-right: none;
        }
        .nad-result-profile {
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 1.25rem;
          font-weight: 600;
        }
        .nad-result-before,
        .nad-result-after {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.7);
          margin-bottom: 1rem;
        }
        .nad-result-after {
          color: rgba(255,255,255,0.95);
        }
        .nad-result-label {
          display: block;
          font-size: 0.6875rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.3);
        }
        .nad-result-after .nad-result-label {
          color: #4ade80;
        }
        .nad-inaction {
          margin-top: 3rem;
          padding: 2rem 2.5rem;
          border-left: 3px solid rgba(255,255,255,0.15);
        }
        .nad-inaction-label {
          font-size: 0.6875rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 700;
          color: rgba(255,255,255,0.35);
          margin-bottom: 0.75rem;
        }
        .nad-inaction p {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.7);
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .nad-section {
            padding: 4rem 1.5rem;
          }

          .nad-section-alt {
            padding: 4rem 1.5rem;
          }

          .nad-hero {
            padding: 4rem 1.5rem;
          }

          .nad-stat-row {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .nad-mechanism-grid {
            grid-template-columns: 1fr;
          }

          .nad-mechanism-card {
            border-right: none;
          }

          .nad-protocols-grid {
            grid-template-columns: 1fr;
          }

          .nad-protocol-card {
            border-right: none;
          }

          .nad-benefits-grid {
            grid-template-columns: 1fr;
          }

          .nad-benefit-card {
            border-right: none;
          }

          .nad-research-grid {
            grid-template-columns: 1fr;
          }

          .nad-research-card {
            border-right: none;
          }

          .nad-results-grid {
            grid-template-columns: 1fr;
          }
          .nad-result-card {
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding: 1.5rem 0;
          }
          .nad-result-card:last-child {
            border-bottom: none;
          }
          .nad-inaction {
            padding: 1.5rem;
          }

          .nad-safety-grid {
            grid-template-columns: 1fr;
          }

          .nad-cta-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </Layout>
  );
}
