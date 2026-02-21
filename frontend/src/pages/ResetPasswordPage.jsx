import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPasswordRequest } from '../services/api';
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
  { key: 'length',  label: 'More than 8 characters',   test: (p) => p.length > 8 },
  { key: 'upper',   label: 'One uppercase letter',      test: (p) => /[A-Z]/.test(p) },
  { key: 'lower',   label: 'One lowercase letter',      test: (p) => /[a-z]/.test(p) },
  { key: 'special', label: 'One special character',     test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [globalError, setGlobalError]   = useState('');
  const [isSuccess, setIsSuccess]       = useState(false);
  const [showRules, setShowRules]       = useState(false);

  const strength = getPasswordStrength(form.password);

  // Redirect immediately if no token in URL
  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token.');
      navigate('/forgot-password', { replace: true });
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name])  setErrors((prev) => ({ ...prev, [name]: '' }));
    if (globalError)   setGlobalError('');
  };

  const validate = () => {
    const newErrors = {};
    const pwErrors = validatePassword(form.password);
    if (pwErrors.length > 0) newErrors.password = pwErrors[0];
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password.';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    return newErrors;
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
      const res = await resetPasswordRequest({
        token,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      if (res.data.success) {
        setIsSuccess(true);
        toast.success('Password reset successfully!');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Something went wrong. Please try again.';
      const field = err?.response?.data?.field;
      if (field && ['password', 'confirmPassword'].includes(field)) {
        setErrors((prev) => ({ ...prev, [field]: msg }));
      } else {
        setGlobalError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg,#10b981,#059669)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 24px',
            boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
          }}>
            ✓
          </div>
          <h1 className="auth-title">Password Reset!</h1>
          <p className="auth-subtitle" style={{ marginBottom: 32 }}>
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <Link to="/login" className="btn-primary" style={{ display: 'block', textDecoration: 'none', lineHeight: '1.5' }}>
            Go to Sign In →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🔐</div>
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Create a new strong password for your account</p>

        {globalError && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠</span>
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* New Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reset-password">New Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                onFocus={() => setShowRules(true)}
                autoComplete="new-password"
                autoFocus
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

            {/* Strength meter */}
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

            {/* Password rules */}
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
            <label className="form-label" htmlFor="reset-confirm">Confirm New Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔑</span>
              <input
                id="reset-confirm"
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Repeat your new password"
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

          <button
            id="reset-password-submit-btn"
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="btn-loader">
                <span className="spinner" />
                Resetting password…
              </span>
            ) : (
              'Reset Password →'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/forgot-password" className="auth-link">← Request a new link</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
