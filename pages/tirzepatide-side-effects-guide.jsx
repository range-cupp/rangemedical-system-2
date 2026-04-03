import Layout from '../components/Layout';
import Head from 'next/head';
import { useState } from 'react';

export default function TirzepatideSideEffectsGuide() {
  const [openSection, setOpenSection] = useState(null);

  const toggle = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <Layout
      title="Tirzepatide Side Effects Guide | Range Medical"
      description="Complete guide to managing tirzepatide side effects. Step-by-step instructions for nausea, heartburn, fatigue, hair changes, and more. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Tirzepatide Side Effects Guide",
              "description": "Comprehensive patient guide for managing tirzepatide side effects with step-by-step instructions written at an accessible reading level.",
              "url": "https://www.range-medical.com/tirzepatide-side-effects-guide",
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
          <h1>TIRZEPATIDE<br/>SIDE EFFECTS</h1>
          <div className="hero-rule" />
          <p className="hero-sub">Every side effect explained in plain English. What it feels like, why it happens, and exactly what to do about it — step by step.</p>
        </div>
      </section>

      {/* Overview */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> THE BIG PICTURE</div>
          <h2 className="section-title">Side Effects Are Normal</h2>
          <p className="section-subtitle">Tirzepatide is a dual GIP/GLP-1 receptor agonist — it works on two different receptor systems in your body at the same time. GIP helps regulate how your body processes and stores fat, while GLP-1 controls appetite and slows digestion.</p>
          <p className="body-text">Most side effects are gastrointestinal, mild, happen early in treatment, and improve with time as your body adjusts. For each one below, we give you a clear plan — starting with the simplest fixes and working up from there. You should never have to just &ldquo;tough it out.&rdquo;</p>

          <div className="nav-grid">
            <a href="#nausea" className="nav-card">
              <span className="nav-icon">1</span>
              <div>
                <strong>Nausea & Vomiting</strong>
                <p>The most common. Stomach upset and vomiting.</p>
              </div>
            </a>
            <a href="#diarrhea" className="nav-card">
              <span className="nav-icon">2</span>
              <div>
                <strong>Diarrhea</strong>
                <p>Loose, frequent, or urgent bowel movements.</p>
              </div>
            </a>
            <a href="#constipation" className="nav-card">
              <span className="nav-icon">3</span>
              <div>
                <strong>Constipation</strong>
                <p>Slowed digestion can slow things down too much.</p>
              </div>
            </a>
            <a href="#appetite" className="nav-card">
              <span className="nav-icon">4</span>
              <div>
                <strong>Decreased Appetite</strong>
                <p>When appetite reduction goes too far.</p>
              </div>
            </a>
            <a href="#heartburn" className="nav-card">
              <span className="nav-icon">5</span>
              <div>
                <strong>Heartburn & Acid Reflux</strong>
                <p>Burning in chest or throat after eating.</p>
              </div>
            </a>
            <a href="#injection" className="nav-card">
              <span className="nav-icon">6</span>
              <div>
                <strong>Injection Site Reactions</strong>
                <p>Redness, swelling, or itching where you inject.</p>
              </div>
            </a>
            <a href="#fatigue" className="nav-card">
              <span className="nav-icon">7</span>
              <div>
                <strong>Fatigue</strong>
                <p>Feeling tired or low energy, especially early on.</p>
              </div>
            </a>
            <a href="#hair" className="nav-card">
              <span className="nav-icon">8</span>
              <div>
                <strong>Hair Thinning</strong>
                <p>Temporary shedding from rapid weight loss.</p>
              </div>
            </a>
            <a href="#dizziness" className="nav-card">
              <span className="nav-icon">9</span>
              <div>
                <strong>Dizziness</strong>
                <p>Lightheadedness, especially when standing up.</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ===================== NAUSEA ===================== */}
      <section className="section section-gray" id="nausea">
        <div className="container">
          <div className="se-header">
            <span className="se-number">1</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> MOST COMMON</div>
              <h2 className="section-title">Nausea & Vomiting</h2>
            </div>
          </div>
          <div className="se-freq">Affects roughly 3-4 out of 10 people at higher doses, mostly during the first few weeks at each new dose level (SURMOUNT trials)</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Stomach upset that can range from mild queasiness to feeling like you might throw up. Some people just feel &ldquo;off&rdquo; after eating. Others experience waves of nausea throughout the day. It is usually worst in the first 1-2 weeks after starting or increasing your dose, then gets better as your body adjusts to tirzepatide&rsquo;s dual receptor activation.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Tirzepatide activates both GIP and GLP-1 receptors. The GLP-1 component slows down how fast your stomach empties food — this is part of how it reduces hunger, but when your body is not used to it yet, the slower movement can make you feel nauseous. Your gut has GLP-1 receptors throughout, and they are being activated for the first time. The dual-receptor mechanism means your digestive system is adjusting to two new signals simultaneously.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Eat smaller meals.</strong> Instead of 3 big meals, eat 4-5 smaller ones. Your stomach is emptying slower now, so smaller amounts work better.
              </div>
              <div className="action-item">
                <strong>Avoid greasy, fried, and heavy foods.</strong> These are the hardest for your slowed stomach to handle. Lean protein, vegetables, and simple carbs are easiest to digest.
              </div>
              <div className="action-item">
                <strong>Eat slowly.</strong> Take 20-30 minutes for a meal. Rushing makes nausea worse.
              </div>
              <div className="action-item">
                <strong>Stay hydrated.</strong> Sip water throughout the day. Dehydration makes nausea worse.
              </div>
              <div className="action-item">
                <strong>Try ginger.</strong> Ginger tea, ginger chews, or ginger capsules can settle nausea. This has been studied and it works for many people.
              </div>
              <div className="action-item">
                <strong>Stop eating when you feel satisfied.</strong> On tirzepatide, &ldquo;satisfied&rdquo; comes sooner than you are used to. Eating past that point is the number one trigger for nausea.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Continues (2+ weeks)</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Pause your dose increase.</strong> If you just went up to a new dose, stay at that level for an extra 2-4 weeks before going higher. Give your body more time to adjust to the dual GIP/GLP-1 activation.
              </div>
              <div className="action-item">
                <strong>Split your weekly dose.</strong> Instead of one injection per week, split the same total amount into two smaller injections. This gives your body a lower peak amount and often eliminates nausea.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">If It Is Severe / Call Us If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Contact us for anti-nausea medication.</strong> We can prescribe ondansetron (Zofran) to take as needed during the adjustment period. We may also temporarily lower your dose.
              </div>
              <div className="action-item">
                <strong>Watch for dehydration.</strong> If you are vomiting frequently, make sure you are replacing fluids and electrolytes. Pedialyte, Liquid IV, or coconut water can help. If you cannot keep fluids down for more than 24 hours, call us right away.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>This Gets Better</strong>
            <p>In the SURMOUNT clinical trials, nausea was most common during dose escalation and decreased significantly over time. Your body adjusts. Slow titration is the key — there is no rush to get to a higher dose.</p>
          </div>
        </div>
      </section>

      {/* ===================== DIARRHEA ===================== */}
      <section className="section" id="diarrhea">
        <div className="container">
          <div className="se-header">
            <span className="se-number">2</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Diarrhea</h2>
            </div>
          </div>
          <div className="se-freq">Affects roughly 2 out of 10 people, especially during dose increases (SURMOUNT trials)</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Loose, watery bowel movements that happen more often than normal. You might feel urgency — needing to get to a bathroom quickly. Some people also get cramping or bloating along with it. It can range from mild (just looser than usual) to severe (multiple watery episodes per day). Like nausea, it is usually worst in the first 1-2 weeks at a new dose level.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Tirzepatide&rsquo;s dual GIP/GLP-1 receptor activation changes how your digestive system moves food and absorbs water. The GLP-1 component affects gut motility throughout your entire digestive tract, while GIP signaling alters how your body processes fats. When your body is first adjusting, these combined signals can speed up the gut in some areas while slowing it in others — this mismatch causes diarrhea. Eating fatty or greasy food makes it worse because your body is processing fats differently through the GIP pathway.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Cut back on greasy, fried, and high-fat foods.</strong> These are the number one trigger. Your gut cannot handle high-fat meals the way it used to. Stick to lean protein, rice, bananas, toast, and cooked vegetables during flare-ups.
              </div>
              <div className="action-item">
                <strong>Eat smaller, more frequent meals.</strong> Large meals overwhelm your digestive system right now. Smaller portions are much easier for your gut to process.
              </div>
              <div className="action-item">
                <strong>Avoid dairy if it makes things worse.</strong> Many people on GLP-1 medications develop temporary sensitivity to dairy. Try cutting it out for a week and see if things improve.
              </div>
              <div className="action-item">
                <strong>Stay hydrated — this is critical.</strong> Diarrhea pulls water out of your body fast. Drink water, electrolyte drinks (Pedialyte, Liquid IV, LMNT), or broth throughout the day. If your urine is dark yellow, you are not drinking enough.
              </div>
              <div className="action-item">
                <strong>Replace your electrolytes.</strong> You are losing sodium, potassium, and magnesium every time you have a loose bowel movement. An electrolyte supplement is not optional here — it is necessary to prevent weakness, dizziness, and cramping.
              </div>
              <div className="action-item">
                <strong>Try a probiotic.</strong> A daily probiotic supplement can help restore balance to your gut bacteria, which gets disrupted by the changes in digestion. Look for one with Lactobacillus and Bifidobacterium strains. Give it 1-2 weeks to take effect.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Continues (2+ weeks)</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Pause your dose increase.</strong> If you just went up, stay at your current dose for 2-4 extra weeks. Your gut may just need more time to adjust to tirzepatide&rsquo;s dual-receptor signaling.
              </div>
              <div className="action-item">
                <strong>Split your weekly dose.</strong> Instead of one injection per week, split the same total amount into two smaller injections. Lower peak drug levels mean less GI disruption.
              </div>
              <div className="action-item">
                <strong>Take Imodium (loperamide) as needed.</strong> This over-the-counter medication slows down your gut and is safe to use short-term. Take it when symptoms flare — especially before work, travel, or events. Follow the package directions.
              </div>
              <div className="action-item">
                <strong>Try psyllium fiber (Metamucil).</strong> Soluble fiber absorbs excess water in your intestines and can firm up loose stools. Start with a small dose and increase slowly.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">If It Is Severe / Call Us If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Diarrhea lasts more than 3-4 weeks</strong> despite trying the steps above. We may need to reduce your dose or investigate other causes.
              </div>
              <div className="action-item">
                <strong>You see blood in your stool</strong> or your stool is black and tarry. This needs immediate evaluation.
              </div>
              <div className="action-item">
                <strong>You are having more than 6 watery episodes per day</strong> or you feel dizzy, weak, or lightheaded. You may be getting dehydrated and need medical support.
              </div>
              <div className="action-item">
                <strong>You cannot keep up with fluid replacement.</strong> If you feel like you are losing more than you can drink, call us. Severe dehydration can be dangerous and may need IV fluids.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Your Gut Will Adjust</strong>
            <p>Like nausea, diarrhea is usually a temporary adjustment symptom. It is your gut getting used to new signals from both the GIP and GLP-1 pathways. Most people see significant improvement within 2-4 weeks at a stable dose. The key is managing hydration and electrolytes while your body adapts.</p>
          </div>
        </div>
      </section>

      {/* ===================== CONSTIPATION ===================== */}
      <section className="section section-gray" id="constipation">
        <div className="container">
          <div className="se-header">
            <span className="se-number">3</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Constipation</h2>
            </div>
          </div>
          <div className="se-freq">Affects roughly 1-2 out of 10 people (SURMOUNT trials)</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Fewer bowel movements than normal. Stools may be harder, drier, or more difficult to pass. You might feel bloated or uncomfortable in your lower abdomen. Some people go from daily bowel movements to every 2-3 days.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Tirzepatide&rsquo;s GLP-1 component slows down your entire digestive system — not just your stomach. Food moves through your intestines more slowly, which means more water gets absorbed from the stool before it passes. On top of that, you are eating less food overall because of the combined GIP/GLP-1 appetite suppression, which means less bulk moving through your system.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Drink more water.</strong> Aim for at least 64 ounces per day (eight 8-ounce glasses). Your body is pulling more water from your intestines than usual, so you need to replace it.
              </div>
              <div className="action-item">
                <strong>Eat fiber-rich foods.</strong> Vegetables, fruits, beans, and whole grains add bulk to your stool and help it move through. Even though you are eating less overall, make sure fiber is a priority in what you do eat.
              </div>
              <div className="action-item">
                <strong>Move your body.</strong> Walking, light exercise, or any physical activity helps stimulate your digestive system. Even a 15-minute walk after meals makes a difference.
              </div>
              <div className="action-item">
                <strong>Try a fiber supplement.</strong> Psyllium husk (Metamucil) or methylcellulose (Citrucel) can add the bulk your diet might be missing. Start with a small amount and increase gradually — too much fiber too fast can cause bloating.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Continues (1+ weeks)</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Add magnesium citrate.</strong> This is a gentle, over-the-counter supplement that pulls water into your intestines to soften stool. Take 200-400mg at bedtime. It also helps with the magnesium deficiency that can come from eating less.
              </div>
              <div className="action-item">
                <strong>Try a stool softener.</strong> Docusate sodium (Colace) softens stool without stimulating your intestines. Take it daily until things normalize. It is gentle and safe for ongoing use.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">If It Is Severe / Call Us If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Contact us.</strong> If you have gone more than 4-5 days without a bowel movement, or if you are experiencing significant pain or bloating, call us. We may recommend a short-term osmotic laxative (MiraLAX) or adjust your tirzepatide dose.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Prevention Is Easier Than Treatment</strong>
            <p>Start the water and fiber habits from day one — do not wait until constipation starts. Patients who stay ahead of this from the beginning of their tirzepatide therapy rarely have problems.</p>
          </div>
        </div>
      </section>

      {/* ===================== DECREASED APPETITE ===================== */}
      <section className="section" id="appetite">
        <div className="container">
          <div className="se-header">
            <span className="se-number">4</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Decreased Appetite</h2>
            </div>
          </div>
          <div className="se-freq">Common at therapeutic doses — the medication is working, but sometimes the dual GIP/GLP-1 suppression goes too far</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>You just do not want to eat. Food does not sound appealing. You might go most of the day and realize you have barely eaten anything. Some people feel slightly nauseous at the thought of food. You might feel weak, tired, or irritable — not because of the medication directly, but because you are simply not getting enough fuel.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Reduced appetite is the intended effect of tirzepatide — that is how it causes weight loss. The GLP-1 pathway suppresses hunger signals in your brain, while the GIP pathway changes how your body signals fullness and processes nutrients. Together, these two mechanisms create powerful appetite reduction. But when it goes too far, you stop getting the protein, vitamins, and minerals your body needs. This can cause muscle loss, nutritional deficiencies, fatigue, hair thinning, and weaker immune function. The goal is to eat less — not to barely eat at all.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Build These Habits</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Eat on a schedule, not by hunger.</strong> Set alarms for meals. Do not wait until you feel hungry — on tirzepatide, that signal may not come. Eat at your scheduled times whether you feel like it or not.
              </div>
              <div className="action-item">
                <strong>Prioritize protein at every meal.</strong> Aim for at least 80-100 grams of protein per day. When you are eating less total food, protein needs to be the priority to protect your muscle. Chicken, fish, eggs, Greek yogurt, and protein shakes are your best tools.
              </div>
              <div className="action-item">
                <strong>Use protein shakes to fill gaps.</strong> If you cannot eat enough solid food, a protein shake is an easy way to get 30-40 grams of protein in a few minutes. Keep one on hand for days when eating feels hard.
              </div>
              <div className="action-item">
                <strong>Eat calorie-dense healthy foods.</strong> Nuts, avocados, olive oil, nut butters — these give you more nutrition in smaller amounts. When your appetite is low, make every bite count.
              </div>
              <div className="action-item">
                <strong>Take a daily multivitamin.</strong> Insurance policy for the vitamins and minerals you might be missing from eating less food overall.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">If You Are Eating Under 1,000 Calories Most Days / Call Us If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Contact us.</strong> If you consistently cannot eat more than 800-1,000 calories per day despite trying, we need to adjust your tirzepatide dose. Losing weight too fast causes muscle loss, gallstones, and nutritional deficiency. Sustainable weight loss means eating enough to protect your body while still losing fat.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Slow and Steady Wins</strong>
            <p>Faster weight loss is not better weight loss. Eating too little causes your body to break down muscle for energy, which slows your metabolism and makes it harder to keep weight off long-term. We want you losing fat, not muscle.</p>
          </div>
        </div>
      </section>

      {/* ===================== HEARTBURN ===================== */}
      <section className="section section-gray" id="heartburn">
        <div className="container">
          <div className="se-header">
            <span className="se-number">5</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Heartburn & Acid Reflux</h2>
            </div>
          </div>
          <div className="se-freq">Affects a significant number of people, especially during the first few weeks of treatment or after dose increases</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>A burning sensation in your chest or throat, especially after eating. You might notice a sour or bitter taste in the back of your mouth. Some people feel like food is &ldquo;sitting&rdquo; in their chest. It can be worse when lying down or bending over. Some patients experience burping, bloating, or a feeling of fullness that will not go away.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Tirzepatide significantly slows gastric emptying — food stays in your stomach longer than it used to. When your stomach is full for longer periods, there is more opportunity for stomach acid to push back up into your esophagus, especially if you eat too much, eat too quickly, or lie down after a meal. The GLP-1 component of tirzepatide is the primary driver of this delayed emptying. Spicy, acidic, and fatty foods make it worse because they relax the valve between your stomach and esophagus.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Do not lie down for 2-3 hours after eating.</strong> Gravity helps keep stomach acid where it belongs. Stay upright after meals — sit, stand, or take a walk.
              </div>
              <div className="action-item">
                <strong>Eat smaller meals.</strong> Your stomach is emptying slower on tirzepatide. Smaller portions mean less pressure and less acid reflux.
              </div>
              <div className="action-item">
                <strong>Avoid trigger foods.</strong> Spicy foods, acidic foods (tomatoes, citrus, coffee), chocolate, mint, and alcohol all relax the valve at the top of your stomach and make reflux worse. Pay attention to which foods trigger your symptoms.
              </div>
              <div className="action-item">
                <strong>Elevate the head of your bed.</strong> If heartburn bothers you at night, raise the head of your bed 6-8 inches using blocks or a wedge pillow. This keeps acid from flowing up while you sleep. Regular pillows alone do not help — you need to elevate from the waist up.
              </div>
              <div className="action-item">
                <strong>Try over-the-counter antacids.</strong> Tums or Rolaids provide quick, short-term relief for mild heartburn. Pepcid (famotidine) lasts longer and can be taken before meals if you know certain foods trigger symptoms.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Continues (2+ weeks)</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Contact us about a proton pump inhibitor.</strong> We can recommend or prescribe omeprazole (Prilosec) or a similar medication that reduces stomach acid production. These are very effective for persistent heartburn and are safe for short-to-medium term use.
              </div>
              <div className="action-item">
                <strong>Pause your dose increase.</strong> If reflux worsened after a recent dose increase, staying at your current level for an extra 2-4 weeks gives your stomach more time to adapt.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">If It Is Severe / Call Us If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>You have severe chest pain.</strong> While heartburn can cause chest discomfort, severe or unusual chest pain should always be evaluated. Call us or seek emergency care if you are unsure.
              </div>
              <div className="action-item">
                <strong>You have difficulty swallowing.</strong> If food feels like it is getting stuck or you have pain when swallowing, contact us. This may need further evaluation.
              </div>
              <div className="action-item">
                <strong>You are vomiting blood or have dark, tarry stools.</strong> These are signs of GI bleeding and need immediate medical attention.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Very Manageable</strong>
            <p>Heartburn on tirzepatide responds well to simple dietary changes and over-the-counter remedies. Most patients find that eating smaller meals and staying upright after eating is enough. If not, omeprazole is highly effective.</p>
          </div>
        </div>
      </section>

      {/* ===================== INJECTION SITE ===================== */}
      <section className="section" id="injection">
        <div className="container">
          <div className="se-header">
            <span className="se-number">6</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> LESS COMMON</div>
              <h2 className="section-title">Injection Site Reactions</h2>
            </div>
          </div>
          <div className="se-freq">Affects roughly 1 out of 10 people — usually mild and short-lived</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Redness, swelling, itching, or a small bump at the spot where you injected. It might feel warm or tender to touch. Sometimes there is mild bruising. These reactions usually show up within hours of injecting and go away within 1-3 days.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Any time you put a needle through your skin and inject a substance, your body&rsquo;s immune system notices. It sends some inflammation to the area as part of its normal defense response. This is not an allergic reaction — it is your body reacting to the injection itself. Cold medication can also cause more irritation than room-temperature medication.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Prevention + Treatment</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Let medication reach room temperature.</strong> Take the vial out of the fridge 10-15 minutes before injecting. Cold medication causes more discomfort and more site reactions.
              </div>
              <div className="action-item">
                <strong>Rotate injection sites every week.</strong> Alternate between your abdomen, upper thighs, and back of arms. Never inject in the same spot twice in a row. Keep at least 1-2 inches between injection locations.
              </div>
              <div className="action-item">
                <strong>Inject slowly.</strong> Push the plunger in slowly and steadily. Rushing the injection causes more tissue irritation.
              </div>
              <div className="action-item">
                <strong>Do not rub the area after injecting.</strong> Press gently with a cotton ball or gauze if needed, but rubbing spreads the medication into tissue unevenly and causes more irritation.
              </div>
              <div className="action-item">
                <strong>Apply a cool compress if needed.</strong> If the area is red or itchy, a cool cloth for 10 minutes helps.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call Us If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Redness spreads beyond 2 inches</strong> from the injection site, or the area becomes hot, increasingly painful, or shows signs of infection (pus, streaking redness).
              </div>
              <div className="action-item">
                <strong>You develop hives, swelling of lips/throat, or difficulty breathing</strong> — this could be an allergic reaction and needs immediate medical attention. Call 911 if severe.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FATIGUE ===================== */}
      <section className="section section-gray" id="fatigue">
        <div className="container">
          <div className="se-header">
            <span className="se-number">7</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> LESS COMMON</div>
              <h2 className="section-title">Fatigue</h2>
            </div>
          </div>
          <div className="se-freq">Affects roughly 1 in 8 people, most common in the first few weeks of treatment</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Feeling tired, low energy, or sluggish — especially in the first few weeks of treatment or after a dose increase. Some people describe it as needing a nap in the afternoon when they normally would not. It can feel like your body is working harder than usual just to get through the day.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Multiple things are happening at once. First, you are eating fewer calories because tirzepatide&rsquo;s dual GIP/GLP-1 mechanism is suppressing your appetite, so your body has less immediate fuel. Second, your metabolism is adjusting to using stored fat for energy instead of food — that transition takes time. Third, if you are not eating enough protein, your body may be breaking down some muscle, which makes you feel weaker. Dehydration also plays a role — many people do not drink enough water when they are eating less.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Make sure you are eating enough.</strong> Fatigue from tirzepatide is usually a fuel problem, not a medication problem. Check that you are eating at least 1,200 calories per day with a focus on protein. See the &ldquo;Decreased Appetite&rdquo; section above.
              </div>
              <div className="action-item">
                <strong>Drink more water.</strong> Dehydration causes fatigue. Aim for at least 64 ounces of water per day. More if you are active or it is hot.
              </div>
              <div className="action-item">
                <strong>Prioritize sleep.</strong> Your body is going through a significant metabolic change. Give it 7-9 hours of sleep per night. This is not optional right now — it is part of the process.
              </div>
              <div className="action-item">
                <strong>Light exercise.</strong> It sounds backwards, but light movement — a 20-minute walk, light stretching — actually boosts energy. Do not push hard workouts during the adjustment period. Gentle movement only.
              </div>
              <div className="action-item">
                <strong>Check your electrolytes.</strong> When you eat less and drink more water, you can flush out sodium, potassium, and magnesium. Add an electrolyte supplement (LMNT, Liquid IV, or similar) once daily.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Lasts More Than 3-4 Weeks</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Contact us for bloodwork.</strong> Persistent fatigue beyond the adjustment period may mean something else is going on — thyroid function, iron levels, or vitamin D levels should be checked. We can run labs to find the cause.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Your Body Is Adapting</strong>
            <p>Most fatigue resolves within 2-4 weeks as your body gets better at using stored fat for energy. Think of it as a transition period — like jet lag. It passes.</p>
          </div>
        </div>
      </section>

      {/* ===================== HAIR THINNING ===================== */}
      <section className="section" id="hair">
        <div className="container">
          <div className="se-header">
            <span className="se-number">8</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> LESS COMMON</div>
              <h2 className="section-title">Hair Thinning</h2>
            </div>
          </div>
          <div className="se-freq">Affects a smaller number of people — typically starts 2-4 months into treatment, related to rapid weight loss</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>You notice more hair in your brush, in the shower drain, or on your pillow. Your hair might feel thinner overall. This usually starts 2-4 months after beginning tirzepatide — not right away. It can be alarming, but it is almost always temporary.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>This is called telogen effluvium. When your body goes through a big change — rapid weight loss, major calorie reduction, nutritional stress — it shifts energy away from non-essential functions like hair growth. Hair follicles go into a resting phase and then shed. This happens with any rapid weight loss method, not just tirzepatide. It is your body&rsquo;s way of conserving resources during a time of change. The main drivers are: not enough protein, not enough calories overall, and deficiencies in iron, zinc, biotin, and vitamin D.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Prevention Is Key</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Eat enough protein — this is the most important thing.</strong> Aim for 80-100 grams per day minimum. Hair is made of protein (keratin). If you do not eat enough protein, your body takes it from your hair. Protein shakes can help you hit your target.
              </div>
              <div className="action-item">
                <strong>Do not lose weight too fast.</strong> Losing more than 2-3 pounds per week significantly increases hair shedding risk. If you are losing faster than that, we may need to adjust your tirzepatide dose or increase your calorie intake. Slow, steady loss protects your hair.
              </div>
              <div className="action-item">
                <strong>Take a biotin supplement.</strong> Biotin (vitamin B7) supports hair growth. Take 2,500-5,000 mcg daily. It is inexpensive and available at any pharmacy.
              </div>
              <div className="action-item">
                <strong>Check and supplement key nutrients.</strong> Iron (especially for women), zinc, and vitamin D all affect hair health. A daily multivitamin covers the basics. If shedding is noticeable, we can check your levels with bloodwork.
              </div>
              <div className="action-item">
                <strong>Be gentle with your hair.</strong> Avoid tight hairstyles, excessive heat styling, and harsh chemical treatments during this period. Treat your hair gently while your body is adjusting.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If Shedding Is Significant</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Contact us for labs.</strong> We will check ferritin (iron stores), vitamin D, zinc, and thyroid function. Correcting a specific deficiency often stops the shedding within weeks.
              </div>
              <div className="action-item">
                <strong>Consider slowing your weight loss.</strong> We may adjust your tirzepatide dose to slow the rate of weight loss, which gives your body less metabolic stress and protects hair follicles.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Your Hair Grows Back</strong>
            <p>Telogen effluvium is temporary. Once your weight stabilizes and your nutrition is solid, hair growth resumes. Most people see regrowth within 3-6 months. The hair that grows back is the same quality as before.</p>
          </div>
        </div>
      </section>

      {/* ===================== DIZZINESS ===================== */}
      <section className="section section-gray" id="dizziness">
        <div className="container">
          <div className="se-header">
            <span className="se-number">9</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> LESS COMMON</div>
              <h2 className="section-title">Dizziness</h2>
            </div>
          </div>
          <div className="se-freq">Affects a smaller number of people — usually related to blood pressure or blood sugar changes</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Lightheadedness, feeling like the room is spinning, or feeling unsteady when you stand up. It might happen when you get out of bed in the morning, stand up from a chair, or change positions quickly. Some people feel it after going a long time without eating.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Tirzepatide can lower blood pressure and blood sugar — both of which are usually positive effects, but if they drop too quickly or too far, you feel dizzy. The GIP component of tirzepatide plays a role in insulin signaling and glucose regulation, which can affect blood sugar levels. Dehydration makes it worse because lower fluid volume means lower blood pressure. Eating less (especially skipping meals) can cause blood sugar to dip too low, which also causes dizziness.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Stand up slowly.</strong> When getting out of bed or up from a chair, pause for a moment at the edge before fully standing. Give your blood pressure time to adjust. This simple habit prevents most dizzy episodes.
              </div>
              <div className="action-item">
                <strong>Do not skip meals.</strong> Eat on a schedule, even if you are not hungry. Going long periods without food while on tirzepatide can cause blood sugar to drop too low.
              </div>
              <div className="action-item">
                <strong>Stay hydrated.</strong> Drink water consistently throughout the day. Dehydration drops blood pressure and makes dizziness worse.
              </div>
              <div className="action-item">
                <strong>Add electrolytes.</strong> If you are eating very little and drinking a lot of water, you may be flushing out sodium. A pinch of salt in your water or an electrolyte drink can help stabilize blood pressure.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call Us If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>You feel dizzy frequently or it is getting worse.</strong> We should check your blood pressure and blood sugar to make sure nothing needs medical adjustment.
              </div>
              <div className="action-item">
                <strong>You faint or nearly faint.</strong> This needs immediate evaluation. Do not drive if you are experiencing frequent dizziness.
              </div>
              <div className="action-item">
                <strong>You take blood pressure medication.</strong> Tirzepatide may lower your blood pressure enough that your existing medication needs to be reduced. This is actually a positive sign — but we need to adjust your other medications to prevent it from going too low.
              </div>
            </div>
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
                <li>You cannot keep any food or fluids down for 24+ hours</li>
                <li>Severe abdominal pain (could indicate pancreatitis)</li>
                <li>Signs of allergic reaction: hives, swelling, difficulty breathing</li>
                <li>You faint or nearly faint</li>
                <li>Severe chest pain or difficulty swallowing</li>
                <li>Severe pain of any kind that is not responding to the steps above</li>
              </ul>
            </div>
            <div className="contact-card routine">
              <h4>Schedule a Check-In</h4>
              <ul>
                <li>Any side effect lasting more than 2-3 weeks</li>
                <li>You want to try dose splitting or dose reduction</li>
                <li>You are losing more than 3 pounds per week</li>
                <li>Noticeable hair shedding</li>
                <li>Over-the-counter remedies are not helping</li>
                <li>You are struggling to eat enough food</li>
                <li>You are unsure which step to try next</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="section">
        <div className="container">
          <div className="disclaimer">
            <p><strong>Important:</strong> This guide is for Range Medical patients currently on tirzepatide therapy. It is not a substitute for personalized medical advice. Do not change your dose without talking to your provider first. Tirzepatide is a dual GIP/GLP-1 receptor agonist FDA-approved for type 2 diabetes (Mounjaro) and weight management (Zepbound). All protocols are monitored by licensed providers. Individual results vary.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Questions? We Are Here.</h2>
          <p>Whether you need a dose adjustment, a prescription for symptom management, or just want to talk through what you are feeling — our team can help.</p>
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
        .what-list { list-style: none; padding: 0; margin: 0.75rem 0 0; }
        .what-list li { font-size: 0.9rem; color: #525252; line-height: 1.7; padding: 0.5rem 0; padding-left: 1rem; border-left: 3px solid #e5e5e5; }
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
        .contact-card { padding: 1.5rem; border-radius: 0; }
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
