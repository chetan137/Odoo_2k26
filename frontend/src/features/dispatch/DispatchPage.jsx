import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { fetchTrips, fetchResources, createTrip, updateTripStatus } from './tripService';
import VehicleSelectStep from './VehicleSelectStep';
import DriverSelectStep  from './DriverSelectStep';
import TripListPanel     from './TripListPanel';

const STEPS = ['vehicle', 'driver', 'details', 'confirm'];

const DispatchPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ── Trip list state ─────────────────────────────────────────────────────────
  const [trips, setTrips]             = useState([]);
  const [tripStats, setTripStats]     = useState({});
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [listLoading, setListLoading] = useState(false);

  // ── Resources ───────────────────────────────────────────────────────────────
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers]   = useState([]);

  // ── Create flow ─────────────────────────────────────────────────────────────
  const [showCreate, setShowCreate]   = useState(false);
  const [step, setStep]               = useState(0); // 0=vehicle, 1=driver, 2=details, 3=confirm
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver]   = useState(null);
  const [form, setForm]               = useState({ origin: '', destination: '', cargo_weight: '' });
  const [formErrors, setFormErrors]   = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // ── Load trips ──────────────────────────────────────────────────────────────
  const loadTrips = useCallback(async () => {
    setListLoading(true);
    try {
      const params = {};
      if (search)       params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await fetchTrips(params);
      if (res.data.success) {
        setTrips(res.data.data.trips);
        setTripStats(res.data.stats);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load trips.');
    } finally {
      setListLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  // ── Load resources when create flow opens ──────────────────────────────────
  const openCreateFlow = async () => {
    try {
      const res = await fetchResources();
      if (res.data.success) {
        setVehicles(res.data.vehicles);
        setDrivers(res.data.drivers);
      }
    } catch (err) {
      toast.error('Failed to load available vehicles/drivers.');
      return;
    }
    setShowCreate(true);
    setStep(0);
    setSelectedVehicle(null);
    setSelectedDriver(null);
    setForm({ origin: '', destination: '', cargo_weight: '' });
    setFormErrors({});
  };

  const closeCreateFlow = () => setShowCreate(false);

  // ── Step navigation ─────────────────────────────────────────────────────────
  const nextStep = () => {
    if (step === 0 && !selectedVehicle) { toast.error('Please select a vehicle.'); return; }
    if (step === 1 && !selectedDriver)  { toast.error('Please select a driver.'); return; }
    if (step === 2) {
      const errs = {};
      if (!form.origin.trim()) errs.origin = 'Origin is required.';
      if (!form.destination.trim()) errs.destination = 'Destination is required.';
      const cw = parseFloat(form.cargo_weight);
      if (isNaN(cw) || cw <= 0) errs.cargo_weight = 'Cargo weight must be > 0.';
      else if (selectedVehicle && cw > selectedVehicle.max_capacity) {
        errs.cargo_weight = `Exceeds max capacity of ${selectedVehicle.max_capacity} kg!`;
      }
      if (Object.keys(errs).length) { setFormErrors(errs); return; }
      setFormErrors({});
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  // ── Submit trip ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitLoading(true);
    try {
      const res = await createTrip({
        vehicleId: selectedVehicle.id,
        driverId:  selectedDriver.id,
        origin:    form.origin.trim(),
        destination: form.destination.trim(),
        cargo_weight: parseFloat(form.cargo_weight),
      });
      if (res.data.success) {
        toast.success(res.data.message);
        closeCreateFlow();
        loadTrips();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create trip.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Status update ───────────────────────────────────────────────────────────
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await updateTripStatus(id, newStatus);
      if (res.data.success) {
        toast.success(res.data.message);
        loadTrips();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update trip status.');
    }
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await logout();
    toast.success('Signed out.');
    navigate('/login', { replace: true });
  };

  if (!user) return null;
  const initials = user.name?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const accent = '#10b981';

  const backPath = user.role === 'ADMIN' ? '/admin'
    : user.role === 'MANAGER' ? '/manager/dashboard'
    : '/dispatcher/dashboard';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="dash-page">
      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="dash-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">🚛</span>
          <span className="sidebar-brand-name">FleetOS</span>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>
            {initials}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user.name}</p>
            <span className="sidebar-role-badge"
              style={{ color: accent, background: `${accent}1a`, border: `1px solid ${accent}4d` }}>
              📡 {user.role}
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-nav-label">DISPATCH</p>
          <button className="sidebar-nav-item sidebar-nav-active">
            <span className="sidebar-nav-icon">🗺️</span><span>Trip Manager</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => navigate('/vehicles')}>
            <span className="sidebar-nav-icon">🚛</span><span>Vehicle Registry</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => navigate(backPath)}>
            <span className="sidebar-nav-icon">←</span><span>Back to Dashboard</span>
          </button>
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <span>⏻</span> Sign Out
        </button>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="dash-main">
        <header className="dash-header">
          <div>
            <h1 className="dash-header-title">🗺️ Trip Dispatcher</h1>
            <p className="dash-header-sub">Create, dispatch and manage trips — assign vehicles and drivers.</p>
          </div>
          <button className="btn-primary" onClick={openCreateFlow}>
            + New Trip
          </button>
        </header>

        {/* ── Trip Creation Flow (overlay) ────────────────────────────────────── */}
        {showCreate && (
          <div className="dsp-create-overlay">
            <div className="dsp-create-panel">
              {/* Top bar */}
              <div className="dsp-create-topbar">
                <button className="dsp-back-btn" onClick={step === 0 ? closeCreateFlow : prevStep}>
                  ← {step === 0 ? 'Cancel' : 'Back'}
                </button>
                <h2 className="dsp-create-title">
                  {STEPS[step] === 'vehicle' && 'Select Vehicle'}
                  {STEPS[step] === 'driver'  && 'Select Driver'}
                  {STEPS[step] === 'details' && 'Trip Details'}
                  {STEPS[step] === 'confirm' && 'Confirm Trip'}
                </h2>
                <span className="dsp-step-indicator">{step + 1} of {STEPS.length}</span>
              </div>

              {/* Step progress */}
              <div className="dsp-progress">
                {STEPS.map((s, i) => (
                  <div key={s} className={`dsp-progress-dot ${i <= step ? 'dsp-progress-active' : ''}`} />
                ))}
              </div>

              {/* Step content */}
              <div className="dsp-create-content">
                {step === 0 && (
                  <VehicleSelectStep
                    vehicles={vehicles}
                    selected={selectedVehicle}
                    onSelect={setSelectedVehicle}
                  />
                )}

                {step === 1 && (
                  <DriverSelectStep
                    drivers={drivers}
                    selected={selectedDriver}
                    onSelect={setSelectedDriver}
                    selectedVehicle={selectedVehicle}
                  />
                )}

                {step === 2 && (
                  <div className="dsp-details-step">
                    <div className="dsp-step-header">
                      <span className="dsp-step-icon">📋</span>
                      <div>
                        <h3 className="dsp-step-title">Trip Details</h3>
                        <p className="dsp-step-sub">Enter route and cargo information</p>
                      </div>
                    </div>

                    <div className="dsp-detail-form">
                      <div className="form-group">
                        <label className="form-label">Origin *</label>
                        <input
                          className={`form-input ${formErrors.origin ? 'error' : ''}`}
                          placeholder="Pickup location"
                          value={form.origin}
                          onChange={(e) => { setForm(p => ({ ...p, origin: e.target.value })); setFormErrors(p => ({ ...p, origin: '' })); }}
                        />
                        {formErrors.origin && <p className="field-error">⚠ {formErrors.origin}</p>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Destination *</label>
                        <input
                          className={`form-input ${formErrors.destination ? 'error' : ''}`}
                          placeholder="Drop-off location"
                          value={form.destination}
                          onChange={(e) => { setForm(p => ({ ...p, destination: e.target.value })); setFormErrors(p => ({ ...p, destination: '' })); }}
                        />
                        {formErrors.destination && <p className="field-error">⚠ {formErrors.destination}</p>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Cargo Weight (kg) *
                          {selectedVehicle && (
                            <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
                              Max: {selectedVehicle.max_capacity.toLocaleString()} kg
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          min="1"
                          className={`form-input ${formErrors.cargo_weight ? 'error' : ''}`}
                          placeholder="500"
                          value={form.cargo_weight}
                          onChange={(e) => { setForm(p => ({ ...p, cargo_weight: e.target.value })); setFormErrors(p => ({ ...p, cargo_weight: '' })); }}
                        />
                        {formErrors.cargo_weight && <p className="field-error">⚠ {formErrors.cargo_weight}</p>}

                        {/* Live capacity bar */}
                        {selectedVehicle && form.cargo_weight && !isNaN(parseFloat(form.cargo_weight)) && (
                          <div className="dsp-capacity-bar-wrap">
                            <div className="dsp-capacity-bar">
                              <div
                                className="dsp-capacity-fill"
                                style={{
                                  width: `${Math.min((parseFloat(form.cargo_weight) / selectedVehicle.max_capacity) * 100, 100)}%`,
                                  background: parseFloat(form.cargo_weight) > selectedVehicle.max_capacity ? '#ef4444' : '#10b981',
                                }}
                              />
                            </div>
                            <span className="dsp-capacity-text" style={{
                              color: parseFloat(form.cargo_weight) > selectedVehicle.max_capacity ? '#ef4444' : 'var(--text-muted)',
                            }}>
                              {Math.round((parseFloat(form.cargo_weight) / selectedVehicle.max_capacity) * 100)}% capacity
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="dsp-confirm-step">
                    <div className="dsp-step-header">
                      <span className="dsp-step-icon">✅</span>
                      <div>
                        <h3 className="dsp-step-title">Confirm Trip</h3>
                        <p className="dsp-step-sub">Review details before creating</p>
                      </div>
                    </div>

                    <div className="dsp-confirm-card">
                      <div className="dsp-confirm-row">
                        <span className="dsp-confirm-label">🚛 Vehicle</span>
                        <span>{selectedVehicle?.vehicle_name} — {selectedVehicle?.licensePlate}</span>
                      </div>
                      <div className="dsp-confirm-row">
                        <span className="dsp-confirm-label">📦 Capacity</span>
                        <span>{selectedVehicle?.max_capacity.toLocaleString()} kg</span>
                      </div>
                      <div className="dsp-confirm-row">
                        <span className="dsp-confirm-label">👤 Driver</span>
                        <span>{selectedDriver?.name} ({selectedDriver?.driverId})</span>
                      </div>
                      <div className="dsp-confirm-row">
                        <span className="dsp-confirm-label">📍 Origin</span>
                        <span>{form.origin}</span>
                      </div>
                      <div className="dsp-confirm-row">
                        <span className="dsp-confirm-label">🏁 Destination</span>
                        <span>{form.destination}</span>
                      </div>
                      <div className="dsp-confirm-row">
                        <span className="dsp-confirm-label">📦 Cargo</span>
                        <span>{form.cargo_weight} kg ({Math.round((parseFloat(form.cargo_weight) / selectedVehicle?.max_capacity) * 100)}% capacity)</span>
                      </div>
                      <div className="dsp-confirm-row">
                        <span className="dsp-confirm-label">📋 Status</span>
                        <span style={{ color: '#94a3b8' }}>Will be created as DRAFT</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom action bar */}
              <div className="dsp-create-footer">
                {step < STEPS.length - 1 ? (
                  <button className="btn-primary dsp-proceed-btn" onClick={nextStep}>
                    {step === 0 && selectedVehicle && `Proceed With ${selectedVehicle.vehicle_name}`}
                    {step === 0 && !selectedVehicle && 'Select a Vehicle'}
                    {step === 1 && selectedDriver && `Continue with ${selectedDriver.name}`}
                    {step === 1 && !selectedDriver && 'Select a Driver'}
                    {step === 2 && 'Review Trip'}
                  </button>
                ) : (
                  <button
                    className="btn-primary dsp-proceed-btn"
                    onClick={handleSubmit}
                    disabled={submitLoading}
                  >
                    {submitLoading ? '⏳ Creating Trip…' : '🚀 Create Trip (Draft)'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Trip List ───────────────────────────────────────────────────────── */}
        <TripListPanel
          trips={trips}
          stats={tripStats}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          onStatusUpdate={handleStatusUpdate}
          loading={listLoading}
        />
      </main>
    </div>
  );
};

export default DispatchPage;
