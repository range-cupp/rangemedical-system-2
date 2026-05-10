import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function PRPTherapy() {
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
    { question: "How do I know if PRP is right for me?", answer: "Start with a Range Assessment. Your provider will evaluate your injury and determine whether PRP — or another approach — makes sense." },
    { question: "Does PRP hurt?", answer: "We use local anesthesia at the injection site. Most patients describe it as mild pressure. The blood draw is a standard draw — quick and easy." },
    { question: "How many sessions will I need?", answer: "It depends on your condition. Many patients see improvement after 1–3 sessions spaced a few weeks apart. Your provider will recommend a plan based on your situation." },
    { question: "How long until I see results?", answer: "Most patients notice improvement within 2–6 weeks. Full results may take 3–6 months depending on the area being treated." },
    { question: "Is PRP safe?", answer: "Yes. PRP uses your own blood — there's no risk of allergic reaction or rejection. It's been used in orthopedic and sports medicine for years." },
    { question: "What conditions does PRP treat?", answer: "Joint pain, tendon injuries, ligament sprains, muscle tears, and tissue regeneration. Your provider will determine if it's appropriate for your condition." }
  ];

  const symptoms = [
    "Joint pain that hasn't responded to rest or PT alone",
    "A tendon injury that won't fully heal",
    "Chronic pain in a knee, shoulder, elbow, or hip",
    "Post-surgical healing that feels stalled",
    "An old injury that still flares up",
    "Looking for a non-surgical option before considering surgery"
  ];

  const plans = [
    { name: 'Joint Recovery', desc: 'For chronic joint pain, arthritis, or cartilage issues. PRP injected directly into the affected joint.', freq: '1–3 sessions spaced 4–6 weeks apart.', price: 'Pricing discussed after your assessment' },
    { name: 'Tendon & Ligament Repair', desc: 'For tennis elbow, plantar fasciitis, rotator cuff issues, or other tendon/ligament injuries.', freq: '1–2 sessions with follow-up evaluation.', price: 'Pricing discussed after your assessment' },
    { name: 'Post-Surgical Support', desc: 'PRP alongside physical therapy to accelerate healing after surgery.', freq: 'Timing coordinated with your surgical recovery plan.', price: 'Pricing discussed after your assessment' }
  ];

  return (
    <Layout title="PRP Therapy | Platelet-Rich Plasma | Newport Beach | Range Medical" description="Joint pain or an injury that won't heal? PRP therapy may be part of your plan. Start with a Range Assessment at Range Medical in Newport Beach.">
      <Head>
        <meta name="keywords" content="PRP therapy Newport Beach, platelet-rich plasma Orange County, joint pain, tendon injury, regenerative medicine, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/prp-therapy" />
        <meta property="og:title" content="PRP Therapy | Newport Beach | Range Medical" />
        <meta property="og:description" content="Platelet-rich plasma therapy for joint pain, tendon injuries, and tissue repair. Start with a Range Assessment." />
        <meta property="og:url" content="https://www.range-medical.com/prp-therapy" />
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
          <div className="tx-label">PRP THERAPY</div>
          <h1>Your body already knows how to heal. <em>We concentrate it.</em></h1>
          <div className="tx-rule" />
          <p className="tx-hero-sub">Range Medical starts with a full assessment of your injury and goals. If PRP therapy fits your situation, your provider will build it into a recovery plan designed around you.</p>
          <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
          <span className="tx-btn-note">We&apos;ll evaluate your injury and determine together if PRP belongs in your plan.</span>
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
            <p className="tx-section-intro">Every patient starts with the Range Assessment &mdash; a thorough evaluation of your injury, medical history, and goals. If PRP is a good fit, your provider will design a recovery plan that may include PRP alongside other tools like peptide therapy, HBOT, or physical therapy coordination.</p>
          </div>
          <div className="tx-science tx-animate">
            <div className="tx-science-label">For the science-minded</div>
            <p>PRP (platelet-rich plasma) concentrates your own blood&apos;s growth factors to 3&ndash;5x normal levels. We draw a small amount of blood, spin it in a centrifuge to separate and concentrate the platelets, then inject the PRP directly into the injured area. The concentrated growth factors may accelerate tissue repair, reduce inflammation, and support healing in joints, tendons, and ligaments.</p>
          </div>
        </div></section>

        <section className="tx-section"><div className="tx-container">
          <div className="tx-animate"><div className="tx-label">YOUR JOURNEY</div><h2>Three steps to <em>recovery.</em></h2><div className="tx-rule" /></div>
          <div className="tx-steps tx-animate">
            <div className="tx-step"><div className="tx-step-num">01</div><h3>Range Assessment</h3><p>A thorough evaluation of your injury, medical history, and recovery goals with your provider.</p></div>
            <div className="tx-step"><div className="tx-step-num">02</div><h3>Personalized Plan</h3><p>Your provider determines if PRP is the right approach and designs a recovery plan that may include other supportive therapies.</p></div>
            <div className="tx-step"><div className="tx-step-num">03</div><h3>Ongoing Support</h3><p>We monitor your healing, schedule follow-up sessions if needed, and adjust your plan based on your progress.</p></div>
          </div>
          <div className="tx-animate" style={{ marginTop: '3rem' }}><Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link></div>
        </div></section>

        <section className="tx-section-alt"><div className="tx-container">
          <div className="tx-animate"><div className="tx-label">WHAT YOUR PLAN MIGHT INCLUDE</div><h2>Example treatment plans</h2><div className="tx-rule" /><p className="tx-section-intro">Your provider will only recommend PRP if your evaluation shows it&apos;s a good fit. These are common examples, not a self-serve menu.</p></div>
          <div className="tx-plans tx-animate">{plans.map((plan, i) => (<div key={i} className="tx-plan-card"><div className="tx-plan-name">{plan.name}</div><p className="tx-plan-freq">{plan.desc}</p><p className="tx-plan-freq">{plan.freq}</p><div className="tx-plan-price">{plan.price}</div></div>))}</div>
        </div></section>

        <section className="tx-section-alt"><div className="tx-container">
          <div className="tx-label">COMMON QUESTIONS</div><h2>Questions about PRP therapy</h2>
          <div className="tx-faq-list">{faqs.map((faq, index) => (<div key={index} className={`tx-faq-item ${openFaq === index ? 'tx-faq-open' : ''}`}><button className="tx-faq-question" onClick={() => toggleFaq(index)}><span>{faq.question}</span><span className="tx-faq-toggle">{openFaq === index ? '−' : '+'}</span></button><div className="tx-faq-answer"><p>{faq.answer}</p></div></div>))}</div>
        </div></section>

        <section className="tx-cta"><div className="tx-container tx-animate">
          <h2>If you have an injury that won&apos;t heal or joint pain that won&apos;t quit &mdash; <em>start here.</em></h2>
          <p>The first step is understanding what&apos;s going on and whether PRP can help. Your provider will take it from there.</p>
          <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
          <a href="tel:9499973988" className="tx-cta-phone">(949) 997-3988</a>
        </div></section>
      </div>
    </Layout>
  );
}
