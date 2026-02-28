// /pages/admin/sign-out/[id].js
// Printable sign-out sheet for a service log entry
// Range Medical System V2

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function SignOutSheet() {
  const router = useRouter();
  const { id } = router.query;
  const [entry, setEntry] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchEntry();
  }, [id]);

  const fetchEntry = async () => {
    try {
      const res = await fetch(`/api/service-log/sign-out-sheet?id=${id}`);
      const data = await res.json();
      if (data.entry) {
        setEntry(data.entry);
        setPatient(data.patient);
      }
    } catch (error) {
      console.error('Error fetching sign-out data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getCategoryLabel = (cat) => {
    const labels = {
      testosterone: 'HRT / Testosterone',
      weight_loss: 'Weight Loss',
      vitamin: 'Vitamin Injection',
      peptide: 'Peptide Therapy',
      iv_therapy: 'IV Therapy',
      hbot: 'HBOT',
      red_light: 'Red Light Therapy',
      supplement: 'Supplement / Product'
    };
    return labels[cat] || cat;
  };

  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!entry) {
    return <div style={{ padding: '48px', textAlign: 'center' }}>Sign-out record not found.</div>;
  }

  return (
    <>
      <Head>
        <title>Sign-Out Sheet — Range Medical</title>
      </Head>

      <div style={styles.page}>
        {/* Print Button (hidden on print) */}
        <div style={styles.printActions} className="no-print">
          <button onClick={() => window.print()} style={styles.printBtn}>
            Print Sign-Out Sheet
          </button>
          <button onClick={() => router.back()} style={styles.backBtn}>
            ← Back
          </button>
        </div>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.clinicInfo}>
            <h1 style={styles.clinicName}>RANGE MEDICAL</h1>
            <p style={styles.clinicAddress}>1901 Westcliff Dr, Suite 9 & 10, Newport Beach, CA 92660</p>
            <p style={styles.clinicPhone}>(949) 438-3881</p>
          </div>
          <div style={styles.sheetTitle}>
            <h2>Service Sign-Out Sheet</h2>
            <p>Date: {formatDate(entry.entry_date)}</p>
          </div>
        </div>

        <hr style={styles.divider} />

        {/* Patient Info */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Patient Information</h3>
          <div style={styles.fieldGrid}>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Name</span>
              <span style={styles.fieldValue}>
                {patient?.first_name && patient?.last_name
                  ? `${patient.first_name} ${patient.last_name}`
                  : patient?.name || entry.patient_name || '—'}
              </span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>DOB</span>
              <span style={styles.fieldValue}>{patient?.date_of_birth ? formatDate(patient.date_of_birth) : '—'}</span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Email</span>
              <span style={styles.fieldValue}>{patient?.email || '—'}</span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Phone</span>
              <span style={styles.fieldValue}>{patient?.phone || '—'}</span>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Service Details</h3>
          <div style={styles.fieldGrid}>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Service Type</span>
              <span style={styles.fieldValue}>{getCategoryLabel(entry.category)}</span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Entry Type</span>
              <span style={styles.fieldValue}>{(entry.entry_type || '').replace(/_/g, ' ')}</span>
            </div>
            {entry.medication && (
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Medication</span>
                <span style={styles.fieldValue}>{entry.medication}</span>
              </div>
            )}
            {entry.dosage && (
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Dosage</span>
                <span style={styles.fieldValue}>{entry.dosage}</span>
              </div>
            )}
            {entry.quantity && (
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Quantity</span>
                <span style={styles.fieldValue}>{entry.quantity}</span>
              </div>
            )}
            {entry.duration && (
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Duration</span>
                <span style={styles.fieldValue}>{entry.duration} min</span>
              </div>
            )}
          </div>
        </div>

        {/* Dispensing Details */}
        {(entry.administered_by || entry.lot_number || entry.expiration_date) && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Dispensing Details</h3>
            <div style={styles.fieldGrid}>
              {entry.administered_by && (
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>Administered By</span>
                  <span style={styles.fieldValue}>{entry.administered_by}</span>
                </div>
              )}
              {entry.lot_number && (
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>Lot Number</span>
                  <span style={styles.fieldValue}>{entry.lot_number}</span>
                </div>
              )}
              {entry.expiration_date && (
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>Expiration Date</span>
                  <span style={styles.fieldValue}>{formatDate(entry.expiration_date)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {entry.notes && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Notes</h3>
            <p style={styles.notes}>{entry.notes}</p>
          </div>
        )}

        {/* Signature */}
        <div style={styles.signatureSection}>
          <div style={styles.signatureBox}>
            <div style={styles.signatureLabel}>Patient Signature</div>
            {entry.signature_url ? (
              <img src={entry.signature_url} alt="Patient signature" style={styles.signatureImage} />
            ) : (
              <div style={styles.signatureLine}></div>
            )}
            <div style={styles.signatureDate}>
              Date: {entry.signed_at ? formatDate(entry.signed_at.split('T')[0]) : formatDate(entry.entry_date)}
            </div>
          </div>

          <div style={styles.signatureBox}>
            <div style={styles.signatureLabel}>Provider / Staff Signature</div>
            <div style={styles.signatureLine}></div>
            <div style={styles.signatureDate}>Date: _______________</div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p>Range Medical — Health Optimization & Longevity Clinic</p>
          <p style={styles.footerSmall}>This document is confidential and intended for the patient named above.</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
      `}</style>
    </>
  );
}

const styles = {
  page: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: '#111',
    lineHeight: '1.5'
  },
  printActions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px'
  },
  printBtn: {
    padding: '10px 20px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  backBtn: {
    padding: '10px 20px',
    background: '#fff',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  clinicInfo: {},
  clinicName: {
    fontSize: '22px',
    fontWeight: '700',
    margin: '0 0 4px',
    letterSpacing: '1px'
  },
  clinicAddress: { fontSize: '13px', color: '#6b7280', margin: '0' },
  clinicPhone: { fontSize: '13px', color: '#6b7280', margin: '0' },
  sheetTitle: { textAlign: 'right' },
  divider: { border: 'none', borderTop: '2px solid #000', margin: '16px 0 24px' },
  section: { marginBottom: '24px' },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '8px',
    marginBottom: '12px'
  },
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px 24px'
  },
  field: {
    padding: '6px 0',
    borderBottom: '1px solid #f3f4f6'
  },
  fieldLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#9ca3af',
    marginBottom: '2px'
  },
  fieldValue: { fontSize: '14px' },
  notes: {
    fontSize: '14px',
    background: '#f9fafb',
    padding: '12px',
    borderRadius: '6px',
    margin: 0,
    whiteSpace: 'pre-wrap'
  },
  signatureSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px',
    marginTop: '40px',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb'
  },
  signatureBox: {},
  signatureLabel: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#6b7280',
    marginBottom: '8px'
  },
  signatureImage: {
    maxWidth: '100%',
    height: '80px',
    objectFit: 'contain',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    marginBottom: '8px'
  },
  signatureLine: {
    height: '60px',
    borderBottom: '1px solid #000',
    marginBottom: '8px'
  },
  signatureDate: {
    fontSize: '12px',
    color: '#6b7280'
  },
  footer: {
    marginTop: '48px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '12px'
  },
  footerSmall: {
    fontSize: '10px',
    marginTop: '4px'
  }
};
