import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function NADTherapy() {
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
      question: "How do I know if NAD+ therapy is right for me?",
      answer: "Start with a Range Assessment. Your provider will review your labs, symptoms, and goals to determine if NAD+ therapy — and which protocol — makes sense for your situation."
    },
    {
      question: "Do I need labs first?",
      answer: "Yes. Labs help us understand your full picture — energy markers, metabolic health, and other factors — so we can determine whether NAD+ is the right tool or if something else should come first."
    },
    {
      question: "What does an NAD+ IV feel like?",
      answer: "NAD+ IVs are infused slowly over 2–4 hours. Some people experience flushing or nausea if infused too quickly — this is why we go slow. Most patients feel energized and mentally clear afterward."
    },
    {
      question: "Can I do injections instead of IVs?",
      answer: "Yes. We offer both IV and injection protocols. Injections are self-administered at home 3x/week and are more convenient. Your provider will recommend the best approach based on your situation."
    },
    {
      question: "How long do the effects last?",
      answer: "Most patients report sustained benefits for 2–4 weeks after completing a protocol. Maintenance sessions help keep NAD+ levels elevated long-term."
    },
    {
      question: "Is NAD+ therapy safe?",
      answer: "Yes, when administered by trained medical professionals. NAD+ is a naturally occurring molecule in your body — we're replenishing what declines with age. We monitor you throughout IV infusions."
    }
  ];

  const symptoms = [
    "Tired all the time, even after a full night of sleep",
    "Brain fog or trouble focusing and thinking clearly",
    "Slow recovery from workouts or illness",
    "Feeling like you're aging faster than you should be",
    "Low motivation or mental sharpness",
    "Your body just doesn't bounce back the way it used to"
  ];

  const plans = [
    {
      name: 'NAD+ Recharge',
      desc: 'For patients with significant fatigue, brain fog, or cognitive concerns. A front-loaded IV approach.',
      freq: '3–5 IV sessions over 7–10 days, then monthly maintenance IVs.',
      price: 'Pricing discussed after your assessment'
    },
    {
      name: 'NAD+ Injection Protocol',
      desc: 'For patients who want consistent NAD+ support with the convenience of at-home injections.',
      freq: 'Self-administered injections 3x/week for 12 weeks.',
      price: 'Pricing discussed after your assessment'
    },
    {
      name: 'Longevity & Maintenance',
      desc: 'For patients who have completed an initial protocol and want to maintain elevated NAD+ levels.',
      freq: 'Monthly IV or continued injections, with quarterly labs.',
      price: 'Pricing discussed after your assessment'
    }
  ];

  return (
    <Layout
      title="NAD+ Therapy | IV & Injection Protocols | Newport Beach | Range Medical"
      description="Tired, foggy, or not recovering? NAD+ therapy may be part of your plan. Start with a Range Assessment at Range Medical in Newport Beach."
    >
      <Head>
        <meta name="keywords" content="NAD+ therapy Newport Beach, NAD IV Orange County, NAD injections, cellular energy, anti-aging, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/nad-therapy" />
        <meta property="og:title" content="NAD+ Therapy | Newport Beach | Range Medical" />
        <meta property="og:description" content="NAD+ IV and injection protocols for energy, focus, and recovery. Start with a Range Assessment." />
        <meta property="og:url" content="https://www.range-medical.com/nad-therapy" />
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
                "address": { "@type": "PostalAddress", "streetAddress": "1901 Westcliff Dr. Suite 10", "addressLocality": "Newport Beach", "addressRegion": "CA", "postalCode": "92660", "addressCountry": "US" }
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": faqs.map(faq => ({ "@type": "Question", "name": faq.question, "acceptedAnswer": { "@type": "Answer", "text": faq.answer } }))
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
            <div className="tx-label">NAD+ THERAPY</div>
            <h1>Tired all the time? The problem might be <em>deeper than you think.</em></h1>
            <div className="tx-rule" />
            <p className="tx-hero-sub">
              Range Medical starts with labs and a full assessment. If NAD+ therapy fits your situation, your provider will build it into a plan designed around you.
            </p>
            <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
            <span className="tx-btn-note">
              We&apos;ll review your labs and symptoms, then decide together if NAD+ therapy belongs in your plan.
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
                Every patient starts with the Range Assessment &mdash; detailed labs, a symptom review, and a one-on-one conversation with your provider. From there, we build a plan that may include NAD+ alongside other tools like IV therapy, peptides, hormone support, or red light therapy. What goes into your plan depends entirely on what your labs and symptoms show.
              </p>
            </div>

            <div className="tx-science tx-animate">
              <div className="tx-science-label">For the science-minded</div>
              <p>
                NAD+ (nicotinamide adenine dinucleotide) is a coenzyme in every cell, essential for energy production, DNA repair, and activating sirtuins &mdash; proteins that regulate aging and inflammation. NAD+ levels decline significantly with age. IV and injection delivery bypass the gut (where oral NAD+ is mostly destroyed) to restore cellular levels directly. We offer both front-loaded IV protocols and convenient at-home injection cycles.
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
                <p>Your provider designs a plan that may include NAD+ (IV or injections) plus other therapies based on your goals and labs.</p>
              </div>
              <div className="tx-step">
                <div className="tx-step-num">03</div>
                <h3>Ongoing Support</h3>
                <p>We check in, adjust your protocol as needed, and update labs over time to make sure things are moving in the right direction.</p>
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
                Your provider will only recommend NAD+ therapy if your labs and symptoms show it&apos;s a good fit. These are common examples, not a self-serve menu.
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
              Pricing depends on your specific protocol. Your provider will walk through costs during or after your Range Assessment.
            </p>
          </div>
        </section>

        <section className="tx-section-alt">
          <div className="tx-container">
            <div className="tx-label">COMMON QUESTIONS</div>
            <h2>Questions about NAD+ therapy</h2>
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
            <h2>If you&apos;re tired, foggy, or just not feeling like yourself &mdash; <em>start here.</em></h2>
            <p>The first step is understanding what your labs and symptoms are telling us. Your provider will take it from there.</p>
            <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
            <a href="tel:9499973988" className="tx-cta-phone">(949) 997-3988</a>
          </div>
        </section>

      </div>
    </Layout>
  );
}
