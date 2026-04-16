// /pages/admin/quotes/edit/[id].js
// Edit an existing custom pricing quote
// Range Medical

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout, { sharedStyles as s } from '../../../../components/AdminLayout';

const blankItem = () => ({ name: '', description: '', price: '', qty: 1 });
const blankOption = (name) => ({ name: name || 'Option A', items: [blankItem()], discount: '' });

export default function EditQuote() {
  const router = useRouter();
  const { id } = router.query;
  const [recipient, setRecipient] = useState({ name: '', phone: '', email: '' });
  const [patientId, setPatientId] = useState(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [title, setTitle] = useState('');
  const [introNote, setIntroNote] = useState('');
  const [options, setOptions] = useState([blankOption('Option A')]);
  const [activeOpt, setActiveOpt] = useState(0);
  const [catalog, setCatalog] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('');
  const [pickerFor, setPickerFor] = useState(null); // item index whose inline POS picker is open
  const [expires, setExpires] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [quoteStatus, setQuoteStatus] = useState('draft');

  // Load existing quote
  useEffect(() => {
    if (!id) return;
    fetch(`/api/quotes/manage/${id}`)
      .then((r) => r.json())
      .then((q) => {
        if (q.error) { setError(q.error); setLoadingQuote(false); return; }
        setRecipient({ name: q.recipient_name || '', phone: q.recipient_phone || '', email: q.recipient_email || '' });
        setPatientId(q.patient_id);
        setTitle(q.title || '');
        setIntroNote(q.intro_note || '');
        setQuoteStatus(q.status || 'draft');
        if (q.expires_at) {
          setExpires(q.expires_at.slice(0, 10));
        }
        if (q.options && q.options.length > 0) {
          setOptions(q.options.map((o) => ({
            name: o.name,
            items: o.items.map((it) => ({ name: it.name, description: it.description || '', price: it.price, qty: it.qty || 1 })),
            discount: o.discount_cents ? (o.discount_cents / 100).toString() : '',
          })));
        } else if (q.items && q.items.length > 0) {
          setOptions([{
            name: 'Option A',
            items: q.items.map((it) => ({ name: it.name, description: it.description || '', price: it.price, qty: it.qty || 1 })),
            discount: q.discount_cents ? (q.discount_cents / 100).toString() : '',
          }]);
        }
        setLoadingQuote(false);
      })
      .catch((err) => { setError(err.message); setLoadingQuote(false); });
  }, [id]);

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

  const mutateActive = (fn) => {
    setOptions((opts) => opts.map((o, idx) => idx === activeOpt ? fn(o) : o));
  };
  const updateItem = (i, key, val) => {
    mutateActive((o) => ({ ...o, items: o.items.map((it, idx) => idx === i ? { ...it, [key]: val } : it) }));
  };
  const addItem = () => mutateActive((o) => ({ ...o, items: [...o.items, blankItem()] }));
  const removeItem = (i) => mutateActive((o) => ({ ...o, items: o.items.filter((_, idx) => idx !== i) }));
  const setActiveDiscount = (val) => mutateActive((o) => ({ ...o, discount: val }));
  const setActiveName = (val) => mutateActive((o) => ({ ...o, name: val }));
  const addOption = () => {
    if (options.length >= 3) return;
    const next = ['Option A', 'Option B', 'Option C'][options.length];
    setOptions((opts) => [...opts, blankOption(next)]);
    setActiveOpt(options.length);
  };
  const removeOption = (i) => {
    if (options.length <= 1) return;
    setOptions((opts) => opts.filter((_, idx) => idx !== i));
    setActiveOpt((cur) => Math.max(0, cur >= i ? cur - 1 : cur));
  };
  const svcToItem = (svc) => {
    const priceDollars = (Number(svc.price_cents ?? svc.price) || 0) / 100;
    let displayName = svc.name;
    if (svc.peptide_identifier) {
      displayName = svc.duration_days
        ? `${svc.peptide_identifier} — ${svc.duration_days} Day Protocol`
        : svc.peptide_identifier;
    }
    return {
      name: displayName,
      description: svc.description || svc.sub_category || '',
      price: priceDollars,
      qty: 1,
    };
  };
  const addFromCatalog = (svc) => {
    const newItem = svcToItem(svc);
    mutateActive((o) => {
      const arr = o.items;
      if (arr.length === 1 && !arr[0].name && !arr[0].price) return { ...o, items: [newItem] };
      return { ...o, items: [...arr, newItem] };
    });
  };
  const fillItemFromCatalog = (i, svc) => {
    const filled = svcToItem(svc);
    mutateActive((o) => ({
      ...o,
      items: o.items.map((it, idx) => idx === i ? { ...filled, qty: Number(it.qty) || 1 } : it),
    }));
    setPickerFor(null);
  };
  const filterCatalogFor = (query) => {
    const q = (query || '').toLowerCase().trim();
    if (!q) return catalog.slice(0, 40);
    return catalog.filter((c) => {
      const haystack = [c.name, c.peptide_identifier, c.sub_category, c.description, c.category]
        .filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    }).slice(0, 40);
  };

  const categories = Array.from(new Set(catalog.map((c) => c.category).filter(Boolean))).sort();
  const filteredCatalog = catalog.filter((c) => {
    if (catalogCategory && c.category !== catalogCategory) return false;
    if (catalogSearch) {
      const q = catalogSearch.toLowerCase();
      const haystack = [c.name, c.peptide_identifier, c.sub_category, c.description]
        .filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
  const internalLabel = (svc) => {
    const parts = [];
    if (svc.peptide_identifier) parts.push(svc.peptide_identifier);
    if (svc.sub_category) parts.push(svc.sub_category);
    if (svc.duration_days) parts.push(`${svc.duration_days}d`);
    return parts.join(' · ') || svc.category;
  };

  const active = options[activeOpt] || options[0];
  const items = active.items;
  const discount = active.discount;
  const subtotal = items.reduce((sum, it) => sum + ((Number(it.price) || 0) * (Number(it.qty) || 1)), 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));
  const isComparison = options.length > 1;

  const save = async (sendAfter = false) => {
    setError('');
    if (!recipient.name) return setError('Recipient name is required');
    if (options.some((o) => o.items.filter((it) => it.name).length === 0)) {
      return setError('Each option needs at least one item');
    }
    setSaving(true);
    try {
      const payloadOptions = options.map((o) => ({
        name: o.name,
        items: o.items,
        discount_cents: Math.round((Number(o.discount) || 0) * 100),
      }));
      const res = await fetch(`/api/quotes/manage/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          recipient_name: recipient.name,
          recipient_phone: recipient.phone || null,
          recipient_email: recipient.email || null,
          title: title || null,
          intro_note: introNote || null,
          items: options[0].items,
          discount_cents: Math.round((Number(options[0].discount) || 0) * 100),
          options: isComparison ? payloadOptions : null,
          expires_at: expires ? new Date(expires).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      if (sendAfter) {
        if (!recipient.phone) {
          setSaving(false);
          return setError('Phone required to send via SMS. Quote saved.');
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

  if (loadingQuote) {
    return (
      <AdminLayout title="Edit Quote">
        <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading quote…</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Edit Quote">
      <div style={s.pageHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={s.pageTitle}>Edit Quote</h1>
            <p style={s.pageSubtitle}>
              {recipient.name ? `Editing quote for ${recipient.name}` : 'Update this pricing quote'}
              {quoteStatus && <span style={{ marginLeft: 12, ...STATUS_STYLES[quoteStatus] }}>{quoteStatus}</span>}
            </p>
          </div>
          <button onClick={() => router.push('/admin/quotes')} style={s.btnSecondary}>Back to Quotes</button>
        </div>
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
        <div style={s.cardHeader}>
          <h3 style={s.cardTitle}>Line Items{isComparison ? ' — Comparison' : ''}</h3>
          {options.length < 3 && (
            <button onClick={addOption} style={{ ...s.btnSecondary, ...s.btnSmall }}>+ Add Option to Compare</button>
          )}
        </div>
        <div style={s.cardBody}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid #e5e5e5' }}>
            {options.map((o, i) => (
              <div
                key={i}
                onClick={() => { setActiveOpt(i); setPickerFor(null); }}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderBottom: activeOpt === i ? '2px solid #0a0a0a' : '2px solid transparent',
                  fontWeight: activeOpt === i ? 700 : 500,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {o.name || `Option ${i + 1}`}
                {isComparison && (
                  <span
                    onClick={(e) => { e.stopPropagation(); removeOption(i); }}
                    style={{ color: '#888', fontSize: 16, lineHeight: 1 }}
                  >×</span>
                )}
              </div>
            ))}
          </div>

          {isComparison && (
            <div style={{ ...s.fieldGroup, marginBottom: 14 }}>
              <label style={s.label}>Option name (shown to patient)</label>
              <input style={s.input} value={active.name} onChange={(e) => setActiveName(e.target.value)} placeholder="e.g. 2.5 mg Monthly" />
            </div>
          )}

          {/* POS Catalog — scoped to active option */}
          <div style={{ marginBottom: 20, padding: 14, background: '#fafafa', border: '1px solid #e5e5e5' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 10 }}>
              Add from POS Catalog {isComparison && <span style={{ color: '#888', fontWeight: 500 }}>→ adds to {active.name || `Option ${activeOpt + 1}`}</span>}
            </div>
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
            <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid #e5e5e5', background: '#fff' }}>
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
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{internalLabel(svc)}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{svc.name} · {svc.category}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>${(cents / 100).toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {items.map((it, i) => {
            const suggestions = pickerFor === i ? filterCatalogFor(it.name) : [];
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 1fr 0.6fr 0.4fr', gap: 10, marginBottom: 10, alignItems: 'start' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    style={s.input}
                    placeholder="Item name — type or pick from POS"
                    value={it.name}
                    onChange={(e) => { updateItem(i, 'name', e.target.value); setPickerFor(i); }}
                    onFocus={() => setPickerFor(i)}
                    onBlur={() => setTimeout(() => setPickerFor((cur) => (cur === i ? null : cur)), 180)}
                  />
                  {pickerFor === i && suggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, background: '#fff', border: '1px solid #ddd', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', maxHeight: 260, overflow: 'auto' }}>
                      {suggestions.map((svc) => {
                        const cents = Number(svc.price_cents ?? svc.price) || 0;
                        return (
                          <div
                            key={svc.id}
                            onMouseDown={(e) => { e.preventDefault(); fillItemFromCatalog(i, svc); }}
                            style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{internalLabel(svc)}</div>
                              <div style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{svc.name} · {svc.category}</div>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>${(cents / 100).toFixed(2)}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <input style={s.input} placeholder="Short description" value={it.description} onChange={(e) => updateItem(i, 'description', e.target.value)} />
                <input style={s.input} placeholder="Price" type="number" value={it.price} onChange={(e) => updateItem(i, 'price', e.target.value)} />
                <input style={s.input} placeholder="Qty" type="number" value={it.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)} />
                <button onClick={() => removeItem(i)} style={{ ...s.btnSecondary, ...s.btnSmall }}>×</button>
              </div>
            );
          })}
          <button onClick={addItem} style={{ ...s.btnSecondary, ...s.btnSmall }}>+ Add Item</button>

          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Bundle discount ($)</label>
              <input style={s.input} type="number" value={discount} onChange={(e) => setActiveDiscount(e.target.value)} />
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
                <span>Discount</span><span>-${Number(discount).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, fontWeight: 700, marginTop: 8 }}>
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => save(false)} disabled={saving} style={s.btnSecondary}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button onClick={() => save(true)} disabled={saving} style={s.btnPrimary}>
          {saving ? 'Saving…' : (quoteStatus === 'sent' || quoteStatus === 'viewed' ? 'Save & Resend SMS' : 'Save & Send via SMS')}
        </button>
      </div>
    </AdminLayout>
  );
}

const STATUS_STYLES = {
  draft: { display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: '#fef3c7', color: '#92400e' },
  sent: { display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: '#dbeafe', color: '#1e40af' },
  viewed: { display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: '#ede9fe', color: '#5b21b6' },
  accepted: { display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: '#d1fae5', color: '#065f46' },
  expired: { display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: '#f3f4f6', color: '#6b7280' },
};
