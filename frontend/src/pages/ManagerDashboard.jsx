import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../services/api';

const ManagerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const modules = [
    { icon: '🚛', title: 'Vehicle Registry',  desc: 'Manage fleet vehicles & assignments', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { icon: '🔧', title: 'Maintenance',       desc: 'Schedule & track maintenance tasks', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { icon: '💰', title: 'Expense Tracker',   desc: 'Monitor fleet operating expenses',   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { icon: '📈', title: 'Analytics',         desc: 'Fleet performance & KPI insights',   color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  ];

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
          <div className="sidebar-avatar" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>{initials}</div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user.name}</p>
            <span className="sidebar-role-badge" style={{ color:'#818cf8', background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.3)' }}>
              🎯 Manager
            </span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <p className="sidebar-nav-label">MANAGER TOOLS</p>
          <button className="sidebar-nav-item sidebar-nav-active">
            <span className="sidebar-nav-icon">📊</span><span>Dashboard</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => navigate('/admin')}>
            <span className="sidebar-nav-icon">🚗</span><span>Driver Overview</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => navigate('/vehicles')}>
            <span className="sidebar-nav-icon">🚛</span><span>Vehicle Registry</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => navigate('/driver/register')}>
            <span className="sidebar-nav-icon">✚</span><span>Register Driver</span>
          </button>
        </nav>
        <button className="sidebar-logout" onClick={handleLogout}><span>⏻</span> Sign Out</button>
      </aside>

      <main className="dash-main">
        <header className="dash-header">
          <div className="dash-header-role-manager">
            <h1 className="dash-header-title">🎯 Manager Dashboard</h1>
            <p className="dash-header-sub">Good day, {user.name}! Manage your fleet operations below.</p>
          </div>
          <div className="dash-header-badge" style={{ color:'#818cf8', background:'rgba(99,102,241,0.1)' }}>
            🆔 {user.employeeId}
          </div>
        </header>

        {/* Quick info */}
        <div className="dash-info-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 28 }}>
          <InfoCard icon="🪪" label="Employee ID" value={user.employeeId}   accent="#6366f1" />
          <InfoCard icon="✉"  label="Email"        value={user.email}        accent="#6366f1" />
          <InfoCard icon="🎯" label="Role"          value="Manager"           accent="#6366f1" />
        </div>

        <section className="dash-modules">
          <h2 className="dash-section-title">Fleet Modules</h2>
          <div className="dash-modules-grid">
            {modules.map((m) => (
              <div key={m.title} className="module-card"
                onClick={() => m.title === 'Vehicle Registry' ? navigate('/vehicles') : toast(`${m.title} — coming soon!`, { icon: m.icon })}>
                <div className="module-card-icon" style={{ background: m.bg, color: m.color }}>{m.icon}</div>
                <h3 className="module-card-title">{m.title}</h3>
                <p className="module-card-desc">{m.desc}</p>
                <span className="module-card-arrow" style={{ color: m.color }}>→</span>
              </div>
            ))}
          </div>
        </section>

        {/* Driver Operations */}
        <section className="dash-modules" style={{ marginTop: 8 }}>
          <h2 className="dash-section-title">Driver Operations</h2>
          <div className="dash-modules-grid">
            <div className="module-card" onClick={() => navigate('/admin')}>
              <div className="module-card-icon" style={{ background:'rgba(16,185,129,0.1)', color:'#10b981' }}>🚗</div>
              <h3 className="module-card-title">Manage Drivers</h3>
              <p className="module-card-desc">View driver statuses, update assignments, and manage the fleet.</p>
              <span className="module-card-arrow" style={{ color:'#10b981' }}>→</span>
            </div>
            <div className="module-card" onClick={() => navigate('/driver/register')}>
              <div className="module-card-icon" style={{ background:'rgba(245,158,11,0.1)', color:'#f59e0b' }}>✚</div>
              <h3 className="module-card-title">Register a Driver</h3>
              <p className="module-card-desc">Send a new driver to registration. They'll get a DRV-XXXX ID on submission.</p>
              <span className="module-card-arrow" style={{ color:'#f59e0b' }}>→</span>
            </div>
          </div>
        </section>

        {/* Create DISPATCHER */}
        <div className="access-notice" style={{ borderColor:'rgba(99,102,241,0.2)', background:'rgba(99,102,241,0.06)' }}>
          <span>💡</span>
          <div>
            <p className="access-notice-title" style={{ color:'#818cf8' }}>Manager Permissions</p>
            <p className="access-notice-text">You can create Dispatcher accounts from the Admin panel. Driver approvals require an Administrator.</p>
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

export default ManagerDashboard;
