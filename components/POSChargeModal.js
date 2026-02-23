// POS Charge Modal — Range Medical
// Multi-step: Select Service → Payment Method → Processing → Result

import { useState, useEffect } from 'react';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { POS_CATEGORIES, POS_ITEMS, formatPrice, getItemsByCategory } from '../lib/pos-pricing';

// ============================================================
// Inner component (must be inside <Elements> provider)
// ============================================================
function POSChargeForm({ patient, onClose }) {
  const stripe = useStripe();
  const elements = useElements();

  // Steps: 'select' | 'payment' | 'processing' | 'result'
  const [step, setStep] = useState('select');
  const [activeCategory, setActiveCategory] = useState('lab_panels');
  const [selectedItem, setSelectedItem] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  // Payment state
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null); // payment_method_id or 'new'
  const [saveNewCard, setSaveNewCard] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);

  // Result state
  const [resultStatus, setResultStatus] = useState(null); // 'success' | 'error'
  const [resultMessage, setResultMessage] = useState('');

  // Load saved cards when entering payment step
  useEffect(() => {
    if (step === 'payment') {
      loadSavedCards();
    }
  }, [step]);

  async function loadSavedCards() {
    setLoadingCards(true);
    try {
      const res = await fetch(`/api/stripe/saved-cards?patient_id=${patient.id}`);
      const data = await res.json();
      setSavedCards(data.cards || []);
      if (data.cards?.length > 0) {
        setSelectedCard(data.cards[0].id);
      } else {
        setSelectedCard('new');
      }
    } catch (err) {
      console.error('Load cards error:', err);
      setSelectedCard('new');
    }
    setLoadingCards(false);
  }

  function getChargeAmount() {
    if (activeCategory === 'custom') {
      const dollars = parseFloat(customAmount);
      return isNaN(dollars) ? 0 : Math.round(dollars * 100);
    }
    return selectedItem?.price || 0;
  }

  function getChargeDescription() {
    if (activeCategory === 'custom') {
      return customDescription || 'Custom charge';
    }
    return selectedItem?.name || '';
  }

  function isRecurring() {
    return selectedItem?.recurring || false;
  }

  function canProceedToPayment() {
    if (activeCategory === 'custom') {
      return parseFloat(customAmount) > 0;
    }
    return selectedItem !== null;
  }

  async function handlePay() {
    if (!stripe || !elements) return;

    setStep('processing');
    const amount = getChargeAmount();
    const description = getChargeDescription();

    try {
      // For recurring items, create a subscription
      if (isRecurring()) {
        // If using a new card, save it first
        if (selectedCard === 'new') {
          const saveResult = await saveCardFirst();
          if (!saveResult) return; // Error handled inside
        }

        const subRes = await fetch('/api/stripe/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patient.id,
            price_amount: amount,
            interval: selectedItem.interval || 'month',
            description,
          }),
        });

        const subData = await subRes.json();
        if (!subRes.ok) throw new Error(subData.error);

        // Record purchase
        await fetch('/api/stripe/record-purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patient.id,
            amount,
            description: `${description} (monthly subscription)`,
            stripe_subscription_id: subData.subscription_id,
            payment_method: 'stripe',
          }),
        });

        setResultStatus('success');
        setResultMessage(`Subscription created for ${description} — ${formatPrice(amount)}/mo`);
        setStep('result');
        return;
      }

      // One-time charge
      if (selectedCard === 'new') {
        // Save card if requested, then charge
        if (saveNewCard) {
          const saved = await saveCardFirst();
          if (!saved) return;
          // Charge the newly saved card
          await chargeWithSavedCard(saved, amount, description);
        } else {
          // Charge with CardElement directly (no save)
          await chargeWithNewCard(amount, description);
        }
      } else {
        // Charge saved card
        await chargeWithSavedCard(selectedCard, amount, description);
      }

    } catch (error) {
      console.error('Payment error:', error);
      setResultStatus('error');
      setResultMessage(error.message || 'Payment failed');
      setStep('result');
    }
  }

  async function saveCardFirst() {
    // Create SetupIntent
    const setupRes = await fetch('/api/stripe/saved-cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patient.id }),
    });

    const setupData = await setupRes.json();
    if (!setupRes.ok) throw new Error(setupData.error);

    const cardElement = elements.getElement(CardElement);
    const { error, setupIntent } = await stripe.confirmCardSetup(setupData.client_secret, {
      payment_method: { card: cardElement },
    });

    if (error) {
      setResultStatus('error');
      setResultMessage(error.message);
      setStep('result');
      return null;
    }

    return setupIntent.payment_method;
  }

  async function chargeWithNewCard(amount, description) {
    // Create PaymentIntent without saved card
    const piRes = await fetch('/api/stripe/payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patient.id,
        amount,
        description,
      }),
    });

    const piData = await piRes.json();
    if (!piRes.ok) throw new Error(piData.error);

    const cardElement = elements.getElement(CardElement);
    const { error, paymentIntent } = await stripe.confirmCardPayment(piData.client_secret, {
      payment_method: { card: cardElement },
    });

    if (error) {
      setResultStatus('error');
      setResultMessage(error.message);
      setStep('result');
      return;
    }

    if (paymentIntent.status === 'succeeded') {
      // Record purchase
      await fetch('/api/stripe/record-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          amount,
          description,
          stripe_payment_intent_id: paymentIntent.id,
          payment_method: 'stripe',
        }),
      });

      setResultStatus('success');
      setResultMessage(`Charged ${formatPrice(amount)} for ${description}`);
      setStep('result');
    }
  }

  async function chargeWithSavedCard(paymentMethodId, amount, description) {
    const piRes = await fetch('/api/stripe/payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patient.id,
        amount,
        description,
        payment_method_id: paymentMethodId,
      }),
    });

    const piData = await piRes.json();
    if (!piRes.ok) throw new Error(piData.error);

    // If already succeeded (confirm=true on server), we're done
    if (piData.status === 'succeeded') {
      await fetch('/api/stripe/record-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          amount,
          description,
          stripe_payment_intent_id: piData.payment_intent_id,
          payment_method: 'stripe',
        }),
      });

      setResultStatus('success');
      setResultMessage(`Charged ${formatPrice(amount)} for ${description}`);
      setStep('result');
      return;
    }

    // If requires action (3D Secure etc)
    if (piData.status === 'requires_action' || piData.status === 'requires_confirmation') {
      const { error, paymentIntent } = await stripe.confirmCardPayment(piData.client_secret);

      if (error) {
        setResultStatus('error');
        setResultMessage(error.message);
        setStep('result');
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        await fetch('/api/stripe/record-purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patient.id,
            amount,
            description,
            stripe_payment_intent_id: paymentIntent.id,
            payment_method: 'stripe',
          }),
        });

        setResultStatus('success');
        setResultMessage(`Charged ${formatPrice(amount)} for ${description}`);
        setStep('result');
      }
    }
  }

  function handleClose() {
    setStep('select');
    setSelectedItem(null);
    setCustomAmount('');
    setCustomDescription('');
    setSelectedCard(null);
    setSaveNewCard(false);
    setResultStatus(null);
    setResultMessage('');
    onClose();
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <div style={modalStyles.overlay} onClick={handleClose} />
      <div style={modalStyles.modal}>
        {/* Header */}
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>
            {step === 'select' && 'Charge Patient'}
            {step === 'payment' && 'Payment Method'}
            {step === 'processing' && 'Processing...'}
            {step === 'result' && (resultStatus === 'success' ? 'Payment Complete' : 'Payment Failed')}
          </h2>
          <div style={modalStyles.patientName}>{patient.name}</div>
          <button style={modalStyles.closeBtn} onClick={handleClose}>×</button>
        </div>

        {/* Step 1: Service Selection */}
        {step === 'select' && (
          <div style={modalStyles.body}>
            {/* Category Tabs */}
            <div style={modalStyles.categoryTabs}>
              {POS_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  style={{
                    ...modalStyles.categoryTab,
                    ...(activeCategory === cat.id ? modalStyles.categoryTabActive : {}),
                  }}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSelectedItem(null);
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Service Items */}
            {activeCategory !== 'custom' ? (
              <div style={modalStyles.itemGrid}>
                {getItemsByCategory(activeCategory).map(item => (
                  <button
                    key={item.id}
                    style={{
                      ...modalStyles.itemCard,
                      ...(selectedItem?.id === item.id ? modalStyles.itemCardSelected : {}),
                    }}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div style={modalStyles.itemName}>{item.name}</div>
                    <div style={modalStyles.itemPrice}>
                      {formatPrice(item.price)}
                      {item.recurring && <span style={modalStyles.recurringBadge}>/mo</span>}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div style={modalStyles.customForm}>
                <div style={modalStyles.fieldGroup}>
                  <label style={modalStyles.label}>Amount ($)</label>
                  <input
                    type="number"
                    min="0.50"
                    step="0.01"
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    placeholder="0.00"
                    style={modalStyles.input}
                  />
                </div>
                <div style={modalStyles.fieldGroup}>
                  <label style={modalStyles.label}>Description</label>
                  <input
                    type="text"
                    value={customDescription}
                    onChange={e => setCustomDescription(e.target.value)}
                    placeholder="What is this charge for?"
                    style={modalStyles.input}
                  />
                </div>
              </div>
            )}

            {/* Charge Summary + Next */}
            <div style={modalStyles.footer}>
              {canProceedToPayment() && (
                <div style={modalStyles.summaryLine}>
                  {getChargeDescription()} — <strong>{formatPrice(getChargeAmount())}</strong>
                  {isRecurring() && ' /mo'}
                </div>
              )}
              <button
                style={{
                  ...modalStyles.primaryBtn,
                  ...(canProceedToPayment() ? {} : modalStyles.disabledBtn),
                }}
                disabled={!canProceedToPayment()}
                onClick={() => setStep('payment')}
              >
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment Method */}
        {step === 'payment' && (
          <div style={modalStyles.body}>
            <div style={modalStyles.chargeSummary}>
              <span>{getChargeDescription()}</span>
              <strong>{formatPrice(getChargeAmount())}{isRecurring() ? '/mo' : ''}</strong>
            </div>

            {loadingCards ? (
              <div style={modalStyles.loading}>Loading saved cards...</div>
            ) : (
              <>
                {/* Saved Cards */}
                {savedCards.length > 0 && (
                  <div style={modalStyles.cardList}>
                    <div style={modalStyles.sectionLabel}>Saved Cards</div>
                    {savedCards.map(card => (
                      <label key={card.id} style={modalStyles.cardOption}>
                        <input
                          type="radio"
                          name="payment_method"
                          checked={selectedCard === card.id}
                          onChange={() => setSelectedCard(card.id)}
                        />
                        <span style={modalStyles.cardBrand}>{card.brand.toUpperCase()}</span>
                        <span>•••• {card.last4}</span>
                        <span style={modalStyles.cardExp}>{card.exp_month}/{card.exp_year}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* New Card Option */}
                <div style={modalStyles.cardList}>
                  <label style={modalStyles.cardOption}>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selectedCard === 'new'}
                      onChange={() => setSelectedCard('new')}
                    />
                    <span>Add New Card</span>
                  </label>

                  {selectedCard === 'new' && (
                    <div style={modalStyles.cardElementWrapper}>
                      <CardElement options={CARD_ELEMENT_OPTIONS} />
                      <label style={modalStyles.saveCardLabel}>
                        <input
                          type="checkbox"
                          checked={saveNewCard}
                          onChange={e => setSaveNewCard(e.target.checked)}
                        />
                        Save card for future charges
                      </label>
                    </div>
                  )}
                </div>
              </>
            )}

            <div style={modalStyles.footer}>
              <button style={modalStyles.secondaryBtn} onClick={() => setStep('select')}>
                ← Back
              </button>
              <button
                style={modalStyles.primaryBtn}
                onClick={handlePay}
                disabled={!stripe}
              >
                {isRecurring()
                  ? `Subscribe ${formatPrice(getChargeAmount())}/mo`
                  : `Pay ${formatPrice(getChargeAmount())}`
                }
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <div style={modalStyles.body}>
            <div style={modalStyles.processingState}>
              <div style={modalStyles.spinner} />
              <p>Processing payment...</p>
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 'result' && (
          <div style={modalStyles.body}>
            <div style={modalStyles.resultState}>
              {resultStatus === 'success' ? (
                <>
                  <div style={modalStyles.successIcon}>✓</div>
                  <p style={modalStyles.resultText}>{resultMessage}</p>
                </>
              ) : (
                <>
                  <div style={modalStyles.errorIcon}>✗</div>
                  <p style={modalStyles.resultText}>{resultMessage}</p>
                </>
              )}
            </div>
            <div style={modalStyles.footer}>
              {resultStatus === 'error' && (
                <button style={modalStyles.secondaryBtn} onClick={() => setStep('payment')}>
                  Try Again
                </button>
              )}
              <button style={modalStyles.primaryBtn} onClick={handleClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
// Wrapper with Elements provider
// ============================================================
export default function POSChargeModal({ isOpen, onClose, patient, stripePromise }) {
  if (!isOpen || !patient) return null;

  return (
    <Elements stripe={stripePromise}>
      <POSChargeForm patient={patient} onClose={onClose} />
    </Elements>
  );
}

// ============================================================
// Stripe CardElement styling
// ============================================================
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1a1a1a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '::placeholder': { color: '#a0a0a0' },
    },
    invalid: { color: '#dc2626' },
  },
};

// ============================================================
// Styles
// ============================================================
const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#fff',
    borderRadius: '12px',
    width: '520px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1001,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  header: {
    padding: '20px 24px 16px',
    borderBottom: '1px solid #e5e7eb',
    position: 'relative',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#111',
  },
  patientName: {
    fontSize: '14px',
    color: '#666',
    marginTop: '4px',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#999',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
  },
  body: {
    padding: '16px 24px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  categoryTabs: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  categoryTab: {
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid #d1d5db',
    background: '#fff',
    fontSize: '13px',
    color: '#555',
    cursor: 'pointer',
    fontWeight: 500,
  },
  categoryTabActive: {
    background: '#16A34A',
    color: '#fff',
    border: '1px solid #16A34A',
  },
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '16px',
  },
  itemCard: {
    padding: '14px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    background: '#fafafa',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'border-color 0.15s',
  },
  itemCardSelected: {
    borderColor: '#16A34A',
    background: '#f0fdf4',
  },
  itemName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#111',
    marginBottom: '4px',
  },
  itemPrice: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#16A34A',
  },
  recurringBadge: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#666',
  },
  customForm: {
    marginBottom: '16px',
  },
  fieldGroup: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#555',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  footer: {
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '10px',
    flexWrap: 'wrap',
  },
  summaryLine: {
    flex: 1,
    fontSize: '14px',
    color: '#333',
  },
  primaryBtn: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    background: '#16A34A',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#333',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  disabledBtn: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  chargeSummary: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#f0fdf4',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '15px',
  },
  loading: {
    padding: '20px',
    textAlign: 'center',
    color: '#888',
  },
  cardList: {
    marginBottom: '12px',
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  cardOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    marginBottom: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  cardBrand: {
    fontWeight: 600,
    fontSize: '12px',
    color: '#333',
    background: '#f3f4f6',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  cardExp: {
    color: '#999',
    fontSize: '13px',
    marginLeft: 'auto',
  },
  cardElementWrapper: {
    padding: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    marginTop: '8px',
    background: '#fafafa',
  },
  saveCardLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px',
    fontSize: '13px',
    color: '#555',
    cursor: 'pointer',
  },
  processingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 0',
    color: '#555',
    fontSize: '15px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#16A34A',
    borderRadius: '50%',
    animation: 'pos-spin 0.8s linear infinite',
    marginBottom: '16px',
  },
  resultState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 0',
    textAlign: 'center',
  },
  successIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#16A34A',
    color: '#fff',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  errorIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#dc2626',
    color: '#fff',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  resultText: {
    fontSize: '15px',
    color: '#333',
    margin: 0,
  },
};
