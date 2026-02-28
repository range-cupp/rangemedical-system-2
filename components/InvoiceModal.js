// components/InvoiceModal.js
// Create / edit invoice modal with line items
// Range Medical System V2

import { useState, useEffect, useRef } from 'react';

export default function InvoiceModal({ isOpen, onClose, onInvoiceCreated, preselectedPatient }) {
  // Patient search
  const [patient, setPatient] = useState(preselectedPatient || null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const searchTimeout = useRef(null);

  // Line items
  const [items, setItems] = useState([{ name: '', category: '', price: '', quantity: 1 }]);

  // Discount
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState('');

  // Notes
  const [notes, setNotes] = useState('');

  // Sending
  const [sendVia, setSendVia] = useState('email');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (preselectedPatient) setPatient(preselectedPatient);
  }, [preselectedPatient]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setPatient(preselectedPatient || null);
      setPatientSearch('');
      setItems([{ name: '', category: '', price: '', quantity: 1 }]);
      setDiscountType('none');
      setDiscountValue('');
      setNotes('');
      setSendVia('email');
      setCreating(false);
      setError('');
    }
  }, [isOpen, preselectedPatient]);

  // Patient search
  const searchPatients = async (q) => {
    if (!q || q.length < 2) {
      setPatientResults([]);
      setShowDropdown(false);
      return;
    }
    setSearchingPatients(true);
    try {
      const res = await fetch(`/api/patients/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setPatientResults(data.patients || data || []);
      setShowDropdown(true);
    } catch (err) {
      console.error('Patient search error:', err);
    } finally {
      setSearchingPatients(false);
    }
  };

  const handlePatientSearchChange = (val) => {
    setPatientSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchPatients(val), 300);
  };

  const selectPatient = (p) => {
    setPatient(p);
    setPatientSearch('');
    setShowDropdown(false);
  };

  // Line items
  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { name: '', category: '', price: '', quantity: 1 }]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotalCents = items.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const qty = parseInt(item.quantity) || 1;
    return sum + Math.round(price * 100) * qty;
  }, 0);

  let discountCents = 0;
  let discountDescription = '';
  if (discountType === 'percent' && discountValue) {
    const pct = parseFloat(discountValue) || 0;
    discountCents = Math.round(subtotalCents * pct / 100);
    discountDescription = `${pct}% off`;
  } else if (discountType === 'dollar' && discountValue) {
    discountCents = Math.round((parseFloat(discountValue) || 0) * 100);
    discountDescription = `$${parseFloat(discountValue).toFixed(2)} off`;
  }

  const totalCents = Math.max(subtotalCents - discountCents, 0);

  const formatCents = (c) => '$' + (c / 100).toFixed(2);

  // Validate
  const isValid = patient && items.every(i => i.name && parseFloat(i.price) > 0) && totalCents > 0;

  // Create
  const handleCreate = async () => {
    if (!isValid) return;
    setCreating(true);
    setError('');

    try {
      const patientName = patient.first_name && patient.last_name
        ? `${patient.first_name} ${patient.last_name}`
        : patient.name || 'Unknown';

      const invoiceItems = items.map(item => ({
        name: item.name,
        category: item.category || 'custom',
        price_cents: Math.round((parseFloat(item.price) || 0) * 100),
        quantity: parseInt(item.quantity) || 1,
      }));

      // Create invoice
      const createRes = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.id,
          patient_name: patientName,
          patient_email: patient.email || null,
          patient_phone: patient.phone || null,
          items: invoiceItems,
          subtotal_cents: subtotalCents,
          discount_cents: discountCents,
          discount_description: discountDescription || null,
          total_cents: totalCents,
          notes: notes || null,
          created_by: 'admin',
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        throw new Error(createData.error || 'Failed to create invoice');
      }

      // Send invoice if method selected
      if (sendVia !== 'none' && createData.invoice?.id) {
        await fetch(`/api/invoices/${createData.invoice.id}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ via: sendVia }),
        });
      }

      onInvoiceCreated && onInvoiceCreated(createData.invoice);
      onClose();
    } catch (err) {
      console.error('Create invoice error:', err);
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Create Invoice</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.body}>
          {/* Patient Selection */}
          <div style={styles.section}>
            <label style={styles.label}>Patient</label>
            {patient ? (
              <div style={styles.selectedPatient}>
                <span style={styles.selectedName}>
                  {patient.first_name && patient.last_name
                    ? `${patient.first_name} ${patient.last_name}`
                    : patient.name}
                </span>
                {patient.email && <span style={styles.selectedMeta}>{patient.email}</span>}
                <button
                  onClick={() => setPatient(null)}
                  style={styles.changBtn}
                >
                  Change
                </button>
              </div>
            ) : (
              <div style={styles.searchWrap}>
                <input
                  type="text"
                  value={patientSearch}
                  onChange={e => handlePatientSearchChange(e.target.value)}
                  placeholder="Search patients by name or email..."
                  style={styles.input}
                  autoFocus
                />
                {showDropdown && patientResults.length > 0 && (
                  <div style={styles.dropdown}>
                    {patientResults.map(p => (
                      <div
                        key={p.id}
                        onClick={() => selectPatient(p)}
                        style={styles.dropdownItem}
                      >
                        <span style={styles.dropdownName}>
                          {p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.name}
                        </span>
                        {p.email && <span style={styles.dropdownEmail}>{p.email}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {searchingPatients && <div style={styles.searching}>Searching...</div>}
              </div>
            )}
          </div>

          {/* Line Items */}
          <div style={styles.section}>
            <label style={styles.label}>Line Items</label>
            {items.map((item, idx) => (
              <div key={idx} style={styles.lineItem}>
                <input
                  type="text"
                  placeholder="Service or product name"
                  value={item.name}
                  onChange={e => updateItem(idx, 'name', e.target.value)}
                  style={{ ...styles.input, flex: 2 }}
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={item.price}
                  onChange={e => updateItem(idx, 'price', e.target.value)}
                  style={{ ...styles.input, flex: 1, minWidth: '80px' }}
                  step="0.01"
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={e => updateItem(idx, 'quantity', e.target.value)}
                  style={{ ...styles.input, width: '60px', flex: 'none' }}
                  min="1"
                />
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(idx)}
                    style={styles.removeBtn}
                    title="Remove item"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button onClick={addItem} style={styles.addItemBtn}>
              + Add Item
            </button>
          </div>

          {/* Discount */}
          <div style={styles.section}>
            <label style={styles.label}>Discount</label>
            <div style={styles.discountRow}>
              <select
                value={discountType}
                onChange={e => { setDiscountType(e.target.value); setDiscountValue(''); }}
                style={{ ...styles.input, flex: 'none', width: '140px' }}
              >
                <option value="none">No discount</option>
                <option value="percent">Percent off</option>
                <option value="dollar">Dollar off</option>
              </select>
              {discountType !== 'none' && (
                <input
                  type="number"
                  placeholder={discountType === 'percent' ? '10' : '25.00'}
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                  style={{ ...styles.input, flex: 1 }}
                  step={discountType === 'percent' ? '1' : '0.01'}
                  min="0"
                />
              )}
            </div>
          </div>

          {/* Notes */}
          <div style={styles.section}>
            <label style={styles.label}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Internal notes or message to patient..."
              style={styles.textarea}
              rows={2}
            />
          </div>

          {/* Send method */}
          <div style={styles.section}>
            <label style={styles.label}>Send Invoice Via</label>
            <div style={styles.sendOptions}>
              {[
                { value: 'email', label: 'Email' },
                { value: 'sms', label: 'SMS' },
                { value: 'both', label: 'Both' },
                { value: 'none', label: 'Don\'t send yet' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSendVia(opt.value)}
                  style={{
                    ...styles.sendOption,
                    ...(sendVia === opt.value ? styles.sendOptionActive : {}),
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div style={styles.totals}>
            <div style={styles.totalRow}>
              <span>Subtotal</span>
              <span>{formatCents(subtotalCents)}</span>
            </div>
            {discountCents > 0 && (
              <div style={{ ...styles.totalRow, color: '#16a34a' }}>
                <span>Discount ({discountDescription})</span>
                <span>−{formatCents(discountCents)}</span>
              </div>
            )}
            <div style={{ ...styles.totalRow, ...styles.totalFinal }}>
              <span>Total</span>
              <span>{formatCents(totalCents)}</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.error}>{error}</div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!isValid || creating}
            style={{
              ...styles.createBtn,
              opacity: !isValid || creating ? 0.5 : 1,
            }}
          >
            {creating ? 'Creating...' : sendVia === 'none' ? 'Create Invoice' : 'Create & Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e5e5',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#666',
    padding: '4px 8px',
  },
  body: {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  section: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#666',
    marginBottom: '8px',
    letterSpacing: '0.3px',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  searchWrap: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    marginTop: '4px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 10,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  dropdownItem: {
    padding: '10px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownName: {
    fontWeight: '500',
    fontSize: '14px',
  },
  dropdownEmail: {
    fontSize: '12px',
    color: '#999',
  },
  searching: {
    padding: '8px 12px',
    fontSize: '12px',
    color: '#999',
  },
  selectedPatient: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e5e5',
  },
  selectedName: {
    fontWeight: '500',
    fontSize: '14px',
  },
  selectedMeta: {
    fontSize: '12px',
    color: '#999',
    flex: 1,
  },
  changBtn: {
    padding: '4px 10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    background: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#666',
  },
  lineItem: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '8px',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#999',
    padding: '8px',
    flexShrink: 0,
  },
  addItemBtn: {
    padding: '8px 14px',
    border: '1px dashed #ccc',
    borderRadius: '8px',
    background: 'none',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#666',
    width: '100%',
    marginTop: '4px',
  },
  discountRow: {
    display: 'flex',
    gap: '8px',
  },
  textarea: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  sendOptions: {
    display: 'flex',
    gap: '8px',
  },
  sendOption: {
    padding: '8px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#666',
    fontWeight: '400',
  },
  sendOptionActive: {
    background: '#000',
    color: '#fff',
    border: '1px solid #000',
    fontWeight: '500',
  },
  totals: {
    padding: '16px 0',
    borderTop: '1px solid #e5e5e5',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    padding: '4px 0',
  },
  totalFinal: {
    fontWeight: '600',
    fontSize: '16px',
    paddingTop: '8px',
    marginTop: '4px',
    borderTop: '1px solid #e5e5e5',
  },
  error: {
    padding: '10px 12px',
    background: '#fef2f2',
    color: '#dc2626',
    borderRadius: '8px',
    fontSize: '13px',
    marginTop: '12px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #e5e5e5',
  },
  cancelBtn: {
    padding: '10px 20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#666',
  },
  createBtn: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: '8px',
    background: '#000',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};
