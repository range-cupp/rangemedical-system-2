import Layout from '../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function MethyleneBlue() {
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
    { question: "How do I know if methylene blue is right for me?", answer: "Start with a Range Assessment. Your provider will review your symptoms, labs, and medications to determine if methylene blue — or another approach — is the best fit for you." },
    { question: "Why does it turn my pee blue?", answer: "That's normal. When your body absorbs methylene blue, the leftover gets filtered through your kidneys. The blue color just means it went through your system. It's harmless." },
    { question: "Can I take it if I'm on other medications?", answer: "Methylene blue can interact with certain medications, especially SSRIs and other serotonin-affecting drugs. Your provider will screen for this during your assessment before recommending anything." },
    { question: "How fast will I notice a difference?", answer: "Some people notice clearer thinking and better mood within the first few days. Everyone responds differently. Your provider will help you find the right approach." },
    { question: "Is it safe?", answer: "At low doses, methylene blue has a well-established safety profile backed by over 140 years of medical use. We review your full history before recommending it." },
    { question: "What's the difference between capsules and IV?", answer: "Capsules are for daily support — easy to take at home. The IV delivers methylene blue directly into your bloodstream for a more concentrated effect. Your provider will recommend the right approach based on your situation." }
  ];

  const symptoms = [
    "Brain fog that makes it hard to focus or think clearly",
    "Afternoon energy crashes — hitting a wall by 2 p.m.",
    "Flat mood or low motivation for no clear reason",
    "Feeling mentally slower than you used to",
    "Sleep that doesn't recharge you",
    "Looking for cellular-level support beyond standard supplements"
  ];

  const plans = [
    { name: 'Daily Capsule Protocol', desc: 'Methylene blue capsules (25mg) for daily cellular energy and mood support. Easy to take at home.', freq: 'Daily, as directed by your provider.', price: '$197 per bottle' },
    { name: 'Blu Liquid Dropper', desc: 'Liquid methylene blue for easy dosing and adjustment. Same benefits as capsules in dropper form.', freq: 'Daily, dose adjusted by your provider.', price: '$197 per bottle' },
    { name: 'Methylene Blue IV', desc: 'Pharmaceutical-grade methylene blue delivered IV with high-dose vitamin C and magnesium for deeper support.', freq: 'Sessions as recommended by your provider.', price: 'Pricing discussed after your assessment' }
  ];

  return (
    <Layout title="Methylene Blue | Cellular Energy & Mood Support | Newport Beach | Range Medical" description="Brain fog, low energy, or flat mood? Methylene blue may be part of your plan. Start with a Range Assessment at Range Medical in Newport Beach.">
      <Head>
        <meta name="keywords" content="methylene blue Newport Beach, methylene blue capsules, methylene blue IV, cellular energy, mood support, brain health, Range Medical" />
        <link rel="canonical" href="https://www.range-medical.com/methylene-blue" />
        <meta property="og:title" content="Methylene Blue | Cellular Energy & Mood Support | Newport Beach" />
        <meta property="og:description" content="Methylene blue for cellular energy, mood, and brain function. Start with a Range Assessment." />
        <meta property="og:url" content="https://www.range-medical.com/methylene-blue" />
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
          <div className="tx-label">METHYLENE BLUE</div>
          <h1>Brain fog, flat mood, crashing by 2 p.m.? <em>It starts in your cells.</em></h1>
          <div className="tx-rule" />
          <p className="tx-hero-sub">Range Medical starts with a full assessment. If methylene blue fits your situation, your provider will build it into a plan designed around your goals.</p>
          <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
          <span className="tx-btn-note">We&apos;ll review your symptoms and determine together if methylene blue belongs in your plan.</span>
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
            <p className="tx-section-intro">Every patient starts with the Range Assessment &mdash; a thorough review of your symptoms, medical history, and current medications. If methylene blue is a good fit, your provider will recommend the right form and dose as part of a plan that may also include IV therapy, peptides, or other tools.</p>
          </div>
          <div className="tx-science tx-animate">
            <div className="tx-science-label">For the science-minded</div>
            <p>Methylene blue is one of the oldest compounds in modern medicine &mdash; first synthesized in 1876. It works as an electron carrier in the mitochondrial electron transport chain, helping your cells produce ATP more efficiently. It also acts as a monoamine oxidase inhibitor (MAO-A), slowing the breakdown of serotonin and dopamine so they stay active longer. And it serves as a potent antioxidant, neutralizing free radicals before they damage cells. Important: it can interact with SSRIs and other serotonin-affecting medications &mdash; we screen for this before recommending it.</p>
          </div>
        </div></section>

        <section className="tx-section"><div className="tx-container">
          <div className="tx-animate"><div className="tx-label">YOUR JOURNEY</div><h2>Three steps to <em>clarity.</em></h2><div className="tx-rule" /></div>
          <div className="tx-steps tx-animate">
            <div className="tx-step"><div className="tx-step-num">01</div><h3>Range Assessment</h3><p>A thorough review of your symptoms, medications, and health history with your provider.</p></div>
            <div className="tx-step"><div className="tx-step-num">02</div><h3>Personalized Plan</h3><p>Your provider determines if methylene blue is the right approach and recommends the form &mdash; capsule, liquid, or IV &mdash; that fits your goals.</p></div>
            <div className="tx-step"><div className="tx-step-num">03</div><h3>Ongoing Support</h3><p>We monitor how you respond, adjust your protocol as needed, and make sure it&apos;s working the way it should.</p></div>
          </div>
          <div className="tx-animate" style={{ marginTop: '3rem' }}><Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link></div>
        </div></section>

        <section className="tx-section-alt"><div className="tx-container">
          <div className="tx-animate"><div className="tx-label">WHAT YOUR PLAN MIGHT INCLUDE</div><h2>Example treatment plans</h2><div className="tx-rule" /><p className="tx-section-intro">Your provider will only recommend methylene blue if your evaluation shows it&apos;s a good fit. These are common options, not a self-serve menu.</p></div>
          <div className="tx-plans tx-animate">{plans.map((plan, i) => (<div key={i} className="tx-plan-card"><div className="tx-plan-name">{plan.name}</div><p className="tx-plan-freq">{plan.desc}</p><p className="tx-plan-freq">{plan.freq}</p><div className="tx-plan-price">{plan.price}</div></div>))}</div>
        </div></section>

        <section className="tx-section-alt"><div className="tx-container">
          <div className="tx-label">COMMON QUESTIONS</div><h2>Questions about methylene blue</h2>
          <div className="tx-faq-list">{faqs.map((faq, index) => (<div key={index} className={`tx-faq-item ${openFaq === index ? 'tx-faq-open' : ''}`}><button className="tx-faq-question" onClick={() => toggleFaq(index)}><span>{faq.question}</span><span className="tx-faq-toggle">{openFaq === index ? '−' : '+'}</span></button><div className="tx-faq-answer"><p>{faq.answer}</p></div></div>))}</div>
        </div></section>

        <section className="tx-cta"><div className="tx-container tx-animate">
          <h2>If your brain feels slow, your energy crashes early, or your mood just feels flat &mdash; <em>start here.</em></h2>
          <p>The first step is understanding what&apos;s going on and whether methylene blue can help. Your provider will take it from there.</p>
          <Link href="/assessment" className="tx-btn">Book Your Range Assessment</Link>
          <a href="tel:9499973988" className="tx-cta-phone">(949) 997-3988</a>
        </div></section>
      </div>
    </Layout>
  );
}
