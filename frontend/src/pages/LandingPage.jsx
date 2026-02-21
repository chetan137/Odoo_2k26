import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // If already logged in as system user, go to dashboard
  if (isAuthenticated && user) {
    navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
    return null;
  }

  return (
    <div className="landing-page">
      {/* Background blobs */}
      <div className="landing-blob landing-blob-1" />
      <div className="landing-blob landing-blob-2" />

      {/* Hero */}
      <div className="landing-hero">
        <div className="landing-badge">🚛 Fleet Management System</div>
        <h1 className="landing-title">
          Drive the Future<br />
          <span className="landing-title-accent">of Fleet Operations</span>
        </h1>
        <p className="landing-subtitle">
          A unified platform for fleet managers, dispatchers, and professional drivers.
          Choose your access level below to get started.
        </p>
      </div>

      {/* Cards */}
      <div className="landing-cards">

        {/* Driver Registration */}
        <div className="landing-card driver-card" onClick={() => navigate('/driver/register')}>
          <div className="landing-card-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
            🚗
          </div>
          <div className="landing-card-content">
            <h2 className="landing-card-title">Register as Driver</h2>
            <p className="landing-card-desc">
              Join our driver network. Submit your license, vehicle category, and credentials. Pending admin approval.
            </p>
            <ul className="landing-card-perks">
              <li>✓ Auto-generated Driver ID (DRV-XXXX)</li>
              <li>✓ License photo upload supported</li>
              <li>✓ Post-approval login access</li>
            </ul>
          </div>
          <div className="landing-card-cta" style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.4)' }}>
            Register Now →
          </div>
        </div>

        {/* Driver Login */}
        <div className="landing-card driver-card" onClick={() => navigate('/driver/login')}>
          <div className="landing-card-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
            🔑
          </div>
          <div className="landing-card-content">
            <h2 className="landing-card-title">Driver Login</h2>
            <p className="landing-card-desc">
              Already registered and approved? Log into your driver portal to view your assignments and trip details.
            </p>
            <ul className="landing-card-perks">
              <li>✓ Real-time dispatch updates</li>
              <li>✓ Trip history &amp; status</li>
              <li>✓ Profile management</li>
            </ul>
          </div>
          <div className="landing-card-cta" style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.4)' }}>
            Driver Sign In →
          </div>
        </div>

        {/* Staff / Secret Login */}
        <div className="landing-card staff-card" onClick={() => navigate('/login')}>
          <div className="landing-card-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
            🛡️
          </div>
          <div className="landing-card-content">
            <h2 className="landing-card-title">Staff Login</h2>
            <p className="landing-card-desc">
              For authorized fleet personnel only — Administrators, Managers, and Dispatchers. Company credentials required.
            </p>
            <ul className="landing-card-perks">
              <li>✓ Role-based access control</li>
              <li>✓ Fleet &amp; driver management</li>
              <li>✓ Dispatch operations</li>
            </ul>
          </div>
          <div className="landing-card-cta" style={{ color: '#818cf8', borderColor: 'rgba(99,102,241,0.4)' }}>
            Staff Sign In →
          </div>
        </div>
      </div>

      <p className="landing-footer-note">
        New staff accounts are created by your administrator. &nbsp;•&nbsp; Drivers must register first and await approval.
      </p>
    </div>
  );
};

export default LandingPage;
