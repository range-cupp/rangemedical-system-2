// /pages/admin/provider-schedule.js
// Provider Schedule Manager — view/edit Cal.com provider availability
// Supports multiple schedules per provider (e.g., Newport Beach + Placentia)
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

// Detect location from schedule name
function getScheduleLocation(schedule) {
  const name = (schedule?.name || '').toLowerCase();
  if (name.includes('placentia') || name.includes('tlab')) {
    return { label: 'Placentia', short: 'Placentia', color: '#7c3aed', bg: '#ede9fe', icon: '📍' };
  }
  return { label: 'Newport Beach', short: 'Newport Beach', color: '#0369a1', bg: '#e0f2fe', icon: '🏥' };
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
  const [editSchedule, setEditSchedule] = useState(null);
  const [daySettings, setDaySettings] = useState({});

  // Override modal
  const [overrideProvider, setOverrideProvider] = useState(null);
  const [overrideSchedule, setOverrideSchedule] = useState(null);
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

  // Open edit hours modal for a specific schedule
  const openEditModal = (provider, schedule) => {
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
    setEditSchedule(schedule);
  };

  // Save hours
  const saveHours = async () => {
    if (!editProvider || !editSchedule) return;

    setSaving(true);
    try {
      const availability = buildAvailability(daySettings);
      const res = await fetch(`/api/provider-schedules/${editProvider.userId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          scheduleId: editSchedule.id,
          availability,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditProvider(null);
        setEditSchedule(null);
        fetchProviders();
        const location = getScheduleLocation(editSchedule);
        showSuccess(`${editProvider.name}'s ${location.short} hours updated`);
      } else {
        setError(data.error || 'Failed to save hours');
      }
    } catch (err) {
      setError('Failed to save hours');
    } finally {
      setSaving(false);
    }
  };

  // Open override modal for a specific schedule
  const openOverrideModal = (provider, schedule) => {
    setOverrideProvider(provider);
    setOverrideSchedule(schedule);
    setOverrideDate('');
    setOverrideType('custom');
    setOverrideStart('09:00');
    setOverrideEnd('18:00');
  };

  // Save override
  const saveOverride = async () => {
    if (!overrideProvider || !overrideSchedule || !overrideDate) return;

    setSaving(true);
    try {
      const existingOverrides = overrideSchedule.overrides || [];
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
          scheduleId: overrideSchedule.id,
          overrides: filtered,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOverrideProvider(null);
        setOverrideSchedule(null);
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
  const removeOverride = async (provider, schedule, dateToRemove) => {
    if (!window.confirm(`Remove override for ${formatDate(dateToRemove)}?`)) return;

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

  // Get modal schedule location for title
  const editLocation = editSchedule ? getScheduleLocation(editSchedule) : null;
  const overrideLocation = overrideSchedule ? getScheduleLocation(overrideSchedule) : null;

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
            const schedules = provider.schedules || [];
            const hasMultipleSchedules = schedules.length > 1;

            return (
              <div key={provider.userId} style={pageStyles.card}>
                {/* Provider header */}
                <div style={pageStyles.providerHeader}>
                  <div>
                    <h3 style={pageStyles.providerName}>{provider.name}</h3>
                    <span style={pageStyles.providerEmail}>{provider.email}</span>
                  </div>
                  {hasMultipleSchedules && (
                    <span style={pageStyles.multiLocationBadge}>
                      {schedules.length} locations
                    </span>
                  )}
                </div>

                {/* Render each schedule */}
                {schedules.length === 0 && (
                  <div style={{ color: '#999', fontSize: '14px', padding: '12px 0' }}>
                    No schedule configured in Cal.com
                  </div>
                )}

                {schedules.map((schedule, idx) => {
                  const location = getScheduleLocation(schedule);
                  const overrides = schedule.overrides || [];
                  // Filter to future overrides only
                  const today = new Date().toISOString().split('T')[0];
                  const futureOverrides = overrides.filter(o => o.date >= today);

                  return (
                    <div key={schedule.id} style={{
                      ...pageStyles.scheduleSection,
                      ...(idx > 0 ? { borderTop: '1px solid #e5e7eb', marginTop: '16px', paddingTop: '16px' } : {}),
                    }}>
                      {/* Schedule header with location badge */}
                      <div style={pageStyles.scheduleHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {hasMultipleSchedules && (
                            <span style={{
                              ...pageStyles.locationBadge,
                              background: location.bg,
                              color: location.color,
                            }}>
                              {location.icon} {location.label}
                            </span>
                          )}
                          {hasMultipleSchedules && (
                            <span style={pageStyles.scheduleName}>
                              {schedule.name || 'Default Schedule'}
                            </span>
                          )}
                        </div>
                        {hasMultipleSchedules && canManageSchedules && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => openEditModal(provider, schedule)} style={pageStyles.actionBtn}>
                              Edit Hours
                            </button>
                            <button onClick={() => openOverrideModal(provider, schedule)} style={pageStyles.actionBtnOutline}>
                              Add Override
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Weekly grid */}
                      <div style={pageStyles.weekGrid}>
                        {DAY_ORDER.map(day => {
                          const avail = getDayAvailability(schedule.availability, day);
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
                      {futureOverrides.length > 0 && (
                        <div style={pageStyles.overridesSection}>
                          <div style={pageStyles.overridesTitle}>
                            Overrides ({futureOverrides.length})
                          </div>
                          {futureOverrides.map((override, oidx) => (
                            <div key={oidx} style={pageStyles.overrideRow}>
                              <span style={pageStyles.overrideDate}>{formatDate(override.date)}</span>
                              <span style={pageStyles.overrideTime}>
                                {override.startTime && override.endTime
                                  ? `${formatTime12(override.startTime)} – ${formatTime12(override.endTime)}`
                                  : 'Unavailable'}
                              </span>
                              {canManageSchedules && (
                                <button
                                  onClick={() => removeOverride(provider, schedule, override.date)}
                                  style={pageStyles.removeBtn}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Single schedule — show buttons at provider level if only 1 schedule */}
                {schedules.length === 1 && !canManageSchedules ? null : null}
                {schedules.length === 1 && canManageSchedules && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button onClick={() => openEditModal(provider, schedules[0])} style={pageStyles.actionBtn}>
                      Edit Hours
                    </button>
                    <button onClick={() => openOverrideModal(provider, schedules[0])} style={pageStyles.actionBtnOutline}>
                      Add Override
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Hours Modal */}
      {editProvider && editSchedule && (
        <div style={sharedStyles.modalOverlay} onClick={() => { setEditProvider(null); setEditSchedule(null); }}>
          <div style={{ ...sharedStyles.modal, maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div style={sharedStyles.modalHeader}>
              <div>
                <h2 style={sharedStyles.modalTitle}>Edit Hours — {editProvider.name}</h2>
                {editLocation && (
                  <span style={{
                    fontSize: '13px',
                    color: editLocation.color,
                    background: editLocation.bg,
                    padding: '2px 10px',
                    borderRadius: '12px',
                    display: 'inline-block',
                    marginTop: '4px',
                  }}>
                    {editLocation.icon} {editLocation.label}
                  </span>
                )}
              </div>
              <button onClick={() => { setEditProvider(null); setEditSchedule(null); }} style={sharedStyles.modalClose}>✕</button>
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
              <button onClick={() => { setEditProvider(null); setEditSchedule(null); }} style={sharedStyles.btnSecondary}>Cancel</button>
              <button onClick={saveHours} disabled={saving} style={sharedStyles.btnPrimary}>
                {saving ? 'Saving...' : 'Save Hours'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Override Modal */}
      {overrideProvider && overrideSchedule && (
        <div style={sharedStyles.modalOverlay} onClick={() => { setOverrideProvider(null); setOverrideSchedule(null); }}>
          <div style={{ ...sharedStyles.modal, maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div style={sharedStyles.modalHeader}>
              <div>
                <h2 style={sharedStyles.modalTitle}>Add Override — {overrideProvider.name}</h2>
                {overrideLocation && (
                  <span style={{
                    fontSize: '13px',
                    color: overrideLocation.color,
                    background: overrideLocation.bg,
                    padding: '2px 10px',
                    borderRadius: '12px',
                    display: 'inline-block',
                    marginTop: '4px',
                  }}>
                    {overrideLocation.icon} {overrideLocation.label}
                  </span>
                )}
              </div>
              <button onClick={() => { setOverrideProvider(null); setOverrideSchedule(null); }} style={sharedStyles.modalClose}>✕</button>
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
              <button onClick={() => { setOverrideProvider(null); setOverrideSchedule(null); }} style={sharedStyles.btnSecondary}>Cancel</button>
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
  multiLocationBadge: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280',
    background: '#f3f4f6',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  scheduleSection: {
    // Container for each schedule within a provider card
  },
  scheduleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  locationBadge: {
    fontSize: '12px',
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: '16px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  scheduleName: {
    fontSize: '13px',
    color: '#9ca3af',
    fontStyle: 'italic',
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
    paddingTop: '12px',
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
