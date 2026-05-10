import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function RedLightTherapy() {
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
      question: "How do I know if red light therapy is right for me?",
      answer: "Start with a Range Assessment. Your provider will review your labs and symptoms and determine whether red light therapy makes sense as part of your plan."
    },
    {
      question: "Do I need labs first?",
      answer: "We recommend it. Understanding your full picture helps us determine the right combination of therapies, including whether red light therapy is the best tool for what you're dealing with."
    },
    {
      question: "What does a session feel like?",
      answer: "You lie in a full-body LED bed for about 20 minutes. You'll feel a gentle warmth. Most people find it relaxing — many fall asleep. No pain, no burning, no downtime."
    },
    {
      question: "How many sessions will I need?",
      answer: "It depends on your situation. Some people notice improvements in energy or skin after a few sessions. For deeper benefits like recovery or inflammation, consistent use over several weeks is typical. Your provider will guide you."
    },
    {
      question: "Is it safe?",
      answer: "Yes. Red light therapy uses non-ionizing light — it doesn't damage your skin or cells the way UV light can. It's been studied for decades and is considered very safe."
    },
    {
      question: "Can I combine it with other treatments?",
      answer: "Absolutely. Red light therapy pairs well with HBOT, IV therapy, and peptides. Many patients use it as part of a broader plan that their provider designs during the assessment."
    }
  ];

  const symptoms = [
    "Sore muscles that take too long to recover",
    "Joint stiffness or chronic aches",
    "Dull, tired-looking skin",
    "Low energy even when you're sleeping enough",
    "Trouble sleeping or staying asleep",
    "Inflammation that won't calm down"
  ];

  const plans = [
    {
      name: 'Recovery & Inflammation Support',
      desc: 'For muscle soreness, joint stiffness, or chronic inflammation.',
      freq: '3–5 sessions per week for 4–6 weeks, often paired with HBOT.',
      price: 'Typical investment: $49–$199 every 4 weeks (membership)'
    },
    {
      name: 'Skin & Energy Reset',
      desc: 'For patients looking to improve skin health, energy, and overall vitality.',
      freq: '3 sessions per week for 4 weeks as a reset, then maintenance.',
      price: 'Typical investment: $49–$199 every 4 weeks (membership)'
    },
    {
      name: 'Cellular Energy Reset',
      desc: 'A structured 6-week protocol combining red light and HBOT for full-body recovery.',
      freq: '3 red light + 3 HBOT sessions per week for 6 weeks with weekly check-ins.',
      price: 'Typical investment: $3,999'
    }
  ];

  return (
    <>
    <Layout
      title="Red Light Therapy | Newport Beach | Range Medical"
      description="Sore, inflamed, or not recovering? Red light therapy may be part of your plan. Start with a Range Assessment at Range Medical in Newport Beach."
    >
      <Head>
        <meta name="keywords" content="red light therapy Newport Beach, photobiomodulation Orange County, LED light bed therapy, skin health, muscle recovery, inflammation, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/red-light-therapy" />
        <meta property="og:title" content="Red Light Therapy | Newport Beach | Range Medical" />
        <meta property="og:description" content="Red light therapy for recovery, skin health, and energy. Start with a Range Assessment at Range Medical in Newport Beach." />
        <meta property="og:url" content="https://www.range-medical.com/red-light-therapy" />
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
            <div className="tx-label">RED LIGHT THERAPY</div>
            <h1>Sore, inflamed, or just not <em>recovering?</em></h1>
            <div className="tx-rule" />
            <p className="tx-hero-sub">
              Range Medical starts with labs and a full assessment. If red light therapy fits your situation, your provider will build it into a plan designed around you.
            </p>
            <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
            <span className="tx-btn-note">
              We&apos;ll review your labs and symptoms, then decide together if red light therapy belongs in your plan.
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
                Every patient starts with the Range Assessment &mdash; detailed labs, a symptom review, and a one-on-one conversation with your provider. From there, we build a plan that may include red light therapy alongside other tools like HBOT, IV therapy, peptides, or hormone support. What goes into your plan depends entirely on what your labs and symptoms show.
              </p>
            </div>

            <div className="tx-science tx-animate">
              <div className="tx-science-label">For the science-minded</div>
              <p>
                Our full-body INNER Light LED Bed uses 14,400 medical-grade LEDs delivering red (660nm) and near-infrared (850nm) wavelengths. These wavelengths penetrate skin and tissue to support mitochondrial function, stimulate collagen production, reduce inflammation, and improve circulation. Sessions are 20 minutes, and the therapy has been studied for decades across dermatology, sports medicine, and pain management.
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
                <p>Your provider designs a plan that may include red light therapy plus other tools based on your goals and labs.</p>
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

        <section className="tx-section-alt">
          <div className="tx-container">
            <div className="tx-animate">
              <div className="tx-label">WHAT YOUR PLAN MIGHT INCLUDE</div>
              <h2>Example treatment plans</h2>
              <div className="tx-rule" />
              <p className="tx-section-intro">
                Your provider will only recommend red light therapy if your labs and symptoms show it&apos;s a good fit. These are common examples, not a self-serve menu.
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

        <section className="tx-section-alt">
          <div className="tx-container">
            <div className="tx-label">COMMON QUESTIONS</div>
            <h2>Questions about red light therapy</h2>
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
            <h2>If you&apos;re sore, inflamed, or just not recovering the way you used to &mdash; <em>start here.</em></h2>
            <p>The first step is understanding what your labs and symptoms are telling us. Your provider will take it from there.</p>
            <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
            <a href="tel:9499973988" className="tx-cta-phone">(949) 997-3988</a>
          </div>
        </section>

      </div>
    </Layout>
    </>
  );
}
