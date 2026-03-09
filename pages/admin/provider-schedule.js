// /pages/admin/provider-schedule.js
// Provider Schedule Manager — view/edit Cal.com provider availability
// Range Medical System

import { useState, useEffect, useCallback } from 'react';
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';
import { useAuth } from '../../components/AuthProvider';

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };

function formatTime12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Get availability for a specific day from the schedule
function getDayAvailability(availability, day) {
  if (!availability) return null;
  for (const block of availability) {
    if (block.days && block.days.includes(day)) {
      return { startTime: block.startTime, endTime: block.endTime };
    }
  }
  return null;
}

// Convert per-day settings back to Cal.com grouped format
function buildAvailability(daySettings) {
  const groups = {};
  for (const day of DAY_ORDER) {
    const setting = daySettings[day];
    if (!setting?.active) continue;
    const key = `${setting.startTime}-${setting.endTime}`;
    if (!groups[key]) groups[key] = { days: [], startTime: setting.startTime, endTime: setting.endTime };
    groups[key].days.push(day);
  }
  return Object.values(groups);
}

export default function ProviderSchedulePage() {
  const { session, hasPermission } = useAuth();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit hours modal
  const [editProvider, setEditProvider] = useState(null);
  const [daySettings, setDaySettings] = useState({});

  // Override modal
  const [overrideProvider, setOverrideProvider] = useState(null);
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideType, setOverrideType] = useState('custom'); // 'custom' or 'unavailable'
  const [overrideStart, setOverrideStart] = useState('09:00');
  const [overrideEnd, setOverrideEnd] = useState('18:00');

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  }), [session]);

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/provider-schedules', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setProviders(data.providers || []);
      } else {
        setError(data.error || 'Failed to fetch schedules');
      }
    } catch (err) {
      setError('Failed to load provider schedules');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (session) fetchProviders();
  }, [session, fetchProviders]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Open edit hours modal
  const openEditModal = (provider) => {
    const schedule = provider.schedules?.[0];
    if (!schedule) {
      setError('No schedule found for this provider');
      return;
    }

    const settings = {};
    for (const day of DAY_ORDER) {
      const avail = getDayAvailability(schedule.availability, day);
      settings[day] = {
        active: !!avail,
        startTime: avail?.startTime || '09:00',
        endTime: avail?.endTime || '18:00',
      };
    }
    setDaySettings(settings);
    setEditProvider(provider);
  };

  // Save hours
  const saveHours = async () => {
    if (!editProvider) return;
    const schedule = editProvider.schedules?.[0];
    if (!schedule) return;

    setSaving(true);
    try {
      const availability = buildAvailability(daySettings);
      const res = await fetch(`/api/provider-schedules/${editProvider.userId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          scheduleId: schedule.id,
          availability,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditProvider(null);
        fetchProviders();
        showSuccess(`${editProvider.name}'s hours updated`);
      } else {
        setError(data.error || 'Failed to save hours');
      }
    } catch (err) {
      setError('Failed to save hours');
    } finally {
      setSaving(false);
    }
  };

  // Open override modal
  const openOverrideModal = (provider) => {
    setOverrideProvider(provider);
    setOverrideDate('');
    setOverrideType('custom');
    setOverrideStart('09:00');
    setOverrideEnd('18:00');
  };

  // Save override
  const saveOverride = async () => {
    if (!overrideProvider || !overrideDate) return;
    const schedule = overrideProvider.schedules?.[0];
    if (!schedule) return;

    setSaving(true);
    try {
      const existingOverrides = schedule.overrides || [];
      // Remove any existing override for the same date
      const filtered = existingOverrides.filter(o => o.date !== overrideDate);

      const newOverride = { date: overrideDate };
      if (overrideType === 'custom') {
        newOverride.startTime = overrideStart;
        newOverride.endTime = overrideEnd;
      }
      // If 'unavailable', no startTime/endTime = blocked

      filtered.push(newOverride);

      const res = await fetch(`/api/provider-schedules/${overrideProvider.userId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          scheduleId: schedule.id,
          overrides: filtered,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOverrideProvider(null);
        fetchProviders();
        showSuccess(`Override added for ${overrideProvider.name}`);
      } else {
        setError(data.error || 'Failed to add override');
      }
    } catch (err) {
      setError('Failed to add override');
    } finally {
      setSaving(false);
    }
  };

  // Remove override
  const removeOverride = async (provider, dateToRemove) => {
    if (!window.confirm(`Remove override for ${formatDate(dateToRemove)}?`)) return;

    const schedule = provider.schedules?.[0];
    if (!schedule) return;

    try {
      const updatedOverrides = (schedule.overrides || []).filter(o => o.date !== dateToRemove);

      const res = await fetch(`/api/provider-schedules/${provider.userId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          scheduleId: schedule.id,
          overrides: updatedOverrides,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProviders();
        showSuccess('Override removed');
      }
    } catch (err) {
      setError('Failed to remove override');
    }
  };

  const canManageSchedules = hasPermission('can_manage_schedules');

  return (
    <AdminLayout title="Provider Hours">
      {successMsg && (
        <div style={{ ...pageStyles.alert, background: '#dcfce7', color: '#166534' }}>{successMsg}</div>
      )}
      {error && (
        <div style={{ ...pageStyles.alert, background: '#fef2f2', color: '#dc2626' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>Loading schedules...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {providers.map(provider => {
            const schedule = provider.schedules?.[0];
            const overrides = schedule?.overrides || [];

            return (
              <div key={provider.userId} style={pageStyles.card}>
                {/* Provider header */}
                <div style={pageStyles.providerHeader}>
                  <div>
                    <h3 style={pageStyles.providerName}>{provider.name}</h3>
                    <span style={pageStyles.providerEmail}>{provider.email}</span>
                  </div>
                  {canManageSchedules && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openEditModal(provider)} style={pageStyles.actionBtn}>
                        Edit Hours
                      </button>
                      <button onClick={() => openOverrideModal(provider)} style={pageStyles.actionBtnOutline}>
                        Add Override
                      </button>
                    </div>
                  )}
                </div>

                {/* Weekly grid */}
                <div style={pageStyles.weekGrid}>
                  {DAY_ORDER.map(day => {
                    const avail = schedule ? getDayAvailability(schedule.availability, day) : null;
                    return (
                      <div key={day} style={pageStyles.dayCell}>
                        <div style={pageStyles.dayLabel}>{DAY_SHORT[day]}</div>
                        {avail ? (
                          <div style={pageStyles.dayTime}>
                            {formatTime12(avail.startTime)} – {formatTime12(avail.endTime)}
                          </div>
                        ) : (
                          <div style={pageStyles.dayOff}>OFF</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Overrides */}
                {overrides.length > 0 && (
                  <div style={pageStyles.overridesSection}>
                    <div style={pageStyles.overridesTitle}>
                      Overrides ({overrides.length})
                    </div>
                    {overrides.map((override, idx) => (
                      <div key={idx} style={pageStyles.overrideRow}>
                        <span style={pageStyles.overrideDate}>{formatDate(override.date)}</span>
                        <span style={pageStyles.overrideTime}>
                          {override.startTime && override.endTime
                            ? `${formatTime12(override.startTime)} – ${formatTime12(override.endTime)}`
                            : 'Unavailable'}
                        </span>
                        {canManageSchedules && (
                          <button
                            onClick={() => removeOverride(provider, override.date)}
                            style={pageStyles.removeBtn}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!schedule && (
                  <div style={{ color: '#999', fontSize: '14px', padding: '12px 0' }}>
                    No schedule configured in Cal.com
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Hours Modal */}
      {editProvider && (
        <div style={sharedStyles.modalOverlay} onClick={() => setEditProvider(null)}>
          <div style={{ ...sharedStyles.modal, maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div style={sharedStyles.modalHeader}>
              <h2 style={sharedStyles.modalTitle}>Edit Hours — {editProvider.name}</h2>
              <button onClick={() => setEditProvider(null)} style={sharedStyles.modalClose}>✕</button>
            </div>
            <div style={sharedStyles.modalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {DAY_ORDER.map(day => {
                  const setting = daySettings[day] || {};
                  return (
                    <div key={day} style={pageStyles.editRow}>
                      <label style={pageStyles.editDayLabel}>
                        <input
                          type="checkbox"
                          checked={setting.active || false}
                          onChange={e => setDaySettings(prev => ({
                            ...prev,
                            [day]: { ...prev[day], active: e.target.checked }
                          }))}
                          style={{ marginRight: '8px' }}
                        />
                        {DAY_SHORT[day]}
                      </label>
                      {setting.active ? (
                        <div style={pageStyles.editTimes}>
                          <input
                            type="time"
                            value={setting.startTime || '09:00'}
                            onChange={e => setDaySettings(prev => ({
                              ...prev,
                              [day]: { ...prev[day], startTime: e.target.value }
                            }))}
                            style={pageStyles.timeInput}
                          />
                          <span style={{ color: '#999' }}>to</span>
                          <input
                            type="time"
                            value={setting.endTime || '18:00'}
                            onChange={e => setDaySettings(prev => ({
                              ...prev,
                              [day]: { ...prev[day], endTime: e.target.value }
                            }))}
                            style={pageStyles.timeInput}
                          />
                        </div>
                      ) : (
                        <span style={{ color: '#999', fontSize: '13px' }}>Off</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={sharedStyles.modalFooter}>
              <button onClick={() => setEditProvider(null)} style={sharedStyles.btnSecondary}>Cancel</button>
              <button onClick={saveHours} disabled={saving} style={sharedStyles.btnPrimary}>
                {saving ? 'Saving...' : 'Save Hours'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Override Modal */}
      {overrideProvider && (
        <div style={sharedStyles.modalOverlay} onClick={() => setOverrideProvider(null)}>
          <div style={{ ...sharedStyles.modal, maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div style={sharedStyles.modalHeader}>
              <h2 style={sharedStyles.modalTitle}>Add Override — {overrideProvider.name}</h2>
              <button onClick={() => setOverrideProvider(null)} style={sharedStyles.modalClose}>✕</button>
            </div>
            <div style={sharedStyles.modalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={sharedStyles.label}>Date</label>
                  <input
                    type="date"
                    value={overrideDate}
                    onChange={e => setOverrideDate(e.target.value)}
                    style={sharedStyles.input}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label style={{ ...pageStyles.radioLabel, marginBottom: '8px', display: 'block' }}>
                    <input
                      type="radio"
                      name="overrideType"
                      value="custom"
                      checked={overrideType === 'custom'}
                      onChange={() => setOverrideType('custom')}
                      style={{ marginRight: '8px' }}
                    />
                    Custom hours
                  </label>
                  {overrideType === 'custom' && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '24px', marginBottom: '12px' }}>
                      <input
                        type="time"
                        value={overrideStart}
                        onChange={e => setOverrideStart(e.target.value)}
                        style={pageStyles.timeInput}
                      />
                      <span style={{ color: '#999' }}>to</span>
                      <input
                        type="time"
                        value={overrideEnd}
                        onChange={e => setOverrideEnd(e.target.value)}
                        style={pageStyles.timeInput}
                      />
                    </div>
                  )}

                  <label style={pageStyles.radioLabel}>
                    <input
                      type="radio"
                      name="overrideType"
                      value="unavailable"
                      checked={overrideType === 'unavailable'}
                      onChange={() => setOverrideType('unavailable')}
                      style={{ marginRight: '8px' }}
                    />
                    Unavailable (full day off)
                  </label>
                </div>
              </div>
            </div>
            <div style={sharedStyles.modalFooter}>
              <button onClick={() => setOverrideProvider(null)} style={sharedStyles.btnSecondary}>Cancel</button>
              <button onClick={saveOverride} disabled={saving || !overrideDate} style={sharedStyles.btnPrimary}>
                {saving ? 'Saving...' : 'Add Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const pageStyles = {
  alert: {
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '16px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '24px',
  },
  providerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  providerName: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111',
    margin: 0,
  },
  providerEmail: {
    fontSize: '13px',
    color: '#6b7280',
  },
  actionBtn: {
    background: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  actionBtnOutline: {
    background: '#fff',
    color: '#111',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  weekGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px',
    marginBottom: '16px',
  },
  dayCell: {
    textAlign: 'center',
    padding: '10px 4px',
    background: '#f9fafb',
    borderRadius: '8px',
    minWidth: 0,
  },
  dayLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#374151',
    marginBottom: '4px',
    textTransform: 'uppercase',
  },
  dayTime: {
    fontSize: '11px',
    color: '#111',
    lineHeight: 1.4,
  },
  dayOff: {
    fontSize: '12px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  overridesSection: {
    borderTop: '1px solid #f3f4f6',
    paddingTop: '16px',
  },
  overridesTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px',
  },
  overrideRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    background: '#fef9c3',
    borderRadius: '8px',
    marginBottom: '6px',
  },
  overrideDate: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#111',
    minWidth: '110px',
  },
  overrideTime: {
    fontSize: '13px',
    color: '#6b7280',
    flex: 1,
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  editRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  editDayLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    minWidth: '80px',
    cursor: 'pointer',
  },
  editTimes: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  timeInput: {
    padding: '6px 8px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
  },
  radioLabel: {
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
  },
};
