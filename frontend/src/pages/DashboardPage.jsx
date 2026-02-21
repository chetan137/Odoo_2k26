import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ROLE_CONFIG = {
  ADMIN: {
    icon: '👑', label: 'Administrator',
    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    modules: [
      { icon: '👥', title: 'User Management',  desc: 'Create, promote, deactivate accounts',   path: '/admin' },
      { icon: '🚗', title: 'Driver Management', desc: 'Approve drivers and manage their status', path: '/admin', tab: 'drivers' },
      { icon: '📊', title: 'System Overview',   desc: 'Platform-wide statistics and audit logs',path: '/dashboard' },
    ],
  },
  MANAGER: {
    icon: '🎯', label: 'Manager',
    color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    modules: [
      { icon: '🚛', title: 'Vehicle Registry',  desc: 'Manage fleet vehicles and assignments', path: '/vehicles' },
      { icon: '🔧', title: 'Maintenance',       desc: 'Schedule and track maintenance tasks',  path: '/maintenance' },
      { icon: '💰', title: 'Expense Tracker',   desc: 'Monitor fleet operating expenses',      path: '/expenses' },
      { icon: '📈', title: 'Analytics',         desc: 'Fleet performance and KPI dashboard',   path: '/analytics' },
      { icon: '🚗', title: 'Driver Overview',   desc: 'View and manage driver statuses',       path: '/admin', tab: 'drivers' },
    ],
  },
  DISPATCHER: {
    icon: '📡', label: 'Dispatcher',
    color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    modules: [
      { icon: '🗺️', title: 'Dispatch Module', desc: 'Assign and manage active dispatches',  path: '/dispatch' },
      { icon: '📋', title: 'My Overview',     desc: 'Your assigned tasks and status board', path: '/dashboard' },
    ],
  },
};

const getInitials = (name = '') => name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
const formatDate  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
const getGreeting = () => { const h = new Date().getHours(); return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'; };

const DashboardPage = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect to role-specific dashboard if not already there
  React.useEffect(() => {
    if (user?.role === 'ADMIN')       navigate('/admin',                { replace: true });
    else if (user?.role === 'MANAGER')    navigate('/manager/dashboard',     { replace: true });
    else if (user?.role === 'DISPATCHER') navigate('/dispatcher/dashboard',  { replace: true });
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully.');
    navigate('/login', { replace: true });
  };

  const config = ROLE_CONFIG[user?.role] || ROLE_CONFIG.DISPATCHER;

  return (
    <div className="dash-page">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">🚛</span>
          <span className="sidebar-brand-name">FleetOS</span>
        </div>

        {/* User card */}
        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ background: config.gradient }}>
            {getInitials(user?.name)}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user?.name}</p>
            <span className="sidebar-role-badge" style={{ color: config.color, background: config.bg, border: `1px solid ${config.border}` }}>
              {config.icon} {config.label}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <p className="sidebar-nav-label">MODULES</p>
          {config.modules.map((m) => (
            <button
              key={m.path}
              className="sidebar-nav-item"
              onClick={() => m.path !== '/dashboard' && m.path !== window.location.pathname
                ? toast(`${m.title} module — coming soon!`, { icon: m.icon })
                : null}
            >
              <span className="sidebar-nav-icon">{m.icon}</span>
              <span>{m.title}</span>
            </button>
          ))}

          {isAdmin && (
            <>
              <p className="sidebar-nav-label" style={{ marginTop: '16px' }}>ADMIN</p>
              <button className="sidebar-nav-item sidebar-nav-admin" onClick={() => navigate('/admin')}>
                <span className="sidebar-nav-icon">👥</span>
                <span>User Management</span>
              </button>
            </>
          )}
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <span>⏻</span> Sign Out
        </button>
      </aside>

      {/* Main */}
      <main className="dash-main">
        {/* Header */}
        <header className="dash-header">
          <div>
            <h1 className="dash-header-title">
              Good {getGreeting()}, {user?.name?.split(' ')[0]} {config.icon}
            </h1>
            <p className="dash-header-sub">Fleet Management Dashboard</p>
          </div>
          <div className="dash-header-badge" style={{ color: config.color, background: config.bg, border: `1px solid ${config.border}` }}>
            {config.icon} {config.label}
          </div>
        </header>

        {/* Info Cards */}
        <div className="dash-info-grid">
          <InfoCard icon="🪪" label="Employee ID" value={user?.employeeId || '—'} accent={config.color} />
          <InfoCard icon="✉"  label="Email"       value={user?.email}              accent={config.color} />
          <InfoCard icon="🎭" label="Role"         value={config.label}             accent={config.color} />
          <InfoCard icon="🟢" label="Status"       value={user?.isActive ? 'Active' : 'Inactive'} accent={user?.isActive ? '#10b981' : '#ef4444'} />
          <InfoCard icon="🗓" label="Member Since" value={formatDate(user?.createdAt)} accent={config.color} />
        </div>

        {/* Access Modules */}
        <section className="dash-modules">
          <h2 className="dash-section-title">Your Access Modules</h2>
          <div className="dash-modules-grid">
            {config.modules.map((m) => (
              <div key={m.path} className="module-card" onClick={() =>
                m.path !== '/dashboard'
                  ? toast(`${m.title} module — coming soon!`, { icon: m.icon })
                  : null
              }>
                <div className="module-card-icon" style={{ background: config.bg, border: `1px solid ${config.border}`, color: config.color }}>
                  {m.icon}
                </div>
                <h3 className="module-card-title">{m.title}</h3>
                <p className="module-card-desc">{m.desc}</p>
                <span className="module-card-arrow">→</span>
              </div>
            ))}
          </div>
        </section>

        {/* Register as Driver — PUBLIC action available to all system roles */}
        <section className="dash-modules" style={{ marginTop: 8 }}>
          <h2 className="dash-section-title">Driver Operations</h2>
          <div className="dash-modules-grid">
            <div className="module-card" onClick={() => navigate('/driver/register')}>
              <div className="module-card-icon" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}>
                🚗
              </div>
              <h3 className="module-card-title">Register a Driver</h3>
              <p className="module-card-desc">Send a driver to the registration page to join the fleet. Post-submission requires admin approval.</p>
              <span className="module-card-arrow" style={{ color: '#10b981' }}>→</span>
            </div>
            <div className="module-card" onClick={() => navigate('/driver/login')}>
              <div className="module-card-icon" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}>
                🔑
              </div>
              <h3 className="module-card-title">Driver Login Portal</h3>
              <p className="module-card-desc">Approved drivers can sign in here to access their dispatch dashboard.</p>
              <span className="module-card-arrow" style={{ color: '#f59e0b' }}>→</span>
            </div>
          </div>
        </section>

        {/* Access Restriction Notice */}
        {user?.role === 'DISPATCHER' && (
          <div className="access-notice">
            <span>ℹ️</span>
            <div>
              <p className="access-notice-title">Limited Access Mode</p>
              <p className="access-notice-text">As a Dispatcher, you have access to the Dispatch module and your personal overview. Contact your Manager or Administrator to request elevated access.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const InfoCard = ({ icon, label, value, accent }) => (
  <div className="info-card">
    <span className="info-card-icon" style={{ color: accent }}>{icon}</span>
    <div>
      <p className="info-card-label">{label}</p>
      <p className="info-card-value">{value || '—'}</p>
    </div>
  </div>
);

// getGreeting is defined at the top of the file

export default DashboardPage;
