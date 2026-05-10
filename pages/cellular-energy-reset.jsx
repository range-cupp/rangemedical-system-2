import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function CellularEnergyReset() {
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
    { question: "How do I know if the Cellular Energy Reset is right for me?", answer: "Start with a Range Assessment. Your provider will evaluate whether this protocol — or a different approach — is the right fit based on your symptoms, labs, and goals." },
    { question: "How long does each session take?", answer: "Plan for about 90 minutes door-to-door when doing HBOT and Red Light together. Red Light is 20 minutes, HBOT is 60 minutes. Most patients do both in the same visit." },
    { question: "When will I start feeling results?", answer: "Most patients notice improvements by Week 3 — less afternoon fatigue, better sleep quality, and improved mental clarity. The full benefits compound through Week 6." },
    { question: "What happens after the 6 weeks?", answer: "At your results review, we'll measure your progress and discuss maintenance options to preserve your gains. Most patients continue with periodic sessions." },
    { question: "Is this covered by insurance?", answer: "HBOT and Red Light Therapy for optimization are typically not covered by insurance. We can provide superbills for HSA/FSA reimbursement." },
    { question: "Can I just do HBOT or Red Light without the other?", answer: "Each therapy has standalone benefits, but they work synergistically in this program. HBOT delivers oxygen to cells while Red Light stimulates mitochondria to use that oxygen efficiently. Your provider will recommend the right approach." }
  ];

  const symptoms = [
    "Persistent fatigue that sleep doesn't fix",
    "Brain fog — losing focus, forgetting words, feeling mentally slow",
    "The 2 p.m. crash hits every single day",
    "Your doctor says you're fine, but you don't feel fine",
    "Slow recovery from workouts, injuries, or daily life",
    "Feeling like your body is aging faster than it should"
  ];

  const plans = [
    { name: '6-Week Cellular Energy Reset', desc: '18 HBOT sessions + 18 Red Light sessions over 6 weeks. The most comprehensive approach to restoring cellular energy.', freq: '3 sessions per week for 6 weeks, plus provider consultations.', price: '$2,999 (save $1,861 vs. individual sessions)' },
    { name: 'Maintenance Protocol', desc: 'After completing the reset, periodic HBOT + Red Light sessions to maintain your gains.', freq: '4 HBOT + 4 Red Light sessions every 4 weeks.', price: 'Starting at $599 per cycle' },
    { name: 'Maintenance + IV', desc: 'Maintenance sessions plus a monthly Energy IV for additional cellular support.', freq: '4 HBOT + 4 Red Light + 1 IV every 4 weeks.', price: 'Starting at $799 per cycle' }
  ];

  const results = [
    {
      profile: 'Female, 45',
      before: 'Exhausted every day by early afternoon. Brain fog making it hard to work. Sleeping 8 hours but waking up tired.',
      after: 'By week 3, energy sustained through the full day. Mental clarity returned. "I feel like a different person."'
    },
    {
      profile: 'Male, 52',
      before: 'Brain fog so bad he thought something was seriously wrong. PCP ran tests — everything came back "normal."',
      after: 'After 6 weeks: mental sharpness returned, afternoon crashes gone, sleeping deeper and waking rested.'
    },
    {
      profile: 'Female, 41',
      before: 'Joint stiffness, general soreness, feeling 10 years older than she was. Low energy and flat mood.',
      after: 'Inflammation noticeably reduced by week 4. Energy improved steadily. "I feel like myself again — I didn\'t realize how much I\'d lost."'
    }
  ];

  return (
    <Layout title="Cellular Energy Reset | 6-Week HBOT + Red Light Protocol | Newport Beach | Range Medical" description="Chronic fatigue, brain fog, or slow recovery? The 6-week Cellular Energy Reset combines HBOT and Red Light Therapy. Start with a Range Assessment at Range Medical.">
      <Head>
        <meta name="keywords" content="cellular energy reset Newport Beach, HBOT red light therapy, mitochondrial therapy, chronic fatigue, brain fog, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/cellular-energy-reset" />
        <meta property="og:title" content="Cellular Energy Reset | Newport Beach | Range Medical" />
        <meta property="og:description" content="A 6-week protocol combining HBOT and Red Light Therapy for cellular energy restoration. Start with a Range Assessment." />
        <meta property="og:url" content="https://www.range-medical.com/cellular-energy-reset" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="geo.region" content="US-CA" />
        <meta name="geo.placename" content="Newport Beach" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
          { "@context": "https://schema.org", "@type": "MedicalBusiness", "name": "Range Medical", "url": "https://www.range-medical.com", "telephone": "(949) 997-3988", "address": { "@type": "PostalAddress", "streetAddress": "1901 Westcliff Dr. Suite 10", "addressLocality": "Newport Beach", "addressRegion": "CA", "postalCode": "92660", "addressCountry": "US" } },
          { "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faqs.map(faq => ({ "@type": "Question", "name": faq.question, "acceptedAnswer": { "@type": "Answer", "text": faq.answer } })) }
        ]) }} />
      </Head>

      <div className="trust-bar"><div className="trust-inner"><span className="trust-item"><span className="trust-rating">5.0</span> on Google</span><span className="trust-item">Newport Beach, CA</span><span className="trust-item">Board-Certified Providers</span></div></div>

      <div className="tx-page">
        <section className="tx-hero"><div className="tx-container">
          <div className="tx-label">CELLULAR ENERGY RESET</div>
          <h1>Tired all the time and nothing&apos;s working? <em>The problem is deeper than you think.</em></h1>
          <div className="tx-rule" />
          <p className="tx-hero-sub">The Cellular Energy Reset is a structured 6-week protocol combining HBOT and Red Light Therapy. It starts with a Range Assessment to determine if this approach is right for you.</p>
          <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
          <span className="tx-btn-note">We&apos;ll evaluate your situation and determine together if the Cellular Energy Reset belongs in your plan.</span>
        </div></section>

        <section className="tx-section"><div className="tx-container">
          <div className="tx-animate"><div className="tx-label">IS THIS YOU</div><h2>Is this you?</h2><div className="tx-rule" /></div>
          <ul className="tx-symptoms tx-animate">{symptoms.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div></section>

        <section className="tx-section-alt"><div className="tx-container">
          <div className="tx-animate">
            <div className="tx-label">HOW WE HELP AT RANGE MEDICAL</div>
            <h2>When fatigue starts in your cells, <em>that&apos;s where we fix it.</em></h2>
            <div className="tx-rule" />
            <p className="tx-section-intro">Every patient starts with the Range Assessment &mdash; a thorough evaluation of your symptoms, health history, and goals. If the Cellular Energy Reset is a good fit, your provider will build the 6-week protocol into a plan that may also include IV therapy, peptides, or other tools to support your recovery.</p>
          </div>
          <div className="tx-science tx-animate">
            <div className="tx-science-label">For the science-minded</div>
            <p>This protocol combines two therapies that work synergistically at the cellular level. Hyperbaric oxygen therapy (HBOT) delivers oxygen under pressure, flooding your cells with the raw material they need for energy production. Red light therapy (photobiomodulation at 660&ndash;850nm) activates cytochrome c oxidase in your mitochondria, directly stimulating ATP production. Together, they restore mitochondrial function &mdash; addressing fatigue, brain fog, and slow recovery at the source rather than masking symptoms.</p>
          </div>
        </div></section>

        <section className="tx-section"><div className="tx-container">
          <div className="tx-animate"><div className="tx-label">YOUR JOURNEY</div><h2>Three steps to <em>restored energy.</em></h2><div className="tx-rule" /></div>
          <div className="tx-steps tx-animate">
            <div className="tx-step"><div className="tx-step-num">01</div><h3>Range Assessment</h3><p>A thorough evaluation of your symptoms, health history, and goals to determine if this protocol is right for you.</p></div>
            <div className="tx-step"><div className="tx-step-num">02</div><h3>6-Week Protocol</h3><p>18 HBOT + 18 Red Light sessions over 6 weeks (3x/week). Your provider monitors your progress with weekly check-ins.</p></div>
            <div className="tx-step"><div className="tx-step-num">03</div><h3>Results Review</h3><p>At the end of your protocol, we review your progress, measure improvements, and create a maintenance plan to preserve your gains.</p></div>
          </div>
          <div className="tx-animate" style={{ marginTop: '3rem' }}><Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link></div>
        </div></section>

        <section className="tx-section-alt"><div className="tx-container">
          <div className="tx-animate"><div className="tx-label">WHAT YOUR PLAN MIGHT INCLUDE</div><h2>Example treatment plans</h2><div className="tx-rule" /><p className="tx-section-intro">Your provider will only recommend the Cellular Energy Reset if your evaluation shows it&apos;s a good fit. These are the options, not a self-serve menu.</p></div>
          <div className="tx-plans tx-animate">{plans.map((plan, i) => (<div key={i} className="tx-plan-card"><div className="tx-plan-name">{plan.name}</div><p className="tx-plan-freq">{plan.desc}</p><p className="tx-plan-freq">{plan.freq}</p><div className="tx-plan-price">{plan.price}</div></div>))}</div>
        </div></section>

        <section className="tx-section-dark"><div className="tx-container">
          <div className="tx-animate">
            <div className="tx-label">REAL RESULTS</div>
            <h2>What patients have <em>experienced.</em></h2>
            <div className="tx-rule" />
            <p className="tx-section-intro">Real outcomes from our Newport Beach clinic. Names withheld for privacy. Every case started with a Range Assessment.</p>
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
        </div></section>

        <section className="tx-section-alt"><div className="tx-container">
          <div className="tx-label">COMMON QUESTIONS</div><h2>Questions about the Cellular Energy Reset</h2>
          <div className="tx-faq-list">{faqs.map((faq, index) => (<div key={index} className={`tx-faq-item ${openFaq === index ? 'tx-faq-open' : ''}`}><button className="tx-faq-question" onClick={() => toggleFaq(index)}><span>{faq.question}</span><span className="tx-faq-toggle">{openFaq === index ? '−' : '+'}</span></button><div className="tx-faq-answer"><p>{faq.answer}</p></div></div>))}</div>
        </div></section>

        <section className="tx-cta"><div className="tx-container tx-animate">
          <h2>If you&apos;re tired of being tired and nothing else has worked &mdash; <em>start here.</em></h2>
          <p>The first step is understanding what&apos;s going on at the cellular level. Your provider will take it from there.</p>
          <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
          <a href="tel:9499973988" className="tx-cta-phone">(949) 997-3988</a>
        </div></section>
      </div>
    </Layout>
  );
}
