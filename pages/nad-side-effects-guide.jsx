import Layout from '../components/Layout';
import Head from 'next/head';
import { useState } from 'react';

export default function NADSideEffectsGuide() {
  const [openSection, setOpenSection] = useState(null);

  const toggle = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <Layout
      title="NAD+ Therapy Side Effects Guide | Range Medical"
      description="Complete guide to NAD+ infusion side effects. Chest tightness, nausea, flushing, and more — what to expect and what to do. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "NAD+ Therapy Side Effects Guide",
              "description": "Complete guide to NAD+ infusion side effects. Chest tightness, nausea, flushing, and more — what to expect and what to do.",
              "url": "https://www.range-medical.com/nad-side-effects-guide",
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
          <h1>NAD+ THERAPY<br/>SIDE EFFECTS</h1>
          <div className="hero-rule" />
          <p className="hero-sub">Every side effect explained in plain English. What it feels like, why it happens, and exactly what to do about it — step by step.</p>
        </div>
      </section>

      {/* Overview */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> THE BIG PICTURE</div>
          <h2 className="section-title">What to Know Before Your Infusion</h2>
          <p className="section-subtitle">NAD+ (nicotinamide adenine dinucleotide) is a coenzyme that every cell in your body needs for energy production. IV NAD+ is one of the most powerful therapies we offer — but it is also one where you are most likely to feel something during the infusion.</p>
          <p className="body-text">That is normal. The side effects are temporary, they are manageable by adjusting the drip rate, and they do not mean anything is wrong. Your nurse monitors you throughout and adjusts as needed.</p>

          <div className="nav-grid">
            <a href="#chest" className="nav-card">
              <span className="nav-icon">1</span>
              <div>
                <strong>Chest Tightness or Pressure</strong>
                <p>Tight, heavy feeling in the chest during infusion.</p>
              </div>
            </a>
            <a href="#nausea" className="nav-card">
              <span className="nav-icon">2</span>
              <div>
                <strong>Nausea & Stomach Discomfort</strong>
                <p>Queasy, unsettled stomach during the drip.</p>
              </div>
            </a>
            <a href="#flushing" className="nav-card">
              <span className="nav-icon">3</span>
              <div>
                <strong>Flushing & Warmth</strong>
                <p>Sudden warmth, redness, and hot flashes.</p>
              </div>
            </a>
            <a href="#headache" className="nav-card">
              <span className="nav-icon">4</span>
              <div>
                <strong>Headache</strong>
                <p>Mild to moderate headache during or after.</p>
              </div>
            </a>
            <a href="#muscle" className="nav-card">
              <span className="nav-icon">5</span>
              <div>
                <strong>Muscle Cramping or Tightness</strong>
                <p>Tight, crampy, or achey muscles during infusion.</p>
              </div>
            </a>
            <a href="#anxiety" className="nav-card">
              <span className="nav-icon">6</span>
              <div>
                <strong>Anxiety or Restlessness</strong>
                <p>Jittery, restless, or overstimulated feeling.</p>
              </div>
            </a>
            <a href="#fatigue" className="nav-card">
              <span className="nav-icon">7</span>
              <div>
                <strong>Fatigue After Infusion</strong>
                <p>Feeling tired or drained after your session.</p>
              </div>
            </a>
            <a href="#vein" className="nav-card">
              <span className="nav-icon">8</span>
              <div>
                <strong>Vein Discomfort</strong>
                <p>Burning or stinging along the IV vein.</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ===================== 1. CHEST TIGHTNESS ===================== */}
      <section className="section section-gray" id="chest">
        <div className="container">
          <div className="se-header">
            <span className="se-number">1</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> MOST COMMON DURING INFUSION</div>
              <h2 className="section-title">Chest Tightness or Pressure</h2>
            </div>
          </div>
          <div className="se-freq">The most reported side effect during NAD+ infusions — happens to most people at some point</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>A tight, heavy, or constricting feeling in your chest. Can feel like someone pressing on your sternum. May extend to your shoulders. It can be anxiety-inducing if you do not expect it. This is NOT heart-related — this is the number one thing people worry about during NAD+ infusions.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>NAD+ triggers the release of certain neurotransmitters and affects smooth muscle tone. This creates a temporary chest tightness that resolves completely when the drip rate slows. It is a pharmacological response, not a cardiac event. Heart rate and blood pressure stay normal throughout.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Tell your nurse immediately.</strong> They will slow the drip rate. This is standard protocol with NAD+ infusions and nothing to be embarrassed about.
              </div>
              <div className="action-item">
                <strong>The feeling subsides within 1-3 minutes of slowing.</strong> Once you are comfortable, the drip can be gradually increased again. This back-and-forth is completely normal during NAD+ sessions.
              </div>
              <div className="action-item">
                <strong>Take slow, deep breaths.</strong> This helps your body relax and can reduce the sensation while the rate is being adjusted.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Keeps Returning</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>We run the infusion at a slower baseline rate.</strong> A longer session at a gentler rate eliminates this for most people. Your session may take longer, but you will be comfortable throughout.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Chest pain that does NOT go away when the drip slows.</strong> This is different from the normal NAD+ chest tightness. If slowing the rate does not relieve the feeling within a few minutes, tell your nurse immediately.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Not Your Heart</strong>
            <p>This is the most important thing to know. This feeling is from the NAD+ itself, it happens to most people, and it goes away instantly when the rate slows. Your heart is fine.</p>
          </div>
        </div>
      </section>

      {/* ===================== 2. NAUSEA ===================== */}
      <section className="section" id="nausea">
        <div className="container">
          <div className="se-header">
            <span className="se-number">2</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> MOST COMMON</div>
              <h2 className="section-title">Nausea & Stomach Discomfort</h2>
            </div>
          </div>
          <div className="se-freq">Very common during NAD+ infusions — directly tied to drip rate</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Queasy, unsettled stomach during the infusion. May feel like mild motion sickness. Some people feel crampy in the abdomen. It can range from a vague queasiness to more noticeable nausea.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>NAD+ affects the vagus nerve, which connects your brain to your gut. When NAD+ levels spike rapidly (drip too fast), the vagus nerve triggers a nausea response. This is rate-dependent — slower drip equals less nausea. It is not an allergic reaction or a sign of intolerance.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Slow the drip.</strong> Your nurse adjusts this immediately. Nausea is the clearest signal that the rate is too fast.
              </div>
              <div className="action-item">
                <strong>Eat a light meal 1-2 hours before your appointment.</strong> An empty stomach makes nausea significantly worse. Something simple like toast, a banana, or crackers works well.
              </div>
              <div className="action-item">
                <strong>Ginger chews during the infusion.</strong> Natural ginger is an effective anti-nausea remedy. We keep ginger chews available at the clinic.
              </div>
              <div className="action-item">
                <strong>Deep breathing.</strong> Slow, intentional breathing through the nose helps calm the vagus nerve response.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Persists</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Anti-nausea medication (ondansetron) can be added.</strong> This is a prescription anti-nausea medication that works quickly and effectively. We can administer it during your session.
              </div>
              <div className="action-item">
                <strong>We can split the infusion into two shorter sessions.</strong> Instead of one long session, two shorter sessions on separate days can be easier to tolerate while delivering the same total dose.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Nausea continues for more than an hour after leaving the clinic.</strong> Post-infusion nausea should resolve quickly. If it lingers, contact us so we can adjust your next session.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Completely Rate-Dependent</strong>
            <p>If you feel nauseous, the drip is too fast. That is it. Slowing it down fixes it every time. Pre-session eating makes a major difference too.</p>
          </div>
        </div>
      </section>

      {/* ===================== 3. FLUSHING ===================== */}
      <section className="section section-gray" id="flushing">
        <div className="container">
          <div className="se-header">
            <span className="se-number">3</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Flushing & Warmth</h2>
            </div>
          </div>
          <div className="se-freq">Common during NAD+ infusions — related to niacin pathways and vasodilation</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Sudden warmth spreading through your body. Your face may turn red. It can feel like a hot flash and may come in waves. Some people experience tingling along with the warmth, especially in the face, neck, and ears.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>NAD+ causes temporary vasodilation — your blood vessels opening up. This increases blood flow to the surface of your skin and generates warmth. This is related to niacin pathways (NAD+ is derived from niacin/vitamin B3). If you have ever experienced a niacin flush from a B-vitamin supplement, this is the same mechanism.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Cool cloth on your face.</strong> Ask your nurse for a cool damp cloth. This provides immediate comfort and helps the flushing subside faster.
              </div>
              <div className="action-item">
                <strong>Slow the drip slightly.</strong> A small rate adjustment can reduce flushing without significantly extending your session time.
              </div>
              <div className="action-item">
                <strong>Know that it passes in 5-10 minutes.</strong> Flushing episodes are self-limiting. Even without intervention, they resolve on their own.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If Bothersome</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>A pre-treatment OTC antihistamine can reduce flushing.</strong> Zyrtec (cetirizine) or Claritin (loratadine) taken 30-60 minutes before your appointment can significantly reduce the flushing response.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Flushing accompanied by hives, swelling, or difficulty breathing.</strong> This would suggest an allergic reaction rather than a normal flush. This is extremely rare with NAD+ but should be reported immediately.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Just Your Blood Vessels Opening</strong>
            <p>Flushing from NAD+ is the same mechanism as a niacin flush. It is harmless and temporary. It does not mean you are having a reaction — it means the NAD+ is entering your system.</p>
          </div>
        </div>
      </section>

      {/* ===================== 4. HEADACHE ===================== */}
      <section className="section" id="headache">
        <div className="container">
          <div className="se-header">
            <span className="se-number">4</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Headache</h2>
            </div>
          </div>
          <div className="se-freq">Common during or after infusion — significantly worse if you came in dehydrated</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Mild to moderate headache during or after the infusion. Can be a dull pressure or a more noticeable throbbing. It may develop gradually during the session or appear 1-2 hours afterward.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>NAD+ affects blood flow and can temporarily change intracranial pressure. Dehydration before the session makes this much worse. Some people are simply more sensitive to NAD+{'\u2019'}s effects on blood vessels. The vasodilation that causes flushing can also contribute to headache.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Drink plenty of water before your appointment.</strong> Not just during — before. Pre-hydration is the single most effective preventive measure. Aim for 16-24 oz in the hour before you arrive.
              </div>
              <div className="action-item">
                <strong>OTC pain reliever if needed.</strong> Tylenol (acetaminophen) works well. Avoid ibuprofen during the infusion if possible. Take with food.
              </div>
              <div className="action-item">
                <strong>Ask your nurse to slow the drip.</strong> A gentler infusion rate can prevent headaches from developing during the session.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If Recurring</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>We may add magnesium to your infusion.</strong> Magnesium helps prevent headaches and is a natural complement to NAD+ therapy. We can include it in your IV mix.
              </div>
              <div className="action-item">
                <strong>Pre-hydration protocol.</strong> Drinking a full liter of water the morning of your appointment eliminates headaches for the majority of patients.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Severe headache with vision changes.</strong> A mild headache is expected for some patients, but a severe headache accompanied by visual disturbances should be reported immediately.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Usually a Hydration Issue</strong>
            <p>Pre-hydrating eliminates headaches for most people. This side effect gets less common with repeated sessions as your body adjusts to the infusion.</p>
          </div>
        </div>
      </section>

      {/* ===================== 5. MUSCLE CRAMPING ===================== */}
      <section className="section section-gray" id="muscle">
        <div className="container">
          <div className="se-header">
            <span className="se-number">5</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Muscle Cramping or Tightness</h2>
            </div>
          </div>
          <div className="se-freq">Common during or shortly after infusion — legs and back are the most affected areas</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Muscles may feel tight, crampy, or achey during or shortly after the infusion. Legs and back are most common. Some people describe it as a generalized muscle tension that is different from exercise soreness.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>NAD+ plays a role in muscle cell energy production. A rapid influx of NAD+ can temporarily affect muscle tone and electrolyte balance. If you came in dehydrated or electrolyte-depleted, this is significantly worse. Exercise before a session can also increase susceptibility.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Slow the drip rate.</strong> Like most NAD+ side effects, muscle cramping responds to rate adjustments. Tell your nurse and they will slow it down.
              </div>
              <div className="action-item">
                <strong>Stretch gently during the infusion.</strong> Light stretching while seated can relieve muscle tension. Ankle circles, gentle neck rolls, and leg extensions all help.
              </div>
              <div className="action-item">
                <strong>Electrolyte drink before and after.</strong> An electrolyte drink (like LMNT, Nuun, or coconut water) before your session helps maintain mineral balance during the infusion.
              </div>
              <div className="action-item">
                <strong>Stay hydrated.</strong> Dehydration amplifies every NAD+ side effect, especially muscle cramping. Water plus electrolytes is the winning combination.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If Bothersome</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>We add magnesium to the IV.</strong> Magnesium is a natural muscle relaxant and pairs well with NAD+. We can also give you an electrolyte pre-load before starting the NAD+ drip.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Severe muscle pain or cramping that does not resolve after the infusion ends.</strong> Mild muscle tension is normal, but severe or persistent cramping should be reported so we can adjust your protocol.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Temporary and Manageable</strong>
            <p>Muscle discomfort resolves after the infusion ends. Pre-hydration and electrolytes prevent it in most cases. Each session typically gets easier.</p>
          </div>
        </div>
      </section>

      {/* ===================== 6. ANXIETY ===================== */}
      <section className="section" id="anxiety">
        <div className="container">
          <div className="se-header">
            <span className="se-number">6</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> LESS COMMON</div>
              <h2 className="section-title">Anxiety or Restlessness</h2>
            </div>
          </div>
          <div className="se-freq">Less common overall — more likely during your first infusion or at faster drip rates</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Feeling anxious, jittery, or restless during the infusion. Your heart may feel like it is beating harder (usually not faster — just more noticeable). Can feel like too much caffeine. The chest tightness from NAD+ (see #1) can also trigger anxiety, creating a feedback loop.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>NAD+ increases cellular energy production, including in your brain. Some people experience this as stimulation or anxiety, especially during the first infusion or if the drip rate is fast. Your nervous system is getting an energy boost and can temporarily interpret that as overstimulation.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Slow the drip.</strong> This is always the first move with any NAD+ side effect. A slower rate reduces the intensity of all symptoms.
              </div>
              <div className="action-item">
                <strong>Deep breathing exercises.</strong> Box breathing (4 seconds in, 4 seconds hold, 4 seconds out, 4 seconds hold) is very effective at calming the nervous system response.
              </div>
              <div className="action-item">
                <strong>Distraction helps.</strong> Having a show, podcast, or music to focus on redirects your attention away from the physical sensations. Bring headphones.
              </div>
              <div className="action-item">
                <strong>Know that this passes.</strong> The anxious feeling is temporary and resolves as the rate is adjusted. Understanding that it is a normal NAD+ response helps reduce the anxiety itself.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If Significant</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Contact us before your next session.</strong> We may start at a lower dose and slower rate to let your body acclimate gradually. Some patients benefit from a low-dose anti-anxiety pre-treatment.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Anxiety or panic that does not resolve after the drip is slowed.</strong> If slowing the rate does not calm things down within 5-10 minutes, tell your nurse. We can pause the infusion entirely and reassess.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Your Cells Powering Up</strong>
            <p>The activation feeling is real but not dangerous. Most people feel calm and energized after the infusion once the acute phase passes. First sessions are usually the most intense — it gets easier.</p>
          </div>
        </div>
      </section>

      {/* ===================== 7. FATIGUE ===================== */}
      <section className="section section-gray" id="fatigue">
        <div className="container">
          <div className="se-header">
            <span className="se-number">7</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Fatigue After Infusion</h2>
            </div>
          </div>
          <div className="se-freq">Common after NAD+ sessions — paradoxical but temporary, the energy boost comes later</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Feeling tired, drained, or needing a nap after your NAD+ session. This seems paradoxical since NAD+ is supposed to boost energy — but the post-infusion fatigue is real. Some people feel mentally foggy or just want to lie down for a few hours.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Your body just received a massive cellular energy substrate. It is using that NAD+ to run repair processes — DNA repair, mitochondrial function, sirtuin activation. That repair work takes energy. Think of it like your body running a system update. The energy boost comes later, once the repair processes complete.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Rest after your session if possible.</strong> Plan your schedule so you can take it easy for a few hours after your infusion. Avoid stacking your NAD+ session before something that requires peak performance.
              </div>
              <div className="action-item">
                <strong>Eat a good meal.</strong> Your body is doing a lot of work with the NAD+ you just received. Give it fuel. A balanced meal with protein and healthy fats supports the recovery process.
              </div>
              <div className="action-item">
                <strong>Stay hydrated.</strong> Consistent water intake after your session helps your body process the NAD+ efficiently and can reduce the intensity of fatigue.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If Fatigue Is Prolonged</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Let us know at your next session.</strong> We may adjust the dose or split it across sessions. Some patients do better with smaller, more frequent doses rather than one large infusion.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Extreme fatigue lasting more than 24 hours.</strong> Post-infusion tiredness should resolve by the next morning. If you are still significantly fatigued the following day, contact us so we can review your protocol.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>The Energy Comes After</strong>
            <p>Most people feel significantly more energized 24-48 hours after their NAD+ session. The post-infusion fatigue is your body doing the repair work. By the next day, you should feel the benefit.</p>
          </div>
        </div>
      </section>

      {/* ===================== 8. VEIN DISCOMFORT ===================== */}
      <section className="section" id="vein">
        <div className="container">
          <div className="se-header">
            <span className="se-number">8</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON WITH NAD+</div>
              <h2 className="section-title">Vein Discomfort</h2>
            </div>
          </div>
          <div className="se-freq">More common with NAD+ than standard IV fluids — NAD+ can be more irritating to veins</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Burning, stinging, or aching along the vein where the IV is placed. NAD+ can be more irritating to veins than standard IV fluids. The discomfort may extend up the arm from the IV site. Some people describe it as a warm, stinging sensation that follows the path of the vein.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>NAD+ has a different pH than your blood and can irritate the vein lining (this is called phlebitis). Higher concentrations and faster drip rates cause more irritation. Smaller veins and repeated infusions in the same site can also increase sensitivity.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Warm compress on the IV arm during infusion.</strong> Heat opens up the vein and improves flow, reducing irritation. Your nurse can provide a warm pack.
              </div>
              <div className="action-item">
                <strong>Slow the drip rate.</strong> A slower flow rate gives the NAD+ more time to dilute in your bloodstream, reducing the concentration at the vein wall.
              </div>
              <div className="action-item">
                <strong>Ask your nurse to dilute the NAD+ with more saline.</strong> A more dilute solution is gentler on veins. This extends the session slightly but reduces discomfort significantly.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If Recurring</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Rotate IV sites between sessions.</strong> Using a different arm or vein each time gives previous sites time to recover and reduces cumulative irritation.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Never push through vein pain.</strong> Tell your nurse immediately if the discomfort is significant. They can adjust the site, dilution, or rate. If you notice increasing redness, swelling, or warmth spreading from the IV site after your session, contact us right away.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Adjustable</strong>
            <p>Dilution and rate changes make a big difference. This gets easier as your veins adjust to the infusion over repeated sessions.</p>
          </div>
        </div>
      </section>

      {/* ===================== WHEN TO CONTACT US ===================== */}
      <section className="section section-dark">
        <div className="container">
          <div className="v2-label" style={{ color: 'rgba(255,255,255,0.6)' }}><span className="v2-dot" style={{ background: 'rgba(255,255,255,0.6)' }} /> IMPORTANT</div>
          <h2 className="section-title" style={{ color: '#fff' }}>When to Contact Us</h2>
          <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>Most NAD+ side effects are temporary and resolve with rate adjustments. But there are times you should reach out.</p>

          <div className="contact-grid">
            <div className="contact-card urgent">
              <h4>Call Right Away</h4>
              <ul>
                <li>Chest pain that does NOT go away when the drip slows (different from normal chest tightness)</li>
                <li>Difficulty breathing</li>
                <li>Severe headache with vision changes</li>
                <li>Fever or chills after the infusion</li>
                <li>Signs of allergic reaction (hives, swelling, throat tightness)</li>
              </ul>
            </div>
            <div className="contact-card routine">
              <h4>Schedule a Check-In</h4>
              <ul>
                <li>Side effects that are preventing you from completing sessions</li>
                <li>Want to discuss session length, dose, or frequency</li>
                <li>Vein discomfort that is getting worse between sessions</li>
                <li>Questions about NAD+ timing relative to other treatments</li>
              </ul>
            </div>
          </div>

          <div className="disclaimer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Important:</strong> This guide is for Range Medical patients receiving NAD+ therapy. It is not a substitute for personalized medical advice. All infusions are administered and monitored by licensed medical professionals. NAD+ therapy is not FDA-approved for specific conditions.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Questions? We Are Here.</h2>
          <p>Whether you need a rate adjustment, want to discuss your NAD+ protocol, or just want to talk through what you are feeling — our team can help.</p>
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
