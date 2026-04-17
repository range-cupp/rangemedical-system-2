// /pages/admin/settings.js
// Settings page - consolidated utilities and configuration
// Range Medical System V2

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../components/AuthProvider';

const TOOLS = [
  {
    title: 'Link Forms',
    description: 'Link unlinked consent and intake forms to patient records',
    href: '/api/cron/link-forms?key=manual',
    type: 'api'
  },
  {
    title: 'Import Labs',
    description: 'Import lab results from external sources',
    href: '/admin/import-labs',
    type: 'page'
  },
  {
    title: 'Backfill Labs',
    description: 'Backfill lab data for existing patients',
    href: '/admin/backfill-labs',
    type: 'page'
  },
  {
    title: 'Activity Log',
    description: 'View system activity and audit trail',
    href: '/admin/activity-log',
    type: 'page'
  },
  {
    title: 'HRT Dashboard',
    description: 'Dedicated view for HRT protocol management',
    href: '/admin/hrt-dashboard',
    type: 'page'
  },
  {
    title: 'Command Center',
    description: 'Legacy all-in-one operational hub',
    href: '/admin/command-center',
    type: 'page'
  }
];

export default function SettingsPage() {
  return (
    <AdminLayout title="Settings">
      {/* Browser Phone (per-user softphone toggle) */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>My Phone</h2>
        <BrowserPhoneCard />
      </div>

      {/* Tools & Utilities */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Tools & Utilities</h2>
        <div style={styles.grid}>
          {TOOLS.map(tool => (
            <Link key={tool.title} href={tool.href} style={styles.toolCard}>
              <div style={styles.toolTitle}>{tool.title}</div>
              <div style={styles.toolDesc}>{tool.description}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>System Information</h2>
        <div style={styles.card}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>System</span>
            <span style={styles.infoValue}>Range Medical System V2</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Scheduling</span>
            <span style={styles.infoValue}>Cal.com</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Payments</span>
            <span style={styles.infoValue}>Stripe</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>EMR</span>
            <span style={styles.infoValue}>Practice Fusion (external)</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Database</span>
            <span style={styles.infoValue}>Supabase</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Browser Phone toggle — when ON, incoming calls to the clinic ring this
// computer alongside the desk phones. When OFF, calls do not reach this
// browser at all (desk phones + cell extensions still ring as usual).
// ─────────────────────────────────────────────────────────────────────────────
function BrowserPhoneCard() {
  const { employee } = useAuth();
  const [enabled, setEnabled] = useState(null);  // null while loading
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!employee?.id) return;
    fetch(`/api/app/voice-settings?employee_id=${encodeURIComponent(employee.id)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setEnabled(!!d.voice_browser_enabled); })
      .catch(() => {});
  }, [employee?.id]);

  const handleToggle = async () => {
    if (!employee?.id || saving) return;
    const next = !enabled;
    setSaving(true);
    setError('');
    setEnabled(next); // optimistic
    try {
      const r = await fetch('/api/app/voice-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employee.id, voice_browser_enabled: next }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to save');
      }
      const d = await r.json();
      setEnabled(!!d.voice_browser_enabled);
      // Reload so useVoiceCall re-reads settings and registers/tears-down the device
      setTimeout(() => window.location.reload(), 400);
    } catch (err) {
      setEnabled(!next); // revert
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const isOn = enabled === true;

  return (
    <div style={styles.browserPhoneCard}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ ...styles.browserPhoneIcon, background: isOn ? '#dcfce7' : '#f1f5f9' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isOn ? '#16a34a' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.browserPhoneTitle}>Browser Phone</div>
          <div style={styles.browserPhoneDesc}>
            {enabled === null
              ? 'Loading…'
              : isOn
                ? 'Incoming calls ring this computer alongside the desk phones. You can also dial out from here.'
                : 'This computer will not ring. Desk phones and your cell extension still ring as normal.'}
          </div>
        </div>
        <ToggleSwitch
          checked={isOn}
          disabled={enabled === null || saving}
          onChange={handleToggle}
        />
      </div>
      {error && <div style={styles.browserPhoneError}>{error}</div>}
    </div>
  );
}

function ToggleSwitch({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange()}
      disabled={disabled}
      aria-pressed={checked}
      style={{
        position: 'relative',
        width: 52,
        height: 30,
        borderRadius: 15,
        border: 'none',
        background: checked ? '#22c55e' : '#cbd5e1',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'background 0.15s',
        flexShrink: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 25 : 3,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          transition: 'left 0.15s',
        }}
      />
    </button>
  );
}

const styles = {
  section: {
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 16px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px'
  },
  toolCard: {
    display: 'block',
    padding: '20px',
    background: '#fff',
    borderRadius: 0,
    border: '1px solid #e5e5e5',
    textDecoration: 'none',
    color: '#000',
    transition: 'box-shadow 0.15s'
  },
  toolTitle: {
    fontSize: '15px',
    fontWeight: '600',
    marginBottom: '4px'
  },
  toolDesc: {
    fontSize: '13px',
    color: '#666'
  },
  card: {
    background: '#fff',
    borderRadius: 0,
    border: '1px solid #e5e5e5',
    overflow: 'hidden'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid #f0f0f0'
  },
  infoLabel: {
    fontSize: '14px',
    color: '#666'
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: '500'
  },
  browserPhoneCard: {
    background: '#fff',
    border: '1px solid #e5e5e5',
    padding: '20px 24px',
  },
  browserPhoneIcon: {
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  browserPhoneTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: 4,
  },
  browserPhoneDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 1.5,
  },
  browserPhoneError: {
    marginTop: 12,
    fontSize: 13,
    color: '#dc2626',
  },
};
