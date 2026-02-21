import api from '../../services/api';

// ── Trip CRUD ─────────────────────────────────────────────────────────────────
export const fetchTrips       = (params) => api.get('/trips', { params });
export const fetchResources   = ()       => api.get('/trips/resources');
export const createTrip       = (data)   => api.post('/trips', data);
export const updateTripStatus = (id, status) => api.patch(`/trips/${id}/status`, { status });
