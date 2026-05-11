import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function HormoneOptimization() {
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
      question: "How do I know if my hormones are the issue?",
      answer: "Start with a Range Assessment. We run comprehensive labs — testosterone, estrogen, progesterone, thyroid, and more — and review your symptoms together. If your hormones are off, we'll see it in the labs."
    },
    {
      question: "Do you treat women too?",
      answer: "Absolutely. Women's hormone decline — especially during perimenopause and menopause — is one of the most under-addressed issues in medicine. We optimize testosterone, estrogen, progesterone, and thyroid for women with the same personalized, lab-driven approach."
    },
    {
      question: "How soon will I feel better?",
      answer: "Most patients notice improved sleep and energy within 1–2 weeks. Mood and mental clarity typically improve by weeks 3–4. Full optimization — including body composition changes — develops over 3–6 months."
    },
    {
      question: "What's included in the $250/month membership?",
      answer: "All hormone medications (testosterone, estrogen, progesterone, thyroid, support meds), a monthly Range IV, all follow-up labs (8-week and quarterly), and direct provider access. Initial labs are billed separately."
    },
    {
      question: "Is there a contract?",
      answer: "No. Our HRT membership is month-to-month. You can pause or cancel anytime with no penalties."
    },
    {
      question: "Is hormone therapy safe?",
      answer: "Yes, when monitored by a licensed provider with regular labs. We check your levels at 8 weeks and then quarterly to ensure your protocol is optimized and safe."
    },
    {
      question: "What if I'm already on HRT somewhere else?",
      answer: "We can review your current protocol and labs. Many patients transfer to us for better monitoring, more comprehensive care, or better value. Book an assessment and bring your recent labs."
    }
  ];

  const symptoms = [
    "Tired all the time, even after sleeping well",
    "Brain fog — trouble focusing, remembering things, thinking clearly",
    "Gaining weight even though nothing in your routine has changed",
    "Mood swings, irritability, or feeling flat",
    "Low libido or changes in sexual function",
    "Poor sleep — waking up at 3 a.m. or never feeling rested",
    "Your labs say \"normal\" but you don't feel normal"
  ];

  const plans = [
    {
      name: 'Hormone Optimization Membership',
      desc: 'For men and women whose labs show hormone imbalances contributing to fatigue, weight gain, brain fog, or mood issues.',
      freq: 'Monthly membership includes all medications, follow-up labs, monthly IV, and direct provider access.',
      price: '$250/month — all-inclusive (initial labs billed separately)'
    },
    {
      name: 'Hormone + Weight Loss',
      desc: 'For patients whose labs show both hormonal and metabolic factors. Combines HRT with GLP-1 medication if appropriate.',
      freq: 'Hormone membership plus weight loss protocol as needed.',
      price: 'Discussed after your assessment based on your plan'
    },
    {
      name: 'Thyroid Optimization',
      desc: 'For patients with thyroid symptoms that standard dosing hasn\'t resolved. Comprehensive thyroid panel and personalized dosing.',
      freq: 'Included in the HRT membership with targeted thyroid support.',
      price: 'Included in the $250/month membership'
    }
  ];

  const results = [
    {
      profile: 'Male, 47',
      before: 'Exhausted by 2 p.m. every day. Brain fog. Weight creeping up despite working out 4x/week. PCP said labs were "normal."',
      after: 'Testosterone was 280 (low-normal). After 8 weeks on HRT: energy sustained all day, 6 lbs of fat lost, mental clarity returned.'
    },
    {
      profile: 'Female, 52',
      before: 'Hot flashes, night sweats, 15 lbs gained in one year. Mood swings. Felt like a completely different person.',
      after: 'Estrogen, progesterone, and testosterone optimized. Hot flashes resolved in 3 weeks. Lost 12 lbs over 4 months. "I feel like myself again."'
    },
    {
      profile: 'Male, 35',
      before: 'Low libido, poor sleep, and low motivation. Thought it was just stress and getting older.',
      after: 'Labs showed low testosterone and suboptimal thyroid. After 12 weeks: sleep quality transformed, libido returned, back to performing at work and in the gym.'
    }
  ];

  return (
    <Layout
      title="Hormone Optimization & HRT | Newport Beach | Range Medical"
      description="Tired, foggy, gaining weight? Your hormones may be the issue. Start with a Range Assessment at Range Medical in Newport Beach. $250/month all-inclusive HRT membership."
    >
      <Head>
        <meta name="keywords" content="hormone optimization Newport Beach, HRT Orange County, testosterone therapy, hormone replacement, thyroid, menopause, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/hormone-optimization" />
        <meta property="og:title" content="Hormone Optimization & HRT | Newport Beach | Range Medical" />
        <meta property="og:description" content="Comprehensive hormone therapy for men and women. $250/month all-inclusive. Start with a Range Assessment." />
        <meta property="og:url" content="https://www.range-medical.com/hormone-optimization" />
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
            <div className="tx-label">HORMONE OPTIMIZATION</div>
            <h1>Tired, foggy, and gaining weight for no reason? <em>It&apos;s probably your hormones.</em></h1>
            <div className="tx-rule" />
            <p className="tx-hero-sub">
              Range Medical starts with comprehensive labs and a full assessment. If hormone therapy is right for you, your provider will build a plan around your body, your goals, and your life.
            </p>
            <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
            <span className="tx-btn-note">
              We&apos;ll review your labs and symptoms, then decide together if hormone optimization belongs in your plan.
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
              <h2>Your labs say &ldquo;normal&rdquo; but you don&apos;t <em>feel normal.</em></h2>
              <div className="tx-rule" />
              <p className="tx-section-intro">
                Most doctors check a basic panel and say you&apos;re fine. We dig deeper. The Range Assessment includes comprehensive hormone labs &mdash; testosterone, estrogen, progesterone, thyroid, metabolic markers, and more &mdash; plus a symptom review and one-on-one with your provider. If your hormones are off, we build a plan to fix them. If something else is causing your symptoms, we&apos;ll find that too.
              </p>
            </div>

            <div className="tx-science tx-animate">
              <div className="tx-science-label">For the science-minded</div>
              <p>
                Hormones control energy, mood, metabolism, sleep, and sexual function. Even &ldquo;normal range&rdquo; levels can be suboptimal for how you feel. We optimize to where you function best, not just where you fall on a lab range. For men: testosterone, DHEA, thyroid. For women: estrogen, progesterone, testosterone, thyroid. All monitored with regular labs and adjusted as needed.
              </p>
            </div>
          </div>
        </section>

        <section className="tx-section">
          <div className="tx-container">
            <div className="tx-animate">
              <div className="tx-label">YOUR JOURNEY</div>
              <h2>Three steps to <em>feeling like yourself again.</em></h2>
              <div className="tx-rule" />
            </div>
            <div className="tx-steps tx-animate">
              <div className="tx-step">
                <div className="tx-step-num">01</div>
                <h3>Range Assessment</h3>
                <p>Comprehensive hormone labs, a symptom review, and a one-on-one with your provider to understand what&apos;s going on.</p>
              </div>
              <div className="tx-step">
                <div className="tx-step-num">02</div>
                <h3>Personalized Plan</h3>
                <p>Your provider designs a hormone protocol tailored to your labs and goals. You start your $250/month all-inclusive membership.</p>
              </div>
              <div className="tx-step">
                <div className="tx-step-num">03</div>
                <h3>Ongoing Support</h3>
                <p>Follow-up labs at 8 weeks, then quarterly. We adjust your protocol as needed. Direct access to your provider anytime.</p>
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
                Your provider will only recommend hormone therapy if your labs show it&apos;s a good fit. These are common examples, not a self-serve menu.
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
            <h2>Questions about hormone therapy</h2>
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
            <h2>Imagine having the energy and drive you had <em>10 years ago.</em></h2>
            <p>The first step is understanding what your labs and symptoms are telling us. Your provider will take it from there.</p>
            <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
            <a href="tel:9499973988" className="tx-cta-phone">(949) 997-3988</a>
          </div>
        </section>

      </div>
    </Layout>
  );
}
