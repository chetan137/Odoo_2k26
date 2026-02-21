import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  adminListUsers, adminCreateUser,
  adminUpdateRole, adminUpdateStatus, adminResetPassword,
  adminListDrivers, adminApproveDriver, adminUpdateDriverStatus,
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
  LIGHT: 'Light', MEDIUM: 'Medium', HEAVY: 'Heavy', EXTRA_HEAVY: 'Extra Heavy',
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

// ── Main Admin Page ──────────────────────────────────────────────────────────────
const AdminPage = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]   = useState('users');  // 'users' | 'drivers'
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
          <button className="sidebar-nav-item" onClick={() => navigate('/dashboard')}>
            <span className="sidebar-nav-icon">📊</span><span>Overview</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => navigate('/vehicles')}>
            <span className="sidebar-nav-icon">🚛</span><span>Vehicle Registry</span>
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
