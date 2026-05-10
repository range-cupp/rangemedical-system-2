import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function PeptideTherapy() {
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
      question: "How do I know if peptide therapy is right for me?",
      answer: "Start with a Range Assessment. Your provider will review your labs, symptoms, and goals to determine if peptides — and which ones — make sense for your situation."
    },
    {
      question: "Do I need labs first?",
      answer: "Yes. Understanding your full picture helps us design the right peptide protocol. We don't prescribe peptides based on guesswork."
    },
    {
      question: "Do I have to inject myself?",
      answer: "Most peptides are subcutaneous injections — a tiny needle just under the skin, similar to what diabetics use for insulin. We teach you how, and most patients are comfortable after their first try."
    },
    {
      question: "How long until I see results?",
      answer: "It depends on the peptide and your goals. Healing peptides often show improvement in 2–4 weeks. Growth hormone peptides may take 4–8 weeks. Your provider will set realistic expectations."
    },
    {
      question: "Are peptides safe?",
      answer: "Yes, when prescribed by a licensed provider and sourced from FDA-registered compounding pharmacies. Peptides have been studied for decades and have a strong safety profile."
    },
    {
      question: "Can I combine peptides with other treatments?",
      answer: "Absolutely. Peptides often work well alongside hormone optimization, IV therapy, HBOT, and red light therapy. Your provider will design a plan that fits together."
    }
  ];

  const symptoms = [
    "An injury that isn't healing the way it should",
    "Slow recovery from workouts or surgery",
    "Poor sleep quality — waking up tired",
    "Chronic inflammation or joint pain",
    "Low energy, motivation, or drive",
    "Feeling like your body is aging faster than it should"
  ];

  const plans = [
    {
      name: 'Recovery & Healing',
      desc: 'For injuries, post-surgical healing, or chronic inflammation. Peptides that support tissue repair and reduce inflammation.',
      freq: 'Daily injections for 4–12 weeks depending on the protocol.',
      price: 'Pricing discussed after your assessment'
    },
    {
      name: 'Sleep & Growth Hormone Support',
      desc: 'For poor sleep, slow recovery, and declining body composition. Growth hormone-releasing peptides.',
      freq: 'Nightly injections for 8–12 weeks with labs at baseline and follow-up.',
      price: 'Pricing discussed after your assessment'
    },
    {
      name: 'Immune & Gut Support',
      desc: 'For frequent illness, gut issues, or systemic inflammation. Targeted peptides for immune and GI support.',
      freq: 'Protocol length depends on the specific peptide and your response.',
      price: 'Pricing discussed after your assessment'
    }
  ];

  return (
    <Layout
      title="Peptide Therapy | Healing, Recovery & Performance | Newport Beach | Range Medical"
      description="Slow recovery, poor sleep, or chronic inflammation? Peptide therapy may be part of your plan. Start with a Range Assessment at Range Medical in Newport Beach."
    >
      <Head>
        <meta name="keywords" content="peptide therapy Newport Beach, BPC-157, healing peptides, recovery peptides, growth hormone peptides, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/peptide-therapy" />
        <meta property="og:title" content="Peptide Therapy | Newport Beach | Range Medical" />
        <meta property="og:description" content="Peptide therapy for healing, recovery, and performance. Start with a Range Assessment." />
        <meta property="og:url" content="https://www.range-medical.com/peptide-therapy" />
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
            <div className="tx-label">PEPTIDE THERAPY</div>
            <h1>Slow recovery, poor sleep, low drive? <em>Your body needs help.</em></h1>
            <div className="tx-rule" />
            <p className="tx-hero-sub">
              Range Medical starts with labs and a full assessment. If peptide therapy fits your situation, your provider will build it into a plan designed around you.
            </p>
            <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
            <span className="tx-btn-note">
              We&apos;ll review your labs and symptoms, then decide together if peptides belong in your plan.
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
                Every patient starts with the Range Assessment &mdash; detailed labs, a symptom review, and a one-on-one conversation with your provider. From there, we build a plan that may include peptides alongside other tools like hormone support, IV therapy, HBOT, or red light therapy. What goes into your plan depends entirely on what your labs and symptoms show.
              </p>
            </div>

            <div className="tx-science tx-animate">
              <div className="tx-science-label">For the science-minded</div>
              <p>
                Peptides are short chains of amino acids that act as targeted signaling molecules in your body. Different peptides support different functions &mdash; tissue repair, growth hormone release, immune modulation, or gut healing. We prescribe from FDA-registered compounding pharmacies and design protocols around your specific labs and goals, not a one-size-fits-all approach.
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
                <p>Your provider designs a plan that may include peptides &mdash; which ones, what doses, and how long &mdash; based on your goals and labs.</p>
              </div>
              <div className="tx-step">
                <div className="tx-step-num">03</div>
                <h3>Ongoing Support</h3>
                <p>Regular check-ins to monitor your progress. We adjust your protocol as needed and update labs to track results.</p>
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
                Your provider will only recommend peptides if your labs and symptoms show they&apos;re a good fit. These are common examples, not a self-serve menu.
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
              Pricing depends on which peptides your provider recommends. Costs are discussed during or after your Range Assessment.
            </p>
          </div>
        </section>

        <section className="tx-section-alt">
          <div className="tx-container">
            <div className="tx-label">COMMON QUESTIONS</div>
            <h2>Questions about peptide therapy</h2>
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
            <h2>If you&apos;re not healing, not sleeping, or just not performing the way you want &mdash; <em>start here.</em></h2>
            <p>The first step is understanding what your labs and symptoms are telling us. Your provider will take it from there.</p>
            <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
            <a href="tel:9499973988" className="tx-cta-phone">(949) 997-3988</a>
          </div>
        </section>

      </div>
    </Layout>
  );
}
