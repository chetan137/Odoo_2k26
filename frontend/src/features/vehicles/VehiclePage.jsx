import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { fetchVehicles, createVehicle, retireVehicle } from './vehicleService';
import VehicleForm  from './VehicleForm';
import VehicleTable from './VehicleTable';

const VehiclePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const canWrite = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [vehicles, setVehicles]     = useState([]);
  const [stats, setStats]           = useState({});
  const [search, setSearch]         = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading]       = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // ── Fetch vehicles ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)         params.search   = search;
      if (categoryFilter) params.category = categoryFilter;

      const res = await fetchVehicles(params);
      if (res.data.success) {
        setVehicles(res.data.data.vehicles);
        setStats(res.data.stats);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => { load(); }, [load]);

  // ── Create handler ──────────────────────────────────────────────────────────
  const handleCreate = async (data) => {
    setSubmitLoading(true);
    try {
      const res = await createVehicle(data);
      if (res.data.success) {
        toast.success(res.data.message);
        load(); // refresh
        return true;
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to register vehicle.';
      toast.error(msg);
      return false;
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Retire handler ──────────────────────────────────────────────────────────
  const handleRetire = async (id) => {
    try {
      const res = await retireVehicle(id);
      if (res.data.success) {
        toast.success(res.data.message);
        load();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to retire vehicle.');
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

  // Role-based accent
  const ROLE_ACCENT = { ADMIN: '#f59e0b', MANAGER: '#6366f1', DISPATCHER: '#10b981' };
  const accent = ROLE_ACCENT[user.role] || '#6366f1';

  // Back link per role
  const backPath = user.role === 'ADMIN'
    ? '/admin'
    : user.role === 'MANAGER'
      ? '/manager/dashboard'
      : '/dispatcher/dashboard';

  return (
    <div className="dash-page">
      {/* ── Sidebar ────────────────────────────────────────────────────────────── */}
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
            <span
              className="sidebar-role-badge"
              style={{ color: accent, background: `${accent}1a`, border: `1px solid ${accent}4d` }}
            >
              {user.role === 'ADMIN' ? '👑' : user.role === 'MANAGER' ? '🎯' : '📡'} {user.role}
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-nav-label">VEHICLE REGISTRY</p>
          <button className="sidebar-nav-item sidebar-nav-active">
            <span className="sidebar-nav-icon">🚛</span><span>All Vehicles</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => navigate(backPath)}>
            <span className="sidebar-nav-icon">←</span><span>Back to Dashboard</span>
          </button>
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <span>⏻</span> Sign Out
        </button>
      </aside>

      {/* ── Main Content ───────────────────────────────────────────────────────── */}
      <main className="dash-main">
        <header className="dash-header">
          <div>
            <h1 className="dash-header-title">🚛 Vehicle Registry</h1>
            <p className="dash-header-sub">
              {canWrite
                ? 'Register, track and manage your fleet assets.'
                : 'View fleet vehicle inventory (read-only).'}
            </p>
          </div>
          <div className="dash-header-badge" style={{ color: accent, background: `${accent}1a` }}>
            🆔 {user.employeeId}
          </div>
        </header>

        {/* ── Two-Column Layout — Form (left) + Table (right) ───────────────── */}
        <div className="veh-layout">
          {/* Left — only show form to writers */}
          {canWrite && (
            <div className="veh-layout-left">
              <VehicleForm onSubmit={handleCreate} loading={submitLoading} />
            </div>
          )}

          {/* Right — always visible */}
          <div className={canWrite ? 'veh-layout-right' : 'veh-layout-full'}>
            <VehicleTable
              vehicles={vehicles}
              stats={stats}
              search={search}
              onSearchChange={setSearch}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              onRetire={handleRetire}
              canWrite={canWrite}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default VehiclePage;
