import React, { useState } from 'react';

// ── Status badge config ─────────────────────────────────────────────────────────
const STATUS_STYLES = {
  AVAILABLE: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: '🟢 Available' },
  ON_TRIP:   { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', label: '🔵 On Trip' },
  IN_SHOP:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: '🟡 In Shop' },
  RETIRED:   { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', label: '⚫ Retired' },
};

const CATEGORY_LABELS = {
  LIGHT: 'Light', MEDIUM: 'Medium', HEAVY: 'Heavy',
  EXTRA_HEAVY: 'Extra Heavy', CONTAINER: 'Container', BIKE: 'Bike',
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const formatCost = (v) =>
  v != null ? `₹${Number(v).toLocaleString('en-IN')}` : '—';

// ── Retire Confirmation Modal ────────────────────────────────────────────────────
const RetireModal = ({ vehicle, onConfirm, onCancel, loading }) => (
  <div className="modal-backdrop" onClick={onCancel}>
    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
      <div className="modal-header">
        <h2 className="modal-title">⚠️ Retire Vehicle</h2>
        <button className="modal-close" onClick={onCancel}>✕</button>
      </div>
      <div className="modal-body">
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
          Are you sure you want to retire{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            {vehicle.vehicle_id} — {vehicle.licensePlate}
          </strong>?
          This action marks it as permanently out of service. It cannot be undone easily.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Retiring…' : '🗑 Retire'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ── Main Table Component ─────────────────────────────────────────────────────────
const VehicleTable = ({ vehicles, stats, search, onSearchChange, categoryFilter, onCategoryChange, onRetire, canWrite }) => {
  const [retireTarget, setRetireTarget] = useState(null);
  const [retireLoading, setRetireLoading] = useState(false);

  const handleRetireConfirm = async () => {
    setRetireLoading(true);
    await onRetire(retireTarget.id);
    setRetireLoading(false);
    setRetireTarget(null);
  };

  return (
    <div className="veh-table-card">
      {/* ── Stats Row ─────────────────────────────────────────────────────────── */}
      <div className="veh-stats-row">
        {Object.entries(STATUS_STYLES).map(([key, s]) => (
          <div key={key} className="veh-stat-chip" style={{ color: s.color, background: s.bg }}>
            {s.label.split(' ')[0]}{' '}
            <strong>{stats[key] || 0}</strong>
          </div>
        ))}
        <div className="veh-stat-chip" style={{ color: 'var(--text-primary)', background: 'rgba(255,255,255,0.06)' }}>
          📦 Total <strong>{Object.values(stats).reduce((a, b) => a + b, 0)}</strong>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────────── */}
      <div className="veh-filters">
        <div className="veh-search-wrap">
          <span className="veh-search-icon">🔍</span>
          <input
            className="form-input veh-search-input"
            placeholder="Search plate, name or vehicle ID…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <select
          className="form-input form-select veh-type-filter"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORY_OPTIONS.map(([val, lbl]) => (
            <option key={val} value={val}>{lbl}</option>
          ))}
        </select>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      <div className="veh-table-wrapper">
        <table className="veh-table">
          <thead>
            <tr>
              <th>Vehicle ID</th>
              <th>Name</th>
              <th>Plate</th>
              <th>Category</th>
              <th>Capacity</th>
              <th>Odometer</th>
              <th>Cost</th>
              <th>Status</th>
              <th>Added</th>
              {canWrite && <th style={{ textAlign: 'center' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan={canWrite ? 10 : 9} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  {search || categoryFilter ? '🔍 No vehicles match the current filters.' : '🚛 No vehicles registered yet.'}
                </td>
              </tr>
            ) : (
              vehicles.map((v) => {
                const s = STATUS_STYLES[v.status] || STATUS_STYLES.AVAILABLE;
                return (
                  <tr key={v.id} className={v.status === 'RETIRED' ? 'veh-row-retired' : ''}>
                    <td className="veh-plate-cell">{v.vehicle_id}</td>
                    <td>{v.vehicle_name}</td>
                    <td className="veh-plate-cell">{v.licensePlate}</td>
                    <td>{CATEGORY_LABELS[v.category] || v.category}</td>
                    <td>{v.max_capacity?.toLocaleString() ?? '—'}</td>
                    <td>{v.current_odometer?.toLocaleString() ?? 0} km</td>
                    <td>{formatCost(v.acquisition_cost)}</td>
                    <td>
                      <span className="veh-status-badge" style={{ color: s.color, background: s.bg }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDate(v.createdAt)}</td>
                    {canWrite && (
                      <td style={{ textAlign: 'center' }}>
                        {v.status !== 'RETIRED' ? (
                          <button
                            className="btn-sm btn-danger-outline"
                            onClick={() => setRetireTarget(v)}
                            title="Retire vehicle"
                          >
                            Retire
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Retire Modal ──────────────────────────────────────────────────────── */}
      {retireTarget && (
        <RetireModal
          vehicle={retireTarget}
          onConfirm={handleRetireConfirm}
          onCancel={() => setRetireTarget(null)}
          loading={retireLoading}
        />
      )}
    </div>
  );
};

export default VehicleTable;
