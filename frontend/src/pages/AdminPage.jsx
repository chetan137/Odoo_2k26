import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  adminListUsers, adminCreateUser,
  adminUpdateRole, adminUpdateStatus, adminResetPassword,
  adminListDrivers, adminApproveDriver, adminUpdateDriverStatus,
  adminListVehicles, adminCreateVehicle, adminUpdateVehicleStatus,
  adminGetVehicleHistory, adminAddVehicleService,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── Helpers ─────────────────────────────────────────────────────────────────────
const ROLE_STYLES = {
  ADMIN:      { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: '👑' },
  MANAGER:    { color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  icon: '🎯' },
  DISPATCHER: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '📡' },
};
const DRIVER_STATUS_STYLES = {
  AVAILABLE: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: '🟢 Available' },
  ON_TRIP:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: '🚙 On Trip'  },
  INACTIVE:  { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', label: '⚫ Inactive'  },
};
const VEHICLE_LABELS = {
  BIKE: 'Bike', LIGHT: 'Light', MEDIUM: 'Medium', HEAVY: 'Heavy',
  EXTRA_HEAVY: 'Extra Heavy', CONTAINER: 'Container',
};
const VEHICLE_STATUS_STYLES = {
  AVAILABLE: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: '🟢 Available' },
  ON_TRIP:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: '🚙 On Trip'  },
  IN_SHOP:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: '🔧 In Shop'  },
};

// ── Modal ────────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2 className="modal-title">{title}</h2>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

// ── Create User Form ─────────────────────────────────────────────────────────────
const CreateUserForm = ({ onSuccess, onClose }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'DISPATCHER', isActive: true });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 3) errs.name = 'Name must be at least 3 characters.';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required.';
    if (!form.password || form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(form.password)) errs.password = 'Password needs one uppercase letter.';
    if (!/[0-9]/.test(form.password)) errs.password = 'Password needs one number.';
    if (!['MANAGER', 'DISPATCHER'].includes(form.role)) errs.role = 'Select MANAGER or DISPATCHER.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await adminCreateUser({ ...form });
      toast.success(`${res.data.user.role} account created! ID: ${res.data.user.employeeId}`);
      onSuccess(); onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create user.';
      const field = err?.response?.data?.field;
      if (field) setErrors((p) => ({ ...p, [field]: msg }));
      else toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="admin-form">
      <div className="form-group">
        <label className="form-label">Full Name</label>
        <input name="name" className={`form-input ${errors.name ? 'error' : ''}`}
          placeholder="John Doe" value={form.name} onChange={handleChange} autoFocus />
        {errors.name && <p className="field-error">⚠ {errors.name}</p>}
      </div>
      <div className="form-group">
        <label className="form-label">Email Address</label>
        <input name="email" type="email" className={`form-input ${errors.email ? 'error' : ''}`}
          placeholder="john@company.com" value={form.email} onChange={handleChange} />
        {errors.email && <p className="field-error">⚠ {errors.email}</p>}
      </div>
      <div className="form-group">
        <label className="form-label">Password</label>
        <input name="password" type="password" className={`form-input ${errors.password ? 'error' : ''}`}
          placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password} onChange={handleChange} />
        {errors.password && <p className="field-error">⚠ {errors.password}</p>}
      </div>
      <div className="form-group">
        <label className="form-label">Role</label>
        <select name="role" className={`form-input form-select ${errors.role ? 'error' : ''}`}
          value={form.role} onChange={handleChange}>
          <option value="DISPATCHER">📡 Dispatcher</option>
          <option value="MANAGER">🎯 Manager</option>
        </select>
        {errors.role && <p className="field-error">⚠ {errors.role}</p>}
      </div>
      <div className="toggle-row">
        <label className="form-label" style={{ marginBottom: 0 }}>Active Status</label>
        <label className="toggle-switch">
          <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
          <span className="toggle-track" />
        </label>
        <span className="toggle-label" style={{ color: form.isActive ? '#10b981' : 'var(--text-muted)' }}>
          {form.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="admin-note"><span>🪪</span> Employee ID is auto-generated.</div>
      <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
        {loading ? <span className="btn-loader"><span className="spinner" /> Creating…</span> : 'Create Account →'}
      </button>
    </form>
  );
};

// ── Reset Password Form ──────────────────────────────────────────────────────────
const ResetPasswordForm = ({ userId, userName, onClose }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password needs 8+ chars, one uppercase, one number.'); return;
    }
    setLoading(true);
    try {
      await adminResetPassword(userId, password);
      toast.success(`Password reset for ${userName}`); onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reset password.');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <p className="modal-desc">Set a new password for <strong>{userName}</strong>.</p>
      <div className="form-group">
        <label className="form-label">New Password</label>
        <input type="password" className={`form-input ${error ? 'error' : ''}`}
          placeholder="Min 8 chars, 1 uppercase, 1 number"
          value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} autoFocus />
        {error && <p className="field-error">⚠ {error}</p>}
      </div>
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? <span className="btn-loader"><span className="spinner" /> Resetting…</span> : 'Reset Password'}
      </button>
    </form>
  );
};

// ── Drivers Tab ──────────────────────────────────────────────────────────────────
const DriversTab = ({ userRole }) => {
  const [drivers, setDrivers]   = useState([]);
  const [stats, setStats]       = useState({ byStatus: {}, byApproval: {} });
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState({ status: '', isApproved: '' });

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.status)    params.status    = filter.status;
      if (filter.isApproved !== '') params.isApproved = filter.isApproved;
      const res = await adminListDrivers(params);
      setDrivers(res.data.data.drivers);
      setStats(res.data.stats || { byStatus: {}, byApproval: {} });
    } catch {
      toast.error('Failed to load drivers.');
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const handleApprove = async (id, current, name) => {
    try {
      await adminApproveDriver(id, !current);
      toast.success(`${name} ${!current ? 'approved ✅' : 'approval revoked'}`);
      fetchDrivers();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to update approval.'); }
  };

  const handleStatus = async (id, status, name) => {
    try {
      await adminUpdateDriverStatus(id, status);
      toast.success(`${name} status → ${status}`);
      fetchDrivers();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to update status.'); }
  };

  const total       = drivers.length;
  const pending     = (stats.byApproval?.['false'] || 0);
  const approved    = (stats.byApproval?.['true']  || 0);
  const available   = (stats.byStatus?.AVAILABLE   || 0);

  return (
    <div>
      <header className="dash-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="dash-header-title">🚗 Driver Management</h1>
          <p className="dash-header-sub">Review applications, approve drivers, manage statuses</p>
        </div>
      </header>

      {/* Stats */}
      <div className="admin-stats-grid">
        <StatCard icon="🚗" label="Total Drivers"  value={total}    color="#6366f1" />
        <StatCard icon="⏳" label="Pending"         value={pending}  color="#f59e0b" />
        <StatCard icon="✅" label="Approved"        value={approved} color="#10b981" />
        <StatCard icon="🟢" label="Available"       value={available} color="#10b981" />
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <select className="filter-select" value={filter.status}
          onChange={(e) => setFilter(p => ({ ...p, status: e.target.value }))}>
          <option value="">All Statuses</option>
          <option value="AVAILABLE">🟢 Available</option>
          <option value="ON_TRIP">🚙 On Trip</option>
          <option value="INACTIVE">⚫ Inactive</option>
        </select>
        <select className="filter-select" value={filter.isApproved}
          onChange={(e) => setFilter(p => ({ ...p, isApproved: e.target.value }))}>
          <option value="">All Approval</option>
          <option value="true">✅ Approved</option>
          <option value="false">⏳ Pending</option>
        </select>
        <button className="filter-reset" onClick={() => setFilter({ status: '', isApproved: '' })}>Reset</button>
      </div>

      {/* Drivers Table */}
      <div className="admin-table-wrapper">
        {loading ? (
          <div className="admin-loading">
            <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            <p>Loading drivers…</p>
          </div>
        ) : drivers.length === 0 ? (
          <div className="admin-empty">
            <span>🚗</span>
            <p>No drivers found. Drivers register via the public registration page.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Driver ID</th>
                <th>Phone</th>
                <th>License</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Approval</th>
                {userRole === 'ADMIN' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => {
                const ss = DRIVER_STATUS_STYLES[d.status] || DRIVER_STATUS_STYLES.INACTIVE;
                return (
                  <tr key={d.id}>
                    <td>
                      <div className="table-user-cell">
                        <div className="table-avatar" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                          {d.name.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()}
                        </div>
                        <div>
                          <p className="table-user-name">{d.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{d.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="emp-id-badge" style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}>{d.driverId}</span></td>
                    <td className="table-email">{d.phoneNumber}</td>
                    <td className="table-email" title={d.licenseNumber}>{d.licenseNumber}</td>
                    <td>
                      <span className="role-pill" style={{ color: '#6366f1', background: 'rgba(99,102,241,0.1)' }}>
                        {VEHICLE_LABELS[d.vehicleCategory] || d.vehicleCategory}
                      </span>
                    </td>
                    <td>
                      {userRole === 'ADMIN' || userRole === 'MANAGER' ? (
                        <select
                          className="role-select"
                          value={d.status}
                          style={{ color: ss.color, borderColor: ss.color + '55' }}
                          onChange={(e) => handleStatus(d.id, e.target.value, d.name)}>
                          <option value="AVAILABLE">🟢 Available</option>
                          <option value="ON_TRIP">🚙 On Trip</option>
                          <option value="INACTIVE">⚫ Inactive</option>
                        </select>
                      ) : (
                        <span className="status-pill active" style={{ color: ss.color, background: ss.bg }}>{ss.label}</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                        color: d.isApproved ? '#10b981' : '#f59e0b',
                        background: d.isApproved ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      }}>
                        {d.isApproved ? '✅ Approved' : '⏳ Pending'}
                      </span>
                    </td>
                    {userRole === 'ADMIN' && (
                      <td>
                        <div className="table-actions">
                          <button
                            className={`action-btn ${d.isApproved ? 'action-btn-reset' : 'action-btn-approve'}`}
                            title={d.isApproved ? 'Revoke approval' : 'Approve driver'}
                            onClick={() => handleApprove(d.id, d.isApproved, d.name)}>
                            {d.isApproved ? '🔒 Revoke' : '✅ Approve'}
                          </button>
                          {d.licensePhotoUrl && (
                            <a href={d.licensePhotoUrl} target="_blank" rel="noreferrer"
                              className="action-btn action-btn-view" title="View license photo">
                              🖼
                            </a>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ── Fleet Tab ────────────────────────────────────────────────────────────────────────
const EVENT_META = {
  CREATED:        { icon: '🏗️', color: '#6366f1', label: 'Vehicle Added' },
  UPDATED:        { icon: '✏️',  color: '#f59e0b', label: 'Details Updated' },
  STATUS_CHANGE:  { icon: '🔄', color: '#8b5cf6', label: 'Status Changed' },
  SERVICE:        { icon: '🔧', color: '#10b981', label: 'Service Done' },
  OIL_CHANGE:     { icon: '🛒', color: '#06b6d4', label: 'Oil Change' },
  TYRE_CHANGE:    { icon: '⚫', color: '#64748b', label: 'Tyre Change' },
  MAINTENANCE:    { icon: '🔩', color: '#f97316', label: 'Maintenance' },
  TRIP_ASSIGNED:  { icon: '🚛', color: '#3b82f6', label: 'Trip Assigned' },
  TRIP_COMPLETED: { icon: '✅', color: '#10b981', label: 'Trip Completed' },
  EXPENSE_ADDED:  { icon: '💸', color: '#ef4444', label: 'Expense Added' },
};

const VehicleDrawer = ({ vehicle, onClose, onStatusChange, userRole }) => {
  const [history, setHistory]       = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [svcForm, setSvcForm]       = useState({ eventType:'SERVICE', title:'', description:'', serviceDate:'', cost:'', performedBy:'' });
  const [svcErrors, setSvcErrors]   = useState({});
  const [svcSaving, setSvcSaving]   = useState(false);
  const [showSvcForm, setShowSvcForm] = useState(false);

  const fetchHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const res = await adminGetVehicleHistory(vehicle.id);
      setHistory(res.data.data);
    } catch { toast.error('Failed to load history.'); }
    finally { setHistLoading(false); }
  }, [vehicle.id]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleSvcChange = (e) => {
    const { name, value } = e.target;
    setSvcForm(p => ({ ...p, [name]: value }));
    if (svcErrors[name]) setSvcErrors(p => ({ ...p, [name]: '' }));
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!svcForm.title.trim())       errs.title       = 'Title required.';
    if (!svcForm.description.trim()) errs.description = 'Description required.';
    if (Object.keys(errs).length)    { setSvcErrors(errs); return; }
    setSvcSaving(true);
    try {
      await adminAddVehicleService(vehicle.id, svcForm);
      toast.success('✅ Service record added!');
      setSvcForm({ eventType:'SERVICE', title:'', description:'', serviceDate:'', cost:'', performedBy:'' });
      setShowSvcForm(false);
      fetchHistory();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to add service record.'); }
    finally { setSvcSaving(false); }
  };

  const ss = VEHICLE_STATUS_STYLES[vehicle.status] || VEHICLE_STATUS_STYLES.AVAILABLE;
  const catIcon = vehicle.category==='BIKE'?'🏔️':vehicle.category==='CONTAINER'?'📦':(vehicle.category==='HEAVY'||vehicle.category==='EXTRA_HEAVY')?'🚛':'🚗';

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000, display:'flex', justifyContent:'flex-end',
      background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width:'min(680px, 100vw)', background:'var(--bg)', overflowY:'auto',
        boxShadow:'-8px 0 40px rgba(0,0,0,0.3)', padding:28, display:'flex', flexDirection:'column', gap:20,
      }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:32 }}>{catIcon}</span>
            <div>
              <h2 style={{ margin:0, fontSize:18, fontWeight:800 }}>{vehicle.vehicle_name}</h2>
              <p style={{ margin:0, fontSize:12, color:'var(--text-secondary)' }}>{vehicle.vehicle_id} • {vehicle.license_plate}</p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ background:'none', border:'1px solid var(--border)', borderRadius:8, padding:'6px 12px', cursor:'pointer', color:'var(--text-secondary)', fontSize:16 }}>
            ✕
          </button>
        </div>

        {/* Info Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          {[[
            '📊 Status',
            <span style={{ color: ss.color, fontWeight:700, fontSize:13 }}>{ss.label}</span>,
          ],[
            '📦 Dimensions',
            <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{vehicle.dimension_label || 'N/A'}</span>,
          ],[
            '⚖️ Capacity',
            <span style={{ fontSize:13 }}>{(vehicle.max_capacity||0).toLocaleString()} kg</span>,
          ],[
            '🛣️ Odometer',
            <span style={{ fontSize:13 }}>{(vehicle.current_odometer||0).toLocaleString()} km</span>,
          ],[
            '💰 Acq. Cost',
            <span style={{ fontSize:13 }}>₹{Number(vehicle.acquisition_cost||0).toLocaleString('en-IN')}</span>,
          ],[
            '🏷️ Category',
            <span style={{ fontSize:13 }}>{VEHICLE_LABELS[vehicle.category]||vehicle.category}</span>,
          ]].map(([lbl, val], i) => (
            <div key={i} style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:12, padding:'10px 14px' }}>
              <p style={{ margin:'0 0 4px', fontSize:11, color:'var(--text-secondary)', fontWeight:600 }}>{lbl}</p>
              <div>{val}</div>
            </div>
          ))}
        </div>

        {/* Status change */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:13, fontWeight:600 }}>Change Status:</span>
          {['AVAILABLE','ON_TRIP','IN_SHOP'].map(s => {
            const m = VEHICLE_STATUS_STYLES[s];
            const active = vehicle.status === s;
            return (
              <button key={s} onClick={() => onStatusChange(vehicle.id, s, vehicle.vehicle_name)}
                style={{
                  padding:'5px 12px', borderRadius:8, border:`1px solid ${m.color}`,
                  background: active ? m.color : 'transparent',
                  color: active ? '#fff' : m.color,
                  fontSize:12, fontWeight:600, cursor:'pointer', opacity: active ? 1 : 0.75,
                }}>
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Add Service Section */}
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h3 style={{ margin:0, fontSize:14, fontWeight:700 }}>🔧 Add Service / Maintenance Record</h3>
            <button className="filter-reset" onClick={() => setShowSvcForm(v => !v)}>{showSvcForm ? 'Cancel' : '+ Add Record'}</button>
          </div>
          {showSvcForm && (
            <form onSubmit={handleAddService} noValidate style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Event Type *</label>
                  <select name="eventType" className="form-input form-select" value={svcForm.eventType} onChange={handleSvcChange}>
                    <option value="SERVICE">🔧 Service</option>
                    <option value="OIL_CHANGE">🛒 Oil Change</option>
                    <option value="TYRE_CHANGE">⚫ Tyre Change</option>
                    <option value="MAINTENANCE">🔩 Maintenance</option>
                    <option value="EXPENSE_ADDED">💸 Expense Added</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Service Date</label>
                  <input name="serviceDate" type="date" className="form-input" value={svcForm.serviceDate} onChange={handleSvcChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input name="title" className={`form-input ${svcErrors.title?'error':''}`}
                  placeholder="e.g. Oil Change at 42000 km" value={svcForm.title} onChange={handleSvcChange} />
                {svcErrors.title && <p className="field-error">⚠ {svcErrors.title}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea name="description" rows={3} className={`form-input ${svcErrors.description?'error':''}`}
                  placeholder="Describe what was done in detail..." value={svcForm.description} onChange={handleSvcChange}
                  style={{ resize:'vertical', minHeight:70 }} />
                {svcErrors.description && <p className="field-error">⚠ {svcErrors.description}</p>}
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Cost (₹)</label>
                  <input name="cost" type="number" min="0" className="form-input" placeholder="e.g. 3500" value={svcForm.cost} onChange={handleSvcChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Performed By</label>
                  <input name="performedBy" className="form-input" placeholder="e.g. Ravi Garage" value={svcForm.performedBy} onChange={handleSvcChange} />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={svcSaving} style={{ alignSelf:'flex-start' }}>
                {svcSaving ? '⏳ Saving…' : '✅ Save Record'}
              </button>
            </form>
          )}
        </div>

        {/* History Timeline */}
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:16 }}>
          <h3 style={{ margin:'0 0 16px', fontSize:14, fontWeight:700 }}>🗓️ Service &amp; History Timeline</h3>
          {histLoading ? (
            <div style={{ textAlign:'center', padding:20 }}><span className="spinner" /> Loading history…</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign:'center', color:'var(--text-secondary)', padding:20 }}>⧁ No history records yet.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {history.map((h, i) => {
                const m = EVENT_META[h.event_type] || EVENT_META.UPDATED;
                return (
                  <div key={h.id} style={{ display:'flex', gap:14, position:'relative' }}>
                    {/* Timeline spine */}
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:32, flexShrink:0 }}>
                      <div style={{
                        width:32, height:32, borderRadius:'50%', background:`${m.color}18`,
                        border:`2px solid ${m.color}`, display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:14, flexShrink:0, zIndex:1,
                      }}>{m.icon}</div>
                      {i < history.length - 1 && <div style={{ width:2, flex:1, background:'var(--border)', minHeight:20 }} />}
                    </div>
                    {/* Content */}
                    <div style={{ paddingBottom:20, flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:4 }}>
                        <span style={{ fontWeight:700, fontSize:13 }}>{h.title}</span>
                        <span style={{ fontSize:11, color:'var(--text-secondary)', whiteSpace:'nowrap' }}>
                          {new Date(h.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                        </span>
                      </div>
                      <span style={{ fontSize:11, color: m.color, fontWeight:600, background:`${m.color}12`, borderRadius:4, padding:'1px 6px', display:'inline-block', marginBottom:4 }}>{m.label}</span>
                      <p style={{ margin:'4px 0 0', fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>{h.description}</p>
                      {(h.cost || h.performed_by || h.service_date) && (
                        <div style={{ display:'flex', gap:12, marginTop:6, flexWrap:'wrap' }}>
                          {h.service_date && <span style={{ fontSize:11, color:'var(--text-secondary)' }}>📅 {new Date(h.service_date).toLocaleDateString('en-IN')}</span>}
                          {h.cost > 0 && <span style={{ fontSize:11, color:'#10b981', fontWeight:600 }}>₹{Number(h.cost).toLocaleString('en-IN')}</span>}
                          {h.performed_by && <span style={{ fontSize:11, color:'var(--text-secondary)' }}>👤 {h.performed_by}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FleetTab = ({ userRole }) => {
  const [vehicles, setVehicles]       = useState([]);
  const [stats, setStats]             = useState({ byStatus: {}, byCategory: {} });
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState({ status: '', category: '' });
  const [showAdd, setShowAdd]         = useState(false);
  const [selectedVehicle, setSelected] = useState(null);
  const [form, setForm]               = useState({
    vehicleName:'', licensePlate:'', category:'LIGHT',
    maxCapacity:'', currentOdometer:'0', acquisitionCost:'',
    lengthFt:'', widthFt:'', heightFt:'',
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]         = useState(false);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.status)   params.status   = filter.status;
      if (filter.category) params.category = filter.category;
      const res = await adminListVehicles(params);
      setVehicles(res.data.data.vehicles);
      setStats(res.data.stats || { byStatus:{}, byCategory:{} });
    } catch { toast.error('Failed to load vehicles.'); }
    finally  { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const handleStatusChange = async (id, status, name) => {
    try {
      await adminUpdateVehicleStatus(id, status);
      toast.success(`${name} → ${status}`);
      // Update selectedVehicle inline
      if (selectedVehicle?.id === id) setSelected(p => ({ ...p, status }));
      fetchVehicles();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed.'); }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (formErrors[name]) setFormErrors(p => ({ ...p, [name]: '' }));
  };

  const validateForm = () => {
    const errs = {};
    if (!form.vehicleName.trim())  errs.vehicleName    = 'Vehicle name is required.';
    if (!form.licensePlate.trim()) errs.licensePlate   = 'License plate is required.';
    if (!form.maxCapacity || parseInt(form.maxCapacity) < 1) errs.maxCapacity = 'Enter a valid capacity (kg).';
    if (!form.acquisitionCost || parseFloat(form.acquisitionCost) < 0) errs.acquisitionCost = 'Enter a valid cost.';
    if (!form.lengthFt || parseFloat(form.lengthFt) <= 0)  errs.lengthFt = 'Length must be > 0.';
    if (!form.widthFt  || parseFloat(form.widthFt)  <= 0)  errs.widthFt  = 'Width must be > 0.';
    if (!form.heightFt || parseFloat(form.heightFt) <= 0)  errs.heightFt = 'Height must be > 0.';
    return errs;
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      const res = await adminCreateVehicle({ ...form, lengthFt:parseFloat(form.lengthFt), widthFt:parseFloat(form.widthFt), heightFt:parseFloat(form.heightFt) });
      toast.success(`✅ ${res.data.vehicle.vehicle_id} added!`);
      setShowAdd(false);
      setForm({ vehicleName:'', licensePlate:'', category:'LIGHT', maxCapacity:'', currentOdometer:'0', acquisitionCost:'', lengthFt:'', widthFt:'', heightFt:'' });
      fetchVehicles();
    } catch (err) {
      const msg   = err?.response?.data?.message || 'Failed to add vehicle.';
      const field = err?.response?.data?.field;
      if (field) setFormErrors(p => ({ ...p, [field]: msg }));
      else toast.error(msg);
    } finally { setSaving(false); }
  };

  const available = stats.byStatus?.AVAILABLE || 0;
  const onTrip   = stats.byStatus?.ON_TRIP    || 0;
  const inShop   = stats.byStatus?.IN_SHOP    || 0;
  const total    = vehicles.length;

  return (
    <div>
      <header className="dash-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="dash-header-title">🚛 Fleet Management</h1>
          <p className="dash-header-sub">Click any row to view history &amp; add service records</p>
        </div>
        {userRole === 'ADMIN' && (
          <button className="btn-create" onClick={() => setShowAdd(v => !v)}>
            {showAdd ? '✕ Cancel' : '+ Add Vehicle'}
          </button>
        )}
      </header>

      <div className="admin-stats-grid">
        <StatCard icon="🚛" label="Total Vehicles" value={total}     color="#6366f1" />
        <StatCard icon="🟢" label="Available"      value={available} color="#10b981" />
        <StatCard icon="🚙" label="On Trip"        value={onTrip}    color="#f59e0b" />
        <StatCard icon="🔧" label="In Shop"        value={inShop}    color="#ef4444" />
      </div>

      {/* Add Vehicle Form */}
      {showAdd && (
        <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:16, padding:24, marginBottom:24 }}>
          <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:700 }}>🚛 Add New Vehicle</h3>
          <form onSubmit={handleAddVehicle} noValidate>
            {/* Row 1 */}
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Vehicle Name *</label>
                <input name="vehicleName" className={`form-input ${formErrors.vehicleName?'error':''}`}
                  placeholder="e.g. Tata Ace EX2" value={form.vehicleName} onChange={handleFormChange} />
                {formErrors.vehicleName && <p className="field-error">⚠ {formErrors.vehicleName}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">License Plate *</label>
                <input name="licensePlate" className={`form-input ${formErrors.licensePlate?'error':''}`}
                  placeholder="e.g. MH-12-AB-1234" value={form.licensePlate} onChange={handleFormChange} />
                {formErrors.licensePlate && <p className="field-error">⚠ {formErrors.licensePlate}</p>}
              </div>
            </div>
            {/* Row 2 */}
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select name="category" className="form-input form-select" value={form.category} onChange={handleFormChange}>
                  <option value="BIKE">🏔️ Bike</option>
                  <option value="LIGHT">🚗 Light</option>
                  <option value="MEDIUM">🚐 Medium</option>
                  <option value="HEAVY">🚛 Heavy</option>
                  <option value="EXTRA_HEAVY">🏗️ Extra Heavy</option>
                  <option value="CONTAINER">📦 Container</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Max Capacity (kg) *</label>
                <input name="maxCapacity" type="number" min="1" className={`form-input ${formErrors.maxCapacity?'error':''}`}
                  placeholder="e.g. 5000" value={form.maxCapacity} onChange={handleFormChange} />
                {formErrors.maxCapacity && <p className="field-error">⚠ {formErrors.maxCapacity}</p>}
              </div>
            </div>
            {/* Row 3 — Cargo Dimensions (Fit Axis) */}
            <p style={{ margin:'8px 0 6px', fontSize:12, fontWeight:700, color:'var(--text-secondary)', letterSpacing:'0.05em', textTransform:'uppercase' }}>📦 Cargo Dimensions (Fit Axis)</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
              <div className="form-group" style={{ margin:0 }}>
                <label className="form-label">Length (ft) *</label>
                <input name="lengthFt" type="number" step="0.1" min="0.1" className={`form-input ${formErrors.lengthFt?'error':''}`}
                  placeholder="e.g. 5.5" value={form.lengthFt} onChange={handleFormChange} />
                {formErrors.lengthFt && <p className="field-error">⚠ {formErrors.lengthFt}</p>}
              </div>
              <div className="form-group" style={{ margin:0 }}>
                <label className="form-label">Width (ft) *</label>
                <input name="widthFt" type="number" step="0.1" min="0.1" className={`form-input ${formErrors.widthFt?'error':''}`}
                  placeholder="e.g. 4.5" value={form.widthFt} onChange={handleFormChange} />
                {formErrors.widthFt && <p className="field-error">⚠ {formErrors.widthFt}</p>}
              </div>
              <div className="form-group" style={{ margin:0 }}>
                <label className="form-label">Height (ft) *</label>
                <input name="heightFt" type="number" step="0.1" min="0.1" className={`form-input ${formErrors.heightFt?'error':''}`}
                  placeholder="e.g. 5.0" value={form.heightFt} onChange={handleFormChange} />
                {formErrors.heightFt && <p className="field-error">⚠ {formErrors.heightFt}</p>}
              </div>
            </div>
            {form.lengthFt && form.widthFt && form.heightFt && parseFloat(form.lengthFt) > 0 && (
              <p style={{ margin:'0 0 12px', fontSize:12, color:'#6366f1', fontWeight:600 }}>
                💫 Dimension Label: {parseFloat(form.lengthFt).toFixed(1)}ft x {parseFloat(form.widthFt).toFixed(1)}ft x {parseFloat(form.heightFt).toFixed(1)}ft
              </p>
            )}
            {/* Row 4 */}
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Current Odometer (km)</label>
                <input name="currentOdometer" type="number" min="0" className="form-input"
                  placeholder="e.g. 12000" value={form.currentOdometer} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Acquisition Cost (₹) *</label>
                <input name="acquisitionCost" type="number" min="0" className={`form-input ${formErrors.acquisitionCost?'error':''}`}
                  placeholder="e.g. 1500000" value={form.acquisitionCost} onChange={handleFormChange} />
                {formErrors.acquisitionCost && <p className="field-error">⚠ {formErrors.acquisitionCost}</p>}
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop:8 }}>
              {saving ? <span className="btn-loader"><span className="spinner" /> Adding…</span> : '✅ Add Vehicle'}
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="admin-filters">
        <select className="filter-select" value={filter.status} onChange={(e)=>setFilter(p=>({...p,status:e.target.value}))}>
          <option value="">All Statuses</option>
          <option value="AVAILABLE">🟢 Available</option>
          <option value="ON_TRIP">🚙 On Trip</option>
          <option value="IN_SHOP">🔧 In Shop</option>
        </select>
        <select className="filter-select" value={filter.category} onChange={(e)=>setFilter(p=>({...p,category:e.target.value}))}>
          <option value="">All Categories</option>
          <option value="BIKE">🏔️ Bike</option>
          <option value="LIGHT">🚗 Light</option>
          <option value="MEDIUM">🚐 Medium</option>
          <option value="HEAVY">🚛 Heavy</option>
          <option value="EXTRA_HEAVY">🏗️ Extra Heavy</option>
          <option value="CONTAINER">📦 Container</option>
        </select>
        <button className="filter-reset" onClick={()=>setFilter({status:'',category:''})}>Reset</button>
        <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text-secondary)' }}>👆 Click a row to view details &amp; history</span>
      </div>

      {/* Vehicles Table */}
      <div className="admin-table-wrapper">
        {loading ? (
          <div className="admin-loading">
            <span className="spinner" style={{width:32,height:32,borderWidth:3}} /><p>Loading fleet…</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="admin-empty"><span>🚛</span><p>No vehicles found.</p></div>
        ) : (
          <table className="admin-table">
            <thead><tr>
              <th>Vehicle</th><th>ID</th><th>License Plate</th>
              <th>Category</th><th>Capacity</th><th>Dimensions</th><th>Status</th>
            </tr></thead>
            <tbody>
              {vehicles.map((v) => {
                const ss = VEHICLE_STATUS_STYLES[v.status] || VEHICLE_STATUS_STYLES.AVAILABLE;
                const icon = v.category==='BIKE'?'🏔️':v.category==='CONTAINER'?'📦':(v.category==='HEAVY'||v.category==='EXTRA_HEAVY')?'🚛':'🚗';
                return (
                  <tr key={v.id} onClick={() => setSelected(v)}
                    style={{ cursor:'pointer', transition:'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--hover-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background=''}>
                    <td>
                      <div className="table-user-cell">
                        <div className="table-avatar" style={{background:'rgba(99,102,241,0.15)',color:'#6366f1',fontSize:18}}>{icon}</div>
                        <p className="table-user-name" style={{fontSize:13}}>{v.vehicle_name}</p>
                      </div>
                    </td>
                    <td><span className="emp-id-badge" style={{color:'#6366f1',borderColor:'rgba(99,102,241,0.3)'}}>{v.vehicle_id}</span></td>
                    <td className="table-email">{v.license_plate}</td>
                    <td><span className="role-pill" style={{color:'#8b5cf6',background:'rgba(139,92,246,0.1)'}}>{VEHICLE_LABELS[v.category]||v.category}</span></td>
                    <td style={{fontSize:13}}>{(v.max_capacity||0).toLocaleString()} kg</td>
                    <td style={{fontSize:12,color:'var(--text-secondary)'}}>{v.dimension_label || <span style={{opacity:0.4}}>N/A</span>}</td>
                    <td>
                      <span style={{ color:ss.color, fontWeight:600, fontSize:12, background:`${ss.color}15`, borderRadius:6, padding:'3px 8px' }}>
                        {ss.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Vehicle Detail Drawer */}
      {selectedVehicle && (
        <VehicleDrawer
          vehicle={selectedVehicle}
          userRole={userRole}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

// ── Main Admin Page ──────────────────────────────────────────────────────────────
const AdminPage = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]   = useState('users');  // 'users' | 'drivers' | 'fleet'
  const [users, setUsers]           = useState([]);
  const [stats, setStats]           = useState({});
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState({ role: '', isActive: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Access denied. Admin only.');
      navigate('/dashboard', { replace: true });
    }
  }, [isAdmin, navigate]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.role)     params.role = filter.role;
      if (filter.isActive !== '') params.isActive = filter.isActive;
      const res = await adminListUsers(params);
      setUsers(res.data.data.users);
      setStats(res.data.stats || {});
    } catch { toast.error('Failed to load users.'); }
    finally  { setLoading(false); }
  }, [filter]);

  useEffect(() => { if (isAdmin) fetchUsers(); }, [fetchUsers, isAdmin]);

  const handleRoleChange = async (userId, currentRole, newRole) => {
    if (currentRole === newRole) return;
    try {
      await adminUpdateRole(userId, newRole);
      toast.success(`Role updated to ${newRole}`); fetchUsers();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed.'); }
  };

  const handleStatusToggle = async (userId, currentStatus, name) => {
    try {
      await adminUpdateStatus(userId, !currentStatus);
      toast.success(`${name} ${!currentStatus ? 'activated' : 'deactivated'}`); fetchUsers();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed.'); }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out.');
    navigate('/login', { replace: true });
  };

  if (!isAdmin) return null;

  const totalUsers = (stats.ADMIN || 0) + (stats.MANAGER || 0) + (stats.DISPATCHER || 0);

  return (
    <div className="dash-page">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">🚛</span>
          <span className="sidebar-brand-name">FleetOS</span>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            {user?.name?.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user?.name}</p>
            <span className="sidebar-role-badge" style={{ color:'#f59e0b', background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)' }}>
              👑 Administrator
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-nav-label">ADMIN TOOLS</p>
          <button
            className={`sidebar-nav-item ${activeTab === 'users' ? 'sidebar-nav-active' : ''}`}
            onClick={() => setActiveTab('users')}>
            <span className="sidebar-nav-icon">👥</span><span>User Management</span>
          </button>
          <button
            className={`sidebar-nav-item ${activeTab === 'drivers' ? 'sidebar-nav-active' : ''}`}
            onClick={() => setActiveTab('drivers')}>
            <span className="sidebar-nav-icon">🚗</span><span>Driver Management</span>
          </button>
          <button
            className={`sidebar-nav-item ${activeTab === 'fleet' ? 'sidebar-nav-active' : ''}`}
            onClick={() => setActiveTab('fleet')}>
            <span className="sidebar-nav-icon">🚛</span><span>Fleet Vehicles</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => navigate('/dashboard')}>
            <span className="sidebar-nav-icon">📊</span><span>Overview</span>
          </button>
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <span>⏻</span> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="dash-main">
        {/* ── Users Tab ─────────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <>
            <header className="dash-header">
              <div>
                <h1 className="dash-header-title">👥 User Management</h1>
                <p className="dash-header-sub">Create, manage, and monitor all fleet personnel</p>
              </div>
              <button className="btn-create" onClick={() => setShowCreate(true)}>+ New User</button>
            </header>

            <div className="admin-stats-grid">
              <StatCard icon="👥" label="Total Users"  value={totalUsers}           color="#6366f1" />
              <StatCard icon="👑" label="Admins"        value={stats.ADMIN || 0}     color="#f59e0b" />
              <StatCard icon="🎯" label="Managers"      value={stats.MANAGER || 0}   color="#6366f1" />
              <StatCard icon="📡" label="Dispatchers"   value={stats.DISPATCHER || 0} color="#10b981" />
            </div>

            <div className="admin-filters">
              <select className="filter-select" value={filter.role}
                onChange={(e) => setFilter(p => ({ ...p, role: e.target.value }))}>
                <option value="">All Roles</option>
                <option value="ADMIN">👑 Admin</option>
                <option value="MANAGER">🎯 Manager</option>
                <option value="DISPATCHER">📡 Dispatcher</option>
              </select>
              <select className="filter-select" value={filter.isActive}
                onChange={(e) => setFilter(p => ({ ...p, isActive: e.target.value }))}>
                <option value="">All Statuses</option>
                <option value="true">🟢 Active</option>
                <option value="false">🔴 Inactive</option>
              </select>
              <button className="filter-reset" onClick={() => setFilter({ role: '', isActive: '' })}>Reset</button>
            </div>

            <div className="admin-table-wrapper">
              {loading ? (
                <div className="admin-loading">
                  <span className="spinner" style={{ width:32, height:32, borderWidth:3 }} />
                  <p>Loading users…</p>
                </div>
              ) : users.length === 0 ? (
                <div className="admin-empty"><span>👥</span><p>No users found.</p></div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Employee</th><th>Employee ID</th><th>Email</th><th>Role</th>
                      <th>Status</th><th>Joined</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const rs = ROLE_STYLES[u.role];
                      const isCurrentUser = u.id === user?.id;
                      return (
                        <tr key={u.id} className={isCurrentUser ? 'table-row-self' : ''}>
                          <td>
                            <div className="table-user-cell">
                              <div className="table-avatar" style={{ background: rs.bg, color: rs.color }}>
                                {u.name.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()}
                              </div>
                              <div>
                                <p className="table-user-name">
                                  {u.name} {isCurrentUser && <span className="self-badge">You</span>}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td><span className="emp-id-badge">{u.employeeId}</span></td>
                          <td className="table-email">{u.email}</td>
                          <td>
                            {u.role === 'ADMIN' ? (
                              <span className="role-pill" style={{ color: rs.color, background: rs.bg }}>
                                {rs.icon} {u.role}
                              </span>
                            ) : (
                              <select className="role-select" value={u.role}
                                style={{ color: rs.color, borderColor: rs.color + '55' }}
                                onChange={(e) => handleRoleChange(u.id, u.role, e.target.value)}>
                                <option value="MANAGER">🎯 MANAGER</option>
                                <option value="DISPATCHER">📡 DISPATCHER</option>
                              </select>
                            )}
                          </td>
                          <td>
                            {u.role === 'ADMIN' ? (
                              <span className="status-pill active">🟢 Active</span>
                            ) : (
                              <button
                                className={`status-pill ${u.isActive ? 'active' : 'inactive'}`}
                                onClick={() => handleStatusToggle(u.id, u.isActive, u.name)}>
                                {u.isActive ? '🟢 Active' : '🔴 Inactive'}
                              </button>
                            )}
                          </td>
                          <td className="table-date">
                            {new Date(u.createdAt).toLocaleDateString('en-IN')}
                          </td>
                          <td>
                            <div className="table-actions">
                              {u.role !== 'ADMIN' && (
                                <button className="action-btn action-btn-reset" title="Reset Password"
                                  onClick={() => setResetTarget({ id: u.id, name: u.name })}>
                                  🔑
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ── Drivers Tab ───────────────────────────────────────────────────── */}
        {activeTab === 'drivers' && <DriversTab userRole={user?.role} />}

        {/* ── Fleet Tab ─────────────────────────────────────────────────────── */}
        {activeTab === 'fleet' && <FleetTab userRole={user?.role} />}
      </main>

      {/* Modals */}
      {showCreate && (
        <Modal title="Create New User" onClose={() => setShowCreate(false)}>
          <CreateUserForm onSuccess={fetchUsers} onClose={() => setShowCreate(false)} />
        </Modal>
      )}
      {resetTarget && (
        <Modal title="Reset Password" onClose={() => setResetTarget(null)}>
          <ResetPasswordForm userId={resetTarget.id} userName={resetTarget.name} onClose={() => setResetTarget(null)} />
        </Modal>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card" style={{ borderColor: color + '33' }}>
    <span className="stat-icon" style={{ background: color + '18', color }}>{icon}</span>
    <div>
      <p className="stat-value" style={{ color }}>{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  </div>
);

export default AdminPage;
