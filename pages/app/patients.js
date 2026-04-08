// /pages/app/patients.js
// Patient quick search — Range Medical Employee App

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppLayout from '../../components/AppLayout';

export default function AppPatients() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    // Load recently viewed from localStorage as instant placeholder
    try {
      const r = JSON.parse(localStorage.getItem('recent_patients') || '[]');
      if (r.length) setRecent(r.slice(0, 6));
    } catch {}
    // Fetch recently active patients from DB (last 30 days of appointments)
    fetch('/api/app/patients-search?recent=true')
      .then(r => r.json())
      .then(d => { if (d.patients?.length) setRecent(d.patients); })
      .catch(() => {});
    setTimeout(() => searchRef.current?.focus(), 400);
  }, []);

  const handleSearch = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/app/patients-search?q=${encodeURIComponent(val)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.patients || []);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const openPatient = (p) => {
    // Save to recent
    try {
      const prev = JSON.parse(localStorage.getItem('recent_patients') || '[]');
      const next = [{ id: p.id, first_name: p.first_name, last_name: p.last_name, phone: p.phone }, ...prev.filter(r => r.id !== p.id)].slice(0, 8);
      localStorage.setItem('recent_patients', JSON.stringify(next));
    } catch {}
    router.push(`/app/patient/${p.id}`);
  };

  const formatDOB = (dob) => {
    if (!dob) return null;
    const d = new Date(dob + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const list = query.trim().length >= 2 ? results : recent;
  const showRecent = query.trim().length < 2 && recent.length > 0;

  return (
    <>
      <Head>
        <title>Patients — Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <style>{`
        .search-wrap {
          position: sticky;
          top: 0;
          background: #f8fafc;
          padding: 12px 16px;
          z-index: 5;
          border-bottom: 1px solid #e2e8f0;
        }
        .search-box {
          display: flex;
          align-items: center;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 0;
          padding: 0 14px;
          gap: 10px;
        }
        .search-box:focus-within { border-color: #0f172a; }
        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 15px;
          padding: 12px 0;
          background: transparent;
          -webkit-appearance: none;
        }
        .patient-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: #fff;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .patient-avatar {
          width: 42px; height: 42px;
          border-radius: 50%;
          background: #e2e8f0;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 700; color: #475569;
          flex-shrink: 0;
        }
      `}</style>

      <AppLayout title="Patients">
        {/* Search bar */}
        <div className="search-wrap">
          <div className="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              ref={searchRef}
              className="search-input"
              placeholder="Search by name or phone…"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              type="search"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="words"
            />
            {loading && <div style={{ width: 16, height: 16, border: '2px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
            {query && !loading && (
              <button onClick={() => { setQuery(''); setResults([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            )}
          </div>
        </div>

        {showRecent && (
          <div style={{ padding: '12px 16px 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
            Recent Patients
          </div>
        )}

        {list.length > 0 ? (
          <div style={{ background: '#fff' }}>
            {list.map(p => {
              const initials = `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase();
              return (
                <div key={p.id} className="patient-row" onClick={() => openPatient(p)}>
                  <div className="patient-avatar">{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{p.first_name} {p.last_name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      {p.phone || 'No phone'}{p.date_of_birth ? ` · DOB ${formatDOB(p.date_of_birth)}` : ''}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              );
            })}
          </div>
        ) : query.trim().length >= 2 && !loading ? (
          <div className="app-empty">
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            No patients found for "{query}"
          </div>
        ) : null}
      </AppLayout>
    </>
  );
}
