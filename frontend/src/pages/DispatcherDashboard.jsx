import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const DispatcherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out.');
    navigate('/login', { replace: true });
  };

  if (!user) return null;
  const initials = user.name?.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();

  return (
    <div className="dash-page">
      <aside className="dash-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">🚛</span>
          <span className="sidebar-brand-name">FleetOS</span>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>{initials}</div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user.name}</p>
            <span className="sidebar-role-badge" style={{ color:'#34d399', background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)' }}>
              📡 Dispatcher
            </span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <p className="sidebar-nav-label">DISPATCH TOOLS</p>
          <button className="sidebar-nav-item sidebar-nav-active">
            <span className="sidebar-nav-icon">📊</span><span>Dashboard</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => navigate('/vehicles')}>
            <span className="sidebar-nav-icon">🚛</span><span>Vehicle Registry</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => navigate('/dispatch')}>
            <span className="sidebar-nav-icon">🗺️</span><span>Dispatch</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => navigate('/driver/register')}>
            <span className="sidebar-nav-icon">🚗</span><span>Register Driver</span>
          </button>
        </nav>
        <button className="sidebar-logout" onClick={handleLogout}><span>⏻</span> Sign Out</button>
      </aside>

      <main className="dash-main">
        <header className="dash-header">
          <div className="dash-header-role-dispatcher">
            <h1 className="dash-header-title">📡 Dispatcher Dashboard</h1>
            <p className="dash-header-sub">Welcome, {user.name}! Manage dispatches and driver assignments.</p>
          </div>
          <div className="dash-header-badge" style={{ color:'#34d399', background:'rgba(16,185,129,0.1)' }}>
            🆔 {user.employeeId}
          </div>
        </header>

        {/* Quick info */}
        <div className="dash-info-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 28 }}>
          <InfoCard icon="🪪" label="Employee ID" value={user.employeeId}  accent="#10b981" />
          <InfoCard icon="✉"  label="Email"        value={user.email}       accent="#10b981" />
          <InfoCard icon="📡" label="Role"          value="Dispatcher"       accent="#10b981" />
        </div>

        <section className="dash-modules">
          <h2 className="dash-section-title">Dispatch Operations</h2>
          <div className="dash-modules-grid">
            <div className="module-card" onClick={() => navigate('/dispatch')}>
              <div className="module-card-icon" style={{ background:'rgba(16,185,129,0.1)', color:'#10b981' }}>🗺️</div>
              <h3 className="module-card-title">Active Dispatches</h3>
              <p className="module-card-desc">View and manage current driver assignments and trip status.</p>
              <span className="module-card-arrow" style={{ color:'#10b981' }}>→</span>
            </div>
            <div className="module-card" onClick={() => navigate('/vehicles')}>
              <div className="module-card-icon" style={{ background:'rgba(99,102,241,0.1)', color:'#6366f1' }}>🚛</div>
              <h3 className="module-card-title">Vehicle Registry</h3>
              <p className="module-card-desc">View fleet vehicles, check availability and track asset status.</p>
              <span className="module-card-arrow" style={{ color:'#6366f1' }}>→</span>
            </div>
            <div className="module-card" onClick={() => toast('Trip history — coming soon!', { icon: '📋' })}>
              <div className="module-card-icon" style={{ background:'rgba(245,158,11,0.1)', color:'#f59e0b' }}>📋</div>
              <h3 className="module-card-title">Trip History</h3>
              <p className="module-card-desc">Review all completed trips and delivery records.</p>
              <span className="module-card-arrow" style={{ color:'#f59e0b' }}>→</span>
            </div>
            <div className="module-card" onClick={() => navigate('/driver/register')}>
              <div className="module-card-icon" style={{ background:'rgba(245,158,11,0.1)', color:'#f59e0b' }}>🚗</div>
              <h3 className="module-card-title">Register Driver</h3>
              <p className="module-card-desc">Direct a new driver to the registration form for fleet enrollment.</p>
              <span className="module-card-arrow" style={{ color:'#f59e0b' }}>→</span>
            </div>
          </div>
        </section>

        {/* Limited access notice */}
        <div className="access-notice" style={{ borderColor:'rgba(16,185,129,0.2)', background:'rgba(16,185,129,0.05)' }}>
          <span>ℹ️</span>
          <div>
            <p className="access-notice-title" style={{ color:'#34d399' }}>Dispatcher Access Level</p>
            <p className="access-notice-text">
              You have access to dispatch operations. Your Employee ID is <strong>{user.employeeId}</strong>.
              Contact your Manager for elevated permissions or driver management access.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

const InfoCard = ({ icon, label, value, accent }) => (
  <div className="info-card">
    <span className="info-card-icon" style={{ color: accent }}>{icon}</span>
    <div style={{ minWidth: 0 }}>
      <p className="info-card-label">{label}</p>
      <p className="info-card-value" title={value}>{value || '—'}</p>
    </div>
  </div>
);

export default DispatcherDashboard;
