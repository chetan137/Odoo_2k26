import api from '../../services/api';

// ── Vehicle CRUD ──────────────────────────────────────────────────────────────
export const fetchVehicles   = (params) => api.get('/vehicles', { params });
export const createVehicle   = (data)   => api.post('/vehicles', data);
export const updateVehicle   = (id, data) => api.patch(`/vehicles/${id}`, data);
export const retireVehicle   = (id)     => api.patch(`/vehicles/${id}/retire`);
