// /pages/app/protocols.js
// Active protocols browser — Range Medical Employee App

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppLayout from '../../components/AppLayout';

const CAT_COLORS = {
  hrt:         { bg: '#fce7f3', text: '#9d174d', label: 'HRT' },
  weight_loss: { bg: '#fff7ed', text: '#9a3412', label: 'Wt Loss' },
  peptide:     { bg: '#ecfdf5', text: '#065f46', label: 'Peptide' },
  iv:          { bg: '#dbeafe', text: '#1d4ed8', label: 'IV' },
  hbot:        { bg: '#d1fae5', text: '#065f46', label: 'HBOT' },
  rlt:         { bg: '#fef3c7', text: '#92400e', label: 'RLT' },
  injection:   { bg: '#ede9fe', text: '#5b21b6', label: 'Range Injection' },
};

export default function AppProtocols() {
  const router = useRouter();
  const [protocols, setProtocols] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');

  useEffect(() => {
    fetchProtocols();
  }, []);

  useEffect(() => {
    let list = protocols;
    if (activeCat !== 'all') list = list.filter(p => p.category === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => {
        const name = `${p.patients?.first_name || ''} ${p.patients?.last_name || ''}`.toLowerCase();
        const med = (p.medication || '').toLowerCase();
        return name.includes(q) || med.includes(q);
      });
    }
    setFiltered(list);
  }, [protocols, search, activeCat]);

  const fetchProtocols = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/protocols?status=active&limit=100');
      if (res.ok) {
        const data = await res.json();
        setProtocols(data.protocols || data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Object.keys(CAT_COLORS)];

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' , timeZone: 'America/Los_Angeles' });
  };

  return (
    <>
      <Head>
        <title>Protocols — Range Medical</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <style>{`
        .cat-filter {
          display: flex;
          gap: 6px;
          padding: 12px 16px;
          overflow-x: auto;
          scrollbar-width: none;
          flex-shrink: 0;
        }
        .cat-filter::-webkit-scrollbar { display: none; }
        .cat-chip {
          flex-shrink: 0;
          padding: 6px 12px;
          border-radius: 0;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .cat-chip.active { background: #0f172a; border-color: #0f172a; color: #fff; }
        .proto-card {
          background: #fff;
          border-radius: 0;
          margin: 0 12px 8px;
          padding: 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>

      <AppLayout title="Protocols">
        {/* Search */}
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 0, padding: '0 12px', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patient or medication…"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, padding: '11px 0', background: 'transparent', WebkitAppearance: 'none' }}
            />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, padding: 0 }}>×</button>}
          </div>
        </div>

        {/* Category filter */}
        <div className="cat-filter">
          {categories.map(cat => {
            const label = cat === 'all' ? 'All' : (CAT_COLORS[cat]?.label || cat);
            return (
              <button key={cat} className={`cat-chip${activeCat === cat ? ' active' : ''}`} onClick={() => setActiveCat(cat)}>
                {label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="app-spinner" />
        ) : filtered.length === 0 ? (
          <div className="app-empty">
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔬</div>
            {search || activeCat !== 'all' ? 'No protocols match your filter' : 'No active protocols'}
          </div>
        ) : (
          <>
            <div style={{ padding: '0 16px 8px', fontSize: 12, color: '#94a3b8' }}>
              {filtered.length} protocol{filtered.length !== 1 ? 's' : ''}
            </div>
            {filtered.map(proto => {
              const cat = CAT_COLORS[proto.category] || { bg: '#f1f5f9', text: '#475569', label: proto.category };
              const patient = proto.patients;
              const name = patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown';
              return (
                <div
                  key={proto.id}
                  className="proto-card"
                  onClick={() => router.push(`/admin/protocol/${proto.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{name}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{proto.medication || proto.name || '—'}</div>
                    </div>
                    <span className="app-pill" style={{ background: cat.bg, color: cat.text, flexShrink: 0 }}>
                      {cat.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
                    {proto.start_date && <span>Started {formatDate(proto.start_date)}</span>}
                    {proto.end_date && <span>Ends {formatDate(proto.end_date)}</span>}
                    {proto.dosage && <span>{proto.dosage}</span>}
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
