// pages/shop/catalog.js — Browse peptide vials and add to cart
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { VIAL_CATALOG, VIAL_CATEGORIES } from '../../lib/vial-catalog';
import { ShoppingCart, Plus, Minus, LogOut, ChevronDown, ChevronUp, Info, ShieldCheck, X } from 'lucide-react';

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
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', margin: '6px 0 0' }}>
            {vial.clinicPriceCents > vial.priceCents && (
              <span style={{ fontSize: 13, color: '#999', textDecoration: 'line-through' }}>
                ${(vial.clinicPriceCents / 100).toFixed(2)}
              </span>
            )}
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>
              ${(vial.priceCents / 100).toFixed(2)}
            </span>
            {vial.clinicPriceCents > vial.priceCents && (
              <span style={{ fontSize: 11, color: '#15803d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Save ${((vial.clinicPriceCents - vial.priceCents) / 100).toFixed(2)}
              </span>
            )}
          </div>
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

function SourcingCard() {
  const [expanded, setExpanded] = useState(false);

  const pillars = [
    { title: 'U.S.-made, FMOC-verified synthesis', desc: 'Each amino acid is independently verified before the next is added — no shortcuts, no hidden defects.' },
    { title: 'Multi-layer testing on every batch', desc: 'HPLC, LC-MS/MS, NMR spectroscopy, and endotoxin testing confirm purity, sequence, structure, and safety.' },
    { title: 'Pharmaceutical-grade USP Type I glass', desc: 'The same vial standard used for hospital injectables. Engineered to release zero endotoxins or heavy metals.' },
    { title: 'Cold-chain delivery, days from lab to vial', desc: 'Temperature-controlled the whole way. No customs delays, no warehouse heat, no surprises.' },
  ];

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e5e5', marginBottom: 20 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
      >
        <ShieldCheck size={20} color="#15803d" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Why Our Peptides Are Different</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>U.S.-manufactured. Pharmaceutical-grade. Verified.</div>
        </div>
        {expanded ? <ChevronUp size={18} color="#999" /> : <ChevronDown size={18} color="#999" />}
      </button>
      {expanded && (
        <div style={{ padding: '4px 18px 18px', borderTop: '1px solid #f0f0f0' }}>
          <p style={{ fontSize: 13, color: '#444', margin: '14px 0 16px', lineHeight: 1.6 }}>
            Two peptides can look identical in the bottle and behave completely differently in your body. The difference is process discipline — how the peptide is built, verified, stored, and shipped. Range Medical sources exclusively from documented U.S.-based manufacturers.
          </p>
          <div style={{ display: 'grid', gap: 12 }}>
            {pillars.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f0fdf4', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2, lineHeight: 1.5 }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#666', margin: '16px 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>
            We do not source from gray-market or overseas mass-market suppliers. Every batch is documented before it is dispensed.
          </p>
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
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('shop_cart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('shop_cart', JSON.stringify(cart));
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

  const removeItemFully = (vialId) => {
    setCart(prev => {
      const next = { ...prev };
      delete next[vialId];
      return next;
    });
  };

  const clearCart = () => {
    setCart({});
    setCartOpen(false);
  };

  const cartCount = Object.values(cart).reduce((sum, q) => sum + q, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const vial = VIAL_CATALOG.find(v => v.id === id);
    return sum + (vial ? vial.priceCents * qty : 0);
  }, 0);

  const filteredVials = activeCategory
    ? VIAL_CATALOG.filter(v => v.category === activeCategory && !v.shopHidden && !v.isAddOn)
    : VIAL_CATALOG.filter(v => !v.shopHidden && !v.isAddOn);

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

        <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 20px 110px' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Peptide Vials</h2>
          <p style={{ fontSize: 14, color: '#666', margin: '0 0 14px' }}>Select vials to add to your order. Each vial includes reconstitution instructions.</p>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Member Pricing</div>
            <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.5 }}>
              You're seeing significant savings off our clinic walk-in rates. Stock up at your member price.
            </div>
          </div>

          <SourcingCard />

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
              const catVials = VIAL_CATALOG.filter(v => v.category === cat.id && !v.shopHidden && !v.isAddOn);
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
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#171717', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, gap: 12 }}>
            <button
              onClick={() => setCartOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 0, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', textAlign: 'left' }}
            >
              <ShoppingCart size={18} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{cartCount} item{cartCount !== 1 ? 's' : ''} · ${(cartTotal / 100).toFixed(2)}</div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>Tap to view cart</div>
              </div>
            </button>
            <button
              onClick={() => router.push('/shop/checkout')}
              style={{ padding: '10px 24px', background: '#fff', color: '#171717', border: 'none', borderRadius: 0, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Checkout
            </button>
          </div>
        )}

        {/* Cart drawer (slides up from bottom) */}
        {cartOpen && (
          <div
            onClick={() => setCartOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', width: '100%', maxWidth: 640, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Your Cart</h2>
                  <p style={{ fontSize: 12, color: '#666', margin: '2px 0 0' }}>{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: '#666' }}>
                  <X size={22} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px' }}>
                {cartCount === 0 ? (
                  <p style={{ fontSize: 14, color: '#666', padding: '32px 0', textAlign: 'center' }}>Your cart is empty.</p>
                ) : (
                  Object.entries(cart).map(([id, qty]) => {
                    const vial = VIAL_CATALOG.find(v => v.id === id);
                    if (!vial) return null;
                    return (
                      <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid #f0f0f0', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{vial.name}</div>
                          {vial.subtitle && <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{vial.subtitle}</div>}
                          <div style={{ fontSize: 13, color: '#444', marginTop: 6 }}>
                            <strong>${((vial.priceCents * qty) / 100).toFixed(2)}</strong>
                            <span style={{ color: '#999', marginLeft: 6 }}>(${(vial.priceCents / 100).toFixed(2)} ea)</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button onClick={() => removeFromCart(id)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #d1d1d1', background: '#fff', cursor: 'pointer', borderRadius: 0 }}>
                              <Minus size={12} />
                            </button>
                            <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{qty}</span>
                            <button onClick={() => addToCart(id)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #171717', background: '#171717', color: '#fff', cursor: 'pointer', borderRadius: 0 }}>
                              <Plus size={12} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItemFully(id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, padding: 0, fontFamily: 'inherit' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ borderTop: '1px solid #e5e5e5', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cartCount > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, color: '#666' }}>Subtotal</span>
                      <span style={{ fontSize: 18, fontWeight: 700 }}>${(cartTotal / 100).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={clearCart}
                        style={{ flex: 1, padding: '12px', background: '#fff', color: '#b91c1c', border: '1px solid #fecaca', cursor: 'pointer', fontSize: 13, fontWeight: 700, borderRadius: 0, fontFamily: 'inherit' }}
                      >
                        Clear Cart
                      </button>
                      <button
                        onClick={() => { setCartOpen(false); router.push('/shop/checkout'); }}
                        style={{ flex: 2, padding: '12px', background: '#171717', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, borderRadius: 0, fontFamily: 'inherit' }}
                      >
                        Checkout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
