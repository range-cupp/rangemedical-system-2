// pages/shop/checkout.js — Inline Stripe Payment Element checkout (no redirect)
// Step 1: shipping form → Step 2: Stripe Payment Element → confirm-order → /shop/confirmation
import Head from 'next/head';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { VIAL_CATALOG, SHIPPING_OPTIONS, getShopAddOns } from '../../lib/vial-catalog';
import { ArrowLeft, X, Plus, Minus } from 'lucide-react';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const inputStyle = {
  width: '100%', padding: '12px 14px', border: '1px solid #d1d1d1', borderRadius: 0,
  fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
};
const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: 0.5,
};

// ── Stripe Payment Form (inside <Elements>) ─────────────────────────────────
function PaymentForm({ amountLabel, onSuccess, onBack }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [payError, setPayError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || processing || completing) return;
    setProcessing(true);
    setPayError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/shop/confirmation`,
        },
        redirect: 'if_required',
      });

      if (error) throw new Error(error.message);
      if (paymentIntent?.status === 'succeeded') {
        setProcessing(false);
        setCompleting(true);
        await onSuccess(paymentIntent.id);
      }
    } catch (err) {
      setPayError(err.message);
      setProcessing(false);
    }
  };

  const busy = processing || completing;
  const label = completing ? 'Confirming…' : processing ? 'Processing…' : `Pay ${amountLabel}`;

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {payError && (
        <p style={{ color: '#dc2626', fontSize: 14, margin: '12px 0 0' }}>{payError}</p>
      )}
      <button
        type="submit"
        disabled={!stripe || busy}
        style={{
          width: '100%', marginTop: 16, padding: 16,
          background: busy ? '#333' : '#171717', color: '#fff',
          border: 'none', borderRadius: 0, fontSize: 16, fontWeight: 600,
          cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.85 : 1,
          fontFamily: 'inherit', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 10,
        }}
      >
        {busy && (
          <span style={{
            display: 'inline-block', width: 18, height: 18,
            border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
            borderRadius: '50%', animation: 'shopSpin 0.6s linear infinite',
          }} />
        )}
        {label}
      </button>
      <button
        type="button"
        onClick={onBack}
        disabled={busy}
        style={{
          background: 'none', border: 'none', color: '#737373',
          fontSize: 13, cursor: busy ? 'not-allowed' : 'pointer',
          marginTop: 12, padding: 0, fontFamily: 'inherit',
        }}
      >
        ← Back to shipping
      </button>
      <style>{`@keyframes shopSpin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ textAlign: 'center', fontSize: 12, color: '#a3a3a3', marginTop: 14, marginBottom: 0 }}>
        Secure checkout by Stripe. Your card statement will show <strong>RANGE MEDICAL</strong>.
      </p>
    </form>
  );
}

export default function ShopCheckout() {
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [token, setToken] = useState(null);
  const [cart, setCart] = useState({});
  const [shippingMethod, setShippingMethod] = useState('pickup_nb');
  const [address, setAddress] = useState({ name: '', street: '', street2: '', city: '', state: 'CA', zip: '' });
  const [notes, setNotes] = useState('');

  // payment state
  const [step, setStep] = useState('shipping'); // 'shipping' | 'payment'
  const [clientSecret, setClientSecret] = useState(null);
  const [initializing, setInitializing] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('shop_token');
    const p = localStorage.getItem('shop_patient');
    const c = localStorage.getItem('shop_cart');
    if (!t || !p) { router.replace('/shop'); return; }
    if (!c || Object.keys(JSON.parse(c)).length === 0) { router.replace('/shop/catalog'); return; }
    setToken(t);
    setPatient(JSON.parse(p));
    setCart(JSON.parse(c));
    const patientData = JSON.parse(p);
    setAddress(prev => ({ ...prev, name: patientData.name }));
  }, []);

  const cartItems = useMemo(() =>
    Object.entries(cart).map(([id, qty]) => {
      const vial = VIAL_CATALOG.find(v => v.id === id);
      return vial ? { ...vial, quantity: qty } : null;
    }).filter(Boolean),
  [cart]);

  const addOns = useMemo(() => getShopAddOns(), []);

  function updateQuantity(id, qty) {
    const clamped = Math.min(100, Math.max(0, qty));
    const next = clamped <= 0
      ? Object.fromEntries(Object.entries(cart).filter(([k]) => k !== id))
      : { ...cart, [id]: clamped };
    setCart(next);
    localStorage.setItem('shop_cart', JSON.stringify(next));
    // Cart total changed — invalidate any payment intent so it gets recreated with the new total
    if (step === 'payment') {
      setClientSecret(null);
      setStep('shipping');
    }
  }

  const removeCartItem = (id) => updateQuantity(id, 0);
  const updateAddOn = (id, qty) => updateQuantity(id, qty);

  // Bounce back to catalog if cart becomes empty mid-checkout
  useEffect(() => {
    if (patient && cartItems.length === 0) {
      router.replace('/shop/catalog');
    }
  }, [patient, cartItems.length, router]);

  const subtotalCents = cartItems.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const shippingOption = SHIPPING_OPTIONS.find(s => s.id === shippingMethod);
  const shippingCents = shippingOption ? shippingOption.price : 0;
  const totalCents = subtotalCents + shippingCents;
  const isPickup = shippingMethod.startsWith('pickup');
  const amountLabel = `$${(totalCents / 100).toFixed(2)}`;

  const handleContinueToPayment = async () => {
    if (!isPickup) {
      if (!address.name || !address.street || !address.city || !address.state || !address.zip) {
        alert('Please fill in all shipping fields.');
        return;
      }
    }

    setInitializing(true);
    setInitError(null);
    try {
      const res = await fetch('/api/shop/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: cartItems.map(i => ({ peptideId: i.id, quantity: i.quantity })),
          shippingMethod,
        }),
      });
      if (res.status === 401) {
        localStorage.removeItem('shop_token');
        localStorage.removeItem('shop_patient');
        router.replace('/shop?expired=1');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not initialize payment');
      setClientSecret(data.clientSecret);
      setStep('payment');
    } catch (err) {
      setInitError(err.message);
    } finally {
      setInitializing(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId) => {
    try {
      const res = await fetch('/api/shop/confirm-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          paymentIntentId,
          items: cartItems.map(i => ({ peptideId: i.id, quantity: i.quantity })),
          shippingMethod,
          shippingAddress: isPickup ? null : address,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order recording failed');

      localStorage.removeItem('shop_cart');
      localStorage.setItem('shop_last_order', JSON.stringify({
        orderNumber: data.orderNumber,
        items: cartItems,
        subtotalCents,
        shippingCents,
        totalCents,
        shippingMethod,
        shippingAddress: isPickup ? null : address,
        paid: true,
      }));
      router.push('/shop/confirmation');
    } catch (err) {
      alert('Payment succeeded but order recording failed. Please call (949) 997-3988. Error: ' + err.message);
    }
  };

  if (!patient || cartItems.length === 0) return null;

  return (
    <>
      <Head>
        <title>Checkout — Range Medical</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/shop/catalog')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1, margin: 0 }}>RANGE MEDICAL</h1>
            <p style={{ fontSize: 12, color: '#666', margin: 0 }}>Checkout</p>
          </div>
        </div>

        <div style={{ maxWidth: 520, margin: '0 auto', padding: 20 }}>
          {/* Order summary */}
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', padding: '16px 20px', marginBottom: 20 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#999', margin: '0 0 12px' }}>Order Summary</h3>
            {cartItems.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 14, gap: 8, borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ flex: 1, minWidth: 0 }}>{item.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label={`Decrease ${item.name}`}
                    style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #d1d1d1', background: '#fff', cursor: 'pointer', borderRadius: 0 }}
                  >
                    <Minus size={12} />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label={`Increase ${item.name}`}
                    style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #171717', background: '#171717', color: '#fff', cursor: 'pointer', borderRadius: 0 }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <span style={{ fontWeight: 600, minWidth: 64, textAlign: 'right' }}>${((item.priceCents * item.quantity) / 100).toFixed(2)}</span>
                <button
                  onClick={() => removeCartItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: '#999' }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 8, paddingTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: '#666' }}>
                <span>Subtotal</span>
                <span>${(subtotalCents / 100).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: '#666' }}>
                <span>Shipping</span>
                <span>{shippingCents > 0 ? `$${(shippingCents / 100).toFixed(2)}` : 'FREE'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontSize: 16, fontWeight: 700, borderTop: '1px solid #e5e5e5', marginTop: 4 }}>
                <span>Total</span>
                <span>{amountLabel}</span>
              </div>
            </div>
          </div>

          {/* Add-Ons (BAC water, etc.) — shipping step only so we re-create the payment intent if added */}
          {step === 'shipping' && addOns.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e5e5', padding: '16px 20px', marginBottom: 20 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#999', margin: '0 0 12px' }}>Add On</h3>
              {addOns.map(addon => {
                const qty = cart[addon.id] || 0;
                return (
                  <div key={addon.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '4px 0', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{addon.name}</div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                        {addon.manufacturer ? `${addon.manufacturer} · ` : ''}{addon.subtitle}
                      </div>
                      {addon.description && (
                        <div style={{ fontSize: 12, color: '#444', marginTop: 4, lineHeight: 1.4 }}>{addon.description}</div>
                      )}
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginTop: 6 }}>${(addon.priceCents / 100).toFixed(2)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      {qty > 0 ? (
                        <>
                          <button onClick={() => updateAddOn(addon.id, qty - 1)} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #d1d1d1', background: '#fff', cursor: 'pointer', borderRadius: 0, fontSize: 16, lineHeight: 1, fontFamily: 'inherit' }}>−</button>
                          <span style={{ fontSize: 14, fontWeight: 700, minWidth: 22, textAlign: 'center' }}>{qty}</span>
                          <button onClick={() => updateAddOn(addon.id, qty + 1)} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #171717', background: '#171717', color: '#fff', cursor: 'pointer', borderRadius: 0, fontSize: 16, lineHeight: 1, fontFamily: 'inherit' }}>+</button>
                        </>
                      ) : (
                        <button onClick={() => updateAddOn(addon.id, 1)} style={{ padding: '8px 16px', background: '#171717', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit' }}>Add</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 1: Shipping */}
          {step === 'shipping' && (
            <div style={{ background: '#fff', border: '1px solid #e5e5e5', padding: '20px' }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#999', margin: '0 0 16px' }}>Delivery Method</h3>

              {SHIPPING_OPTIONS.map(opt => (
                <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 6, border: '1px solid', borderColor: shippingMethod === opt.id ? '#171717' : '#e5e5e5', background: shippingMethod === opt.id ? '#f8f8f8' : '#fff', cursor: 'pointer' }}>
                  <input type="radio" name="shipping" checked={shippingMethod === opt.id} onChange={() => setShippingMethod(opt.id)} style={{ accentColor: '#171717' }} />
                  <span style={{ flex: 1, fontSize: 14 }}>{opt.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{opt.price > 0 ? `$${(opt.price / 100).toFixed(2)}` : 'Free'}</span>
                </label>
              ))}

              {!isPickup && (
                <div style={{ marginTop: 20 }}>
                  <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#999', margin: '0 0 16px' }}>Shipping Address</h3>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Full Name</label>
                    <input type="text" value={address.name} onChange={e => setAddress({ ...address, name: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Street Address</label>
                    <input type="text" value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Apt / Suite (optional)</label>
                    <input type="text" value={address.street2} onChange={e => setAddress({ ...address, street2: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={labelStyle}>City</label>
                      <input type="text" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>State</label>
                      <select value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} style={{ ...inputStyle, appearance: 'none' }}>
                        {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>ZIP</label>
                      <input type="text" value={address.zip} onChange={e => setAddress({ ...address, zip: e.target.value })} maxLength={10} style={inputStyle} />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20 }}>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any special requests or instructions"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', marginBottom: 16 }}
                />
              </div>

              {initError && (
                <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', fontSize: 14, marginBottom: 16 }}>
                  {initError}
                </div>
              )}

              <button
                onClick={handleContinueToPayment}
                disabled={initializing}
                style={{ width: '100%', padding: 16, background: '#171717', color: '#fff', border: 'none', borderRadius: 0, fontSize: 16, fontWeight: 600, cursor: initializing ? 'not-allowed' : 'pointer', opacity: initializing ? 0.6 : 1, fontFamily: 'inherit' }}
              >
                {initializing ? 'Setting up payment…' : `Continue to Payment — ${amountLabel}`}
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 'payment' && clientSecret && stripePromise && (
            <div style={{ background: '#fff', border: '1px solid #e5e5e5', padding: '20px' }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#999', margin: '0 0 16px' }}>Payment</h3>
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                <PaymentForm
                  amountLabel={amountLabel}
                  onSuccess={handlePaymentSuccess}
                  onBack={() => { setStep('shipping'); setClientSecret(null); }}
                />
              </Elements>
            </div>
          )}

          {step === 'payment' && !stripePromise && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '14px 16px', fontSize: 14 }}>
              Stripe is not configured. Please contact support.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
