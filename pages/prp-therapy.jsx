// pages/prp-therapy.jsx
// PRP Therapy - Full service page with site nav/footer

import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import ResearchModal from '../components/ResearchModal';
import { getStudiesByService } from '../data/researchStudies';

export default function PRPTherapy() {
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const studies = getStudiesByService('prp-therapy');

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

    const elements = document.querySelectorAll('.prp-page .prp-animate');
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
      question: "Is PRP painful?",
      answer: "There's some discomfort during the injection, but we use local anesthesia to minimize it. Most patients describe it as pressure rather than sharp pain. The blood draw is similar to any routine lab work."
    },
    {
      question: "How many treatments do I need?",
      answer: "Many patients see improvement with a single treatment. Some conditions — especially chronic issues — benefit from 2-3 sessions spaced 4-6 weeks apart. Your provider will recommend a plan based on your specific situation."
    },
    {
      question: "How long until I see results?",
      answer: "PRP works by stimulating your body's natural healing process, which takes time. Most patients notice improvement within 4-6 weeks, with continued improvement over 3-6 months as tissue regeneration progresses."
    },
    {
      question: "Is PRP covered by insurance?",
      answer: "PRP is typically not covered by insurance as it's considered an elective regenerative treatment. We can provide documentation for HSA/FSA reimbursement, which many patients use successfully."
    },
    {
      question: "What's the recovery like?",
      answer: "Most patients can return to normal activities the same day, though we recommend avoiding strenuous exercise for 24-48 hours. Some soreness at the injection site is normal and typically resolves within a few days."
    },
    {
      question: "Is PRP safe?",
      answer: "Yes. Because PRP uses your own blood, there's no risk of allergic reaction or rejection. The procedure has been used safely for decades in orthopedic and sports medicine settings."
    }
  ];

  const benefits = [
    { number: "01", title: "Uses Your Own Blood", desc: "PRP is derived from your own blood, eliminating risk of allergic reaction or rejection. It's your body's own healing factors, concentrated and reinjected." },
    { number: "02", title: "Accelerates Healing", desc: "Platelets contain growth factors that signal your body to repair tissue. Concentrating them amplifies this natural healing response." },
    { number: "03", title: "Reduces Inflammation", desc: "PRP has been shown to reduce inflammation in damaged tissue, which can help with pain relief and create a better environment for healing." },
    { number: "04", title: "Minimally Invasive", desc: "Unlike surgery, PRP is a same-day outpatient procedure. A blood draw, processing, and injection — typically under an hour total." },
    { number: "05", title: "No Downtime", desc: "Most patients return to normal activities immediately. No surgical recovery, no extended time off work or away from training." },
    { number: "06", title: "May Delay or Avoid Surgery", desc: "For some patients, PRP provides enough relief and healing to postpone or eliminate the need for surgical intervention." }
  ];

  const tags = [
    "Joint Pain",
    "Tendon Injuries",
    "Tennis Elbow",
    "Rotator Cuff",
    "Knee Pain",
    "Achilles Issues",
    "Sports Injuries",
    "Chronic Pain"
  ];

  const steps = [
    { step: "Step 1", title: "Blood draw", desc: "We draw a small amount of blood from your arm — similar to routine lab work. About 30-60ml depending on the treatment area." },
    { step: "Step 2", title: "Processing", desc: "Your blood is placed in a centrifuge and spun to separate the components. This concentrates the platelets to 3-5x normal levels." },
    { step: "Step 3", title: "Injection", desc: "The concentrated PRP is injected directly into the treatment area. We may use ultrasound guidance for precise placement in joints or tendons." },
    { step: "Step 4", title: "Healing begins", desc: "Growth factors in the PRP signal your body to repair the area. Healing continues over weeks to months as new tissue forms." }
  ];

  
  return (
    <Layout
      title="PRP Therapy | Platelet-Rich Plasma Injections | Newport Beach | Range Medical"
      description="PRP therapy in Newport Beach for joint pain, tendon injuries, and tissue regeneration. Your own platelets concentrated to accelerate healing."
    >
      <Head>
        {/* Basic Meta Tags */}
        <meta name="keywords" content="PRP therapy Newport Beach, platelet rich plasma Orange County, PRP injections, joint pain treatment, tendon healing, regenerative medicine, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/prp-therapy" />

        {/* Open Graph */}
        <meta property="og:title" content="PRP Therapy | Platelet-Rich Plasma | Newport Beach" />
        <meta property="og:description" content="PRP therapy using your own platelets to accelerate healing. Joint pain, tendon injuries, sports medicine in Newport Beach." />
        <meta property="og:url" content="https://www.range-medical.com/prp-therapy" />
        <meta property="og:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="PRP Therapy | Platelet-Rich Plasma | Newport Beach" />
        <meta name="twitter:description" content="PRP therapy using your own platelets to accelerate healing. Newport Beach." />
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
                "name": "PRP Therapy",
                "description": "Platelet-Rich Plasma (PRP) therapy uses concentrated platelets from your own blood to accelerate healing in joints, tendons, and soft tissue injuries.",
                "url": "https://www.range-medical.com/prp-therapy",
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

      <div className="prp-page">
        {/* Hero */}
        <section className="prp-hero">
          <div className="prp-kicker">Regenerative · Healing · Recovery</div>
          <h1>Your Guide to PRP Therapy</h1>
          <p className="prp-body-text">Everything you need to know about Platelet-Rich Plasma — what it is, how it works, and whether it's right for your injury or pain.</p>
          <div className="prp-hero-scroll">
            Scroll to explore
            <span>↓</span>
          </div>
        </section>

        {/* What Is It */}
        <section className="prp-section prp-section-alt">
          <div className="prp-container">
            <div className="prp-animate">
              <div className="prp-kicker">What Is PRP</div>
              <h2>Your own blood, concentrated to heal.</h2>
              <div className="prp-divider"></div>
              <p className="prp-body-text">
                PRP (Platelet-Rich Plasma) is exactly what it sounds like — plasma from your blood with a concentrated amount of platelets. Platelets contain growth factors that signal your body to repair damaged tissue.
              </p>
              <p className="prp-body-text" style={{ marginTop: '1rem' }}>
                By concentrating these platelets to 3-5x normal levels and injecting them directly into an injured area, we amplify your body's natural healing response. At Range Medical in Newport Beach, we use PRP for joint pain, tendon injuries, and soft tissue healing.
              </p>
            </div>

            <div className="prp-stat-row">
              <div className="prp-stat-item prp-animate">
                <div className="prp-stat-number">3-5x</div>
                <div className="prp-stat-label">Platelet concentration<br />compared to normal blood</div>
              </div>
              <div className="prp-stat-item prp-animate">
                <div className="prp-stat-number">30-60</div>
                <div className="prp-stat-label">Minutes for the<br />entire procedure</div>
              </div>
              <div className="prp-stat-item prp-animate">
                <div className="prp-stat-number">4-6</div>
                <div className="prp-stat-label">Weeks to see<br />initial improvement</div>
              </div>
            </div>
          </div>
        </section>

        {/* Who Is It For */}
        <section className="prp-section prp-section-inverted">
          <div className="prp-container">
            <div className="prp-animate">
              <div className="prp-kicker">Who It's For</div>
              <h2>When your body needs help healing.</h2>
              <div className="prp-divider"></div>
              <p className="prp-body-text">
                PRP is commonly used for musculoskeletal injuries that haven't responded to conservative treatment. If any of these sound familiar, PRP might help.
              </p>
            </div>

            <div className="prp-tags-grid prp-animate">
              {tags.map((tag, i) => (
                <div key={i} className="prp-tag-pill">{tag}</div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="prp-section">
          <div className="prp-container">
            <div className="prp-animate">
              <div className="prp-kicker">The Process</div>
              <h2>How PRP therapy works.</h2>
              <div className="prp-divider"></div>
              <p className="prp-body-text">
                The entire procedure takes about an hour at our Newport Beach clinic. Here's what to expect.
              </p>
            </div>

            <div className="prp-steps-list">
              {steps.map((item, i) => (
                <div key={i} className="prp-step-item prp-animate">
                  <div className="prp-step-number">{item.step}</div>
                  <div className="prp-step-content">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="prp-section prp-section-alt">
          <div className="prp-container">
            <div className="prp-animate">
              <div className="prp-kicker">Why PRP</div>
              <h2>The advantages of platelet-rich plasma.</h2>
              <div className="prp-divider"></div>
              <p className="prp-body-text">
                PRP offers several benefits over other treatments for musculoskeletal injuries.
              </p>
            </div>

            <div className="prp-benefits-grid">
              {benefits.map((benefit, i) => (
                <div key={i} className="prp-benefit-card prp-animate">
                  <div className="prp-benefit-number">{benefit.number}</div>
                  <div className="prp-benefit-title">{benefit.title}</div>
                  <div className="prp-benefit-desc">{benefit.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Research Section */}
        <section className="prp-section" id="prp-research">
          <div className="prp-container">
            <div className="prp-animate">
              <div className="prp-kicker">Backed by Science</div>
              <h2>Evidence-Based Results</h2>
              <div className="prp-divider"></div>
              <p className="prp-body-text">
                We've summarized the peer-reviewed research. Click any study to get the full breakdown — free.
              </p>
            </div>

            <div className="prp-research-grid">
              {studies.map((study) => (
                <div
                  key={study.id}
                  className="prp-research-card prp-animate"
                  onClick={() => handleResearchClick(study.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="prp-research-category">{study.category}</div>
                  <h3 className="prp-research-headline">{study.headline}</h3>
                  <p className="prp-research-summary">{study.summary}</p>
                  <p className="prp-research-source">{study.sourceJournal}, {study.sourceYear}</p>
                </div>
              ))}
            </div>

            <p className="prp-research-disclaimer prp-animate">
              These studies reflect research findings. Individual results may vary. PRP therapy at Range Medical is provided under medical supervision with proper patient selection.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="prp-section-alt">
          <div className="prp-container">
            <span className="prp-section-label">Questions</span>
            <h2>Common Questions</h2>

            <div className="prp-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`prp-faq-item ${openFaq === index ? 'prp-faq-open' : ''}`}>
                  <button className="prp-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={openFaq === index ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                    </svg>
                  </button>
                  <div className="prp-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="prp-section prp-section-inverted prp-cta-section">
          <div className="prp-container">
            <div className="prp-animate">
              <div className="prp-kicker" style={{ marginBottom: '1.5rem' }}>Next Steps</div>
              <h2 className="prp-cta-title">Ready to explore PRP therapy?</h2>
              <p className="prp-body-text" style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
                Start with a free Range Assessment. Your provider will evaluate your injury and determine if PRP is right for your situation. Our Newport Beach team is here to help.
              </p>
              <div className="prp-cta-buttons">
                <Link href="/range-assessment" className="prp-btn-primary">Book Your Assessment</Link>
                <div className="prp-cta-or">or</div>
                <a href="tel:9499973988" className="prp-cta-phone">(949) 997-3988</a>
              </div>
            </div>
          </div>
        </section>

        <ResearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          study={selectedStudy}
          servicePage="prp-therapy"
        />
      </div>

      <style jsx>{`
        /* ===== PRP PAGE SCOPED STYLES ===== */
        .prp-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #ffffff;
          color: #171717;
          overflow-x: hidden;
        }

        /* Animations */
        .prp-animate {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        :global(.prp-animate.visible) {
          opacity: 1;
          transform: translateY(0);
        }

        /* Container */
        .prp-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Sections */
        .prp-section {
          padding: 4rem 1.5rem;
        }

        .prp-section-alt {
          background: #fafafa;
          padding: 5rem 1.5rem;
        }

        .prp-section-label {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.75rem;
        }

        .prp-section-inverted {
          background: #000000;
          color: #ffffff;
        }

        /* Kicker */
        .prp-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 1rem;
        }

        .prp-section-inverted .prp-kicker {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Headlines */
        .prp-page h1 {
          font-size: 2.75rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #171717;
        }

        .prp-page h2 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #171717;
          margin-bottom: 1rem;
        }

        .prp-page h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
        }

        .prp-section-inverted h1,
        .prp-section-inverted h2,
        .prp-section-inverted h3 {
          color: #ffffff;
        }

        /* Body Text */
        .prp-body-text {
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.7;
          color: #525252;
          max-width: 600px;
        }

        .prp-section-inverted .prp-body-text {
          color: rgba(255, 255, 255, 0.55);
        }

        /* Divider */
        .prp-divider {
          width: 48px;
          height: 2px;
          background: #e5e5e5;
          margin: 1.25rem 0;
        }

        .prp-section-inverted .prp-divider {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Buttons */
        .prp-btn-primary {
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

        .prp-btn-primary:hover {
          background: #e5e5e5;
          transform: translateY(-1px);
        }

        /* Hero */
        .prp-hero {
          padding: 4rem 1.5rem 5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .prp-hero h1 {
          max-width: 680px;
          margin-bottom: 1.5rem;
        }

        .prp-hero .prp-body-text {
          text-align: center;
          margin: 0 auto 2.5rem;
        }

        .prp-hero-scroll {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-top: 2rem;
        }

        .prp-hero-scroll span {
          display: block;
          margin-top: 0.75rem;
          font-size: 1.125rem;
          animation: prp-bounce 2s ease-in-out infinite;
        }

        @keyframes prp-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        /* Stat Row */
        .prp-stat-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .prp-stat-item {
          text-align: center;
        }

        .prp-stat-number {
          font-size: 2.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1;
          margin-bottom: 0.5rem;
          color: #171717;
        }

        .prp-stat-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #737373;
          line-height: 1.5;
        }

        /* Tags */
        .prp-tags-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
          margin-top: 2rem;
        }

        .prp-tag-pill {
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.2s ease;
        }

        .prp-tag-pill:hover {
          border-color: rgba(255, 255, 255, 0.25);
        }

        /* Steps List */
        .prp-steps-list {
          margin-top: 2.5rem;
        }

        .prp-step-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #e5e5e5;
          align-items: flex-start;
        }

        .prp-step-item:last-child {
          border-bottom: none;
        }

        .prp-step-number {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #737373;
          min-width: 56px;
          letter-spacing: 0.02em;
        }

        .prp-step-content h3 {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.375rem;
        }

        .prp-step-content p {
          font-size: 0.875rem;
          color: #525252;
          line-height: 1.7;
        }

        /* Benefit Cards */
        .prp-benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .prp-benefit-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .prp-benefit-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .prp-benefit-number {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #737373;
          margin-bottom: 1rem;
        }

        .prp-benefit-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
        }

        .prp-benefit-desc {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
        }

        /* Research Cards */
        .prp-research-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 2.5rem;
        }

        .prp-research-card {
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .prp-research-card:hover {
          border-color: #171717;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .prp-research-category {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #0891b2;
          margin-bottom: 0.875rem;
        }

        .prp-research-headline {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .prp-research-summary {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #525252;
          margin-bottom: 1rem;
        }

        .prp-research-source {
          font-size: 0.8125rem;
          font-style: italic;
          color: #737373;
        }

        .prp-research-disclaimer {
          font-size: 0.8125rem;
          color: #737373;
          text-align: center;
          max-width: 700px;
          margin: 3rem auto 0;
          line-height: 1.7;
        }

        /* FAQ */
        .prp-faq-list {
          max-width: 700px;
          margin: 0 auto;
        }

        .prp-faq-item {
          border-bottom: 1px solid #e5e5e5;
        }

        .prp-faq-item:last-child {
          border-bottom: none;
        }

        .prp-faq-question {
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

        .prp-faq-question span {
          font-size: 1rem;
          font-weight: 600;
          color: #171717;
          padding-right: 1rem;
        }

        .prp-faq-question svg {
          flex-shrink: 0;
          color: #737373;
          transition: transform 0.2s;
        }

        .prp-faq-open .prp-faq-question svg {
          transform: rotate(180deg);
        }

        .prp-faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }

        .prp-faq-open .prp-faq-answer {
          max-height: 300px;
          padding-bottom: 1.25rem;
        }

        .prp-faq-answer p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin: 0;
        }

        /* CTA Section */
        .prp-cta-section {
          padding: 6rem 1.5rem;
          text-align: center;
        }

        .prp-cta-title {
          font-size: 2.75rem;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }

        .prp-cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .prp-cta-or {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.25);
        }

        .prp-cta-phone {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 2px;
          transition: border-color 0.2s ease;
        }

        .prp-cta-phone:hover {
          border-color: rgba(255, 255, 255, 0.6);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .prp-section {
            padding: 3rem 1.5rem;
          }

          .prp-page h1 {
            font-size: 2rem;
          }

          .prp-page h2 {
            font-size: 1.5rem;
          }

          .prp-hero {
            padding: 3rem 1.5rem;
          }

          .prp-stat-row {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .prp-step-item {
            flex-direction: column;
            gap: 0.5rem;
          }

          .prp-benefits-grid {
            grid-template-columns: 1fr;
          }

          .prp-research-grid {
            grid-template-columns: 1fr;
          }

          .prp-cta-title {
            font-size: 2rem;
          }

          .prp-cta-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </Layout>
  );
}
