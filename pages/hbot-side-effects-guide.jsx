import Layout from '../components/Layout';
import Head from 'next/head';
import { useState } from 'react';

export default function HBOTSideEffectsGuide() {
  const [openSection, setOpenSection] = useState(null);

  const toggle = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <Layout
      title="HBOT Side Effects Guide | Range Medical"
      description="Complete guide to hyperbaric oxygen therapy side effects. Ear pressure, vision changes, fatigue, and more — what to expect and what to do. Range Medical, Newport Beach. (949) 997-3988"
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "HBOT Side Effects Guide",
              "description": "Complete guide to hyperbaric oxygen therapy side effects. Ear pressure, vision changes, fatigue, and more — what to expect and what to do.",
              "url": "https://www.range-medical.com/hbot-side-effects-guide",
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
          <h1>HBOT<br/>SIDE EFFECTS</h1>
          <div className="hero-rule" />
          <p className="hero-sub">Every side effect explained in plain English. What it feels like, why it happens, and exactly what to do about it — step by step.</p>
        </div>
      </section>

      {/* Overview */}
      <section className="section">
        <div className="container">
          <div className="v2-label"><span className="v2-dot" /> THE BIG PICTURE</div>
          <h2 className="section-title">What to Expect</h2>
          <p className="section-subtitle">HBOT puts you in a pressurized chamber with pure oxygen at 2.0 ATA. The increased pressure and oxygen concentration is what makes it therapeutic — but it also means your body experiences conditions it is not used to.</p>
          <p className="body-text">Most side effects are mild, happen during the session, and resolve quickly. Your technician monitors you throughout.</p>

          <div className="nav-grid">
            <a href="#ear-pressure" className="nav-card">
              <span className="nav-icon">1</span>
              <div>
                <strong>Ear Pressure</strong>
                <p>Pressure in your ears during pressurization.</p>
              </div>
            </a>
            <a href="#sinus-pressure" className="nav-card">
              <span className="nav-icon">2</span>
              <div>
                <strong>Sinus Pressure</strong>
                <p>Pain in forehead, cheeks, or behind eyes.</p>
              </div>
            </a>
            <a href="#vision-changes" className="nav-card">
              <span className="nav-icon">3</span>
              <div>
                <strong>Vision Changes</strong>
                <p>Temporary shift in near/distance vision.</p>
              </div>
            </a>
            <a href="#fatigue" className="nav-card">
              <span className="nav-icon">4</span>
              <div>
                <strong>Fatigue</strong>
                <p>Feeling tired after sessions as your body heals.</p>
              </div>
            </a>
            <a href="#lightheadedness" className="nav-card">
              <span className="nav-icon">5</span>
              <div>
                <strong>Lightheadedness</strong>
                <p>Brief dizziness when the chamber depressurizes.</p>
              </div>
            </a>
            <a href="#headache" className="nav-card">
              <span className="nav-icon">6</span>
              <div>
                <strong>Mild Headache</strong>
                <p>Dull headache during or after a session.</p>
              </div>
            </a>
            <a href="#claustrophobia" className="nav-card">
              <span className="nav-icon">7</span>
              <div>
                <strong>Claustrophobia</strong>
                <p>Anxiety or panic inside the chamber.</p>
              </div>
            </a>
            <a href="#tooth-pain" className="nav-card">
              <span className="nav-icon">8</span>
              <div>
                <strong>Tooth Pain</strong>
                <p>Sharp tooth pain during pressure changes.</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ===================== EAR PRESSURE ===================== */}
      <section className="section section-gray" id="ear-pressure">
        <div className="container">
          <div className="se-header">
            <span className="se-number">1</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> MOST COMMON</div>
              <h2 className="section-title">Ear Pressure & Discomfort</h2>
            </div>
          </div>
          <div className="se-freq">Nearly everyone feels this, especially during their first few sessions</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Pressure in your ears during the first few minutes as the chamber pressurizes. Like descending in an airplane, but more gradual. Can range from mild pressure to actual pain if you do not equalize.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>As pressure increases inside the chamber, the air pressure pushes on your eardrum from outside. The Eustachian tube — connecting your middle ear to your throat — needs to let air in to equalize the pressure on both sides of the eardrum.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Swallow frequently</strong> during pressurization. This opens your Eustachian tubes naturally.
              </div>
              <div className="action-item">
                <strong>Yawn or wiggle your jaw.</strong> Both help open the passages that equalize ear pressure.
              </div>
              <div className="action-item">
                <strong>Valsalva maneuver:</strong> Gently pinch your nose and blow. You should feel a soft pop as your ears equalize. Do this repeatedly during pressurization.
              </div>
              <div className="action-item">
                <strong>Chew gum</strong> during the session. The chewing motion keeps your Eustachian tubes active.
              </div>
              <div className="action-item">
                <strong>Tell your technician to slow the pressurization</strong> if you need more time to equalize. The rate can always be adjusted.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Hurts</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Tell your technician immediately.</strong> They will stop or slow pressurization right away. Never "push through" ear pain.
              </div>
              <div className="action-item">
                <strong>The pressurization rate can always be adjusted.</strong> There is no fixed speed — your comfort determines the pace.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Do Not Do HBOT If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>You have an active ear infection,</strong> severe congestion, or recent ear surgery. Tell us before your session if you are congested or have a cold.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Gets Easier Every Session</strong>
            <p>Your ears learn to equalize faster with practice. Most people have zero ear issues by their 3rd or 4th session.</p>
          </div>
        </div>
      </section>

      {/* ===================== SINUS PRESSURE ===================== */}
      <section className="section" id="sinus-pressure">
        <div className="container">
          <div className="se-header">
            <span className="se-number">2</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Sinus Pressure</h2>
            </div>
          </div>
          <div className="se-freq">Common, especially if you have any congestion</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Pressure or pain in your forehead, cheeks, or behind your eyes during pressurization. Like a sinus headache.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Same mechanism as ear pressure — the sinuses are air-filled cavities in your skull. If they cannot equalize pressure (especially if you have any congestion), the pressure difference causes pain.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Take a decongestant (pseudoephedrine/Sudafed)</strong> 30-60 minutes before your session. This opens your sinus passages so they can equalize pressure.
              </div>
              <div className="action-item">
                <strong>Use nasal spray (oxymetazoline/Afrin)</strong> 15 minutes before your session. This directly opens your nasal and sinus passages.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If It Hurts</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Tell your technician to slow or pause pressurization.</strong> Like ear equalization, sinus equalization works better with more time.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Do Not Do HBOT If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>You have a sinus infection or severe nasal congestion.</strong> Reschedule until it clears. Trying to pressurize with blocked sinuses is painful and counterproductive.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Preventable</strong>
            <p>A pre-session decongestant eliminates this for the vast majority of people. Once you know your sinuses need the prep, it becomes routine.</p>
          </div>
        </div>
      </section>

      {/* ===================== VISION CHANGES ===================== */}
      <section className="section section-gray" id="vision-changes">
        <div className="container">
          <div className="se-header">
            <span className="se-number">3</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Temporary Vision Changes</h2>
            </div>
          </div>
          <div className="se-freq">Common with repeated sessions, usually noticed after 10+ sessions</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>After multiple sessions (usually 10+), you may notice your near vision gets slightly better and distance vision gets slightly blurrier. Like a mild prescription change.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Prolonged oxygen exposure temporarily changes the shape of your eye lens — it becomes slightly more rounded. This shifts your focal point. It is a well-documented, reversible effect of hyperbaric oxygen.</p>
          </div>

          <h3 className="steps-header">What to Know</h3>
          <div className="tier-card">
            <div className="tier-label green">This Is Temporary</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Vision reverses within 2-8 weeks</strong> after completing your HBOT series. This is documented in every HBOT textbook.
              </div>
              <div className="action-item">
                <strong>Do NOT get a new eyeglass prescription</strong> during or immediately after an HBOT protocol. Wait until your vision returns to baseline.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label orange">Call Us If</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Sudden vision loss, severe blurriness, flashing lights, or new floaters.</strong> These are not normal HBOT effects and need immediate evaluation.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>100% Reversible</strong>
            <p>Vision returns to baseline after completing the HBOT series. This is documented in every HBOT textbook and is not a concern.</p>
          </div>
        </div>
      </section>

      {/* ===================== FATIGUE ===================== */}
      <section className="section" id="fatigue">
        <div className="container">
          <div className="se-header">
            <span className="se-number">4</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> COMMON</div>
              <h2 className="section-title">Fatigue After Sessions</h2>
            </div>
          </div>
          <div className="se-freq">Common, especially in the first 5-10 sessions</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Feeling tired or unusually sleepy after your session, sometimes for the rest of the day. Some describe it as a "good tired" like after a workout.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Your body is doing significant repair work with all that extra oxygen. Stem cell mobilization, angiogenesis (new blood vessel growth), and inflammation reduction all take energy. Your body is using the oxygen to heal — and that healing process is physically demanding.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Plan sessions so you can rest afterward</strong> if needed. Especially for your first few sessions, do not schedule anything demanding right after.
              </div>
              <div className="action-item">
                <strong>Eat a good meal before your session.</strong> Going in on an empty stomach makes fatigue worse.
              </div>
              <div className="action-item">
                <strong>Stay hydrated.</strong> Dehydration amplifies fatigue. Drink water before and after your session.
              </div>
              <div className="action-item">
                <strong>Light activity is fine</strong> but skip intense workouts on HBOT days. Let your body use that energy for healing.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Your Body Is Healing</strong>
            <p>Fatigue is actually a positive indicator that the therapy is activating repair processes. Most people feel increasingly energized as their protocol progresses.</p>
          </div>
        </div>
      </section>

      {/* ===================== LIGHTHEADEDNESS ===================== */}
      <section className="section section-gray" id="lightheadedness">
        <div className="container">
          <div className="se-header">
            <span className="se-number">5</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> LESS COMMON</div>
              <h2 className="section-title">Lightheadedness</h2>
            </div>
          </div>
          <div className="se-freq">Less common — usually brief and happens at the end of a session</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Brief feeling of dizziness or lightheadedness when the chamber depressurizes at the end of the session, or when standing up to exit. Similar to standing up too quickly.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>The shift from high-pressure oxygen back to normal atmospheric pressure briefly affects blood flow and oxygen delivery to your brain. Your body needs a moment to recalibrate.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Sit up slowly</strong> when the chamber opens. Take a moment before standing.
              </div>
              <div className="action-item">
                <strong>Drink water and eat something</strong> after your session. This helps stabilize blood pressure and blood sugar.
              </div>
              <div className="action-item">
                <strong>If it persists, stay seated</strong> and tell your technician. There is no rush to leave the chamber area.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Brief and Normal</strong>
            <p>Lasts less than a minute for most people. If it persists, stay seated and tell your technician.</p>
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
              <h2 className="section-title">Mild Headache</h2>
            </div>
          </div>
          <div className="se-freq">Less common — usually related to sinus pressure, dehydration, or skipping meals</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Dull headache during or after a session. Not severe but noticeable.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>Can be from sinus pressure (see above), mild oxygen sensitivity, or dehydration. Skipping meals before sessions makes this more likely.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Eat before your session.</strong> Going in on an empty stomach is a common headache trigger.
              </div>
              <div className="action-item">
                <strong>Stay hydrated.</strong> Dehydration is the other common trigger. Drink water before and during your session.
              </div>
              <div className="action-item">
                <strong>Pre-treat with a decongestant</strong> if sinuses are the cause. See the Sinus Pressure section above.
              </div>
              <div className="action-item">
                <strong>OTC pain reliever</strong> (ibuprofen or acetaminophen) if needed after your session.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If Recurring</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Contact us.</strong> We may adjust session duration or pressure to find a more comfortable protocol for you.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Usually Preventable</strong>
            <p>Hydration + food + sinus prep eliminates this for most people. Once you identify your trigger, headaches rarely come back.</p>
          </div>
        </div>
      </section>

      {/* ===================== CLAUSTROPHOBIA ===================== */}
      <section className="section section-gray" id="claustrophobia">
        <div className="container">
          <div className="se-header">
            <span className="se-number">7</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> LESS COMMON</div>
              <h2 className="section-title">Claustrophobia</h2>
            </div>
          </div>
          <div className="se-freq">Less common but important — some people feel anxious in enclosed spaces</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Feeling anxious, trapped, or panicky inside the chamber. May feel worse during pressurization when you cannot immediately exit.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>The chamber is an enclosed space. Some people have a natural anxiety response to enclosed environments. The inability to immediately leave adds to the feeling.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">Try First</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Tour the chamber before your first session.</strong> Seeing it and understanding how it works reduces anxiety significantly.
              </div>
              <div className="action-item">
                <strong>Bring your phone or a tablet</strong> to watch during the session. Distraction is one of the most effective tools for managing claustrophobia.
              </div>
              <div className="action-item">
                <strong>Practice deep breathing.</strong> Slow, controlled breaths calm your nervous system. Breathe in for 4 counts, hold for 4, out for 4.
              </div>
              <div className="action-item">
                <strong>Know that you CAN communicate with your technician at all times</strong> and the session CAN be stopped. The chamber has a clear window.
              </div>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-label yellow">If Significant</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>We can do a short "practice session" at lower pressure.</strong> This lets you get comfortable with the chamber without committing to a full 60-minute session.
              </div>
              <div className="action-item">
                <strong>Some patients benefit from a mild anti-anxiety medication</strong> before their first few sessions. Ask your provider if this is right for you.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>You Are Always in Control</strong>
            <p>You can communicate with your technician at any time. The session can be stopped and the chamber depressurized at your request. You are never locked in.</p>
          </div>
        </div>
      </section>

      {/* ===================== TOOTH PAIN ===================== */}
      <section className="section" id="tooth-pain">
        <div className="container">
          <div className="se-header">
            <span className="se-number">8</span>
            <div>
              <div className="v2-label"><span className="v2-dot" /> RARE</div>
              <h2 className="section-title">Tooth Pain</h2>
            </div>
          </div>
          <div className="se-freq">Rare — only happens if you have an existing dental issue</div>

          <div className="what-box">
            <h3>What It Feels Like</h3>
            <p>Sharp pain in a tooth during pressurization or depressurization. It can be sudden and intense.</p>
          </div>

          <div className="why-box">
            <h3>Why It Happens</h3>
            <p>If you have a cavity, cracked tooth, or recent dental work with an air pocket, the pressure change can push on that trapped air and cause pain. Same mechanism as "barodontalgia" that scuba divers experience.</p>
          </div>

          <h3 className="steps-header">What to Do</h3>
          <div className="tier-card">
            <div className="tier-label green">What To Do</div>
            <div className="tier-body">
              <div className="action-item">
                <strong>Tell your technician immediately.</strong> They can adjust the pressurization rate or stop the session if needed.
              </div>
              <div className="action-item">
                <strong>See a dentist before continuing HBOT sessions</strong> to address the underlying dental issue causing the pain.
              </div>
            </div>
          </div>

          <div className="reassure-box">
            <strong>Signals a Dental Issue</strong>
            <p>HBOT did not cause the problem, it revealed it. Fixing the dental issue resolves the pain completely.</p>
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
                <li>Ear pain that does not resolve after the session</li>
                <li>Sudden vision changes (not the gradual kind)</li>
                <li>Persistent severe headache</li>
                <li>Chest pain or difficulty breathing</li>
                <li>Any seizure-like symptoms (extremely rare at 2.0 ATA but worth knowing)</li>
              </ul>
            </div>
            <div className="contact-card routine">
              <h4>Schedule a Check-In</h4>
              <ul>
                <li>Fatigue that is affecting your daily life</li>
                <li>Recurring headaches after sessions</li>
                <li>Anxiety that is preventing you from completing sessions</li>
                <li>Questions about your protocol or timeline</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="section">
        <div className="container">
          <div className="disclaimer">
            <p><strong>Important:</strong> This guide is for Range Medical patients receiving hyperbaric oxygen therapy. Sessions at 2.0 ATA, 60 minutes. Not a substitute for personalized medical advice. All sessions are monitored by trained technicians. Individual responses vary.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Questions? We Are Here.</h2>
          <p>Whether you need a session adjustment, have concerns about a side effect, or just want to talk through what you are experiencing — our team can help.</p>
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
