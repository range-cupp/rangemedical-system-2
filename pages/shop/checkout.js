// pages/shop/checkout.js — Shipping + Stripe payment
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { VIAL_CATALOG, SHIPPING_OPTIONS } from '../../lib/vial-catalog';
import { ArrowLeft, ChevronDown } from 'lucide-react';

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

function PaymentForm({ onSuccess, totalCents }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setPayError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/shop/confirmation` },
        redirect: 'if_required',
      });
      if (error) throw new Error(error.message);
      if (paymentIntent?.status === 'succeeded') onSuccess(paymentIntent.id);
    } catch (err) {
      setPayError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {payError && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{payError}</p>}
      <button
        type="submit"
        disabled={!stripe || processing}
        style={{ width: '100%', marginTop: 20, padding: 16, background: '#171717', color: '#fff', border: 'none', borderRadius: 0, fontSize: 16, fontWeight: 600, cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.6 : 1, fontFamily: 'inherit' }}
      >
        {processing ? 'Processing...' : `Pay $${(totalCents / 100).toFixed(2)}`}
      </button>
    </form>
  );
}

export default function ShopCheckout() {
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [token, setToken] = useState(null);
  const [cart, setCart] = useState({});
  const [step, setStep] = useState('shipping'); // shipping, payment
  const [shippingMethod, setShippingMethod] = useState('pickup_nb');
  const [address, setAddress] = useState({ name: '', street: '', street2: '', city: '', state: 'CA', zip: '' });
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [promoCode, setPromoCode] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('shop_token');
    const p = localStorage.getItem('shop_patient');
    const c = localStorage.getItem('shop_cart');
    if (!t || !p) { router.replace('/shop'); return; }
    if (!c || Object.keys(JSON.parse(c)).length === 0) { router.replace('/shop/catalog'); return; }
    setToken(t);
    setPatient(JSON.parse(p));
    setCart(JSON.parse(c));
    // Pre-fill shipping name
    const patientData = JSON.parse(p);
    setAddress(prev => ({ ...prev, name: patientData.name }));
  }, []);

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const vial = VIAL_CATALOG.find(v => v.id === id);
    return vial ? { ...vial, quantity: qty } : null;
  }).filter(Boolean);

  const subtotalCents = cartItems.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const shippingOption = SHIPPING_OPTIONS.find(s => s.id === shippingMethod);
  const shippingCents = shippingOption ? shippingOption.price : 0;
  const totalCents = subtotalCents + shippingCents;
  const isPickup = shippingMethod.startsWith('pickup');

  const isTestMode = promoCode.toUpperCase() === 'RANGETEST';

  const handleTestOrder = async () => {
    setConfirming(true);
    try {
      const res = await fetch('/api/shop/confirm-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          paymentIntentId: 'test_' + Date.now(),
          items: cartItems.map(i => ({ peptideId: i.id, quantity: i.quantity })),
          shippingMethod,
          shippingAddress: isPickup ? null : address,
          testMode: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.removeItem('shop_cart');
      localStorage.setItem('shop_last_order', JSON.stringify({
        orderNumber: data.orderNumber,
        items: cartItems,
        subtotalCents,
        shippingCents,
        totalCents: 0,
        shippingMethod,
        shippingAddress: isPickup ? null : address,
      }));
      router.push('/shop/confirmation');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setConfirming(false);
    }
  };

  const proceedToPayment = async () => {
    if (!isPickup) {
      if (!address.name || !address.street || !address.city || !address.state || !address.zip) {
        alert('Please fill in all shipping fields.');
        return;
      }
    }

    if (isTestMode) {
      handleTestOrder();
      return;
    }

    try {
      const res = await fetch('/api/shop/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ totalCents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setStep('payment');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handlePaymentSuccess = async (piId) => {
    setConfirming(true);
    try {
      const res = await fetch('/api/shop/confirm-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          paymentIntentId: piId,
          items: cartItems.map(i => ({ peptideId: i.id, quantity: i.quantity })),
          shippingMethod,
          shippingAddress: isPickup ? null : address,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.removeItem('shop_cart');
      localStorage.setItem('shop_last_order', JSON.stringify({
        orderNumber: data.orderNumber,
        items: cartItems,
        subtotalCents,
        shippingCents,
        totalCents,
        shippingMethod,
        shippingAddress: isPickup ? null : address,
      }));
      router.push('/shop/confirmation');
    } catch (err) {
      alert('Payment succeeded but order confirmation failed. Please contact us at (949) 997-3988. Reference: ' + piId);
    } finally {
      setConfirming(false);
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
          <button onClick={() => step === 'payment' ? setStep('shipping') : router.push('/shop/catalog')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1, margin: 0 }}>RANGE MEDICAL</h1>
            <p style={{ fontSize: 12, color: '#666', margin: 0 }}>{step === 'shipping' ? 'Shipping' : 'Payment'}</p>
          </div>
        </div>

        <div style={{ maxWidth: 520, margin: '0 auto', padding: 20 }}>
          {/* Order summary */}
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', padding: '16px 20px', marginBottom: 20 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#999', margin: '0 0 12px' }}>Order Summary</h3>
            {cartItems.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                <span>{item.quantity}x {item.name}</span>
                <span style={{ fontWeight: 600 }}>${((item.priceCents * item.quantity) / 100).toFixed(2)}</span>
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
                <span>${(totalCents / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

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
                <label style={labelStyle}>Promo Code (optional)</label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  placeholder="Enter code"
                  style={{ ...inputStyle, marginBottom: 16 }}
                />
              </div>

              <button
                onClick={proceedToPayment}
                disabled={confirming}
                style={{ width: '100%', padding: 16, background: '#171717', color: '#fff', border: 'none', borderRadius: 0, fontSize: 16, fontWeight: 600, cursor: confirming ? 'not-allowed' : 'pointer', opacity: confirming ? 0.6 : 1, fontFamily: 'inherit' }}
              >
                {confirming ? 'Processing...' : isTestMode ? 'Place Test Order ($0.00)' : 'Continue to Payment'}
              </button>
            </div>
          )}

          {step === 'payment' && clientSecret && (
            <div style={{ background: '#fff', border: '1px solid #e5e5e5', padding: '20px' }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#999', margin: '0 0 16px' }}>Payment</h3>
              {confirming ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <p style={{ fontSize: 15, color: '#666' }}>Confirming your order...</p>
                </div>
              ) : (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { borderRadius: '0px' } } }}>
                  <PaymentForm onSuccess={handlePaymentSuccess} totalCents={totalCents} />
                </Elements>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
