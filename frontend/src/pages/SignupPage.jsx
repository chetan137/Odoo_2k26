import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { signupUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { validatePassword, getPasswordStrength } from '../utils/validators';

const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const rules = [
  { key: 'length',  label: 'At least 8 characters',       test: (p) => p.length >= 8 },
  { key: 'upper',   label: 'One uppercase letter (A–Z)',   test: (p) => /[A-Z]/.test(p) },
  { key: 'lower',   label: 'One lowercase letter (a–z)',   test: (p) => /[a-z]/.test(p) },
  { key: 'number',  label: 'One number (0–9)',             test: (p) => /[0-9]/.test(p) },
];

const SignupPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [showRules, setShowRules] = useState(false);

  const strength = getPasswordStrength(form.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (globalError) setGlobalError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 3)
      errs.name = 'Full name must be at least 3 characters.';
    if (!form.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    const pwErrors = validatePassword(form.password);
    if (pwErrors.length > 0) errs.password = pwErrors[0];
    if (!form.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setGlobalError('');

    try {
      const res = await signupUser({
        name:            form.name.trim(),
        email:           form.email.trim(),
        password:        form.password,
        confirmPassword: form.confirmPassword,
      });

      if (res.data.success) {
        login(res.data.user);
        toast.success(`Account created! Welcome aboard, ${res.data.user.name} 🎉`);
        toast(`Your Employee ID: ${res.data.user.employeeId}`, { icon: '🪪', duration: 6000 });
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg   = err?.response?.data?.message || 'Something went wrong.';
      const field = err?.response?.data?.field;
      if (field && ['name', 'email', 'password', 'confirmPassword'].includes(field)) {
        setErrors((prev) => ({ ...prev, [field]: msg }));
      } else {
        setGlobalError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🚛</div>
        <h1 className="auth-title">Join Fleet Portal</h1>
        <p className="auth-subtitle">
          Create your account — registered users are assigned <strong style={{ color: 'var(--color-accent)' }}>Dispatcher</strong> role by default
        </p>

        {globalError && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠</span>
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">Full Name</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                id="signup-name"
                type="text"
                name="name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="John Doe (min 3 characters)"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                autoFocus
              />
            </div>
            {errors.name && <p className="field-error">⚠ {errors.name}</p>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">✉</span>
              <input
                id="signup-email"
                type="email"
                name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="field-error">⚠ {errors.email}</p>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                onFocus={() => setShowRules(true)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>

            {form.password && (
              <div className="password-strength">
                <div className="strength-bar-track">
                  <div
                    className="strength-bar-fill"
                    style={{ width: `${strength.percent}%`, backgroundColor: strength.color }}
                  />
                </div>
                <span className="strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}

            {showRules && (
              <div className="password-rules">
                {rules.map((rule) => {
                  const met = rule.test(form.password);
                  return (
                    <div key={rule.key} className={`password-rule ${met ? 'met' : ''}`}>
                      <span className="rule-icon">{met ? '✓' : '○'}</span>
                      {rule.label}
                    </div>
                  );
                })}
              </div>
            )}
            {errors.password && <p className="field-error">⚠ {errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-confirm">Re-enter Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔑</span>
              <input
                id="signup-confirm"
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {errors.confirmPassword && <p className="field-error">⚠ {errors.confirmPassword}</p>}
          </div>

          {/* Role info banner */}
          <div className="role-info-banner">
            <span>📡</span>
            <div>
              <p className="role-info-title">Dispatcher Role Assigned</p>
              <p className="role-info-text">Your account will be created with Dispatcher access. Managers are appointed by an Administrator.</p>
            </div>
          </div>

          <button
            id="signup-submit-btn"
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="btn-loader">
                <span className="spinner" />
                Creating account…
              </span>
            ) : (
              'Create Account →'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
