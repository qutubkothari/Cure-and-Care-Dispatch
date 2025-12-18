import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const register = (data: any) =>
  api.post('/auth/register', data);

export const getCurrentUser = () =>
  api.get('/auth/me');

// Deliveries
export const getDeliveries = (filters?: any) =>
  api.get('/deliveries', { params: filters });

export const getDelivery = (id: string) =>
  api.get(`/deliveries/${id}`);

export const createDelivery = (data: any) =>
  api.post('/deliveries', data);

export const bulkCreateDeliveries = (deliveries: any[]) =>
  api.post('/deliveries/bulk', { deliveries });

export const updateDeliveryStatus = (id: string, data: any) =>
  api.put(`/deliveries/${id}/status`, data);

export const assignDelivery = (id: string, driverId: string) =>
  api.put(`/deliveries/${id}/assign`, { driverId });

export const deleteDelivery = (id: string) =>
  api.delete(`/deliveries/${id}`);

// Petty Cash
export const getPettyCash = (filters?: any) =>
  api.get('/petty-cash', { params: filters });

export const createPettyCash = (data: any) =>
  api.post('/petty-cash', data);

export const updatePettyCashStatus = (id: string, status: string, notes?: string) =>
  api.put(`/petty-cash/${id}/status`, { status, notes });

export const getPettyCashStats = () =>
  api.get('/petty-cash/stats');

// Tracking
export const updateLocation = (data: any) =>
  api.post('/tracking/location', data);

export const getDriverLocation = (driverId: string, params?: any) =>
  api.get(`/tracking/location/${driverId}`, { params });

export const getLiveLocations = () =>
  api.get('/tracking/locations/live');

export const getDeliveryTracking = (deliveryId: string) =>
  api.get(`/tracking/delivery/${deliveryId}`);

// Upload
export const uploadImage = (file: File, type: string) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('type', type);
  
  return api.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const uploadImages = (files: File[], type: string) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });
  formData.append('type', type);
  
  return api.post('/upload/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// Audit
export const getAuditLogs = (params?: any) =>
  api.get('/audit', { params });

export const getAuditLog = (id: string) =>
  api.get(`/audit/${id}`);

export const getEntityAuditLogs = (entity: string, entityId: string) =>
  api.get(`/audit/entity/${entity}/${entityId}`);

export const getAuditStats = (params?: any) =>
  api.get('/audit/stats/summary', { params });

// Reports
export const getReportData = (params?: any) =>
  api.get('/reports/data', { params });

// Users
export const getUsers = () =>
  api.get('/users');

export const createUser = (data: any) =>
  api.post('/users', data);

export const updateUser = (id: string, data: any) =>
  api.put(`/users/${id}`, data);

export const toggleUserStatus = (id: string, isActive: boolean) =>
  api.put(`/users/${id}/status`, { isActive });

export const resetUserPassword = (id: string, newPassword: string) =>
  api.put(`/users/${id}/reset-password`, { newPassword });

export default api;
