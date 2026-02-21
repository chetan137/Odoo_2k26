import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { forgotPasswordRequest } from '../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await forgotPasswordRequest(email.trim());
      if (res.data.success) {
        setIsSubmitted(true);
        toast.success('Reset link sent if that email is registered!');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🔑</div>
        <h1 className="auth-title">Forgot Password?</h1>
        <p className="auth-subtitle">
          Enter your email and we&apos;ll send you a secure link to reset your password.
        </p>

        {isSubmitted ? (
          <div style={{ textAlign: 'center' }}>
            <div className="alert alert-success" style={{ justifyContent: 'center' }}>
              <span className="alert-icon">✓</span>
              <span>
                If <strong>{email}</strong> is registered, a reset link has been sent.
                Check your inbox (and spam folder).
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px', lineHeight: '1.6' }}>
              The link expires in <strong style={{ color: 'var(--color-accent)' }}>
                {import.meta.env.VITE_RESET_EXPIRY_MINS || 15} minutes
              </strong>.
            </p>
            <button
              className="btn-primary"
              style={{ maxWidth: '240px', margin: '0 auto' }}
              onClick={() => { setIsSubmitted(false); setEmail(''); }}
            >
              Send another link
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠</span>
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">✉</span>
                  <input
                    id="forgot-email"
                    type="email"
                    className={`form-input ${error ? 'error' : ''}`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                {error && <p className="field-error">⚠ {error}</p>}
              </div>

              <button
                id="forgot-password-submit-btn"
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="btn-loader">
                    <span className="spinner" />
                    Sending link…
                  </span>
                ) : (
                  'Send Reset Link →'
                )}
              </button>
            </form>
          </>
        )}

        <div className="auth-footer">
          Remember your password?{' '}
          <Link to="/login" className="auth-link">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
