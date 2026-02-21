import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { registerDriver } from '../services/api';

const VEHICLE_CATEGORIES = [
  { value: 'LIGHT',       label: '🚗 Light Vehicle (Car, Van)' },
  { value: 'MEDIUM',      label: '🚐 Medium Vehicle (Minibus, Pickup)' },
  { value: 'HEAVY',       label: '🚛 Heavy Vehicle (Truck, Bus)' },
  { value: 'EXTRA_HEAVY', label: '🏗️ Extra Heavy (Articulated, Special)' },
];

const EyeIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
    ) : (
      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
    )}
  </svg>
);

const today = new Date();
today.setHours(0, 0, 0, 0);
const minDate = new Date(today);
minDate.setDate(minDate.getDate() + 1);
const minDateStr = minDate.toISOString().split('T')[0];

const DriverRegisterPage = () => {
  const navigate   = useNavigate();
  const fileRef    = useRef(null);

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phoneNumber: '', licenseNumber: '', licenseExpiryDate: '',
    vehicleCategory: '', yearsOfExperience: '0',
  });
  const [selectedFile, setSelectedFile]   = useState(null);
  const [filePreview, setFilePreview]     = useState(null);
  const [errors,    setErrors]            = useState({});
  const [globalError, setGlobalError]     = useState('');
  const [showPw, setShowPw]               = useState(false);
  const [showCPw, setShowCPw]             = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const [success, setSuccess]             = useState(null);  // { driverId, name }

  const setFieldError = (field, msg) => setErrors(p => ({ ...p, [field]: msg }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    if (globalError) setGlobalError('');
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setFieldError('licensePhoto', 'Only JPG, PNG, or PDF allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFieldError('licensePhoto', 'File must be under 5MB.');
      return;
    }
    setSelectedFile(file);
    setErrors(p => ({ ...p, licensePhoto: '' }));
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview('pdf');
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 3) errs.name = 'Full name must be at least 3 characters.';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email address required.';
    if (!form.password || form.password.length < 8) errs.password = 'Password min 8 characters.';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Password needs at least one uppercase letter.';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Password needs at least one number.';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (!form.phoneNumber || !/^\d{10,15}$/.test(form.phoneNumber.replace(/[\s\-\+]/g, '')))
      errs.phoneNumber = 'Phone must be 10–15 digits.';
    if (!form.licenseNumber || form.licenseNumber.trim().length < 5)
      errs.licenseNumber = 'License number must be at least 5 characters.';
    if (!form.licenseExpiryDate) errs.licenseExpiryDate = 'License expiry date is required.';
    else if (new Date(form.licenseExpiryDate) <= today) errs.licenseExpiryDate = 'Expiry date must be in the future.';
    if (!form.vehicleCategory) errs.vehicleCategory = 'Please select a vehicle category.';
    const exp = parseInt(form.yearsOfExperience, 10);
    if (isNaN(exp) || exp < 0) errs.yearsOfExperience = 'Experience must be 0 or more.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    setGlobalError('');

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (selectedFile) fd.append('licensePhoto', selectedFile);

    try {
      const res = await registerDriver(fd);
      if (res.data.success) {
        setSuccess({ driverId: res.data.driver.driverId, name: res.data.driver.name });
        toast.success(`Registered! Your Driver ID: ${res.data.driver.driverId}`, { duration: 8000 });
      }
    } catch (err) {
      const msg   = err?.response?.data?.message || 'Registration failed. Please try again.';
      const field = err?.response?.data?.field;
      if (field) setFieldError(field, msg);
      else        setGlobalError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card success-card">
          <div className="success-icon">✅</div>
          <h1 className="auth-title">Registration Submitted!</h1>
          <p className="auth-subtitle">Your application is pending admin approval. You'll be notified once approved.</p>
          <div className="success-id-box">
            <span className="success-id-label">Your Driver ID</span>
            <span className="success-id-value">{success.driverId}</span>
          </div>
          <p className="success-note">Save your Driver ID — you'll need it to reference your account.</p>
          <button className="btn-primary" onClick={() => navigate('/driver/login')} style={{ marginTop: '16px' }}>
            Go to Driver Login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-register-page">
      <div className="driver-register-card">
        {/* Header */}
        <div className="driver-register-header">
          <Link to="/" className="back-link">← Home</Link>
          <div className="driver-register-logo">🚗</div>
          <h1 className="driver-register-title">Driver Registration</h1>
          <p className="driver-register-subtitle">
            Join the fleet! Fill in your details and submit for admin approval.
          </p>
        </div>

        {globalError && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠</span>
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate encType="multipart/form-data">

          {/* ── Section: Basic Info ──────────────────────────────────────────── */}
          <p className="form-section-label">👤 Basic Information</p>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="drv-name">Full Name *</label>
              <input id="drv-name" name="name" className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="John Driver" value={form.name} onChange={handleChange} autoFocus />
              {errors.name && <p className="field-error">⚠ {errors.name}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="drv-email">Email *</label>
              <input id="drv-email" name="email" type="email" className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="driver@email.com" value={form.email} onChange={handleChange} />
              {errors.email && <p className="field-error">⚠ {errors.email}</p>}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="drv-pw">Password *</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input id="drv-pw" name="password" type={showPw ? 'text' : 'password'}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Min 8, 1 uppercase, 1 number" value={form.password} onChange={handleChange} />
                <button type="button" className="password-toggle" onClick={() => setShowPw(v => !v)}>
                  <EyeIcon open={showPw} />
                </button>
              </div>
              {errors.password && <p className="field-error">⚠ {errors.password}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="drv-cpw">Confirm Password *</label>
              <div className="input-wrapper">
                <span className="input-icon">🔑</span>
                <input id="drv-cpw" name="confirmPassword" type={showCPw ? 'text' : 'password'}
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} />
                <button type="button" className="password-toggle" onClick={() => setShowCPw(v => !v)}>
                  <EyeIcon open={showCPw} />
                </button>
              </div>
              {errors.confirmPassword && <p className="field-error">⚠ {errors.confirmPassword}</p>}
            </div>
          </div>

          {/* ── Section: Contact ─────────────────────────────────────────────── */}
          <p className="form-section-label">📞 Contact & License</p>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="drv-phone">Phone Number *</label>
              <input id="drv-phone" name="phoneNumber" className={`form-input ${errors.phoneNumber ? 'error' : ''}`}
                placeholder="9876543210 (10–15 digits)" value={form.phoneNumber} onChange={handleChange} />
              {errors.phoneNumber && <p className="field-error">⚠ {errors.phoneNumber}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="drv-lic">License Number *</label>
              <input id="drv-lic" name="licenseNumber" className={`form-input ${errors.licenseNumber ? 'error' : ''}`}
                placeholder="DL1234567890" value={form.licenseNumber} onChange={handleChange} />
              {errors.licenseNumber && <p className="field-error">⚠ {errors.licenseNumber}</p>}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="drv-exp-date">License Expiry Date *</label>
              <input id="drv-exp-date" name="licenseExpiryDate" type="date"
                className={`form-input ${errors.licenseExpiryDate ? 'error' : ''}`}
                min={minDateStr} value={form.licenseExpiryDate} onChange={handleChange} />
              {errors.licenseExpiryDate && <p className="field-error">⚠ {errors.licenseExpiryDate}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="drv-exp-years">Years of Experience *</label>
              <input id="drv-exp-years" name="yearsOfExperience" type="number" min="0" max="50"
                className={`form-input ${errors.yearsOfExperience ? 'error' : ''}`}
                value={form.yearsOfExperience} onChange={handleChange} />
              {errors.yearsOfExperience && <p className="field-error">⚠ {errors.yearsOfExperience}</p>}
            </div>
          </div>

          {/* ── Vehicle Category ─────────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label" htmlFor="drv-cat">Vehicle Category *</label>
            <select id="drv-cat" name="vehicleCategory"
              className={`form-input form-select ${errors.vehicleCategory ? 'error' : ''}`}
              value={form.vehicleCategory} onChange={handleChange}>
              <option value="">— Select vehicle type —</option>
              {VEHICLE_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.vehicleCategory && <p className="field-error">⚠ {errors.vehicleCategory}</p>}
          </div>

          {/* ── License Photo Upload ─────────────────────────────────────────── */}
          <p className="form-section-label">📎 License Document (Optional)</p>

          <div className={`file-upload-zone ${selectedFile ? 'has-file' : ''} ${errors.licensePhoto ? 'error' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile({ target: { files: [f] } }); }}>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }} onChange={handleFile} />
            {filePreview ? (
              <div className="file-preview">
                {filePreview === 'pdf' ? (
                  <div className="file-preview-pdf">📄 {selectedFile?.name}</div>
                ) : (
                  <img src={filePreview} alt="License preview" className="file-preview-img" />
                )}
                <p className="file-replace">Click to replace</p>
              </div>
            ) : (
              <div className="file-upload-placeholder">
                <span className="file-upload-icon">📤</span>
                <p className="file-upload-text">Drag & drop or <strong>click to choose</strong></p>
                <p className="file-upload-hint">JPG, PNG, PDF — max 5MB</p>
              </div>
            )}
          </div>
          {errors.licensePhoto && <p className="field-error">⚠ {errors.licensePhoto}</p>}

          {/* ── Approval notice ──────────────────────────────────────────────── */}
          <div className="role-info-banner" style={{ borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.06)' }}>
            <span>⏳</span>
            <div>
              <p className="role-info-title" style={{ color: '#fcd34d' }}>Pending Approval</p>
              <p className="role-info-text">After registering, your account will be reviewed by an Administrator before you can log in.</p>
            </div>
          </div>

          <button id="drv-register-btn" type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? (
              <span className="btn-loader"><span className="spinner"/> Submitting…</span>
            ) : (
              'Submit Registration →'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already registered? <Link to="/driver/login" className="auth-link">Driver Login</Link>
          &nbsp;|&nbsp;
          <Link to="/login" className="auth-link" style={{ color: 'var(--text-muted)' }}>Staff Login</Link>
        </div>
      </div>
    </div>
  );
};

export default DriverRegisterPage;
