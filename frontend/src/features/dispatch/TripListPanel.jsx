import React from 'react';

const STATUS_STYLES = {
  DRAFT:      { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: '📝 Draft' },
  DISPATCHED: { color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  label: '🚀 Dispatched' },
  COMPLETED:  { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: '✅ Completed' },
  CANCELLED:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: '❌ Cancelled' },
};

const NEXT_ACTIONS = {
  DRAFT:      [{ status: 'DISPATCHED', label: '🚀 Dispatch', cls: 'btn-sm btn-primary-sm' },
               { status: 'CANCELLED',  label: '✕ Cancel',    cls: 'btn-sm btn-danger-outline' }],
  DISPATCHED: [{ status: 'COMPLETED',  label: '✅ Complete', cls: 'btn-sm btn-success-sm' },
               { status: 'CANCELLED',  label: '✕ Cancel',    cls: 'btn-sm btn-danger-outline' }],
  COMPLETED:  [],
  CANCELLED:  [],
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const TripListPanel = ({ trips, stats, search, onSearchChange, statusFilter, onStatusChange, onStatusUpdate, loading }) => {
  return (
    <div className="dsp-trips-panel">
      {/* Stats */}
      <div className="dsp-trip-stats">
        {Object.entries(STATUS_STYLES).map(([key, s]) => (
          <div key={key} className="veh-stat-chip" style={{ color: s.color, background: s.bg }}>
            {s.label.split(' ')[0]} <strong>{stats[key] || 0}</strong>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="veh-filters" style={{ marginBottom: 16 }}>
        <div className="veh-search-wrap">
          <span className="veh-search-icon">🔍</span>
          <input
            className="form-input veh-search-input"
            placeholder="Search trip ID, origin, destination…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <select
          className="form-input form-select veh-type-filter"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_STYLES).map(([key, s]) => (
            <option key={key} value={key}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Trip cards */}
      <div className="dsp-trip-list">
        {trips.length === 0 ? (
          <div className="dsp-empty" style={{ padding: 40 }}>
            {search || statusFilter ? '🔍 No trips match the filters.' : '📋 No trips yet. Create one!'}
          </div>
        ) : (
          trips.map((t) => {
            const s = STATUS_STYLES[t.status] || STATUS_STYLES.DRAFT;
            const actions = NEXT_ACTIONS[t.status] || [];
            return (
              <div key={t.id} className="dsp-trip-card">
                <div className="dsp-trip-card-top">
                  <div className="dsp-trip-id">{t.tripId}</div>
                  <span className="veh-status-badge" style={{ color: s.color, background: s.bg }}>{s.label}</span>
                </div>

                <div className="dsp-trip-route">
                  <span className="dsp-trip-origin">📍 {t.origin}</span>
                  <span className="dsp-trip-arrow">→</span>
                  <span className="dsp-trip-dest">🏁 {t.destination}</span>
                </div>

                <div className="dsp-trip-details">
                  <span>🚛 {t.vehicle?.vehicle_name || '—'} ({t.vehicle?.licensePlate || '—'})</span>
                  <span>👤 {t.driver?.name || '—'} ({t.driver?.driverId || '—'})</span>
                  <span>📦 {t.cargo_weight ? `${t.cargo_weight} kg` : '—'}</span>
                  <span>🕒 {formatDate(t.createdAt)}</span>
                </div>

                {actions.length > 0 && (
                  <div className="dsp-trip-actions">
                    {actions.map((a) => (
                      <button
                        key={a.status}
                        className={a.cls}
                        onClick={() => onStatusUpdate(t.id, a.status)}
                        disabled={loading}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TripListPanel;
