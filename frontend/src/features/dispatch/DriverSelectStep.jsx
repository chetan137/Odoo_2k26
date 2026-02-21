import React from 'react';

const DriverSelectStep = ({ drivers, selected, onSelect, selectedVehicle }) => {
  // Filter drivers whose vehicle category matches (or show all if no vehicle selected)
  const filtered = selectedVehicle
    ? drivers.filter((d) => d.vehicleCategory === selectedVehicle.category)
    : drivers;

  const others = selectedVehicle
    ? drivers.filter((d) => d.vehicleCategory !== selectedVehicle.category)
    : [];

  return (
    <div className="dsp-driver-select">
      <div className="dsp-step-header">
        <span className="dsp-step-icon">👤</span>
        <div>
          <h3 className="dsp-step-title">Select Driver</h3>
          <p className="dsp-step-sub">
            {selectedVehicle
              ? `Showing drivers licensed for ${selectedVehicle.category.replace('_', ' ')} vehicles`
              : 'Choose an available driver'}
          </p>
        </div>
      </div>

      {drivers.length === 0 ? (
        <div className="dsp-empty">No approved drivers available right now.</div>
      ) : (
        <>
          {/* Matching drivers */}
          {filtered.length > 0 && (
            <div className="dsp-group">
              {selectedVehicle && <p className="dsp-group-label">Best Match</p>}
              {filtered.map((d) => (
                <DriverCard key={d.id} d={d} selected={selected} onSelect={onSelect} />
              ))}
            </div>
          )}

          {/* Other drivers */}
          {others.length > 0 && (
            <div className="dsp-group">
              <p className="dsp-group-label">Other Drivers</p>
              {others.map((d) => (
                <DriverCard key={d.id} d={d} selected={selected} onSelect={onSelect} />
              ))}
            </div>
          )}

          {!selectedVehicle && filtered.length === 0 && (
            <div className="dsp-empty">No matching drivers found.</div>
          )}
        </>
      )}
    </div>
  );
};

const CATEGORY_BADGE = {
  BIKE: { icon: '🏍️', color: '#10b981' },
  LIGHT: { icon: '🛻', color: '#6366f1' },
  MEDIUM: { icon: '🚛', color: '#f59e0b' },
  HEAVY: { icon: '🚚', color: '#ef4444' },
  EXTRA_HEAVY: { icon: '🚜', color: '#a78bfa' },
  CONTAINER: { icon: '📦', color: '#06b6d4' },
};

const DriverCard = ({ d, selected, onSelect }) => {
  const isSelected = selected?.id === d.id;
  const badge = CATEGORY_BADGE[d.vehicleCategory] || { icon: '🚗', color: '#6366f1' };

  return (
    <div className={`dsp-dcard ${isSelected ? 'dsp-dcard-selected' : ''}`} onClick={() => onSelect(d)}>
      <div className="dsp-dcard-avatar" style={{ background: `${badge.color}22`, color: badge.color }}>
        {d.name.charAt(0).toUpperCase()}
      </div>
      <div className="dsp-dcard-body">
        <div className="dsp-dcard-name">{d.name}</div>
        <span className="dsp-dcard-meta">
          {badge.icon} {d.vehicleCategory.replace('_', ' ')} · {d.yearsOfExperience}yr exp · {d.driverId}
        </span>
      </div>
      <div className="dsp-dcard-right">
        <span className="dsp-dcard-phone">📱 {d.phoneNumber}</span>
      </div>
    </div>
  );
};

export default DriverSelectStep;
