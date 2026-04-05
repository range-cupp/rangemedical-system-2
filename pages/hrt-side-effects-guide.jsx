import Layout from '../components/Layout';
import Head from 'next/head';
import { useState } from 'react';

const sideEffects = [
  {
    id: 'acne',
    num: 1,
    title: 'Acne & Oily Skin',
    freq: 'COMMON',
    freqNote: 'Especially with testosterone therapy. Usually appears in the first few weeks.',
    what: 'Breakouts on face, shoulders, or back. Skin feels oilier than usual. Similar to puberty-like skin changes — because the hormonal mechanism is the same.',
    why: 'Testosterone stimulates oil (sebum) production in your skin glands. Your skin needs time to adjust to the new hormone levels. This typically settles down over weeks as your body finds its new baseline.',
    tryFirst: [
      'Gentle cleanser twice daily — morning and night',
      'Benzoyl peroxide spot treatment on active breakouts',
      'Non-comedogenic moisturizer (will not clog pores)',
      'Change pillowcases frequently — every 2-3 days',
    ],
    ifContinues: [
      'Contact us if acne persists beyond 4-6 weeks',
      'May indicate your dose is too high — we adjust based on labs and symptoms',
      'We may recommend a topical retinoid or refer to dermatology if needed',
    ],
    severe: null,
    reassureTitle: 'Your Skin Will Adjust',
    reassure: 'Most acne resolves within 2-3 months as your body stabilizes at the new hormone level. This is one of the most common and most temporary side effects.',
  },
  {
    id: 'fluid',
    num: 2,
    title: 'Fluid Retention & Bloating',
    freq: 'COMMON',
    freqNote: 'Especially in the first few weeks of therapy. Usually resolves on its own.',
    what: 'Feeling puffy or bloated. Rings feel tighter. Weight up 2-5 lbs on the scale. Ankles may be slightly swollen. Clothes fit differently even though body composition has not changed.',
    why: 'Testosterone and estrogen both affect how your kidneys handle sodium and water. During the adjustment period, your body retains more fluid than usual. This is a temporary recalibration — not fat gain.',
    tryFirst: [
      'Reduce sodium intake — avoid processed and packaged foods',
      'Drink MORE water (counterintuitive but it works — signals kidneys to release fluid)',
      'Light exercise — walking, swimming, or cycling helps circulation',
      'Elevate legs if you notice ankle swelling',
    ],
    ifContinues: [
      'Contact us for labs — we check kidney function and hormone levels',
      'May need a dose adjustment or addition of a mild diuretic',
      'Persistent bloating beyond 4 weeks warrants a closer look',
    ],
    severe: [
      'Sudden significant swelling in legs, ankles, or face',
      'Shortness of breath or difficulty breathing',
      'Chest pain or pressure',
    ],
    reassureTitle: 'Not Fat Gain',
    reassure: 'This is water retention, not fat. The scale may go up but your body composition is not changing for the worse. Stabilizes within 2-4 weeks for most patients.',
  },
  {
    id: 'mood',
    num: 3,
    title: 'Mood Changes',
    freq: 'COMMON',
    freqNote: 'Most noticeable in the first few weeks as hormone levels adjust.',
    what: 'Irritability, feeling more emotional than usual, mood swings, feeling "on edge." Some people experience a wave of euphoria early on. Others feel more tearful or reactive. Think of it as emotional jet lag.',
    why: 'Your brain has hormone receptors throughout it. When hormone levels change significantly, mood regulation temporarily recalibrates. Your brain is literally adjusting to a new chemical environment — this takes time.',
    tryFirst: [
      'Prioritize sleep — 7-9 hours per night is non-negotiable during this adjustment',
      'Regular exercise — even 20 minutes of walking helps regulate mood',
      'Limit alcohol and caffeine — both amplify mood instability',
      'Give it 2-4 weeks before making any changes',
    ],
    ifContinues: [
      'Contact us if mood changes persist beyond 4 weeks',
      'Persistent irritability or emotional swings may mean your dose needs adjustment',
      'We may need to check estrogen conversion — testosterone can convert to estrogen, which affects mood',
    ],
    severe: [
      'Depression that interferes with daily life or work',
      'Anxiety that feels unmanageable or is getting worse',
      'Thoughts of self-harm — contact us immediately or call 988',
    ],
    reassureTitle: 'Your Brain Is Recalibrating',
    reassure: 'Mood stabilizes as hormone levels reach a steady state. This typically happens within 4-6 weeks. Most patients report feeling better — not worse — once levels are optimized.',
  },
  {
    id: 'libido',
    num: 4,
    title: 'Changes in Libido',
    freq: 'COMMON',
    freqNote: 'Especially noticeable with testosterone therapy. Changes can go in either direction.',
    what: 'Libido may spike dramatically at first — especially with testosterone. Then it may fluctuate before settling. Some people notice increased physical sensitivity. Others experience a temporary dip before improvement.',
    why: 'Testosterone directly drives libido in both men and women. As levels optimize and stabilize, your drive normalizes to a healthy, sustainable baseline. The initial spike is from levels rising faster than your body can adjust to.',
    tryFirst: [
      'Communicate openly with your partner about changes',
      'Give your body time to adjust — fluctuations are normal in the first 4-6 weeks',
      'Stay consistent with your dosing schedule',
    ],
    ifContinues: [
      'If libido is too high or too low after 6 weeks, contact us',
      'We review labs and adjust your dose accordingly',
      'Estrogen levels may need to be checked — high estrogen can suppress libido',
    ],
    severe: null,
    reassureTitle: 'Finding Your New Normal',
    reassure: 'Libido settles into a healthy, sustainable range once hormones are optimized. Most patients report significant improvement in this area long-term.',
  },
  {
    id: 'hematocrit',
    num: 5,
    title: 'Elevated Hematocrit / Red Blood Cells',
    freq: 'IMPORTANT',
    freqNote: 'Specific to testosterone therapy. You will not feel this — it is caught on bloodwork.',
    what: 'You may not feel anything at all. This is detected through routine blood tests. Higher hematocrit means your blood is thicker — more red blood cells per volume of blood. This is why we monitor labs regularly.',
    why: 'Testosterone stimulates red blood cell production (erythropoiesis). In moderation, this is actually beneficial — it improves oxygen delivery and energy. But if hematocrit rises too high, it increases the risk of blood clots.',
    tryFirst: [
      'Stay well hydrated — dehydration concentrates blood and makes hematocrit read higher',
      'Donate blood if recommended by your provider',
      'Attend all scheduled lab appointments on time',
      'Avoid excessive alcohol — it can affect blood viscosity',
    ],
    ifContinues: [
      'If hematocrit rises above 52-54%, we take action',
      'Options include: reducing dose, increasing injection frequency (smaller more frequent doses), or therapeutic blood donation',
      'We monitor CBC (complete blood count) every 3-6 months',
    ],
    severe: [
      'Severe headache that does not respond to usual remedies',
      'Vision changes — blurriness, floaters, or partial vision loss',
      'Shortness of breath at rest or with minimal activity',
      'Leg swelling, pain, or warmth — especially one-sided (signs of a clot)',
    ],
    reassureTitle: 'This Is Why We Monitor',
    reassure: 'Routine bloodwork catches elevated hematocrit early, long before it becomes dangerous. It is easily managed with dose adjustment or blood donation. This is one of the main reasons we require regular labs.',
  },
  {
    id: 'breast',
    num: 6,
    title: 'Breast Tenderness',
    freq: 'COMMON',
    freqNote: 'Related to estrogen levels — either direct estrogen therapy or testosterone converting to estrogen.',
    what: 'Nipples or breast tissue feel sensitive, tender, or slightly swollen. May notice soreness when touched or when wearing tight clothing. Can occur on one or both sides.',
    why: 'Some testosterone converts to estrogen via an enzyme called aromatase. Elevated estrogen levels cause breast tissue to become sensitive. This can also happen with direct estrogen therapy if levels climb too high.',
    tryFirst: [
      'Give it 2-3 weeks — often resolves on its own as levels stabilize',
      'Wear supportive, comfortable clothing',
      'Avoid direct pressure on the area',
    ],
    ifContinues: [
      'Contact us — we check your estradiol (estrogen) levels',
      'May add an aromatase inhibitor (anastrozole) to control testosterone-to-estrogen conversion',
      'Dose adjustment may be needed if estrogen is significantly elevated',
    ],
    severe: null,
    reassureTitle: 'Very Treatable',
    reassure: 'An aromatase inhibitor (AI) quickly resolves this in almost all cases. Once estrogen levels are brought into range, tenderness typically disappears within 1-2 weeks.',
  },
  {
    id: 'hair',
    num: 7,
    title: 'Hair Changes',
    freq: 'LESS COMMON',
    freqNote: 'Depends on genetics. Body hair changes are common; scalp thinning is less so.',
    what: 'May notice increased body hair growth with testosterone — chest, arms, legs. Some people with a genetic predisposition (androgenic alopecia) may notice scalp hair thinning. These are two separate effects of the same hormone.',
    why: 'Testosterone converts to DHT (dihydrotestosterone), which affects hair follicles differently depending on location. DHT stimulates body hair growth but can miniaturize scalp hair follicles in those who are genetically susceptible.',
    tryFirst: [
      'If scalp thinning concerns you, talk to us early — proactive treatment works best',
      'Finasteride or minoxidil can be added to your protocol if appropriate',
      'Body hair changes are cosmetic and can be managed with grooming',
    ],
    ifContinues: null,
    severe: null,
    reassureTitle: 'Manageable',
    reassure: 'DHT-related hair changes can be addressed with targeted treatment. Not everyone experiences scalp thinning — it depends on your genetics. Early intervention gives the best results.',
  },
  {
    id: 'sleep',
    num: 8,
    title: 'Sleep Changes',
    freq: 'LESS COMMON',
    freqNote: 'Many patients actually sleep better on HRT. Some initially have disruptions.',
    what: 'Some people sleep significantly better on HRT — this is the more common outcome. Others initially have trouble falling asleep, feel "wired" at bedtime, or wake up earlier than usual. Energy increases can temporarily throw off sleep patterns.',
    why: 'Testosterone affects sleep architecture and can increase energy levels and alertness. This is usually a positive effect, but if dose timing or levels are off, it can temporarily disrupt your normal sleep cycle.',
    tryFirst: [
      'Inject in the morning if applicable — avoid evening dosing',
      'Maintain a consistent sleep schedule — same bedtime and wake time daily',
      'Limit screens for 1 hour before bed',
      'Avoid caffeine after noon',
    ],
    ifContinues: [
      'Contact us — timing or dose adjustment often resolves sleep issues',
      'We may recommend splitting the dose or changing injection timing',
      'Persistent insomnia beyond 3-4 weeks should be evaluated',
    ],
    severe: null,
    reassureTitle: 'Usually Improves',
    reassure: 'Most patients report significantly better sleep quality once hormones stabilize. Deep sleep and recovery improve. Initial disruptions are typically short-lived.',
  },
  {
    id: 'injection',
    num: 9,
    title: 'Injection Site Reactions',
    freq: 'LESS COMMON',
    freqNote: 'More common with intramuscular (IM) testosterone injections. Improves with practice.',
    what: 'Soreness, redness, or a small lump at the injection site. May feel like a deep bruise for 1-2 days. Usually occurs with IM (intramuscular) testosterone injections in the glute, deltoid, or quad.',
    why: 'This is a normal tissue response to injected oil-based medication. The muscle is reacting to the volume and carrier oil. Technique, injection speed, and site rotation all affect how much soreness you experience.',
    tryFirst: [
      'Warm the medication in your hands for 1-2 minutes before injecting',
      'Inject slowly — rushing increases soreness',
      'Rotate injection sites — glutes, deltoids, and quads',
      'Massage the area gently after injection to help disperse the oil',
    ],
    ifContinues: [
      'Contact us if soreness is severe or worsening with each injection',
      'We can review your technique or switch to a different injection site or method',
    ],
    severe: [
      'Expanding redness or warmth around the injection site',
      'Fever after injection',
      'Pus or discharge from the site',
      'Any signs of infection — increasing pain, swelling, or red streaking',
    ],
    reassureTitle: 'Gets Easier',
    reassure: 'Injection technique improves with practice. Most patients report that soreness decreases significantly after the first few injections. It becomes routine.',
  },
];

export default function HrtSideEffectsGuide() {
  const [activeNav, setActiveNav] = useState(null);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Layout
      title="HRT Side Effects Guide | Range Medical"
      description="Complete guide to managing hormone replacement therapy side effects. Testosterone, estrogen, and progesterone — what to expect and what to do. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "HRT Side Effects Guide",
              "description": "Complete guide to managing hormone replacement therapy side effects. Testosterone, estrogen, and progesterone — what to expect and what to do.",
              "url": "https://www.range-medical.com/hrt-side-effects-guide",
              "provider": {
                "@type": "MedicalBusiness",
                "name": "Range Medical",
                "telephone": "+1-949-997-3988",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "1901 Westcliff Dr. Suite 10",
                  "addressLocality": "Newport Beach",
                  "addressRegion": "CA",
                  "postalCode": "92660",
                  "addressCountry": "US"
                }
              }
            })
          }}
        />
      </Head>

      {/* Hero */}
      <section className="guide-hero">
        <div className="container">
          <div className="v2-label center"><span className="v2-dot" /> SIDE EFFECT MANAGEMENT GUIDE</div>
          <h1>HRT SIDE EFFECTS</h1>
          <div className="hero-rule" />
          <p className="hero-sub">Every side effect explained in plain English. What it feels like, why it happens, and exactly what to do about it — step by step.</p>
        </div>
      </section>

      {/* Overview */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> WHAT TO EXPECT</div>
          <h2 className="section-title">Side Effects Are Normal — And Usually a Sign It Is Working</h2>
          <p className="body-text">
            Hormone replacement therapy restores testosterone, estrogen, and progesterone to optimal levels. Your body needs time to adjust to this new hormonal environment — and during that adjustment, you may notice some changes.
          </p>
          <p className="body-text">
            Most side effects are mild, temporary, and completely manageable. They are a sign that your hormones are shifting — which is exactly the point. We monitor your progress with regular bloodwork to make sure everything stays in the right range.
          </p>
          <p className="body-text">
            This guide covers every common side effect, explains what is happening in your body, and gives you a clear action plan — from simple home remedies to when you should call us.
          </p>
        </div>
      </section>

      {/* Nav Grid */}
      <section className="section section-gray">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> QUICK NAVIGATION</div>
          <h2 className="section-title">Jump to Any Side Effect</h2>
          <p className="section-subtitle">Click any card below to jump directly to that section.</p>

          <div className="nav-grid">
            {sideEffects.map((se) => (
              <a key={se.id} className="nav-card" href={`#${se.id}`} onClick={(e) => { e.preventDefault(); scrollTo(se.id); }}>
                <div className="nav-icon">{se.num}</div>
                <div>
                  <strong>{se.title}</strong>
                  <p>{se.freq}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Side Effects */}
      {sideEffects.map((se, i) => (
        <section key={se.id} id={se.id} className={`section ${i % 2 === 1 ? 'section-gray' : ''}`}>
          <div className="container">
            <div className="se-header">
              <div className="se-number">{se.num}</div>
              <div>
                <div className="v2-label"><span className="v2-dot" /> {se.freq}</div>
                <h2 className="section-title">{se.title}</h2>
              </div>
            </div>
            <p className="se-freq">{se.freqNote}</p>

            <div className="what-box">
              <h3>What It Feels Like</h3>
              <p>{se.what}</p>
            </div>

            <div className="why-box">
              <h3>Why It Happens</h3>
              <p>{se.why}</p>
            </div>

            <h3 className="steps-header">What to Do About It</h3>

            {se.tryFirst && (
              <div className="tier-card">
                <div className="tier-label green">Try First</div>
                <div className="tier-body">
                  {se.tryFirst.map((item, j) => (
                    <div key={j} className="action-item"><strong>{j + 1}.</strong> {item}</div>
                  ))}
                </div>
              </div>
            )}

            {se.ifContinues && (
              <div className="tier-card">
                <div className="tier-label yellow">If It Continues</div>
                <div className="tier-body">
                  {se.ifContinues.map((item, j) => (
                    <div key={j} className="action-item">{item}</div>
                  ))}
                </div>
              </div>
            )}

            {se.severe && (
              <div className="tier-card">
                <div className="tier-label orange">If Severe / Call Us If</div>
                <div className="tier-body">
                  {se.severe.map((item, j) => (
                    <div key={j} className="action-item"><strong>!</strong> {item}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="reassure-box">
              <strong>{se.reassureTitle}</strong>
              <p>{se.reassure}</p>
            </div>
          </div>
        </section>
      ))}

      {/* When to Contact Us */}
      <section className="section section-dark">
        <div className="container">
          <div className="v2-label" style={{ color: 'rgba(255,255,255,0.6)' }}><span className="v2-dot" style={{ background: 'rgba(255,255,255,0.6)' }} /> IMPORTANT</div>
          <h2 className="section-title" style={{ color: '#fff' }}>When to Contact Us</h2>
          <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>Most side effects are manageable at home. But some situations need prompt attention.</p>

          <div className="contact-grid">
            <div className="contact-card urgent">
              <h4>Call Us Right Away If:</h4>
              <ul>
                <li>Chest pain, shortness of breath, or difficulty breathing</li>
                <li>Sudden severe headache or vision changes</li>
                <li>One-sided leg swelling, pain, or warmth</li>
                <li>Depression, severe anxiety, or thoughts of self-harm</li>
                <li>Signs of infection at injection site — expanding redness, fever, pus</li>
                <li>Sudden significant swelling in face or extremities</li>
              </ul>
            </div>
            <div className="contact-card routine">
              <h4>Schedule a Check-In If:</h4>
              <ul>
                <li>Side effects have lasted more than 4-6 weeks without improvement</li>
                <li>Acne is persistent or worsening</li>
                <li>Mood changes that feel disproportionate or do not stabilize</li>
                <li>Breast tenderness that is not resolving</li>
                <li>Sleep disruption that continues beyond 3-4 weeks</li>
                <li>Any side effect you are unsure about — we are here to help</li>
              </ul>
            </div>
          </div>

          <div className="disclaimer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Important:</strong> This guide is for Range Medical patients on hormone replacement therapy (HRT) — including bioidentical testosterone, estrogen, and progesterone. All protocols are prescribed and monitored by licensed medical providers. This is not a substitute for personalized medical advice. Do not adjust your dose without consulting your provider first.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Questions About Your HRT Protocol?</h2>
          <p>Whether you need a dose adjustment, have a question about a side effect, or just want to check in — our team is here for you.</p>
          <div className="cta-buttons">
            <a href="tel:+19499973988" className="btn-white">Call (949) 997-3988</a>
            <a href="sms:+19499973988" className="btn-outline-white">Text Us</a>
          </div>
          <p className="cta-location">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
        </div>
      </section>

      <style jsx>{`
        .guide-hero { background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%); padding: 3.5rem 1.5rem 3rem; text-align: center; }
        .guide-hero h1 { font-size: clamp(2.2rem, 6vw, 3.5rem); font-weight: 900; line-height: 1; letter-spacing: -0.02em; text-transform: uppercase; margin-bottom: 1rem; }
        .v2-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.15em; color: #737373; margin-bottom: 0.75rem; text-transform: uppercase; }
        .v2-label.center { justify-content: center; }
        .v2-dot { width: 6px; height: 6px; background: #737373; border-radius: 50%; display: inline-block; }
        .hero-rule { width: 60px; height: 3px; background: #000; margin: 0 auto 1.25rem; }
        .hero-sub { font-size: 1.0625rem; color: #525252; max-width: 600px; margin: 0 auto; line-height: 1.7; }
        .section { padding: 3.5rem 1.5rem; }
        .section-gray { background: #fafafa; }
        .section-dark { background: #0a0a0a; color: #ffffff; }
        .section-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.75rem; }
        .section-subtitle { font-size: 1rem; color: #525252; max-width: 600px; line-height: 1.7; margin-bottom: 2rem; }
        .body-text { font-size: 0.95rem; color: #525252; line-height: 1.7; margin-top: 0.75rem; }
        .container { max-width: 800px; margin: 0 auto; }
        .nav-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 2rem; }
        .nav-card { display: flex; gap: 1rem; align-items: flex-start; background: #ffffff; border: 1px solid #e5e5e5; padding: 1rem 1.25rem; text-decoration: none; color: inherit; transition: border-color 0.2s, box-shadow 0.2s; }
        .nav-card:hover { border-color: #000; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .nav-icon { width: 1.75rem; height: 1.75rem; background: #000; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem; flex-shrink: 0; margin-top: 0.125rem; }
        .nav-card strong { font-size: 0.9rem; display: block; margin-bottom: 0.125rem; }
        .nav-card p { font-size: 0.8rem; color: #737373; line-height: 1.4; margin: 0; }
        .se-header { display: flex; align-items: flex-start; gap: 1.25rem; margin-bottom: 0.5rem; }
        .se-number { width: 3rem; height: 3rem; background: #000; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.25rem; flex-shrink: 0; margin-top: 0.25rem; }
        .se-header .section-title { margin-bottom: 0; }
        .se-header .v2-label { margin-bottom: 0.25rem; }
        .se-freq { font-size: 0.875rem; color: #737373; font-style: italic; margin-bottom: 1.75rem; padding-left: 4.25rem; }
        .what-box, .why-box { background: #ffffff; border: 1px solid #e5e5e5; padding: 1.5rem; margin-bottom: 1rem; }
        .section-gray .what-box, .section-gray .why-box { background: #ffffff; }
        .what-box h3, .why-box h3 { font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #171717; margin-bottom: 0.75rem; }
        .what-box p, .why-box p { font-size: 0.9rem; color: #525252; line-height: 1.7; }
        .steps-header { font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1.5rem; margin-bottom: 1rem; }
        .tier-card { margin-bottom: 1rem; border: 1px solid #e5e5e5; overflow: hidden; }
        .tier-label { padding: 0.625rem 1.25rem; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .tier-label.green { background: #ecfdf5; color: #065f46; border-bottom: 2px solid #059669; }
        .tier-label.yellow { background: #fffbeb; color: #92400e; border-bottom: 2px solid #d97706; }
        .tier-label.orange { background: #fff7ed; color: #9a3412; border-bottom: 2px solid #ea580c; }
        .tier-body { padding: 1.25rem 1.5rem; background: #ffffff; }
        .action-item { padding: 0.625rem 0; font-size: 0.9rem; color: #525252; line-height: 1.7; border-bottom: 1px solid #f5f5f5; }
        .action-item:last-child { border-bottom: none; }
        .action-item strong { color: #171717; }
        .reassure-box { background: #ecfdf5; border-left: 4px solid #059669; padding: 1.25rem 1.5rem; margin-top: 1.5rem; }
        .reassure-box strong { display: block; color: #065f46; margin-bottom: 0.25rem; }
        .reassure-box p { font-size: 0.9rem; color: #525252; line-height: 1.6; margin: 0; }
        .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }
        .contact-card { padding: 1.5rem; }
        .contact-card.urgent { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); }
        .contact-card.routine { background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); }
        .contact-card h4 { font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; }
        .contact-card.urgent h4 { color: #fca5a5; }
        .contact-card.routine h4 { color: #ffffff; }
        .contact-card ul { list-style: none; padding: 0; margin: 0; }
        .contact-card li { font-size: 0.875rem; color: rgba(255,255,255,0.8); padding: 0.375rem 0; padding-left: 1.25rem; position: relative; line-height: 1.5; }
        .contact-card.urgent li::before { content: "!"; position: absolute; left: 0; color: #fca5a5; font-weight: 700; }
        .contact-card.routine li::before { content: "✓"; position: absolute; left: 0; color: #86efac; font-weight: 700; }
        .disclaimer { background: #fafafa; border: 1px solid #e5e5e5; padding: 1.25rem; margin-top: 1.5rem; }
        .disclaimer p { font-size: 0.8125rem; color: #737373; line-height: 1.6; margin: 0; }
        .final-cta { background: #000000; color: #ffffff; padding: 3.5rem 1.5rem; text-align: center; }
        .final-cta h2 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.75rem; letter-spacing: -0.02em; }
        .final-cta p { font-size: 1rem; color: rgba(255,255,255,0.8); margin-bottom: 1.5rem; }
        .cta-buttons { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .btn-white { display: inline-block; background: #ffffff; color: #000000; padding: 0.875rem 1.75rem; text-decoration: none; font-weight: 600; font-size: 0.9375rem; transition: all 0.2s; }
        .btn-white:hover { background: #f5f5f5; transform: translateY(-1px); }
        .btn-outline-white { display: inline-block; background: transparent; color: #ffffff; padding: 0.875rem 1.75rem; border: 2px solid #ffffff; text-decoration: none; font-weight: 600; font-size: 0.9375rem; transition: all 0.2s; }
        .btn-outline-white:hover { background: #ffffff; color: #000000; }
        .cta-location { font-size: 0.9rem; color: rgba(255,255,255,0.7); }
        @media (max-width: 768px) { .nav-grid, .contact-grid { grid-template-columns: 1fr; } .section-title { font-size: 1.5rem; } .cta-buttons { flex-direction: column; align-items: center; } .se-freq { padding-left: 0; } }
      `}</style>
    </Layout>
  );
}