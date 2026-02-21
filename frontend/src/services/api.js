import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── Auth (System Users) ───────────────────────────────────────────────────────
export const signupUser     = (data) => api.post('/auth/signup', data);
export const loginUser      = (data) => api.post('/auth/login', data);
export const logoutUser     = ()     => api.post('/auth/logout');
export const getCurrentUser = ()     => api.get('/auth/me');

// ── Admin — User Management ───────────────────────────────────────────────────
export const adminListUsers     = (params)   => api.get('/admin/users', { params });
export const adminCreateUser    = (data)     => api.post('/admin/users', data);
export const adminGetUser       = (id)       => api.get(`/admin/users/${id}`);
export const adminUpdateRole    = (id, role)     => api.patch(`/admin/users/${id}/role`, { role });
export const adminUpdateStatus  = (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive });
export const adminResetPassword = (id, password) => api.patch(`/admin/users/${id}/reset-password`, { password });

// ── Admin — Driver Management ─────────────────────────────────────────────────
export const adminListDrivers        = (params)       => api.get('/admin/drivers', { params });
export const adminGetDriver          = (id)           => api.get(`/admin/drivers/${id}`);
export const adminApproveDriver      = (id, isApproved) => api.patch(`/admin/drivers/${id}/approve`, { isApproved });
export const adminUpdateDriverStatus = (id, status)   => api.patch(`/admin/drivers/${id}/status`, { status });

// ── Driver Auth (separate from system users) ──────────────────────────────────
// Registration uses FormData because licensePhoto is optional file upload
export const registerDriver = (formData) =>
  api.post('/drivers/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const loginDriver    = (data) => api.post('/drivers/login', data);
export const logoutDriver   = ()     => api.post('/drivers/logout');
export const getDriverMe    = ()     => api.get('/drivers/me');

export default api;
