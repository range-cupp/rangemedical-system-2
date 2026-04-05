// pages/iv-therapy.jsx
// IV Therapy - Full service page with site nav/footer

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { getStudiesByService } from '../data/researchStudies';

export default function IVTherapy() {
  const [openFaq, setOpenFaq] = useState(null);
  const studies = getStudiesByService('iv-therapy');

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

    const elements = document.querySelectorAll('.iv-page .iv-animate');
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
      question: "Do I need an appointment?",
      answer: "Walk-ins are welcome for established patients. New patients should book a quick screening first to make sure IV therapy is appropriate for you. Most people can get started the same day."
    },
    {
      question: "How long does an IV take?",
      answer: "Most IVs take 30-60 minutes depending on the formulation and your hydration status. Bring a book, laptop, or just relax — we have comfortable chairs and Wi-Fi."
    },
    {
      question: "How often should I get an IV?",
      answer: "It depends on your goals. Some patients come weekly for performance or recovery support. Others come monthly for maintenance. We'll recommend a frequency based on your situation."
    },
    {
      question: "Is IV therapy safe?",
      answer: "Yes, when administered by trained medical professionals using sterile technique and pharmaceutical-grade nutrients. We screen all patients and monitor you throughout your infusion."
    },
    {
      question: "Will I feel results right away?",
      answer: "Most people notice improved energy and hydration within hours of their IV. The full benefits of certain nutrients (like glutathione for detox) may develop over 24-48 hours."
    },
    {
      question: "Can I customize my IV?",
      answer: "Yes. We can add specific vitamins, minerals, or amino acids to any IV based on your needs. Talk to your provider about customization options."
    }
  ];


  const benefits = [
    { number: "01", title: "100% Absorption", desc: "IV delivery bypasses the digestive system, delivering nutrients directly to your bloodstream. No loss from poor gut absorption or first-pass metabolism." },
    { number: "02", title: "Rapid Results", desc: "Feel the effects within hours, not days. IV therapy provides immediate hydration and nutrient delivery when your body needs it most." },
    { number: "03", title: "Higher Doses", desc: "IV allows therapeutic doses that aren't possible orally. High-dose Vitamin C, for example, reaches blood levels 50-70x higher than oral supplementation." },
    { number: "04", title: "Cellular Hydration", desc: "Proper hydration at the cellular level supports every system in your body — from cognitive function to physical performance to skin health." },
    { number: "05", title: "Immune Support", desc: "Key nutrients like Vitamin C, Zinc, and Glutathione support your immune system's ability to fight infections and recover from illness." },
    { number: "06", title: "Recovery & Performance", desc: "Athletes and active individuals use IV therapy to speed recovery, reduce inflammation, and maintain peak performance." }
  ];

  const signatureIVs = [
    {
      name: "Immune Defense IV",
      icon: "🛡️",
      ingredients: ["Vitamin C", "Zinc", "Glutathione", "B-Complex", "Magnesium"],
      description: "Immune support, antioxidant protection, and infection defense."
    },
    {
      name: "Energy & Vitality IV",
      icon: "⚡",
      ingredients: ["B12", "B-Complex", "L-Carnitine", "Magnesium", "Vitamin C"],
      description: "Energy production, reduced fatigue, and metabolic support."
    },
    {
      name: "Muscle Recovery & Performance IV",
      icon: "💪",
      ingredients: ["Amino Acids", "Magnesium", "B-Complex", "Vitamin C", "Glutathione"],
      description: "Muscle repair, recovery acceleration, and stress reduction."
    },
    {
      name: "Detox & Cellular Repair IV",
      icon: "🧬",
      ingredients: ["Glutathione", "Vitamin C", "NAC", "Zinc", "Magnesium"],
      description: "Liver support, oxidative stress defense, and cellular repair."
    }
  ];

  const availableNutrients = [
    { name: "Vitamin C", benefit: "Immune support, antioxidant" },
    { name: "B-Complex", benefit: "Energy, metabolism" },
    { name: "B12", benefit: "Energy, mood, nerves" },
    { name: "Magnesium", benefit: "Muscle, sleep, recovery" },
    { name: "Zinc", benefit: "Immune, skin, healing" },
    { name: "Amino Acids", benefit: "Muscle, recovery" },
    { name: "L-Carnitine", benefit: "Fat metabolism, energy" },
    { name: "NAC", benefit: "Liver support, antioxidant" },
    { name: "Calcium", benefit: "Bone, muscle, nerve" },
    { name: "Biotin", benefit: "Hair, skin, nails" }
  ];

  const glutathioneIVs = [
    { dose: "1g", price: "$170" },
    { dose: "2g", price: "$190" },
    { dose: "3g", price: "$215" }
  ];

  const tags = [
    "Low Energy / Fatigue",
    "Frequent Illness",
    "Slow Recovery",
    "Dehydration",
    "Jet Lag / Travel",
    "Hangover Recovery",
    "Athletic Performance",
    "General Wellness"
  ];


  return (
    <Layout
      title="IV Therapy | Vitamin Infusions | Newport Beach | Range Medical"
      description="IV vitamin therapy in Newport Beach. The Range IV delivers 5 essential nutrients directly to your bloodstream. Walk-ins welcome for established patients."
    >
      <Head>
        {/* Basic Meta Tags */}
        <meta name="keywords" content="IV therapy Newport Beach, vitamin IV Orange County, IV drip, hydration therapy, glutathione IV, vitamin C IV, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/iv-therapy" />

        {/* Open Graph */}
        <meta property="og:title" content="IV Therapy | Vitamin Infusions | Newport Beach" />
        <meta property="og:description" content="IV vitamin therapy delivering nutrients directly to your bloodstream. Walk-ins welcome in Newport Beach." />
        <meta property="og:url" content="https://www.range-medical.com/iv-therapy" />
        <meta property="og:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="IV Therapy | Vitamin Infusions | Newport Beach" />
        <meta name="twitter:description" content="IV vitamin therapy delivering nutrients directly to your bloodstream. Newport Beach." />
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
                "name": "IV Therapy",
                "description": "IV vitamin infusion therapy delivering essential nutrients directly to the bloodstream for rapid absorption, hydration, and wellness support.",
                "url": "https://www.range-medical.com/iv-therapy",
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
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">Walk-ins Welcome</span>
        </div>
      </div>

      <div className="iv-page">
        {/* Hero */}
        <section className="iv-hero">
          <div className="v2-label"><span className="v2-dot" /> IV THERAPY</div>
          <h1>DEHYDRATED, DRAINED, OR HUNGOVER? ONE SESSION CHANGES EVERYTHING.</h1>
          <div className="iv-hero-rule"></div>
          <p className="iv-body-text">Clinical-grade IV therapy delivers vitamins, minerals, and amino acids straight to your bloodstream &mdash; 100% absorption, zero gut issues. Walk in running on empty, walk out recharged. Newport Beach.</p>
          <div className="iv-hero-scroll">
            Scroll to explore
            <span>↓</span>
          </div>
        </section>

        {/* What Is It */}
        <section className="iv-section iv-section-alt">
          <div className="iv-container">
            <div className="iv-animate">
              <div className="v2-label"><span className="v2-dot" /> WHAT IS IV THERAPY</div>
              <h2>SKIP THE GUT. FEED YOUR CELLS DIRECTLY.</h2>
              <div className="iv-divider"></div>
              <p className="iv-body-text">
                When you take vitamins orally, you lose 20-80% to digestion. IV therapy bypasses your GI tract entirely, delivering nutrients directly to your bloodstream where your cells can use them immediately.
              </p>
              <p className="iv-body-text" style={{ marginTop: '1rem' }}>
                At Range Medical in Newport Beach, we offer IV therapy for energy, immune support, recovery, and general wellness. Whether you're fighting fatigue, recovering from travel, or optimizing performance — IV therapy gets nutrients where they need to go.
              </p>
            </div>

            <div className="iv-stat-row">
              <div className="iv-stat-item iv-animate">
                <div className="iv-stat-number">100%</div>
                <div className="iv-stat-label">Bioavailability<br />with IV delivery</div>
              </div>
              <div className="iv-stat-item iv-animate">
                <div className="iv-stat-number">30-60</div>
                <div className="iv-stat-label">Minutes per session<br />comfortable & relaxing</div>
              </div>
              <div className="iv-stat-item iv-animate">
                <div className="iv-stat-number">5</div>
                <div className="iv-stat-label">Key nutrients<br />in the Range IV</div>
              </div>
            </div>
          </div>
        </section>

        {/* The Range IV */}
        <section className="iv-section">
          <div className="iv-container">
            <div className="iv-animate">
              <div className="v2-label"><span className="v2-dot" /> OUR SIGNATURE IV</div>
              <h2>THE RANGE IV</h2>
              <div className="iv-divider"></div>
              <p className="iv-body-text">
                Our signature IV delivers 5 essential vitamins and minerals chosen for their synergistic effects on energy, immunity, and recovery. This is our most popular formulation.
              </p>
            </div>

            <div className="iv-range-card iv-animate">
              <div className="iv-range-header">
                <div className="iv-range-badge">SIGNATURE FORMULA</div>
                <h3>A balanced blend for everyday wellness</h3>
              </div>
              <p className="iv-range-desc">
                The Range IV combines 5 essential vitamins and minerals selected for their synergistic effects on energy, immune function, and recovery. It's our go-to recommendation for patients looking for general wellness support, a post-travel reset, or regular maintenance.
              </p>
              <div className="iv-range-footer">
                <p>Add-ons available. Ask your provider about customization based on your specific needs.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Signature Formulas */}
        <section className="iv-section iv-section-alt">
          <div className="iv-container">
            <div className="iv-animate">
              <div className="v2-label"><span className="v2-dot" /> CHOOSE YOUR FORMULA</div>
              <h2>4 SIGNATURE FORMULAS</h2>
              <div className="iv-divider"></div>
              <p className="iv-body-text">
                Not sure where to start? Pick from one of our pre-built formulas — each one is a curated combination of 5 vitamins and minerals designed for a specific goal. All $225 per session.
              </p>
            </div>

            <div className="iv-formulas-grid">
              {signatureIVs.map((iv, i) => (
                <div key={i} className="iv-formula-card iv-animate">
                  <h3 className="iv-formula-name">{iv.name}</h3>
                  <p className="iv-formula-desc">{iv.description}</p>
                  <div className="iv-formula-ingredients">
                    {iv.ingredients.map((ing, j) => (
                      <span key={j} className="iv-formula-pill">{ing}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="iv-formulas-note iv-animate">
              <p>Want more than 5? Add on any additional nutrient for <strong>$35 each</strong>. Your nurse will help you customize based on your symptoms and goals.</p>
            </div>
          </div>
        </section>

        {/* Available Vitamins & Minerals */}
        <section className="iv-section">
          <div className="iv-container">
            <div className="iv-animate">
              <div className="v2-label"><span className="v2-dot" /> AVAILABLE NUTRIENTS</div>
              <h2>BUILD YOUR OWN OR ADD ON.</h2>
              <div className="iv-divider"></div>
              <p className="iv-body-text">
                Every Range IV includes 5 of these vitamins and minerals. Want more? Add any extra for $35 each.
              </p>
            </div>

            <div className="iv-nutrients-grid iv-animate">
              {availableNutrients.map((nutrient, i) => (
                <div key={i} className="iv-nutrient-card">
                  <div className="iv-nutrient-name">{nutrient.name}</div>
                  <div className="iv-nutrient-benefit">{nutrient.benefit}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Glutathione IV */}
        <section className="iv-section iv-section-alt">
          <div className="iv-container">
            <div className="iv-animate">
              <div className="v2-label"><span className="v2-dot" /> STANDALONE IV</div>
              <h2>GLUTATHIONE IV</h2>
              <div className="iv-divider"></div>
              <p className="iv-body-text">
                Glutathione is the body's master antioxidant — critical for detox, liver function, immune support, and skin health. Available as a standalone IV push, separate from the Range IV.
              </p>
            </div>

            <div className="iv-glut-grid iv-animate">
              {glutathioneIVs.map((g, i) => (
                <div key={i} className="iv-glut-card">
                  <div className="iv-glut-dose">{g.dose}</div>
                  <div className="iv-glut-price">{g.price}</div>
                </div>
              ))}
            </div>

            <p className="iv-glut-note iv-animate">
              Administered as a direct IV push. Quick — typically just a few minutes.
            </p>
          </div>
        </section>

        {/* Who Is It For */}
        <section className="iv-section iv-section-inverted">
          <div className="iv-container">
            <div className="iv-animate">
              <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)' }}><span className="v2-dot" /> WHO IT'S FOR</div>
              <h2>FEEL BETTER FASTER.</h2>
              <div className="iv-divider"></div>
              <p className="iv-body-text">
                IV therapy helps a wide range of people. If any of these sound familiar, you might benefit from a session at our Newport Beach clinic.
              </p>
            </div>

            <div className="iv-tags-grid iv-animate">
              {tags.map((tag, i) => (
                <div key={i} className="iv-tag-pill">{tag}</div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="iv-section iv-section-alt">
          <div className="iv-container">
            <div className="iv-animate">
              <div className="v2-label"><span className="v2-dot" /> WHY IV THERAPY WORKS</div>
              <h2>THE SCIENCE OF DIRECT DELIVERY.</h2>
              <div className="iv-divider"></div>
              <p className="iv-body-text">
                IV therapy isn't just about convenience — it's about efficacy. Here's why direct nutrient delivery makes a difference.
              </p>
            </div>

            <div className="iv-benefits-grid">
              {benefits.map((benefit, i) => (
                <div key={i} className="iv-benefit-card iv-animate">
                  <div className="iv-benefit-number">{benefit.number}</div>
                  <div className="iv-benefit-title">{benefit.title}</div>
                  <div className="iv-benefit-desc">{benefit.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Research Section */}
        <section className="iv-section" id="iv-research">
          <div className="iv-container">
            <div className="iv-animate">
              <div className="v2-label"><span className="v2-dot" /> BACKED BY SCIENCE</div>
              <h2>EVIDENCE-BASED RESULTS</h2>
              <div className="iv-divider"></div>
              <p className="iv-body-text">
                We've summarized the peer-reviewed research. Click any study to get the full breakdown — free.
              </p>
            </div>

            <div className="iv-research-grid">
              {studies.map((study) => (
                <div
                  key={study.id}
                  className="iv-research-card iv-animate"
                  onClick={() => window.location.href = '/research/' + study.id}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="iv-research-category">{study.category}</div>
                  <h3 className="iv-research-headline">{study.headline}</h3>
                  <p className="iv-research-summary">{study.summary}</p>
                  <p className="iv-research-source">{study.sourceJournal}, {study.sourceYear}</p>
                </div>
              ))}
            </div>

            <p className="iv-research-disclaimer iv-animate">
              These studies reflect research findings. Individual results may vary. IV therapy at Range Medical is provided under medical supervision.
            </p>
          </div>
        </section>

        {/* Safety & Transparency */}
        <section className="iv-section">
          <div className="iv-container">
            <div className="iv-animate">
              <div className="v2-label"><span className="v2-dot" /> SAFETY & TRANSPARENCY</div>
              <h2>WHAT WE WANT YOU TO KNOW UPFRONT.</h2>
              <div className="iv-divider"></div>
              <p className="iv-body-text">
                IV therapy is one of the safest treatments we offer. Your nurse monitors you throughout every session. Here is what you might notice.
              </p>
            </div>

            <div className="iv-safety-grid iv-animate">
              <div className="iv-safety-card">
                <div className="iv-safety-label">What You Might Notice</div>
                <div className="iv-safety-items">
                  <div className="iv-safety-item">
                    <span className="iv-safety-icon">1</span>
                    <div>
                      <strong>Vein Discomfort</strong>
                      <p>Mild tenderness or bruising at the IV site. Normal and resolves in a few days.</p>
                    </div>
                  </div>
                  <div className="iv-safety-item">
                    <span className="iv-safety-icon">2</span>
                    <div>
                      <strong>Flushing or Warmth</strong>
                      <p>Brief warmth from B-vitamins or NAD+. A pharmacological response, not an allergic reaction.</p>
                    </div>
                  </div>
                  <div className="iv-safety-item">
                    <span className="iv-safety-icon">3</span>
                    <div>
                      <strong>Metallic Taste</strong>
                      <p>Some formulas (glutathione, vitamin C) create a brief taste during infusion. Harmless and temporary.</p>
                    </div>
                  </div>
                  <div className="iv-safety-item">
                    <span className="iv-safety-icon">4</span>
                    <div>
                      <strong>Lightheadedness</strong>
                      <p>Usually from skipping meals before your session or standing up too quickly afterward.</p>
                    </div>
                  </div>
                </div>
                <div className="iv-safety-guides">
                  <Link href="/iv-therapy-side-effects-guide" className="iv-safety-guide-link">Full IV Therapy Side Effects Guide <span>&rarr;</span></Link>
                </div>
              </div>

              <div className="iv-safety-card iv-safety-card-dark">
                <div className="iv-safety-label">Who Should Tell Us Before Receiving IV Therapy</div>
                <div className="iv-safety-items">
                  <div className="iv-safety-item">
                    <span className="iv-safety-warn">!</span>
                    <p>Kidney disease or impaired kidney function (affects how your body processes IV nutrients)</p>
                  </div>
                  <div className="iv-safety-item">
                    <span className="iv-safety-warn">!</span>
                    <p>Heart failure or fluid overload conditions (IV fluids add volume)</p>
                  </div>
                  <div className="iv-safety-item">
                    <span className="iv-safety-warn">!</span>
                    <p>G6PD deficiency (high-dose vitamin C can cause hemolysis)</p>
                  </div>
                  <div className="iv-safety-item">
                    <span className="iv-safety-warn">!</span>
                    <p>Currently on blood thinners or chemotherapy (timing and formulation adjustments may be needed)</p>
                  </div>
                  <div className="iv-safety-item">
                    <span className="iv-safety-warn">!</span>
                    <p>Pregnant or breastfeeding</p>
                  </div>
                </div>
                <p className="iv-safety-note">These are not necessarily disqualifying — but we need to know so we can adjust your protocol. We screen everyone before their first infusion.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Real Results */}
        <section className="iv-section iv-section-inverted">
          <div className="iv-container">
            <div className="iv-animate">
              <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)' }}><span className="v2-dot" /> REAL RESULTS</div>
              <h2>WHAT ONE SESSION CAN DO.</h2>
              <div className="iv-divider"></div>
              <p className="iv-body-text">
                These are real outcomes from Range Medical patients. Names omitted for privacy. Results vary by individual.
              </p>
            </div>

            <div className="iv-results-grid iv-animate">
              <div className="iv-result-card">
                <div className="iv-result-profile">Female, 35</div>
                <div className="iv-result-before">
                  <span className="iv-result-label">Before</span>
                  Chronic fatigue despite a good diet and consistent sleep. Brain fog every afternoon. Tried every supplement on the shelf — nothing moved the needle.
                </div>
                <div className="iv-result-after">
                  <span className="iv-result-label">After 4 Weekly IVs</span>
                  Energy stabilized all day. Brain fog cleared. Says she finally feels like her supplements are "actually working" now that her baseline is restored.
                </div>
              </div>
              <div className="iv-result-card">
                <div className="iv-result-profile">Male, 42</div>
                <div className="iv-result-before">
                  <span className="iv-result-label">Before</span>
                  Training for a marathon but hitting a wall at mile 16. Recovery taking 3+ days between long runs. Couldn't break through the plateau.
                </div>
                <div className="iv-result-after">
                  <span className="iv-result-label">After Weekly IVs During Training Block</span>
                  Broke through the wall. Recovery down to 24 hours. PR'd his marathon by 12 minutes.
                </div>
              </div>
              <div className="iv-result-card">
                <div className="iv-result-profile">Female, 29</div>
                <div className="iv-result-before">
                  <span className="iv-result-label">Before</span>
                  Frequent migraines, chronically dehydrated despite drinking "tons of water," dull skin. Energy crashed by 2pm daily.
                </div>
                <div className="iv-result-after">
                  <span className="iv-result-label">After Monthly IV Sessions</span>
                  Migraines reduced from weekly to rare. Skin visibly brighter. Energy consistent throughout the day.
                </div>
              </div>
            </div>

            <div className="iv-inaction iv-animate">
              <div className="iv-inaction-label">THE COST OF WAITING</div>
              <p>Your gut absorbs only 20-40% of oral supplements. The rest is wasted. Meanwhile, stress, caffeine, alcohol, and processed food deplete your reserves faster than you can replenish them. IV therapy isn't a luxury — it's the most efficient way to give your body what it's been missing.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="iv-section iv-section-alt">
          <div className="iv-container">
            <div className="v2-label"><span className="v2-dot" /> QUESTIONS</div>
            <h2>COMMON QUESTIONS</h2>

            <div className="iv-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`iv-faq-item ${openFaq === index ? 'iv-faq-open' : ''}`}>
                  <button className="iv-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <span className="iv-faq-toggle">{openFaq === index ? '\u2212' : '+'}</span>
                  </button>
                  <div className="iv-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="iv-section iv-section-inverted iv-cta-section">
          <div className="iv-container">
            <div className="iv-animate">
              <div className="v2-label" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}><span className="v2-dot" /> NEXT STEPS</div>
              <h2 className="iv-cta-title">STOP RUNNING ON EMPTY.</h2>
              <p className="iv-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                Most people are chronically dehydrated and nutrient-depleted without knowing it. One session and you'll feel the difference. Walk in tired, walk out recharged. $197 assessment, credited toward treatment.
              </p>
              <div className="iv-cta-buttons">
                <Link href="/range-assessment" className="iv-btn-primary">Book Your Range Assessment</Link>
                <div className="iv-cta-or">or</div>
                <a href="tel:9499973988" className="iv-cta-phone">(949) 997-3988</a>
              </div>
            </div>
          </div>
        </section>

      </div>

      <style jsx>{`
        /* ===== IV PAGE V2 EDITORIAL DESIGN ===== */
        .iv-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          overflow-x: hidden;
        }

        /* Animations */
        .iv-animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        :global(.iv-animate.visible) {
          opacity: 1;
          transform: translateY(0);
        }

        /* Container */
        .iv-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        /* Sections */
        .iv-section {
          padding: 6rem 2rem;
        }

        .iv-section-alt {
          background: #fafafa;
          padding: 6rem 2rem;
        }

        .iv-section-inverted {
          background: #1a1a1a;
          color: #ffffff;
        }

        /* Headlines */
        .iv-page h1 {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          color: #171717;
        }

        .iv-page h2 {
          font-size: 2.25rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 0.95;
          text-transform: uppercase;
          color: #171717;
          margin-bottom: 1rem;
        }

        .iv-page h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        .iv-section-inverted h1,
        .iv-section-inverted h2,
        .iv-section-inverted h3 {
          color: #ffffff;
        }

        /* Body Text */
        .iv-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #737373;
          max-width: 600px;
        }

        .iv-section-inverted .iv-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider */
        .iv-divider {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin: 1.25rem 0;
        }

        .iv-section-inverted .iv-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Buttons */
        .iv-btn-primary {
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
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .iv-btn-primary:hover {
          background: #e0e0e0;
          transform: translateY(-1px);
        }

        /* Hero */
        .iv-hero {
          padding: 6rem 2rem 5rem;
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 1200px;
          margin: 0 auto;
        }

        .iv-hero h1 {
          max-width: 680px;
          margin-bottom: 1.5rem;
        }

        .iv-hero-rule {
          width: 48px;
          height: 1px;
          background: #e0e0e0;
          margin-bottom: 1.5rem;
        }

        .iv-hero .iv-body-text {
          text-align: left;
          margin: 0 0 2.5rem 0;
        }

        .iv-hero-scroll {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #737373;
          margin-top: 2rem;
        }

        .iv-hero-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: iv-bounce 2s ease-in-out infinite;
        }

        @keyframes iv-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* Stat Row */
        .iv-stat-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .iv-stat-item {
          text-align: center;
        }

        .iv-stat-number {
          font-size: 2.75rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #808080;
        }

        .iv-stat-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #737373;
          line-height: 1.5;
        }

        /* Range IV Card */
        .iv-range-card {
          margin-top: 2.5rem;
          padding: 2.5rem;
          border-radius: 0;
          border: 1px solid #e0e0e0;
          background: #ffffff;
          box-shadow: none;
        }

        .iv-range-header {
          margin-bottom: 1.5rem;
        }

        .iv-range-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          padding: 0.375rem 0.75rem;
          background: #1a1a1a;
          color: #ffffff;
          border-radius: 0;
          margin-bottom: 0.75rem;
        }

        .iv-range-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #171717;
        }

        .iv-range-desc {
          font-size: 1rem;
          line-height: 1.7;
          color: #737373;
          margin: 0;
        }

        .iv-range-footer {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e0e0e0;
        }

        .iv-range-footer p {
          font-size: 0.875rem;
          color: #737373;
          text-align: center;
        }

        /* Signature Formulas Grid */
        .iv-formulas-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-top: 2.5rem;
          border: 1px solid #e0e0e0;
        }

        .iv-formula-card {
          padding: 2rem;
          border-radius: 0;
          border: none;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          background: #ffffff;
          box-shadow: none;
          transition: background 0.2s ease;
        }

        .iv-formula-card:nth-child(2n) {
          border-right: none;
        }

        .iv-formula-card:nth-last-child(-n+2) {
          border-bottom: none;
        }

        .iv-formula-card:hover {
          background: #fafafa;
        }

        .iv-formula-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.5rem;
        }

        .iv-formula-desc {
          font-size: 0.875rem;
          line-height: 1.6;
          color: #737373;
          margin-bottom: 1rem;
        }

        .iv-formula-ingredients {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }

        .iv-formula-pill {
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 0.375rem 0.75rem;
          border-radius: 0;
          background: #f5f5f5;
          color: #737373;
          border: 1px solid #e0e0e0;
        }

        .iv-formulas-note {
          margin-top: 2rem;
          padding: 1.25rem 1.5rem;
          border-radius: 0;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          text-align: center;
        }

        .iv-formulas-note p {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.6;
          margin: 0;
        }

        /* Available Nutrients Grid */
        .iv-nutrients-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          margin-top: 2.5rem;
          border: 1px solid #e0e0e0;
        }

        .iv-nutrient-card {
          padding: 1.25rem;
          border-radius: 0;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          background: #fafafa;
          text-align: center;
          transition: background 0.2s ease;
        }

        .iv-nutrient-card:nth-child(4n) {
          border-right: none;
        }

        .iv-nutrient-card:nth-last-child(-n+4) {
          border-bottom: none;
        }

        .iv-nutrient-card:hover {
          background: #ffffff;
        }

        .iv-nutrient-name {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.25rem;
        }

        .iv-nutrient-benefit {
          font-size: 0.75rem;
          color: #737373;
          line-height: 1.4;
        }

        /* Glutathione Push */
        .iv-glut-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-top: 2rem;
          max-width: 500px;
          border: 1px solid #e0e0e0;
        }

        .iv-glut-card {
          padding: 1.5rem;
          border-radius: 0;
          border-right: 1px solid #e0e0e0;
          background: #ffffff;
          text-align: center;
          transition: background 0.2s ease;
          box-shadow: none;
        }

        .iv-glut-card:last-child {
          border-right: none;
        }

        .iv-glut-card:hover {
          background: #fafafa;
        }

        .iv-glut-dose {
          font-size: 1.5rem;
          font-weight: 900;
          color: #808080;
          margin-bottom: 0.25rem;
        }

        .iv-glut-price {
          font-size: 1.125rem;
          font-weight: 600;
          color: #737373;
        }

        .iv-glut-note {
          font-size: 0.875rem;
          color: #737373;
          margin-top: 1.25rem;
          line-height: 1.6;
        }

        /* Tags */
        .iv-tags-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
          margin-top: 2rem;
        }

        .iv-tag-pill {
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 0;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.2s ease;
        }

        .iv-tag-pill:hover {
          border-color: rgba(255, 255, 255, 0.25);
        }

        /* Benefit Cards */
        .iv-benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-top: 2.5rem;
          border: 1px solid #e0e0e0;
        }

        .iv-benefit-card {
          padding: 2rem;
          border-radius: 0;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          background: #ffffff;
          box-shadow: none;
          transition: background 0.2s ease;
        }

        .iv-benefit-card:nth-child(2n) {
          border-right: none;
        }

        .iv-benefit-card:nth-last-child(-n+2) {
          border-bottom: none;
        }

        .iv-benefit-card:hover {
          background: #fafafa;
        }

        .iv-benefit-number {
          font-size: 1.25rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #808080;
          margin-bottom: 1rem;
        }

        .iv-benefit-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
        }

        .iv-benefit-desc {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #737373;
        }

        /* Research Cards */
        .iv-research-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-top: 2.5rem;
          border: 1px solid #e0e0e0;
        }

        .iv-research-card {
          padding: 2rem;
          border-radius: 0;
          border-bottom: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          background: #ffffff;
          cursor: pointer;
          box-shadow: none;
          transition: background 0.2s ease;
        }

        .iv-research-card:nth-child(2n) {
          border-right: none;
        }

        .iv-research-card:nth-last-child(-n+2) {
          border-bottom: none;
        }

        .iv-research-card:hover {
          background: #fafafa;
        }

        .iv-research-category {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #808080;
          margin-bottom: 0.875rem;
        }

        .iv-research-headline {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .iv-research-summary {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #737373;
          margin-bottom: 1rem;
        }

        .iv-research-source {
          font-size: 0.8125rem;
          font-style: italic;
          color: #737373;
        }

        .iv-research-disclaimer {
          font-size: 0.8125rem;
          color: #737373;
          text-align: center;
          max-width: 700px;
          margin: 3rem auto 0;
          line-height: 1.7;
        }

        /* FAQ */
        .iv-faq-list {
          max-width: 700px;
          margin: 2rem auto 0;
        }

        .iv-faq-item {
          border-bottom: 1px solid #e0e0e0;
        }

        .iv-faq-item:last-child {
          border-bottom: none;
        }

        .iv-faq-question {
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

        .iv-faq-question span {
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
          padding-right: 1rem;
        }

        .iv-faq-toggle {
          flex-shrink: 0;
          font-size: 1.25rem;
          font-weight: 300;
          color: #737373;
          width: 24px;
          text-align: center;
        }

        .iv-faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }

        .iv-faq-open .iv-faq-answer {
          max-height: 300px;
          padding-bottom: 1.25rem;
        }

        .iv-faq-answer p {
          font-size: 0.9375rem;
          color: #737373;
          line-height: 1.7;
          margin: 0;
        }

        /* CTA Section */
        .iv-cta-section {
          padding: 6rem 2rem;
          text-align: center;
        }

        .iv-cta-title {
          font-size: 2.75rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 0.95;
          text-transform: uppercase;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }

        .iv-cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .iv-cta-or {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.25);
        }

        .iv-cta-phone {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 2px;
          transition: border-color 0.2s ease;
        }

        .iv-cta-phone:hover {
          border-color: rgba(255, 255, 255, 0.6);
        }

        /* Safety & Transparency */
        .iv-safety-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 2.5rem;
        }
        .iv-safety-card {
          border: 1px solid #e0e0e0;
          padding: 2rem;
          background: #ffffff;
        }
        .iv-safety-card-dark {
          background: #0a0a0a;
          border-color: #0a0a0a;
          color: #ffffff;
        }
        .iv-safety-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #737373;
          margin-bottom: 1.5rem;
        }
        .iv-safety-card-dark .iv-safety-label {
          color: rgba(255,255,255,0.5);
        }
        .iv-safety-items {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .iv-safety-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 0.875rem 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .iv-safety-card-dark .iv-safety-item {
          border-bottom-color: rgba(255,255,255,0.1);
        }
        .iv-safety-item:last-child {
          border-bottom: none;
        }
        .iv-safety-icon {
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
        .iv-safety-warn {
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
        .iv-safety-item strong {
          display: block;
          font-size: 0.9rem;
          color: #171717;
          margin-bottom: 0.125rem;
        }
        .iv-safety-item p {
          font-size: 0.8125rem;
          line-height: 1.6;
          color: #737373;
          margin: 0;
        }
        .iv-safety-card-dark .iv-safety-item p {
          color: rgba(255,255,255,0.7);
        }
        .iv-safety-guides {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e0e0e0;
        }
        .iv-safety-guide-link {
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
        .iv-safety-guide-link:hover {
          border-color: #171717;
        }
        .iv-safety-guide-link span {
          transition: transform 0.2s;
        }
        .iv-safety-guide-link:hover span {
          transform: translateX(3px);
        }
        .iv-safety-note {
          font-size: 0.8125rem;
          color: rgba(255,255,255,0.5);
          margin-top: 1.25rem;
          line-height: 1.6;
        }

        /* Real Results */
        .iv-results-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-top: 2.5rem;
        }
        .iv-result-card {
          padding: 2rem;
          border-right: 1px solid rgba(255,255,255,0.1);
        }
        .iv-result-card:last-child {
          border-right: none;
        }
        .iv-result-profile {
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 1.25rem;
          font-weight: 600;
        }
        .iv-result-before,
        .iv-result-after {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.7);
          margin-bottom: 1rem;
        }
        .iv-result-after {
          color: rgba(255,255,255,0.95);
        }
        .iv-result-label {
          display: block;
          font-size: 0.6875rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.3);
        }
        .iv-result-after .iv-result-label {
          color: #4ade80;
        }
        .iv-inaction {
          margin-top: 3rem;
          padding: 2rem 2.5rem;
          border-left: 3px solid rgba(255,255,255,0.15);
        }
        .iv-inaction-label {
          font-size: 0.6875rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 700;
          color: rgba(255,255,255,0.35);
          margin-bottom: 0.75rem;
        }
        .iv-inaction p {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.7);
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .iv-section,
          .iv-section-alt {
            padding: 4rem 1.5rem;
          }

          .iv-page h1 {
            font-size: 2rem;
          }

          .iv-page h2 {
            font-size: 1.5rem;
          }

          .iv-hero {
            padding: 4rem 1.5rem;
          }

          .iv-stat-row {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .iv-benefits-grid {
            grid-template-columns: 1fr;
            border: none;
          }

          .iv-benefit-card {
            border: 1px solid #e0e0e0;
            border-bottom: none;
          }

          .iv-benefit-card:nth-child(2n) {
            border-right: 1px solid #e0e0e0;
          }

          .iv-benefit-card:last-child {
            border-bottom: 1px solid #e0e0e0;
          }

          .iv-formulas-grid {
            grid-template-columns: 1fr;
            border: none;
          }

          .iv-formula-card {
            border: 1px solid #e0e0e0;
            border-bottom: none;
          }

          .iv-formula-card:nth-child(2n) {
            border-right: 1px solid #e0e0e0;
          }

          .iv-formula-card:last-child {
            border-bottom: 1px solid #e0e0e0;
          }

          .iv-nutrients-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .iv-research-grid {
            grid-template-columns: 1fr;
            border: none;
          }

          .iv-research-card {
            border: 1px solid #e0e0e0;
            border-bottom: none;
          }

          .iv-research-card:nth-child(2n) {
            border-right: 1px solid #e0e0e0;
          }

          .iv-research-card:last-child {
            border-bottom: 1px solid #e0e0e0;
          }

          .iv-cta-title {
            font-size: 2rem;
          }

          .iv-cta-buttons {
            flex-direction: column;
          }

          .iv-cta-section {
            padding: 4rem 1.5rem;
          }

          .iv-safety-grid {
            grid-template-columns: 1fr;
          }

          .iv-safety-guides {
            flex-direction: column;
          }

          .iv-results-grid {
            grid-template-columns: 1fr;
          }
          .iv-result-card {
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding: 1.5rem 0;
          }
          .iv-result-card:last-child {
            border-bottom: none;
          }
          .iv-inaction {
            padding: 1.5rem;
          }
        }
      `}</style>
    </Layout>
  );
}
