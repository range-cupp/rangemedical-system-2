// pages/shop/catalog.js — Browse peptide vials and add to cart
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { VIAL_CATALOG, VIAL_CATEGORIES } from '../../lib/vial-catalog';
import { ShoppingCart, Plus, Minus, LogOut, ChevronDown, ChevronUp, Info } from 'lucide-react';

function useAuth() {
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('shop_token');
    const p = localStorage.getItem('shop_patient');
    if (!t || !p) { router.replace('/shop'); return; }
    setToken(t);
    setPatient(JSON.parse(p));
  }, []);

  const logout = () => {
    localStorage.removeItem('shop_token');
    localStorage.removeItem('shop_patient');
    localStorage.removeItem('shop_cart');
    router.push('/shop');
  };

  return { patient, token, logout };
}

function VialCard({ vial, quantity, onAdd, onRemove }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e5e5', marginBottom: 12 }}>
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{vial.name}</h3>
            <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#999' }}>
              {expanded ? <ChevronUp size={16} /> : <Info size={16} />}
            </button>
          </div>
          <p style={{ fontSize: 13, color: '#666', margin: '2px 0 0' }}>{vial.subtitle}</p>
          <p style={{ fontSize: 12, color: '#999', margin: '3px 0 0' }}>{vial.vialSize}</p>
          <p style={{ fontSize: 14, fontWeight: 600, margin: '6px 0 0' }}>${(vial.priceCents / 100).toFixed(2)}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {quantity > 0 && (
            <>
              <button onClick={onRemove} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #d1d1d1', background: '#fff', cursor: 'pointer', borderRadius: 0 }}>
                <Minus size={14} />
              </button>
              <span style={{ fontSize: 15, fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{quantity}</span>
            </>
          )}
          <button onClick={onAdd} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #171717', background: '#171717', color: '#fff', cursor: 'pointer', borderRadius: 0 }}>
            <Plus size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 20px 16px', borderTop: '1px solid #f0f0f0', marginTop: 0, paddingTop: 12 }}>
          <p style={{ fontSize: 13, color: '#444', margin: '0 0 8px', lineHeight: 1.5 }}>{vial.description}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 12, color: '#666' }}>
            <div><strong>Vial:</strong> {vial.vialSize}</div>
            <div><strong>Dose:</strong> {vial.dosage}</div>
            <div><strong>Frequency:</strong> {vial.frequency}</div>
            <div><strong>Injections/vial:</strong> {vial.injectionsPerVial}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopCatalog() {
  const { patient, logout } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState({});
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('shop_cart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (Object.keys(cart).length > 0) {
      localStorage.setItem('shop_cart', JSON.stringify(cart));
    }
  }, [cart]);

  const addToCart = (vialId) => {
    setCart(prev => ({ ...prev, [vialId]: Math.min((prev[vialId] || 0) + 1, 100) }));
  };

  const removeFromCart = (vialId) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[vialId] > 1) next[vialId]--;
      else delete next[vialId];
      return next;
    });
  };

  const cartCount = Object.values(cart).reduce((sum, q) => sum + q, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const vial = VIAL_CATALOG.find(v => v.id === id);
    return sum + (vial ? vial.priceCents * qty : 0);
  }, 0);

  const filteredVials = activeCategory
    ? VIAL_CATALOG.filter(v => v.category === activeCategory)
    : VIAL_CATALOG;

  if (!patient) return null;

  return (
    <>
      <Head>
        <title>Range Medical</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1, margin: 0 }}>RANGE MEDICAL</h1>
            <p style={{ fontSize: 12, color: '#666', margin: 0 }}>Hi, {patient.name.split(' ')[0]}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {cartCount > 0 && (
              <button
                onClick={() => router.push('/shop/checkout')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#171717', color: '#fff', border: 'none', borderRadius: 0, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <ShoppingCart size={16} />
                {cartCount} — ${(cartTotal / 100).toFixed(2)}
              </button>
            )}
            <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: '#999' }}>
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 640, margin: '0 auto', padding: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Peptide Vials</h2>
          <p style={{ fontSize: 14, color: '#666', margin: '0 0 20px' }}>Select vials to add to your order. Each vial includes reconstitution instructions.</p>

          {/* Category filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            <button
              onClick={() => setActiveCategory(null)}
              style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, border: '1px solid', borderColor: !activeCategory ? '#171717' : '#d1d1d1', background: !activeCategory ? '#171717' : '#fff', color: !activeCategory ? '#fff' : '#333', cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit' }}
            >
              All
            </button>
            {VIAL_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, border: '1px solid', borderColor: activeCategory === cat.id ? '#171717' : '#d1d1d1', background: activeCategory === cat.id ? '#171717' : '#fff', color: activeCategory === cat.id ? '#fff' : '#333', cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit' }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Vial listing */}
          {activeCategory ? (
            filteredVials.map(vial => (
              <VialCard key={vial.id} vial={vial} quantity={cart[vial.id] || 0} onAdd={() => addToCart(vial.id)} onRemove={() => removeFromCart(vial.id)} />
            ))
          ) : (
            VIAL_CATEGORIES.map(cat => {
              const catVials = VIAL_CATALOG.filter(v => v.category === cat.id);
              if (catVials.length === 0) return null;
              return (
                <div key={cat.id} style={{ marginBottom: 28 }}>
                  <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#999', margin: '0 0 10px', borderBottom: '1px solid #e5e5e5', paddingBottom: 6 }}>{cat.label}</h3>
                  {catVials.map(vial => (
                    <VialCard key={vial.id} vial={vial} quantity={cart[vial.id] || 0} onAdd={() => addToCart(vial.id)} onRemove={() => removeFromCart(vial.id)} />
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* Floating cart bar */}
        {cartCount > 0 && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#171717', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
            <div style={{ color: '#fff' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
              <span style={{ fontSize: 14, color: '#aaa', marginLeft: 8 }}>${(cartTotal / 100).toFixed(2)}</span>
            </div>
            <button
              onClick={() => router.push('/shop/checkout')}
              style={{ padding: '10px 24px', background: '#fff', color: '#171717', border: 'none', borderRadius: 0, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
