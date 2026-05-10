import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function InjectionTherapy() {
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
      question: "How do I know which injection is right for me?",
      answer: "Start with a Range Assessment. Your provider will review your labs and symptoms, then recommend the right injections as part of your personalized plan."
    },
    {
      question: "Do I need labs first?",
      answer: "We recommend it. Labs help us understand what your body is actually low in so we can target the right nutrients — not just guess."
    },
    {
      question: "How long does an injection take?",
      answer: "Under 5 minutes. Most are intramuscular — quick, simple, and done. No IV line needed."
    },
    {
      question: "How often should I get injections?",
      answer: "It depends on your situation. Many patients come weekly or bi-weekly for maintenance. Your provider will recommend a frequency based on your labs and goals."
    },
    {
      question: "What's the difference between an injection and an IV?",
      answer: "An injection is a quick intramuscular shot — in and out in minutes. An IV delivers a larger volume of fluids and nutrients over 30–60 minutes. Both bypass digestion for full absorption."
    },
    {
      question: "Can I just walk in?",
      answer: "Walk-ins are welcome for established patients. New patients should start with a Range Assessment so we can build the right protocol for you."
    }
  ];

  const symptoms = [
    "Low energy that coffee can't fix",
    "Brain fog or trouble focusing",
    "Slow recovery after workouts",
    "Frequent colds or feeling run-down",
    "Dull skin, thinning hair, or brittle nails",
    "Wanting a quick, targeted nutrient boost between IVs"
  ];

  const plans = [
    {
      name: 'Energy & Vitality',
      desc: 'B12, B-Complex, and other energy-supporting injections for fatigue and brain fog.',
      freq: 'Weekly or bi-weekly injections based on your labs.',
      price: 'Pricing discussed after your assessment'
    },
    {
      name: 'Recovery & Immune Support',
      desc: 'Glutathione, vitamin C, and immune-boosting injections for illness prevention and recovery.',
      freq: 'Weekly during cold season or recovery periods.',
      price: 'Pricing discussed after your assessment'
    },
    {
      name: 'Cellular Energy (NAD+)',
      desc: 'NAD+ injections for cellular energy, mental clarity, and anti-aging support.',
      freq: 'Dose and frequency based on your protocol.',
      price: 'Pricing discussed after your assessment'
    }
  ];

  return (
    <Layout
      title="Injection Therapy | Vitamin Injections | Newport Beach | Range Medical"
      description="Low energy, brain fog, or slow recovery? Vitamin injections may be part of your plan. Start with a Range Assessment at Range Medical in Newport Beach."
    >
      <Head>
        <meta name="keywords" content="injection therapy Newport Beach, vitamin injections Orange County, B12 injection, glutathione injection, NAD injection, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/injection-therapy" />
        <meta property="og:title" content="Injection Therapy | Vitamin Injections | Newport Beach" />
        <meta property="og:description" content="Quick vitamin injections for energy, recovery, and immune support. Start with a Range Assessment." />
        <meta property="og:url" content="https://www.range-medical.com/injection-therapy" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="geo.region" content="US-CA" />
        <meta name="geo.placename" content="Newport Beach" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              { "@context": "https://schema.org", "@type": "MedicalBusiness", "name": "Range Medical", "url": "https://www.range-medical.com", "telephone": "(949) 997-3988", "address": { "@type": "PostalAddress", "streetAddress": "1901 Westcliff Dr. Suite 10", "addressLocality": "Newport Beach", "addressRegion": "CA", "postalCode": "92660", "addressCountry": "US" } },
              { "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faqs.map(faq => ({ "@type": "Question", "name": faq.question, "acceptedAnswer": { "@type": "Answer", "text": faq.answer } })) }
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
            <div className="tx-label">INJECTION THERAPY</div>
            <h1>Need a targeted boost? <em>Skip the gut, feed your cells.</em></h1>
            <div className="tx-rule" />
            <p className="tx-hero-sub">
              Range Medical starts with labs and a full assessment. If vitamin injections fit your situation, your provider will build them into a plan designed around you.
            </p>
            <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
            <span className="tx-btn-note">
              We&apos;ll review your labs and symptoms, then decide together which injections belong in your plan.
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
                Every patient starts with the Range Assessment &mdash; detailed labs, a symptom review, and a one-on-one conversation with your provider. From there, we build a plan that may include targeted injections alongside other tools like IV therapy, HBOT, peptides, or hormone support. Injections are quick (under 5 minutes), affordable (starting at $35), and bypass your gut for 100% absorption.
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
                <p>Labs, a symptom questionnaire, and a one-on-one provider review to understand what your body actually needs.</p>
              </div>
              <div className="tx-step">
                <div className="tx-step-num">02</div>
                <h3>Personalized Plan</h3>
                <p>Your provider recommends specific injections based on your labs &mdash; B12, glutathione, NAD+, or others &mdash; at the right frequency.</p>
              </div>
              <div className="tx-step">
                <div className="tx-step-num">03</div>
                <h3>Ongoing Support</h3>
                <p>Walk in for your injections on your schedule. We check labs over time to make sure your levels are where they should be.</p>
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
                Your provider will recommend specific injections based on your labs and symptoms. These are common examples, not a self-serve menu.
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
          </div>
        </section>

        <section className="tx-section-alt">
          <div className="tx-container">
            <div className="tx-label">COMMON QUESTIONS</div>
            <h2>Questions about injections</h2>
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
            <h2>If you&apos;re low on energy, slow to recover, or just not feeling sharp &mdash; <em>start here.</em></h2>
            <p>The first step is understanding what your labs and symptoms are telling us. Your provider will take it from there.</p>
            <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
            <a href="tel:9499973988" className="tx-cta-phone">(949) 997-3988</a>
          </div>
        </section>

      </div>
    </Layout>
  );
}
