// /pages/admin/team.js
// Single "Team" hub that combines Employees, Staff Hours, and Services
// into one page with tabs. Each tab renders the same Content component
// that powers the corresponding standalone page (/admin/employees,
// /admin/provider-schedule, /admin/services), so this is a thin wrapper
// — zero logic duplication, zero risk of behaviour drift.

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../components/AuthProvider';
import { EmployeesContent } from './employees';
import { ProviderScheduleContent } from './provider-schedule';
import { ServicesContent } from './services';

const TABS = [
  { id: 'employees', label: 'Employees', permission: 'can_manage_employees' },
  { id: 'hours',     label: 'Staff Hours', permission: null },
  { id: 'services',  label: 'Services',  permission: 'can_manage_employees' },
];

export default function TeamPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();

  // Tabs the current user can see.
  const visibleTabs = TABS.filter(t => !t.permission || hasPermission(t.permission));

  // Default tab honours ?tab=hours etc. so the old standalone URLs can
  // redirect here without losing context.
  const initialTab = (() => {
    const q = router.query.tab;
    if (typeof q === 'string' && visibleTabs.some(t => t.id === q)) return q;
    return visibleTabs[0]?.id || 'hours';
  })();
  const [tab, setTab] = useState(initialTab);

  // Keep tab state and the URL ?tab= param in sync (shallow nav, no reload).
  useEffect(() => {
    if (router.query.tab !== tab) {
      router.replace({ pathname: router.pathname, query: { ...router.query, tab } }, undefined, { shallow: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <AdminLayout title="Team">
      <div style={tabBar}>
        {visibleTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{ ...tabBtn, ...(tab === t.id ? tabBtnActive : {}) }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ paddingTop: '20px' }}>
        {tab === 'employees' && <EmployeesContent />}
        {tab === 'hours' && <ProviderScheduleContent />}
        {tab === 'services' && <ServicesContent />}
      </div>
    </AdminLayout>
  );
}

const tabBar = {
  display: 'flex',
  gap: '4px',
  borderBottom: '1px solid #e5e7eb',
  marginBottom: '4px',
};

const tabBtn = {
  background: 'none',
  border: 'none',
  padding: '12px 18px',
  fontSize: '14px',
  fontWeight: 500,
  color: '#666',
  borderBottom: '2px solid transparent',
  cursor: 'pointer',
  marginBottom: '-1px',
};

const tabBtnActive = {
  color: '#0A0A0A',
  borderBottomColor: '#0A0A0A',
  fontWeight: 600,
};
