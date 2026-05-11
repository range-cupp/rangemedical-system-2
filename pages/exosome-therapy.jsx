import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function ExosomeTherapy() {
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
    { question: "How do I know if exosome therapy is right for me?", answer: "Start with a Range Assessment. Your provider will review your situation and goals to determine whether exosome therapy — or another approach — is the best fit." },
    { question: "What are exosomes?", answer: "Exosomes are tiny cell-signaling molecules that carry instructions between cells. They tell your body's cells to repair, regenerate, and reduce inflammation. Think of them as cellular messengers." },
    { question: "How is it administered?", answer: "Exosomes are delivered via IV infusion at our clinic. The session typically takes 30–60 minutes. Your provider monitors you throughout." },
    { question: "How many sessions will I need?", answer: "It depends on your goals. Some patients benefit from a single session, while others may do a series. Your provider will recommend a plan after your assessment." },
    { question: "Is it safe?", answer: "Exosome therapy has a strong safety profile when administered by trained medical professionals using properly sourced products. We screen every patient before treatment." },
    { question: "Is this the same as stem cell therapy?", answer: "No. Exosomes are cell-signaling molecules, not cells themselves. They carry the regenerative instructions without the complexity or controversy of stem cell therapy." }
  ];

  const symptoms = [
    "Chronic inflammation that won't resolve",
    "Slow healing from injuries or surgery",
    "Signs of accelerated aging — low energy, poor recovery, cognitive decline",
    "Joint degeneration or chronic pain",
    "Wanting regenerative support beyond what standard therapies offer",
    "Looking for cutting-edge, evidence-based options"
  ];

  const plans = [
    { name: 'Regeneration & Recovery', desc: 'For chronic inflammation, slow healing, or joint degeneration. Exosome IV to support your body\'s natural repair processes.', freq: '1–3 sessions based on your provider\'s recommendation.', price: 'Pricing discussed after your assessment' },
    { name: 'Anti-Aging & Longevity', desc: 'For patients focused on cellular health, cognitive function, and healthy aging.', freq: 'Periodic sessions (quarterly or as recommended).', price: 'Pricing discussed after your assessment' },
    { name: 'Combined Protocol', desc: 'Exosomes paired with other therapies like HBOT, peptides, or PRP for a comprehensive regenerative approach.', freq: 'Customized based on your provider\'s plan.', price: 'Pricing discussed after your assessment' }
  ];

  return (
    <Layout title="Exosome Therapy | Regenerative Medicine | Newport Beach | Range Medical" description="Chronic inflammation or slow healing? Exosome therapy may be part of your plan. Start with a Range Assessment at Range Medical in Newport Beach.">
      <Head>
        <meta name="keywords" content="exosome therapy Newport Beach, regenerative medicine Orange County, exosome IV, anti-aging, cellular repair, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/exosome-therapy" />
        <meta property="og:title" content="Exosome Therapy | Newport Beach | Range Medical" />
        <meta property="og:description" content="Exosome IV therapy for regeneration, recovery, and cellular health. Start with a Range Assessment." />
        <meta property="og:url" content="https://www.range-medical.com/exosome-therapy" />
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
          <div className="tx-label">EXOSOME THERAPY</div>
          <h1>When your body stops repairing itself, <em>exosomes pick up the slack.</em></h1>
          <div className="tx-rule" />
          <p className="tx-hero-sub">Range Medical starts with a full assessment. If exosome therapy fits your situation, your provider will build it into a plan designed around your goals.</p>
          <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
          <span className="tx-btn-note">We&apos;ll review your situation and goals, then decide together if exosome therapy belongs in your plan.</span>
        </div></section>

        <section className="tx-section"><div className="tx-container">
          <div className="tx-animate"><div className="tx-label">IS THIS YOU</div><h2>Is this you?</h2><div className="tx-rule" /></div>
          <ul className="tx-symptoms tx-animate">{symptoms.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div></section>

        <section className="tx-section-alt"><div className="tx-container">
          <div className="tx-animate">
            <div className="tx-label">HOW WE HELP AT RANGE MEDICAL</div>
            <h2>We don&apos;t guess. <em>We evaluate first.</em></h2>
            <div className="tx-rule" />
            <p className="tx-section-intro">Every patient starts with the Range Assessment &mdash; a thorough review of your health, goals, and history. If exosome therapy is a good fit, your provider will design a plan that may include exosomes alongside other tools like HBOT, peptides, PRP, or IV therapy.</p>
          </div>
          <div className="tx-science tx-animate">
            <div className="tx-science-label">For the science-minded</div>
            <p>Exosomes are extracellular vesicles (30&ndash;150nm) that carry proteins, lipids, and RNA between cells, acting as intercellular messengers. They signal your body&apos;s cells to activate repair pathways, reduce inflammation, and support tissue regeneration. Unlike stem cells, exosomes are cell-free &mdash; they carry the regenerative instructions without the complexity of live cell therapy.</p>
          </div>
        </div></section>

        <section className="tx-section"><div className="tx-container">
          <div className="tx-animate"><div className="tx-label">YOUR JOURNEY</div><h2>Three steps to <em>regeneration.</em></h2><div className="tx-rule" /></div>
          <div className="tx-steps tx-animate">
            <div className="tx-step"><div className="tx-step-num">01</div><h3>Range Assessment</h3><p>A thorough evaluation of your health, goals, and medical history with your provider.</p></div>
            <div className="tx-step"><div className="tx-step-num">02</div><h3>Personalized Plan</h3><p>Your provider determines if exosome therapy is the right approach and designs a plan that may include other supportive therapies.</p></div>
            <div className="tx-step"><div className="tx-step-num">03</div><h3>Ongoing Support</h3><p>We monitor your response, schedule follow-up sessions if needed, and adjust your plan based on your progress.</p></div>
          </div>
          <div className="tx-animate" style={{ marginTop: '3rem' }}><Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link></div>
        </div></section>

        <section className="tx-section-alt"><div className="tx-container">
          <div className="tx-animate"><div className="tx-label">WHAT YOUR PLAN MIGHT INCLUDE</div><h2>Example treatment plans</h2><div className="tx-rule" /><p className="tx-section-intro">Your provider will only recommend exosome therapy if your evaluation shows it&apos;s a good fit. These are common examples, not a self-serve menu.</p></div>
          <div className="tx-plans tx-animate">{plans.map((plan, i) => (<div key={i} className="tx-plan-card"><div className="tx-plan-name">{plan.name}</div><p className="tx-plan-freq">{plan.desc}</p><p className="tx-plan-freq">{plan.freq}</p><div className="tx-plan-price">{plan.price}</div></div>))}</div>
        </div></section>

        <section className="tx-section-alt"><div className="tx-container">
          <div className="tx-label">COMMON QUESTIONS</div><h2>Questions about exosome therapy</h2>
          <div className="tx-faq-list">{faqs.map((faq, index) => (<div key={index} className={`tx-faq-item ${openFaq === index ? 'tx-faq-open' : ''}`}><button className="tx-faq-question" onClick={() => toggleFaq(index)}><span>{faq.question}</span><span className="tx-faq-toggle">{openFaq === index ? '−' : '+'}</span></button><div className="tx-faq-answer"><p>{faq.answer}</p></div></div>))}</div>
        </div></section>

        <section className="tx-cta"><div className="tx-container tx-animate">
          <h2>If you&apos;re dealing with chronic inflammation, slow healing, or accelerated aging &mdash; <em>start here.</em></h2>
          <p>The first step is understanding your situation and whether exosome therapy can help. Your provider will take it from there.</p>
          <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
          <a href="tel:9499973988" className="tx-cta-phone">(949) 997-3988</a>
        </div></section>
      </div>
    </Layout>
  );
}
