import Layout from '../components/Layout';
import Head from 'next/head';
import { useState } from 'react';

export default function PeptideSideEffectsGuide() {
  const [openSection, setOpenSection] = useState(null);

  const toggle = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <Layout
      title="Peptide Therapy Side Effects Guide | Range Medical"
      description="Complete guide to managing peptide therapy side effects. BPC-157, CJC/Ipamorelin, and more — what to expect and what to do. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Peptide Therapy Side Effects Guide",
              "description": "Comprehensive patient guide for managing peptide therapy side effects including BPC-157, CJC/Ipamorelin, Tesamorelin/Ipamorelin, and TB-500.",
              "url": "https://www.range-medical.com/peptide-side-effects-guide",
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
          <h1>PEPTIDE THERAPY<br/>SIDE EFFECTS</h1>
          <div className="hero-rule" />
          <p className="hero-sub">Every side effect explained in plain English. What it feels like, why it happens, and exactly what to do about it — step by step.</p>
        </div>
      </section>

      {/* Overview */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> THE BIG PICTURE</div>
          <h2 className="section-title">Peptides Have a Mild Side Effect Profile</h2>
          <p className="section-subtitle">Peptides are small proteins that send specific signals to your body. Compared to traditional medications, their side effect profiles are generally mild. Most side effects are related to the injection itself or the body adjusting to new signaling.</p>
          <p className="body-text">This guide covers the peptides we use most at Range Medical — BPC-157, TB-500 (TB4), CJC-1295/Ipamorelin, and Tesamorelin/Ipamorelin. Range Medical monitors all peptide protocols with regular check-ins. For each side effect below, we give you a clear plan so you never have to just guess.</p>

          <div className="nav-grid">
            <a href="#injection-site" className="nav-card">
              <span className="nav-icon">1</span>
              <div>
                <strong>Injection Site Reactions</strong>
                <p>Redness, stinging, bumps, or bruising.</p>
              </div>
            </a>
            <a href="#flushing" className="nav-card">
              <span className="nav-icon">2</span>
              <div>
                <strong>Flushing & Warmth</strong>
                <p>Hot flash feeling after injection.</p>
              </div>
            </a>
            <a href="#hunger" className="nav-card">
              <span className="nav-icon">3</span>
              <div>
                <strong>Increased Hunger</strong>
                <p>Appetite spike after injection.</p>
              </div>
            </a>
            <a href="#water-retention" className="nav-card">
              <span className="nav-icon">4</span>
              <div>
                <strong>Water Retention & Bloating</strong>
                <p>Mild puffiness, especially early on.</p>
              </div>
            </a>
            <a href="#fatigue" className="nav-card">
              <span className="nav-icon">5</span>
              <div>
                <strong>Fatigue or Drowsiness</strong>
                <p>Sleepiness or deep relaxation after dosing.</p>
              </div>
            </a>
            <a href="#headache" className="nav-card">
              <span className="nav-icon">6</span>
              <div>
                <strong>Headache</strong>
                <p>Mild headache in the first week.</p>
              </div>
            </a>
            <a href="#nausea" className="nav-card">
              <span className="nav-icon">7</span>
              <div>
                <strong>Nausea</strong>
                <p>Mild stomach upset, much lighter than meds.</p>
              </div>
            </a>
            <a href="#tingling" className="nav-card">
              <span className="nav-icon">8</span>
              <div>
                <strong>Tingling in Hands</strong>
                <p>Pins-and-needles feeling in fingers.</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ===================== INJECTION SITE REACTIONS ===================== */}
      <section className="section section-gray" id="injection-site">
        <div className="container">
          <div className="se-header">
            <span className="se-number">1</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> MOST COMMON</div>
              <h2 className="section-title">Injection Site Reactions</h2>
            </div>
          </div>
          <div className="se-freq">Affects nearly all peptide users at some point — usually mild and short-lived</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Redness, slight swelling, itching, stinging during injection, or a small bump or bruise at the injection site. Usually mild and resolves in hours to a day. Some people notice more stinging with certain peptides than others.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Subcutaneous injection causes a normal tissue response. Your skin is reacting to the needle and the fluid being deposited under the skin. Some peptides — especially BPC-157 — can cause more stinging during injection due to their pH level. This is not an allergic reaction. It is a local tissue response that resolves on its own.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Let the peptide reach room temperature before injecting.</strong> Cold solution stings more. Take it out of the fridge 5-10 minutes before your injection.
              </div>
              <div className="action-item">
                <strong>Inject slowly.</strong> Push the plunger gently over 5-10 seconds. Rushing the injection causes more tissue irritation and stinging.
              </div>
              <div className="action-item">
                <strong>Rotate your injection sites.</strong> Abdomen, thighs, and love handles are all good options. Never inject into the same spot twice in a row. Rotating prevents buildup of irritation in one area.
              </div>
              <div className="action-item">
                <strong>Ice the area briefly before injecting</strong> if stinging bothers you. A few seconds of ice numbs the skin and makes the needle entry less noticeable.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Continues</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Try a different injection site.</strong> Some areas of your body may react more than others. Experiment with different spots to find what works best for you.
              </div>
              <div className="action-item">
                <strong>Contact us about injection technique.</strong> We can walk you through your technique at your next visit to make sure everything is dialed in.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call Us If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Expanding redness beyond 2 inches</strong> from the injection site, especially if it is warm to the touch. This could indicate infection.
              </div>
              <div className="action-item">
                <strong>Pus, fever, or increasing pain.</strong> These are signs of infection and need prompt evaluation.
              </div>
              <div className="action-item">
                <strong>Hives or swelling elsewhere on your body.</strong> This could be an allergic reaction and needs immediate attention.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Completely Normal</strong>
            <p>Injection site reactions get easier with practice. Stinging decreases as your technique improves and your body gets used to the process. Most people barely notice it after the first couple of weeks.</p>
          </div>
        </div>
      </section>

      {/* ===================== FLUSHING & WARMTH ===================== */}
      <section className="section" id="flushing">
        <div className="container">
          <div className="se-header">
            <span className="se-number">2</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Flushing & Warmth</h2>
            </div>
          </div>
          <div className="se-freq">Common with growth hormone peptides — CJC/Ipamorelin, Tesamorelin/Ipamorelin</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>A sudden feeling of warmth, like a hot flash. Your face and ears may turn red. It comes on within minutes of injection and lasts 10-30 minutes. Some people feel a warm wave move through their upper body. It is not painful — just noticeable and sometimes surprising the first time it happens.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Growth hormone-releasing peptides can cause brief vasodilation — your blood vessels temporarily open wider. This increases blood flow to your skin, which creates that warm, flushed feeling. This is actually a sign that the peptide is active and doing its job. It is not a problem and it is not an allergic reaction.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Inject before bed.</strong> This is the simplest fix — you sleep right through the flushing and never notice it. Most peptide protocols are designed for evening dosing anyway.
              </div>
              <div className="action-item">
                <strong>Expect it and know it passes.</strong> Once you know what it is, the flushing becomes a non-event. It is brief, harmless, and predictable.
              </div>
              <div className="action-item">
                <strong>Cool cloth on your face</strong> if it feels uncomfortable. A damp washcloth for a few minutes is all you need.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If Bothersome</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Contact us about adjusting timing or splitting dose.</strong> If the flushing is happening at an inconvenient time or feels too intense, we can adjust your protocol to minimize it.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>A Sign It Is Working</strong>
            <p>Flushing means the peptide is doing its job — triggering growth hormone release. It becomes less noticeable over time as your body adjusts to the signaling. Most people stop noticing it entirely within 1-2 weeks.</p>
          </div>
        </div>
      </section>

      {/* ===================== INCREASED HUNGER ===================== */}
      <section className="section section-gray" id="hunger">
        <div className="container">
          <div className="se-header">
            <span className="se-number">3</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Increased Hunger</h2>
            </div>
          </div>
          <div className="se-freq">Common with growth hormone peptides — CJC/Ipamorelin, Tesamorelin/Ipamorelin</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Feeling hungrier than usual, especially 30-60 minutes after injection. Your stomach may growl. You might find yourself thinking about food more than normal. This is a temporary spike in appetite that follows the injection timing.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Growth hormone peptides stimulate ghrelin — the hunger hormone. This is part of the GH release cascade and is actually a positive sign that the peptide is working. Ghrelin is the same hormone that signals your body to release growth hormone naturally, so the hunger spike is directly linked to the therapeutic effect.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Inject at bedtime.</strong> You sleep through the hunger spike. This is the most effective and simplest solution.
              </div>
              <div className="action-item">
                <strong>If injecting during the day, plan a high-protein snack.</strong> Have something ready — chicken, eggs, Greek yogurt, a protein shake. Protein satisfies the hunger better than carbs or fat.
              </div>
              <div className="action-item">
                <strong>Use the appetite to fuel muscle growth</strong> if that is one of your goals. The hunger window after injection is a great time to get quality nutrition in.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Use It To Your Advantage</strong>
            <p>The increased hunger is temporary — it follows the injection and then subsides. If you are trying to build muscle or recover from injury, this appetite boost can actually help you get the nutrition your body needs. Channel it into better nutrition timing rather than fighting it.</p>
          </div>
        </div>
      </section>

      {/* ===================== WATER RETENTION & BLOATING ===================== */}
      <section className="section" id="water-retention">
        <div className="container">
          <div className="se-header">
            <span className="se-number">4</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Water Retention & Bloating</h2>
            </div>
          </div>
          <div className="se-freq">Common with growth hormone peptides, especially in the first 2-4 weeks</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Mild puffiness, especially in your hands and face. Rings may feel tighter than usual. The scale might show 1-3 pounds more than expected. You might notice your fingers feel slightly swollen in the morning. This is not fat gain — it is water.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Growth hormone increases water retention and can cause mild edema. This is a known GH effect, not something unique to peptides — it happens with any therapy that raises growth hormone levels. Your body is adjusting to a new hormonal signal, and part of that adjustment involves holding onto a bit more fluid temporarily.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Stay hydrated.</strong> It sounds counterintuitive, but drinking more water helps your body release excess water. Dehydration makes water retention worse.
              </div>
              <div className="action-item">
                <strong>Reduce sodium intake.</strong> High sodium makes water retention worse. Cut back on processed foods, fast food, and added salt for a few weeks.
              </div>
              <div className="action-item">
                <strong>Give it 2-3 weeks to stabilize.</strong> Water retention is almost always a first-few-weeks phenomenon. Your body adjusts and the puffiness resolves on its own.
              </div>
              <div className="action-item">
                <strong>Light exercise.</strong> Movement helps your lymphatic system clear excess fluid. A daily walk or light workout makes a noticeable difference.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Continues Beyond 4 Weeks</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Contact us.</strong> Persistent water retention may indicate the dose is too high. We can adjust your protocol to find the right level.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Temporary Adjustment</strong>
            <p>Water retention stabilizes within 2-4 weeks for most people. It is your body getting used to higher growth hormone signaling. Once your system adjusts, the puffiness resolves and you are left with the benefits.</p>
          </div>
        </div>
      </section>

      {/* ===================== FATIGUE OR DROWSINESS ===================== */}
      <section className="section section-gray" id="fatigue">
        <div className="container">
          <div className="se-header">
            <span className="se-number">5</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Fatigue or Drowsiness</h2>
            </div>
          </div>
          <div className="se-freq">Common with BPC-157 and evening dosing of growth hormone peptides</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Feeling sleepy or mildly fatigued after injection. Some people describe a deep sense of relaxation — like your body is winding down. You might feel ready for bed earlier than usual or find it easier to fall asleep. This is usually pleasant, not debilitating.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>BPC-157 has gut-brain axis effects that can promote relaxation. Growth hormone peptides taken at night enhance deep sleep — which is actually the goal. Your body may also be channeling energy into repair processes, especially if you are recovering from injury or inflammation. The fatigue is often a sign that your body is prioritizing healing.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Inject at bedtime.</strong> Take advantage of the sleepiness rather than fighting it. Evening dosing lets you sleep through the fatigue and benefit from deeper, more restorative sleep.
              </div>
              <div className="action-item">
                <strong>If daytime fatigue is an issue, move your injection to evening.</strong> Switching from morning to evening dosing often eliminates the problem entirely.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If Persistent Daytime Fatigue</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Contact us to review dose and timing.</strong> If you are feeling fatigued during the day despite evening dosing, we may need to adjust your protocol. Persistent fatigue can also indicate other factors we should check.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Working in Your Favor</strong>
            <p>Better deep sleep means better recovery. Most people report improved energy within 1-2 weeks as their body adjusts. The initial drowsiness transitions into better sleep quality and more energy during the day — not less.</p>
          </div>
        </div>
      </section>

      {/* ===================== HEADACHE ===================== */}
      <section className="section" id="headache">
        <div className="container">
          <div className="se-header">
            <span className="se-number">6</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> LESS COMMON</div>
              <h2 className="section-title">Headache</h2>
            </div>
          </div>
          <div className="se-freq">Affects a smaller number of people — usually limited to the first week of treatment</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>A mild headache in the hours after injection. Dull, not severe. It usually happens in the first week of starting a new peptide and goes away on its own. It is not a migraine-level headache — more of a background ache that you notice but can function through.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Peptides that affect growth hormone can temporarily change fluid balance in the brain. As your body adjusts to new GH signaling, there can be minor shifts in intracranial pressure. Dehydration makes this significantly worse — and many people do not drink enough water when starting a new protocol.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Drink extra water on injection days.</strong> Aim for an extra 16-24 ounces beyond your normal intake. Hydration is the single best prevention for peptide-related headaches.
              </div>
              <div className="action-item">
                <strong>Take an OTC pain reliever.</strong> Tylenol (acetaminophen) or Advil (ibuprofen) works well for these mild headaches. Take as directed on the package.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Continues Beyond 1 Week</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Contact us for a dose review.</strong> Headaches that persist past the first week may indicate the dose needs adjustment. We can fine-tune your protocol.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Short-Lived</strong>
            <p>Headaches are almost always a first-week adjustment and do not return. Once your body acclimates to the peptide signaling, this side effect resolves completely. Most people only experience it for 1-3 days.</p>
          </div>
        </div>
      </section>

      {/* ===================== NAUSEA ===================== */}
      <section className="section section-gray" id="nausea">
        <div className="container">
          <div className="se-header">
            <span className="se-number">7</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> LESS COMMON</div>
              <h2 className="section-title">Nausea</h2>
            </div>
          </div>
          <div className="se-freq">Affects a smaller number of people — much milder than weight loss medication nausea</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Mild stomach upset after injection. This is not the severe nausea that comes with weight loss medications — it is more like a mild unsettled feeling that passes relatively quickly. Some people describe it as a brief queasy wave that comes and goes within 15-30 minutes.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Some peptides can trigger a mild GI response. BPC-157 is a gastric peptide — it was originally discovered in stomach juice — so it can cause mild stomach sensations early on as your gut adjusts to it. Injecting on a completely empty or very full stomach can make it worse. Timing and food intake play a big role.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Inject at bedtime.</strong> You sleep through any stomach upset and it is gone by morning.
              </div>
              <div className="action-item">
                <strong>Have a small snack 30 minutes before</strong> if you are dosing in the morning. A few crackers or a piece of toast can settle your stomach enough to prevent nausea.
              </div>
              <div className="action-item">
                <strong>Try ginger tea.</strong> Ginger is a natural anti-nausea remedy that works well for mild peptide-related stomach upset.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Continues</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Contact us.</strong> We can adjust the timing of your injections or explore whether a different peptide in your protocol is the cause. A simple schedule change often fixes this completely.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Mild and Temporary</strong>
            <p>Peptide-related nausea is much lighter than medication nausea and usually resolves in days, not weeks. Your body adapts quickly to the signaling, and most people never experience it again after the first few doses.</p>
          </div>
        </div>
      </section>

      {/* ===================== TINGLING IN HANDS ===================== */}
      <section className="section" id="tingling">
        <div className="container">
          <div className="se-header">
            <span className="se-number">8</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> LESS COMMON</div>
              <h2 className="section-title">Tingling or Numbness in Hands</h2>
            </div>
          </div>
          <div className="se-freq">Less common — associated with growth hormone peptides like CJC/Ipamorelin and Tesamorelin</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>A pins-and-needles feeling in your hands or fingers, especially in the morning. Similar to carpal tunnel symptoms — tingling, slight numbness, or a feeling like your hands "fell asleep." It may be worse when you first wake up and improve as you move around.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Growth hormone can cause mild fluid retention around nerves, particularly in the carpal tunnel area of the wrist. As GH levels rise, the slight increase in tissue fluid puts pressure on the median nerve. This is more common if GH levels are rising quickly or if the dose is on the higher end.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Wrist stretches.</strong> Gently flex and extend your wrists several times in the morning. This helps relieve pressure on the nerve and gets fluid moving.
              </div>
              <div className="action-item">
                <strong>Sleep with your wrists straight.</strong> Do not sleep with your wrists bent or tucked under your pillow. A bent wrist compresses the carpal tunnel and makes tingling worse. A wrist brace at night can help keep them straight.
              </div>
              <div className="action-item">
                <strong>Give it 1-2 weeks.</strong> Mild tingling often resolves on its own as your body adjusts to the new GH levels.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Continues</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Contact us.</strong> We may need to reduce your dose. Tingling that persists is a clear signal that the dose should be adjusted. This is a straightforward fix.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Do Not Ignore If Worsening</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>If tingling is getting worse, spreading, or accompanied by weakness</strong> — contact us right away. Worsening symptoms need prompt dose adjustment to prevent prolonged nerve compression.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Dose-Related</strong>
            <p>This resolves with dose adjustment. It is not a sign of permanent nerve damage. Once the dose is dialed back, fluid retention around the nerve decreases and the tingling goes away. Most people find a dose that gives them the benefits without this side effect.</p>
          </div>
        </div>
      </section>

      {/* ===================== WHEN TO CONTACT ===================== */}
      <section className="section section-dark">
        <div className="container">
          <div className="v2-label" style={{ color: 'rgba(255,255,255,0.6)' }}><span className="v2-dot" style={{ background: 'rgba(255,255,255,0.6)' }} /> IMPORTANT</div>
          <h2 className="section-title" style={{ color: '#fff' }}>When to Contact Us</h2>
          <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>Most side effects can be managed with the steps in this guide. But some situations need our help right away.</p>

          <div className="contact-grid">
            <div className="contact-card urgent">
              <h4>Call Us Right Away</h4>
              <ul>
                <li>Signs of allergic reaction — hives, throat swelling, difficulty breathing</li>
                <li>Infection at injection site — expanding redness, fever, pus</li>
                <li>Severe persistent headache that does not respond to OTC pain relievers</li>
                <li>Sudden joint pain or swelling</li>
              </ul>
            </div>
            <div className="contact-card routine">
              <h4>Schedule a Check-In</h4>
              <ul>
                <li>Any side effect lasting more than 2 weeks</li>
                <li>Questions about injection technique</li>
                <li>Tingling in hands that is worsening</li>
                <li>Want to adjust timing or dose</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="section">
        <div className="container">
          <div className="disclaimer">
            <p><strong>Important:</strong> This guide is for Range Medical patients on peptide therapy. It is not a substitute for personalized medical advice. Do not adjust your dosing without provider guidance. All peptide protocols are monitored by licensed providers. Individual results vary.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Questions? We Are Here.</h2>
          <p>Whether you need a dose adjustment, help with injection technique, or just want to talk through what you are feeling — our team can help.</p>
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
