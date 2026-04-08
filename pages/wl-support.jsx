// /pages/wl-support.jsx
// Weight Loss Side Effect Support Page
// Dynamic content based on symptoms passed via ?s=nausea,fatigue
// Range Medical

import { useRouter } from 'next/router';
import Layout from '../components/Layout';

const SYMPTOM_CONTENT = {
  nausea: {
    title: 'Managing Nausea',
    icon: '🤢',
    explanation: 'Nausea is one of the most common side effects of GLP-1 medications. It happens because the medication slows down how quickly your stomach empties, which is actually part of how it helps you feel full longer. Your body is adjusting to this new pace of digestion.',
    tips: [
      { title: 'Start with carbs at breakfast', detail: 'The morning after your injection, try having a carb-friendly breakfast — toast, oatmeal, crackers, or a banana. Carbs are easier on the stomach and can help settle nausea first thing.' },
      { title: 'Eat smaller, more frequent meals', detail: 'Instead of 3 large meals, try 5-6 smaller ones throughout the day. This keeps your stomach from getting too full.' },
      { title: 'Avoid greasy and fried foods', detail: 'High-fat foods are harder to digest and can make nausea worse. Stick to lean proteins, vegetables, and simple carbs when nausea is at its peak.' },
      { title: 'Try ginger or peppermint tea', detail: 'Both are natural stomach settlers. Keep ginger chews or peppermint tea bags on hand for when nausea hits.' },
      { title: 'Eat slowly and chew thoroughly', detail: 'Rushing through meals can overwhelm your stomach. Take your time and put your fork down between bites.' },
      { title: 'Stay hydrated between meals', detail: 'Sip water throughout the day, but try not to drink large amounts right before or during meals.' },
      { title: 'Time meals around your injection', detail: 'Some patients find it helpful to eat a light meal before their injection day and keep meals simple for the day or two after.' },
    ],
    callUs: 'If you experience persistent vomiting, can\'t keep fluids down for more than 24 hours, or notice signs of dehydration (dark urine, dizziness), call us right away.',
    reassurance: 'Most patients find that nausea improves significantly within the first 2-4 weeks as your body adjusts to the medication. It often gets better with each dose.',
  },
  fatigue: {
    title: 'Managing Fatigue',
    icon: '😴',
    explanation: 'Feeling tired during the first couple of weeks is normal. Your body is adjusting to taking in fewer calories, which can temporarily lower your energy levels. This is a sign the medication is working.',
    tips: [
      { title: 'Prioritize protein at every meal', detail: 'Aim for 20-30g of protein per meal. Protein keeps your energy stable and helps preserve muscle mass as you lose weight. Think eggs, chicken, fish, Greek yogurt.' },
      { title: 'Drink plenty of water', detail: 'Dehydration is a sneaky cause of fatigue. Aim for at least 64 oz (8 glasses) per day. If your urine is pale yellow, you\'re on track.' },
      { title: 'Get quality sleep', detail: 'Aim for 7-8 hours. Good sleep supports your metabolism and helps your body recover. Keep a consistent bedtime routine.' },
      { title: 'Try light exercise', detail: 'It sounds counterintuitive, but a 15-20 minute walk can actually boost your energy. You don\'t need intense workouts — just keep moving.' },
      { title: 'Consider B-vitamins', detail: 'A B-complex vitamin can support energy levels, especially if you\'re eating less overall. Ask us about our IV vitamin options for a quick boost.' },
    ],
    callUs: 'If fatigue is severe or debilitating, doesn\'t improve after 2 weeks, or is accompanied by chest pain or shortness of breath, contact us.',
    reassurance: 'Most patients find their energy levels return to normal within 1-2 weeks as their body adapts to the new caloric intake. Many actually report feeling more energized once they hit their stride.',
  },
  constipation: {
    title: 'Managing Constipation',
    icon: '💧',
    explanation: 'Because GLP-1 medications slow stomach emptying and digestion, things can move more slowly through your entire digestive system. Combined with eating less food overall, constipation is a common but manageable side effect.',
    tips: [
      { title: 'Increase your water intake', detail: 'Aim for 1.5-2 liters (about 6-8 glasses) per day minimum. Water is the single most effective remedy for constipation.' },
      { title: 'Add fiber gradually', detail: 'Include fiber-rich foods like vegetables, berries, beans, and whole grains. Increase slowly to avoid bloating. A fiber supplement like psyllium husk can help too.' },
      { title: 'Go for a daily walk', detail: 'Even 15-20 minutes of walking stimulates your digestive system and helps keep things moving. Regular movement makes a real difference.' },
      { title: 'Consider magnesium', detail: 'Magnesium citrate (200-400mg at bedtime) is a gentle, natural option that can help with regularity. It also supports sleep and muscle recovery.' },
      { title: 'Don\'t skip your morning coffee', detail: 'Coffee naturally stimulates bowel movements. If you drink it, keep up the habit. Just be mindful of added sugars and cream.' },
    ],
    callUs: 'If constipation persists beyond 2 weeks despite these strategies, causes severe discomfort or pain, or you notice blood in your stool, reach out to us.',
    reassurance: 'Constipation usually improves as your body adjusts and you establish good hydration and fiber habits. Most patients find a routine that works within the first few weeks.',
  },
  indigestion: {
    title: 'Managing Indigestion',
    icon: '🔥',
    explanation: 'Indigestion, heartburn, or an upset stomach can occur because the medication changes how quickly food moves through your digestive system. Your stomach may feel overly full or uncomfortable, especially after larger meals.',
    tips: [
      { title: 'Eat smaller portions', detail: 'Your body is telling you it needs less food at once. Try using a smaller plate and stopping when you\'re comfortable — not stuffed.' },
      { title: 'Eat slowly and mindfully', detail: 'Take 20+ minutes per meal. Chew thoroughly and pause between bites. This gives your stomach time to process.' },
      { title: 'Avoid heavy, spicy, or acidic foods', detail: 'Rich, spicy, or acidic meals are more likely to trigger indigestion. Stick to mild, easy-to-digest foods like chicken, rice, bananas, and steamed vegetables.' },
      { title: 'Don\'t lie down after eating', detail: 'Stay upright for at least 30 minutes after meals. This helps gravity keep stomach acid where it belongs.' },
      { title: 'Skip carbonated drinks', detail: 'Sparkling water, soda, and beer can increase stomach pressure and make indigestion worse. Stick to flat water or herbal tea.' },
    ],
    callUs: 'If you experience severe stomach pain, pain that radiates to your back, or notice blood in your stool or vomit, contact us immediately.',
    reassurance: 'Indigestion typically resolves as your body adjusts to the medication and you find the right portion sizes. Most patients see improvement within 2-3 weeks.',
  },
  'injection-site-pain': {
    title: 'Managing Injection Site Discomfort',
    icon: '💉',
    explanation: 'Some soreness, redness, or mild swelling at the injection site is normal and usually goes away within a day or two. This is your body\'s natural response to the injection.',
    tips: [
      { title: 'Ice the area for 10 minutes', detail: 'Apply an ice pack or cold compress to the injection site for about 10 minutes after injecting. This reduces inflammation and numbs the area.' },
      { title: 'Rotate injection sites weekly', detail: 'Alternate between your abdomen, thighs, and upper arms. Never inject in the exact same spot twice in a row. Keep at least 1 inch between sites.' },
      { title: 'Let the medication reach room temperature', detail: 'If stored in the fridge, take it out 15-30 minutes before injecting. Cold medication stings more.' },
      { title: 'Inject slowly and steadily', detail: 'Don\'t rush the injection. Push the plunger down slowly and leave the needle in for 5-10 seconds after to ensure all medication is delivered.' },
      { title: 'Gently massage the area', detail: 'After removing the needle, lightly massage the site in a circular motion for 10-15 seconds. This helps the medication disperse.' },
    ],
    callUs: 'If you notice redness or swelling that lasts more than 48 hours, spreading redness, warmth that increases, or signs of infection, contact us right away.',
    reassurance: 'Injection site reactions are very common and almost always resolve on their own within 24-48 hours. Most patients find that discomfort decreases as they get more comfortable with the injection technique.',
  },
};

// Normalize symptom strings to match SYMPTOM_CONTENT keys
function normalizeSymptom(s) {
  const trimmed = s.trim().toLowerCase().replace(/\s+/g, '-');
  // Handle "injection site pain" and "injection_site_pain" variants
  if (trimmed.includes('injection')) return 'injection-site-pain';
  return trimmed;
}

export default function WLSupportPage() {
  const router = useRouter();
  const { s } = router.query;

  // Parse symptoms from query param
  const symptoms = s
    ? s.split(',').map(normalizeSymptom).filter(sym => SYMPTOM_CONTENT[sym])
    : [];

  const hasSymptoms = symptoms.length > 0;

  return (
    <Layout
      title="Weight Loss Support | Range Medical"
      description="Tips and strategies for managing common weight loss medication side effects. Range Medical, Newport Beach."
    >
      {/* Hero */}
      <section className="wl-hero">
        <div className="wl-hero-inner">
          <span className="wl-hero-badge">Weight Loss Support</span>
          <h1>{hasSymptoms ? 'Tips to Help You Feel Better' : 'Your Weight Loss Support Guide'}</h1>
          <p className="wl-hero-sub">
            {hasSymptoms
              ? 'Based on what you shared in your check-in, here are some things that can help.'
              : 'Tips and strategies for your weight loss journey. You\'re doing great.'
            }
          </p>
        </div>
      </section>

      {/* Symptom Sections */}
      {hasSymptoms ? (
        symptoms.map((symptom, index) => {
          const content = SYMPTOM_CONTENT[symptom];
          if (!content) return null;
          const isGray = index % 2 === 1;

          return (
            <section key={symptom} className={`wl-section ${isGray ? 'wl-section-gray' : ''}`}>
              <div className="wl-section-inner">
                <div className="wl-symptom-header">
                  <span className="wl-symptom-icon">{content.icon}</span>
                  <h2>{content.title}</h2>
                </div>

                <p className="wl-explanation">{content.explanation}</p>

                <div className="wl-tips-grid">
                  {content.tips.map((tip, i) => (
                    <div key={i} className="wl-tip-card">
                      <h3>{tip.title}</h3>
                      <p>{tip.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="wl-reassurance-box">
                  <p>{content.reassurance}</p>
                </div>

                <div className="wl-callus-box">
                  <strong>When to Contact Us</strong>
                  <p>{content.callUs}</p>
                </div>
              </div>
            </section>
          );
        })
      ) : (
        /* General tips when no specific symptoms */
        <section className="wl-section">
          <div className="wl-section-inner">
            <div className="wl-kicker">General Tips</div>
            <h2>Staying on Track</h2>
            <p className="wl-section-sub">A few things that help every patient on their weight loss journey.</p>

            <div className="wl-tips-grid">
              <div className="wl-tip-card">
                <h3>Stay Hydrated</h3>
                <p>Aim for at least 64 oz of water per day. Proper hydration supports your metabolism, energy levels, and helps your body process the medication effectively.</p>
              </div>
              <div className="wl-tip-card">
                <h3>Prioritize Protein</h3>
                <p>20-30g of protein per meal helps preserve muscle mass as you lose weight and keeps you feeling full. Think chicken, fish, eggs, Greek yogurt, and legumes.</p>
              </div>
              <div className="wl-tip-card">
                <h3>Keep Moving</h3>
                <p>You don't need intense workouts. A daily 20-30 minute walk supports your metabolism, improves mood, and helps with digestion.</p>
              </div>
              <div className="wl-tip-card">
                <h3>Get Quality Sleep</h3>
                <p>7-8 hours of sleep per night supports weight loss, hormone balance, and recovery. Poor sleep can increase cravings and slow progress.</p>
              </div>
              <div className="wl-tip-card">
                <h3>Be Patient With Yourself</h3>
                <p>Weight loss isn't always linear. Some weeks you'll lose more, some weeks less. Trust the process and focus on how you feel, not just the number on the scale.</p>
              </div>
              <div className="wl-tip-card">
                <h3>Track Your Progress</h3>
                <p>Your weekly check-ins help us monitor your progress and adjust your plan if needed. Keep them up — they make a real difference in your results.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="wl-cta">
        <div className="wl-cta-inner">
          <h2>Still Have Questions?</h2>
          <p>Our team is here to help. Don't hesitate to reach out if you need anything at all.</p>
          <div className="wl-cta-buttons">
            <a href="tel:+19499973988" className="wl-btn-primary">Call (949) 997-3988</a>
            <a href="sms:+19499973988" className="wl-btn-outline">Text Us</a>
          </div>
          <p className="wl-cta-disclaimer">
            If you are experiencing a life-threatening emergency, call 911 immediately. For all non-emergency questions or concerns, please contact the clinic.
          </p>
        </div>
      </section>

      <style jsx>{`
        /* ── Hero ── */
        .wl-hero {
          background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
          padding: 3.5rem 1.5rem 3rem;
          text-align: center;
        }
        .wl-hero-inner {
          max-width: 700px;
          margin: 0 auto;
        }
        .wl-hero-badge {
          display: inline-block;
          background: #000000;
          color: #ffffff;
          padding: 0.5rem 1rem;
          border-radius: 0;
          font-size: 0.8125rem;
          font-weight: 600;
          margin-bottom: 1.25rem;
        }
        .wl-hero h1 {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 700;
          color: #171717;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin: 0 0 1rem;
        }
        .wl-hero-sub {
          font-size: 1.0625rem;
          color: #525252;
          max-width: 550px;
          margin: 0 auto;
          line-height: 1.7;
        }

        /* ── Sections ── */
        .wl-section {
          padding: 3.5rem 1.5rem;
        }
        .wl-section-gray {
          background: #fafafa;
        }
        .wl-section-inner {
          max-width: 800px;
          margin: 0 auto;
        }
        .wl-kicker {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #737373;
          margin-bottom: 0.5rem;
        }
        .wl-section h2 {
          font-size: 2rem;
          font-weight: 700;
          color: #171717;
          letter-spacing: -0.02em;
          margin: 0 0 0.75rem;
        }
        .wl-section-sub {
          font-size: 1rem;
          color: #525252;
          line-height: 1.7;
          margin: 0 0 2rem;
        }

        /* ── Symptom Header ── */
        .wl-symptom-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1rem;
        }
        .wl-symptom-icon {
          font-size: 2rem;
        }

        .wl-explanation {
          font-size: 1rem;
          color: #525252;
          line-height: 1.7;
          margin-bottom: 2rem;
        }

        /* ── Tips Grid ── */
        .wl-tips-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .wl-tip-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 0;
          padding: 1.75rem;
          transition: all 0.2s ease;
        }
        .wl-tip-card:hover {
          border-color: #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
        }
        .wl-tip-card h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #171717;
          margin: 0 0 0.5rem;
        }
        .wl-tip-card p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin: 0;
        }

        /* ── Reassurance Box ── */
        .wl-reassurance-box {
          background: #ffffff;
          border-left: 4px solid #000000;
          padding: 1.25rem 1.5rem;
          margin-bottom: 1.25rem;
          border-radius: 0;
        }
        .wl-reassurance-box p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin: 0;
        }

        /* ── When to Call Us ── */
        .wl-callus-box {
          background: #fafafa;
          border: 1px solid #e5e5e5;
          border-radius: 0;
          padding: 1.25rem 1.5rem;
        }
        .wl-callus-box strong {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #737373;
          margin-bottom: 0.5rem;
        }
        .wl-callus-box p {
          font-size: 0.9375rem;
          color: #525252;
          line-height: 1.7;
          margin: 0;
        }

        /* ── CTA Section ── */
        .wl-cta {
          background: #000000;
          color: #ffffff;
          padding: 3.5rem 1.5rem;
          text-align: center;
        }
        .wl-cta-inner {
          max-width: 600px;
          margin: 0 auto;
        }
        .wl-cta h2 {
          color: #ffffff;
          font-size: 2rem;
          font-weight: 400;
          letter-spacing: -0.02em;
          margin: 0 0 0.75rem;
        }
        .wl-cta-disclaimer {
          margin-top: 1.75rem;
          font-size: 0.8rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.5);
        }
        .wl-cta p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 1rem;
          line-height: 1.7;
          margin: 0 0 2rem;
        }
        .wl-cta-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .wl-btn-primary {
          display: inline-block;
          background: #ffffff;
          color: #000000;
          padding: 0.875rem 1.75rem;
          border-radius: 0;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }
        .wl-btn-primary:hover {
          background: #f5f5f5;
          transform: translateY(-1px);
        }
        .wl-btn-outline {
          display: inline-block;
          background: transparent;
          color: #ffffff;
          padding: 0.875rem 1.75rem;
          border-radius: 0;
          border: 2px solid #ffffff;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }
        .wl-btn-outline:hover {
          background: #ffffff;
          color: #000000;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .wl-hero {
            padding: 3rem 1.25rem 2.5rem;
          }
          .wl-hero h1 {
            font-size: 1.875rem;
          }
          .wl-hero-sub {
            font-size: 1rem;
          }
          .wl-section {
            padding: 2.5rem 1.25rem;
          }
          .wl-section h2 {
            font-size: 1.5rem;
          }
          .wl-tips-grid {
            grid-template-columns: 1fr;
          }
          .wl-cta h2 {
            font-size: 1.5rem;
          }
          .wl-cta-buttons {
            flex-direction: column;
            align-items: center;
          }
          .wl-btn-primary, .wl-btn-outline {
            width: 100%;
            max-width: 280px;
            text-align: center;
          }
        }
      `}</style>
    </Layout>
  );
}
