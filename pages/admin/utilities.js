// /pages/admin/utilities.js
// Admin Utilities Page - Range Medical
// Tools for data management and maintenance

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function AdminUtilities() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  // Link Forms state
  const [linkingForms, setLinkingForms] = useState(false);
  const [linkFormsResult, setLinkFormsResult] = useState(null);
  
  // Link Contacts state
  const [linkingContacts, setLinkingContacts] = useState(false);
  const [linkContactsResult, setLinkContactsResult] = useState(null);
  
  // Backfill Patients state
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);

  const handleLogin = () => {
    if (password === 'range2024') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid password');
    }
  };

  const handleLinkForms = async () => {
    if (!confirm('This will link all unlinked consents and intakes to patient records. Continue?')) {
      return;
    }
    
    setLinkingForms(true);
    setLinkFormsResult(null);
    
    try {
      const res = await fetch('/api/admin/link-forms', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        setLinkFormsResult(data);
      } else {
        alert('Error: ' + (data.error || 'Failed to link forms'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLinkingForms(false);
    }
  };

  const handleLinkContacts = async () => {
    if (!confirm('This will link all unlinked purchases and protocols to patient records. Continue?')) {
      return;
    }
    
    setLinkingContacts(true);
    setLinkContactsResult(null);
    
    try {
      const res = await fetch('/api/admin/purchases/link-contacts', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        setLinkContactsResult(data);
      } else {
        alert('Error: ' + (data.error || 'Failed to link contacts'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLinkingContacts(false);
    }
  };

  const handleBackfillPatients = async () => {
    if (!confirm('This will create patient records from intakes that don\\'t have linked patients. Continue?')) {
      return;
    }
    
    setBackfilling(true);
    setBackfillResult(null);
    
    try {
      const res = await fetch('/api/admin/backfill-patients-from-intakes', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        setBackfillResult(data);
      } else {
        alert('Error: ' + (data.error || 'Failed to backfill patients'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setBackfilling(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Admin Utilities | Range Medical</title>
        </Head>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#f5f5f5'
        }}>
          <div style={{ 
            background: 'white', 
            padding: '40px', 
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '360px'
          }}>
            <h1 style={{ margin: '0 0 24px', fontSize: '24px', fontWeight: '600' }}>Admin Utilities</h1>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '16px',
                boxSizing: 'border-box'
              }}
            />
            <button
              onClick={handleLogin}
              style={{
                width: '100%',
                padding: '12px',
                background: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Login
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Utilities | Range Medical</title>
      </Head>
      
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        {/* Header */}
        <header style={{ background: 'white', borderBottom: '1px solid #e5e5e5', padding: '16px 24px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Admin Utilities</h1>
            <Link href="/admin/protocols" style={{ color: '#666', fontSize: '14px', textDecoration: 'none' }}>
              ← Back to Dashboard
            </Link>
          </div>
        </header>

        {/* Content */}
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
          
          {/* Link Forms Card */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e5e5', marginBottom: '24px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Link Forms to Patients</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>
                Connect unlinked consents and medical intakes to patient records
              </p>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#666' }}>
                This will find all consents and intakes that don't have a patient_id and attempt to match them 
                to patients using GHL Contact ID, email, or phone number.
              </p>
              
              <button
                onClick={handleLinkForms}
                disabled={linkingForms}
                style={{
                  padding: '10px 20px',
                  background: linkingForms ? '#ccc' : '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: linkingForms ? 'wait' : 'pointer'
                }}
              >
                {linkingForms ? 'Linking...' : 'Link Forms'}
              </button>
              
              {linkFormsResult && (
                <div style={{ marginTop: '16px', padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#16a34a', marginBottom: '8px' }}>✓ Complete</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    <div>Consents: Found {linkFormsResult.results?.consents?.found || 0}, Linked {linkFormsResult.results?.consents?.linked || 0}</div>
                    <div>Intakes: Found {linkFormsResult.results?.intakes?.found || 0}, Linked {linkFormsResult.results?.intakes?.linked || 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Link Contacts Card */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e5e5', marginBottom: '24px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Link Purchases to Patients</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>
                Connect unlinked purchases to patient records
              </p>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#666' }}>
                This will find all purchases without a GHL Contact ID and attempt to match them 
                to patients using name matching (including nicknames).
              </p>
              
              <button
                onClick={handleLinkContacts}
                disabled={linkingContacts}
                style={{
                  padding: '10px 20px',
                  background: linkingContacts ? '#ccc' : '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: linkingContacts ? 'wait' : 'pointer'
                }}
              >
                {linkingContacts ? 'Linking...' : 'Link Purchases'}
              </button>
              
              {linkContactsResult && (
                <div style={{ marginTop: '16px', padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#16a34a', marginBottom: '8px' }}>✓ Complete</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    Updated {linkContactsResult.updated || 0} purchases, Skipped {linkContactsResult.skipped || 0}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div style={{ background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7', padding: '20px 24px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '600', color: '#92400e' }}>💡 Automatic Linking</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#92400e' }}>
              New form submissions are automatically linked to patients when they come in via webhooks. 
              A daily cron job also runs to catch any forms that may have been missed.
            </p>
          </div>

          {/* Backfill Patients Card */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e5e5', marginBottom: '24px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Create Patients from Intakes</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>
                Create patient records from existing intake forms
              </p>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#666' }}>
                This will scan all intakes and create patient records for any that don't have one. 
                Useful for intakes submitted before patient creation was automatic.
              </p>
              
              <button
                onClick={handleBackfillPatients}
                disabled={backfilling}
                style={{
                  padding: '10px 20px',
                  background: backfilling ? '#ccc' : '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: backfilling ? 'wait' : 'pointer'
                }}
              >
                {backfilling ? 'Processing...' : 'Create Patients from Intakes'}
              </button>
              
              {backfillResult && (
                <div style={{ marginTop: '16px', padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#16a34a', marginBottom: '8px' }}>✓ Complete</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    <div>Intakes processed: {backfillResult.results?.intakesProcessed || 0}</div>
                    <div>New patients created: {backfillResult.results?.patientsCreated || 0}</div>
                    <div>Linked to existing: {backfillResult.results?.patientsLinked || 0}</div>
                    <div>Already linked: {backfillResult.results?.alreadyLinked || 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </main>
      </div>
    </>
  );
}
