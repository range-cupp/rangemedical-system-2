import { useState } from 'react';
import Layout from '../../components/Layout';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

const INTERESTS = [
  { id: 'peptides_recovery', label: 'Peptides & Recovery', desc: 'Accelerate healing, reduce inflammation, support tissue repair' },
  { id: 'hormone_optimization', label: 'Hormone Optimization', desc: 'Restore energy, drive, and metabolic balance' },
  { id: 'weight_loss', label: 'Weight Loss & Body Composition', desc: 'Medical-grade protocols for sustainable results' },
  { id: 'energy_performance', label: 'Energy & Performance', desc: 'IV therapy, NAD+, and cellular optimization' },
  { id: 'not_sure', label: 'Not sure yet', desc: 'Just want to learn more about what\'s available' },
];

export async function getServerSideProps({ params }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: partner } = await supabase
    .from('referral_partners')
    .select('slug, name, headline, subheadline')
    .eq('slug', params.slug)
    .eq('active', true)
    .maybeSingle();

  if (!partner) {
    return { notFound: true };
  }

  return { props: { partner } };
}

export default function ReferralPage({ partner }) {
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', email: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const toggleInterest = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.first_name || !form.last_name || !form.phone || !form.email) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/referral/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          partner_slug: partner.slug,
          interests: selected,
        }),
      });

      if (!res.ok) throw new Error('Submit failed');
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again or call us at (949) 997-3988.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout
      title={`${partner.name} Referred You | Range Medical`}
      description="You've been personally referred to Range Medical. Peptides, hormone optimization, recovery, and performance medicine in Newport Beach."
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="ref-page">
        {/* Hero */}
        <section className="ref-hero">
          <div className="ref-container">
            <div className="v2-label"><span className="v2-dot" /> PERSONAL REFERRAL</div>
            <h1>{partner.headline}</h1>
            <div className="ref-rule" />
            <p className="ref-body">{partner.subheadline}</p>
          </div>
        </section>

        {/* Intro */}
        <section className="ref-section ref-section-alt">
          <div className="ref-container">
            <p className="ref-body">Range Medical is a regenerative medicine clinic in Newport Beach. We use peptide therapy, hormone optimization, IV protocols, and advanced recovery tools to help people perform better, recover faster, and feel like themselves again.</p>
            <p className="ref-body" style={{ marginTop: '1rem' }}>No generic wellness plans. Everything is built around your labs, your goals, and where you actually are right now.</p>
            <p className="ref-body" style={{ marginTop: '1rem' }}>Fill out the form below and someone from our team will reach out within 24 hours.</p>
          </div>
        </section>

        {/* Form */}
        <section className="ref-section">
          <div className="ref-container">
            {submitted ? (
              <div className="ref-success">
                <div className="ref-success-icon">✓</div>
                <h2>You're in.</h2>
                <p className="ref-body" style={{ textAlign: 'center', margin: '0 auto' }}>Someone from our team will reach out within 24 hours.</p>
              </div>
            ) : (
              <>
                <div className="v2-label"><span className="v2-dot" /> WHAT ARE YOU INTERESTED IN?</div>
                <div className="ref-interests">
                  {INTERESTS.map(interest => (
                    <button
                      key={interest.id}
                      type="button"
                      className={`ref-interest-card ${selected.includes(interest.id) ? 'active' : ''}`}
                      onClick={() => toggleInterest(interest.id)}
                    >
                      <div className="ref-interest-check">{selected.includes(interest.id) ? '✓' : ''}</div>
                      <div>
                        <div className="ref-interest-label">{interest.label}</div>
                        <div className="ref-interest-desc">{interest.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="ref-form">
                  <div className="v2-label" style={{ marginTop: '3rem' }}><span className="v2-dot" /> YOUR INFO</div>
                  <div className="ref-row">
                    <div className="ref-field">
                      <label>First Name *</label>
                      <input
                        type="text"
                        value={form.first_name}
                        onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                        placeholder="First name"
                      />
                    </div>
                    <div className="ref-field">
                      <label>Last Name *</label>
                      <input
                        type="text"
                        value={form.last_name}
                        onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  <div className="ref-row">
                    <div className="ref-field">
                      <label>Phone *</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="(555) 555-5555"
                      />
                    </div>
                    <div className="ref-field">
                      <label>Email *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="you@email.com"
                      />
                    </div>
                  </div>
                  <div className="ref-field" style={{ marginTop: '1rem' }}>
                    <label>Anything you want us to know?</label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Goals, injuries, questions — anything helps"
                      rows={3}
                    />
                  </div>

                  {error && <p className="ref-error">{error}</p>}

                  <button type="submit" className="ref-submit" disabled={submitting}>
                    {submitting ? 'Sending...' : 'Send My Info to the Team'}
                  </button>
                </form>
              </>
            )}
          </div>
        </section>

        {/* Footer CTA */}
        <section className="ref-section ref-section-inverted">
          <div className="ref-container" style={{ textAlign: 'center' }}>
            <p className="ref-body" style={{ margin: '0 auto', textAlign: 'center' }}>Prefer to just call? We're here.</p>
            <div className="ref-cta-buttons">
              <a href="tel:+19499973988" className="ref-btn-primary">CALL (949) 997-3988</a>
              <a href="sms:+19499973988" className="ref-btn-outline">TEXT US</a>
            </div>
            <p className="ref-location">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
          </div>
        </section>
      </div>

      <style jsx>{`
        .ref-page { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; -webkit-font-smoothing: antialiased; background: #ffffff; color: #171717; overflow-x: hidden; }
        .ref-container { max-width: 800px; margin: 0 auto; padding: 0 2rem; }
        .ref-section { padding: 5rem 2rem; }
        .ref-section-alt { background: #fafafa; padding: 4rem 2rem; }
        .ref-section-inverted { background: #1a1a1a; color: #ffffff; padding: 4rem 2rem; }
        .ref-hero { padding: 6rem 2rem 4rem; }
        .ref-page h1 { font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 900; line-height: 1; letter-spacing: -0.02em; text-transform: uppercase; color: #171717; margin-bottom: 1.25rem; }
        .ref-page h2 { font-size: 2rem; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase; color: #171717; margin-bottom: 1rem; }
        .ref-rule { width: 48px; height: 1px; background: #e0e0e0; margin-bottom: 1.5rem; }
        .ref-body { font-size: 1.0625rem; font-weight: 400; line-height: 1.7; color: #737373; max-width: 600px; }
        .ref-section-inverted .ref-body { color: rgba(255, 255, 255, 0.55); }

        /* Interest cards */
        .ref-interests { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
        .ref-interest-card { display: flex; align-items: flex-start; gap: 1rem; padding: 1.25rem 1.5rem; background: #ffffff; border: 1px solid #e0e0e0; cursor: pointer; text-align: left; font-family: inherit; transition: border-color 0.15s, background 0.15s; }
        .ref-interest-card:hover { border-color: #999; }
        .ref-interest-card.active { border-color: #1a1a1a; background: #fafafa; }
        .ref-interest-check { width: 22px; height: 22px; border: 1.5px solid #d0d0d0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 13px; font-weight: 700; color: #1a1a1a; margin-top: 1px; }
        .ref-interest-card.active .ref-interest-check { border-color: #1a1a1a; background: #1a1a1a; color: #ffffff; }
        .ref-interest-label { font-size: 0.9375rem; font-weight: 700; color: #171717; margin-bottom: 0.2rem; }
        .ref-interest-desc { font-size: 0.8125rem; color: #737373; line-height: 1.5; }

        /* Form */
        .ref-form { margin-top: 0; }
        .ref-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
        .ref-field { display: flex; flex-direction: column; }
        .ref-field label { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #737373; text-transform: uppercase; margin-bottom: 0.5rem; }
        .ref-field input, .ref-field textarea { padding: 0.75rem 1rem; font-size: 0.9375rem; border: 1px solid #e0e0e0; background: #ffffff; color: #171717; font-family: inherit; transition: border-color 0.15s; outline: none; }
        .ref-field input:focus, .ref-field textarea:focus { border-color: #1a1a1a; }
        .ref-field textarea { resize: vertical; min-height: 80px; }
        .ref-error { color: #dc2626; font-size: 0.875rem; margin-top: 1rem; }
        .ref-submit { display: block; width: 100%; margin-top: 2rem; padding: 1rem; background: #1a1a1a; color: #ffffff; border: none; font-family: inherit; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; transition: background 0.15s; }
        .ref-submit:hover { background: #333; }
        .ref-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Success */
        .ref-success { text-align: center; padding: 3rem 0; }
        .ref-success-icon { width: 56px; height: 56px; background: #1a1a1a; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; margin: 0 auto 1.5rem; }

        /* Footer CTA */
        .ref-cta-buttons { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin: 1.5rem 0; }
        .ref-btn-primary { display: inline-block; background: #ffffff; color: #1a1a1a; padding: 0.875rem 2rem; text-decoration: none; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; transition: background 0.2s; }
        .ref-btn-primary:hover { background: #e0e0e0; }
        .ref-btn-outline { display: inline-block; background: transparent; color: #ffffff; padding: 0.875rem 2rem; border: 1px solid rgba(255,255,255,0.3); text-decoration: none; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; transition: all 0.2s; }
        .ref-btn-outline:hover { background: #ffffff; color: #1a1a1a; }
        .ref-location { font-size: 0.9rem; color: rgba(255,255,255,0.5); }

        @media (max-width: 768px) {
          .ref-page h1 { font-size: 1.75rem; }
          .ref-hero { padding: 3.5rem 2rem 3rem; }
          .ref-section { padding: 3rem 1.5rem; }
          .ref-section-alt { padding: 3rem 1.5rem; }
          .ref-section-inverted { padding: 3rem 1.5rem; }
          .ref-row { grid-template-columns: 1fr; }
          .ref-cta-buttons { flex-direction: column; align-items: center; }
        }
      `}</style>
    </Layout>
  );
}
