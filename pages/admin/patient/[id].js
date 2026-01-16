// /pages/admin/patient/[id].js
// Patient Profile Page - Range Medical
// Updated with consistent tracking display matching pipeline

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// Helper to get protocol type display
const getProtocolDisplay = (protocol) => {
  const type = (protocol.program_type || '').toLowerCase();
  if (type.includes('weight') || type.includes('wl') || type.includes('glp')) {
    return { icon: '💉', label: 'Weight Loss', color: '#f59e0b' };
  }
  if (type.includes('hrt') || type.includes('testosterone') || type.includes('hormone')) {
    return { icon: '💊', label: 'HRT', color: '#8b5cf6' };
  }
  if (type.includes('peptide') || type.includes('bpc') || type.includes('recovery')) {
    return { icon: '🧬', label: 'Peptide', color: '#10b981' };
  }
  if (type.includes('iv')) {
    return { icon: '💧', label: 'IV', color: '#06b6d4' };
  }
  if (type.includes('hbot')) {
    return { icon: '🫁', label: 'HBOT', color: '#6366f1' };
  }
  if (type.includes('rlt') || type.includes('red') || type.includes('light')) {
    return { icon: '🔴', label: 'RLT', color: '#ef4444' };
  }
  return { icon: '📋', label: 'Protocol', color: '#64748b' };
};

// Get urgency styling
const getUrgencyStyle = (protocol) => {
  const days = protocol.days_remaining;
  const sessions = protocol.sessions_remaining;
  
  if (sessions !== undefined && sessions !== null) {
    if (sessions <= 0) return { bg: '#dcfce7', color: '#166534' };
    if (sessions <= 1) return { bg: '#fef2f2', color: '#dc2626' };
    if (sessions <= 2) return { bg: '#fffbeb', color: '#d97706' };
    return null;
  }
  
  if (days === null || days === undefined) return null;
  if (days <= 0) return { bg: '#fef2f2', color: '#dc2626' };
  if (days <= 3) return { bg: '#fef2f2', color: '#dc2626' };
  if (days <= 7) return { bg: '#fffbeb', color: '#d97706' };
  return null;
};

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

  // Purchase management state
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [purchaseForm, setPurchaseForm] = useState({
    item_name: '',
    amount: '',
    purchase_date: new Date().toISOString().split('T')[0],
    category: 'Peptide'
  });

  // PDF Viewer state
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);

  const PURCHASE_CATEGORIES = ['Peptide', 'IV', 'Injection', 'Weight Loss', 'HRT', 'Labs', 'Red Light', 'HBOT', 'Other'];

  const getPdfUrl = (doc) => {
    if (doc.file_url) return doc.file_url;
    if (doc.file_path) {
      return `https://teivfptpozltpqwahgdl.supabase.co/storage/v1/object/public/lab-documents/${doc.file_path}`;
    }
    return null;
  };

  const openPdfViewer = (doc) => {
    setSelectedPdf(doc);
    setShowPdfViewer(true);
  };

  const closePdfViewer = () => {
    setShowPdfViewer(false);
    setSelectedPdf(null);
  };

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

  // Purchase handlers
  const openAddPurchase = () => {
    setEditingPurchase(null);
    setPurchaseForm({
      item_name: '',
      amount: '',
      purchase_date: new Date().toISOString().split('T')[0],
      category: 'Peptide'
    });
    setShowPurchaseModal(true);
  };

  const openEditPurchase = (purchase) => {
    setEditingPurchase(purchase);
    setPurchaseForm({
      item_name: purchase.product_name || purchase.item_name || '',
      amount: purchase.amount_paid || purchase.amount || '',
      purchase_date: purchase.purchase_date || new Date().toISOString().split('T')[0],
      category: purchase.category || 'Other'
    });
    setShowPurchaseModal(true);
  };

  const handleSavePurchase = async () => {
    if (!purchaseForm.item_name) {
      alert('Please enter a product name');
      return;
    }

    try {
      if (editingPurchase) {
        const res = await fetch(`/api/purchases/${editingPurchase.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_name: purchaseForm.item_name,
            product_name: purchaseForm.item_name,
            amount: parseFloat(purchaseForm.amount) || 0,
            amount_paid: parseFloat(purchaseForm.amount) || 0,
            purchase_date: purchaseForm.purchase_date,
            category: purchaseForm.category
          })
        });
        if (res.ok) {
          fetchPatientData();
          setShowPurchaseModal(false);
        } else {
          alert('Failed to update purchase');
        }
      } else {
        const res = await fetch('/api/purchases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: id,
            ghl_contact_id: patient?.ghl_contact_id,
            patient_name: patient?.name,
            item_name: purchaseForm.item_name,
            product_name: purchaseForm.item_name,
            amount: parseFloat(purchaseForm.amount) || 0,
            amount_paid: parseFloat(purchaseForm.amount) || 0,
            purchase_date: purchaseForm.purchase_date,
            category: purchaseForm.category,
            protocol_created: false,
            dismissed: false
          })
        });
        if (res.ok) {
          fetchPatientData();
          setShowPurchaseModal(false);
        } else {
          alert('Failed to create purchase');
        }
      }
    } catch (error) {
      console.error('Error saving purchase:', error);
      alert('Error saving purchase');
    }
  };

  const handleDeletePurchase = async (purchaseId) => {
    if (!confirm('Delete this purchase?')) return;

    try {
      const res = await fetch(`/api/purchases/${purchaseId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPendingNotifications(pendingNotifications.filter(p => p.id !== purchaseId));
      } else {
        alert('Failed to delete purchase');
      }
    } catch (error) {
      console.error('Error deleting purchase:', error);
    }
  };

  const handleDismissPurchase = async (purchaseId) => {
    try {
      const res = await fetch(`/api/purchases/${purchaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dismissed: true })
      });
      if (res.ok) {
        setPendingNotifications(pendingNotifications.filter(p => p.id !== purchaseId));
      }
    } catch (error) {
      console.error('Error dismissing purchase:', error);
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

  // Format status text for display - matches pipeline logic
  const getStatusDisplay = (protocol) => {
    // Use status_text from API if available
    if (protocol.status_text) {
      return protocol.status_text;
    }
    
    // Fallback display logic
    if (protocol.sessions_remaining !== undefined && protocol.sessions_remaining !== null) {
      return `${protocol.sessions_remaining} sessions left`;
    }
    
    if (protocol.days_remaining !== null && protocol.days_remaining !== undefined) {
      if (protocol.days_remaining <= 0) return 'Ended';
      if (protocol.days_remaining > 14) {
        const weeks = Math.floor(protocol.days_remaining / 7);
        return `~${weeks} weeks left`;
      }
      return `${protocol.days_remaining} days left`;
    }
    
    return 'Active';
  };

  // Format delivery method
  const formatDelivery = (method) => {
    if (!method) return '';
    const m = method.toLowerCase();
    if (m.includes('take') || m.includes('home')) return 'Take Home';
    if (m.includes('clinic')) return 'In Clinic';
    return method;
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
        <title>{patient.first_name || patient.name} {patient.last_name || ''} | Range Medical</title>
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <Link href="/admin/pipeline" style={styles.backLink}>← Back to Pipeline</Link>
          <h1 style={styles.title}>{patient.first_name || patient.name} {patient.last_name || ''}</h1>
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

        {/* Active Protocols Section - Updated to match Pipeline */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Active Protocols</h2>
          {activeProtocols.length === 0 ? (
            <div style={styles.emptyState}>No active protocols</div>
          ) : (
            <div style={styles.protocolList}>
              {activeProtocols.map(protocol => {
                const display = getProtocolDisplay(protocol);
                const urgency = getUrgencyStyle(protocol);
                const statusText = getStatusDisplay(protocol);
                
                return (
                  <Link key={protocol.id} href={`/admin/protocol/${protocol.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{...styles.protocolCard, cursor: 'pointer'}}>
                      <div style={styles.protocolHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            fontSize: '20px',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            backgroundColor: `${display.color}15`
                          }}>
                            {display.icon}
                          </span>
                          <span style={styles.protocolName}>
                            {protocol.medication || protocol.program_name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {urgency && (
                            <span style={{
                              padding: '3px 10px',
                              background: urgency.bg,
                              color: urgency.color,
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {protocol.days_remaining <= 0 ? 'Refill Due' : 
                               protocol.days_remaining <= 7 ? `${protocol.days_remaining}d left` : ''}
                            </span>
                          )}
                          <span style={styles.statusBadge}>Active</span>
                        </div>
                      </div>
                      
                      <div style={styles.protocolDetails}>
                        {protocol.selected_dose && <span>{protocol.selected_dose}</span>}
                        {protocol.frequency && <span> • {protocol.frequency}</span>}
                      </div>
                      
                      {/* Info badges - matching pipeline */}
                      <div style={styles.badgeRow}>
                        {protocol.delivery_method && (
                          <span style={styles.infoBadge}>
                            {formatDelivery(protocol.delivery_method)}
                          </span>
                        )}
                        {protocol.supply_type && (
                          <span style={styles.infoBadge}>
                            {protocol.supply_type}
                          </span>
                        )}
                      </div>
                      
                      <div style={styles.protocolMeta}>
                        <span>
                          {protocol.last_refill_date 
                            ? `Last refill ${formatDate(protocol.last_refill_date)}`
                            : protocol.start_date 
                              ? `Started ${formatDate(protocol.start_date)}`
                              : ''
                          }
                        </span>
                        <span style={{
                          fontWeight: '600',
                          color: urgency ? urgency.color : '#0f172a'
                        }}>
                          {statusText}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
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
                      <button 
                        onClick={() => openPdfViewer(doc)}
                        style={styles.viewButton}
                      >
                        View PDF
                      </button>
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
              {completedProtocols.map(protocol => {
                const display = getProtocolDisplay(protocol);
                return (
                  <div key={protocol.id} style={{...styles.protocolCard, opacity: 0.7}}>
                    <div style={styles.protocolHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          fontSize: '20px',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '8px',
                          backgroundColor: '#f1f5f9'
                        }}>
                          {display.icon}
                        </span>
                        <span style={styles.protocolName}>
                          {protocol.medication || protocol.program_name}
                        </span>
                      </div>
                      <span style={{...styles.statusBadge, background: '#9ca3af'}}>Completed</span>
                    </div>
                    <div style={styles.protocolDetails}>
                      {protocol.selected_dose && <span>{protocol.selected_dose}</span>}
                    </div>
                    <div style={styles.protocolMeta}>
                      {formatDate(protocol.start_date)} → {formatDate(protocol.end_date)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Purchases Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Pending Purchases</h2>
            <button onClick={openAddPurchase} style={styles.addButton}>+ Add Purchase</button>
          </div>
          {pendingNotifications.length > 0 ? (
            <div style={styles.purchaseList}>
              {pendingNotifications.map(purchase => (
                <div key={purchase.id} style={styles.purchaseCard}>
                  <div style={styles.purchaseInfo}>
                    <span style={styles.purchaseName}>{purchase.product_name || purchase.item_name}</span>
                    <span style={styles.purchaseMeta}>
                      ${(purchase.amount_paid || purchase.amount || 0).toFixed(2)} • {formatDate(purchase.purchase_date)}
                    </span>
                  </div>
                  <div style={styles.purchaseActions}>
                    <button onClick={() => openEditPurchase(purchase)} style={styles.editBtn}>Edit</button>
                    <button onClick={() => handleDismissPurchase(purchase.id)} style={styles.dismissBtn}>Dismiss</button>
                    <button onClick={() => handleDeletePurchase(purchase.id)} style={styles.deleteBtn}>×</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>No pending purchases</div>
          )}
        </div>

        {/* Purchase Add/Edit Modal */}
        {showPurchaseModal && (
          <div style={styles.modalOverlay} onClick={() => setShowPurchaseModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>{editingPurchase ? 'Edit Purchase' : 'Add Purchase'}</h3>
                <button onClick={() => setShowPurchaseModal(false)} style={styles.closeButton}>×</button>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Product Name *</label>
                <input 
                  type="text"
                  value={purchaseForm.item_name}
                  onChange={(e) => setPurchaseForm({...purchaseForm, item_name: e.target.value})}
                  placeholder="e.g. Peptide Recovery - 10 Day"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Amount ($)</label>
                <input 
                  type="number"
                  value={purchaseForm.amount}
                  onChange={(e) => setPurchaseForm({...purchaseForm, amount: e.target.value})}
                  placeholder="0.00"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Purchase Date</label>
                <input 
                  type="date"
                  value={purchaseForm.purchase_date}
                  onChange={(e) => setPurchaseForm({...purchaseForm, purchase_date: e.target.value})}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select 
                  value={purchaseForm.category}
                  onChange={(e) => setPurchaseForm({...purchaseForm, category: e.target.value})}
                  style={styles.select}
                >
                  {PURCHASE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={styles.modalFooter}>
                <button onClick={() => setShowPurchaseModal(false)} style={styles.cancelButton}>Cancel</button>
                <button onClick={handleSavePurchase} style={styles.primaryButton}>
                  {editingPurchase ? 'Save Changes' : 'Add Purchase'}
                </button>
              </div>
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

        {/* PDF Viewer Slide-out Panel */}
        {showPdfViewer && selectedPdf && (
          <>
            <div style={styles.pdfOverlay} onClick={closePdfViewer} />
            <div style={styles.pdfSlidePanel}>
              <div style={styles.pdfHeader}>
                <div>
                  <h3 style={styles.pdfTitle}>
                    {selectedPdf.panel_type || 'Lab Results'} Panel
                  </h3>
                  <p style={styles.pdfMeta}>
                    {formatDate(selectedPdf.collection_date || selectedPdf.uploaded_at)}
                    {selectedPdf.lab_provider && ` • ${selectedPdf.lab_provider}`}
                  </p>
                </div>
                <div style={styles.pdfHeaderActions}>
                  <a 
                    href={getPdfUrl(selectedPdf)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={styles.openNewTabBtn}
                  >
                    Open in New Tab ↗
                  </a>
                  <button onClick={closePdfViewer} style={styles.closePdfBtn}>×</button>
                </div>
              </div>
              <div style={styles.pdfContent}>
                <object 
                  data={getPdfUrl(selectedPdf)}
                  type="application/pdf"
                  style={styles.pdfIframe}
                >
                  <div style={styles.pdfFallback}>
                    <p style={{marginBottom: '16px'}}>Unable to display PDF in browser.</p>
                    <a 
                      href={getPdfUrl(selectedPdf)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={styles.downloadButton}
                    >
                      Download PDF
                    </a>
                  </div>
                </object>
              </div>
            </div>
          </>
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
    cursor: 'pointer',
    fontWeight: '500'
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
    borderRadius: '12px',
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
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
  },
  protocolDetails: {
    fontSize: '14px',
    color: '#374151',
    marginBottom: '8px'
  },
  badgeRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
    flexWrap: 'wrap'
  },
  infoBadge: {
    padding: '3px 10px',
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#475569'
  },
  protocolMeta: {
    fontSize: '13px',
    color: '#64748b',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
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
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer'
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
  purchaseActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  editBtn: {
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    padding: '5px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  dismissBtn: {
    background: '#fef3c7',
    color: '#92400e',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  deleteBtn: {
    background: 'none',
    border: '1px solid #fca5a5',
    color: '#dc2626',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px'
  },
  cancelButton: {
    background: '#fff',
    color: '#374151',
    border: '1px solid #d1d5db',
    padding: '10px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  primaryButton: {
    background: '#000',
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500'
  },
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
  submitButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    background: '#000',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px'
  },
  pdfOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 1000
  },
  pdfSlidePanel: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '70%',
    maxWidth: '900px',
    height: '100vh',
    background: '#fff',
    boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideIn 0.3s ease-out'
  },
  pdfHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    background: '#f9fafb'
  },
  pdfTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600'
  },
  pdfMeta: {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: '#666'
  },
  pdfHeaderActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  openNewTabBtn: {
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    textDecoration: 'none',
    cursor: 'pointer'
  },
  closePdfBtn: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#666',
    padding: '0 8px',
    lineHeight: 1
  },
  pdfContent: {
    flex: 1,
    overflow: 'hidden'
  },
  pdfIframe: {
    width: '100%',
    height: '100%',
    border: 'none'
  },
  pdfFallback: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#666',
    fontSize: '16px'
  },
  downloadButton: {
    background: '#000',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500'
  }
};
