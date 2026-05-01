// /admin/daily/tips/new — create a new tip

import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout, { sharedStyles } from '../../../../components/AdminLayout';
import { useAuth } from '../../../../components/AuthProvider';
import DailyTipForm from '../../../../components/DailyTipForm';

export default function NewTipPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSave = async (payload) => {
    if (!session?.access_token) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/daily/tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      router.push(`/admin/daily/tips/${data.tip.id}`);
    } catch (err) {
      alert(err.message);
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="New tip">
      <div style={sharedStyles.pageHeader}>
        <h1 style={sharedStyles.pageTitle}>New tip</h1>
        <p style={sharedStyles.pageSubtitle}>
          Drafts stay drafts until you flip status to Approved + set a date.
        </p>
      </div>
      <DailyTipForm onSave={handleSave} saving={saving} />
    </AdminLayout>
  );
}
