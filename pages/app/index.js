// /pages/app/index.js
// Today dashboard — Range Medical Employee App

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppLayout from '../../components/AppLayout';

const CATEGORY_COLORS = {
  iv:         { bg: '#dbeafe', text: '#1d4ed8', label: 'IV' },
  hbot:       { bg: '#d1fae5', text: '#065f46', label: 'HBOT' },
  rlt:        { bg: '#fef3c7', text: '#92400e', label: 'RLT' },
  injection:  { bg: '#ede9fe', text: '#5b21b6', label: 'Range Injection' },
  hrt:        { bg: '#fce7f3', text: '#9d174d', label: 'HRT' },
  weight_loss:{ bg: '#fff7ed', text: '#9a3412', label: 'Weight Loss' },
  peptide:    { bg: '#ecfdf5', text: '#065f46', label: 'Peptide' },
};

export default function AppToday() {
  const router = useRouter();
  const [staff, setStaff] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const session = localStorage.getItem('staff_session');
    if (!session) { router.replace('/app/login'); return; }
    try { setStaff(JSON.parse(session)); } catch { router.replace('/app/login'); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/app/today');
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setUnread(d.unread_sms || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' , timeZone: 'America/Los_Angeles' });
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <Head>
        <title>Today — Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      <AppLayout title="Today" unreadMessages={unread}>
        {/* Date + greeting */}
        <div style={{ padding: '20px 16px 4px' }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 2 }}>{dateStr}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
            {greeting}{staff ? `, ${staff.name.split(' ')[0]}` : ''}
          </div>
        </div>

        {loading ? (
          <div className="app-spinner" />
        ) : (
          <>
            {/* Quick action tiles */}
            <div style={{ padding: '16px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <QuickTile
                icon="📋"
                label="Log Session"
                sub="Service log"
                color="#dbeafe"
                onClick={() => router.push('/app/service-log')}
              />
              <QuickTile
                icon="📅"
                label="Schedule"
                sub="Today's appts"
                color="#d1fae5"
                onClick={() => router.push('/app/schedule')}
              />
              <QuickTile
                icon="💬"
                label="Messages"
                sub={unread > 0 ? `${unread} unread` : 'No new messages'}
                color={unread > 0 ? '#fef3c7' : '#f1f5f9'}
                badge={unread > 0 ? unread : null}
                onClick={() => router.push('/app/messages')}
              />
              <QuickTile
                icon="🔬"
                label="Protocols"
                sub="Active protocols"
                color="#ede9fe"
                onClick={() => router.push('/app/protocols')}
              />
            </div>

            {/* Today's stats row */}
            <div style={{ padding: '16px 16px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <StatCard label="Sessions today" value={data?.service_log?.count || 0} />
              <StatCard label="Open tasks" value={data?.tasks?.open_count || 0} accent={data?.tasks?.open_count > 0} />
              <StatCard label="New messages" value={unread} accent={unread > 0} />
            </div>

            {/* Today's service log */}
            {data?.service_log?.entries?.length > 0 && (
              <>
                <div className="app-section-header">Today's Sessions</div>
                <div className="app-card" style={{ margin: '0 12px 10px', padding: '4px 16px' }}>
                  {data.service_log.entries.slice(0, 8).map(entry => {
                    const cat = CATEGORY_COLORS[entry.category] || { bg: '#f1f5f9', text: '#475569', label: entry.category };
                    const patient = entry.patients;
                    const name = patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown';
                    return (
                      <div
                        key={entry.id}
                        className="app-list-item"
                        onClick={() => patient && router.push(`/app/patient/${entry.patient_id}`)}
                      >
                        <span className="app-pill" style={{ background: cat.bg, color: cat.text }}>
                          {cat.label}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{name}</div>
                          {entry.medication && (
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{entry.medication}</div>
                          )}
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                      </div>
                    );
                  })}
                  {data.service_log.entries.length > 8 && (
                    <div
                      style={{ padding: '12px 0', textAlign: 'center', fontSize: 13, color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => router.push('/app/service-log')}
                    >
                      View all {data.service_log.entries.length} sessions →
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Open tasks */}
            {data?.tasks?.items?.length > 0 && (
              <>
                <div className="app-section-header">Open Tasks</div>
                <div className="app-card" style={{ margin: '0 12px 10px', padding: '4px 16px' }}>
                  {data.tasks.items.slice(0, 5).map(task => (
                    <div key={task.id} className="app-list-item">
                      <span style={{ fontSize: 18 }}>
                        {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '⚪'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                        {task.due_date && (
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>
                            Due {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' , timeZone: 'America/Los_Angeles' })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Quick nav to full admin */}
            <div style={{ padding: '8px 16px 24px', textAlign: 'center' }}>
              <button
                onClick={() => window.open('/admin', '_blank')}
                style={{ background: 'none', border: 'none', fontSize: 13, color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Open full desktop admin →
              </button>
            </div>
          </>
        )}
      </AppLayout>
    </>
  );
}

function QuickTile({ icon, label, sub, color, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: color,
        borderRadius: 0,
        padding: '16px 14px',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        position: 'relative',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {badge && (
        <span style={{
          position: 'absolute', top: 10, right: 10,
          background: '#ef4444', color: '#fff',
          fontSize: 10, fontWeight: 700,
          borderRadius: 0, minWidth: 18, height: 18,
          lineHeight: '18px', textAlign: 'center', padding: '0 5px',
        }}>{badge > 9 ? '9+' : badge}</span>
      )}
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, color: '#64748b' }}>{sub}</div>
    </button>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{ background: '#fff', borderRadius: 0, padding: '12px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent ? '#ef4444' : '#0f172a' }}>{value}</div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}
