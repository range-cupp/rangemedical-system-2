// /components/AppLayout.js
// Mobile-first layout shell for the Range Medical Staff PWA
// Bottom tab bar, top header, safe area handling for iOS notch/home indicator

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import useVoiceCall, { CALL_STATE } from '../hooks/useVoiceCall';
import AppCallBar from './AppCallBar';

const TABS = [
  { id: 'today',       label: 'Today',     href: '/app',              icon: TabIconToday },
  { id: 'schedule',    label: 'Schedule',  href: '/app/schedule',     icon: TabIconSchedule },
  { id: 'patients',    label: 'Patients',  href: '/app/patients',     icon: TabIconPatients },
  { id: 'messages',    label: 'Messages',  href: '/app/messages',     icon: TabIconMessages },
  { id: 'more',        label: 'More',      href: '/app/more',         icon: TabIconMore },
];

export default function AppLayout({ title, children, unreadMessages = 0, voiceHook }) {
  const router = useRouter();
  const [staff, setStaff] = useState(null);

  useEffect(() => {
    const session = localStorage.getItem('staff_session');
    if (!session) {
      router.replace('/app/login');
      return;
    }
    try {
      setStaff(JSON.parse(session));
    } catch {
      router.replace('/app/login');
    }
  }, [router]);

  // Use passed voice hook or create a local one (for pages that don't pass one in)
  const localVoice = useVoiceCall({ staffName: staff?.name });
  const voice = voiceHook || localVoice;

  // Determine active tab
  const path = router.pathname;
  const activeTab = TABS.find(t => {
    if (t.href === '/app') return path === '/app';
    return path.startsWith(t.href);
  })?.id;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #0f172a; }
        #__next { height: 100%; }

        .app-shell {
          display: flex;
          flex-direction: column;
          height: 100%;
          height: 100dvh;
          background: #f8fafc;
          max-width: 480px;
          margin: 0 auto;
          position: relative;
        }

        /* Top header */
        .app-header {
          background: #0f172a;
          color: #fff;
          padding: 52px 16px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .app-header h1 {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.3px;
        }
        .app-header-staff {
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.3;
          text-align: right;
        }

        /* Scrollable content area */
        .app-content {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 80px;
        }

        /* Bottom tab bar */
        .app-tabs {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 480px;
          background: #fff;
          border-top: 1px solid #e2e8f0;
          display: flex;
          padding-bottom: env(safe-area-inset-bottom, 0px);
          z-index: 20;
        }
        .app-tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px 4px 6px;
          cursor: pointer;
          border: none;
          background: none;
          position: relative;
          gap: 3px;
          -webkit-tap-highlight-color: transparent;
        }
        .app-tab svg { display: block; }
        .app-tab-label {
          font-size: 10px;
          font-weight: 500;
          color: #94a3b8;
          transition: color 0.15s;
        }
        .app-tab.active .app-tab-label { color: #0f172a; font-weight: 700; }
        .app-tab.active svg path, .app-tab.active svg rect, .app-tab.active svg circle {
          stroke: #0f172a;
        }
        .app-tab:not(.active) svg path, .app-tab:not(.active) svg rect, .app-tab:not(.active) svg circle {
          stroke: #94a3b8;
        }
        .tab-badge {
          position: absolute;
          top: 5px;
          right: calc(50% - 16px);
          background: #ef4444;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          border-radius: 10px;
          min-width: 16px;
          height: 16px;
          line-height: 16px;
          text-align: center;
          padding: 0 4px;
        }

        /* Cards */
        .app-card {
          background: #fff;
          border-radius: 12px;
          padding: 16px;
          margin: 0 12px 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .app-card-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #94a3b8;
          margin-bottom: 10px;
        }

        /* List items */
        .app-list-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .app-list-item:last-child { border-bottom: none; }

        /* Pill/badge */
        .app-pill {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        /* Action button */
        .app-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: opacity 0.1s;
        }
        .app-action-btn:active { opacity: 0.75; }

        /* Section header inside content */
        .app-section-header {
          padding: 20px 16px 8px;
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
        }

        /* Empty state */
        .app-empty {
          text-align: center;
          padding: 40px 20px;
          color: #94a3b8;
          font-size: 14px;
        }

        /* Input */
        .app-input {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 15px;
          outline: none;
          background: #fff;
          -webkit-appearance: none;
        }
        .app-input:focus { border-color: #0f172a; }

        /* Spinner */
        @keyframes spin { to { transform: rotate(360deg); } }
        .app-spinner {
          width: 24px; height: 24px;
          border: 3px solid #e2e8f0;
          border-top-color: #0f172a;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 40px auto;
        }
      `}</style>

      <div className="app-shell">
        {/* Header */}
        <div className="app-header">
          <h1>{title || 'Range Medical'}</h1>
          {staff && (
            <div className="app-header-staff">
              <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 13 }}>{staff.name}</div>
              <div>{staff.title}</div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="app-content">
          {children}
        </div>

        {/* Floating call bar (above tab bar) */}
        <AppCallBar
          callState={voice.callState}
          callInfo={voice.callInfo}
          muted={voice.muted}
          onHangUp={voice.hangUp}
          onToggleMute={voice.toggleMute}
          formatDuration={voice.formatDuration}
          incomingCall={voice.incomingCall}
          onAnswer={voice.answer}
          onReject={voice.reject}
        />

        {/* Bottom tabs */}
        <nav className="app-tabs">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const badge = tab.id === 'messages' && unreadMessages > 0 ? unreadMessages : null;
            return (
              <button
                key={tab.id}
                className={`app-tab${isActive ? ' active' : ''}`}
                onClick={() => router.push(tab.href)}
              >
                {badge && (
                  <span className="tab-badge">{badge > 9 ? '9+' : badge}</span>
                )}
                <Icon active={isActive} />
                <span className="app-tab-label">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}

// ── Tab icons (inline SVG, 24×24, strokeWidth 2) ──────────────────────────────

function TabIconToday({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function TabIconSchedule({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function TabIconPatients({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function TabIconMessages({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function TabIconMore({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}
