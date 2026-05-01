// /admin/daily/tips/[id] — edit existing tip

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout, { sharedStyles } from '../../../../components/AdminLayout';
import { useAuth } from '../../../../components/AuthProvider';
import DailyTipForm from '../../../../components/DailyTipForm';

export default function EditTipPage() {
  const { session } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [tip, setTip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!session?.access_token || !id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/daily/tips/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setTip(data.tip);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session, id]);

  useEffect(() => { if (session && id) load(); }, [session, id, load]);

  const handleSave = async (payload) => {
    if (!session?.access_token || !id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/daily/tips/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setTip(data.tip);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!session?.access_token || !id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/daily/tips/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      router.push('/admin/daily/queue');
    } catch (err) {
      alert(err.message);
      setDeleting(false);
    }
  };

  return (
    <AdminLayout title="Edit tip">
      <div style={sharedStyles.pageHeader}>
        <h1 style={sharedStyles.pageTitle}>Edit tip</h1>
        {tip?.scheduled_for && (
          <p style={sharedStyles.pageSubtitle}>
            Scheduled for <strong>{tip.scheduled_for}</strong> · status <strong>{tip.status}</strong>
          </p>
        )}
      </div>

      {error && (
        <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: '#666' }}>Loading…</div>
      ) : tip ? (
        <DailyTipForm
          initial={tip}
          onSave={handleSave}
          onDelete={handleDelete}
          saving={saving}
          deleting={deleting}
        />
      ) : null}
    </AdminLayout>
  );
}
