import axios from 'axios';

// ── Backend URL ──
// ถ้ารันบน GitHub Pages จะใช้ VITE_API_URL (Railway backend)
// ถ้ารัน dev จะ proxy ผ่าน /api
const BACKEND_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';
const isGitHubPages = window.location.hostname.includes('github.io');
const hasBackend = !!import.meta.env.VITE_API_URL || !isGitHubPages;

// ── Demo Data (fallback) ──
const DEMO_SEGMENTS = [
  { id: 'seg_1', name: 'ลูกค้า VIP', color: '#F59E0B', icon: '⭐', count: 342 },
  { id: 'seg_2', name: 'ลูกค้าใหม่', color: '#10B981', icon: '🆕', count: 1205 },
  { id: 'seg_3', name: 'สนใจโปรโมชั่น', color: '#8B5CF6', icon: '🎯', count: 876 },
  { id: 'seg_4', name: 'ไม่ตอบ 30 วัน', color: '#EF4444', icon: '😴', count: 523 },
  { id: 'seg_5', name: 'ซื้อซ้ำ', color: '#3B82F6', icon: '🔄', count: 189 },
];
const DEMO_BROADCASTS = [
  { id: 'bc_1', title: 'โปรโมชั่นปีใหม่ 2026', createdAt: '2026-01-01T09:00:00', targetSegmentNames: ['ทั้งหมด'], status: 'completed', stats: { total: 2946, sent: 2946, delivered: 2891, read: 2104, clicked: 876, failed: 0 } },
  { id: 'bc_2', title: 'แจ้งเปิดสาขาใหม่', createdAt: '2025-12-28T14:00:00', targetSegmentNames: ['ลูกค้า VIP'], status: 'completed', stats: { total: 342, sent: 342, delivered: 340, read: 298, clicked: 145, failed: 2 } },
  { id: 'bc_3', title: 'Flash Sale Weekend', createdAt: '2026-03-28T10:00:00', targetSegmentNames: ['สนใจโปรโมชั่น'], status: 'scheduled', stats: { total: 876, sent: 0, delivered: 0, read: 0, clicked: 0, failed: 0 } },
];

let demoState = { segments: [...DEMO_SEGMENTS], broadcasts: [...DEMO_BROADCASTS], pageConfig: { connected: true, pageName: 'Demo Page' } };

const demoAPI = {
  page: {
    getConfig: () => Promise.resolve({ data: { success: true, data: demoState.pageConfig } }),
    connect: (d) => { demoState.pageConfig = { ...demoState.pageConfig, ...d, connected: true }; return Promise.resolve({ data: { success: true, data: demoState.pageConfig, message: 'Demo Mode' } }); },
    disconnect: () => { demoState.pageConfig.connected = false; return Promise.resolve({ data: { success: true } }); },
    test: () => Promise.resolve({ data: { success: true } }),
  },
  broadcast: {
    getAll: () => Promise.resolve({ data: { success: true, data: demoState.broadcasts } }),
    getById: (id) => Promise.resolve({ data: { success: true, data: demoState.broadcasts.find(b => b.id === id) } }),
    getStats: () => {
      const done = demoState.broadcasts.filter(b => b.status === 'completed');
      const tDel = done.reduce((a, b) => a + b.stats.delivered, 0);
      const tRead = done.reduce((a, b) => a + b.stats.read, 0);
      return Promise.resolve({ data: { success: true, data: { totalSubscribers: 2946, totalBroadcasts: demoState.broadcasts.length,
        totalSent: done.reduce((a, b) => a + b.stats.sent, 0), totalDelivered: tDel, totalRead: tRead,
        totalClicked: done.reduce((a, b) => a + b.stats.clicked, 0),
        scheduledCount: demoState.broadcasts.filter(b => b.status === 'scheduled').length,
        avgReadRate: tDel > 0 ? ((tRead / tDel) * 100).toFixed(1) : 0 }}});
    },
    create: (d) => {
      const isNow = d.scheduleMode !== 'later';
      const total = d.targetSegment === 'all' ? 2946 : demoState.segments.filter(s => (d.targetSegment || []).includes(s.id)).reduce((a, s) => a + s.count, 0);
      const bc = { id: `bc_${Date.now()}`, title: d.title, createdAt: new Date().toISOString(), targetSegmentNames: d.targetSegmentNames || ['ทั้งหมด'],
        status: isNow ? 'completed' : 'scheduled', stats: { total, sent: isNow ? total : 0, delivered: isNow ? Math.floor(total * 0.98) : 0,
        read: isNow ? Math.floor(total * 0.72) : 0, clicked: isNow ? Math.floor(total * 0.35) : 0, failed: 0 } };
      demoState.broadcasts = [bc, ...demoState.broadcasts];
      return Promise.resolve({ data: { success: true, data: bc, message: isNow ? `✅ ส่งถึง ${total} คน (Demo)` : '⏰ ตั้งเวลาเรียบร้อย (Demo)' } });
    },
    delete: (id) => { demoState.broadcasts = demoState.broadcasts.filter(b => b.id !== id); return Promise.resolve({ data: { success: true } }); },
    cancel: (id) => { const bc = demoState.broadcasts.find(b => b.id === id); if (bc) bc.status = 'draft'; return Promise.resolve({ data: { success: true } }); },
  },
  segment: {
    getAll: () => Promise.resolve({ data: { success: true, data: demoState.segments } }),
    create: (d) => { const s = { id: `seg_${Date.now()}`, name: d.name, color: d.color || '#6366F1', icon: d.icon || '📌', count: 0 }; demoState.segments.push(s); return Promise.resolve({ data: { success: true, data: s } }); },
    update: (id, d) => { const s = demoState.segments.find(x => x.id === id); if (s) Object.assign(s, d); return Promise.resolve({ data: { success: true, data: s } }); },
    delete: (id) => { demoState.segments = demoState.segments.filter(s => s.id !== id); return Promise.resolve({ data: { success: true } }); },
  },
  subscriber: {
    getAll: () => Promise.resolve({ data: { success: true, data: [], total: 0 } }),
    sync: () => Promise.resolve({ data: { success: true, message: 'Demo: ต้องเชื่อมต่อ Backend' } }),
    delete: () => Promise.resolve({ data: { success: true } }),
  },
};

// ── Real API ──
const api = axios.create({ baseURL: API_BASE, timeout: 30000, headers: { 'Content-Type': 'application/json' } });
const realAPI = {
  page: { getConfig: () => api.get('/page'), connect: (d) => api.post('/page/connect', d), disconnect: () => api.post('/page/disconnect'), test: (d) => api.post('/page/test', d) },
  broadcast: { getAll: () => api.get('/broadcast'), getById: (id) => api.get(`/broadcast/${id}`), getStats: () => api.get('/broadcast/stats'), create: (d) => api.post('/broadcast', d), delete: (id) => api.delete(`/broadcast/${id}`), cancel: (id) => api.post(`/broadcast/${id}/cancel`) },
  segment: { getAll: () => api.get('/segments'), create: (d) => api.post('/segments', d), update: (id, d) => api.put(`/segments/${id}`, d), delete: (id) => api.delete(`/segments/${id}`) },
  subscriber: { getAll: () => api.get('/subscribers'), sync: () => api.post('/subscribers/sync'), delete: (id) => api.delete(`/subscribers/${id}`) },
};

// ── Auto-detect: try real backend, fallback to demo ──
let _isDemoMode = !hasBackend;

export async function detectMode() {
  if (!hasBackend) return true;
  try {
    await api.get('/health', { timeout: 5000 });
    _isDemoMode = false;
  } catch {
    _isDemoMode = true;
  }
  return _isDemoMode;
}

export const isDemoMode = () => _isDemoMode;
export const pageAPI = new Proxy({}, { get: (_, prop) => (...args) => (_isDemoMode ? demoAPI : realAPI).page[prop](...args) });
export const broadcastAPI = new Proxy({}, { get: (_, prop) => (...args) => (_isDemoMode ? demoAPI : realAPI).broadcast[prop](...args) });
export const segmentAPI = new Proxy({}, { get: (_, prop) => (...args) => (_isDemoMode ? demoAPI : realAPI).segment[prop](...args) });
export const subscriberAPI = new Proxy({}, { get: (_, prop) => (...args) => (_isDemoMode ? demoAPI : realAPI).subscriber[prop](...args) });
export const healthCheck = () => _isDemoMode ? Promise.resolve({ data: { status: 'demo' } }) : api.get('/health');
export default api;
