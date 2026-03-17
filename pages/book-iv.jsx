// pages/book-iv.jsx
// Patient-facing IV booking page: Select IV → Add-ons → Patient Info → Pay → Book
import Layout from '../components/Layout';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// ── IV Data ─────────────────────────────────────────────────────────────────

const RANGE_IVS = [
  { name: 'Immune Defense IV', slug: 'range-iv-immune', icon: '\u{1F6E1}\u{FE0F}', priceCents: 22500, category: 'range', duration: '60 min', ingredients: ['Vitamin C', 'Zinc', 'Glutathione', 'B-Complex', 'Magnesium'], description: 'Immune support, antioxidant protection, and infection defense.' },
  { name: 'Energy & Vitality IV', slug: 'range-iv-energy', icon: '\u26A1', priceCents: 22500, category: 'range', duration: '60 min', ingredients: ['B12', 'B-Complex', 'L-Carnitine', 'Magnesium', 'Vitamin C'], description: 'Energy production, reduced fatigue, and metabolic support.' },
  { name: 'Muscle Recovery & Performance IV', slug: 'range-iv-recovery', icon: '\u{1F4AA}', priceCents: 22500, category: 'range', duration: '60 min', ingredients: ['Amino Acids', 'Magnesium', 'B-Complex', 'Vitamin C', 'Glutathione'], description: 'Muscle repair, recovery acceleration, and stress reduction.' },
  { name: 'Detox & Cellular Repair IV', slug: 'range-iv-detox', icon: '\u{1F9EC}', priceCents: 22500, category: 'range', duration: '60 min', ingredients: ['Glutathione', 'Vitamin C', 'NAC', 'Zinc', 'Magnesium'], description: 'Liver support, oxidative stress defense, and cellular repair.' },
];

const SPECIALTY_IVS = [
  { group: 'NAD+ IV', items: [
    { name: 'NAD+ 225mg', slug: 'nad-iv-250', priceCents: 37500, category: 'specialty', duration: '60 min', description: 'Cellular energy, anti-aging, cognitive support.', requiresBloodWork: false },
    { name: 'NAD+ 500mg', slug: 'nad-iv-500', priceCents: 52500, category: 'specialty', duration: '90 min', description: 'Most popular dose. Brain fog, fatigue, longevity.', requiresBloodWork: false, popular: true },
    { name: 'NAD+ 750mg', slug: 'nad-iv-750', priceCents: 65000, category: 'specialty', duration: '2 hrs', description: 'Advanced dose for experienced patients.', requiresBloodWork: false },
    { name: 'NAD+ 1000mg', slug: 'nad-iv-1000', priceCents: 77500, category: 'specialty', duration: '3 hrs', description: 'Maximum dose for deep cellular restoration.', requiresBloodWork: false },
  ]},
  { group: 'High-Dose Vitamin C', items: [
    { name: 'Vitamin C 25g', slug: 'vitamin-c-iv-25g', priceCents: 21500, category: 'specialty', duration: '90 min', description: 'Immune support, anti-oxidant.', requiresBloodWork: true },
    { name: 'Vitamin C 50g', slug: 'vitamin-c-iv-50g', priceCents: 25500, category: 'specialty', duration: '90 min', description: 'Higher dose immune support.', requiresBloodWork: true },
    { name: 'Vitamin C 75g', slug: 'vitamin-c-iv-75g', priceCents: 33000, category: 'specialty', duration: '2 hrs', description: 'Maximum dose Vitamin C infusion.', requiresBloodWork: true },
  ]},
  { group: 'Methylene Blue', items: [
    { name: 'Methylene Blue IV', slug: 'methylene-blue-iv', priceCents: 45000, category: 'specialty', duration: '60 min', description: 'Mitochondrial support, cognitive enhancement.', requiresBloodWork: true },
    { name: 'MB + Vitamin C + Magnesium Combo', slug: 'mb-combo-iv', priceCents: 75000, category: 'specialty', duration: '2 hrs', description: 'Full mitochondrial + anti-inflammatory support.', requiresBloodWork: true },
  ]},
  { group: 'Glutathione IV', items: [
    { name: 'Glutathione 1g', slug: 'glutathione-iv', priceCents: 17000, category: 'specialty', duration: '60 min', description: 'Master antioxidant. Detox, skin, immune.', requiresBloodWork: false },
    { name: 'Glutathione 2g', slug: 'glutathione-iv', priceCents: 19000, category: 'specialty', duration: '60 min', description: 'Double dose glutathione.', requiresBloodWork: false },
    { name: 'Glutathione 3g', slug: 'glutathione-iv', priceCents: 21500, category: 'specialty', duration: '60 min', description: 'Maximum dose glutathione.', requiresBloodWork: false },
  ]},
];

const AVAILABLE_ADDONS = [
  'Vitamin C', 'B-Complex', 'B12', 'Magnesium', 'Zinc',
  'Glutathione', 'Amino Acids', 'L-Carnitine', 'NAC', 'Calcium', 'Biotin',
];

// ── Checkout Form (inside Stripe Elements) ──────────────────────────────────

function CheckoutForm({ selectedIV, addOns, bloodWork, patientInfo, onSuccess, onBack }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const totalCents = selectedIV.priceCents + (addOns.length * 3500) + (bloodWork ? 12500 : 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError('');

    try {
      // Create payment intent
      const piRes = await fetch('/api/iv-booking/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedIV, addOns, bloodWork, patientInfo }),
      });
      const piData = await piRes.json();
      if (!piRes.ok) throw new Error(piData.error || 'Payment failed');

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(piData.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: `${patientInfo.firstName} ${patientInfo.lastName}`,
            email: patientInfo.email,
          },
        },
      });

      if (stripeError) throw new Error(stripeError.message);
      if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      setError(err.message);
    }
    setProcessing(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={s.summaryBox}>
        <h3 style={s.summaryTitle}>Order Summary</h3>
        <div style={s.summaryLine}>
          <span>{selectedIV.name}</span>
          <span style={s.summaryPrice}>${(selectedIV.priceCents / 100).toFixed(2)}</span>
        </div>
        {addOns.map(a => (
          <div key={a} style={s.summaryLine}>
            <span style={{ color: '#525252' }}>+ {a}</span>
            <span style={s.summaryPrice}>$35.00</span>
          </div>
        ))}
        {bloodWork && (
          <div style={s.summaryLine}>
            <span style={{ color: '#dc2626' }}>Pre-Screening Blood Panel</span>
            <span style={s.summaryPrice}>$125.00</span>
          </div>
        )}
        <div style={{ ...s.summaryLine, borderTop: '2px solid #171717', paddingTop: '12px', marginTop: '12px' }}>
          <span style={{ fontWeight: 700, fontSize: '16px' }}>Total</span>
          <span style={{ fontWeight: 700, fontSize: '16px' }}>${(totalCents / 100).toFixed(2)}</span>
        </div>
      </div>

      <div style={s.cardWrapper}>
        <label style={s.fieldLabel}>Card Details</label>
        <div style={s.cardElement}>
          <CardElement options={{
            style: {
              base: { fontSize: '16px', color: '#171717', fontFamily: 'Inter, -apple-system, sans-serif', '::placeholder': { color: '#a3a3a3' } },
              invalid: { color: '#dc2626' },
            },
          }} />
        </div>
      </div>

      {error && <div style={s.errorMsg}>{error}</div>}

      <div style={s.btnRow}>
        <button type="button" onClick={onBack} style={s.btnSecondary}>Back</button>
        <button type="submit" disabled={!stripe || processing} style={{ ...s.btnPrimary, opacity: processing ? 0.6 : 1 }}>
          {processing ? 'Processing...' : `Pay $${(totalCents / 100).toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function BookIV() {
  // Steps: 'select' | 'addons' | 'info' | 'pay' | 'book' | 'done'
  const [step, setStep] = useState('select');
  const [activeTab, setActiveTab] = useState('range');
  const [selectedIV, setSelectedIV] = useState(null);
  const [addOns, setAddOns] = useState([]);
  const [bloodWork, setBloodWork] = useState(false);
  const [patientInfo, setPatientInfo] = useState({ firstName: '', lastName: '', email: '', phone: '', dob: '' });
  const [calUrl, setCalUrl] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  function handleSelectIV(iv) {
    setSelectedIV(iv);
    // Range IVs go to add-ons step, specialty IVs skip to info
    if (iv.category === 'range') {
      setAddOns([]);
      setStep('addons');
    } else {
      setAddOns([]);
      if (iv.requiresBloodWork) setBloodWork(true);
      else setBloodWork(false);
      setStep('info');
    }
  }

  function toggleAddOn(name) {
    setAddOns(prev => prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]);
  }

  function validateInfo() {
    const errors = {};
    if (!patientInfo.firstName.trim()) errors.firstName = 'Required';
    if (!patientInfo.lastName.trim()) errors.lastName = 'Required';
    if (!patientInfo.email.trim() || !patientInfo.email.includes('@')) errors.email = 'Valid email required';
    if (!patientInfo.phone.trim() || patientInfo.phone.replace(/\D/g, '').length < 10) errors.phone = 'Valid phone required';
    if (!patientInfo.dob.trim()) errors.dob = 'Required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleInfoSubmit() {
    if (validateInfo()) setStep('pay');
  }

  function handlePaymentSuccess(piId) {
    setPaymentIntentId(piId);
    // Build Cal.com embed URL
    const slug = selectedIV.slug;
    const base = `https://range-medical.cal.com/range-team/${slug}`;
    const params = new URLSearchParams({
      embed: 'true',
      layout: 'month_view',
      theme: 'light',
      name: `${patientInfo.firstName} ${patientInfo.lastName}`,
      email: patientInfo.email,
    });
    setCalUrl(`${base}?${params.toString()}`);
    setStep('book');
  }

  async function handleBookingComplete() {
    setConfirming(true);
    try {
      await fetch('/api/iv-booking/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          selectedIV,
          addOns,
          bloodWork,
          patientInfo,
        }),
      });
    } catch (err) {
      console.error('Confirm error:', err);
    }
    setConfirming(false);
    setStep('done');
  }

  const totalCents = selectedIV ? selectedIV.priceCents + (addOns.length * 3500) + (bloodWork ? 12500 : 0) : 0;

  return (
    <Layout
      title="Book IV Therapy | Range Medical | Newport Beach"
      description="Book your IV therapy session at Range Medical in Newport Beach. Choose from signature formulas or specialty IVs. Pay online and schedule instantly."
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-inner">
          <span className="trust-item"><span className="trust-rating">&#9733;&#9733;&#9733;&#9733;&#9733;</span> 5.0 on Google</span>
          <span className="trust-item">Newport Beach, CA</span>
          <span className="trust-item">&#10003; Book & Pay Online</span>
        </div>
      </div>

      <div style={s.page}>
        {/* Progress Steps */}
        <div style={s.progressBar}>
          {['Select IV', 'Details', 'Patient Info', 'Pay', 'Schedule'].map((label, i) => {
            const stepMap = ['select', 'addons', 'info', 'pay', 'book'];
            const currentIdx = stepMap.indexOf(step === 'done' ? 'book' : step);
            const isActive = i <= currentIdx;
            return (
              <div key={label} style={{ ...s.progressStep, opacity: isActive ? 1 : 0.35 }}>
                <div style={{ ...s.progressDot, background: isActive ? '#171717' : '#d4d4d4' }}>{i + 1}</div>
                <span style={s.progressLabel}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* ── Step 1: Select IV ── */}
        {step === 'select' && (
          <div style={s.stepContainer}>
            <h1 style={s.pageTitle}>Choose Your IV</h1>
            <p style={s.pageSubtitle}>Select a formula to get started.</p>

            <div style={s.tabRow}>
              <button onClick={() => setActiveTab('range')} style={{ ...s.tab, ...(activeTab === 'range' ? s.tabActive : {}) }}>
                Range IVs <span style={s.tabPrice}>$225</span>
              </button>
              <button onClick={() => setActiveTab('specialty')} style={{ ...s.tab, ...(activeTab === 'specialty' ? s.tabActive : {}) }}>
                Specialty IVs
              </button>
            </div>

            {activeTab === 'range' && (
              <div style={s.ivGrid}>
                {RANGE_IVS.map(iv => (
                  <button key={iv.slug} style={s.ivCard} onClick={() => handleSelectIV(iv)}>
                    <div style={s.ivIcon}>{iv.icon}</div>
                    <h3 style={s.ivName}>{iv.name}</h3>
                    <p style={s.ivDesc}>{iv.description}</p>
                    <div style={s.ivIngredients}>
                      {iv.ingredients.map(ing => (
                        <span key={ing} style={s.ivPill}>{ing}</span>
                      ))}
                    </div>
                    <div style={s.ivFooter}>
                      <span style={s.ivDuration}>{iv.duration}</span>
                      <span style={s.ivPrice}>${(iv.priceCents / 100).toFixed(0)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'specialty' && (
              <div style={s.specialtyContainer}>
                {SPECIALTY_IVS.map(group => (
                  <div key={group.group} style={s.specialtyGroup}>
                    <h3 style={s.specialtyGroupTitle}>{group.group}</h3>
                    <div style={s.specialtyGrid}>
                      {group.items.map(iv => (
                        <button key={`${iv.slug}-${iv.priceCents}`} style={{ ...s.specialtyCard, ...(iv.popular ? s.specialtyCardPopular : {}) }} onClick={() => handleSelectIV(iv)}>
                          {iv.popular && <div style={s.popularBadge}>Most Popular</div>}
                          <h4 style={s.specialtyName}>{iv.name}</h4>
                          <p style={s.specialtyDesc}>{iv.description}</p>
                          <div style={s.specialtyMeta}>
                            <span style={s.specialtyDuration}>{iv.duration}</span>
                            <span style={s.specialtyPrice}>${(iv.priceCents / 100).toFixed(0)}</span>
                          </div>
                          {iv.requiresBloodWork && (
                            <div style={s.bloodWorkBadge}>Requires pre-screening blood work (+$125)</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Add-Ons (Range IVs only) ── */}
        {step === 'addons' && selectedIV && (
          <div style={s.stepContainer}>
            <h2 style={s.pageTitle}>Customize Your IV</h2>
            <p style={s.pageSubtitle}>
              Your {selectedIV.name} includes 5 nutrients. Add more for <strong>$35 each</strong>.
            </p>

            <div style={s.selectedBanner}>
              <span style={s.selectedIcon}>{selectedIV.icon}</span>
              <div>
                <div style={s.selectedName}>{selectedIV.name}</div>
                <div style={s.selectedIngredients}>Includes: {selectedIV.ingredients.join(', ')}</div>
              </div>
              <div style={s.selectedPrice}>${(selectedIV.priceCents / 100).toFixed(0)}</div>
            </div>

            <h3 style={s.addOnTitle}>Available Add-Ons — $35 each</h3>
            <div style={s.addOnGrid}>
              {AVAILABLE_ADDONS.filter(a => !selectedIV.ingredients.includes(a)).map(addon => {
                const isSelected = addOns.includes(addon);
                return (
                  <button
                    key={addon}
                    style={{ ...s.addOnCard, ...(isSelected ? s.addOnCardSelected : {}) }}
                    onClick={() => toggleAddOn(addon)}
                  >
                    {isSelected && <span style={s.addOnCheck}>&#10003;</span>}
                    <span>{addon}</span>
                  </button>
                );
              })}
            </div>

            {addOns.length > 0 && (
              <div style={s.addOnSummary}>
                {addOns.length} add-on{addOns.length > 1 ? 's' : ''} selected — +${(addOns.length * 35).toFixed(0)}
              </div>
            )}

            <div style={s.btnRow}>
              <button onClick={() => { setStep('select'); setSelectedIV(null); setAddOns([]); }} style={s.btnSecondary}>Back</button>
              <button onClick={() => setStep('info')} style={s.btnPrimary}>
                Continue — ${(totalCents / 100).toFixed(0)}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Patient Info ── */}
        {step === 'info' && (
          <div style={s.stepContainer}>
            <h2 style={s.pageTitle}>Your Information</h2>
            <p style={s.pageSubtitle}>We will use this to set up your appointment and send any required consent forms.</p>

            {selectedIV?.requiresBloodWork && (
              <div style={s.bloodWorkNotice}>
                <strong>Important:</strong> {selectedIV.name} requires a pre-screening blood panel (G6PD deficiency, CMP, CBC) before your IV appointment. The $125 blood work fee will be added to your total.
              </div>
            )}

            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.fieldLabel}>First Name *</label>
                <input style={{ ...s.input, ...(formErrors.firstName ? s.inputError : {}) }} value={patientInfo.firstName} onChange={e => setPatientInfo({ ...patientInfo, firstName: e.target.value })} placeholder="First name" />
                {formErrors.firstName && <span style={s.fieldError}>{formErrors.firstName}</span>}
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>Last Name *</label>
                <input style={{ ...s.input, ...(formErrors.lastName ? s.inputError : {}) }} value={patientInfo.lastName} onChange={e => setPatientInfo({ ...patientInfo, lastName: e.target.value })} placeholder="Last name" />
                {formErrors.lastName && <span style={s.fieldError}>{formErrors.lastName}</span>}
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>Email *</label>
                <input style={{ ...s.input, ...(formErrors.email ? s.inputError : {}) }} type="email" value={patientInfo.email} onChange={e => setPatientInfo({ ...patientInfo, email: e.target.value })} placeholder="you@email.com" />
                {formErrors.email && <span style={s.fieldError}>{formErrors.email}</span>}
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>Phone *</label>
                <input style={{ ...s.input, ...(formErrors.phone ? s.inputError : {}) }} type="tel" value={patientInfo.phone} onChange={e => setPatientInfo({ ...patientInfo, phone: e.target.value })} placeholder="(949) 555-0123" />
                {formErrors.phone && <span style={s.fieldError}>{formErrors.phone}</span>}
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>Date of Birth *</label>
                <input style={{ ...s.input, ...(formErrors.dob ? s.inputError : {}) }} type="date" value={patientInfo.dob} onChange={e => setPatientInfo({ ...patientInfo, dob: e.target.value })} />
                {formErrors.dob && <span style={s.fieldError}>{formErrors.dob}</span>}
              </div>
            </div>

            <div style={s.btnRow}>
              <button onClick={() => setStep(selectedIV?.category === 'range' ? 'addons' : 'select')} style={s.btnSecondary}>Back</button>
              <button onClick={handleInfoSubmit} style={s.btnPrimary}>Continue to Payment</button>
            </div>
          </div>
        )}

        {/* ── Step 4: Pay ── */}
        {step === 'pay' && selectedIV && (
          <div style={s.stepContainer}>
            <h2 style={s.pageTitle}>Payment</h2>
            <p style={s.pageSubtitle}>Secure checkout powered by Stripe.</p>

            <Elements stripe={stripePromise}>
              <CheckoutForm
                selectedIV={selectedIV}
                addOns={addOns}
                bloodWork={bloodWork}
                patientInfo={patientInfo}
                onSuccess={handlePaymentSuccess}
                onBack={() => setStep('info')}
              />
            </Elements>
          </div>
        )}

        {/* ── Step 5: Book Appointment ── */}
        {step === 'book' && (
          <div style={s.stepContainer}>
            <div style={s.paymentSuccess}>
              <div style={s.successIcon}>&#10003;</div>
              <h3 style={s.successTitle}>Payment Successful!</h3>
              <p style={s.successText}>Now pick your appointment time below.</p>
            </div>

            <h2 style={{ ...s.pageTitle, marginTop: '2rem' }}>Schedule Your Appointment</h2>
            <p style={s.pageSubtitle}>Choose a time that works for you. Your {selectedIV.name} will be ready when you arrive.</p>

            <div style={s.calContainer}>
              {calUrl && (
                <iframe
                  src={calUrl}
                  style={{ width: '100%', height: '700px', border: 'none', overflow: 'hidden' }}
                  scrolling="no"
                />
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button onClick={handleBookingComplete} disabled={confirming} style={s.btnPrimary}>
                {confirming ? 'Confirming...' : 'I\'ve Booked My Appointment'}
              </button>
              <p style={{ color: '#737373', fontSize: '13px', marginTop: '12px' }}>
                Click the button above after selecting your time slot.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 6: Done ── */}
        {step === 'done' && (
          <div style={s.stepContainer}>
            <div style={s.doneContainer}>
              <div style={s.doneIcon}>&#10003;</div>
              <h2 style={s.doneTitle}>You're All Set!</h2>
              <p style={s.doneText}>
                Your {selectedIV?.name} has been booked and paid for. Here is what happens next:
              </p>
              <div style={s.doneSteps}>
                <div style={s.doneStep}>
                  <div style={s.doneStepNum}>1</div>
                  <div>
                    <strong>Check your text messages</strong>
                    <p style={s.doneStepDesc}>We will send you any required consent forms via SMS. Please complete them before your visit.</p>
                  </div>
                </div>
                <div style={s.doneStep}>
                  <div style={s.doneStepNum}>2</div>
                  <div>
                    <strong>Show up at your appointment time</strong>
                    <p style={s.doneStepDesc}>Range Medical, 1901 Westcliff Dr Suite 9 & 10, Newport Beach, CA 92660</p>
                  </div>
                </div>
                <div style={s.doneStep}>
                  <div style={s.doneStepNum}>3</div>
                  <div>
                    <strong>Relax and enjoy your IV</strong>
                    <p style={s.doneStepDesc}>Your IV will be prepared and ready. Bring a book, laptop, or just relax.</p>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <p style={{ color: '#737373', fontSize: '14px' }}>
                  Questions? Call us at <a href="tel:9499973988" style={{ color: '#171717', fontWeight: 600 }}>(949) 997-3988</a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = {
  page: { maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem 4rem', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },

  // Progress bar
  progressBar: { display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2.5rem', flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 100, background: '#fff', padding: '16px 0', borderBottom: '1px solid #e5e5e5', margin: '0 -1.5rem 2.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' },
  progressStep: { display: 'flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.3s' },
  progressDot: { width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', transition: 'background 0.3s' },
  progressLabel: { fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#525252' },

  // Layout
  stepContainer: { maxWidth: '720px', margin: '0 auto' },
  pageTitle: { fontSize: '1.75rem', fontWeight: 700, color: '#171717', marginBottom: '0.5rem', letterSpacing: '-0.02em' },
  pageSubtitle: { fontSize: '1rem', color: '#525252', lineHeight: 1.6, marginBottom: '2rem' },

  // Tabs
  tabRow: { display: 'flex', gap: '0', marginBottom: '2rem', borderBottom: '2px solid #e5e5e5' },
  tab: { flex: 1, padding: '14px 20px', background: 'none', border: 'none', borderBottom: '2px solid transparent', marginBottom: '-2px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '15px', fontWeight: 600, color: '#737373', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  tabActive: { color: '#171717', borderBottomColor: '#171717' },
  tabPrice: { fontSize: '12px', fontWeight: 700, background: '#f5f5f5', padding: '2px 8px', borderRadius: '100px', color: '#525252' },

  // IV Grid (Range)
  ivGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
  ivCard: { textAlign: 'left', padding: '24px', borderRadius: '12px', border: '1px solid #e5e5e5', background: '#fff', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', display: 'flex', flexDirection: 'column' },
  ivIcon: { fontSize: '28px', marginBottom: '12px' },
  ivName: { fontSize: '16px', fontWeight: 700, color: '#171717', marginBottom: '6px' },
  ivDesc: { fontSize: '13px', color: '#525252', lineHeight: 1.5, marginBottom: '12px', flex: 1 },
  ivIngredients: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' },
  ivPill: { fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '100px', background: '#f5f5f5', color: '#525252', border: '1px solid #e5e5e5' },
  ivFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f5f5f5', paddingTop: '12px' },
  ivDuration: { fontSize: '12px', color: '#737373' },
  ivPrice: { fontSize: '18px', fontWeight: 700, color: '#171717' },

  // Specialty IVs
  specialtyContainer: {},
  specialtyGroup: { marginBottom: '2rem' },
  specialtyGroupTitle: { fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#737373', marginBottom: '12px' },
  specialtyGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' },
  specialtyCard: { textAlign: 'left', padding: '20px', borderRadius: '10px', border: '1px solid #e5e5e5', background: '#fff', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', position: 'relative' },
  specialtyCardPopular: { border: '2px solid #0891b2' },
  popularBadge: { position: 'absolute', top: '-10px', left: '16px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '3px 10px', background: '#0891b2', color: '#fff', borderRadius: '4px' },
  specialtyName: { fontSize: '15px', fontWeight: 700, color: '#171717', marginBottom: '4px' },
  specialtyDesc: { fontSize: '12px', color: '#525252', lineHeight: 1.5, marginBottom: '12px' },
  specialtyMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  specialtyDuration: { fontSize: '12px', color: '#737373' },
  specialtyPrice: { fontSize: '16px', fontWeight: 700, color: '#171717' },
  bloodWorkBadge: { marginTop: '10px', fontSize: '11px', fontWeight: 600, color: '#dc2626', background: '#fef2f2', padding: '6px 10px', borderRadius: '6px', border: '1px solid #fecaca' },

  // Add-ons
  selectedBanner: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: '#f5f5f5', borderRadius: '10px', marginBottom: '2rem' },
  selectedIcon: { fontSize: '28px' },
  selectedName: { fontSize: '15px', fontWeight: 700, color: '#171717' },
  selectedIngredients: { fontSize: '12px', color: '#737373', marginTop: '2px' },
  selectedPrice: { marginLeft: 'auto', fontSize: '18px', fontWeight: 700, color: '#171717' },
  addOnTitle: { fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#737373', marginBottom: '12px' },
  addOnGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  addOnCard: { padding: '14px', borderRadius: '8px', border: '1px solid #e5e5e5', background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: '#171717', transition: 'all 0.15s', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' },
  addOnCardSelected: { borderColor: '#171717', background: '#f5f5f5' },
  addOnCheck: { color: '#16a34a', fontWeight: 700 },
  addOnSummary: { marginTop: '16px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '14px', fontWeight: 600, color: '#166534', textAlign: 'center' },

  // Form
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column' },
  fieldLabel: { fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' },
  input: { padding: '12px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s' },
  inputError: { borderColor: '#dc2626' },
  fieldError: { fontSize: '12px', color: '#dc2626', marginTop: '4px' },
  bloodWorkNotice: { padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '14px', color: '#991b1b', lineHeight: 1.6, marginBottom: '1.5rem' },

  // Payment
  summaryBox: { padding: '20px', background: '#fafafa', borderRadius: '10px', border: '1px solid #e5e5e5', marginBottom: '1.5rem' },
  summaryTitle: { fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#737373', marginBottom: '12px' },
  summaryLine: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px', color: '#171717' },
  summaryPrice: { fontWeight: 600 },
  cardWrapper: { marginBottom: '1.5rem' },
  cardElement: { padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff' },
  errorMsg: { padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '14px', marginBottom: '1rem' },

  // Calendar
  calContainer: { borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e5e5', marginTop: '1rem' },

  // Success / Payment confirmed
  paymentSuccess: { textAlign: 'center', padding: '24px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '1rem' },
  successIcon: { width: '48px', height: '48px', borderRadius: '50%', background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px' },
  successTitle: { fontSize: '18px', fontWeight: 700, color: '#166534', margin: '0 0 4px' },
  successText: { fontSize: '14px', color: '#15803d', margin: 0 },

  // Done
  doneContainer: { textAlign: 'center', padding: '2rem 0' },
  doneIcon: { width: '64px', height: '64px', borderRadius: '50%', background: '#171717', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 1.5rem' },
  doneTitle: { fontSize: '1.75rem', fontWeight: 700, color: '#171717', marginBottom: '0.75rem' },
  doneText: { fontSize: '15px', color: '#525252', lineHeight: 1.6, maxWidth: '500px', margin: '0 auto 2rem' },
  doneSteps: { textAlign: 'left', maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' },
  doneStep: { display: 'flex', gap: '16px', padding: '16px', background: '#fafafa', borderRadius: '10px', alignItems: 'flex-start' },
  doneStepNum: { width: '28px', height: '28px', borderRadius: '50%', background: '#171717', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 },
  doneStepDesc: { fontSize: '13px', color: '#737373', margin: '4px 0 0', lineHeight: 1.5 },

  // Buttons
  btnRow: { display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '2rem' },
  btnPrimary: { padding: '14px 28px', background: '#171717', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' },
  btnSecondary: { padding: '14px 28px', background: '#fff', color: '#525252', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' },
};
