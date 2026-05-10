import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function IVTherapy() {
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

  const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index);

  const faqs = [
    {
      question: "How do I know if IV therapy is right for me?",
      answer: "Start with a Range Assessment. Your provider will review your labs and symptoms to determine whether IV therapy — and which formulation — makes sense for your situation."
    },
    {
      question: "Do I need labs first?",
      answer: "We recommend it. Labs help us understand what nutrients you're actually low in so we can build the right IV protocol for you, not just guess."
    },
    {
      question: "How long does a session take?",
      answer: "Most IVs take 30 to 60 minutes depending on the formulation. Bring a book, laptop, or just relax."
    },
    {
      question: "How often should I get an IV?",
      answer: "It depends on your goals. Some patients come weekly for energy or recovery support. Others come monthly for maintenance. Your provider will recommend a frequency based on your plan."
    },
    {
      question: "Is IV therapy safe?",
      answer: "Yes, when administered by trained medical professionals using sterile technique and pharmaceutical-grade nutrients. We screen all patients and monitor you during your infusion."
    },
    {
      question: "Can I just walk in?",
      answer: "Walk-ins are welcome for established patients. New patients should start with a Range Assessment so we can build the right protocol for you."
    }
  ];

  const symptoms = [
    "Low energy that coffee can't fix",
    "Getting sick more often than you used to",
    "Slow recovery after workouts or illness",
    "Dehydrated no matter how much water you drink",
    "Brain fog, poor focus, or mental fatigue",
    "Feeling run-down from travel or a busy stretch"
  ];

  const plans = [
    {
      name: 'Immune & Energy Support',
      desc: 'For frequent illness, low energy, or recovering from being sick.',
      freq: 'Weekly IV sessions for 4 weeks, then monthly maintenance.',
      price: 'Pricing discussed after your assessment'
    },
    {
      name: 'Recovery & Performance',
      desc: 'For athletes or active patients dealing with soreness, fatigue, or slow recovery.',
      freq: '1–2 sessions per week during training blocks, monthly otherwise.',
      price: 'Pricing discussed after your assessment'
    },
    {
      name: 'Detox & Cellular Repair',
      desc: 'For patients whose labs show oxidative stress or who want liver and cellular support.',
      freq: 'Weekly glutathione or NAC-based IVs for 4–6 weeks.',
      price: 'Pricing discussed after your assessment'
    }
  ];

  return (
    <Layout
      title="IV Therapy | Vitamin Infusions | Newport Beach | Range Medical"
      description="Tired, run-down, or not recovering? IV therapy may be part of your plan. Start with a Range Assessment at Range Medical in Newport Beach."
    >
      <Head>
        <meta name="keywords" content="IV therapy Newport Beach, vitamin IV Orange County, IV drip, hydration therapy, glutathione IV, vitamin C IV, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/iv-therapy" />
        <meta property="og:title" content="IV Therapy | Vitamin Infusions | Newport Beach | Range Medical" />
        <meta property="og:description" content="IV therapy may support energy, recovery, and immune function. Start with a Range Assessment at Range Medical in Newport Beach." />
        <meta property="og:url" content="https://www.range-medical.com/iv-therapy" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Range Medical" />
        <meta name="twitter:card" content="summary" />
        <meta name="geo.region" content="US-CA" />
        <meta name="geo.placename" content="Newport Beach" />

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
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "1901 Westcliff Dr. Suite 10",
                  "addressLocality": "Newport Beach",
                  "addressRegion": "CA",
                  "postalCode": "92660",
                  "addressCountry": "US"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": faqs.map(faq => ({
                  "@type": "Question",
                  "name": faq.question,
                  "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
                }))
              }
            ])
          }}
        />
      </Head>

      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item"><span className="trust-rating">5.0</span> on Google</span>
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">Board-Certified Providers</span>
        </div>
      </div>

      <div className="tx-page">

        <section className="tx-hero">
          <div className="tx-container">
            <div className="tx-label">IV THERAPY</div>
            <h1>Running on empty and nothing&apos;s <em>working?</em></h1>
            <div className="tx-rule" />
            <p className="tx-hero-sub">
              Range Medical starts with labs and a full assessment. If IV therapy fits your situation, your provider will build it into a plan designed around you.
            </p>
            <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
            <span className="tx-btn-note">
              We&apos;ll review your labs and symptoms, then decide together if IV therapy belongs in your plan.
            </span>
          </div>
        </section>

        <section className="tx-section">
          <div className="tx-container">
            <div className="tx-animate">
              <div className="tx-label">IS THIS YOU</div>
              <h2>Is this you?</h2>
              <div className="tx-rule" />
            </div>
            <ul className="tx-symptoms tx-animate">
              {symptoms.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </section>

        <section className="tx-section-alt">
          <div className="tx-container">
            <div className="tx-animate">
              <div className="tx-label">HOW WE HELP AT RANGE MEDICAL</div>
              <h2>We don&apos;t guess. <em>We test first.</em></h2>
              <div className="tx-rule" />
              <p className="tx-section-intro">
                Every patient starts with the Range Assessment &mdash; detailed labs, a symptom review, and a one-on-one conversation with your provider. From there, we build a plan that may include IV therapy alongside other tools like HBOT, red light therapy, peptides, or hormone support. What goes into your plan depends entirely on what your labs and symptoms show.
              </p>
            </div>

            <div className="tx-science tx-animate">
              <div className="tx-science-label">For the science-minded</div>
              <p>
                IV therapy delivers vitamins, minerals, and amino acids directly into your bloodstream &mdash; bypassing the digestive system for 100% absorption. This allows therapeutic doses that aren&apos;t possible orally. For example, IV vitamin C reaches blood levels 50&ndash;70x higher than oral supplementation. Sessions take 30&ndash;60 minutes in a comfortable chair.
              </p>
            </div>
          </div>
        </section>

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
                <p>Your provider designs a plan that may include IV therapy &mdash; with the right formulation for your labs and goals.</p>
              </div>
              <div className="tx-step">
                <div className="tx-step-num">03</div>
                <h3>Ongoing Support</h3>
                <p>We check in, adjust your protocol as needed, and update labs over time.</p>
              </div>
            </div>
            <div className="tx-animate" style={{ marginTop: '3rem' }}>
              <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
            </div>
          </div>
        </section>

        <section className="tx-section-alt">
          <div className="tx-container">
            <div className="tx-animate">
              <div className="tx-label">WHAT YOUR PLAN MIGHT INCLUDE</div>
              <h2>Example treatment plans</h2>
              <div className="tx-rule" />
              <p className="tx-section-intro">
                Your provider will only recommend IV therapy if your labs and symptoms show it&apos;s a good fit. These are common examples, not a self-serve menu.
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
              Pricing depends on your specific plan and formulation. Your provider will walk through costs during or after your Range Assessment.
            </p>
          </div>
        </section>

        <section className="tx-section-alt">
          <div className="tx-container">
            <div className="tx-label">COMMON QUESTIONS</div>
            <h2>Questions about IV therapy</h2>
            <div className="tx-faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`tx-faq-item ${openFaq === index ? 'tx-faq-open' : ''}`}>
                  <button className="tx-faq-question" onClick={() => toggleFaq(index)}>
                    <span>{faq.question}</span>
                    <span className="tx-faq-toggle">{openFaq === index ? '−' : '+'}</span>
                  </button>
                  <div className="tx-faq-answer"><p>{faq.answer}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="tx-cta">
          <div className="tx-container tx-animate">
            <h2>If you&apos;re tired, run-down, or just not feeling like yourself &mdash; <em>start here.</em></h2>
            <p>The first step is understanding what your labs and symptoms are telling us. Your provider will take it from there.</p>
            <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
            <a href="tel:9499973988" className="tx-cta-phone">(949) 997-3988</a>
          </div>
        </section>

      </div>
    </Layout>
  );
}
