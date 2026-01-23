import Layout from '../../components/Layout';
import Head from 'next/head';

export default function CellularEnergySalesScript() {
  return (
    <Layout>
      <Head>
        <title>Cellular Energy Sales Script | Range Medical Internal</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Header */}
      <section className="hero" style={{background: '#fef3c7', paddingBottom: '2rem'}}>
        <span className="hero-badge" style={{background: '#92400e'}}>Internal Document</span>
        <h1>Cellular Energy Consultation Script</h1>
        <p className="hero-sub" style={{color: '#92400e'}}>
          For Range Medical staff only. Do not share externally.
        </p>
      </section>

      {/* Quick Reference Card */}
      <section className="section">
        <div className="container">
          <div style={{background: '#000', color: '#fff', borderRadius: '12px', padding: '2rem', marginBottom: '2rem'}}>
            <h2 style={{color: '#fff', marginBottom: '1.5rem', fontSize: '1.25rem'}}>💰 Quick Reference — All Offers</h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem'}}>
              <div>
                <div style={{fontSize: '0.75rem', textTransform: 'uppercase', opacity: '0.7', marginBottom: '0.25rem'}}>Step 1</div>
                <div style={{fontSize: '1.25rem', fontWeight: '700'}}>Assessment</div>
                <div style={{fontSize: '1.5rem', fontWeight: '700', color: '#4ade80'}}>$199</div>
                <div style={{fontSize: '0.8125rem', opacity: '0.8'}}>100% credited to Reset within 7 days</div>
              </div>
              <div>
                <div style={{fontSize: '0.75rem', textTransform: 'uppercase', opacity: '0.7', marginBottom: '0.25rem'}}>Step 2</div>
                <div style={{fontSize: '1.25rem', fontWeight: '700'}}>6-Week Reset</div>
                <div style={{fontSize: '1.5rem', fontWeight: '700', color: '#4ade80'}}>$3,999 PIF</div>
                <div style={{fontSize: '0.8125rem', opacity: '0.8'}}>Or 3 × $1,399 ($4,197 total)</div>
                <div style={{fontSize: '0.8125rem', opacity: '0.8', marginTop: '0.5rem'}}>+ IV Upgrade: +$999</div>
              </div>
              <div>
                <div style={{fontSize: '0.75rem', textTransform: 'uppercase', opacity: '0.7', marginBottom: '0.25rem'}}>Step 3</div>
                <div style={{fontSize: '1.25rem', fontWeight: '700'}}>Maintenance</div>
                <div style={{fontSize: '1.5rem', fontWeight: '700', color: '#4ade80'}}>$599/4wk</div>
                <div style={{fontSize: '0.8125rem', opacity: '0.8'}}>Or +IV tier: $799/4wk</div>
              </div>
            </div>
          </div>

          {/* Flow Diagram */}
          <div style={{background: '#fafafa', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', textAlign: 'center'}}>
            <h3 style={{marginBottom: '1rem'}}>Patient Flow</h3>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap'}}>
              <span style={{background: '#fff', border: '1px solid #e5e5e5', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.875rem'}}>Assessment ($199)</span>
              <span>→</span>
              <span style={{background: '#000', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.875rem'}}>Reset ($3,999)</span>
              <span style={{fontSize: '0.75rem', color: '#737373'}}>[±IV +$999]</span>
              <span>→</span>
              <span style={{background: '#fff', border: '1px solid #e5e5e5', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.875rem'}}>Maintenance ($599-799/4wk)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Phase 1: Discovery */}
      <section className="section section-gray">
        <div className="container">
          <h2 style={{marginBottom: '1.5rem'}}>Phase 1: Discovery (5-7 min)</h2>
          
          <div className="faq-item" style={{marginBottom: '1rem'}}>
            <h4>Opening</h4>
            <p style={{background: '#e0f2fe', padding: '1rem', borderRadius: '8px', fontStyle: 'italic'}}>
              "Tell me what's going on with your energy. What does a typical day look like for you right now?"
            </p>
            <p style={{marginTop: '0.75rem', fontSize: '0.875rem', color: '#525252'}}>
              <strong>Listen for:</strong> Afternoon crashes, brain fog, poor recovery, sleep issues despite adequate hours, needing caffeine to function
            </p>
          </div>

          <div className="faq-item" style={{marginBottom: '1rem'}}>
            <h4>History</h4>
            <p style={{background: '#e0f2fe', padding: '1rem', borderRadius: '8px', fontStyle: 'italic'}}>
              "What have you already tried to fix this?"
            </p>
            <p style={{marginTop: '0.75rem', fontSize: '0.875rem', color: '#525252'}}>
              <strong>Common answers:</strong> Supplements, sleep hacks, diet changes, more exercise, doctor visits where "labs were normal"
            </p>
          </div>

          <div className="faq-item">
            <h4>Timeline</h4>
            <p style={{background: '#e0f2fe', padding: '1rem', borderRadius: '8px', fontStyle: 'italic'}}>
              "How long has this been going on? And when do you need to have this solved by?"
            </p>
            <p style={{marginTop: '0.75rem', fontSize: '0.875rem', color: '#525252'}}>
              <strong>Creates urgency:</strong> Anchors their need to a timeframe
            </p>
          </div>
        </div>
      </section>

      {/* Phase 2: Education */}
      <section className="section">
        <div className="container">
          <h2 style={{marginBottom: '1.5rem'}}>Phase 2: Education (3-5 min)</h2>
          
          <div className="faq-item" style={{marginBottom: '1rem'}}>
            <h4>The Reframe</h4>
            <p style={{background: '#e0f2fe', padding: '1rem', borderRadius: '8px', fontStyle: 'italic'}}>
              "Here's what most people don't realize: the reason supplements and sleep hacks haven't worked is that they're treating symptoms, not the source. The real issue is at the cellular level—your mitochondria. These are tiny power plants in every cell that produce your energy. When they're not functioning well, no amount of B12 or coffee will fix it."
            </p>
          </div>

          <div className="faq-item">
            <h4>The Solution</h4>
            <p style={{background: '#e0f2fe', padding: '1rem', borderRadius: '8px', fontStyle: 'italic'}}>
              "What actually works is giving your mitochondria what they need: increased oxygen delivery and specific light wavelengths that stimulate energy production. That's what Hyperbaric Oxygen Therapy and Red Light Therapy do. The research is clear—this combination restores cellular function in ways supplements simply can't."
            </p>
          </div>
        </div>
      </section>

      {/* Phase 3: Assessment Offer */}
      <section className="section section-gray">
        <div className="container">
          <h2 style={{marginBottom: '1.5rem'}}>Phase 3: Assessment Offer</h2>
          
          <div className="faq-item" style={{marginBottom: '1rem'}}>
            <h4>If They Seem Uncertain</h4>
            <p style={{background: '#dcfce7', padding: '1rem', borderRadius: '8px', fontStyle: 'italic'}}>
              "Before you commit to anything, let's get objective data. Our Cellular Energy Assessment includes comprehensive labs to see exactly what's happening at the cellular level, plus you'll experience both therapies so you know what you're getting into. It's $199, and if you decide to move forward with the full Reset within 7 days, that entire amount is credited toward the program."
            </p>
          </div>

          <div className="faq-item">
            <h4>Assessment Includes</h4>
            <ul style={{marginTop: '0.5rem'}}>
              <li>Cellular Energy Lab Panel (thyroid, metabolic, nutrients, inflammation)</li>
              <li>Provider consultation with results review</li>
              <li>Red Light experience session (20 min)</li>
              <li>HBOT experience session (60 min)</li>
              <li>Personalized protocol recommendation</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Phase 4: Reset Presentation */}
      <section className="section">
        <div className="container">
          <h2 style={{marginBottom: '1.5rem'}}>Phase 4: Full Reset Presentation</h2>
          
          <div className="faq-item" style={{marginBottom: '1rem'}}>
            <h4>If They're Ready to Commit (or Post-Assessment)</h4>
            <p style={{background: '#dcfce7', padding: '1rem', borderRadius: '8px', fontStyle: 'italic'}}>
              "The 6-Week Cellular Energy Reset is our complete protocol. You'll do 18 HBOT sessions and 18 Red Light sessions—three of each per week. Plus you get provider consultations at the beginning and end, weekly check-ins, and priority scheduling."
            </p>
          </div>

          <div style={{background: '#fff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem'}}>
            <h4 style={{marginBottom: '1rem'}}>Value Stack (Read to Patient)</h4>
            <table style={{width: '100%', fontSize: '0.9375rem'}}>
              <tbody>
                <tr><td>18 HBOT Sessions (60 min each)</td><td style={{textAlign: 'right', fontWeight: '600'}}>$3,330</td></tr>
                <tr><td>18 Red Light Sessions (20 min each)</td><td style={{textAlign: 'right', fontWeight: '600'}}>$1,530</td></tr>
                <tr><td>Initial + Final Provider Consultations</td><td style={{textAlign: 'right', fontWeight: '600'}}>$400</td></tr>
                <tr><td>Weekly Progress Check-ins</td><td style={{textAlign: 'right', fontWeight: '600'}}>$300</td></tr>
                <tr><td>Priority Scheduling + Concierge</td><td style={{textAlign: 'right', fontWeight: '600'}}>$200</td></tr>
                <tr style={{borderTop: '2px solid #e5e5e5', fontWeight: '700'}}><td style={{paddingTop: '0.75rem'}}>Total Value</td><td style={{textAlign: 'right', paddingTop: '0.75rem'}}>$5,760</td></tr>
              </tbody>
            </table>
          </div>

          <div className="faq-item" style={{marginBottom: '1rem'}}>
            <h4>Price Presentation</h4>
            <p style={{background: '#dcfce7', padding: '1rem', borderRadius: '8px', fontStyle: 'italic'}}>
              "If you did all of this separately, you're looking at over $5,700. The complete program is $3,999—you're saving over $1,700 and getting the structure and accountability to actually get results. We also have a payment plan: 3 payments of $1,399."
            </p>
          </div>

          <div className="faq-item">
            <h4>PIF Bonus</h4>
            <p style={{background: '#dcfce7', padding: '1rem', borderRadius: '8px', fontStyle: 'italic'}}>
              "If you pay in full today, I'll add 2 extra Red Light sessions at no charge."
            </p>
          </div>
        </div>
      </section>

      {/* Phase 5: IV Upgrade */}
      <section className="section section-gray">
        <div className="container">
          <h2 style={{marginBottom: '1.5rem'}}>Phase 5: IV Upgrade (After Reset Close)</h2>
          
          <div className="faq-item" style={{marginBottom: '1rem'}}>
            <h4>Present IV Option</h4>
            <p style={{background: '#fef3c7', padding: '1rem', borderRadius: '8px', fontStyle: 'italic'}}>
              "One more thing—some patients add our Energy IV to each week of the Reset. It's a targeted blend of B-Complex, amino acids, and magnesium delivered directly into your bloodstream. It accelerates the cellular repair process. Six weekly IVs would normally be $1,350—as part of the Reset, it's $999."
            </p>
          </div>

          <div className="faq-item">
            <h4>Close</h4>
            <p style={{background: '#fef3c7', padding: '1rem', borderRadius: '8px', fontStyle: 'italic'}}>
              "Would you like to add the IV package, or start with the core Reset?"
            </p>
            <p style={{marginTop: '0.75rem', fontSize: '0.875rem', color: '#525252'}}>
              <strong>Note:</strong> This is an either/or close. Don't ask "do you want IVs?" — ask which option they prefer.
            </p>
          </div>
        </div>
      </section>

      {/* Phase 6: Objection Handling */}
      <section className="section">
        <div className="container">
          <h2 style={{marginBottom: '1.5rem'}}>Phase 6: Objection Handling</h2>
          
          <div className="faq-item" style={{marginBottom: '1rem'}}>
            <h4>"I need to think about it"</h4>
            <p style={{background: '#fee2e2', padding: '1rem', borderRadius: '8px', fontStyle: 'italic'}}>
              "Totally understand. What specifically do you need to think through? Is it the investment, the time commitment, or whether this will actually work for you?"
            </p>
            <p style={{marginTop: '0.75rem', fontSize: '0.875rem', color: '#525252'}}>
              <strong>Then address the specific concern.</strong> If still hesitant, offer the Assessment as a lower-risk entry point.
            </p>
          </div>

          <div className="faq-item" style={{marginBottom: '1rem'}}>
            <h4>"It's expensive"</h4>
            <p style={{background: '#fee2e2', padding: '1rem', borderRadius: '8px', fontStyle: 'italic'}}>
              "I hear you. Let me ask—how much have you already spent trying to fix this? Supplements, doctor visits, lost productivity? The Reset is a one-time investment to actually fix the underlying problem. And if the full Reset feels like too much right now, the Assessment is $199 and gives you real data to make this decision."
            </p>
          </div>

          <div className="faq-item" style={{marginBottom: '1rem'}}>
            <h4>"Does it really work?"</h4>
            <p style={{background: '#fee2e2', padding: '1rem', borderRadius: '8px', fontStyle: 'italic'}}>
              "Great question. The research on HBOT and red light for mitochondrial function is solid—I can share some of it if you'd like. But more importantly, you'll feel it. Most patients notice a difference by Week 3. That's why we do weekly check-ins—so we can track your progress together."
            </p>
          </div>

          <div className="faq-item">
            <h4>"I don't have time"</h4>
            <p style={{background: '#fee2e2', padding: '1rem', borderRadius: '8px', fontStyle: 'italic'}}>
              "I get it. The time commitment is about 90 minutes, three times a week for six weeks. But here's the thing—how much time and productivity are you losing right now because of low energy? Most patients say the Reset gives them back more hours than it costs."
            </p>
          </div>
        </div>
      </section>

      {/* Phase 7: Maintenance (Week 7) */}
      <section className="section section-gray">
        <div className="container">
          <h2 style={{marginBottom: '1.5rem'}}>Phase 7: Maintenance Presentation (Week 7)</h2>
          
          <div style={{background: '#dbeafe', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem'}}>
            <p style={{fontSize: '0.9375rem', color: '#1e40af', marginBottom: '0'}}>
              <strong>Timing:</strong> This conversation happens at the Week 7 Results Review, after the patient has completed the Reset and seen their results.
            </p>
          </div>

          <div className="faq-item" style={{marginBottom: '1rem'}}>
            <h4>Open with Results</h4>
            <p style={{background: '#dcfce7', padding: '1rem', borderRadius: '8px', fontStyle: 'italic'}}>
              "You've done amazing work these six weeks. [Reference their specific improvements—energy levels, sleep, whatever they reported.] Now let's talk about how to keep these results."
            </p>
          </div>

          <div className="faq-item" style={{marginBottom: '1rem'}}>
            <h4>Explain the Science</h4>
            <p style={{background: '#dcfce7', padding: '1rem', borderRadius: '8px', fontStyle: 'italic'}}>
              "The improvements you've made are real, but mitochondrial function does gradually decline without ongoing support. Most patients see their gains start to fade after 2-3 months without maintenance. The good news is you don't need the same intensity—once a week keeps you at this new baseline."
            </p>
          </div>

          <div className="faq-item" style={{marginBottom: '1rem'}}>
            <h4>Present Options</h4>
            <p style={{background: '#dcfce7', padding: '1rem', borderRadius: '8px', fontStyle: 'italic'}}>
              "We have two maintenance tiers. Base is $599 every four weeks—that's 4 HBOT and 4 Red Light sessions, plus quarterly check-ins. If you want maximum support, Maintenance + IV is $799 and adds a weekly Energy IV. Which sounds right for where you are?"
            </p>
            <p style={{marginTop: '0.75rem', fontSize: '0.875rem', color: '#525252'}}>
              <strong>Important:</strong> Present both options, then stop talking. Let them choose.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Note */}
      <section className="section">
        <div className="container">
          <div style={{background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '12px', padding: '1.5rem', textAlign: 'center'}}>
            <p style={{color: '#92400e', fontSize: '0.9375rem', marginBottom: '0'}}>
              <strong>Remember:</strong> The goal is to help patients solve their energy problem, not to "sell" them. 
              Listen more than you talk. Let the program sell itself.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
