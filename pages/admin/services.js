// /pages/admin/services.js
// Services admin — view/edit/add bookable services.
// Single source of truth that drives the booking wizard, slot engine,
// notifications, and automations.
// Range Medical System

import { useState, useEffect, useCallback } from 'react';
import AdminLayout, { sharedStyles, overlayClickProps } from '../../components/AdminLayout';
import { useAuth } from '../../components/AuthProvider';

const CATEGORIES = [
  'hbot', 'rlt', 'iv', 'injection', 'hrt', 'weight_loss', 'peptide',
  'labs', 'phlebotomy', 'medication_pickup', 'dexa', 'procedure',
  'assessment', 'initial_conversation', 'follow_up_consultation', 'other',
];

const GROUP_ORDER = [
  'Lab / Blood Draw', 'Injections', 'Therapies', 'Pickups',
  'IV Therapy', 'Specialty IVs', 'Diagnostics', 'Range Assessment',
  'Medical Procedures', 'Consultations', null,
];

const EMPTY_FORM = {
  name: '',
  slug: '',
  category: 'other',
  group_label: '',
  duration_minutes: 30,
  buffer_minutes: 0,
  min_notice_hours: 0,
  booking_window_days: 60,
  description: '',
  has_modality: false,
  requires_blood_work: false,
  is_active: true,
  is_public_bookable: false,
  is_addon: false,
  sort_order: 0,
  price_cents: '',
  variants: [],           // [{ value, label, price_cents, duration_minutes }]
  providers: [],          // [{ employee_id, display_label, sort_order }]
  location_ids: [],
  form_ids: [],
  automation_actions: [], // ['decrement', ...]
  addon_service_ids: [],  // service IDs (must be is_addon=true)
  prep: { sms_body: '', email_subject: '', email_body: '', send_hours_before: 24, is_active: true },
};

function slugify(s) {
  return String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ServicesPage() {
  return (
    <AdminLayout title="Services">
      <ServicesContent />
    </AdminLayout>
  );
}

export function ServicesContent() {
  const { session, hasPermission } = useAuth();
  const [services, setServices] = useState([]);
  const [options, setOptions] = useState({ employees: [], locations: [], forms: [], automation_actions: [], addon_services: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters / search
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showInactive, setShowInactive] = useState(false);

  // Editor modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = create mode
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeSection, setActiveSection] = useState('basics');
  const [saving, setSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  }), [session]);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/services', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setServices(data.services || []);
      else setError(data.error || 'Failed to load services');
    } catch (e) {
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const fetchOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/services/options', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setOptions({
        employees: data.employees || [],
        locations: data.locations || [],
        forms: data.forms || [],
        automation_actions: data.automation_actions || [],
        addon_services: data.addon_services || [],
      });
    } catch (e) {
      console.error('Failed to load options:', e);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (session) {
      fetchServices();
      fetchOptions();
    }
  }, [session, fetchServices, fetchOptions]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Open editor in create mode
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setAutoSlug(true);
    setActiveSection('basics');
    setEditorOpen(true);
  };

  // Open editor in edit mode — fetch full detail
  const openEdit = async (svc) => {
    setEditingId(svc.id);
    setActiveSection('basics');
    setEditorOpen(true);
    setAutoSlug(false);
    setForm({ ...EMPTY_FORM, ...svc, prep: EMPTY_FORM.prep, providers: [], location_ids: [], form_ids: [], automation_actions: [], addon_service_ids: [], variants: [] }); // placeholder while loading

    try {
      const res = await fetch(`/api/admin/services/${svc.id}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setForm({
          ...EMPTY_FORM,
          ...data.service,
          variants: Array.isArray(data.service?.variants) ? data.service.variants : [],
          price_cents: data.service?.price_cents == null ? '' : data.service.price_cents,
          providers: (data.providers || []).map(p => ({
            employee_id: p.employee_id,
            display_label: p.display_label || '',
            sort_order: p.sort_order ?? 0,
            employee_name: p.employee_name || '',
          })),
          location_ids: data.location_ids || [],
          form_ids: data.form_ids || [],
          automation_actions: data.automation_actions || [],
          addon_service_ids: data.addon_service_ids || [],
          prep: data.prep || EMPTY_FORM.prep,
        });
      }
    } catch (e) {
      setError('Failed to load service detail');
    }
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingId(null);
  };

  // Update one field on the form (with optional auto-slug from name)
  const setField = (key, value) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && autoSlug) next.slug = slugify(value);
      return next;
    });
  };

  // Toggle membership in a list (e.g., location_ids, form_ids)
  const toggleInList = (key, value) => {
    setForm(prev => {
      const cur = prev[key] || [];
      const has = cur.includes(value);
      return { ...prev, [key]: has ? cur.filter(v => v !== value) : [...cur, value] };
    });
  };

  // Provider checkbox toggle (uses { employee_id, display_label, sort_order })
  const toggleProvider = (employeeId, employeeName) => {
    setForm(prev => {
      const cur = prev.providers || [];
      const idx = cur.findIndex(p => p.employee_id === employeeId);
      if (idx >= 0) return { ...prev, providers: cur.filter(p => p.employee_id !== employeeId) };
      return { ...prev, providers: [...cur, { employee_id: employeeId, display_label: '', sort_order: cur.length, employee_name: employeeName }] };
    });
  };

  const setProviderLabel = (employeeId, label) => {
    setForm(prev => ({
      ...prev,
      providers: (prev.providers || []).map(p =>
        p.employee_id === employeeId ? { ...p, display_label: label } : p,
      ),
    }));
  };

  const moveProvider = (employeeId, dir) => {
    setForm(prev => {
      const cur = [...(prev.providers || [])];
      const idx = cur.findIndex(p => p.employee_id === employeeId);
      const newIdx = idx + dir;
      if (idx < 0 || newIdx < 0 || newIdx >= cur.length) return prev;
      [cur[idx], cur[newIdx]] = [cur[newIdx], cur[idx]];
      return { ...prev, providers: cur.map((p, i) => ({ ...p, sort_order: i })) };
    });
  };

  // Save (create or update)
  const save = async () => {
    if (!form.name?.trim()) { setError('Name is required'); return; }
    if (!form.slug?.trim()) { setError('Slug is required'); return; }
    if (!form.duration_minutes) { setError('Duration is required'); return; }
    if (!form.category) { setError('Category is required'); return; }

    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      category: form.category,
      group_label: form.group_label?.trim() || null,
      duration_minutes: parseInt(form.duration_minutes, 10),
      buffer_minutes: parseInt(form.buffer_minutes || 0, 10),
      min_notice_hours: parseInt(form.min_notice_hours || 0, 10),
      booking_window_days: parseInt(form.booking_window_days || 60, 10),
      description: form.description?.trim() || null,
      has_modality: !!form.has_modality,
      requires_blood_work: !!form.requires_blood_work,
      is_active: !!form.is_active,
      is_public_bookable: !!form.is_public_bookable,
      is_addon: !!form.is_addon,
      sort_order: parseInt(form.sort_order || 0, 10),
      price_cents: form.price_cents === '' || form.price_cents == null ? null : parseInt(form.price_cents, 10),
      variants: (form.variants || []).map(v => ({
        value: String(v.value || '').trim(),
        label: String(v.label || v.value || '').trim(),
        price_cents: v.price_cents === '' || v.price_cents == null ? null : parseInt(v.price_cents, 10),
        duration_minutes: v.duration_minutes === '' || v.duration_minutes == null ? null : parseInt(v.duration_minutes, 10),
      })).filter(v => v.value),
      providers: (form.providers || []).map((p, idx) => ({
        employee_id: p.employee_id,
        display_label: p.display_label?.trim() || null,
        sort_order: idx,
      })),
      location_ids: form.location_ids || [],
      form_ids: form.form_ids || [],
      automation_actions: form.automation_actions || [],
      addon_service_ids: form.addon_service_ids || [],
      prep: (form.prep?.sms_body?.trim() || form.prep?.email_body?.trim())
        ? form.prep
        : null,  // null = clear prep
    };

    try {
      const url = editingId ? `/api/admin/services/${editingId}` : '/api/admin/services';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        showSuccess(editingId ? `${form.name} updated` : `${form.name} created`);
        closeEditor();
        fetchServices();
      } else {
        setError(data.error || 'Save failed');
      }
    } catch (e) {
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Soft-delete (deactivate)
  const deactivate = async () => {
    if (!editingId) return;
    if (!window.confirm(`Deactivate ${form.name}? Existing appointments are unaffected — the service just won't show up for new bookings.`)) return;
    try {
      const res = await fetch(`/api/admin/services/${editingId}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        showSuccess(`${form.name} deactivated`);
        closeEditor();
        fetchServices();
      } else {
        setError(data.error || 'Deactivate failed');
      }
    } catch (e) {
      setError('Deactivate failed');
    }
  };

  // Filter + group services for the list
  const filtered = services.filter(s => {
    if (!showInactive && !s.is_active) return false;
    if (filterCategory !== 'all' && s.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.name?.toLowerCase().includes(q) && !s.slug?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const grouped = {};
  for (const s of filtered) {
    const g = s.group_label || 'Other';
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(s);
  }
  const groupOrder = [
    ...GROUP_ORDER.filter(g => g && grouped[g]),
    ...Object.keys(grouped).filter(g => !GROUP_ORDER.includes(g) && g !== 'Other'),
    ...(grouped['Other'] ? ['Other'] : []),
  ];

  const canManage = hasPermission('can_manage_employees');

  return (
    <>
      {successMsg && <div style={{ ...styles.banner, background: '#dcfce7', color: '#166534' }}>{successMsg}</div>}
      {error && (
        <div style={{ ...styles.banner, background: '#fef2f2', color: '#dc2626' }}>
          {error}
          <button onClick={() => setError(null)} style={styles.dismissBtn}>×</button>
        </div>
      )}

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="Search services..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.search}
        />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={styles.select}>
          <option value="all">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={styles.checkboxLabel}>
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
          Show inactive
        </label>
        <div style={{ flex: 1 }} />
        {canManage && (
          <button onClick={openCreate} style={styles.primaryBtn}>+ Add Service</button>
        )}
      </div>

      {loading ? (
        <div style={styles.loading}>Loading services...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {groupOrder.length === 0 && (
            <div style={styles.empty}>No services match the current filters.</div>
          )}
          {groupOrder.map(group => (
            <div key={group} style={styles.groupCard}>
              <div style={styles.groupHeader}>
                <h3 style={styles.groupTitle}>{group}</h3>
                <span style={styles.groupCount}>{grouped[group].length}</span>
              </div>
              <div style={styles.serviceList}>
                {grouped[group].map(s => (
                  <button
                    key={s.id}
                    onClick={() => openEdit(s)}
                    style={{ ...styles.serviceRow, opacity: s.is_active ? 1 : 0.55 }}
                  >
                    <div style={{ flex: '1 1 auto', textAlign: 'left' }}>
                      <div style={styles.serviceName}>
                        {s.name}
                        {!s.is_active && <span style={styles.inactiveBadge}>inactive</span>}
                      </div>
                      <div style={styles.serviceMeta}>
                        <span>{s.slug}</span>
                        <span>•</span>
                        <span>{s.duration_minutes} min</span>
                        <span>•</span>
                        <span>{s.category}</span>
                        {s.requires_blood_work && (<><span>•</span><span style={{ color: '#b91c1c' }}>requires blood work</span></>)}
                      </div>
                    </div>
                    <div style={styles.serviceCounts}>
                      {s.variant_count > 0 && <CountChip label="Variants" count={s.variant_count} />}
                      {s.addon_count > 0 && <CountChip label="Add-ons" count={s.addon_count} />}
                      <CountChip label="Providers" count={s.provider_count} />
                      {s.location_count > 0 && <CountChip label="Locations" count={s.location_count} />}
                      <CountChip label="Forms" count={s.form_count} />
                      {s.is_addon && <span style={styles.prepChip}>add-on</span>}
                      {s.automation_actions.length > 0 && (
                        <span style={styles.actionChip}>{s.automation_actions.join(' + ')}</span>
                      )}
                      {s.has_prep && <span style={styles.prepChip}>prep</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor modal */}
      {editorOpen && (
        <div style={sharedStyles.modalOverlay} {...overlayClickProps(closeEditor)}>
          <div style={{ ...sharedStyles.modal, maxWidth: '760px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingId ? 'Edit Service' : 'New Service'}</h2>
              <button onClick={closeEditor} style={styles.closeBtn}>×</button>
            </div>

            {/* Section tabs */}
            <div style={styles.tabBar}>
              {['basics', 'variants', 'addons', 'providers', 'locations', 'forms', 'automations', 'prep'].map(s => (
                <button
                  key={s}
                  onClick={() => setActiveSection(s)}
                  style={{ ...styles.tab, ...(activeSection === s ? styles.tabActive : {}) }}
                >
                  {s === 'addons' ? 'Add-ons' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
              {activeSection === 'basics' && (
                <BasicsSection form={form} setField={setField} autoSlug={autoSlug} setAutoSlug={setAutoSlug} />
              )}
              {activeSection === 'variants' && (
                <VariantsSection form={form} setField={setField} />
              )}
              {activeSection === 'addons' && (
                <AddonsSection form={form} options={options} editingId={editingId} toggleInList={toggleInList} />
              )}
              {activeSection === 'providers' && (
                <ProvidersSection
                  form={form}
                  options={options}
                  toggleProvider={toggleProvider}
                  setProviderLabel={setProviderLabel}
                  moveProvider={moveProvider}
                />
              )}
              {activeSection === 'locations' && (
                <LocationsSection form={form} options={options} toggleInList={toggleInList} />
              )}
              {activeSection === 'forms' && (
                <FormsSection form={form} options={options} toggleInList={toggleInList} />
              )}
              {activeSection === 'automations' && (
                <AutomationsSection form={form} options={options} toggleInList={toggleInList} />
              )}
              {activeSection === 'prep' && (
                <PrepSection form={form} setField={setField} />
              )}
            </div>

            <div style={styles.modalFooter}>
              {editingId && canManage && form.is_active && (
                <button onClick={deactivate} style={styles.dangerBtn}>Deactivate</button>
              )}
              <div style={{ flex: 1 }} />
              <button onClick={closeEditor} style={styles.cancelBtn}>Cancel</button>
              <button onClick={save} disabled={saving || !canManage} style={{ ...styles.primaryBtn, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : (editingId ? 'Save Changes' : 'Create Service')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Section components
// ─────────────────────────────────────────────────────────────────────

function BasicsSection({ form, setField, autoSlug, setAutoSlug }) {
  return (
    <div style={styles.section}>
      <Field label="Name" required>
        <input type="text" value={form.name} onChange={e => setField('name', e.target.value)} style={styles.input} />
      </Field>
      <Field label="Slug" required hint="URL-safe identifier — used internally and by the slot engine">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="text" value={form.slug} onChange={e => { setAutoSlug(false); setField('slug', e.target.value); }} style={styles.input} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#666', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={autoSlug} onChange={e => setAutoSlug(e.target.checked)} />
            auto from name
          </label>
        </div>
      </Field>
      <div style={styles.row}>
        <Field label="Category" required>
          <select value={form.category} onChange={e => setField('category', e.target.value)} style={styles.input}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Group" hint="How it's grouped on the booking wizard">
          <input type="text" value={form.group_label || ''} onChange={e => setField('group_label', e.target.value)} placeholder="e.g. IV Therapy" style={styles.input} />
        </Field>
      </div>
      <div style={styles.row}>
        <Field label="Duration (min)" required>
          <input type="number" min="5" max="480" value={form.duration_minutes} onChange={e => setField('duration_minutes', e.target.value)} style={styles.input} />
        </Field>
        <Field label="Buffer (min)" hint="Minimum gap after this service">
          <input type="number" min="0" max="120" value={form.buffer_minutes} onChange={e => setField('buffer_minutes', e.target.value)} style={styles.input} />
        </Field>
        <Field label="Min notice (hours)">
          <input type="number" min="0" max="168" value={form.min_notice_hours} onChange={e => setField('min_notice_hours', e.target.value)} style={styles.input} />
        </Field>
      </div>
      <Field label="Description" hint="Internal note (not shown to patients)">
        <textarea value={form.description || ''} onChange={e => setField('description', e.target.value)} rows={2} style={{ ...styles.input, resize: 'vertical' }} />
      </Field>
      <Field label="Base price (cents)" hint="Used when there are no variants. Leave blank for free / not-for-sale.">
        <input
          type="number"
          min="0"
          step="1"
          value={form.price_cents}
          onChange={e => setField('price_cents', e.target.value)}
          placeholder="e.g. 22500 for $225.00"
          style={styles.input}
        />
      </Field>
      <div style={styles.toggleRow}>
        <Toggle label="Active" checked={form.is_active} onChange={v => setField('is_active', v)} />
        <Toggle label="Public bookable" checked={form.is_public_bookable} onChange={v => setField('is_public_bookable', v)} />
        <Toggle label="Has modality" checked={form.has_modality} onChange={v => setField('has_modality', v)} />
        <Toggle label="Requires blood work" checked={form.requires_blood_work} onChange={v => setField('requires_blood_work', v)} />
        <Toggle label="Is add-on" checked={form.is_addon} onChange={v => setField('is_addon', v)} />
      </div>
    </div>
  );
}

function VariantsSection({ form, setField }) {
  const variants = Array.isArray(form.variants) ? form.variants : [];

  const updateVariant = (idx, key, value) => {
    const next = variants.map((v, i) => i === idx ? { ...v, [key]: value } : v);
    setField('variants', next);
  };
  const addVariant = () => {
    setField('variants', [...variants, { value: '', label: '', price_cents: '', duration_minutes: '' }]);
  };
  const removeVariant = (idx) => {
    setField('variants', variants.filter((_, i) => i !== idx));
  };
  const moveVariant = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= variants.length) return;
    const next = [...variants];
    [next[idx], next[j]] = [next[j], next[idx]];
    setField('variants', next);
  };

  return (
    <div style={styles.section}>
      <p style={styles.sectionHelp}>
        Variants let one service cover multiple doses, sizes, or flavors (e.g., Vitamin C IV → 25g / 50g / 75g).
        At booking, the patient picks one — its price and (optional) duration override the base service.
        Leave empty for a single-option service.
      </p>

      {variants.length === 0 && (
        <div style={{ padding: '20px', background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: '6px', color: '#6b7280', fontSize: '13px', marginBottom: '12px' }}>
          No variants yet — booking will use the base price + duration.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {variants.map((v, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 110px 110px auto', gap: '8px', alignItems: 'center', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff' }}>
            <span style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center' }}>{idx + 1}</span>
            <input
              type="text"
              placeholder="Value (e.g. 500mg)"
              value={v.value || ''}
              onChange={e => updateVariant(idx, 'value', e.target.value)}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Label (defaults to value)"
              value={v.label || ''}
              onChange={e => updateVariant(idx, 'label', e.target.value)}
              style={styles.input}
            />
            <input
              type="number"
              min="0"
              placeholder="Price (¢)"
              value={v.price_cents ?? ''}
              onChange={e => updateVariant(idx, 'price_cents', e.target.value)}
              style={styles.input}
            />
            <input
              type="number"
              min="0"
              placeholder="Mins"
              value={v.duration_minutes ?? ''}
              onChange={e => updateVariant(idx, 'duration_minutes', e.target.value)}
              style={styles.input}
            />
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => moveVariant(idx, -1)} disabled={idx === 0} style={styles.iconBtn}>↑</button>
              <button onClick={() => moveVariant(idx, 1)} disabled={idx === variants.length - 1} style={styles.iconBtn}>↓</button>
              <button onClick={() => removeVariant(idx)} style={{ ...styles.iconBtn, color: '#dc2626' }}>×</button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addVariant} style={{ ...styles.primaryBtn, marginTop: '12px' }}>+ Add Variant</button>
    </div>
  );
}

function AddonsSection({ form, options, editingId, toggleInList }) {
  const selectedIds = new Set(form.addon_service_ids || []);
  const choices = (options.addon_services || []).filter(s => s.id !== editingId);
  const fmtPrice = (cents) => cents == null ? '—' : `$${(cents / 100).toFixed(2)}`;

  return (
    <div style={styles.section}>
      <p style={styles.sectionHelp}>
        Add-ons are optional extras the patient can tack on while booking this service (e.g., Methylene Blue IV +
        Vitamin C add-on). Only services flagged as <strong>Is add-on</strong> in their Basics tab show up here.
      </p>

      {choices.length === 0 ? (
        <div style={{ padding: '20px', background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: '6px', color: '#6b7280', fontSize: '13px' }}>
          No add-on services exist yet. Create a service, flip <strong>Is add-on</strong> on, and it&rsquo;ll appear here.
        </div>
      ) : (
        <div style={styles.checklist}>
          {choices.map(s => (
            <label key={s.id} style={styles.checklistItem}>
              <input
                type="checkbox"
                checked={selectedIds.has(s.id)}
                onChange={() => toggleInList('addon_service_ids', s.id)}
              />
              <span style={{ fontWeight: 600 }}>{s.name}</span>
              <span style={{ color: '#999', fontSize: '12px' }}>
                · {s.category} · {s.duration_minutes} min · {fmtPrice(s.price_cents)}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function ProvidersSection({ form, options, toggleProvider, setProviderLabel, moveProvider }) {
  const selected = form.providers || [];
  const selectedIds = new Set(selected.map(p => p.employee_id));
  return (
    <div style={styles.section}>
      <p style={styles.sectionHelp}>Check the employees who can perform this service. The order here controls round-robin priority (top = first pick when multiple are free).</p>

      {selected.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={styles.subheading}>Selected providers (in priority order)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {selected.map((p, idx) => (
              <div key={p.employee_id} style={styles.providerRow}>
                <span style={{ width: '20px', textAlign: 'center', color: '#999' }}>{idx + 1}</span>
                <span style={{ flex: '0 0 160px', fontWeight: 600 }}>{p.employee_name || options.employees.find(e => e.id === p.employee_id)?.name}</span>
                <input
                  type="text"
                  placeholder="Display label override (e.g. Dr. Burgess)"
                  value={p.display_label || ''}
                  onChange={e => setProviderLabel(p.employee_id, e.target.value)}
                  style={{ ...styles.input, flex: 1 }}
                />
                <button onClick={() => moveProvider(p.employee_id, -1)} disabled={idx === 0} style={styles.iconBtn}>↑</button>
                <button onClick={() => moveProvider(p.employee_id, 1)} disabled={idx === selected.length - 1} style={styles.iconBtn}>↓</button>
                <button onClick={() => toggleProvider(p.employee_id, p.employee_name)} style={{ ...styles.iconBtn, color: '#dc2626' }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.subheading}>Available employees</div>
      <div style={styles.checklist}>
        {options.employees.filter(e => !selectedIds.has(e.id)).map(e => (
          <label key={e.id} style={styles.checklistItem}>
            <input type="checkbox" checked={false} onChange={() => toggleProvider(e.id, e.name)} />
            <span>{e.name}</span>
            {e.title && <span style={{ color: '#999', fontSize: '12px' }}>· {e.title}</span>}
          </label>
        ))}
      </div>
    </div>
  );
}

function LocationsSection({ form, options, toggleInList }) {
  return (
    <div style={styles.section}>
      <p style={styles.sectionHelp}>Which clinic locations can this service be booked at? Leave empty to allow at all active locations.</p>
      <div style={styles.checklist}>
        {options.locations.map(l => (
          <label key={l.id} style={styles.checklistItem}>
            <input type="checkbox" checked={(form.location_ids || []).includes(l.id)} onChange={() => toggleInList('location_ids', l.id)} />
            <span style={{ fontWeight: 600 }}>{l.short_name}</span>
            <span style={{ color: '#999', fontSize: '12px' }}>· {l.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function FormsSection({ form, options, toggleInList }) {
  return (
    <div style={styles.section}>
      <p style={styles.sectionHelp}>Forms the patient must complete before this appointment. Sent automatically when the booking is created.</p>
      <div style={styles.checklist}>
        {options.forms.map(f => (
          <label key={f.id} style={styles.checklistItem}>
            <input type="checkbox" checked={(form.form_ids || []).includes(f.id)} onChange={() => toggleInList('form_ids', f.id)} />
            <span style={{ fontWeight: 600 }}>{f.name}</span>
            {f.time && <span style={{ color: '#999', fontSize: '12px' }}>· {f.time}</span>}
          </label>
        ))}
      </div>
    </div>
  );
}

function AutomationsSection({ form, options, toggleInList }) {
  return (
    <div style={styles.section}>
      <p style={styles.sectionHelp}>What should happen automatically when this service is booked?</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {options.automation_actions.map(a => (
          <label key={a.value} style={{ ...styles.checklistItem, alignItems: 'flex-start', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
            <input
              type="checkbox"
              checked={(form.automation_actions || []).includes(a.value)}
              onChange={() => toggleInList('automation_actions', a.value)}
              style={{ marginTop: '3px' }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>{a.label}</div>
              <div style={{ fontSize: '12.5px', color: '#666', marginTop: '2px' }}>{a.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function PrepSection({ form, setField }) {
  const prep = form.prep || EMPTY_FORM.prep;
  const updatePrep = (key, value) => setField('prep', { ...prep, [key]: value });
  return (
    <div style={styles.section}>
      <p style={styles.sectionHelp}>Pre-visit instructions sent to the patient via SMS + email. Currently disabled clinic-wide — see lib/booking-automations.js. When re-enabled, these bodies are what get sent.</p>
      <Field label="SMS body" hint="Plain text — keep under 320 chars">
        <textarea value={prep.sms_body || ''} onChange={e => updatePrep('sms_body', e.target.value)} rows={4} style={{ ...styles.input, resize: 'vertical' }} />
      </Field>
      <div style={styles.row}>
        <Field label="Email subject">
          <input type="text" value={prep.email_subject || ''} onChange={e => updatePrep('email_subject', e.target.value)} style={styles.input} />
        </Field>
        <Field label="Send hours before">
          <input type="number" min="1" max="168" value={prep.send_hours_before || 24} onChange={e => updatePrep('send_hours_before', parseInt(e.target.value, 10) || 24)} style={styles.input} />
        </Field>
      </div>
      <Field label="Email body" hint="Plain text or basic HTML">
        <textarea value={prep.email_body || ''} onChange={e => updatePrep('email_body', e.target.value)} rows={6} style={{ ...styles.input, resize: 'vertical' }} />
      </Field>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Small UI helpers
// ─────────────────────────────────────────────────────────────────────

function Field({ label, hint, required, children }) {
  return (
    <div style={{ marginBottom: '14px', flex: 1 }}>
      <div style={styles.fieldLabel}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>}
      </div>
      {children}
      {hint && <div style={styles.fieldHint}>{hint}</div>}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
      <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function CountChip({ label, count }) {
  return (
    <span style={styles.countChip} title={label}>
      <strong>{count}</strong> <span style={{ color: '#888' }}>{label.toLowerCase()}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────

const styles = {
  banner: { padding: '10px 14px', borderRadius: '6px', fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  dismissBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'inherit', padding: 0, marginLeft: '12px' },
  toolbar: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  search: { flex: '0 0 280px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' },
  select: { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', background: 'white' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#555', cursor: 'pointer' },
  primaryBtn: { padding: '8px 16px', background: '#0A0A0A', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  loading: { textAlign: 'center', padding: '60px 0', color: '#888' },
  empty: { textAlign: 'center', padding: '40px 0', color: '#999', background: '#f9fafb', borderRadius: '8px' },

  groupCard: { background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' },
  groupHeader: { padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  groupTitle: { margin: 0, fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#374151' },
  groupCount: { fontSize: '12px', color: '#888', background: '#fff', padding: '2px 8px', borderRadius: '10px', border: '1px solid #e5e7eb' },
  serviceList: { display: 'flex', flexDirection: 'column' },
  serviceRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'white', border: 'none', borderTop: '1px solid #f3f4f6', cursor: 'pointer', textAlign: 'left', fontSize: '14px', transition: 'background 0.1s', width: '100%' },
  serviceName: { fontSize: '15px', fontWeight: 600, color: '#111', display: 'flex', alignItems: 'center', gap: '8px' },
  serviceMeta: { fontSize: '12.5px', color: '#666', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' },
  serviceCounts: { display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' },
  countChip: { fontSize: '12px', padding: '3px 8px', background: '#f3f4f6', borderRadius: '10px' },
  actionChip: { fontSize: '11px', padding: '3px 8px', background: '#eef2ff', color: '#3730a3', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.03em' },
  prepChip: { fontSize: '11px', padding: '3px 8px', background: '#fef3c7', color: '#92400e', borderRadius: '10px' },
  inactiveBadge: { fontSize: '10px', padding: '2px 6px', background: '#f3f4f6', color: '#888', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' },

  // Modal
  modalHeader: { padding: '18px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { margin: 0, fontSize: '18px', fontWeight: 700 },
  closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888', padding: 0, lineHeight: 1 },
  tabBar: { display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 24px', gap: '4px' },
  tab: { background: 'none', border: 'none', padding: '12px 14px', fontSize: '13px', cursor: 'pointer', color: '#666', borderBottom: '2px solid transparent', fontWeight: 500 },
  tabActive: { color: '#0A0A0A', borderBottomColor: '#0A0A0A', fontWeight: 600 },

  modalFooter: { padding: '14px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' },
  cancelBtn: { padding: '8px 16px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' },
  dangerBtn: { padding: '8px 14px', background: 'white', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' },

  // Section content
  section: { display: 'flex', flexDirection: 'column' },
  sectionHelp: { fontSize: '13px', color: '#666', marginTop: 0, marginBottom: '14px', lineHeight: 1.5 },
  subheading: { fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#666', marginBottom: '8px' },
  fieldLabel: { fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.03em' },
  fieldHint: { fontSize: '11.5px', color: '#888', marginTop: '4px' },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' },
  row: { display: 'flex', gap: '12px' },
  toggleRow: { display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '12px', background: '#f9fafb', borderRadius: '6px' },

  checklist: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' },
  checklistItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '13.5px' },

  providerRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: '#f9fafb', borderRadius: '6px' },
  iconBtn: { background: 'white', border: '1px solid #d1d5db', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};
