import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginUser, loginDriver } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ──────────────────────────────────────────────────────────────────────────────
// Role options — all in ONE login page
// ──────────────────────────────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  { value: '',           label: '— Select your role —',     icon: '' },
  { value: 'MANAGER',   label: 'Manager',                   icon: '🎯' },
  { value: 'DISPATCHER',label: 'Dispatcher',                icon: '📡' },
  { value: 'DRIVER',    label: 'Driver',                    icon: '🚗' },
  { value: 'ADMIN',     label: 'Admin (Restricted)',         icon: '👑' },
];

const ROLE_STYLES = {
  MANAGER:    { color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.3)' },
  DISPATCHER: { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)' },
  DRIVER:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)' },
  ADMIN:      { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.3)' },
};

const EyeIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
    ) : (
      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
    )}
  </svg>
);

const LoginPage = () => {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [form, setForm]           = useState({ email: '', password: '', role: '' });
  const [errors, setErrors]       = useState({});
  const [globalError, setGlobalError] = useState('');
  const [pendingMsg, setPendingMsg]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const rs = form.role ? ROLE_STYLES[form.role] : null;
  const isDriver = form.role === 'DRIVER';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    if (globalError) setGlobalError('');
    if (pendingMsg)  setPendingMsg('');
  };

  const validate = () => {
    const errs = {};
    if (!form.role)     errs.role     = 'Please select your role to continue.';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
      errs.email = 'A valid email address is required.';
    if (!form.password) errs.password = 'Password is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    setGlobalError('');
    setPendingMsg('');

    try {
      // ── DRIVER path — separate API, separate JWT ────────────────────────────
      if (isDriver) {
        const res = await loginDriver({ email: form.email, password: form.password });
        if (res.data.success) {
          // Driver session is in localStorage (cookie is set server-side too)
          localStorage.setItem('driverUser',  JSON.stringify(res.data.driver));
          localStorage.setItem('driverToken', res.data.token);
          toast.success(`Welcome back, ${res.data.driver.name}! 🚗`);
          navigate('/driver/dashboard', { replace: true });
        }
      } else {
        // ── System user path (MANAGER / DISPATCHER / ADMIN) ──────────────────
        const res = await loginUser({ email: form.email, password: form.password, role: form.role });
        if (res.data.success) {
          login(res.data.user);
          toast.success(`Welcome, ${res.data.user.name}!`);
          const role = res.data.user.role;
          if (role === 'ADMIN')           navigate('/admin',                 { replace: true });
          else if (role === 'MANAGER')    navigate('/manager/dashboard',     { replace: true });
          else if (role === 'DISPATCHER') navigate('/dispatcher/dashboard',  { replace: true });
          else                            navigate('/dashboard',             { replace: true });
        }
      }
    } catch (err) {
      const msg  = err?.response?.data?.message || 'Login failed. Please try again.';
      const code = err?.response?.data?.code;
      const field= err?.response?.data?.field;

      if (code === 'DRIVER_PENDING_APPROVAL') {
        setPendingMsg(msg);
      } else if (field === 'email')    setErrors({ email: msg });
      else if (field === 'password')   setErrors({ password: msg });
      else if (field === 'role' || code === 'ROLE_MISMATCH') setErrors({ role: msg });
      else if (code === 'ACCOUNT_INACTIVE' || code === 'DRIVER_INACTIVE') setGlobalError(msg);
      else setGlobalError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🚛</div>
        <h1 className="auth-title">FleetOS Login</h1>
        <p className="auth-subtitle">Select your role and sign in with your credentials.</p>

        {/* Pending approval (driver only) */}
        {pendingMsg && (
          <div className="alert alert-warning">
            <span>⏳</span>
            <div>
              <p style={{ fontWeight: 700, marginBottom: 4, color: '#fcd34d' }}>Application Pending</p>
              <p>{pendingMsg}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {globalError && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠</span>
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* ── Role Select ───────────────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-role">Login As *</label>
            <div className="input-wrapper">
              <span className="input-icon">🔐</span>
              <select
                id="login-role" name="role"
                className={`form-input form-select ${errors.role ? 'error' : ''}`}
                value={form.role} onChange={handleChange}
                style={rs ? { borderColor: rs.border, color: rs.color } : {}}
              >
                {ROLE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.icon ? `${o.icon} ${o.label}` : o.label}</option>
                ))}
              </select>
            </div>

            {/* Role badge */}
            {form.role && rs && (
              <div className="role-badge" style={{ color: rs.color, background: rs.bg, border: `1px solid ${rs.border}` }}>
                {ROLE_OPTIONS.find(o => o.value === form.role)?.icon}
                &nbsp;{form.role === 'DRIVER' ? 'Driver Portal — separate login system' : `${form.role} — System Access`}
                {form.role === 'ADMIN' && <span style={{ marginLeft: 8, opacity: 0.7, fontSize: 10 }}>⚠ Restricted</span>}
              </div>
            )}
            {errors.role && <p className="field-error">⚠ {errors.role}</p>}
          </div>

          {/* ── Email ─────────────────────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">✉</span>
              <input id="login-email" type="email" name="email" autoComplete="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="you@company.com" value={form.email} onChange={handleChange} />
            </div>
            {errors.email && <p className="field-error">⚠ {errors.email}</p>}
          </div>

          {/* ── Password ──────────────────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input id="login-password" type={showPw ? 'text' : 'password'} name="password"
                autoComplete="current-password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Your password" value={form.password} onChange={handleChange} />
              <button type="button" className="password-toggle" onClick={() => setShowPw(v => !v)}>
                <EyeIcon open={showPw} />
              </button>
            </div>
            {errors.password && <p className="field-error">⚠ {errors.password}</p>}
          </div>

          {/* Driver-specific help text */}
          {isDriver && (
            <div className="driver-login-note">
              <div className="driver-login-note-item"><span className="status-dot available"/><span>Approved drivers can log in</span></div>
              <div className="driver-login-note-item"><span className="status-dot pending"/><span>Pending approval — contact admin</span></div>
            </div>
          )}

          <button id="login-submit-btn" type="submit" className="btn-primary"
            style={rs ? { background: `linear-gradient(135deg, ${rs.color}, ${rs.color}cc)`, boxShadow: `0 4px 14px ${rs.color}44` } : {}}
            disabled={isLoading}>
            {isLoading ? (
              <span className="btn-loader"><span className="spinner"/> Signing in…</span>
            ) : (
              `Sign In${form.role ? ` as ${form.role.charAt(0)+form.role.slice(1).toLowerCase()}` : ''} →`
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="auth-footer" style={{ flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
          <div>
            New driver?{' '}
            <Link to="/driver/register" className="auth-link" style={{ color: '#f59e0b' }}>Register as Driver</Link>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            New staff account?{' '}
            <Link to="/signup" className="auth-link" style={{ color: 'var(--text-muted)' }}>Request Dispatcher access</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
