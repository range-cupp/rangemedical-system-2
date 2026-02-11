import Head from 'next/head';
import { useEffect } from 'react';

export default function ClinicTV() {
  useEffect(() => {
    const slides = document.querySelectorAll('.slide');
    const ctaStrip = document.getElementById('cta-strip');
    const ctaText = document.getElementById('cta-text');
    const ctaRight = document.getElementById('cta-right');
    const progressBar = document.getElementById('progress-bar');
    const dotsContainer = document.getElementById('seg-dots');

    const ctaMap = {
      '1': { t: 'Ask the front desk about the <strong>Range Assessment</strong>.', r: 'RANGE MEDICAL' },
      '2': { t: '<strong>Range Assessment</strong> \u00B7 starting at $350. Ask the front desk which panel fits you.', r: 'NO COMMITMENT REQUIRED' },
      '3': { t: 'Ask the front desk if an IV is right for you.', r: 'IV THERAPY AT RANGE' },
      '3m': { t: 'Ask about our <strong>IV Maintenance Membership</strong> \u00B7 one IV every 4 weeks + perks.', r: 'MEMBERSHIP AVAILABLE' },
      '4': { t: 'Ask the front desk about the <strong>Cellular Energy Reset</strong> \u2014 a 6-week program.', r: 'HBOT + RED LIGHT' },
      '4b': { t: '<strong>Cellular Energy Reset</strong> \u00B7 $3,999 for 36 sessions. Ask the front desk for details.', r: '6-WEEK PROGRAM' },
      '5': { t: 'Real patients. Real results. Ask about the <strong>Range Assessment</strong>.', r: 'RANGE MEDICAL' },
      '6': { t: 'Tell the front desk: <strong>\u201CI\u2019d like to schedule my Range Assessment.\u201D</strong>', r: '(949) 997-3988' }
    };

    const slideCTAKeys = [
      '1','1','1',
      '2','2','2','2',
      '3','3','3m',
      '4','4','4b',
      '5','5','5','5',
      '6'
    ];

    // Build dots (now 6 segments)
    for (let i = 1; i <= 6; i++) {
      const dot = document.createElement('div');
      dot.className = 'seg-dot';
      dot.setAttribute('data-seg', String(i));
      dotsContainer.appendChild(dot);
    }
    const dots = dotsContainer.querySelectorAll('.seg-dot');

    let current = 0;
    let timer = null;

    function resetFC(slide) {
      slide.querySelectorAll('.fc').forEach(c => {
        c.style.animation = 'none';
        void c.offsetHeight;
        c.style.animation = '';
        c.style.opacity = '0';
        c.style.transform = 'translateY(12px)';
      });
    }

    function activateFC(slide) {
      slide.querySelectorAll('.fc').forEach(c => {
        c.style.opacity = '';
        c.style.transform = '';
      });
    }

    function showSlide(idx) {
      slides.forEach(s => { s.classList.remove('active'); resetFC(s); });
      ctaStrip.classList.remove('active');

      const slide = slides[idx];
      slide.classList.add('active');
      activateFC(slide);

      const key = slideCTAKeys[idx];
      const cta = ctaMap[key];
      if (cta) {
        ctaText.innerHTML = cta.t;
        ctaRight.textContent = cta.r;
        setTimeout(() => ctaStrip.classList.add('active'), 200);
      }

      const seg = slide.getAttribute('data-segment');
      dots.forEach(d => {
        d.classList.toggle('active', d.getAttribute('data-seg') === seg);
      });

      const dur = parseInt(slide.getAttribute('data-duration')) || 7000;
      progressBar.style.transition = 'none';
      progressBar.style.width = '0%';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          progressBar.style.transition = 'width ' + dur + 'ms linear';
          progressBar.style.width = '100%';
        });
      });

      clearTimeout(timer);
      timer = setTimeout(() => {
        current = (current + 1) % slides.length;
        showSlide(current);
      }, dur);
    }

    showSlide(0);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Head>
        <title>Range Medical – In-Clinic Display</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        body { margin: 0; padding: 0; overflow: hidden; }

        :root {
          --color-primary: #000000;
          --color-bg: #ffffff;
          --color-bg-alt: #fafafa;
          --color-text: #171717;
          --color-text-body: #525252;
          --color-text-muted: #737373;
          --color-border: #e5e5e5;
          --radius-sm: 6px;
          --radius-lg: 12px;
          --shadow-sm: 0 4px 20px rgba(0,0,0,0.06);
        }

        #vsl {
          width: 100vw; height: 100vh;
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: var(--color-bg); color: var(--color-text);
        }

        .header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 48px; border-bottom: 1px solid var(--color-border);
          background: var(--color-bg); z-index: 20; flex-shrink: 0; height: 80px;
        }
        .header-logo img { height: 50px; width: auto; display: block; }
        .header-right { display: flex; align-items: center; gap: 32px; }
        .header-phone { font-size: 0.9375rem; font-weight: 600; color: var(--color-text); }
        .header-badge { display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; font-weight: 500; color: var(--color-text-muted); }
        .header-badge .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; flex-shrink: 0; }

        .slide-area { flex: 1; position: relative; overflow: hidden; min-height: 0; }

        .slide {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; justify-content: center; align-items: center;
          padding: 40px 80px;
          opacity: 0; transform: translateY(8px);
          transition: opacity 0.7s ease, transform 0.7s ease;
          pointer-events: none; overflow: hidden;
        }
        .slide.active { opacity: 1; transform: translateY(0); pointer-events: auto; }

        .slide-bg-white { background: var(--color-bg); }
        .slide-bg-alt { background: var(--color-bg-alt); }
        .slide-bg-dark { background: var(--color-primary); color: #ffffff; }
        .slide-bg-dark .kicker { color: rgba(255,255,255,0.5); }
        .slide-bg-dark .body-text { color: rgba(255,255,255,0.7); }
        .slide-bg-dark .body-text strong { color: #ffffff; }
        .slide-bg-dark .small-note { color: rgba(255,255,255,0.4); }
        .slide-bg-dark .headline { color: #ffffff; }
        .slide-bg-dark .headline em { text-decoration-color: #ffffff; }
        .slide-bg-dark .big-statement { color: #ffffff; }
        .slide-bg-dark .step-badge { background: #ffffff; color: var(--color-primary); }
        .slide-bg-dark .step-text { color: #ffffff; }
        .slide-bg-dark .divider { background: rgba(255,255,255,0.2); }
        .slide-bg-dark .benefit-list li { color: rgba(255,255,255,0.8); }
        .slide-bg-dark .benefit-list li::before { color: #ffffff; }
        .slide-bg-dark .pricing-label { color: rgba(255,255,255,0.7); }
        .slide-bg-dark .pricing-amount { color: #ffffff; }
        .slide-bg-dark .pricing-kicker { color: rgba(255,255,255,0.5); }
        .slide-bg-dark .pricing-card { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.15); box-shadow: none; }
        .slide-bg-dark .pricing-divider { background: rgba(255,255,255,0.1); }

        .kicker { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-text-muted); margin-bottom: 16px; }
        .headline { font-size: clamp(2.25rem, 4.5vw, 3.5rem); font-weight: 700; line-height: 1.15; letter-spacing: -0.02em; text-align: center; color: var(--color-text); max-width: 860px; }
        .headline em { font-style: normal; text-decoration: underline; text-decoration-color: var(--color-primary); text-underline-offset: 6px; text-decoration-thickness: 3px; }
        .body-text { font-size: clamp(1.0625rem, 1.8vw, 1.375rem); font-weight: 400; line-height: 1.65; text-align: center; color: var(--color-text-body); max-width: 680px; margin-top: 18px; }
        .body-text strong { font-weight: 700; color: var(--color-text); }
        .big-statement { font-size: clamp(1.5rem, 3vw, 2.5rem); font-weight: 700; line-height: 1.3; letter-spacing: -0.02em; text-align: center; color: var(--color-text); max-width: 800px; }
        .small-note { font-size: 0.875rem; font-weight: 400; color: var(--color-text-muted); margin-top: 10px; }

        .step-badge { display: inline-flex; align-items: center; justify-content: center; background: var(--color-primary); color: #ffffff; font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.05em; padding: 6px 20px; border-radius: var(--radius-sm); margin-bottom: 18px; }
        .step-text { font-size: clamp(1.375rem, 2.5vw, 2.25rem); font-weight: 600; line-height: 1.35; letter-spacing: -0.01em; text-align: center; color: var(--color-text); max-width: 700px; }
        .divider { width: 48px; height: 2px; background: var(--color-border); margin: 20px auto; }

        .benefit-list { list-style: none; margin-top: 24px; text-align: left; padding: 0; }
        .benefit-list li { font-size: clamp(1rem, 1.6vw, 1.25rem); font-weight: 400; color: var(--color-text-body); padding: 8px 0 8px 28px; position: relative; line-height: 1.6; }
        .benefit-list li::before { content: '\u2713'; position: absolute; left: 0; font-weight: 700; color: var(--color-primary); }

        .pricing-card { border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 32px 48px; margin-top: 24px; text-align: center; box-shadow: var(--shadow-sm); background: var(--color-bg); }
        .pricing-row { display: flex; align-items: baseline; justify-content: center; gap: 16px; margin: 8px 0; }
        .pricing-label { font-size: clamp(0.9375rem, 1.4vw, 1.125rem); font-weight: 500; color: var(--color-text-body); }
        .pricing-amount { font-size: clamp(1.5rem, 2.5vw, 2.25rem); font-weight: 700; color: var(--color-text); letter-spacing: -0.02em; }
        .pricing-divider { width: 100%; height: 1px; background: var(--color-border); margin: 10px 0; }
        .pricing-kicker { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-text-muted); margin-bottom: 16px; }

        .proof-card { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 36px 44px; max-width: 680px; text-align: left; box-shadow: var(--shadow-sm); }
        .proof-quote { font-size: clamp(1.0625rem, 1.6vw, 1.3125rem); font-weight: 400; font-style: italic; line-height: 1.7; color: var(--color-text-body); }
        .proof-attribution { font-size: 0.8125rem; font-weight: 600; color: var(--color-text); margin-top: 16px; text-transform: uppercase; letter-spacing: 0.05em; }
        .stars { color: var(--color-text); font-size: clamp(1.25rem, 2vw, 1.75rem); letter-spacing: 4px; margin-bottom: 12px; }

        .stat-row { display: flex; gap: 40px; margin-top: 28px; text-align: center; }
        .stat-item {}
        .stat-number { font-size: clamp(2rem, 3.5vw, 3rem); font-weight: 700; color: var(--color-text); letter-spacing: -0.02em; }
        .slide-bg-dark .stat-number { color: #ffffff; }
        .stat-label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        .slide-bg-dark .stat-label { color: rgba(255,255,255,0.5); }

        .cta-strip { flex-shrink: 0; background: var(--color-primary); color: #ffffff; padding: 16px 48px; display: flex; align-items: center; justify-content: space-between; z-index: 20; height: 56px; opacity: 0; transform: translateY(100%); transition: opacity 0.5s ease 0.3s, transform 0.5s ease 0.3s; }
        .cta-strip.active { opacity: 1; transform: translateY(0); }
        .cta-left { font-size: 0.9375rem; font-weight: 500; color: #ffffff; line-height: 1.4; }
        .cta-left strong { font-weight: 700; }
        .cta-right { font-size: 0.75rem; font-weight: 500; color: rgba(255,255,255,0.5); letter-spacing: 0.05em; text-transform: uppercase; flex-shrink: 0; }

        .progress-bar { height: 3px; background: var(--color-primary); z-index: 25; transition: width 0.3s linear; flex-shrink: 0; }

        .segment-dots { position: absolute; top: 50%; right: 28px; transform: translateY(-50%); z-index: 15; display: flex; flex-direction: column; gap: 10px; }
        .seg-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--color-border); transition: all 0.4s ease; }
        .seg-dot.active { background: var(--color-primary); transform: scale(1.6); }

        .slide.active .fc { animation: fadeUp 0.6s ease forwards; }
        .slide.active .fc:nth-child(1) { animation-delay: 0.05s; }
        .slide.active .fc:nth-child(2) { animation-delay: 0.25s; }
        .slide.active .fc:nth-child(3) { animation-delay: 0.45s; }
        .slide.active .fc:nth-child(4) { animation-delay: 0.65s; }
        .slide.active .fc:nth-child(5) { animation-delay: 0.85s; }
        .fc { opacity: 0; transform: translateY(12px); }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes subtlePulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        .pulse-subtle { animation: subtlePulse 3s ease-in-out infinite; }
      `}</style>

      <div id="vsl">
        <div className="header">
          <div className="header-logo">
            <img src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" alt="Range Medical" />
          </div>
          <div className="header-right">
            <div className="header-badge"><span className="dot"></span> Newport Beach, CA</div>
            <div className="header-phone">(949) 997-3988</div>
          </div>
        </div>

        <div className="slide-area">
          <div className="segment-dots" id="seg-dots"></div>

          {/* ══════════════════════════════════════════ */}
          {/* SEGMENT 1: PROBLEM PATTERN                */}
          {/* ══════════════════════════════════════════ */}

          <div className="slide slide-bg-white" data-segment="1" data-duration="7000">
            <div className="kicker fc">If this sounds like you</div>
            <div className="headline fc">Tired, foggy, or not feeling<br/>like <em>yourself</em>?</div>
            <div className="body-text fc">You&apos;re not imagining it. Something is off — and a standard checkup probably won&apos;t catch it.</div>
          </div>

          <div className="slide slide-bg-alt" data-segment="1" data-duration="7000">
            <div className="headline fc">Slow recovery from<br/>workouts or injuries?</div>
            <div className="body-text fc">Your body has the capacity to recover faster.<br/>We find what&apos;s slowing it down.</div>
          </div>

          <div className="slide slide-bg-white" data-segment="1" data-duration="8000">
            <div className="big-statement fc">Told &ldquo;your labs are fine&rdquo;…<br/>but you don&apos;t feel fine?</div>
            <div className="divider fc"></div>
            <div className="body-text fc"><strong>Range Medical:</strong> We find what your labs<br/>and symptoms are really telling you.</div>
          </div>

          {/* ══════════════════════════════════════════ */}
          {/* SEGMENT 2: HOW OUR PROCESS WORKS           */}
          {/* ══════════════════════════════════════════ */}

          <div className="slide slide-bg-white" data-segment="2" data-duration="7000">
            <div className="kicker fc">How Our Process Works</div>
            <div className="step-badge fc">STEP 1</div>
            <div className="step-text fc">Detailed lab work.<br/>Essential Panel or Elite Panel.</div>
            <div className="small-note fc">More than what your regular doctor orders.</div>
          </div>

          <div className="slide slide-bg-alt" data-segment="2" data-duration="7000">
            <div className="step-badge fc">STEP 2</div>
            <div className="step-text fc">We match your labs with<br/>how you actually feel.</div>
            <div className="small-note fc">Symptoms + numbers = the real picture.</div>
          </div>

          <div className="slide slide-bg-white" data-segment="2" data-duration="7000">
            <div className="step-badge fc">STEP 3</div>
            <div className="step-text fc">You get a simple written plan:<br/>energy, hormones, recovery, IVs.</div>
            <div className="small-note fc">Clear. Actionable. Yours to keep.</div>
          </div>

          <div className="slide slide-bg-dark" data-segment="2" data-duration="8000">
            <div className="headline fc">No long-term commitment<br/>required to start.</div>
            <div className="body-text fc">Just labs, a plan, and answers.</div>
          </div>

          {/* ══════════════════════════════════════════ */}
          {/* SEGMENT 3: IV THERAPY                      */}
          {/* ══════════════════════════════════════════ */}

          <div className="slide slide-bg-white" data-segment="3" data-duration="8000">
            <div className="kicker fc">IV Therapy at Range</div>
            <div className="headline fc">What IV therapy<br/>does here</div>
            <div className="body-text fc">Vitamins and nutrients delivered <strong>directly into your bloodstream</strong> — so your body can actually use them.</div>
          </div>

          <div className="slide slide-bg-alt" data-segment="3" data-duration="9000">
            <div className="big-statement fc">Many patients use<br/>IV therapy for:</div>
            <ul className="benefit-list fc">
              <li>Energy &amp; daily performance</li>
              <li>Immune system support</li>
              <li>Faster recovery</li>
              <li>Hydration &amp; wellness</li>
            </ul>
            <div className="small-note fc">Our Range IV includes your choice of 5 vitamins/minerals.</div>
          </div>

          <div className="slide slide-bg-dark" data-segment="3" data-duration="9000">
            <div className="headline fc">Love how you feel<br/>after IVs?</div>
            <div className="divider fc"></div>
            <div className="body-text fc">Ask about our <strong>IV Maintenance Membership</strong>:<br/>one IV every 4 weeks with perks.</div>
            <div className="small-note fc">Easy maintenance. No guesswork.</div>
          </div>

          {/* ══════════════════════════════════════════ */}
          {/* SEGMENT 4: CELLULAR ENERGY RESET           */}
          {/* ══════════════════════════════════════════ */}

          <div className="slide slide-bg-white" data-segment="4" data-duration="8000">
            <div className="kicker fc">Featured Program</div>
            <div className="headline fc">Cellular Energy Reset</div>
            <div className="body-text fc">A structured <strong>6-week protocol</strong> combining Hyperbaric Oxygen and Red Light Therapy to restore energy at the cellular level.</div>
          </div>

          <div className="slide slide-bg-alt" data-segment="4" data-duration="9000">
            <div className="big-statement fc">Built for people who:</div>
            <ul className="benefit-list fc">
              <li>Wake up tired after 8 hours of sleep</li>
              <li>Hit an afternoon wall every day</li>
              <li>Have labs that look &ldquo;normal&rdquo; but feel off</li>
              <li>Want a structured plan — not guesswork</li>
            </ul>
          </div>

          <div className="slide slide-bg-dark" data-segment="4" data-duration="10000">
            <div className="kicker fc">What&apos;s Included</div>
            <div className="headline fc">36 sessions. 6 weeks.<br/>One clear goal.</div>
            <div className="stat-row fc">
              <div className="stat-item">
                <div className="stat-number">18</div>
                <div className="stat-label">HBOT Sessions</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">18</div>
                <div className="stat-label">Red Light Sessions</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">2</div>
                <div className="stat-label">Provider Consults</div>
              </div>
            </div>
            <div className="small-note fc" style={{marginTop: '20px'}}>Ask the front desk about the Cellular Energy Reset — $3,999</div>
          </div>

          {/* ══════════════════════════════════════════ */}
          {/* SEGMENT 5: SOCIAL PROOF                    */}
          {/* ══════════════════════════════════════════ */}

          <div className="slide slide-bg-white" data-segment="5" data-duration="9000">
            <div className="kicker fc">What Our Patients Say</div>
            <div className="proof-card fc">
              <div className="proof-quote">&ldquo;I was skeptical, but after the Assessment I finally understood why I&apos;d been so tired. Six weeks later I feel like myself again.&rdquo;</div>
              <div className="proof-attribution">— Sarah M., Newport Beach</div>
            </div>
          </div>

          <div className="slide slide-bg-alt" data-segment="5" data-duration="9000">
            <div className="kicker fc">What Our Patients Say</div>
            <div className="proof-card fc">
              <div className="proof-quote">&ldquo;My shoulder was taking forever to heal. The recovery protocol got me back to training weeks faster than I expected.&rdquo;</div>
              <div className="proof-attribution">— Michael R., Costa Mesa</div>
            </div>
          </div>

          <div className="slide slide-bg-white" data-segment="5" data-duration="9000">
            <div className="kicker fc">What Our Patients Say</div>
            <div className="proof-card fc">
              <div className="proof-quote">&ldquo;Clear communication, no pressure, and a plan that actually made sense. This is what healthcare should be.&rdquo;</div>
              <div className="proof-attribution">— Jennifer K., Irvine</div>
            </div>
          </div>

          <div className="slide slide-bg-alt" data-segment="5" data-duration="9000">
            <div className="stars fc">★★★★★</div>
            <div className="big-statement fc">Patients say they feel:</div>
            <ul className="benefit-list fc">
              <li>More energy throughout the day</li>
              <li>Clearer focus and mental sharpness</li>
              <li>Better recovery from training</li>
              <li>Actually feeling like themselves again</li>
            </ul>
          </div>

          {/* ══════════════════════════════════════════ */}
          {/* SEGMENT 6: CLEAR NEXT STEP                 */}
          {/* ══════════════════════════════════════════ */}

          <div className="slide slide-bg-dark" data-segment="6" data-duration="12000">
            <div className="kicker fc">Your Next Step</div>
            <div className="headline fc">Not feeling like yourself?</div>
            <div className="body-text fc">Step 1 is simple: get real labs and a clear plan.</div>
            <div className="pricing-card fc">
              <div className="pricing-kicker">RANGE ASSESSMENT</div>
              <div className="pricing-row">
                <span className="pricing-label">Essential Panel</span>
                <span className="pricing-amount">$350</span>
              </div>
              <div className="pricing-divider"></div>
              <div className="pricing-row">
                <span className="pricing-label">Elite Panel</span>
                <span className="pricing-amount">$750</span>
              </div>
            </div>
            <div className="small-note fc pulse-subtle" style={{marginTop: '20px'}}>Already love IVs? Ask about our IV Maintenance Membership.</div>
          </div>

        </div>

        <div className="progress-bar" id="progress-bar"></div>
        <div className="cta-strip" id="cta-strip">
          <div className="cta-left" id="cta-text"></div>
          <div className="cta-right" id="cta-right"></div>
        </div>
      </div>
    </>
  );
}
