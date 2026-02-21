import React, { useState } from 'react';

const VEHICLE_CATEGORIES = [
  { value: 'LIGHT',       label: 'Light' },
  { value: 'MEDIUM',      label: 'Medium' },
  { value: 'HEAVY',       label: 'Heavy' },
  { value: 'EXTRA_HEAVY', label: 'Extra Heavy' },
  { value: 'CONTAINER',   label: 'Container' },
  { value: 'BIKE',        label: 'Bike' },
];

const EMPTY = {
  vehicle_name: '', licensePlate: '', category: '',
  max_capacity: '', current_odometer: '', acquisition_cost: '',
};

const VehicleForm = ({ onSubmit, loading }) => {
  const [form, setForm]     = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.vehicle_name.trim() || form.vehicle_name.trim().length < 2)
      errs.vehicle_name = 'Vehicle name is required (min 2 chars).';
    if (!form.licensePlate.trim() || form.licensePlate.trim().length < 2)
      errs.licensePlate = 'License plate is required (min 2 chars).';
    if (!form.category) errs.category = 'Select a vehicle category.';
    const cap = parseInt(form.max_capacity, 10);
    if (isNaN(cap) || cap < 0) errs.max_capacity = 'Capacity must be ≥ 0.';
    const odo = parseInt(form.current_odometer, 10);
    if (form.current_odometer !== '' && (isNaN(odo) || odo < 0))
      errs.current_odometer = 'Odometer must be ≥ 0.';
    const cost = parseFloat(form.acquisition_cost);
    if (isNaN(cost) || cost < 0) errs.acquisition_cost = 'Acquisition cost must be ≥ 0.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const ok = await onSubmit({
      ...form,
      max_capacity:     parseInt(form.max_capacity, 10),
      current_odometer: parseInt(form.current_odometer, 10) || 0,
      acquisition_cost: parseFloat(form.acquisition_cost),
    });
    if (ok) setForm(EMPTY);
  };

  return (
    <div className="veh-form-card">
      <h2 className="veh-form-title">
        <span className="veh-form-title-icon">➕</span> Add Vehicle
      </h2>

      <form onSubmit={handleSubmit} noValidate className="veh-form">
        {/* Vehicle Name */}
        <div className="form-group">
          <label className="form-label">Vehicle Name *</label>
          <input
            name="vehicle_name"
            className={`form-input ${errors.vehicle_name ? 'error' : ''}`}
            placeholder="Tata Ace Gold, Ashok Leyland 1920…"
            value={form.vehicle_name}
            onChange={handleChange}
          />
          {errors.vehicle_name && <p className="field-error">⚠ {errors.vehicle_name}</p>}
        </div>

        {/* License Plate */}
        <div className="form-group">
          <label className="form-label">License Plate *</label>
          <input
            name="licensePlate"
            className={`form-input ${errors.licensePlate ? 'error' : ''}`}
            placeholder="MH-12-AB-1234"
            value={form.licensePlate}
            onChange={handleChange}
          />
          {errors.licensePlate && <p className="field-error">⚠ {errors.licensePlate}</p>}
        </div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label">Category *</label>
          <select
            name="category"
            className={`form-input form-select ${errors.category ? 'error' : ''}`}
            value={form.category}
            onChange={handleChange}
          >
            <option value="">— Select category —</option>
            {VEHICLE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          {errors.category && <p className="field-error">⚠ {errors.category}</p>}
        </div>

        {/* Max Capacity */}
        <div className="form-group">
          <label className="form-label">Max Capacity (units) *</label>
          <input
            name="max_capacity"
            type="number"
            min="0"
            step="1"
            className={`form-input ${errors.max_capacity ? 'error' : ''}`}
            placeholder="1000"
            value={form.max_capacity}
            onChange={handleChange}
          />
          {errors.max_capacity && <p className="field-error">⚠ {errors.max_capacity}</p>}
        </div>

        {/* Odometer */}
        <div className="form-group">
          <label className="form-label">Current Odometer (km)</label>
          <input
            name="current_odometer"
            type="number"
            min="0"
            step="1"
            className={`form-input ${errors.current_odometer ? 'error' : ''}`}
            placeholder="0"
            value={form.current_odometer}
            onChange={handleChange}
          />
          {errors.current_odometer && <p className="field-error">⚠ {errors.current_odometer}</p>}
        </div>

        {/* Acquisition Cost */}
        <div className="form-group">
          <label className="form-label">Acquisition Cost (₹) *</label>
          <input
            name="acquisition_cost"
            type="number"
            min="0"
            step="0.01"
            className={`form-input ${errors.acquisition_cost ? 'error' : ''}`}
            placeholder="500000"
            value={form.acquisition_cost}
            onChange={handleChange}
          />
          {errors.acquisition_cost && <p className="field-error">⚠ {errors.acquisition_cost}</p>}
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8 }}>
          {loading
            ? <span className="btn-loader"><span className="spinner" /> Registering…</span>
            : '🚛 Register Vehicle'}
        </button>
      </form>
    </div>
  );
};

export default VehicleForm;
