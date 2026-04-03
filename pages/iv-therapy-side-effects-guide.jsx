import Layout from '../components/Layout';
import Head from 'next/head';
import { useState } from 'react';

export default function IVTherapySideEffectsGuide() {
  const [openSection, setOpenSection] = useState(null);

  const toggle = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <Layout
      title="IV Therapy Side Effects Guide | Range Medical"
      description="Complete guide to IV therapy side effects. What to expect during and after your infusion — vitamin C, glutathione, NAD+, methylene blue, and more. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "IV Therapy Side Effects Guide",
              "description": "Complete guide to IV therapy side effects. What to expect during and after your infusion — vitamin C, glutathione, NAD+, methylene blue, and more.",
              "url": "https://www.range-medical.com/iv-therapy-side-effects-guide",
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
          <h1>IV THERAPY<br/>SIDE EFFECTS</h1>
          <div className="hero-rule" />
          <p className="hero-sub">Every side effect explained in plain English. What it feels like, why it happens, and exactly what to do about it — step by step.</p>
        </div>
      </section>

      {/* Overview */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> THE BIG PICTURE</div>
          <h2 className="section-title">What to Know Before Your Infusion</h2>
          <p className="section-subtitle">IV therapy delivers nutrients directly into your bloodstream, bypassing digestion. This means faster, more complete absorption — but it also means your body is getting a concentrated dose all at once.</p>
          <p className="body-text">Most side effects are mild, happen during or shortly after the infusion, and resolve quickly. Your nurse monitors you throughout every session. For each side effect below, we explain what is happening and exactly what to do.</p>

          <div className="nav-grid">
            <a href="#vein" className="nav-card">
              <span className="nav-icon">1</span>
              <div>
                <strong>Vein Discomfort & Bruising</strong>
                <p>Tenderness at the IV site and mild bruising.</p>
              </div>
            </a>
            <a href="#cold" className="nav-card">
              <span className="nav-icon">2</span>
              <div>
                <strong>Feeling Cold</strong>
                <p>Chills and goosebumps during the infusion.</p>
              </div>
            </a>
            <a href="#taste" className="nav-card">
              <span className="nav-icon">3</span>
              <div>
                <strong>Metallic or Unusual Taste</strong>
                <p>Strange taste with glutathione, vitamin C, or methylene blue.</p>
              </div>
            </a>
            <a href="#flushing" className="nav-card">
              <span className="nav-icon">4</span>
              <div>
                <strong>Flushing & Warmth</strong>
                <p>Sudden warmth, redness, or tingling skin.</p>
              </div>
            </a>
            <a href="#nausea" className="nav-card">
              <span className="nav-icon">5</span>
              <div>
                <strong>Nausea</strong>
                <p>Stomach upset during or after infusion.</p>
              </div>
            </a>
            <a href="#lightheadedness" className="nav-card">
              <span className="nav-icon">6</span>
              <div>
                <strong>Lightheadedness</strong>
                <p>Feeling woozy or faint during or after.</p>
              </div>
            </a>
            <a href="#headache" className="nav-card">
              <span className="nav-icon">7</span>
              <div>
                <strong>Headache</strong>
                <p>Mild headache during or after infusion.</p>
              </div>
            </a>
            <a href="#urination" className="nav-card">
              <span className="nav-icon">8</span>
              <div>
                <strong>Frequent Urination</strong>
                <p>Using the bathroom more after your session.</p>
              </div>
            </a>
            <a href="#urine-color" className="nav-card">
              <span className="nav-icon">9</span>
              <div>
                <strong>Blue-Green Urine</strong>
                <p>Expected color change with methylene blue.</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ===================== 1. VEIN DISCOMFORT ===================== */}
      <section className="section section-gray" id="vein">
        <div className="container">
          <div className="se-header">
            <span className="se-number">1</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> MOST COMMON</div>
              <h2 className="section-title">Vein Discomfort & Bruising</h2>
            </div>
          </div>
          <div className="se-freq">Happens to most people at some point — the most common side effect of any IV therapy</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Slight pinch when the IV is placed, tenderness at the site during infusion, mild bruising afterward. Some people feel pressure or aching in the arm. The area around the IV may feel sore for a day or two after the session.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>A needle goes through your skin into a vein. Some mild tissue trauma is unavoidable. Bruising happens when a small amount of blood leaks around the vein during or after placement. People with smaller veins, thinner skin, or who are on blood thinners tend to bruise more easily.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Let your nurse know if it hurts.</strong> They can adjust the needle position, slow the drip rate, or apply a warm compress to reduce discomfort during the infusion.
              </div>
              <div className="action-item">
                <strong>Apply gentle pressure when the IV is removed.</strong> Hold the gauze firmly for 2-3 minutes after removal. This reduces bruising significantly.
              </div>
              <div className="action-item">
                <strong>Stay hydrated before your appointment.</strong> Well-hydrated veins are easier to access and less likely to bruise. Drink 16-20 oz of water in the hour before you arrive.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If Bruising Is Frequent</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Ask about rotating vein sites.</strong> Using a different arm or vein each session gives previous sites time to heal and reduces cumulative soreness.
              </div>
              <div className="action-item">
                <strong>Apply arnica gel.</strong> Available over the counter — apply to the bruised area after your session to speed healing.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Increasing pain, expanding swelling, or redness/warmth spreading from the site.</strong> This could indicate infiltration (fluid leaking outside the vein) or infection. Contact us right away so we can evaluate it.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Normal Part of the Process</strong>
            <p>Bruising fades in 3-5 days. Rotating veins between sessions helps. A small bruise is cosmetic — it does not mean anything went wrong with your infusion.</p>
          </div>
        </div>
      </section>

      {/* ===================== 2. FEELING COLD ===================== */}
      <section className="section" id="cold">
        <div className="container">
          <div className="se-header">
            <span className="se-number">2</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Feeling Cold</h2>
            </div>
          </div>
          <div className="se-freq">Very common during infusions, especially longer sessions or larger fluid volumes</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Feeling chilly during the infusion, sometimes with goosebumps. The arm with the IV may feel especially cold. Some people get a slight shiver even though the room temperature is comfortable.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>IV fluids are typically at room temperature, which is cooler than your body temperature (98.6 degrees). When fluid enters your bloodstream, it cools you slightly from the inside. The larger the volume and the faster the rate, the more noticeable this is.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Ask for a blanket.</strong> We have them ready for you. This is the simplest and most effective fix.
              </div>
              <div className="action-item">
                <strong>Wear warm clothing to your appointment.</strong> A hoodie or sweater makes a big difference. Dress in layers so you can adjust.
              </div>
              <div className="action-item">
                <strong>Request warmed fluids if available.</strong> Some formulations can be gently warmed before infusion, which eliminates the chill entirely.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Easy Fix</strong>
            <p>This resolves as soon as the infusion ends. Completely harmless. Most patients stop noticing it after their first few sessions — your body learns to adjust.</p>
          </div>
        </div>
      </section>

      {/* ===================== 3. METALLIC / UNUSUAL TASTE ===================== */}
      <section className="section section-gray" id="taste">
        <div className="container">
          <div className="se-header">
            <span className="se-number">3</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Metallic or Unusual Taste</h2>
            </div>
          </div>
          <div className="se-freq">Common with glutathione, high-dose vitamin C, and methylene blue infusions</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Strange taste in your mouth during the infusion — metallic, sulfurous (like garlic), or slightly bitter. You may also notice an unusual smell. It can start within minutes of the infusion beginning and persist through the session.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Certain vitamins and compounds have a taste your body can detect even when they are delivered directly into your blood. Glutathione often causes a sulfur or garlic taste because it contains sulfur. Vitamin C at high doses can cause a metallic taste. Methylene blue has its own distinctive taste. Your taste buds pick up on these compounds circulating through your bloodstream.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Suck on a hard candy or mint during infusion.</strong> This masks the taste effectively. Peppermint works especially well.
              </div>
              <div className="action-item">
                <strong>Sip flavored water or bring a drink with you.</strong> Lemon water, flavored sparkling water, or juice can override the taste.
              </div>
              <div className="action-item">
                <strong>Breathe through your mouth.</strong> This reduces how much of the taste and smell you perceive during the infusion.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Harmless and Temporary</strong>
            <p>The taste means the nutrients are reaching your system. It passes within 15-30 minutes after the infusion ends. Not a sign of a problem — just an odd quirk of IV-delivered nutrients.</p>
          </div>
        </div>
      </section>

      {/* ===================== 4. FLUSHING & WARMTH ===================== */}
      <section className="section" id="flushing">
        <div className="container">
          <div className="se-header">
            <span className="se-number">4</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Flushing & Warmth</h2>
            </div>
          </div>
          <div className="se-freq">Common with niacin, B-vitamins, and NAD+ infusions — a known pharmacological effect</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Sudden feeling of warmth, face turns red, skin may feel tingly or itchy. Feels like a hot flash. Your ears, neck, and chest may flush red. It can come on quickly and feel intense — but it passes.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>B-vitamins (especially niacin) cause vasodilation — your blood vessels open up wider. NAD+ can also trigger this. It is a known pharmacological effect, not an allergic reaction. The flushing means the nutrient is active in your system and your blood vessels are responding normally.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Tell your nurse to slow the drip rate.</strong> This is the most effective fix. A slower rate means less of the compound hits your system at once, reducing the flushing.
              </div>
              <div className="action-item">
                <strong>Take a deep breath and know it passes.</strong> Flushing from B-vitamins and NAD+ typically lasts 10-20 minutes and then resolves on its own.
              </div>
              <div className="action-item">
                <strong>Take an OTC antihistamine beforehand.</strong> If flushing happens regularly with your sessions, taking a non-drowsy antihistamine (like loratadine) 30 minutes before can reduce the intensity.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call Your Nurse Immediately If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Throat tightness, difficulty breathing, or hives spreading.</strong> This is rare but could indicate an actual allergic reaction rather than normal flushing. Your nurse will assess immediately and take appropriate action.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>A Sign of Active Delivery</strong>
            <p>Flushing from B-vitamins and NAD+ is expected and well-documented. It becomes less intense with regular sessions as your body adjusts to the compounds.</p>
          </div>
        </div>
      </section>

      {/* ===================== 5. NAUSEA ===================== */}
      <section className="section section-gray" id="nausea">
        <div className="container">
          <div className="se-header">
            <span className="se-number">5</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> LESS COMMON</div>
              <h2 className="section-title">Nausea</h2>
            </div>
          </div>
          <div className="se-freq">More common with high-dose vitamin C and NAD+ infusions, especially at faster drip rates</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Mild stomach upset during or shortly after infusion. Queasy feeling, occasionally with lightheadedness. Some people describe it as a vague "off" feeling in their stomach. NAD+ infusions are particularly known for this if the drip rate is too fast.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>High-dose nutrients hitting your system all at once can stimulate your vagus nerve or temporarily affect blood sugar. NAD+ infusions are particularly known for causing nausea because the compound is metabolically active and your body needs time to process it. Coming in on an empty stomach makes it worse.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Slow the drip rate.</strong> This is the number one fix. Tell your nurse — a slower rate almost always resolves nausea immediately. NAD+ infusions especially benefit from a slower drip.
              </div>
              <div className="action-item">
                <strong>Eat a light meal 1-2 hours before your appointment.</strong> Coming in on an empty stomach is the most common trigger for nausea during infusion. Something simple — toast, a banana, crackers — makes a big difference.
              </div>
              <div className="action-item">
                <strong>Ginger chews or ginger tea.</strong> Bring ginger chews with you. They are a proven, natural nausea remedy and work fast.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Happens Every Time</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>We adjust your protocol.</strong> Lower concentration, slower rate, or splitting into shorter sessions. There is always a way to make it work comfortably.
              </div>
              <div className="action-item">
                <strong>Consider a different formulation.</strong> If one specific formula consistently causes nausea, we can modify the ingredients or switch to an alternative that delivers similar benefits.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Rate-Dependent</strong>
            <p>Nausea during IV therapy almost always resolves by slowing the drip. It is not a sign of a problem with the therapy itself — just a sign that the rate needs adjusting for your body.</p>
          </div>
        </div>
      </section>

      {/* ===================== 6. LIGHTHEADEDNESS ===================== */}
      <section className="section" id="lightheadedness">
        <div className="container">
          <div className="se-header">
            <span className="se-number">6</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> LESS COMMON</div>
              <h2 className="section-title">Lightheadedness or Dizziness</h2>
            </div>
          </div>
          <div className="se-freq">Less common overall, more likely if you came in dehydrated or with low blood sugar</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Feeling woozy, lightheaded, or faint during or right after infusion. May feel worse when standing up. Some people describe it as a floaty feeling or like the room is slightly tilting. Usually brief and resolves with rest.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>IV fluids can temporarily change blood pressure. If you came in dehydrated or with low blood sugar, the shift in fluid balance can cause dizziness. Sitting up too quickly after lying still for an extended period can also contribute — your blood pressure has not caught up with the change in position.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Eat before your appointment.</strong> A meal or substantial snack 1-2 hours before keeps your blood sugar stable. This prevents most episodes.
              </div>
              <div className="action-item">
                <strong>Stay seated for 5-10 minutes after infusion ends.</strong> Do not rush to stand up. Give your body a moment to stabilize before you get on your feet.
              </div>
              <div className="action-item">
                <strong>Stand up slowly.</strong> When you do get up, do it in stages. Sit on the edge of the chair first, then stand. This gives your blood pressure time to adjust.
              </div>
              <div className="action-item">
                <strong>Drink water during infusion.</strong> Sipping water throughout your session supports your fluid balance and reduces the chance of dizziness.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call Your Nurse Immediately If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>You feel faint during the infusion.</strong> Your nurse will slow the rate, recline you, and monitor your vitals. This is exactly what they are trained for — do not try to tough it out.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Usually Preventable</strong>
            <p>Eating before your appointment, staying hydrated, and not rushing to stand prevents most episodes. Once you know your routine, lightheadedness rarely happens.</p>
          </div>
        </div>
      </section>

      {/* ===================== 7. HEADACHE ===================== */}
      <section className="section section-gray" id="headache">
        <div className="container">
          <div className="se-header">
            <span className="se-number">7</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> LESS COMMON</div>
              <h2 className="section-title">Headache</h2>
            </div>
          </div>
          <div className="se-freq">Less common, more likely if you were dehydrated before your session or received B-vitamins</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Mild headache during or in the hours after infusion. Dull pressure, not severe. It may come on gradually toward the end of the infusion or develop 1-2 hours after you leave the clinic.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Fluid shifts, electrolyte changes, or vasodilation from B-vitamins. Dehydration before the session makes this much more likely — your body is adjusting to a sudden influx of fluid and nutrients. High-dose vitamin C can occasionally cause this as well.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Drink extra water before and after your infusion.</strong> Proper hydration is the single best preventive measure. Aim for 16-20 oz before and another 16 oz after.
              </div>
              <div className="action-item">
                <strong>Take an OTC pain reliever if needed.</strong> Ibuprofen or acetaminophen can help if a headache develops. Take with food.
              </div>
              <div className="action-item">
                <strong>Eat something before and after.</strong> Low blood sugar combined with fluid shifts can trigger headaches. A light meal handles both.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If Recurring</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Contact us — we may adjust the formula.</strong> Adding magnesium to future infusions can help prevent headaches. We can also modify the drip rate or change the formulation to find what works best for you.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Preventable</strong>
            <p>Proper hydration and pre-session nutrition eliminate this for most people. Once you establish a pre-infusion routine, headaches rarely recur.</p>
          </div>
        </div>
      </section>

      {/* ===================== 8. FREQUENT URINATION ===================== */}
      <section className="section" id="urination">
        <div className="container">
          <div className="se-header">
            <span className="se-number">8</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Frequent Urination</h2>
            </div>
          </div>
          <div className="se-freq">Very common after any IV infusion — expected and normal</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Needing to use the bathroom more frequently in the hours after your infusion. You may need to go during the infusion as well, especially with larger volume sessions. This is completely normal.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>You just received 500-1000ml of extra fluid directly into your bloodstream. Your kidneys process it and you urinate more. Vitamin C is water-soluble and what your body does not use gets excreted through urine. This is your body functioning exactly as it should.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Nothing Needed</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>This is completely normal.</strong> Just be aware that you will need the bathroom more often for 2-4 hours after your session. Plan accordingly if you have meetings or a long drive.
              </div>
              <div className="action-item">
                <strong>Do not restrict water to compensate.</strong> Your body still needs regular hydration. Keep drinking water normally — your kidneys will handle the rest.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Your Body Doing Its Job</strong>
            <p>Frequent urination after an IV infusion means your kidneys are working properly. Expect it for 2-4 hours after your session. It is a sign of healthy kidney function, not a side effect to worry about.</p>
          </div>
        </div>
      </section>

      {/* ===================== 9. BLUE-GREEN URINE ===================== */}
      <section className="section section-gray" id="urine-color">
        <div className="container">
          <div className="se-header">
            <span className="se-number">9</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> EXPECTED WITH METHYLENE BLUE</div>
              <h2 className="section-title">Blue-Green Urine</h2>
            </div>
          </div>
          <div className="se-freq">Expected with every methylene blue infusion — not a side effect, but a normal result</div>

          <div className="what-box">
            <h3>What It Looks Like</h3>
            <p>Your urine turns blue or blue-green after a methylene blue infusion. It can be startling if you do not expect it. The color can range from a faint teal to a vivid blue depending on the dose and how hydrated you are.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Methylene blue is literally a blue dye. Your body excretes the excess through urine. This is not a side effect — it is the expected result of the compound passing through your system. Your kidneys filter it out and it colors your urine on the way out.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Nothing Needed</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Just expect it.</strong> If you are getting methylene blue for the first time, now you know. The color change is temporary and harmless.
              </div>
              <div className="action-item">
                <strong>It may also lightly stain your tongue or lips blue.</strong> This is also normal and temporary. It fades within a few hours.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>100% Normal</strong>
            <p>Blue-green urine means the methylene blue was delivered and processed by your body. The color returns to normal within 24-48 hours. If someone else uses the bathroom after you, you may want to give them a heads-up.</p>
          </div>
        </div>
      </section>

      {/* ===================== WHEN TO CONTACT US ===================== */}
      <section className="section section-dark">
        <div className="container">
          <div className="v2-label" style={{ color: 'rgba(255,255,255,0.6)' }}><span className="v2-dot" style={{ background: 'rgba(255,255,255,0.6)' }} /> IMPORTANT</div>
          <h2 className="section-title" style={{ color: '#fff' }}>When to Contact Us</h2>
          <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>Most side effects are mild and resolve on their own. But there are times you should reach out.</p>

          <div className="contact-grid">
            <div className="contact-card urgent">
              <h4>Call Right Away</h4>
              <ul>
                <li>Difficulty breathing, throat swelling, or widespread hives during or after infusion</li>
                <li>Fever or chills after leaving the clinic</li>
                <li>Increasing pain, redness, or swelling at the IV site</li>
                <li>Chest pain or heart palpitations</li>
              </ul>
            </div>
            <div className="contact-card routine">
              <h4>Schedule a Check-In</h4>
              <ul>
                <li>A side effect that happens at every session</li>
                <li>Bruising that takes more than a week to heal</li>
                <li>Want to discuss adjusting your protocol</li>
                <li>Questions about which formulas are right for you</li>
              </ul>
            </div>
          </div>

          <div className="disclaimer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Important:</strong> This guide is for Range Medical patients receiving IV therapy. It is not a substitute for personalized medical advice. All infusions are administered by licensed medical professionals. If you are experiencing severe symptoms, contact us immediately.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Questions? We Are Here.</h2>
          <p>Whether you want to adjust your protocol, ask about a specific formula, or talk through a side effect — our team is ready to help.</p>
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
        .contact-card.routine li::before { content: "\\2713"; position: absolute; left: 0; color: #86efac; font-weight: 700; }
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
