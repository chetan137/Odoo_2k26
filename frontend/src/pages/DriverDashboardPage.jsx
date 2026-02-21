import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logoutDriver } from '../services/api';

const STATUS_CONFIG = {
  AVAILABLE:  { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '🟢', label: 'Available' },
  ON_TRIP:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: '🔴', label: 'On Trip' },
  INACTIVE:   { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: '⚫', label: 'Inactive' },
};

const VEHICLE_LABELS = {
  LIGHT:       '🚗 Light Vehicle',
  MEDIUM:      '🚐 Medium Vehicle',
  HEAVY:       '🚛 Heavy Vehicle',
  EXTRA_HEAVY: '🏗️ Extra Heavy',
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

const DriverDashboardPage = () => {
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('driverUser');
    if (!stored) {
      toast.error('Please log in as a driver first.');
      navigate('/login', { replace: true });
      return;
    }
    setDriver(JSON.parse(stored));
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logoutDriver();
    } catch {
      // cookie clear may fail silently — still clear localStorage
    }
    localStorage.removeItem('driverUser');
    localStorage.removeItem('driverToken');
    toast.success('Signed out successfully.');
    navigate('/login', { replace: true });
  };

  if (!driver) return null;

  const sc = STATUS_CONFIG[driver.status] || STATUS_CONFIG.AVAILABLE;
  const initials = driver.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

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
            {initials}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{driver.name}</p>
            <span className="sidebar-role-badge" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
              🚗 Driver
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-nav-label">DRIVER TOOLS</p>
          <button className="sidebar-nav-item sidebar-nav-active">
            <span className="sidebar-nav-icon">📊</span><span>My Overview</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => toast('Trip management — coming soon!', { icon: '🗺️' })}>
            <span className="sidebar-nav-icon">🗺️</span><span>My Trips</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => toast('Profile editing — coming soon!', { icon: '👤' })}>
            <span className="sidebar-nav-icon">👤</span><span>My Profile</span>
          </button>
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <span>⏻</span> Sign Out
        </button>
      </aside>

      {/* Main */}
      <main className="dash-main">
        <header className="dash-header">
          <div>
            <h1 className="dash-header-title">🚗 Driver Dashboard</h1>
            <p className="dash-header-sub">Welcome back, {driver.name}! Ready to roll?</p>
          </div>
          <div className="dash-header-badge" style={{ color: sc.color, background: sc.bg }}>
            {sc.icon} {sc.label}
          </div>
        </header>

        {/* Approval check */}
        {!driver.isApproved && (
          <div className="alert alert-warning" style={{ marginBottom: 24 }}>
            <span>⏳</span>
            <div>
              <p style={{ fontWeight: 700, color: '#fcd34d', marginBottom: 4 }}>Account Pending Approval</p>
              <p style={{ color: 'var(--text-secondary)' }}>An Administrator is reviewing your application. You'll be notified once approved.</p>
            </div>
          </div>
        )}

        {/* Driver Info Cards */}
        <div className="dash-info-grid">
          <InfoCard icon="🪪" label="Driver ID"         value={driver.driverId}                   accent="#f59e0b" />
          <InfoCard icon="✉"  label="Email"             value={driver.email}                       accent="#f59e0b" />
          <InfoCard icon="📞" label="Phone"             value={driver.phoneNumber}                 accent="#f59e0b" />
          <InfoCard icon="🪪" label="License Number"    value={driver.licenseNumber}               accent="#f59e0b" />
          <InfoCard icon="🚗" label="Vehicle Category"  value={VEHICLE_LABELS[driver.vehicleCategory] || driver.vehicleCategory} accent="#f59e0b" />
          <InfoCard icon="📅" label="Experience"        value={`${driver.yearsOfExperience} year${driver.yearsOfExperience !== 1 ? 's' : ''}`} accent="#f59e0b" />
        </div>

        {/* Status & Quick Access */}
        <section className="dash-modules">
          <h2 className="dash-section-title">Quick Access</h2>
          <div className="dash-modules-grid">

            <div className="module-card" onClick={() => toast('Trip assignment view — coming soon!', { icon: '🗺️' })}>
              <div className="module-card-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>🗺️</div>
              <h3 className="module-card-title">Current Dispatch</h3>
              <p className="module-card-desc">View your current assignment and route details.</p>
              <span className="module-card-arrow">→</span>
            </div>

            <div className="module-card" onClick={() => toast('Trip history — coming soon!', { icon: '📋' })}>
              <div className="module-card-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>📋</div>
              <h3 className="module-card-title">Trip History</h3>
              <p className="module-card-desc">Review your completed trips and earnings.</p>
              <span className="module-card-arrow">→</span>
            </div>

            <div className="module-card" onClick={() => toast('Documents — coming soon!', { icon: '📄' })}>
              <div className="module-card-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>📄</div>
              <h3 className="module-card-title">My Documents</h3>
              <p className="module-card-desc">License and certification status.</p>
              <span className="module-card-arrow">→</span>
            </div>

            {/* License photo if available */}
            {driver.licensePhotoUrl && (
              <div className="module-card" onClick={() => window.open(driver.licensePhotoUrl, '_blank')}>
                <div className="module-card-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>🖼️</div>
                <h3 className="module-card-title">License Photo</h3>
                <p className="module-card-desc">View your uploaded license document.</p>
                <span className="module-card-arrow">→</span>
              </div>
            )}
          </div>
        </section>

        {/* Status notice */}
        <div className="access-notice" style={{
          borderColor: `${sc.color}33`,
          background: sc.bg,
        }}>
          <span>{sc.icon}</span>
          <div>
            <p className="access-notice-title" style={{ color: sc.color }}>Current Status: {sc.label}</p>
            <p className="access-notice-text">
              {driver.status === 'AVAILABLE' && 'You are available for dispatch. Await assignment from your fleet manager.'}
              {driver.status === 'ON_TRIP'   && 'You are currently on an active trip. Contact dispatch for updates.'}
              {driver.status === 'INACTIVE'  && 'Your account is currently inactive. Contact fleet management.'}
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

export default DriverDashboardPage;
