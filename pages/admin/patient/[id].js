// /pages/admin/patient/[id].js
// Patient Profile Page - Range Medical
// Includes: Protocols, Labs, Forms/Consents, Purchase History

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function PatientProfile() {
  const router = useRouter();
  const { id } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [activeProtocols, setActiveProtocols] = useState([]);
  const [completedProtocols, setCompletedProtocols] = useState([]);
  const [pendingNotifications, setPendingNotifications] = useState([]);
  const [pendingLabOrders, setPendingLabOrders] = useState([]);
  const [labs, setLabs] = useState([]);
  const [labDocuments, setLabDocuments] = useState([]);
  const [stats, setStats] = useState({});
  
  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null,
    panelType: 'Elite',
    collectionDate: new Date().toISOString().split('T')[0],
    labProvider: 'AccessMedLabs',
    notes: ''
  });
  const fileInputRef = useRef(null);
  
  // Edit protocol state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (id) {
      fetchPatientData();
      fetchLabDocuments();
    }
  }, [id]);

  const fetchPatientData = async () => {
    try {
      const res = await fetch(`/api/patients/${id}`);
      if (!res.ok) throw new Error('Failed to fetch patient');
      const data = await res.json();
      
      setPatient(data.patient);
      setActiveProtocols(data.activeProtocols || []);
      setCompletedProtocols(data.completedProtocols || []);
      setPendingNotifications(data.pendingNotifications || []);
      setPendingLabOrders(data.pendingLabOrders || []);
      setLabs(data.labs || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLabDocuments = async () => {
    try {
      const res = await fetch(`/api/patients/${id}/lab-documents`);
      if (res.ok) {
        const data = await res.json();
        setLabDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching lab documents:', error);
    }
  };

  const handleUploadLab = async () => {
    if (!uploadForm.file) {
      alert('Please select a file');
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const fileData = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(uploadForm.file);
      });

      const res = await fetch(`/api/patients/${id}/upload-lab`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData,
          fileName: uploadForm.file.name,
          panelType: uploadForm.panelType,
          collectionDate: uploadForm.collectionDate,
          labProvider: uploadForm.labProvider,
          notes: uploadForm.notes
        })
      });

      if (res.ok) {
        setShowUploadModal(false);
        setUploadForm({
          file: null,
          panelType: 'Elite',
          collectionDate: new Date().toISOString().split('T')[0],
          labProvider: 'AccessMedLabs',
          notes: ''
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchLabDocuments();
        fetchPatientData();
        alert('Lab results uploaded successfully');
      } else {
        const error = await res.json();
        alert(error.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLabDocument = async (docId) => {
    if (!confirm('Delete this lab document?')) return;
    
    try {
      const res = await fetch(`/api/patients/${id}/lab-documents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId })
      });
      if (res.ok) {
        setLabDocuments(labDocuments.filter(d => d.id !== docId));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleDeleteLabOrder = async (orderId) => {
    if (!confirm('Delete this lab order?')) return;
    
    try {
      const res = await fetch(`/api/lab-orders/${orderId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPendingLabOrders(pendingLabOrders.filter(o => o.id !== orderId));
      }
    } catch (error) {
      console.error('Error deleting lab order:', error);
    }
  };

  const handleMarkLabComplete = async (orderId) => {
    try {
      const res = await fetch(`/api/lab-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      if (res.ok) {
        setPendingLabOrders(pendingLabOrders.filter(o => o.id !== orderId));
        alert('Lab order marked as complete. Upload the results using "+ Upload Results"');
      }
    } catch (error) {
      console.error('Error updating lab order:', error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return <div style={styles.loading}>Loading patient profile...</div>;
  }

  if (!patient) {
    return <div style={styles.loading}>Patient not found</div>;
  }

  return (
    <>
      <Head>
        <title>{patient.first_name} {patient.last_name} | Range Medical</title>
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <Link href="/admin/pipeline" style={styles.backLink}>← Back to Pipeline</Link>
          <h1 style={styles.title}>{patient.first_name} {patient.last_name}</h1>
          <div style={styles.patientMeta}>
            {patient.email && <span>{patient.email}</span>}
            {patient.phone && <span> • {patient.phone}</span>}
          </div>
        </div>

        {/* Stats Row */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.activeCount || 0}</div>
            <div style={styles.statLabel}>Active Protocols</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.completedCount || 0}</div>
            <div style={styles.statLabel}>Completed</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.pendingLabsCount || 0}</div>
            <div style={styles.statLabel}>Pending Labs</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{labDocuments.length}</div>
            <div style={styles.statLabel}>Lab Results</div>
          </div>
        </div>

        {/* Active Protocols Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Active Protocols</h2>
          {activeProtocols.length === 0 ? (
            <div style={styles.emptyState}>No active protocols</div>
          ) : (
            <div style={styles.protocolList}>
              {activeProtocols.map(protocol => (
                <div key={protocol.id} style={styles.protocolCard}>
                  <div style={styles.protocolHeader}>
                    <span style={styles.protocolName}>
                      {protocol.medication || protocol.program_name}
                    </span>
                    <span style={styles.statusBadge}>Active</span>
                  </div>
                  <div style={styles.protocolDetails}>
                    {protocol.selected_dose && <span>{protocol.selected_dose}</span>}
                    {protocol.frequency && <span> • {protocol.frequency}</span>}
                  </div>
                  <div style={styles.protocolMeta}>
                    {protocol.start_date && <span>Started {formatDate(protocol.start_date)}</span>}
                    {protocol.days_remaining !== null && (
                      <span style={{
                        marginLeft: '12px',
                        color: protocol.days_remaining <= 3 ? '#dc2626' : '#666'
                      }}>
                        {protocol.days_remaining} days left
                      </span>
                    )}
                    {protocol.total_sessions && (
                      <span style={{ marginLeft: '12px' }}>
                        {protocol.sessions_used || 0}/{protocol.total_sessions} sessions
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LABS SECTION */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Labs</h2>
            <button onClick={() => setShowUploadModal(true)} style={styles.addButton}>
              + Upload Results
            </button>
          </div>

          {/* Pending Lab Orders */}
          {pendingLabOrders.length > 0 && (
            <div style={styles.subsection}>
              <h3 style={styles.subsectionTitle}>⏳ Pending Lab Orders</h3>
              {pendingLabOrders.map(order => (
                <div key={order.id} style={styles.labOrderCard}>
                  <div style={styles.labOrderInfo}>
                    <span style={styles.labOrderType}>{order.order_type}</span>
                    <span style={styles.labOrderDate}>Ordered {formatDate(order.order_date)}</span>
                  </div>
                  <div style={styles.labOrderActions}>
                    <button 
                      onClick={() => handleMarkLabComplete(order.id)}
                      style={styles.completeButton}
                    >
                      ✓ Complete
                    </button>
                    <button 
                      onClick={() => handleDeleteLabOrder(order.id)}
                      style={styles.deleteLabButton}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lab Documents */}
          <div style={styles.subsection}>
            <h3 style={styles.subsectionTitle}>📋 Lab Results</h3>
            {labDocuments.length === 0 ? (
              <div style={styles.emptyState}>No lab results uploaded yet</div>
            ) : (
              <div style={styles.labDocList}>
                {labDocuments.map(doc => (
                  <div key={doc.id} style={styles.labDocCard}>
                    <div style={styles.labDocInfo}>
                      <div style={styles.labDocTitle}>
                        {doc.panel_type || 'Lab Results'} Panel
                        {doc.lab_provider && <span style={styles.labProvider}> • {doc.lab_provider}</span>}
                      </div>
                      <div style={styles.labDocMeta}>
                        {formatDate(doc.collection_date || doc.uploaded_at)}
                        {doc.notes && <span> • {doc.notes}</span>}
                      </div>
                    </div>
                    <div style={styles.labDocActions}>
                      <a 
                        href={doc.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={styles.viewButton}
                      >
                        View PDF
                      </a>
                      <button 
                        onClick={() => handleDeleteLabDocument(doc.id)}
                        style={styles.deleteButton}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Completed Protocols Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Completed Protocols</h2>
          {completedProtocols.length === 0 ? (
            <div style={styles.emptyState}>No completed protocols</div>
          ) : (
            <div style={styles.protocolList}>
              {completedProtocols.map(protocol => (
                <div key={protocol.id} style={{...styles.protocolCard, opacity: 0.7}}>
                  <div style={styles.protocolHeader}>
                    <span style={styles.protocolName}>
                      {protocol.medication || protocol.program_name}
                    </span>
                    <span style={{...styles.statusBadge, background: '#9ca3af'}}>Completed</span>
                  </div>
                  <div style={styles.protocolDetails}>
                    {protocol.selected_dose && <span>{protocol.selected_dose}</span>}
                    {protocol.frequency && <span> • {protocol.frequency}</span>}
                  </div>
                  <div style={styles.protocolMeta}>
                    {formatDate(protocol.start_date)} → {formatDate(protocol.end_date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Purchase History Section */}
        {pendingNotifications.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Pending Purchases</h2>
            <div style={styles.purchaseList}>
              {pendingNotifications.map(purchase => (
                <div key={purchase.id} style={styles.purchaseCard}>
                  <div style={styles.purchaseInfo}>
                    <span style={styles.purchaseName}>{purchase.product_name}</span>
                    <span style={styles.purchaseMeta}>
                      ${purchase.amount_paid?.toFixed(2)} • {formatDate(purchase.purchase_date)}
                    </span>
                  </div>
                  <span style={styles.needsProtocolBadge}>Needs Protocol</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Lab Modal */}
        {showUploadModal && (
          <div style={styles.modalOverlay} onClick={() => setShowUploadModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Upload Lab Results</h3>
                <button onClick={() => setShowUploadModal(false)} style={styles.closeButton}>×</button>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>PDF File *</label>
                <input 
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf"
                  onChange={(e) => setUploadForm({...uploadForm, file: e.target.files[0]})}
                  style={styles.fileInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Panel Type</label>
                <select 
                  value={uploadForm.panelType}
                  onChange={(e) => setUploadForm({...uploadForm, panelType: e.target.value})}
                  style={styles.select}
                >
                  <option value="Elite">Elite Panel</option>
                  <option value="Essential">Essential Panel</option>
                  <option value="Hormone">Hormone Panel</option>
                  <option value="Thyroid">Thyroid Panel</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Lab Provider</label>
                <select 
                  value={uploadForm.labProvider}
                  onChange={(e) => setUploadForm({...uploadForm, labProvider: e.target.value})}
                  style={styles.select}
                >
                  <option value="AccessMedLabs">AccessMedLabs</option>
                  <option value="Primex">Primex</option>
                  <option value="LabCorp">LabCorp</option>
                  <option value="Quest">Quest Diagnostics</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Collection Date</label>
                <input 
                  type="date"
                  value={uploadForm.collectionDate}
                  onChange={(e) => setUploadForm({...uploadForm, collectionDate: e.target.value})}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notes (optional)</label>
                <input 
                  type="text"
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({...uploadForm, notes: e.target.value})}
                  placeholder="e.g., Baseline, Follow-up"
                  style={styles.input}
                />
              </div>

              <div style={styles.modalActions}>
                <button onClick={() => setShowUploadModal(false)} style={styles.cancelButton}>
                  Cancel
                </button>
                <button 
                  onClick={handleUploadLab} 
                  disabled={uploading || !uploadForm.file}
                  style={styles.submitButton}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: '#666'
  },
  header: {
    marginBottom: '24px'
  },
  backLink: {
    color: '#666',
    textDecoration: 'none',
    fontSize: '14px',
    display: 'inline-block',
    marginBottom: '8px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    margin: '0 0 4px 0'
  },
  patientMeta: {
    fontSize: '14px',
    color: '#666'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '32px'
  },
  statCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#000'
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px'
  },
  section: {
    marginBottom: '32px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 16px 0'
  },
  addButton: {
    background: '#000',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  subsection: {
    marginBottom: '20px'
  },
  subsectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '12px'
  },
  emptyState: {
    padding: '24px',
    textAlign: 'center',
    color: '#9ca3af',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  protocolList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  protocolCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px'
  },
  protocolHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  protocolName: {
    fontWeight: '600',
    fontSize: '16px'
  },
  statusBadge: {
    background: '#22c55e',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
  },
  protocolDetails: {
    fontSize: '14px',
    color: '#374151',
    marginBottom: '4px'
  },
  protocolMeta: {
    fontSize: '13px',
    color: '#9ca3af'
  },
  labOrderCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#fffbeb',
    border: '1px solid #fcd34d',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '8px'
  },
  labOrderInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  labOrderType: {
    fontWeight: '600',
    fontSize: '14px'
  },
  labOrderDate: {
    fontSize: '13px',
    color: '#92400e'
  },
  pendingBadge: {
    background: '#fcd34d',
    color: '#92400e',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
  },
  labOrderActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  completeButton: {
    background: '#22c55e',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  deleteLabButton: {
    background: 'none',
    border: '1px solid #fca5a5',
    color: '#dc2626',
    padding: '4px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600'
  },
  labDocList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  labDocCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: '8px',
    padding: '12px 16px'
  },
  labDocInfo: {
    flex: 1
  },
  labDocTitle: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#166534'
  },
  labProvider: {
    fontWeight: '400',
    color: '#22c55e'
  },
  labDocMeta: {
    fontSize: '13px',
    color: '#15803d',
    marginTop: '2px'
  },
  labDocActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  viewButton: {
    background: '#000',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    textDecoration: 'none'
  },
  deleteButton: {
    background: 'none',
    border: '1px solid #fca5a5',
    color: '#dc2626',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  purchaseList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  purchaseCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px 16px'
  },
  purchaseInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  purchaseName: {
    fontWeight: '600',
    fontSize: '14px'
  },
  purchaseMeta: {
    fontSize: '13px',
    color: '#666'
  },
  needsProtocolBadge: {
    background: '#fef3c7',
    color: '#92400e',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '450px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '6px',
    color: '#374151'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    background: '#fff',
    boxSizing: 'border-box'
  },
  fileInput: {
    width: '100%',
    padding: '10px',
    border: '1px dashed #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px'
  },
  cancelButton: {
    padding: '10px 20px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px'
  },
  submitButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    background: '#000',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px'
  }
};
