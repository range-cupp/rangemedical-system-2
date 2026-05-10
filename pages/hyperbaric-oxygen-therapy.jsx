import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function HyperbaricOxygenTherapy() {
  const [openFaq, setOpenFaq] = useState(null);

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
    const elements = document.querySelectorAll('.tx-page .tx-animate');
    elements.forEach((el) => observer.observe(el));
    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "How do I know if HBOT is right for me?",
      answer: "That's exactly what the Range Assessment is for. We review your labs, symptoms, and goals first. If HBOT is a good fit, your provider will include it in your plan. If not, they'll recommend something else."
    },
    {
      question: "Do I need labs before starting?",
      answer: "Yes. We always start with labs and a provider review. This helps us understand what's going on and whether HBOT — or something else — makes sense for your situation."
    },
    {
      question: "What does a session feel like?",
      answer: "You sit in a pressurized chamber and breathe normally. Most people read, listen to music, or nap. You might feel some pressure in your ears at first, like on an airplane. Sessions are 60 to 90 minutes."
    },
    {
      question: "How many sessions will I need?",
      answer: "It depends on your situation. Some people feel a difference after a few sessions. For recovery or inflammation, your provider may recommend a longer plan. We'll talk through this during your assessment."
    },
    {
      question: "Is it safe?",
      answer: "Yes. HBOT has been studied for decades and is recognized by the FDA. Side effects are rare and usually mild. We monitor you throughout every session and screen every patient before they start."
    },
    {
      question: "Can I just buy a single session without the assessment?",
      answer: "We recommend starting with the Range Assessment so your provider can determine if HBOT is the right tool for you. That said, if you've already been evaluated and want to add sessions, give us a call."
    }
  ];

  const symptoms = [
    "Healing from a surgery or injury and it's taking longer than expected",
    "Dealing with inflammation that won't go away",
    "Brain fog or trouble focusing, especially after a concussion",
    "Low energy that doesn't improve with sleep",
    "Sore and slow to recover after workouts",
    "Feeling like your body just isn't bouncing back the way it used to"
  ];

  const plans = [
    {
      name: 'Recovery Support',
      desc: 'For post-surgical healing, injury recovery, or concussion support.',
      freq: '2–3 HBOT sessions per week for 4–6 weeks, often paired with red light therapy.',
      price: 'Typical investment: $1,600–$3,999'
    },
    {
      name: 'Energy & Inflammation Reset',
      desc: 'For chronic fatigue, ongoing inflammation, or autoimmune-related symptoms.',
      freq: '2–3 sessions per week for 6 weeks, with provider check-ins.',
      price: 'Typical investment: $2,500–$3,999'
    },
    {
      name: 'Ongoing Maintenance',
      desc: 'For athletes or patients who want consistent recovery support.',
      freq: '1–3 sessions per week on a monthly membership.',
      price: 'Typical investment: $549–$1,399 every 4 weeks'
    }
  ];

  const results = [
    {
      profile: 'Male, 55',
      before: 'Post-surgical knee recovery stalled at 6 weeks. Still limping, inflammation markers elevated.',
      after: 'Full range of motion restored after 20 HBOT sessions. Inflammation markers normalized. Physical therapist said recovery accelerated by months.'
    },
    {
      profile: 'Male, 41',
      before: 'Post-concussion syndrome for 8 months. Brain fog, light sensitivity, couldn\'t work full days.',
      after: 'Cognitive clarity returned after 30 sessions. Back to full work schedule. Headaches resolved.'
    },
    {
      profile: 'Female, 48',
      before: 'Chronic fatigue, autoimmune flare-ups every few months, poor wound healing.',
      after: 'Energy noticeably improved after 20 sessions. Went 6+ months without a flare. Small cuts healing in days instead of weeks.'
    }
  ];

  return (
    <>
    <Layout
      title="Hyperbaric Oxygen Therapy (HBOT) | Newport Beach | Range Medical"
      description="Tired, inflamed, or not healing the way you should? HBOT may be part of your plan. Start with a Range Assessment at Range Medical in Newport Beach."
    >
      <Head>
        <meta name="keywords" content="hyperbaric oxygen therapy Newport Beach, HBOT Orange County, oxygen therapy, injury recovery, athletic recovery, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/hyperbaric-oxygen-therapy" />

        <meta property="og:title" content="Hyperbaric Oxygen Therapy (HBOT) | Newport Beach | Range Medical" />
        <meta property="og:description" content="HBOT may support injury recovery, energy, and healing. Start with a Range Assessment at Range Medical in Newport Beach." />
        <meta property="og:url" content="https://www.range-medical.com/hyperbaric-oxygen-therapy" />
        <meta property="og:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/697fbd4f1f68d10a92caef4d.jpeg" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Hyperbaric Oxygen Therapy (HBOT) | Newport Beach | Range Medical" />
        <meta name="twitter:description" content="HBOT may support injury recovery, energy, and healing. Start with a Range Assessment. Newport Beach." />
        <meta name="twitter:image" content="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/697fbd4f1f68d10a92caef4d.jpeg" />

        <meta name="geo.region" content="US-CA" />
        <meta name="geo.placename" content="Newport Beach" />
        <meta name="geo.position" content="33.6189;-117.9298" />
        <meta name="ICBM" content="33.6189, -117.9298" />

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
                "image": "https://www.range-medical.com/brand/range_logo_transparent_black.png",
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

      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item">
            <span className="trust-rating">5.0</span> on Google
          </span>
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">Board-Certified Providers</span>
        </div>
      </div>

      <div className="tx-page">

        {/* 1. HERO */}
        <section className="tx-hero">
          <div className="tx-container">
            <div className="tx-label">HYPERBARIC OXYGEN THERAPY</div>
            <h1>Not healing the way you should? <em>There&apos;s a reason.</em></h1>
            <div className="tx-rule" />
            <p className="tx-hero-sub">
              Range Medical starts with labs and a full assessment. If hyperbaric oxygen therapy fits your situation, your provider will build it into a plan designed around you.
            </p>
            <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
            <span className="tx-btn-note">
              We&apos;ll review your labs and symptoms, then decide together if HBOT belongs in your plan.
            </span>
          </div>
        </section>

        {/* Photos */}
        <section style={{ padding: '0 2rem' }}>
          <div className="tx-container">
            <div className="tx-photos tx-animate">
              <img
                src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/697fbd4f1f68d10a92caef4d.jpeg"
                alt="Hyperbaric oxygen chamber at Range Medical"
              />
              <img
                src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/697fbd4f1f68d11e2acaef4e.jpeg"
                alt="Inside the hyperbaric chamber at Range Medical"
              />
            </div>
          </div>
        </section>

        {/* 2. IS THIS YOU */}
        <section className="tx-section">
          <div className="tx-container">
            <div className="tx-animate">
              <div className="tx-label">IS THIS YOU</div>
              <h2>Is this you?</h2>
              <div className="tx-rule" />
            </div>
            <ul className="tx-symptoms tx-animate">
              {symptoms.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3. HOW WE HELP */}
        <section className="tx-section-alt">
          <div className="tx-container">
            <div className="tx-animate">
              <div className="tx-label">HOW WE HELP AT RANGE MEDICAL</div>
              <h2>We don&apos;t guess. <em>We test first.</em></h2>
              <div className="tx-rule" />
              <p className="tx-section-intro">
                Every patient starts with the Range Assessment &mdash; detailed labs, a symptom review, and a one-on-one conversation with your provider. From there, we build a plan that may include HBOT alongside other tools like IV therapy, red light therapy, peptides, or hormone support. What goes into your plan depends entirely on what your labs and symptoms show.
              </p>
            </div>

            <div className="tx-science tx-animate">
              <div className="tx-science-label">For the science-minded</div>
              <p>
                Hyperbaric oxygen therapy places you in a chamber at 2.0 atmospheres of pressure while breathing concentrated oxygen. This delivers 2&ndash;3x more oxygen to your tissues than normal, which may support new blood vessel growth, reduce inflammation, and accelerate your body&apos;s natural repair processes. It&apos;s been studied for decades across wound healing, neurological recovery, and athletic performance.
              </p>
            </div>
          </div>
        </section>

        {/* 4. THREE-STEP JOURNEY */}
        <section className="tx-section">
          <div className="tx-container">
            <div className="tx-animate">
              <div className="tx-label">YOUR JOURNEY</div>
              <h2>Three steps to <em>feeling better.</em></h2>
              <div className="tx-rule" />
            </div>

            <div className="tx-steps tx-animate">
              <div className="tx-step">
                <div className="tx-step-num">01</div>
                <h3>Range Assessment</h3>
                <p>Labs, a symptom questionnaire, and a one-on-one provider review to understand what&apos;s really going on.</p>
              </div>
              <div className="tx-step">
                <div className="tx-step-num">02</div>
                <h3>Personalized Plan</h3>
                <p>Your provider designs a plan that may include HBOT plus other therapies based on your goals and labs.</p>
              </div>
              <div className="tx-step">
                <div className="tx-step-num">03</div>
                <h3>Ongoing Support</h3>
                <p>We check in, adjust as needed, and update labs over time to make sure things are moving in the right direction.</p>
              </div>
            </div>

            <div className="tx-animate" style={{ marginTop: '3rem' }}>
              <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
            </div>
          </div>
        </section>

        {/* 5. EXAMPLE PLANS */}
        <section className="tx-section-alt">
          <div className="tx-container">
            <div className="tx-animate">
              <div className="tx-label">WHAT YOUR PLAN MIGHT INCLUDE</div>
              <h2>Example treatment plans</h2>
              <div className="tx-rule" />
              <p className="tx-section-intro">
                Your provider will only recommend HBOT if your labs and symptoms show it&apos;s a good fit. These are common examples, not a self-serve menu.
              </p>
            </div>

            <div className="tx-plans tx-animate">
              {plans.map((plan, i) => (
                <div key={i} className="tx-plan-card">
                  <div className="tx-plan-name">{plan.name}</div>
                  <p className="tx-plan-freq">{plan.desc}</p>
                  <p className="tx-plan-freq">{plan.freq}</p>
                  <div className="tx-plan-price">{plan.price}</div>
                </div>
              ))}
            </div>

            <p className="tx-disclaimer tx-animate">
              Pricing depends on your specific plan. Your provider will walk through costs during or after your Range Assessment.
            </p>
          </div>
        </section>

        {/* 6. PROOF / RESULTS */}
        <section className="tx-section-dark">
          <div className="tx-container">
            <div className="tx-animate">
              <div className="tx-label">REAL RESULTS</div>
              <h2>What patients have <em>experienced.</em></h2>
              <div className="tx-rule" />
              <p className="tx-section-intro">
                Real outcomes from our Newport Beach clinic. Names withheld for privacy. Every case started with a Range Assessment.
              </p>
            </div>

            <div className="tx-results tx-animate">
              {results.map((r, i) => (
                <div key={i} className="tx-result-card">
                  <div className="tx-result-profile">{r.profile}</div>
                  <div className="tx-result-before">
                    <span className="tx-result-label">Before</span>
                    {r.before}
                  </div>
                  <div className="tx-result-after">
                    <span className="tx-result-label">After</span>
                    {r.after}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="tx-section-alt">
          <div className="tx-container">
            <div className="tx-label">COMMON QUESTIONS</div>
            <h2>Questions about HBOT</h2>

            <div className="tx-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`tx-faq-item ${openFaq === index ? 'tx-faq-open' : ''}`}>
                  <button className="tx-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <span className="tx-faq-toggle">{openFaq === index ? '−' : '+'}</span>
                  </button>
                  <div className="tx-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. CTA FOOTER */}
        <section className="tx-cta">
          <div className="tx-container tx-animate">
            <h2>If you&apos;re not healing, not recovering, or just not feeling right &mdash; <em>start here.</em></h2>
            <p>
              The first step is understanding what your labs and symptoms are telling us. Your provider will take it from there.
            </p>
            <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
            <a href="tel:9499973988" className="tx-cta-phone">(949) 997-3988</a>
          </div>
        </section>

      </div>
    </Layout>
    </>
  );
}
