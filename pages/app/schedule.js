// /pages/app/schedule.js
// Appointment schedule — Range Medical Employee App

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppLayout from '../../components/AppLayout';

export default function AppSchedule() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/app/schedule?days=7');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
        setGrouped(data.grouped || {});
      }
    } finally {
      setLoading(false);
    }
  };

  // Build date tabs for next 7 days
  const dateTabs = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const displayedAppts = grouped[selectedDate] || [];

  return (
    <>
      <Head>
        <title>Schedule — Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <style>{`
        .date-tabs {
          display: flex;
          gap: 8px;
          padding: 14px 16px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .date-tabs::-webkit-scrollbar { display: none; }
        .date-tab {
          flex-shrink: 0;
          padding: 8px 14px;
          border-radius: 0;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          text-align: center;
          -webkit-tap-highlight-color: transparent;
          min-width: 56px;
        }
        .date-tab.active {
          background: #0f172a;
          border-color: #0f172a;
          color: #fff;
        }
        .date-tab-day { font-size: 11px; font-weight: 500; color: #94a3b8; }
        .date-tab.active .date-tab-day { color: #94a3b8; }
        .date-tab-num { font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.2; }
        .date-tab.active .date-tab-num { color: #fff; }
        .appt-card {
          background: #fff;
          border-radius: 0;
          margin: 0 12px 10px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          display: flex;
          gap: 14px;
          align-items: flex-start;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .appt-time-col {
          min-width: 52px;
          text-align: center;
        }
        .appt-time { font-size: 13px; font-weight: 700; color: #0f172a; }
        .appt-dur { font-size: 10px; color: #94a3b8; margin-top: 2px; }
        .appt-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #6366f1;
          margin: 5px auto 0;
        }
      `}</style>

      <AppLayout title="Schedule">
        {/* Date tabs */}
        <div className="date-tabs">
          {dateTabs.map(date => {
            const d = new Date(date + 'T12:00:00');
            const isToday = date === new Date().toISOString().split('T')[0];
            const count = (grouped[date] || []).length;
            return (
              <button
                key={date}
                className={`date-tab${selectedDate === date ? ' active' : ''}`}
                onClick={() => setSelectedDate(date)}
              >
                <div className="date-tab-day">{isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' , timeZone: 'America/Los_Angeles' })}</div>
                <div className="date-tab-num">{d.getDate()}</div>
                {count > 0 && (
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: selectedDate === date ? '#fff' : '#6366f1', margin: '3px auto 0' }} />
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="app-spinner" />
        ) : displayedAppts.length === 0 ? (
          <div className="app-empty">
            <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
            No appointments scheduled for this day
          </div>
        ) : (
          <>
            <div style={{ padding: '4px 16px 8px', fontSize: 12, color: '#94a3b8' }}>
              {displayedAppts.length} appointment{displayedAppts.length !== 1 ? 's' : ''}
            </div>
            {displayedAppts.map(appt => {
              const start = new Date(appt.start_time);
              const end = new Date(appt.end_time);
              const timeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true , timeZone: 'America/Los_Angeles' });
              const durMin = Math.round((end - start) / 60000);
              const patient = appt.patients;
              const name = patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown patient';
              const statusColor = { accepted: '#22c55e', pending: '#f59e0b', cancelled: '#ef4444' }[appt.status] || '#94a3b8';
              return (
                <div
                  key={appt.id}
                  className="appt-card"
                  onClick={() => patient && router.push(`/app/patient/${appt.patient_id}`)}
                >
                  <div className="appt-time-col">
                    <div className="appt-time">{timeStr}</div>
                    <div className="appt-dur">{durMin}min</div>
                    <div className="appt-dot" style={{ background: statusColor }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 3 }}>{name}</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>
                      {appt.event_type_title || appt.title || 'Appointment'}
                    </div>
                    {patient?.phone && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a
                          href={`tel:${patient.phone}`}
                          onClick={e => e.stopPropagation()}
                          style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}
                        >
                          📞 Call
                        </a>
                        <span style={{ color: '#e2e8f0' }}>·</span>
                        <button
                          onClick={e => { e.stopPropagation(); router.push(`/app/messages?patient_id=${appt.patient_id}`); }}
                          style={{ background: 'none', border: 'none', fontSize: 12, color: '#6366f1', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                        >
                          💬 Message
                        </button>
                      </div>
                    )}
                    {appt.notes && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8', background: '#f8fafc', borderRadius: 0, padding: '6px 8px' }}>
                        {appt.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                      color: statusColor, background: `${statusColor}18`,
                      padding: '3px 7px', borderRadius: 0,
                    }}>
                      {appt.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </AppLayout>
    </>
  );
}
