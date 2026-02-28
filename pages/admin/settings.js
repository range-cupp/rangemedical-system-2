// /pages/admin/settings.js
// Settings page - consolidated utilities and configuration
// Range Medical System V2

import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';

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
    borderRadius: '12px',
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
    borderRadius: '12px',
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
  }
};
