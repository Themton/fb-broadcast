import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Page ──
export const pageAPI = {
  getConfig: () => api.get('/page'),
  connect: (data) => api.post('/page/connect', data),
  disconnect: () => api.post('/page/disconnect'),
  test: (data) => api.post('/page/test', data),
};

// ── Broadcast ──
export const broadcastAPI = {
  getAll: () => api.get('/broadcast'),
  getById: (id) => api.get(`/broadcast/${id}`),
  getStats: () => api.get('/broadcast/stats'),
  create: (data) => api.post('/broadcast', data),
  delete: (id) => api.delete(`/broadcast/${id}`),
  cancel: (id) => api.post(`/broadcast/${id}/cancel`),
};

// ── Segments ──
export const segmentAPI = {
  getAll: () => api.get('/segments'),
  create: (data) => api.post('/segments', data),
  update: (id, data) => api.put(`/segments/${id}`, data),
  delete: (id) => api.delete(`/segments/${id}`),
  addSubscriber: (id, subscriberId) => api.post(`/segments/${id}/add-subscriber`, { subscriberId }),
  removeSubscriber: (id, subscriberId) => api.post(`/segments/${id}/remove-subscriber`, { subscriberId }),
};

// ── Subscribers ──
export const subscriberAPI = {
  getAll: () => api.get('/subscribers'),
  sync: () => api.post('/subscribers/sync'),
  delete: (id) => api.delete(`/subscribers/${id}`),
};

// ── Health ──
export const healthCheck = () => api.get('/health');

export default api;
