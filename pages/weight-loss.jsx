import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function WeightLoss() {
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
      question: "How do I know if weight loss medication is right for me?",
      answer: "Start with a Range Assessment. We run comprehensive labs — metabolic markers, thyroid, hormones — and review your full picture before recommending anything. If medication is a good fit, your provider will explain your options."
    },
    {
      question: "Which medication will I be on?",
      answer: "Your provider will recommend based on your labs, medical history, and goals. Most patients start with tirzepatide (Mounjaro/Zepbound) due to its dual-action mechanism. We'll discuss all options during your assessment."
    },
    {
      question: "How much weight can I expect to lose?",
      answer: "Results vary. Clinical trials show patients typically lose 15–25% of their body weight over 6–12 months. Your results depend on your starting point, adherence, and lifestyle."
    },
    {
      question: "Do I have to stay on it forever?",
      answer: "No. Many patients use GLP-1 medications for 6–12 months to reach their goal, then maintain with healthy habits. Some choose a maintenance dose. We'll build a plan that fits your situation."
    },
    {
      question: "What are the side effects?",
      answer: "The most common is mild nausea, especially in the first few weeks. It usually improves as your body adjusts. We start low and increase gradually to minimize this."
    },
    {
      question: "How is Range different from telehealth weight loss clinics?",
      answer: "We don't just write prescriptions. We run comprehensive labs, monitor your metabolic health, adjust dosing based on your response, and provide real medical supervision — not a telehealth script mill."
    }
  ];

  const symptoms = [
    "Gaining weight even when you're eating well and exercising",
    "Constant hunger and cravings you can't control",
    "Tried diets and programs that worked for a while, then stopped",
    "Low energy and brain fog that make it hard to stay motivated",
    "Your metabolism feels like it's working against you",
    "Feeling frustrated that nothing seems to stick"
  ];

  const plans = [
    {
      name: 'Weight Loss Support',
      desc: 'For patients ready to start a GLP-1 medication protocol with full provider supervision.',
      freq: 'Weekly injections, monthly check-ins, labs at baseline and throughout.',
      price: 'Pricing discussed after your assessment'
    },
    {
      name: 'Metabolic Reset',
      desc: 'For patients whose labs show hormonal or metabolic factors contributing to weight gain.',
      freq: 'GLP-1 medication plus hormone or thyroid support as needed.',
      price: 'Pricing discussed after your assessment'
    },
    {
      name: 'Maintenance & Optimization',
      desc: 'For patients nearing their goal who want to transition to long-term habits.',
      freq: 'Lower maintenance dose, quarterly labs, ongoing provider support.',
      price: 'Pricing discussed after your assessment'
    }
  ];

  const results = [
    {
      profile: 'Female, 42',
      before: 'Gained 35 lbs over 3 years despite healthy eating. Labs showed thyroid and insulin resistance. "Normal" at her PCP.',
      after: 'Lost 40 lbs over 8 months on tirzepatide with thyroid support. Energy returned. Cravings gone. Maintaining for 6+ months.'
    },
    {
      profile: 'Male, 38',
      before: 'Tried every diet — keto, paleo, intermittent fasting. Lost weight each time, gained it back. Felt like a failure.',
      after: 'Lost 55 lbs over 10 months. "For the first time in my life, I\'m not thinking about food constantly." Still on a maintenance dose.'
    },
    {
      profile: 'Female, 51',
      before: 'Post-menopausal weight gain, 25 lbs in one year. Brain fog, no energy, felt like a different person.',
      after: 'Lost 30 lbs over 7 months with GLP-1 + hormone optimization. "I feel like myself again."'
    }
  ];

  return (
    <Layout
      title="Medical Weight Loss | Tirzepatide & Semaglutide | Newport Beach | Range Medical"
      description="Struggling with weight despite doing everything right? GLP-1 medications may be part of your plan. Start with a Range Assessment at Range Medical in Newport Beach."
    >
      <Head>
        <meta name="keywords" content="medical weight loss Newport Beach, tirzepatide Orange County, semaglutide, Mounjaro, Wegovy, GLP-1, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/weight-loss" />
        <meta property="og:title" content="Medical Weight Loss | Tirzepatide & Semaglutide | Newport Beach" />
        <meta property="og:description" content="Physician-supervised weight loss with GLP-1 medications. Start with a Range Assessment at Range Medical." />
        <meta property="og:url" content="https://www.range-medical.com/weight-loss" />
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
            <div className="tx-label">MEDICAL WEIGHT LOSS</div>
            <h1>Stop fighting your body. <em>Start working with it.</em></h1>
            <div className="tx-rule" />
            <p className="tx-hero-sub">
              Range Medical starts with labs and a full assessment. If GLP-1 medication is right for you, your provider will build a supervised plan around your body, your goals, and your life.
            </p>
            <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
            <span className="tx-btn-note">
              We&apos;ll review your labs and symptoms, then decide together if weight loss medication belongs in your plan.
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
              <h2>We don&apos;t just write prescriptions. <em>We find the cause.</em></h2>
              <div className="tx-rule" />
              <p className="tx-section-intro">
                Every patient starts with the Range Assessment &mdash; detailed labs (metabolic markers, thyroid, hormones, and more), a symptom review, and a one-on-one conversation with your provider. If your labs and history show that GLP-1 medication is a good fit, we&apos;ll prescribe the right one at the right dose and supervise your progress with real check-ins &mdash; not just refills.
              </p>
            </div>

            <div className="tx-science tx-animate">
              <div className="tx-science-label">For the science-minded</div>
              <p>
                GLP-1 receptor agonists (tirzepatide and semaglutide) work on your brain&apos;s hunger centers to naturally reduce appetite and cravings. Tirzepatide also targets the GIP receptor for a dual-action effect. Clinical trials show 15&ndash;25% body weight loss over 6&ndash;12 months. These medications also improve metabolic markers like insulin sensitivity, blood sugar, and cholesterol.
              </p>
            </div>
          </div>
        </section>

        <section className="tx-section">
          <div className="tx-container">
            <div className="tx-animate">
              <div className="tx-label">YOUR JOURNEY</div>
              <h2>Three steps to <em>real results.</em></h2>
              <div className="tx-rule" />
            </div>
            <div className="tx-steps tx-animate">
              <div className="tx-step">
                <div className="tx-step-num">01</div>
                <h3>Range Assessment</h3>
                <p>Comprehensive labs (metabolic, thyroid, hormones), a symptom review, and a one-on-one with your provider to understand what&apos;s really going on.</p>
              </div>
              <div className="tx-step">
                <div className="tx-step-num">02</div>
                <h3>Personalized Plan</h3>
                <p>Your provider prescribes the right medication at the right dose and teaches you how to self-inject. We address any underlying factors like hormones or thyroid.</p>
              </div>
              <div className="tx-step">
                <div className="tx-step-num">03</div>
                <h3>Ongoing Support</h3>
                <p>Regular check-ins, dose adjustments based on your response, and lab monitoring throughout. Real support, not just refills.</p>
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
                Your provider will only recommend weight loss medication if your labs and history show it&apos;s a good fit. These are common examples, not a self-serve menu.
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
              Pricing depends on your medication and plan. Your provider will walk through costs during or after your Range Assessment.
            </p>
          </div>
        </section>

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

        <section className="tx-section-alt">
          <div className="tx-container">
            <div className="tx-label">COMMON QUESTIONS</div>
            <h2>Questions about weight loss</h2>
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
            <h2>If you&apos;ve tried everything and nothing has stuck &mdash; <em>start here.</em></h2>
            <p>The first step is understanding what your labs and symptoms are telling us. Your provider will take it from there.</p>
            <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
            <a href="tel:9499973988" className="tx-cta-phone">(949) 997-3988</a>
          </div>
        </section>

      </div>
    </Layout>
  );
}
