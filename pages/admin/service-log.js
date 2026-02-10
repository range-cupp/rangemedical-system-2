// /pages/admin/service-log.js
// Standalone Service Log page — thin wrapper around ServiceLogContent

import Head from 'next/head';
import Link from 'next/link';
import ServiceLogContent from '../../components/ServiceLogContent';

export default function ServiceLog() {
  return (
    <>
      <Head>
        <title>Service Log | Range Medical</title>
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <Link href="/admin/command-center" style={styles.backLink}>← Command Center</Link>
            <h1 style={styles.title}>Service Log</h1>
            <span style={styles.subtitle}>Track all services delivered</span>
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.main}>
          <div style={styles.content}>
            <ServiceLogContent />
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#FFFFFF',
    color: '#1A1A1A',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #E5E5E5',
    background: '#FAFAFA',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
  },
  backLink: {
    color: '#666',
    textDecoration: 'none',
    fontSize: '14px',
    marginRight: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  main: {
    padding: '24px',
    background: '#F5F5F5',
    minHeight: 'calc(100vh - 80px)',
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
};
