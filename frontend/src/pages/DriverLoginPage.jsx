import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginDriver } from '../services/api';

const EyeIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
    ) : (
      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
    )}
  </svg>
);

const DriverLoginPage = () => {
  const navigate = useNavigate();
  const [form,       setForm]       = useState({ email: '', password: '' });
  const [errors,     setErrors]     = useState({});
  const [globalError, setGlobalError] = useState('');
  const [pendingMsg, setPendingMsg]  = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    if (globalError) setGlobalError('');
    if (pendingMsg)  setPendingMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email is required.';
    if (!form.password) errs.password = 'Password is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    try {
      const res = await loginDriver({ email: form.email, password: form.password });
      if (res.data.success) {
        // Store driver data in localStorage (separate from system user session)
        localStorage.setItem('driverUser', JSON.stringify(res.data.driver));
        localStorage.setItem('driverToken', res.data.token);
        toast.success(`Welcome, ${res.data.driver.name}! 🚛`);
        navigate('/driver/dashboard', { replace: true });
      }
    } catch (err) {
      const msg  = err?.response?.data?.message || 'Login failed. Please try again.';
      const code = err?.response?.data?.code;
      const field= err?.response?.data?.field;

      if (code === 'DRIVER_PENDING_APPROVAL') {
        setPendingMsg(msg);
      } else if (code === 'DRIVER_INACTIVE') {
        setGlobalError(msg);
      } else if (field === 'email')    setErrors({ email: msg });
      else if (field === 'password')   setErrors({ password: msg });
      else setGlobalError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ background: 'radial-gradient(ellipse at 60% 0%, rgba(16,185,129,0.12), transparent 60%), var(--bg-primary)' }}>
      <div className="auth-card">
        <Link to="/" className="back-link" style={{ display: 'block', marginBottom: '16px' }}>← Back to Home</Link>

        <div className="auth-logo" style={{ fontSize: '44px' }}>🚗</div>
        <h1 className="auth-title">Driver Portal</h1>
        <p className="auth-subtitle">Sign in to your driver account to view dispatches and trip history.</p>

        {/* Pending approval notice */}
        {pendingMsg && (
          <div className="alert alert-warning">
            <span>⏳</span>
            <div>
              <p style={{ fontWeight: 700, marginBottom: '4px', color: '#fcd34d' }}>Application Pending</p>
              <p>{pendingMsg}</p>
            </div>
          </div>
        )}

        {/* Inactive / other errors */}
        {globalError && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠</span>
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="drv-login-email">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">✉</span>
              <input id="drv-login-email" type="email" name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="your@email.com" value={form.email} onChange={handleChange} autoFocus />
            </div>
            {errors.email && <p className="field-error">⚠ {errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="drv-login-pw">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input id="drv-login-pw" type={showPw ? 'text' : 'password'} name="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Your password" value={form.password} onChange={handleChange} />
              <button type="button" className="password-toggle" onClick={() => setShowPw(v => !v)}>
                <EyeIcon open={showPw} />
              </button>
            </div>
            {errors.password && <p className="field-error">⚠ {errors.password}</p>}
          </div>

          {/* Driver status legend */}
          <div className="driver-login-note">
            <div className="driver-login-note-item">
              <span className="status-dot available" />
              <span>Active & Approved — can log in</span>
            </div>
            <div className="driver-login-note-item">
              <span className="status-dot pending" />
              <span>Pending — awaiting admin approval</span>
            </div>
            <div className="driver-login-note-item">
              <span className="status-dot inactive-dot" />
              <span>Inactive — contact fleet management</span>
            </div>
          </div>

          <button id="drv-login-btn" type="submit" className="btn-primary"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}
            disabled={isLoading}>
            {isLoading ? (
              <span className="btn-loader"><span className="spinner" /> Signing in…</span>
            ) : (
              'Driver Sign In →'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Not registered? <Link to="/driver/register" className="auth-link" style={{ color: '#10b981' }}>Apply as Driver</Link>
          &nbsp;•&nbsp;
          <Link to="/login" className="auth-link" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Staff Login</Link>
        </div>
      </div>
    </div>
  );
};

export default DriverLoginPage;
