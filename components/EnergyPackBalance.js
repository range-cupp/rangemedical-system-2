// Energy & Recovery balance card — for patient profile pages
// Shows remaining balance + bonus expiry. Patient-facing: no "credits" language.
import { useState, useEffect } from 'react';

const formatPrice = (cents) => {
  if (!cents && cents !== 0) return '$0';
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export default function EnergyPackBalance({ patientId }) {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    fetch(`/api/energy-packs?patient_id=${patientId}&status=active`)
      .then(r => r.json())
      .then(data => setPacks(data.packs || []))
      .catch(() => setPacks([]))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading || packs.length === 0) return null;

  return (
    <>
      {packs.map(pack => {
        const now = new Date();
        const bonusExpired = new Date(pack.bonus_expires_at) < now;
        const effectiveBonus = bonusExpired ? 0 : pack.remaining_bonus_cents;
        const total = pack.remaining_base_cents + effectiveBonus;

        return (
          <div key={pack.id} style={styles.card}>
            <div style={styles.header}>
              <span style={styles.icon}>⚡</span>
              <span style={styles.title}>Energy & Recovery Balance</span>
            </div>
            <div style={styles.balanceRow}>
              <span style={styles.amount}>{formatPrice(total)}</span>
              <span style={styles.of}> of {formatPrice(pack.total_value_cents)} remaining</span>
            </div>
            {effectiveBonus > 0 && (
              <div style={styles.bonusNote}>
                Bonus portion ({formatPrice(effectiveBonus)}) expires {formatDate(pack.bonus_expires_at)}
              </div>
            )}
            {bonusExpired && pack.remaining_bonus_cents > 0 && (
              <div style={styles.expiredNote}>
                Bonus expired — base balance of {formatPrice(pack.remaining_base_cents)} remains
              </div>
            )}
            <div style={styles.usableOn}>
              Usable on: Red Light Therapy, Hyperbaric Oxygen
            </div>
          </div>
        );
      })}
    </>
  );
}

const styles = {
  card: {
    background: '#fff',
    border: '1px solid #e5e5e5',
    padding: '16px 20px',
    marginBottom: '12px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  icon: {
    fontSize: '16px',
  },
  title: {
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#666',
    letterSpacing: '0.5px',
  },
  balanceRow: {
    marginBottom: '4px',
  },
  amount: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#000',
  },
  of: {
    fontSize: '14px',
    color: '#999',
  },
  bonusNote: {
    fontSize: '13px',
    color: '#b45309',
    background: '#fffbeb',
    padding: '6px 10px',
    marginTop: '8px',
  },
  expiredNote: {
    fontSize: '13px',
    color: '#991b1b',
    background: '#fef2f2',
    padding: '6px 10px',
    marginTop: '8px',
  },
  usableOn: {
    fontSize: '12px',
    color: '#999',
    marginTop: '8px',
  },
};
