// /pages/admin/quotes/new.js
// Build a new custom pricing quote
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout, { sharedStyles as s } from '../../../components/AdminLayout';

const blankItem = () => ({ name: '', description: '', price: '', qty: 1 });

export default function NewQuote() {
  const router = useRouter();
  const [recipient, setRecipient] = useState({ name: '', phone: '', email: '' });
  const [patientId, setPatientId] = useState(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [title, setTitle] = useState('');
  const [introNote, setIntroNote] = useState('');
  const [items, setItems] = useState([blankItem()]);
  const [catalog, setCatalog] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('');
  const [discount, setDiscount] = useState('');
  const [expires, setExpires] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load POS catalog
  useEffect(() => {
    fetch('/api/pos/services?active=true')
      .then((r) => r.json())
      .then((d) => setCatalog(Array.isArray(d?.services) ? d.services : []))
      .catch(() => setCatalog([]));
  }, []);

  // Patient search
  useEffect(() => {
    if (search.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/patients/search?q=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((d) => setSearchResults(Array.isArray(d) ? d : (d.patients || [])))
        .catch(() => setSearchResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const pickPatient = (p) => {
    setPatientId(p.id);
    setRecipient({ name: p.name || '', phone: p.phone || '', email: p.email || '' });
    setSearch('');
    setSearchResults([]);
  };

  const updateItem = (i, key, val) => {
    setItems((arr) => arr.map((it, idx) => idx === i ? { ...it, [key]: val } : it));
  };
  const addItem = () => setItems((arr) => [...arr, blankItem()]);
  const removeItem = (i) => setItems((arr) => arr.filter((_, idx) => idx !== i));
  const addFromCatalog = (svc) => {
    const priceDollars = (Number(svc.price_cents ?? svc.price) || 0) / 100;
    const newItem = {
      name: svc.name,
      description: svc.description || svc.category || '',
      price: priceDollars,
      qty: 1,
    };
    setItems((arr) => {
      // If first row is blank, replace it
      if (arr.length === 1 && !arr[0].name && !arr[0].price) return [newItem];
      return [...arr, newItem];
    });
  };

  const categories = Array.from(new Set(catalog.map((c) => c.category).filter(Boolean))).sort();
  const filteredCatalog = catalog.filter((c) => {
    if (catalogCategory && c.category !== catalogCategory) return false;
    if (catalogSearch && !c.name.toLowerCase().includes(catalogSearch.toLowerCase())) return false;
    return true;
  });

  const subtotal = items.reduce((sum, it) => sum + ((Number(it.price) || 0) * (Number(it.qty) || 1)), 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  const save = async (sendAfter = false) => {
    setError('');
    if (!recipient.name) return setError('Recipient name is required');
    if (items.filter((it) => it.name).length === 0) return setError('Add at least one item');
    setSaving(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          recipient_name: recipient.name,
          recipient_phone: recipient.phone || null,
          recipient_email: recipient.email || null,
          title: title || null,
          intro_note: introNote || null,
          items,
          discount_cents: Math.round((Number(discount) || 0) * 100),
          expires_at: expires ? new Date(expires).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      if (sendAfter) {
        if (!recipient.phone) {
          setSaving(false);
          return setError('Phone required to send via SMS. Quote saved as draft.');
        }
        const sendRes = await fetch('/api/quotes/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quote_id: data.id }),
        });
        const sendData = await sendRes.json();
        if (!sendRes.ok) throw new Error(sendData.error || 'Send failed');
      }
      router.push('/admin/quotes');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="New Quote">
      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>New Custom Pricing Quote</h1>
        <p style={s.pageSubtitle}>Build a tailored pricing page and send a unique link.</p>
      </div>

      {error && (
        <div style={{ padding: 14, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', marginBottom: 16 }}>{error}</div>
      )}

      <div style={{ ...s.card, marginBottom: 20 }}>
        <div style={s.cardHeader}><h3 style={s.cardTitle}>Recipient</h3></div>
        <div style={s.cardBody}>
          <div style={s.fieldGroup}>
            <label style={s.label}>Search existing patient (optional)</label>
            <input style={s.input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type a name…" />
            {searchResults.length > 0 && (
              <div style={{ border: '1px solid #e5e5e5', marginTop: 6, maxHeight: 200, overflow: 'auto' }}>
                {searchResults.map((p) => (
                  <div key={p.id} onClick={() => pickPatient(p)} style={{ padding: 10, cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: '#888' }}>{p.phone} {p.email && `• ${p.email}`}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Name *</label>
              <input style={s.input} value={recipient.name} onChange={(e) => setRecipient({ ...recipient, name: e.target.value })} />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Phone (for SMS)</label>
              <input style={s.input} value={recipient.phone} onChange={(e) => setRecipient({ ...recipient, phone: e.target.value })} />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Email</label>
              <input style={s.input} value={recipient.email} onChange={(e) => setRecipient({ ...recipient, email: e.target.value })} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...s.card, marginBottom: 20 }}>
        <div style={s.cardHeader}><h3 style={s.cardTitle}>Quote Details</h3></div>
        <div style={s.cardBody}>
          <div style={s.fieldGroup}>
            <label style={s.label}>Title (optional)</label>
            <input style={s.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Tesamorelin + Weight Loss Stack" />
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Personal note (optional)</label>
            <textarea style={{ ...s.input, minHeight: 80, fontFamily: 'inherit' }} value={introNote} onChange={(e) => setIntroNote(e.target.value)} placeholder="Hey John — here's the options we talked about…" />
          </div>
        </div>
      </div>

      <div style={{ ...s.card, marginBottom: 20 }}>
        <div style={s.cardHeader}><h3 style={s.cardTitle}>Add from POS Catalog</h3></div>
        <div style={s.cardBody}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <input
              style={{ ...s.input, flex: 2 }}
              placeholder="Search catalog…"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
            />
            <select
              style={{ ...s.select, flex: 1 }}
              value={catalogCategory}
              onChange={(e) => setCatalogCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ maxHeight: 280, overflow: 'auto', border: '1px solid #e5e5e5' }}>
            {filteredCatalog.length === 0 && (
              <div style={{ padding: 14, color: '#888', fontSize: 14 }}>
                {catalog.length === 0 ? 'Loading catalog…' : 'No matches.'}
              </div>
            )}
            {filteredCatalog.map((svc) => {
              const cents = Number(svc.price_cents ?? svc.price) || 0;
              return (
                <div
                  key={svc.id}
                  onClick={() => addFromCatalog(svc)}
                  style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{svc.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{svc.category}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>${(cents / 100).toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ ...s.card, marginBottom: 20 }}>
        <div style={s.cardHeader}><h3 style={s.cardTitle}>Line Items</h3></div>
        <div style={s.cardBody}>
          {items.map((it, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 1fr 0.6fr 0.4fr', gap: 10, marginBottom: 10, alignItems: 'start' }}>
              <input style={s.input} placeholder="Item name (e.g. Tesamorelin 12-week)" value={it.name} onChange={(e) => updateItem(i, 'name', e.target.value)} />
              <input style={s.input} placeholder="Short description" value={it.description} onChange={(e) => updateItem(i, 'description', e.target.value)} />
              <input style={s.input} placeholder="Price" type="number" value={it.price} onChange={(e) => updateItem(i, 'price', e.target.value)} />
              <input style={s.input} placeholder="Qty" type="number" value={it.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)} />
              <button onClick={() => removeItem(i)} style={{ ...s.btnSecondary, ...s.btnSmall }}>×</button>
            </div>
          ))}
          <button onClick={addItem} style={{ ...s.btnSecondary, ...s.btnSmall }}>+ Add Item</button>

          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Bundle discount ($)</label>
              <input style={s.input} type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Expires</label>
              <input style={s.input} type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 16, padding: 16, background: '#fafafa', border: '1px solid #e5e5e5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#666' }}>
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            {Number(discount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#666' }}>
                <span>Discount</span><span>−${Number(discount).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, fontWeight: 700, marginTop: 8 }}>
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => save(false)} disabled={saving} style={s.btnSecondary}>Save as Draft</button>
        <button onClick={() => save(true)} disabled={saving} style={s.btnPrimary}>Save & Send via SMS</button>
      </div>
    </AdminLayout>
  );
}
