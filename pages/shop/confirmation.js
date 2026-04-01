// pages/shop/confirmation.js — Order confirmation page
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle } from 'lucide-react';
import { SHIPPING_OPTIONS } from '../../lib/vial-catalog';

export default function ShopConfirmation() {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const p = localStorage.getItem('shop_patient');
    const o = localStorage.getItem('shop_last_order');
    if (!p) { router.replace('/shop'); return; }
    if (!o) { router.replace('/shop/catalog'); return; }
    setPatient(JSON.parse(p));
    setOrder(JSON.parse(o));
  }, []);

  if (!order || !patient) return null;

  const shippingOption = SHIPPING_OPTIONS.find(s => s.id === order.shippingMethod);
  const isPickup = order.shippingMethod.startsWith('pickup');

  return (
    <>
      <Head>
        <title>Order Confirmed — Range Medical</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 520, padding: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', padding: '40px 32px', textAlign: 'center' }}>
            <CheckCircle size={48} color="#16a34a" style={{ marginBottom: 16 }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Order Confirmed</h1>
            <p style={{ fontSize: 14, color: '#666', margin: '0 0 8px' }}>Thank you, {patient.name.split(' ')[0]}!</p>
            <p style={{ fontSize: 13, color: '#999', margin: '0 0 28px' }}>Order #{order.orderNumber}</p>

            {/* Items */}
            <div style={{ textAlign: 'left', borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
              {order.items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                  <span>{item.quantity}x {item.name}</span>
                  <span style={{ fontWeight: 600 }}>${((item.priceCents * item.quantity) / 100).toFixed(2)}</span>
                </div>
              ))}

              <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 10, paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: '#666' }}>
                  <span>Subtotal</span>
                  <span>${(order.subtotalCents / 100).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: '#666' }}>
                  <span>Shipping</span>
                  <span>{order.shippingCents > 0 ? `$${(order.shippingCents / 100).toFixed(2)}` : 'FREE'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontSize: 16, fontWeight: 700, borderTop: '1px solid #e5e5e5', marginTop: 4 }}>
                  <span>Total</span>
                  <span>${(order.totalCents / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Delivery info */}
            <div style={{ textAlign: 'left', marginTop: 20, background: '#f8f8f8', padding: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#999', margin: '0 0 6px' }}>
                {isPickup ? 'Pickup Location' : 'Shipping To'}
              </p>
              {isPickup ? (
                <p style={{ fontSize: 14, margin: 0 }}>{shippingOption?.label}</p>
              ) : (
                <>
                  <p style={{ fontSize: 14, margin: 0 }}>{order.shippingAddress.name}</p>
                  <p style={{ fontSize: 14, margin: 0 }}>{order.shippingAddress.street}{order.shippingAddress.street2 ? `, ${order.shippingAddress.street2}` : ''}</p>
                  <p style={{ fontSize: 14, margin: 0 }}>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                </>
              )}
            </div>

            <p style={{ fontSize: 13, color: '#666', marginTop: 20 }}>
              A detailed receipt has been sent to <strong>{patient.email}</strong>.
            </p>

            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button
                onClick={() => router.push('/shop/catalog')}
                style={{ flex: 1, padding: 14, background: '#171717', color: '#fff', border: 'none', borderRadius: 0, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Continue Shopping
              </button>
            </div>
          </div>

          <p style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 20 }}>
            Questions? Call or text (949) 997-3988
          </p>
        </div>
      </div>
    </>
  );
}
