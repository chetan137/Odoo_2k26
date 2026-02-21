import React, { useState } from 'react';

const CATEGORY_ORDER = ['BIKE', 'LIGHT', 'MEDIUM', 'HEAVY', 'EXTRA_HEAVY', 'CONTAINER'];
const CATEGORY_LABELS = {
  BIKE: '2 Wheeler', LIGHT: 'Light Vehicles', MEDIUM: 'Medium Trucks',
  HEAVY: 'Heavy Trucks', EXTRA_HEAVY: 'Extra Heavy', CONTAINER: 'Container',
};
const CATEGORY_ICONS = {
  BIKE: '🏍️', LIGHT: '🛻', MEDIUM: '🚛', HEAVY: '🚚', EXTRA_HEAVY: '🚜', CONTAINER: '📦',
};

const formatDim = (v) => {
  const n = Number(v);
  return n > 0 ? `${n}ft` : null;
};

const VehicleCard = ({ v, selected, onSelect, onInfo }) => {
  const isSelected = selected?.id === v.id;
  const dims = [formatDim(v.length_ft), formatDim(v.width_ft), formatDim(v.height_ft)].filter(Boolean);

  return (
    <div
      className={`dsp-vcard ${isSelected ? 'dsp-vcard-selected' : ''}`}
      onClick={() => onSelect(v)}
    >
      <div className="dsp-vcard-icon">
        {CATEGORY_ICONS[v.category] || '🚛'}
      </div>
      <div className="dsp-vcard-body">
        <div className="dsp-vcard-name">
          {v.vehicle_name}
          {dims.length > 0 && (
            <button className="dsp-vcard-info-btn" onClick={(e) => { e.stopPropagation(); onInfo(v); }} title="View dimensions">
              ⓘ
            </button>
          )}
        </div>
        <span className="dsp-vcard-meta">
          {v.max_capacity.toLocaleString()} kg · {v.current_odometer.toLocaleString()} km
        </span>
      </div>
      <div className="dsp-vcard-right">
        <span className="dsp-vcard-plate">{v.licensePlate}</span>
        <span className="dsp-vcard-vid">{v.vehicle_id}</span>
      </div>
    </div>
  );
};

/* ── Dimension Detail Modal ────────────────────────────────────────────────── */
const DimensionModal = ({ vehicle, onClose }) => {
  if (!vehicle) return null;
  const l = Number(vehicle.length_ft), w = Number(vehicle.width_ft), h = Number(vehicle.height_ft);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card dsp-dim-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📐 {vehicle.vehicle_name}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* Simple dimension diagram */}
          <div className="dsp-dim-diagram">
            <div className="dsp-dim-box">
              <span className="dsp-dim-top">{w > 0 ? `${w} ft` : '—'}</span>
              <div className="dsp-dim-middle">
                <span className="dsp-dim-side">{h > 0 ? `${h} ft` : '—'}</span>
                <div className="dsp-dim-face">
                  {CATEGORY_ICONS[vehicle.category] || '🚛'}
                </div>
                <span className="dsp-dim-side">{l > 0 ? `${l} ft` : '—'}</span>
              </div>
            </div>
          </div>

          <div className="dsp-dim-info">
            <p className="dsp-dim-name">{vehicle.vehicle_name}</p>
            <p className="dsp-dim-specs">
              {vehicle.max_capacity.toLocaleString()} kg · {l > 0 || w > 0 || h > 0
                ? `${l || 0}ft × ${w || 0}ft × ${h || 0}ft`
                : 'No dimensions'}
            </p>
          </div>
          <button className="btn-primary" onClick={onClose} style={{ width: '100%', marginTop: 16 }}>Done</button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Vehicle Select ────────────────────────────────────────────────────── */
const VehicleSelectStep = ({ vehicles, selected, onSelect }) => {
  const [dimTarget, setDimTarget] = useState(null);

  // Group by category
  const grouped = {};
  vehicles.forEach((v) => {
    if (!grouped[v.category]) grouped[v.category] = [];
    grouped[v.category].push(v);
  });

  // Recommend: first available by lightest category
  const recommended = vehicles.length > 0 ? vehicles[0] : null;

  return (
    <div className="dsp-vehicle-select">
      <div className="dsp-step-header">
        <span className="dsp-step-icon">🚛</span>
        <div>
          <h3 className="dsp-step-title">Select Vehicle</h3>
          <p className="dsp-step-sub">Choose an available vehicle for this trip</p>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="dsp-empty">No vehicles available right now.</div>
      ) : (
        <>
          {/* Recommended */}
          {recommended && (
            <div className="dsp-group">
              <p className="dsp-group-label">Recommended</p>
              <VehicleCard v={recommended} selected={selected} onSelect={onSelect} onInfo={setDimTarget} />
            </div>
          )}

          {/* By category */}
          {CATEGORY_ORDER.map((cat) => {
            const list = grouped[cat];
            if (!list || list.length === 0) return null;
            // Skip recommended vehicle in its group to avoid duplicate
            const filtered = list.filter((v) => v.id !== recommended?.id);
            if (filtered.length === 0) return null;
            return (
              <div key={cat} className="dsp-group">
                <p className="dsp-group-label">{CATEGORY_LABELS[cat] || cat}</p>
                {filtered.map((v) => (
                  <VehicleCard key={v.id} v={v} selected={selected} onSelect={onSelect} onInfo={setDimTarget} />
                ))}
              </div>
            );
          })}
        </>
      )}

      <DimensionModal vehicle={dimTarget} onClose={() => setDimTarget(null)} />
    </div>
  );
};

export default VehicleSelectStep;
