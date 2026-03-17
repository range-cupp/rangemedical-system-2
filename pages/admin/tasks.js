// /pages/admin/tasks.js
// Internal staff task/communication system
// Create, assign, and track tasks between team members
// Range Medical System

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Mic, MicOff, Phone, MessageSquare, Send, Loader2 } from 'lucide-react';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';
import { useAuth } from '../../components/AuthProvider';

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  high: { label: 'High', bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  medium: { label: 'Medium', bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
  low: { label: 'Low', bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
};

export default function TasksPage() {
  const { session, employee } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('my'); // my, assigned, all
  const [statusFilter, setStatusFilter] = useState('pending'); // pending, completed, ''
  const [employees, setEmployees] = useState([]);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    patient_name: '',
    priority: 'medium',
    due_date: '',
  });

  // Voice dictation state
  const [listening, setListening] = useState(false);
  const [dictationTarget, setDictationTarget] = useState('title'); // 'title' or 'description'
  const recognitionRef = useRef(null);

  // Patient search
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);

  // SMS composer state per task: { [taskId]: { message, loading, sending, sent, error, open } }
  const [smsState, setSmsState] = useState({});

  // Lab review state
  const [labPanel, setLabPanel] = useState(null); // { type: 'results'|'pdf', labId, pdfUrl, patientName }
  const [labReviewOpen, setLabReviewOpen] = useState(null); // task.id that has review panel open
  const [labReviewForms, setLabReviewForms] = useState({}); // { [taskId]: { types, instructions, submitting, done, error } }
  const [labInfoCache, setLabInfoCache] = useState({}); // { [patientId]: { labId, pdfUrl } }

  const openSmsComposer = (task) => {
    setSmsState(prev => ({ ...prev, [task.id]: { ...prev[task.id], open: true, sent: false, error: null } }));
  };

  const generateRenewalText = async (task) => {
    setSmsState(prev => ({ ...prev, [task.id]: { ...prev[task.id], open: true, loading: true, error: null } }));
    try {
      const res = await fetch('/api/tasks/generate-renewal-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          patient_name: task.patient_name,
          task_title: task.title,
          task_description: task.description,
        }),
      });
      const data = await res.json();
      setSmsState(prev => ({ ...prev, [task.id]: { ...prev[task.id], message: data.message, loading: false } }));
    } catch (err) {
      setSmsState(prev => ({ ...prev, [task.id]: { ...prev[task.id], loading: false, error: 'Failed to generate message' } }));
    }
  };

  const sendTaskSms = async (task) => {
    const state = smsState[task.id];
    if (!state?.message?.trim() || !task.patient_phone) return;
    setSmsState(prev => ({ ...prev, [task.id]: { ...prev[task.id], sending: true, error: null } }));
    try {
      const res = await fetch('/api/tasks/send-renewal-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          patient_id: task.patient_id,
          patient_name: task.patient_name,
          patient_phone: task.patient_phone,
          message: state.message,
          task_id: task.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSmsState(prev => ({ ...prev, [task.id]: { ...prev[task.id], sending: false, sent: true, message: '' } }));
      } else {
        setSmsState(prev => ({ ...prev, [task.id]: { ...prev[task.id], sending: false, error: data.error || 'Send failed' } }));
      }
    } catch (err) {
      setSmsState(prev => ({ ...prev, [task.id]: { ...prev[task.id], sending: false, error: 'Send failed' } }));
    }
  };

  // ── Lab review helpers ──────────────────────────────────────────────────────

  const parseLabMeta = (description) => {
    if (!description) return {};
    const marker = '---LAB_META---';
    const idx = description.indexOf(marker);
    if (idx === -1) return {};
    try { return JSON.parse(description.slice(idx + marker.length).trim()); } catch { return {}; }
  };

  const getDisplayDescription = (description) => {
    if (!description) return '';
    const marker = '---LAB_META---';
    const idx = description.indexOf(marker);
    return idx !== -1 ? description.slice(0, idx).trim() : description;
  };

  const fetchLabInfo = async (patientId) => {
    if (labInfoCache[patientId]) return labInfoCache[patientId];
    try {
      const res = await fetch(`/api/admin/patient-lab-info?patient_id=${patientId}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setLabInfoCache(prev => ({ ...prev, [patientId]: data }));
        return data;
      }
    } catch (e) { console.error('fetchLabInfo error:', e); }
    return null;
  };

  const openLabPanel = async (type, task) => {
    const info = await fetchLabInfo(task.patient_id);
    setLabPanel({ type, labId: info?.labId, pdfUrl: info?.pdfUrl, patientName: task.patient_name });
  };

  const submitLabReview = async (taskId, patientId) => {
    const form = labReviewForms[taskId] || {};
    const types = form.types || [];
    if (types.length === 0) {
      setLabReviewForms(prev => ({ ...prev, [taskId]: { ...prev[taskId], error: 'Please select at least one consultation type.' } }));
      return;
    }
    setLabReviewForms(prev => ({ ...prev, [taskId]: { ...prev[taskId], submitting: true, error: null } }));
    try {
      const res = await fetch('/api/admin/complete-lab-review', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ task_id: taskId, patient_id: patientId, consultation_types: types, instructions: form.instructions || '' }),
      });
      const data = await res.json();
      if (data.success) {
        setLabReviewForms(prev => ({ ...prev, [taskId]: { ...prev[taskId], submitting: false, done: true } }));
        setLabReviewOpen(null);
        setTimeout(() => fetchTasks(), 800);
      } else {
        setLabReviewForms(prev => ({ ...prev, [taskId]: { ...prev[taskId], submitting: false, error: data.error || 'Submit failed' } }));
      }
    } catch (e) {
      setLabReviewForms(prev => ({ ...prev, [taskId]: { ...prev[taskId], submitting: false, error: 'Submit failed' } }));
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    const num = digits.startsWith('1') ? digits.slice(1) : digits;
    if (num.length === 10) return `(${num.slice(0,3)}) ${num.slice(3,6)}-${num.slice(6)}`;
    return phone;
  };

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  }), [session]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ filter });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/tasks?${params}`, { headers: authHeaders() });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, filter, statusFilter]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/employees?basic=true', { headers: authHeaders() });
      if (!res.ok) {
        console.error('Failed to fetch employees:', res.status);
        setEmployees([]);
        return;
      }
      const data = await res.json();
      setEmployees(Array.isArray(data.employees) ? data.employees : Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      setEmployees([]);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (session) {
      fetchTasks();
      fetchEmployees();
    }
  }, [session, fetchTasks, fetchEmployees]);

  // Patient search
  useEffect(() => {
    if (!patientSearch || patientSearch.length < 2) {
      setPatientResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(patientSearch)}`);
        const data = await res.json();
        setPatientResults(data.patients || data || []);
      } catch (err) {
        setPatientResults([]);
      } finally {
        setSearchingPatients(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  // Voice dictation — uses browser Web Speech API
  const startListening = (target = 'title') => {
    const SpeechRecognition = typeof window !== 'undefined'
      && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Try Chrome.');
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;
    setDictationTarget(target);

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interim = transcript;
        }
      }
      const currentText = (finalTranscript + interim).trim();
      if (target === 'title') {
        setForm(prev => ({ ...prev, title: currentText }));
      } else {
        setForm(prev => ({ ...prev, description: currentText }));
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'aborted') {
        setError('Microphone error: ' + event.error);
      }
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  // Cleanup recognition when modal closes
  useEffect(() => {
    if (!showCreate && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  }, [showCreate]);

  const toggleComplete = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await fetch('/api/admin/tasks', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ id: task.id, status: newStatus }),
      });
      fetchTasks();
    } catch (err) {
      console.error('Toggle task error:', err);
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await fetch(`/api/admin/tasks?id=${taskId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      fetchTasks();
    } catch (err) {
      console.error('Delete task error:', err);
    }
  };

  const handleFormat = async () => {
    const text = form.title || form.description;
    if (!text?.trim()) return;
    setFormatting(true);
    try {
      const res = await fetch('/api/tasks/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: text }),
      });
      const data = await res.json();
      if (data.formatted) {
        // If only title was filled, put formatted text in title
        // If description was filled, put formatted text in description
        if (form.description?.trim()) {
          setForm(prev => ({ ...prev, description: data.formatted }));
        } else {
          setForm(prev => ({ ...prev, title: data.formatted }));
        }
      }
    } catch (err) {
      console.error('Format error:', err);
    } finally {
      setFormatting(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.assigned_to) {
      setError('Title and assignee are required');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description?.trim() || null,
          assigned_to: form.assigned_to,
          patient_id: selectedPatient?.id || null,
          patient_name: selectedPatient?.name || form.patient_name || null,
          priority: form.priority,
          due_date: form.due_date || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setForm({ title: '', description: '', assigned_to: '', patient_name: '', priority: 'medium', due_date: '' });
        setSelectedPatient(null);
        setPatientSearch('');
        fetchTasks();
      } else {
        setError(data.error || 'Failed to create task');
      }
    } catch (err) {
      setError('Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (task) => {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date + 'T23:59:59') < new Date();
  };

  const getTimeAgo = (dateStr) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <AdminLayout title="Tasks">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Tasks</h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} style={sharedStyles.btnPrimary}>
            + New Task
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: '2px solid #f0f0f0' }}>
          {[
            { value: 'my', label: 'My Tasks' },
            { value: 'assigned', label: 'Assigned by Me' },
            { value: 'all', label: 'All Tasks' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: filter === tab.value ? 700 : 500,
                color: filter === tab.value ? '#1e40af' : '#666',
                background: 'none',
                border: 'none',
                borderBottom: filter === tab.value ? '2px solid #1e40af' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: '-2px',
              }}
            >
              {tab.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ ...sharedStyles.input, width: 'auto', fontSize: '12px', padding: '4px 8px', marginBottom: '4px' }}
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="">All</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>
            {error}
          </div>
        )}

        {/* Task list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>&#9745;</div>
            <p style={{ color: '#888', fontSize: '14px' }}>
              {statusFilter === 'pending' ? 'No pending tasks' : 'No tasks found'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tasks.map(task => {
              const pri = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
              const overdue = isOverdue(task);
              const isExpanded = expandedTask === task.id;
              const hasDescription = task.description && task.description.trim();
              return (
                <div
                  key={task.id}
                  style={{
                    background: task.status === 'completed' ? '#fafafa' : '#fff',
                    border: `1px solid ${overdue ? '#fecaca' : isExpanded ? '#3b82f6' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    opacity: task.status === 'completed' ? 0.7 : 1,
                    transition: 'border-color 0.15s',
                  }}
                >
                  {/* Collapsed row — always visible */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleComplete(task); }}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        border: `2px solid ${task.status === 'completed' ? '#16a34a' : '#d1d5db'}`,
                        background: task.status === 'completed' ? '#16a34a' : '#fff',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {task.status === 'completed' ? '✓' : ''}
                    </button>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: task.status === 'completed' ? '#999' : '#1a1a1a',
                          textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                          ...(!isExpanded && hasDescription ? {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '400px',
                          } : {}),
                        }}>
                          {task.title}
                        </span>
                        <span style={{
                          padding: '1px 8px',
                          borderRadius: '10px',
                          fontSize: '10px',
                          fontWeight: 600,
                          background: pri.bg,
                          color: pri.text,
                          border: `1px solid ${pri.border}`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          flexShrink: 0,
                        }}>
                          {pri.label}
                        </span>
                        {!isExpanded && hasDescription && (
                          <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>
                            ▸ tap to view
                          </span>
                        )}
                      </div>
                      {!isExpanded && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '11px', color: '#999', marginTop: '4px' }}>
                          {filter !== 'my' && (
                            <span>To: <strong style={{ color: '#666' }}>{task.assigned_to_name}</strong></span>
                          )}
                          <span>From: {task.assigned_by_name}</span>
                          {task.due_date && (
                            <span style={{ color: overdue ? '#dc2626' : '#999', fontWeight: overdue ? 600 : 400 }}>
                              {overdue ? 'Overdue: ' : 'Due: '}{formatDate(task.due_date)}
                            </span>
                          )}
                          <span>{getTimeAgo(task.created_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Expand indicator + Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <span style={{ color: '#ccc', fontSize: '12px', transition: 'transform 0.15s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                        ▶
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ccc',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '2px 4px',
                        }}
                        title="Delete task"
                      >
                        &#10005;
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div style={{
                      padding: '0 16px 16px 50px',
                      borderTop: '1px solid #f0f0f0',
                      marginTop: '-4px',
                      paddingTop: '12px',
                    }}>
                      {/* Full title if it was truncated */}
                      {hasDescription && (
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                            Task
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', lineHeight: 1.5 }}>
                            {task.title}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {hasDescription && (
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                            Details
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: '#374151',
                            lineHeight: 1.7,
                            whiteSpace: 'pre-wrap',
                            background: task.category === 'labs' ? '#f8f7ff' : '#f9fafb',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: `1px solid ${task.category === 'labs' ? '#e0d9ff' : '#f0f0f0'}`,
                          }}>
                            {task.category === 'labs' ? getDisplayDescription(task.description) : task.description}
                          </div>
                        </div>
                      )}

                      {/* Lab review actions — View Lab, View PDF, Complete Review */}
                      {task.category === 'labs' && task.patient_id && task.status !== 'completed' && (
                        <div style={{ marginBottom: '14px' }}>
                          {/* View buttons */}
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); openLabPanel('results', task); }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '7px 14px', fontSize: '12px', fontWeight: 600,
                                color: '#4c1d95', background: '#f5f3ff',
                                border: '1px solid #c4b5fd', borderRadius: '8px', cursor: 'pointer',
                              }}
                            >
                              🔬 View Lab Results
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); openLabPanel('pdf', task); }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '7px 14px', fontSize: '12px', fontWeight: 600,
                                color: '#1e3a5f', background: '#eff6ff',
                                border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer',
                              }}
                            >
                              📄 View PDF
                            </button>
                          </div>

                          {/* Complete Review section */}
                          {!labReviewForms[task.id]?.done ? (
                            <div>
                              <button
                                onClick={(e) => { e.stopPropagation(); setLabReviewOpen(labReviewOpen === task.id ? null : task.id); }}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  padding: '8px 18px', fontSize: '13px', fontWeight: 600,
                                  color: '#fff', background: '#111',
                                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                                  marginBottom: labReviewOpen === task.id ? '10px' : '0',
                                }}
                              >
                                {labReviewOpen === task.id ? '▲ Close Review' : '✓ Complete Review'}
                              </button>

                              {labReviewOpen === task.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    padding: '14px 16px',
                                    background: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '10px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                  }}
                                >
                                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Select consultation type(s) for Tara to schedule:
                                  </div>
                                  {['Schedule Telemedicine', 'Schedule In Person', 'Schedule Telephone Call'].map(type => {
                                    const checked = (labReviewForms[task.id]?.types || []).includes(type);
                                    return (
                                      <label
                                        key={type}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: '10px',
                                          padding: '8px 10px', marginBottom: '6px',
                                          background: checked ? '#f0fdf4' : '#f9fafb',
                                          border: `1px solid ${checked ? '#86efac' : '#e5e7eb'}`,
                                          borderRadius: '8px', cursor: 'pointer',
                                          fontSize: '13px', fontWeight: checked ? 600 : 400,
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={(e) => {
                                            const current = labReviewForms[task.id]?.types || [];
                                            const updated = e.target.checked ? [...current, type] : current.filter(t => t !== type);
                                            setLabReviewForms(prev => ({ ...prev, [task.id]: { ...prev[task.id], types: updated } }));
                                          }}
                                          style={{ width: '16px', height: '16px', accentColor: '#16a34a' }}
                                        />
                                        {type}
                                      </label>
                                    );
                                  })}

                                  <div style={{ marginTop: '12px', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Instructions for Tara (optional):
                                  </div>
                                  <textarea
                                    value={labReviewForms[task.id]?.instructions || ''}
                                    onChange={(e) => setLabReviewForms(prev => ({ ...prev, [task.id]: { ...prev[task.id], instructions: e.target.value } }))}
                                    placeholder="e.g. Patient prefers mornings, needs 60-min slot, follow up on medication question..."
                                    style={{
                                      width: '100%', padding: '10px 12px', fontSize: '13px',
                                      border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none',
                                      resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5,
                                      minHeight: '70px', boxSizing: 'border-box', background: '#fff',
                                    }}
                                  />

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); submitLabReview(task.id, task.patient_id); }}
                                      disabled={labReviewForms[task.id]?.submitting}
                                      style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        padding: '9px 20px', fontSize: '13px', fontWeight: 700,
                                        color: '#fff',
                                        background: labReviewForms[task.id]?.submitting ? '#9ca3af' : '#16a34a',
                                        border: 'none', borderRadius: '8px',
                                        cursor: labReviewForms[task.id]?.submitting ? 'not-allowed' : 'pointer',
                                      }}
                                    >
                                      {labReviewForms[task.id]?.submitting ? '⏳ Sending...' : '📨 Send to Tara & Chris'}
                                    </button>
                                  </div>
                                  {labReviewForms[task.id]?.error && (
                                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#dc2626' }}>
                                      {labReviewForms[task.id].error}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '10px 14px', background: '#f0fdf4',
                              border: '1px solid #86efac', borderRadius: '8px',
                              fontSize: '13px', fontWeight: 600, color: '#16a34a',
                            }}>
                              ✓ Review complete — Tara & Chris have been notified
                            </div>
                          )}
                        </div>
                      )}

                      {/* Patient contact — phone + action buttons */}
                      {task.patient_phone && (
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                            padding: '10px 14px',
                            background: '#f0fdf4', borderRadius: smsState[task.id]?.open ? '8px 8px 0 0' : '8px',
                            border: '1px solid #bbf7d0',
                            borderBottom: smsState[task.id]?.open ? 'none' : '1px solid #bbf7d0',
                          }}>
                            <Phone size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                            <a
                              href={`tel:${task.patient_phone}`}
                              style={{ fontSize: '14px', fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}
                            >
                              {formatPhone(task.patient_phone)}
                            </a>
                            <button
                              onClick={(e) => { e.stopPropagation(); openSmsComposer(task); }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '4px 10px', fontSize: '12px', fontWeight: 600,
                                color: '#1e40af', background: '#eff6ff',
                                border: '1px solid #bfdbfe', borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                            >
                              <MessageSquare size={12} /> Text
                            </button>
                            {task.patient_id && (
                              <button
                                onClick={(e) => { e.stopPropagation(); generateRenewalText(task); }}
                                disabled={smsState[task.id]?.loading}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                                  padding: '4px 10px', fontSize: '12px', fontWeight: 600,
                                  color: '#7c3aed', background: '#f5f3ff',
                                  border: '1px solid #ddd6fe', borderRadius: '6px',
                                  cursor: smsState[task.id]?.loading ? 'not-allowed' : 'pointer',
                                  opacity: smsState[task.id]?.loading ? 0.6 : 1,
                                }}
                              >
                                {smsState[task.id]?.loading ? (
                                  <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
                                ) : (
                                  <><Sparkles size={12} /> AI Draft Text</>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Inline SMS composer */}
                          {smsState[task.id]?.open && (
                            <div style={{
                              padding: '12px 14px',
                              background: '#f9fafb', borderRadius: '0 0 8px 8px',
                              border: '1px solid #bbf7d0', borderTop: '1px solid #e5e7eb',
                            }}>
                              {smsState[task.id]?.sent && (
                                <div style={{
                                  display: 'flex', alignItems: 'center', gap: '6px',
                                  padding: '6px 10px', marginBottom: '8px',
                                  background: '#f0fdf4', borderRadius: '6px',
                                  fontSize: '13px', fontWeight: 600, color: '#16a34a',
                                }}>
                                  &#10003; Message sent to {task.patient_name?.split(' ')[0]}
                                </div>
                              )}
                              <textarea
                                value={smsState[task.id]?.message || ''}
                                onChange={(e) => setSmsState(prev => ({
                                  ...prev,
                                  [task.id]: { ...prev[task.id], message: e.target.value, sent: false }
                                }))}
                                onClick={(e) => e.stopPropagation()}
                                placeholder={`Type a message to ${task.patient_name?.split(' ')[0] || 'patient'}...`}
                                style={{
                                  width: '100%', padding: '10px 12px', fontSize: '13px',
                                  border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none',
                                  resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5',
                                  minHeight: '60px', boxSizing: 'border-box', background: '#fff',
                                }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); sendTaskSms(task); }}
                                  disabled={smsState[task.id]?.sending || !smsState[task.id]?.message?.trim()}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    padding: '6px 14px', fontSize: '13px', fontWeight: 600,
                                    color: '#fff', background: (!smsState[task.id]?.message?.trim() || smsState[task.id]?.sending) ? '#9ca3af' : '#1e40af',
                                    border: 'none', borderRadius: '6px',
                                    cursor: (!smsState[task.id]?.message?.trim() || smsState[task.id]?.sending) ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  {smsState[task.id]?.sending ? (
                                    <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</>
                                  ) : (
                                    <><Send size={13} /> Send</>
                                  )}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSmsState(prev => ({ ...prev, [task.id]: { ...prev[task.id], open: false } })); }}
                                  style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontSize: '12px', color: '#999', fontWeight: 500,
                                  }}
                                >
                                  Close
                                </button>
                                {smsState[task.id]?.error && (
                                  <span style={{ fontSize: '12px', color: '#dc2626' }}>{smsState[task.id].error}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* No phone warning for patient-linked tasks */}
                      {task.patient_id && !task.patient_phone && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          marginBottom: '12px', padding: '8px 14px',
                          background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a',
                          fontSize: '12px', color: '#92400e',
                        }}>
                          <Phone size={12} /> No phone number on file for {task.patient_name}
                        </div>
                      )}

                      {/* Metadata grid */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px' }}>
                        <div>
                          <span style={{ color: '#9ca3af' }}>Assigned to: </span>
                          <strong style={{ color: '#374151' }}>{task.assigned_to_name}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#9ca3af' }}>Created by: </span>
                          <strong style={{ color: '#374151' }}>{task.assigned_by_name}</strong>
                        </div>
                        {task.patient_name && (
                          <div>
                            <span style={{ color: '#9ca3af' }}>Patient: </span>
                            <strong style={{ color: '#374151' }}>{task.patient_name}</strong>
                          </div>
                        )}
                        {task.due_date && (
                          <div>
                            <span style={{ color: '#9ca3af' }}>Due: </span>
                            <strong style={{ color: overdue ? '#dc2626' : '#374151' }}>
                              {formatDate(task.due_date)}{overdue ? ' (Overdue)' : ''}
                            </strong>
                          </div>
                        )}
                        <div>
                          <span style={{ color: '#9ca3af' }}>Created: </span>
                          <span style={{ color: '#374151' }}>{getTimeAgo(task.created_at)}</span>
                        </div>
                        {task.completed_at && (
                          <div>
                            <span style={{ color: '#9ca3af' }}>Completed: </span>
                            <span style={{ color: '#16a34a' }}>{getTimeAgo(task.completed_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreate && (
        <div style={sharedStyles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div style={{ ...sharedStyles.modal, maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div style={sharedStyles.modalHeader}>
              <h2 style={sharedStyles.modalTitle}>New Task</h2>
              <button onClick={() => setShowCreate(false)} style={sharedStyles.modalClose}>&#10005;</button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={sharedStyles.modalBody}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Title with Voice + AI Format */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={sharedStyles.label}>Task</label>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                        <button
                          type="button"
                          onClick={() => listening && dictationTarget === 'title' ? stopListening() : startListening('title')}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '4px 10px', fontSize: '12px', fontWeight: 600,
                            color: listening && dictationTarget === 'title' ? '#fff' : '#dc2626',
                            background: listening && dictationTarget === 'title' ? '#dc2626' : '#fef2f2',
                            border: '1px solid', borderColor: listening && dictationTarget === 'title' ? '#dc2626' : '#fecaca',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            animation: listening && dictationTarget === 'title' ? 'pulse 1.5s infinite' : 'none',
                          }}
                        >
                          {listening && dictationTarget === 'title' ? <MicOff size={13} /> : <Mic size={13} />}
                          {listening && dictationTarget === 'title' ? 'Stop' : 'Dictate'}
                        </button>
                        <button
                          type="button"
                          onClick={handleFormat}
                          disabled={formatting || (!form.title.trim() && !form.description.trim())}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '4px 10px', fontSize: '12px', fontWeight: 600,
                            color: formatting ? '#9ca3af' : '#7c3aed',
                            background: formatting ? '#f3f4f6' : '#f5f3ff',
                            border: '1px solid', borderColor: formatting ? '#e5e7eb' : '#ddd6fe',
                            borderRadius: '6px',
                            cursor: formatting || (!form.title.trim() && !form.description.trim()) ? 'not-allowed' : 'pointer',
                            opacity: (!form.title.trim() && !form.description.trim()) ? 0.5 : 1,
                          }}
                        >
                          <Sparkles size={13} />
                          {formatting ? 'Formatting...' : 'AI Format'}
                        </button>
                      </div>
                    </div>
                    {listening && dictationTarget === 'title' && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 10px', marginBottom: '6px',
                        background: '#fef2f2', borderRadius: '6px',
                        fontSize: '12px', color: '#dc2626', fontWeight: 500,
                      }}>
                        <span style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: '#dc2626', animation: 'pulse 1s infinite',
                        }} />
                        Listening... speak now
                      </div>
                    )}
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Type or tap Dictate to speak your task..."
                      style={{
                        ...sharedStyles.input,
                        ...(listening && dictationTarget === 'title' ? { borderColor: '#dc2626', boxShadow: '0 0 0 2px rgba(220,38,38,0.1)' } : {}),
                      }}
                      autoFocus
                      required
                    />
                  </div>

                  {/* Description with Voice */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={sharedStyles.label}>Details (optional)</label>
                      <button
                        type="button"
                        onClick={() => listening && dictationTarget === 'description' ? stopListening() : startListening('description')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '3px 8px', fontSize: '11px', fontWeight: 600,
                          color: listening && dictationTarget === 'description' ? '#fff' : '#dc2626',
                          background: listening && dictationTarget === 'description' ? '#dc2626' : '#fef2f2',
                          border: '1px solid', borderColor: listening && dictationTarget === 'description' ? '#dc2626' : '#fecaca',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          marginBottom: '6px',
                        }}
                      >
                        {listening && dictationTarget === 'description' ? <MicOff size={11} /> : <Mic size={11} />}
                        {listening && dictationTarget === 'description' ? 'Stop' : 'Dictate'}
                      </button>
                    </div>
                    {listening && dictationTarget === 'description' && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 10px', marginBottom: '6px',
                        background: '#fef2f2', borderRadius: '6px',
                        fontSize: '12px', color: '#dc2626', fontWeight: 500,
                      }}>
                        <span style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: '#dc2626', animation: 'pulse 1s infinite',
                        }} />
                        Listening... speak now
                      </div>
                    )}
                    <textarea
                      value={form.description}
                      onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Additional details..."
                      style={{
                        width: '100%', padding: '10px 12px', fontSize: '14px',
                        border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none',
                        resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5',
                        minHeight: '80px', boxSizing: 'border-box',
                        ...(listening && dictationTarget === 'description' ? { borderColor: '#dc2626', boxShadow: '0 0 0 2px rgba(220,38,38,0.1)' } : {}),
                      }}
                    />
                  </div>

                  {/* Assign to */}
                  <div>
                    <label style={sharedStyles.label}>Assign to</label>
                    <select
                      value={form.assigned_to}
                      onChange={e => setForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                      style={sharedStyles.input}
                      required
                    >
                      <option value="">Select team member...</option>
                      {employees
                        .filter(e => e.is_active !== false)
                        .map(e => (
                          <option key={e.id} value={e.id}>
                            {e.name}{e.id === employee?.id ? ' (Me)' : ''}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Priority + Due Date row */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={sharedStyles.label}>Priority</label>
                      <select
                        value={form.priority}
                        onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}
                        style={sharedStyles.input}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={sharedStyles.label}>Due Date (optional)</label>
                      <input
                        type="date"
                        value={form.due_date}
                        onChange={e => setForm(prev => ({ ...prev, due_date: e.target.value }))}
                        style={sharedStyles.input}
                      />
                    </div>
                  </div>

                  {/* Patient link (optional) */}
                  <div>
                    <label style={sharedStyles.label}>Link to Patient (optional)</label>
                    {selectedPatient ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 12px', background: '#f0f9ff', borderRadius: '8px',
                        border: '1px solid #bae6fd',
                      }}>
                        <span style={{ flex: 1, fontSize: '13px', fontWeight: 600 }}>{selectedPatient.name}</span>
                        <button
                          type="button"
                          onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '16px' }}
                        >
                          &#10005;
                        </button>
                      </div>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={patientSearch}
                          onChange={e => setPatientSearch(e.target.value)}
                          placeholder="Search patient name..."
                          style={sharedStyles.input}
                        />
                        {patientResults.length > 0 && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                            background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto',
                          }}>
                            {patientResults.map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPatient(p);
                                  setPatientSearch('');
                                  setPatientResults([]);
                                }}
                                style={{
                                  display: 'block', width: '100%', textAlign: 'left',
                                  padding: '8px 12px', border: 'none', background: 'none',
                                  cursor: 'pointer', fontSize: '13px',
                                }}
                                onMouseEnter={e => e.target.style.background = '#f0f9ff'}
                                onMouseLeave={e => e.target.style.background = 'none'}
                              >
                                {p.name}
                                {p.email && <span style={{ color: '#999', marginLeft: '8px' }}>{p.email}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                        {searchingPatients && (
                          <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '11px', color: '#999' }}>
                            Searching...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={sharedStyles.modalFooter}>
                <button type="button" onClick={() => setShowCreate(false)} style={sharedStyles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" disabled={creating} style={{
                  ...sharedStyles.btnPrimary,
                  ...(creating ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                }}>
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Lab results / PDF slide-in panel */}
      {labPanel && (
        <>
          <div
            onClick={() => setLabPanel(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0,
            width: 'min(62%, 900px)',
            background: '#fff', zIndex: 201,
            boxShadow: '-4px 0 32px rgba(0,0,0,0.18)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideInPanel 0.2s ease-out',
          }}>
            <style>{`@keyframes slideInPanel { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
            {/* Panel header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', borderBottom: '1px solid #e5e7eb', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700 }}>
                  {labPanel.type === 'results' ? '🔬 Lab Results' : '📄 Lab Report PDF'}
                </span>
                {labPanel.patientName && (
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>— {labPanel.patientName}</span>
                )}
              </div>
              <button
                onClick={() => setLabPanel(null)}
                style={{
                  background: '#f3f4f6', border: 'none', borderRadius: '8px',
                  width: '32px', height: '32px', cursor: 'pointer',
                  fontSize: '16px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Panel content */}
            {labPanel.type === 'results' && labPanel.labId ? (
              <iframe
                src={`/patient/labs?id=${labPanel.labId}`}
                style={{ flex: 1, border: 'none', display: 'block' }}
                title="Lab Results"
              />
            ) : labPanel.type === 'pdf' && labPanel.pdfUrl ? (
              <iframe
                src={labPanel.pdfUrl}
                style={{ flex: 1, border: 'none', display: 'block' }}
                title="Lab PDF"
              />
            ) : (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                color: '#9ca3af', fontSize: '14px', gap: '8px',
              }}>
                <span style={{ fontSize: '32px' }}>{labPanel.type === 'results' ? '🔬' : '📄'}</span>
                {labPanel.type === 'results' ? 'Lab results not found for this patient.' : 'No PDF found for this patient.'}
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
