import Layout from '../components/Layout';
import Head from 'next/head';
import { useState } from 'react';

export default function RLTSideEffectsGuide() {
  const [openSection, setOpenSection] = useState(null);

  const toggle = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <Layout
      title="Red Light Therapy Side Effects Guide | Range Medical"
      description="Complete guide to red light therapy side effects. Skin redness, eye safety, warmth, and more — what to expect and what to do. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Red Light Therapy Side Effects Guide",
              "description": "Complete patient guide to red light therapy (photobiomodulation) side effects with step-by-step management instructions.",
              "url": "https://www.range-medical.com/rlt-side-effects-guide",
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
          <h1>RED LIGHT THERAPY<br/>SIDE EFFECTS</h1>
          <div className="hero-rule" />
          <p className="hero-sub">Every side effect explained in plain English. What it feels like, why it happens, and exactly what to do about it.</p>
        </div>
      </section>

      {/* Overview */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> THE BIG PICTURE</div>
          <h2 className="section-title">One of the Safest Therapies We Offer</h2>
          <p className="section-subtitle">Red light therapy (photobiomodulation) uses specific wavelengths of red and near-infrared light to support cellular function. It is one of the safest therapies we offer. Side effects are rare and mild.</p>
          <p className="body-text">This guide covers what you might notice so you are fully informed. We take even small things seriously — because transparency builds trust and helps you get the most out of every session.</p>

          <div className="nav-grid">
            <a href="#redness" className="nav-card">
              <span className="nav-icon">1</span>
              <div>
                <strong>Mild Skin Redness</strong>
                <p>Temporary pink or flushed skin after a session.</p>
              </div>
            </a>
            <a href="#eyes" className="nav-card">
              <span className="nav-icon">2</span>
              <div>
                <strong>Eye Strain or Sensitivity</strong>
                <p>Light sensitivity if eyewear is not used properly.</p>
              </div>
            </a>
            <a href="#warmth" className="nav-card">
              <span className="nav-icon">3</span>
              <div>
                <strong>Mild Warmth or Tingling</strong>
                <p>Gentle warm sensation during treatment.</p>
              </div>
            </a>
            <a href="#dryness" className="nav-card">
              <span className="nav-icon">4</span>
              <div>
                <strong>Temporary Tightness or Dryness</strong>
                <p>Skin may feel slightly tight after a session.</p>
              </div>
            </a>
            <a href="#fatigue" className="nav-card">
              <span className="nav-icon">5</span>
              <div>
                <strong>Fatigue or Deep Relaxation</strong>
                <p>Feeling sleepy or deeply relaxed afterward.</p>
              </div>
            </a>
            <a href="#headache" className="nav-card">
              <span className="nav-icon">6</span>
              <div>
                <strong>Headache</strong>
                <p>Mild headache, usually related to hydration.</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ===================== MILD SKIN REDNESS ===================== */}
      <section className="section section-gray" id="redness">
        <div className="container">
          <div className="se-header">
            <span className="se-number">1</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> MOST COMMON</div>
              <h2 className="section-title">Mild Skin Redness</h2>
            </div>
          </div>
          <div className="se-freq">Temporary — usually fades within 30-60 minutes after a session</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>The treated area may appear slightly pink or flushed immediately after a session. Like a very mild sunburn appearance without the pain. It is not uncomfortable — just noticeable. Usually fades completely within 30-60 minutes.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Red and near-infrared light increases blood flow to the treated area. More blood flow means temporarily pink skin. This is actually the intended mechanism — increased circulation is exactly how the therapy works. The redness is visible evidence that your body is responding to the treatment.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Nothing needed.</strong> This resolves entirely on its own within 30-60 minutes. No treatment required.
              </div>
              <div className="action-item">
                <strong>If it bothers you, apply a cool cloth.</strong> A cool (not cold) damp cloth provides comfort. Do not apply ice directly to the skin.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">Monitor If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Redness lasts more than 2-3 hours.</strong> This is unusual and may indicate your skin is more sensitive to light than average. We can adjust your session length or distance from the panels.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call Us If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Skin feels hot, painful, or blistered.</strong> This is extremely rare and would indicate equipment malfunction or an undiagnosed photosensitivity. Contact us right away.
              </div>
              <div className="action-item">
                <strong>You are taking any photosensitizing medications.</strong> Certain antibiotics, retinoids, and other medications make your skin more reactive to light. Tell us before your session if you have started any new medications.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>This Means It Is Working</strong>
            <p>Increased blood flow is exactly what the therapy is designed to do. The temporary pink flush is a sign that your cells are receiving the light energy and responding. It is a feature, not a side effect.</p>
          </div>
        </div>
      </section>

      {/* ===================== EYE STRAIN ===================== */}
      <section className="section" id="eyes">
        <div className="container">
          <div className="se-header">
            <span className="se-number">2</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON IF EYEWEAR NOT USED PROPERLY</div>
              <h2 className="section-title">Eye Strain or Sensitivity</h2>
            </div>
          </div>
          <div className="se-freq">Completely preventable with proper protective eyewear — provided at every session</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Eyes feel sensitive, a slight headache behind the eyes, or temporary brightness sensitivity after a session. Similar to looking at a bright screen for too long. Some people notice that indoor lighting seems slightly brighter than usual for a short period after treatment.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Red and near-infrared light is very bright. Direct exposure to high-intensity light can cause temporary eye fatigue, just like staring at a bright screen. The light panels emit concentrated wavelengths that, while therapeutic for skin and tissue, are too intense for unprotected eyes.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Prevention — This Is the Fix</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>ALWAYS wear the provided protective eyewear during your session.</strong> We provide goggles at every session. This is the single most important thing you can do.
              </div>
              <div className="action-item">
                <strong>Keep your eyes closed even with goggles on.</strong> Double protection is best. The goggles block the light, and closed eyes add another layer.
              </div>
              <div className="action-item">
                <strong>Do not look directly at the light panels.</strong> Even with goggles, avoid staring into the panels. Face away or keep your eyes shut.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If You Experience It</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Rest your eyes.</strong> Dim your environment for 30 minutes after your session. Avoid screens if possible. Symptoms should resolve quickly.
              </div>
              <div className="action-item">
                <strong>Use artificial tears if your eyes feel dry.</strong> Over-the-counter lubricating eye drops can provide immediate comfort.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call Us If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Vision changes persist beyond a few hours.</strong> Any lasting change in vision — blurriness, spots, or sensitivity — should be evaluated. This is extremely rare with proper eyewear use.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Completely Preventable</strong>
            <p>Proper eyewear eliminates this entirely. We provide goggles at every session and our staff will always make sure you have them on before starting treatment. This side effect only occurs when eye protection is not used correctly.</p>
          </div>
        </div>
      </section>

      {/* ===================== MILD WARMTH OR TINGLING ===================== */}
      <section className="section section-gray" id="warmth">
        <div className="container">
          <div className="se-header">
            <span className="se-number">3</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Mild Warmth or Tingling</h2>
            </div>
          </div>
          <div className="se-freq">A gentle warm sensation during treatment — should feel pleasant, like gentle sunlight</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>A gentle warm sensation on the skin during treatment. Some people feel a slight tingling, especially in areas with more blood flow close to the surface. It should feel pleasant — like standing in gentle sunlight. The warmth is mild and should never feel hot or uncomfortable.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>The light energy is absorbed by your cells and partially converted to heat. Near-infrared wavelengths penetrate deeper into tissue and generate slightly more warmth than red wavelengths. The tingling is from increased circulation as blood flow increases to the treated area.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">This Is Normal</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>No action needed.</strong> This is a normal and expected part of the treatment. The warmth is part of how the therapy works.
              </div>
              <div className="action-item">
                <strong>Enjoy it.</strong> Most patients find the warmth relaxing and pleasant. It is one of the reasons people look forward to their sessions.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Becomes Uncomfortable</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Tell your technician immediately.</strong> If the warmth crosses from pleasant to uncomfortable (feels too hot), speak up. The light may be too close to your skin or the session may be too long for your skin type.
              </div>
              <div className="action-item">
                <strong>We can adjust distance and duration.</strong> Moving the panels slightly farther from your skin or shortening the session reduces warmth while still delivering the therapeutic benefit.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call Us If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>The sensation feels like burning rather than warmth.</strong> Treatment should never feel painful. If it does, stop the session and contact us. This could indicate a sensitivity issue or equipment calibration need.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Completely Normal</strong>
            <p>The therapeutic effect depends on light absorption, and some warmth is a natural part of that process. Think of it as confirmation that the light is reaching your cells and doing its job.</p>
          </div>
        </div>
      </section>

      {/* ===================== TEMPORARY TIGHTNESS OR DRYNESS ===================== */}
      <section className="section" id="dryness">
        <div className="container">
          <div className="se-header">
            <span className="se-number">4</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> LESS COMMON</div>
              <h2 className="section-title">Temporary Tightness or Dryness</h2>
            </div>
          </div>
          <div className="se-freq">Occasional — similar to how skin feels after mild sun exposure</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Skin may feel slightly tight or dry in the treated area after a session, similar to how skin feels after mild sun exposure. It is not painful — just a mild tightness that you might notice when you move or stretch the skin. Usually resolves within a few hours.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>The light energy can temporarily reduce surface moisture on the skin. The mild heat from the light panels can also contribute to slight dehydration of the outer skin layer. This is minor and self-correcting — your skin naturally rehydrates within a few hours.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Apply a gentle moisturizer after your session.</strong> Any unscented, gentle moisturizer works. Apply it to the treated area within 30 minutes of your session.
              </div>
              <div className="action-item">
                <strong>Stay hydrated.</strong> Drink water before and after your session. Hydrated skin from the inside handles light therapy better.
              </div>
              <div className="action-item">
                <strong>Use a hyaluronic acid serum for facial treatments.</strong> If you are receiving facial red light therapy, a hyaluronic acid serum applied after the session is particularly effective at restoring moisture.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Persists</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Let us know at your next session.</strong> We can adjust session length or recommend a specific post-treatment skincare routine for your skin type.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call Us If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Skin becomes cracked, flaky, or irritated.</strong> This would be unusual and we should evaluate whether your skin has an underlying sensitivity that needs to be addressed before continuing sessions.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Easy Fix</strong>
            <p>A simple moisturizer is all you need. Many patients actually notice improved skin texture and tone with consistent sessions — the temporary tightness gives way to healthier-looking skin over time.</p>
          </div>
        </div>
      </section>

      {/* ===================== FATIGUE OR DEEP RELAXATION ===================== */}
      <section className="section section-gray" id="fatigue">
        <div className="container">
          <div className="se-header">
            <span className="se-number">5</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> LESS COMMON</div>
              <h2 className="section-title">Fatigue or Deep Relaxation</h2>
            </div>
          </div>
          <div className="se-freq">Varies by person — some feel deeply relaxed, others feel energized</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Feeling sleepy, deeply relaxed, or mildly fatigued after a session. You might feel like you just had a great nap or a deep massage. Some people experience the opposite — a noticeable energy boost. Both responses are normal. The effect can vary session to session.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Red light therapy affects mitochondrial function and can promote parasympathetic nervous system activation — your body's "rest and repair" mode. The deep relaxation response is actually part of the therapeutic benefit. Your body is shifting into recovery mode, which is exactly what the therapy is designed to support.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Work With Your Body</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>If fatigue is an issue, schedule sessions in the evening.</strong> Let the relaxation response work in your favor — a session before bed can improve sleep quality.
              </div>
              <div className="action-item">
                <strong>If you prefer the energy boost, schedule in the morning.</strong> Some people find that morning sessions give them a noticeable lift for the rest of the day.
              </div>
              <div className="action-item">
                <strong>Give yourself 15-20 minutes to transition after a session.</strong> Do not rush straight into demanding tasks. A short transition period helps your body shift gears.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If Fatigue Is Significant</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Tell us at your next session.</strong> We can adjust session length or frequency. Shorter sessions may give you the benefits without the fatigue.
              </div>
              <div className="action-item">
                <strong>Make sure you are eating and hydrating before sessions.</strong> Coming in on an empty stomach or dehydrated can amplify the fatigue response.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call Us If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Fatigue is severe or lasts more than a few hours.</strong> Persistent fatigue after sessions could indicate your protocol needs adjustment, or there may be another underlying factor worth investigating.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Listen to Your Body</strong>
            <p>Both fatigue and energy are normal responses. Your body is using the light to support cellular repair. The relaxation you feel is your nervous system shifting into recovery mode — which is exactly what we want.</p>
          </div>
        </div>
      </section>

      {/* ===================== HEADACHE ===================== */}
      <section className="section" id="headache">
        <div className="container">
          <div className="se-header">
            <span className="se-number">6</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> RARE</div>
              <h2 className="section-title">Headache</h2>
            </div>
          </div>
          <div className="se-freq">Uncommon — usually related to dehydration or improper eye protection</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>A mild headache during or after a session. Not common and usually related to dehydration, eye strain from not wearing goggles properly, or being sensitive to bright environments. It should not be severe. Most people who experience it describe it as a dull, mild ache that resolves within an hour.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Usually from inadequate hydration before the session, eye exposure from not wearing goggles properly, or being in a warm room without enough water. The bright light environment can also trigger mild headaches in people who are sensitive to bright settings — similar to how some people get headaches from fluorescent lighting.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Drink water before and after your session.</strong> Arrive hydrated. Have a glass of water within 30 minutes before and after treatment.
              </div>
              <div className="action-item">
                <strong>Make sure your goggles are on properly.</strong> Poorly fitting goggles allow light to leak in around the edges, which can cause eye strain that leads to headaches.
              </div>
              <div className="action-item">
                <strong>Take an OTC pain reliever if needed.</strong> Ibuprofen or acetaminophen will handle a mild post-session headache. This should not be a regular occurrence.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Recurs</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Contact us to review your protocol.</strong> Session length, distance from panels, or frequency may need adjustment. We can also check your goggle fit.
              </div>
              <div className="action-item">
                <strong>Try shorter sessions.</strong> We can reduce your session time and gradually build back up to see where your threshold is.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call Us If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Headaches are severe or persistent.</strong> A severe headache after red light therapy is not expected. We need to evaluate whether something else is going on.
              </div>
              <div className="action-item">
                <strong>You experience visual disturbances along with the headache.</strong> This combination warrants prompt evaluation.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Uncommon and Preventable</strong>
            <p>Hydration and proper eye protection prevent this for nearly everyone. If you have experienced a headache after a session, try arriving well-hydrated with a properly fitted pair of goggles — that alone fixes the issue in most cases.</p>
          </div>
        </div>
      </section>

      {/* ===================== WHEN TO CONTACT ===================== */}
      <section className="section section-dark">
        <div className="container">
          <div className="v2-label" style={{ color: 'rgba(255,255,255,0.6)' }}><span className="v2-dot" style={{ background: 'rgba(255,255,255,0.6)' }} /> IMPORTANT</div>
          <h2 className="section-title" style={{ color: '#fff' }}>When to Contact Us</h2>
          <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>Red light therapy side effects are rare and mild. But we want you to know exactly when to reach out.</p>

          <div className="contact-grid">
            <div className="contact-card urgent">
              <h4>Call Us Right Away</h4>
              <ul>
                <li>Skin burns, blistering, or prolonged redness (extremely rare — indicates equipment issue)</li>
                <li>Persistent vision changes after a session</li>
                <li>Any allergic-type reaction (hives, swelling, difficulty breathing)</li>
              </ul>
            </div>
            <div className="contact-card routine">
              <h4>Schedule a Check-In</h4>
              <ul>
                <li>Recurring headaches after sessions</li>
                <li>Skin dryness that is not improving with moisturizer</li>
                <li>Questions about your protocol</li>
                <li>Want to adjust session length or frequency</li>
              </ul>
            </div>
          </div>

          <div className="disclaimer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', marginTop: '1.5rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}><strong style={{ color: 'rgba(255,255,255,0.9)' }}>Medication Note:</strong> If you are taking any photosensitizing medications — certain antibiotics, retinoids, or other medications that increase light sensitivity — tell us before starting red light therapy. These can make your skin more reactive to light and may require protocol adjustments.</p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="section">
        <div className="container">
          <div className="disclaimer">
            <p><strong>Important:</strong> This guide is for Range Medical patients receiving red light therapy (photobiomodulation). It is not a substitute for personalized medical advice. All sessions are supervised by trained staff. If you are experiencing any unexpected reaction, contact us immediately.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Questions? We Are Here.</h2>
          <p>Whether you want to adjust your protocol, have questions about what you experienced during a session, or just want to talk through something — our team can help.</p>
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
