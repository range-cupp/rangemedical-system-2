// /pages/superbowl/admin.jsx
// Super Bowl LX Giveaway - Admin Dashboard
// Range Medical - 2026-02-08

import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function SuperBowlAdmin() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [contestOpen, setContestOpen] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [winningTeam, setWinningTeam] = useState('');
  const [winner, setWinner] = useState(null);
  const [pickingWinner, setPickingWinner] = useState(false);

  const fetchEntries = async (secret) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/superbowl/entries', {
        headers: {
          'x-admin-secret': secret
        }
      });

      if (res.ok) {
        const result = await res.json();
        setData(result);
        setAuthenticated(true);

        // Also fetch contest status
        const settingsRes = await fetch('/api/superbowl/settings', {
          headers: { 'x-admin-secret': secret }
        });
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setContestOpen(settingsData.contest_open);
        }
      } else {
        setError('Invalid password');
        setAuthenticated(false);
      }
    } catch (err) {
      setError('Failed to load data');
    }
    setLoading(false);
  };

  const toggleContest = async () => {
    setToggling(true);
    try {
      const res = await fetch('/api/superbowl/settings', {
        method: 'POST',
        headers: {
          'x-admin-secret': password,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contest_open: !contestOpen })
      });

      if (res.ok) {
        setContestOpen(!contestOpen);
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
    setToggling(false);
  };

  const pickRandomWinner = () => {
    if (!winningTeam || !data) return;

    setPickingWinner(true);

    // Filter entries to those who picked the winning team
    const correctPicks = data.entries.filter(e => e.team_pick === winningTeam);

    if (correctPicks.length === 0) {
      setWinner({ error: 'No entries picked this team!' });
      setPickingWinner(false);
      return;
    }

    // Random selection with animation effect
    let iterations = 0;
    const maxIterations = 20;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * correctPicks.length);
      setWinner(correctPicks[randomIndex]);
      iterations++;

      if (iterations >= maxIterations) {
        clearInterval(interval);
        // Final random pick
        const finalIndex = Math.floor(Math.random() * correctPicks.length);
        setWinner(correctPicks[finalIndex]);
        setPickingWinner(false);
      }
    }, 100);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchEntries(password);
  };

  const refresh = () => {
    fetchEntries(password);
  };

  if (!authenticated) {
    return (
      <>
        <Head>
          <title>Admin | Super Bowl Giveaway</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="admin-login">
          <h1>Super Bowl Giveaway Admin</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Loading...' : 'View Entries'}
            </button>
          </form>
          {error && <p className="error">{error}</p>}
        </div>
        <style jsx>{`
          .admin-login {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #fafafa;
            padding: 2rem;
          }
          h1 {
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
            color: #171717;
          }
          form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            width: 100%;
            max-width: 300px;
          }
          input {
            padding: 0.875rem 1rem;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            font-size: 1rem;
          }
          input:focus {
            outline: none;
            border-color: #171717;
          }
          button {
            padding: 0.875rem 1rem;
            background: #171717;
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
          }
          button:disabled {
            opacity: 0.6;
          }
          .error {
            color: #dc2626;
            margin-top: 1rem;
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin | Super Bowl Giveaway</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="admin-page">
        <header className="admin-header">
          <h1>Super Bowl LX Giveaway</h1>
          <div className="admin-actions">
            <button
              onClick={toggleContest}
              disabled={toggling}
              className={contestOpen ? 'btn-close' : 'btn-open'}
            >
              {toggling ? 'Updating...' : contestOpen ? 'Close Contest' : 'Open Contest'}
            </button>
            <button onClick={refresh} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </header>

        <div className={`contest-status ${contestOpen ? 'status-open' : 'status-closed'}`}>
          {contestOpen ? 'Contest is OPEN - Accepting entries' : 'Contest is CLOSED - No new entries'}
        </div>

        {data && (
          <>
            <div className="stats-grid">
              <div className="stat-card stat-total">
                <span className="stat-number">{data.stats.total_entries}</span>
                <span className="stat-label">Total Entries</span>
              </div>
              <div className="stat-card stat-patriots">
                <span className="stat-number">{data.stats.patriots_picks}</span>
                <span className="stat-label">Patriots</span>
              </div>
              <div className="stat-card stat-seahawks">
                <span className="stat-number">{data.stats.seahawks_picks}</span>
                <span className="stat-label">Seahawks</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{data.stats.entries_with_referrer || 0}</span>
                <span className="stat-label">With Referrer</span>
              </div>
            </div>

            {/* Winner Picker */}
            <div className="winner-section">
              <h2>Pick a Winner</h2>
              <div className="winner-controls">
                <label>Who won the Super Bowl?</label>
                <div className="team-select">
                  <button
                    type="button"
                    className={`team-btn ${winningTeam === 'patriots' ? 'team-btn-selected team-btn-patriots' : ''}`}
                    onClick={() => { setWinningTeam('patriots'); setWinner(null); }}
                  >
                    Patriots
                  </button>
                  <button
                    type="button"
                    className={`team-btn ${winningTeam === 'seahawks' ? 'team-btn-selected team-btn-seahawks' : ''}`}
                    onClick={() => { setWinningTeam('seahawks'); setWinner(null); }}
                  >
                    Seahawks
                  </button>
                </div>
                <button
                  className="pick-winner-btn"
                  onClick={pickRandomWinner}
                  disabled={!winningTeam || pickingWinner}
                >
                  {pickingWinner ? 'Picking...' : 'Pick Random Winner'}
                </button>
              </div>

              {winner && !winner.error && (
                <div className="winner-result">
                  <div className="winner-banner">WINNER!</div>
                  <div className="winner-name">{winner.first_name} {winner.last_name}</div>
                  <div className="winner-phone">{winner.phone_number}</div>
                  <div className="winner-pick">Picked: {winner.team_pick === 'patriots' ? 'Patriots' : 'Seahawks'}</div>
                  {winner.referred_by && (
                    <div className="winner-referrer">
                      <span className="referrer-label">Referred by:</span>
                      <span className="referrer-name">{winner.referred_by}</span>
                      <span className="referrer-note">Both win an Elite Panel!</span>
                    </div>
                  )}
                </div>
              )}

              {winner && winner.error && (
                <div className="winner-error">{winner.error}</div>
              )}
            </div>

            <div className="entries-section">
              <h2>All Entries ({data.entries.length})</h2>
              <div className="entries-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Pick</th>
                      <th>Referred By</th>
                      <th>Entered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.entries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.first_name} {entry.last_name}</td>
                        <td>{entry.phone_number}</td>
                        <td className={entry.team_pick === 'patriots' ? 'pick-patriots' : 'pick-seahawks'}>
                          {entry.team_pick === 'patriots' ? 'Patriots' : 'Seahawks'}
                        </td>
                        <td>{entry.referred_by || '-'}</td>
                        <td>{new Date(entry.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
      <style jsx>{`
        .admin-page {
          min-height: 100vh;
          background: #fafafa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 2rem;
        }
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .admin-header h1 {
          font-size: 1.5rem;
          color: #171717;
          margin: 0;
        }
        .admin-actions {
          display: flex;
          gap: 0.75rem;
        }
        .admin-header button {
          padding: 0.625rem 1.25rem;
          background: #171717;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
        }
        .admin-header button:disabled {
          opacity: 0.6;
        }
        .btn-close {
          background: #dc2626 !important;
        }
        .btn-open {
          background: #22c55e !important;
        }
        .contest-status {
          padding: 1rem;
          border-radius: 8px;
          text-align: center;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }
        .status-open {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        .status-closed {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .stat-card {
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        }
        .stat-total {
          background: #171717;
          border-color: #171717;
        }
        .stat-total .stat-number,
        .stat-total .stat-label {
          color: #fff;
        }
        .stat-patriots {
          border-left: 4px solid #c8102e;
        }
        .stat-seahawks {
          border-left: 4px solid #69be28;
        }
        .stat-number {
          display: block;
          font-size: 2.5rem;
          font-weight: 700;
          color: #171717;
        }
        .stat-label {
          font-size: 0.875rem;
          color: #737373;
          margin-top: 0.25rem;
        }
        .entries-section h2 {
          font-size: 1.125rem;
          color: #171717;
          margin: 0 0 1rem;
        }
        .entries-table {
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          overflow: hidden;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 0.875rem 1rem;
          text-align: left;
          border-bottom: 1px solid #f0f0f0;
        }
        th {
          background: #fafafa;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #737373;
        }
        td {
          font-size: 0.875rem;
          color: #171717;
        }
        tr:last-child td {
          border-bottom: none;
        }
        .pick-patriots {
          color: #c8102e;
          font-weight: 600;
        }
        .pick-seahawks {
          color: #69be28;
          font-weight: 600;
        }
        /* Winner Picker */
        .winner-section {
          background: #fff;
          border: 2px solid #171717;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        .winner-section h2 {
          font-size: 1.25rem;
          color: #171717;
          margin: 0 0 1rem;
        }
        .winner-controls {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .winner-controls label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #525252;
        }
        .team-select {
          display: flex;
          gap: 0.75rem;
        }
        .team-btn {
          flex: 1;
          padding: 0.875rem 1rem;
          background: #fff;
          border: 2px solid #e5e5e5;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .team-btn:hover {
          border-color: #171717;
        }
        .team-btn-selected {
          color: #fff;
        }
        .team-btn-patriots {
          background: #c8102e;
          border-color: #c8102e;
        }
        .team-btn-seahawks {
          background: #69be28;
          border-color: #69be28;
        }
        .pick-winner-btn {
          padding: 1rem;
          background: #171717;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
        }
        .pick-winner-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .winner-result {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 2px solid #f59e0b;
          border-radius: 12px;
          text-align: center;
        }
        .winner-banner {
          display: inline-block;
          background: #f59e0b;
          color: #fff;
          font-size: 0.875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0.375rem 1rem;
          border-radius: 100px;
          margin-bottom: 1rem;
        }
        .winner-name {
          font-size: 2rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.25rem;
        }
        .winner-phone {
          font-size: 1.25rem;
          color: #525252;
          margin-bottom: 0.5rem;
        }
        .winner-pick {
          font-size: 0.875rem;
          color: #737373;
          margin-bottom: 1rem;
        }
        .winner-referrer {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #f59e0b;
        }
        .referrer-label {
          display: block;
          font-size: 0.75rem;
          color: #737373;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }
        .referrer-name {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #171717;
          margin-bottom: 0.25rem;
        }
        .referrer-note {
          display: block;
          font-size: 0.875rem;
          color: #166534;
          font-weight: 600;
        }
        .winner-error {
          margin-top: 1rem;
          padding: 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          text-align: center;
        }
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .entries-table {
            overflow-x: auto;
          }
          table {
            min-width: 500px;
          }
        }
      `}</style>
    </>
  );
}
