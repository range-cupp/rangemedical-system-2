import Layout from '../components/Layout';
import Head from 'next/head';
import { useState } from 'react';

export default function RetatrutideSideEffectsGuide() {
  const [openSection, setOpenSection] = useState(null);

  const toggle = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <Layout
      title="Retatrutide Side Effects Guide | Range Medical"
      description="Complete guide to managing retatrutide side effects. Step-by-step instructions for nausea, skin sensitivity, fatigue, hair changes, and more. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Retatrutide Side Effects Guide",
              "description": "Comprehensive patient guide for managing retatrutide side effects with step-by-step instructions written at an accessible reading level.",
              "url": "https://www.range-medical.com/retatrutide-side-effects-guide",
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
          <h1>RETATRUTIDE<br/>SIDE EFFECTS</h1>
          <div className="hero-rule" />
          <p className="hero-sub">Every side effect explained in plain English. What it feels like, why it happens, and exactly what to do about it — step by step.</p>
        </div>
      </section>

      {/* Overview */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> THE BIG PICTURE</div>
          <h2 className="section-title">Side Effects Are Normal</h2>
          <p className="section-subtitle">Retatrutide is a powerful medication. It works on three different receptor systems in your body at the same time. That means it is very effective for weight loss — but it also means your body needs time to adjust.</p>
          <p className="body-text">Most side effects are mild, happen early in treatment, and get better on their own. For each one below, we give you a clear plan — starting with the simplest fixes and working up from there. You should never have to just "tough it out."</p>

          <div className="nav-grid">
            <a href="#nausea" className="nav-card">
              <span className="nav-icon">1</span>
              <div>
                <strong>Nausea & Stomach Issues</strong>
                <p>The most common. Nausea, vomiting, diarrhea.</p>
              </div>
            </a>
            <a href="#constipation" className="nav-card">
              <span className="nav-icon">2</span>
              <div>
                <strong>Constipation</strong>
                <p>Slowed digestion can slow things down too much.</p>
              </div>
            </a>
            <a href="#skin" className="nav-card">
              <span className="nav-icon">3</span>
              <div>
                <strong>Skin Sensitivity</strong>
                <p>Tingling, burning, pain from normal touch.</p>
              </div>
            </a>
            <a href="#appetite" className="nav-card">
              <span className="nav-icon">4</span>
              <div>
                <strong>Too Little Appetite</strong>
                <p>When the appetite reduction goes too far.</p>
              </div>
            </a>
            <a href="#injection" className="nav-card">
              <span className="nav-icon">5</span>
              <div>
                <strong>Injection Site Reactions</strong>
                <p>Redness, swelling, or itching where you inject.</p>
              </div>
            </a>
            <a href="#fatigue" className="nav-card">
              <span className="nav-icon">6</span>
              <div>
                <strong>Fatigue</strong>
                <p>Feeling tired or low energy, especially early on.</p>
              </div>
            </a>
            <a href="#hair" className="nav-card">
              <span className="nav-icon">7</span>
              <div>
                <strong>Hair Thinning</strong>
                <p>Temporary shedding from rapid weight loss.</p>
              </div>
            </a>
            <a href="#dizziness" className="nav-card">
              <span className="nav-icon">8</span>
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
              <h2 className="section-title">Nausea, Vomiting & Diarrhea</h2>
            </div>
          </div>
          <div className="se-freq">Affects roughly 4 out of 10 people, mostly during the first few weeks at each new dose level</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Stomach upset that can range from mild queasiness to feeling like you might throw up. Some people get diarrhea instead of — or along with — nausea. It is usually worst in the first 1-2 weeks after starting or increasing your dose, then gets better.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Retatrutide slows down how fast your stomach empties food. This is part of how it reduces hunger — but when your body is not used to it yet, the slower movement can make you feel nauseous. Your gut has GLP-1 receptors too, and they are being activated for the first time.</p>
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
                <strong>Stay hydrated.</strong> Sip water throughout the day. Dehydration makes nausea worse, and if you are having diarrhea, you are losing extra fluid.
              </div>
              <div className="action-item">
                <strong>Try ginger.</strong> Ginger tea, ginger chews, or ginger capsules can settle nausea. This has been studied and it works for many people.
              </div>
              <div className="action-item">
                <strong>Do not eat until you are stuffed.</strong> Stop eating when you feel satisfied, not full. On this medication, "satisfied" comes sooner. Overeating past that point is the number one trigger for nausea.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Continues (2+ weeks)</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Pause your dose increase.</strong> If you just went up to a new dose, stay at that level for an extra 2-4 weeks before going higher. Give your body more time to adjust.
              </div>
              <div className="action-item">
                <strong>Split your weekly dose.</strong> Instead of one injection per week, split the same total amount into two smaller injections. This gives your body a lower peak amount and often eliminates nausea.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">If It Is Severe</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Contact us.</strong> We can prescribe anti-nausea medication (ondansetron/Zofran) to take as needed during the adjustment period. We may also temporarily lower your dose.
              </div>
              <div className="action-item">
                <strong>Watch for dehydration.</strong> If you are vomiting frequently or having persistent diarrhea, make sure you are replacing fluids and electrolytes. Pedialyte, Liquid IV, or coconut water can help. If you cannot keep fluids down, call us right away.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>This Gets Better</strong>
            <p>For most people, nausea is worst in the first 1-2 weeks at a new dose and then fades. Your body adjusts. Slow titration is the key — there is no rush to get to a higher dose.</p>
          </div>
        </div>
      </section>

      {/* ===================== CONSTIPATION ===================== */}
      <section className="section" id="constipation">
        <div className="container">
          <div className="se-header">
            <span className="se-number">2</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Constipation</h2>
            </div>
          </div>
          <div className="se-freq">Affects roughly 1 in 7 people</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Fewer bowel movements than normal. Stools may be harder, drier, or more difficult to pass. You might feel bloated or uncomfortable in your lower abdomen. Some people go from daily bowel movements to every 2-3 days.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Retatrutide slows down your entire digestive system — not just your stomach. Food moves through your intestines more slowly, which means more water gets absorbed from the stool before it passes. On top of that, you are eating less food overall, which means less bulk moving through your system.</p>
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
            <div className="tier-label orange">If It Is Severe</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Contact us.</strong> If you have gone more than 4-5 days without a bowel movement, or if you are experiencing significant pain or bloating, call us. We may recommend a short-term osmotic laxative (MiraLAX) or adjust your dose.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Prevention Is Easier Than Treatment</strong>
            <p>Start the water and fiber habits from day one — do not wait until constipation starts. Patients who stay ahead of this rarely have problems.</p>
          </div>
        </div>
      </section>

      {/* ===================== SKIN SENSITIVITY ===================== */}
      <section className="section section-gray" id="skin">
        <div className="container">
          <div className="se-header">
            <span className="se-number">3</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> UNIQUE TO RETATRUTIDE</div>
              <h2 className="section-title">Skin Sensitivity</h2>
            </div>
          </div>
          <div className="se-freq">Affects roughly 1 in 5 people at higher doses (9-12mg), less common at lower doses</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>This comes in three forms, from mild to severe:</p>
            <ul className="what-list">
              <li><strong>Tingling or burning (dysesthesia):</strong> Your skin might tingle, burn, feel numb, or feel like something is crawling on it. Some people feel like their skin is wet or cold when it is not. This is the most common form — about 1 in 5 people at 12mg, about 1 in 11 at 9mg.</li>
              <li><strong>Extra sensitive skin (hyperesthesia):</strong> Normal touch feels stronger than it should. Warm water feels too hot. A light touch feels like a hard press. About 1 in 14 people.</li>
              <li><strong>Pain from normal touch (allodynia):</strong> The most intense form. Clothes can feel like sandpaper. Running water can sting. A bed sheet touching your skin can feel painful. Your nervous system is misreading normal signals as pain.</li>
            </ul>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Retatrutide works on receptors that sit near the nerves in your skin. This can change how those nerves send signals to your brain — your brain gets confused and feels things that are not really there. This side effect is more common with higher doses and more potent GLP-1 medications. Based on the clinical trials, it is not harmful to your health.</p>
            <p style={{ marginTop: '0.5rem' }}>Low vitamin B12, magnesium, and omega-3 fats can all make nerve sensitivity worse — and because retatrutide reduces appetite, nutritional gaps are common.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First (up to 4 weeks)</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Cool compresses.</strong> Put a cool (not ice cold) damp cloth on the affected area for 10-15 minutes during flare-ups. This calms nerve signals quickly.
              </div>
              <div className="action-item">
                <strong>Wear soft, loose clothes.</strong> Tight clothes and rough seams make it much worse. Switch to soft, loose fabrics — cotton and bamboo are good choices.
              </div>
              <div className="action-item">
                <strong>Take an antihistamine daily.</strong> Loratadine (Claritin) is best because it will not make you drowsy. One tablet daily. Most people see improvement within 1 week. Cetirizine (Zyrtec) also works but may cause drowsiness.
              </div>
              <div className="action-item">
                <strong>Fill nutrition gaps.</strong> Take a vitamin B12 supplement, magnesium glycinate (easiest on your stomach), and fish oil (omega-3). These protect your nerves and are often low when you are eating less.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Continues Past 4 Weeks</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Split your weekly dose.</strong> Instead of one injection per week, split the same total into two smaller injections. This lowers peak drug levels and is the single most effective intervention.
              </div>
              <div className="action-item">
                <strong>Temporarily reduce your dose.</strong> We may lower your total weekly dose by 25-50%. At 9mg, patients lost 26.4% body weight with only 8.8% skin issues — versus 28.7% loss and 20.9% skin issues at 12mg. A slightly lower dose gives almost the same results.
              </div>
              <div className="action-item">
                <strong>Pause titration.</strong> If still increasing doses, we hold at your current level for 2-4 extra weeks.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">For Moderate to Severe Cases</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Gabapentin or pregabalin.</strong> Prescription nerve-calming medications. Your provider starts you low and adjusts. Best for moderate-to-severe cases where dose changes alone are not enough.
              </div>
              <div className="action-item">
                <strong>Lidocaine cream.</strong> A prescription numbing cream applied directly to problem areas. Works quickly and only affects where you apply it. Best for symptoms in specific spots.
              </div>
              <div className="action-item">
                <strong>Capsaicin cream (OTC).</strong> Made from hot peppers — feels warm at first, then reduces pain signals. Use the low-dose version from any pharmacy. Apply 3-4 times daily to affected areas.
              </div>
              <div className="action-item">
                <strong>Low-dose naltrexone.</strong> A newer option being explored for GLP-1 nerve side effects. Limited data but mechanistically promising. Ask your provider if this fits your situation.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Not Harmful — And Very Treatable</strong>
            <p>Skin sensitivity from retatrutide is not a sign of nerve damage. It resolves with dose adjustment or discontinuation. The antihistamine + dose split combination resolves the majority of cases without anyone needing to stop.</p>
          </div>
        </div>
      </section>

      {/* ===================== APPETITE ===================== */}
      <section className="section" id="appetite">
        <div className="container">
          <div className="se-header">
            <span className="se-number">4</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> WATCH FOR THIS</div>
              <h2 className="section-title">Too Little Appetite</h2>
            </div>
          </div>
          <div className="se-freq">Common at therapeutic doses — the medication is working, but sometimes it works too well</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>You just do not want to eat. Food does not sound appealing. You might go most of the day and realize you have barely eaten anything. Some people feel slightly nauseous at the thought of food. You might feel weak, tired, or irritable — not because of the medication directly, but because you are simply not getting enough fuel.</p>
          </div>

          <div className="why-box">
            <h3>Why It Matters</h3>
            <p>Reduced appetite is the intended effect — that is how retatrutide causes weight loss. But when it goes too far, you stop getting the protein, vitamins, and minerals your body needs. This can cause muscle loss (instead of just fat loss), nutritional deficiencies, fatigue, hair thinning, and weaker immune function. The goal is to eat less — not to barely eat at all.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Build These Habits</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Eat on a schedule, not by hunger.</strong> Set alarms for meals. Do not wait until you feel hungry — on this medication, that signal may not come. Eat at your scheduled times whether you feel like it or not.
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
            <div className="tier-label yellow">If You Are Eating Under 1,000 Calories Most Days</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Contact us.</strong> If you consistently cannot eat more than 800-1,000 calories per day despite trying, we need to adjust your dose. Losing weight too fast causes muscle loss, gallstones, and nutritional deficiency. Sustainable weight loss means eating enough to protect your body while still losing fat.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Slow and Steady Wins</strong>
            <p>Faster weight loss is not better weight loss. Eating too little causes your body to break down muscle for energy, which slows your metabolism and makes it harder to keep weight off long-term. We want you losing fat, not muscle.</p>
          </div>
        </div>
      </section>

      {/* ===================== INJECTION SITE ===================== */}
      <section className="section section-gray" id="injection">
        <div className="container">
          <div className="se-header">
            <span className="se-number">5</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Injection Site Reactions</h2>
            </div>
          </div>
          <div className="se-freq">Affects roughly 1 in 10 people — usually mild and short-lived</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Redness, swelling, itching, or a small bump at the spot where you injected. It might feel warm or tender to touch. Sometimes there is mild bruising. These reactions usually show up within hours of injecting and go away within 1-3 days.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Any time you put a needle through your skin and inject a substance, your body's immune system notices. It sends some inflammation to the area as part of its normal defense response. This is not an allergic reaction — it is your body reacting to the injection itself. Cold medication can also cause more irritation than room-temperature medication.</p>
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
      <section className="section" id="fatigue">
        <div className="container">
          <div className="se-header">
            <span className="se-number">6</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON EARLY ON</div>
              <h2 className="section-title">Fatigue</h2>
            </div>
          </div>
          <div className="se-freq">Affects roughly 1 in 8 people, most common in the first few weeks</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Feeling tired, low energy, or sluggish — especially in the first few weeks of treatment or after a dose increase. Some people describe it as needing a nap in the afternoon when they normally would not. It can feel like your body is working harder than usual just to get through the day.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Multiple things are happening at once. First, you are eating fewer calories, so your body has less immediate fuel. Second, your metabolism is adjusting to using stored fat for energy instead of food — that transition takes time. Third, if you are not eating enough protein, your body may be breaking down some muscle, which makes you feel weaker. Dehydration also plays a role — many people do not drink enough water when they are eating less.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Make sure you are eating enough.</strong> Fatigue from this medication is usually a fuel problem, not a medication problem. Check that you are eating at least 1,200 calories per day with a focus on protein. See the "Too Little Appetite" section above.
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
      <section className="section section-gray" id="hair">
        <div className="container">
          <div className="se-header">
            <span className="se-number">7</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> LESS COMMON</div>
              <h2 className="section-title">Hair Thinning</h2>
            </div>
          </div>
          <div className="se-freq">Affects a smaller number of people — related to rapid weight loss, not the medication itself</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>You notice more hair in your brush, in the shower drain, or on your pillow. Your hair might feel thinner overall. This usually starts 2-4 months after beginning treatment — not right away. It can be alarming, but it is almost always temporary.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>This is called telogen effluvium. When your body goes through a big change — rapid weight loss, major calorie reduction, nutritional stress — it shifts energy away from non-essential functions like hair growth. Hair follicles go into a resting phase and then shed. This happens with any rapid weight loss method, not just retatrutide. It is your body's way of conserving resources during a time of change.</p>
            <p style={{ marginTop: '0.5rem' }}>The main drivers are: not enough protein, not enough calories overall, and deficiencies in iron, zinc, biotin, and vitamin D.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Prevention Is Key</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Eat enough protein — this is the most important thing.</strong> Aim for 80-100 grams per day minimum. Hair is made of protein (keratin). If you do not eat enough protein, your body takes it from your hair. Protein shakes can help you hit your target.
              </div>
              <div className="action-item">
                <strong>Do not lose weight too fast.</strong> Losing more than 2-3 pounds per week significantly increases hair shedding risk. If you are losing faster than that, we may need to adjust your dose or increase your calorie intake. Slow, steady loss protects your hair.
              </div>
              <div className="action-item">
                <strong>Take a biotin supplement.</strong> Biotin (vitamin B7) supports hair growth. Take 2,500-5,000 mcg daily. It is inexpensive and available at any pharmacy.
              </div>
              <div className="action-item">
                <strong>Check and supplement key nutrients.</strong> Iron (especially for women), zinc, and vitamin D all affect hair health. A daily multivitamin covers the basics. If shedding is noticeable, we can check your iron/ferritin and vitamin D levels with bloodwork.
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
                <strong>Consider slowing your weight loss.</strong> We may adjust your dose to slow the rate of weight loss, which gives your body less metabolic stress and protects hair follicles.
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
      <section className="section" id="dizziness">
        <div className="container">
          <div className="se-header">
            <span className="se-number">8</span>
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
            <p>Retatrutide can lower blood pressure and blood sugar — both of which are usually good things, but if they drop too quickly or too far, you feel dizzy. Dehydration makes it worse because lower fluid volume means lower blood pressure. Eating less (especially skipping meals) can cause blood sugar to dip too low, which also causes dizziness.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Stand up slowly.</strong> When getting out of bed or up from a chair, pause for a moment at the edge before fully standing. Give your blood pressure time to adjust. This simple habit prevents most dizzy episodes.
              </div>
              <div className="action-item">
                <strong>Do not skip meals.</strong> Eat on a schedule, even if you are not hungry. Going long periods without food while on this medication can cause blood sugar to drop too low.
              </div>
              <div className="action-item">
                <strong>Stay hydrated.</strong> Drink water consistently throughout the day. Dehydration drops blood pressure and makes dizziness worse.
              </div>
              <div className="action-item">
                <strong>Add salt if needed.</strong> If you are eating very little and drinking a lot of water, you may be flushing out sodium. A pinch of salt in your water or an electrolyte drink can help stabilize blood pressure.
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
                <strong>You take blood pressure medication.</strong> Retatrutide may lower your blood pressure enough that your existing medication needs to be reduced. This is actually a positive sign — but we need to adjust your other medications to prevent it from going too low.
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
                <li>Numbness or weakness that does not go away</li>
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
            <p><strong>Important:</strong> This guide is for Range Medical patients currently on retatrutide therapy. It is not a substitute for personalized medical advice. Do not change your dose without talking to your provider first. Retatrutide is currently used off-label/compounded and is not yet FDA-approved. All protocols are monitored by licensed providers. Individual results vary.</p>
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
        .guide-hero {
          background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
          padding: 3.5rem 1.5rem 3rem;
          text-align: center;
        }
        .guide-hero h1 {
          font-size: clamp(2.2rem, 6vw, 3.5rem);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }
        .v2-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #737373;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
        }
        .v2-label.center {
          justify-content: center;
        }
        .v2-dot {
          width: 6px;
          height: 6px;
          background: #737373;
          border-radius: 50%;
          display: inline-block;
        }
        .hero-rule {
          width: 60px;
          height: 3px;
          background: #000;
          margin: 0 auto 1.25rem;
        }
        .hero-sub {
          font-size: 1.0625rem;
          color: #525252;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.7;
        }
        .section {
          padding: 3.5rem 1.5rem;
        }
        .section-gray {
          background: #fafafa;
        }
        .section-dark {
          background: #0a0a0a;
          color: #ffffff;
        }
        .section-title {
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 0.75rem;
        }
        .section-subtitle {
          font-size: 1rem;
          color: #525252;
          max-width: 600px;
          line-height: 1.7;
          margin-bottom: 2rem;
        }
        .body-text {
          font-size: 0.95rem;
          color: #525252;
          line-height: 1.7;
          margin-top: 0.75rem;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }

        /* Navigation grid */
        .nav-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-top: 2rem;
        }
        .nav-card {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          padding: 1rem 1.25rem;
          text-decoration: none;
          color: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .nav-card:hover {
          border-color: #000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .nav-icon {
          width: 1.75rem;
          height: 1.75rem;
          background: #000;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.75rem;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
        .nav-card strong {
          font-size: 0.9rem;
          display: block;
          margin-bottom: 0.125rem;
        }
        .nav-card p {
          font-size: 0.8rem;
          color: #737373;
          line-height: 1.4;
          margin: 0;
        }

        /* Side effect header */
        .se-header {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .se-number {
          width: 3rem;
          height: 3rem;
          background: #000;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1.25rem;
          flex-shrink: 0;
          margin-top: 0.25rem;
        }
        .se-header .section-title {
          margin-bottom: 0;
        }
        .se-header .v2-label {
          margin-bottom: 0.25rem;
        }
        .se-freq {
          font-size: 0.875rem;
          color: #737373;
          font-style: italic;
          margin-bottom: 1.75rem;
          padding-left: 4.25rem;
        }

        /* What / Why boxes */
        .what-box, .why-box {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }
        .section-gray .what-box,
        .section-gray .why-box {
          background: #ffffff;
        }
        .what-box h3, .why-box h3 {
          font-size: 0.9rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #171717;
          margin-bottom: 0.75rem;
        }
        .what-box p, .why-box p {
          font-size: 0.9rem;
          color: #525252;
          line-height: 1.7;
        }
        .what-list {
          list-style: none;
          padding: 0;
          margin: 0.75rem 0 0;
        }
        .what-list li {
          font-size: 0.9rem;
          color: #525252;
          line-height: 1.7;
          padding: 0.5rem 0;
          padding-left: 1rem;
          border-left: 3px solid #e5e5e5;
          margin-bottom: 0.5rem;
        }

        /* Tier cards */
        .steps-header {
          font-size: 1.125rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
        }
        .tier-card {
          border: 1px solid #e5e5e5;
          margin-bottom: 1rem;
          overflow: hidden;
        }
        .tier-label {
          padding: 0.625rem 1.25rem;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .tier-label.green {
          background: #f0faf0;
          color: #2E6B35;
          border-bottom: 2px solid #2E6B35;
        }
        .tier-label.yellow {
          background: #fefce8;
          color: #92400e;
          border-bottom: 2px solid #d97706;
        }
        .tier-label.orange {
          background: #fff7ed;
          color: #9a3412;
          border-bottom: 2px solid #ea580c;
        }
        .tier-body {
          padding: 1.25rem;
          background: #ffffff;
        }
        .action-item {
          font-size: 0.9rem;
          color: #525252;
          line-height: 1.7;
          padding: 0.625rem 0;
          border-bottom: 1px solid #f5f5f5;
        }
        .action-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .action-item strong {
          color: #171717;
        }

        /* Reassure box */
        .reassure-box {
          background: #f0faf0;
          border-left: 4px solid #2E6B35;
          padding: 1.25rem 1.5rem;
          margin-top: 1.5rem;
        }
        .reassure-box strong {
          display: block;
          margin-bottom: 0.25rem;
          color: #2E6B35;
        }
        .reassure-box p {
          font-size: 0.9rem;
          color: #525252;
          line-height: 1.6;
          margin: 0;
        }

        /* Data box */
        .data-box {
          background: #ffffff;
          border: 2px solid #000000;
          padding: 1.5rem;
          margin-top: 1.5rem;
        }
        .data-box h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .data-box p {
          font-size: 0.9rem;
          color: #525252;
          line-height: 1.7;
        }

        /* Nutrient list */
        .nutrient-list {
          list-style: none;
          padding: 0;
          margin: 0.75rem 0 0;
        }
        .nutrient-list li {
          font-size: 0.9rem;
          color: #525252;
          padding: 0.375rem 0;
          padding-left: 1.25rem;
          position: relative;
          line-height: 1.6;
        }
        .nutrient-list li::before {
          content: "\\2713";
          position: absolute;
          left: 0;
          color: #2E6B35;
          font-weight: 700;
        }

        /* Contact grid (dark section) */
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        .contact-card {
          padding: 1.5rem;
        }
        .contact-card.urgent {
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.3);
        }
        .contact-card.routine {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .contact-card h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #ffffff;
        }
        .contact-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .contact-card li {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
          padding: 0.375rem 0;
          padding-left: 1.25rem;
          position: relative;
          line-height: 1.5;
        }
        .contact-card.urgent li::before {
          content: "!";
          position: absolute;
          left: 0;
          color: #ef4444;
          font-weight: 700;
        }
        .contact-card.routine li::before {
          content: "\\2713";
          position: absolute;
          left: 0;
          color: #22c55e;
          font-weight: 700;
        }

        /* Disclaimer */
        .disclaimer {
          background: #fafafa;
          border: 1px solid #e5e5e5;
          padding: 1.25rem;
        }
        .disclaimer p {
          font-size: 0.8125rem;
          color: #737373;
          line-height: 1.6;
          margin: 0;
        }

        /* CTA */
        .final-cta {
          background: #000000;
          color: #ffffff;
          padding: 3.5rem 1.5rem;
          text-align: center;
        }
        .final-cta h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }
        .final-cta p {
          font-size: 1rem;
          color: rgba(255,255,255,0.8);
          margin-bottom: 1.5rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        .cta-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .btn-white {
          display: inline-block;
          background: #ffffff;
          color: #000000;
          padding: 0.875rem 1.75rem;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }
        .btn-white:hover {
          background: #f5f5f5;
          transform: translateY(-1px);
        }
        .btn-outline-white {
          display: inline-block;
          background: transparent;
          color: #ffffff;
          padding: 0.875rem 1.75rem;
          border: 2px solid #ffffff;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }
        .btn-outline-white:hover {
          background: #ffffff;
          color: #000000;
        }
        .cta-location {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.7);
        }

        @media (max-width: 768px) {
          .guide-hero h1 {
            font-size: 2rem;
          }
          .nav-grid,
          .contact-grid {
            grid-template-columns: 1fr;
          }
          .se-header {
            gap: 0.75rem;
          }
          .se-number {
            width: 2.25rem;
            height: 2.25rem;
            font-size: 1rem;
          }
          .se-freq {
            padding-left: 3rem;
          }
          .section-title {
            font-size: 1.5rem;
          }
          .cta-buttons {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </Layout>
  );
}
