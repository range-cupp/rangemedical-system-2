// pages/shop/checkout.js — Shipping + order submission (invoice-based, no payment)
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { VIAL_CATALOG, SHIPPING_OPTIONS } from '../../lib/vial-catalog';
import { ArrowLeft } from 'lucide-react';

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

export default function ShopCheckout() {
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [token, setToken] = useState(null);
  const [cart, setCart] = useState({});
  const [shippingMethod, setShippingMethod] = useState('pickup_nb');
  const [address, setAddress] = useState({ name: '', street: '', street2: '', city: '', state: 'CA', zip: '' });
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const vial = VIAL_CATALOG.find(v => v.id === id);
    return vial ? { ...vial, quantity: qty } : null;
  }).filter(Boolean);

  const subtotalCents = cartItems.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const shippingOption = SHIPPING_OPTIONS.find(s => s.id === shippingMethod);
  const shippingCents = shippingOption ? shippingOption.price : 0;
  const totalCents = subtotalCents + shippingCents;
  const isPickup = shippingMethod.startsWith('pickup');

  const handleSubmitOrder = async () => {
    if (!isPickup) {
      if (!address.name || !address.street || !address.city || !address.state || !address.zip) {
        alert('Please fill in all shipping fields.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/shop/submit-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: cartItems.map(i => ({ peptideId: i.id, quantity: i.quantity })),
          shippingMethod,
          shippingAddress: isPickup ? null : address,
          notes: notes.trim() || null,
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
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
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

          {/* Shipping + Submit */}
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

            {/* Optional notes */}
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

            {/* How it works callout */}
            <div style={{ background: '#f8f8f8', padding: '14px 16px', marginBottom: 20, fontSize: 13, color: '#555', lineHeight: 1.5 }}>
              <strong style={{ color: '#171717' }}>How it works:</strong> Submit your order and we'll send you an invoice to pay. Once payment is received, we'll ship or prepare your order for pickup.
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={submitting}
              style={{ width: '100%', padding: 16, background: '#171717', color: '#fff', border: 'none', borderRadius: 0, fontSize: 16, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, fontFamily: 'inherit' }}
            >
              {submitting ? 'Submitting...' : 'Submit Order'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
