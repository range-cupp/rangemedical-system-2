// /components/PaymentCalendar.js
// Month-view calendar for payment dashboard
// Shows per-day payment counts, collected amounts, and outstanding balances

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PaymentCalendar({ onDaySelect, selectedDate, onMonthChange }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [monthData, setMonthData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    fetchMonthData();
    if (onMonthChange) onMonthChange(monthKey);
  }, [monthKey]);

  const fetchMonthData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/daily?month=${monthKey}`);
      const data = await res.json();
      setMonthData(data.days || {});
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Failed to load calendar data:', err);
      setMonthData({});
    }
    setLoading(false);
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  // Build calendar grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const cells = [];
  // Leading empty cells
  for (let i = 0; i < firstDay; i++) cells.push(null);
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Trailing empty cells to complete the grid
  while (cells.length % 7 !== 0) cells.push(null);

  const formatMoney = (cents) => {
    if (!cents) return '';
    return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Summary stats */}
      {summary && (
        <div style={cal.statsRow}>
          <div style={cal.stat}>
            <div style={{ ...cal.statValue, color: '#166534' }}>
              {formatMoney(summary.total_collected_cents)}
            </div>
            <div style={cal.statLabel}>Collected</div>
          </div>
          <div style={cal.stat}>
            <div style={{ ...cal.statValue, color: '#92400e' }}>
              {formatMoney(summary.total_outstanding_cents)}
            </div>
            <div style={cal.statLabel}>Outstanding</div>
          </div>
          <div style={cal.stat}>
            <div style={{ ...cal.statValue, color: '#dc2626' }}>
              {summary.failed_count}
            </div>
            <div style={cal.statLabel}>Failed</div>
          </div>
          <div style={cal.stat}>
            <div style={{ ...cal.statValue, color: '#7c3aed' }}>
              {formatMoney(summary.total_refunded_cents)}
            </div>
            <div style={cal.statLabel}>Refunded</div>
          </div>
          <div style={cal.stat}>
            <div style={cal.statValue}>{summary.transaction_count}</div>
            <div style={cal.statLabel}>Transactions</div>
          </div>
        </div>
      )}

      {/* Month header */}
      <div style={cal.header}>
        <div style={cal.headerLeft}>
          <button onClick={prevMonth} style={cal.navBtn}><ChevronLeft size={18} /></button>
          <h3 style={cal.monthTitle}>{monthName}</h3>
          <button onClick={nextMonth} style={cal.navBtn}><ChevronRight size={18} /></button>
        </div>
        <button onClick={goToToday} style={cal.todayBtn}>
          <Calendar size={14} /> Today
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={cal.grid}>
        {DAYS.map(d => (
          <div key={d} style={cal.dayHeader}>{d}</div>
        ))}
      </div>

      {/* Calendar cells */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '13px' }}>
          Loading calendar...
        </div>
      ) : (
        <div style={cal.grid}>
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} style={cal.emptyCell} />;
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayData = monthData?.[dateStr];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const hasData = dayData && dayData.count > 0;
            const isFuture = dateStr > today;

            return (
              <div
                key={dateStr}
                onClick={() => hasData && onDaySelect(dateStr)}
                style={{
                  ...cal.cell,
                  ...(isToday ? cal.cellToday : {}),
                  ...(isSelected ? cal.cellSelected : {}),
                  ...(hasData ? cal.cellHasData : {}),
                  ...(isFuture ? { opacity: 0.5 } : {}),
                  cursor: hasData ? 'pointer' : 'default',
                }}
              >
                <div style={{
                  ...cal.dayNum,
                  ...(isToday ? { color: '#1e40af', fontWeight: '700' } : {}),
                  ...(isSelected ? { color: '#fff' } : {}),
                }}>
                  {day}
                </div>
                {hasData && (
                  <div style={cal.dayContent}>
                    <div style={{
                      ...cal.dayAmount,
                      ...(isSelected ? { color: '#bbf7d0' } : {}),
                    }}>
                      {formatMoney(dayData.collected_cents)}
                    </div>
                    {dayData.outstanding_cents > 0 && (
                      <div style={{
                        ...cal.dayOutstanding,
                        ...(isSelected ? { color: '#fde68a' } : {}),
                      }}>
                        {formatMoney(dayData.outstanding_cents)} due
                      </div>
                    )}
                    {dayData.failed > 0 && (
                      <div style={{
                        ...cal.dayFailed,
                        ...(isSelected ? { color: '#fca5a5' } : {}),
                      }}>
                        {dayData.failed} failed
                      </div>
                    )}
                    <div style={{
                      ...cal.dayCount,
                      ...(isSelected ? { color: 'rgba(255,255,255,0.7)' } : {}),
                    }}>
                      {dayData.count} txn{dayData.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const cal = {
  statsRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  stat: {
    flex: 1,
    background: '#fff',
    borderRadius: '0',
    border: '1px solid #e2e8f0',
    padding: '14px 16px',
    textAlign: 'center',
    minWidth: '100px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '4px',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: '10px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: '0.5px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  monthTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    minWidth: '180px',
    textAlign: 'center',
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: '1px solid #e2e8f0',
    borderRadius: '0',
    background: '#fff',
    cursor: 'pointer',
    color: '#475569',
    fontFamily: 'inherit',
  },
  todayBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '0',
    background: '#fff',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#475569',
    fontFamily: 'inherit',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '1px',
    background: '#e2e8f0',
    border: '1px solid #e2e8f0',
    borderRadius: '0',
    overflow: 'hidden',
  },
  dayHeader: {
    padding: '8px',
    textAlign: 'center',
    fontSize: '11px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    background: '#f8fafc',
    letterSpacing: '0.5px',
  },
  emptyCell: {
    background: '#fafafa',
    minHeight: '90px',
  },
  cell: {
    background: '#fff',
    minHeight: '90px',
    padding: '6px 8px',
    transition: 'background 0.15s',
    position: 'relative',
  },
  cellToday: {
    background: '#eff6ff',
  },
  cellSelected: {
    background: '#1e40af',
  },
  cellHasData: {
    // Slight green tint for days with payments
  },
  dayNum: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#475569',
    marginBottom: '2px',
  },
  dayContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  dayAmount: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#166534',
  },
  dayOutstanding: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#92400e',
  },
  dayFailed: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#dc2626',
  },
  dayCount: {
    fontSize: '10px',
    color: '#94a3b8',
    fontWeight: '500',
  },
};
